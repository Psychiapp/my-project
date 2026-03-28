/**
 * Transfer to Supporter Edge Function
 *
 * Transfers the supporter's portion (75%) from platform account to their connected account.
 * Called when:
 * 1. Session is marked as "completed"
 * 2. No-refund cancellation occurs (<2 hours before session)
 * 3. Partial-refund cancellation (supporter gets 75% of RETAINED amount)
 *
 * If transfer fails (e.g., deactivated account), logs error and flags for admin review.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { getStripe } from '../_shared/stripe.ts';

const stripe = getStripe();

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform takes 25%, supporter gets 75%
const SUPPORTER_PERCENTAGE = 0.75;

interface TransferRequest {
  sessionId: string;
  paymentIntentId: string;
  // Optional: override amount for partial refund scenarios
  // If not provided, calculates 75% of full payment amount
  transferAmount?: number;
  reason: 'session_completed' | 'no_refund_cancellation' | 'partial_refund_retained';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { sessionId, paymentIntentId, transferAmount, reason }: TransferRequest = await req.json();

    // Validate required fields
    if (!sessionId || !paymentIntentId) {
      return new Response(
        JSON.stringify({ error: 'sessionId and paymentIntentId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the PaymentIntent to find supporter info
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const supporterStripeAccountId = paymentIntent.metadata?.supporter_stripe_account_id;
    const supporterId = paymentIntent.metadata?.supporter_id;

    if (!supporterStripeAccountId) {
      console.log(`No supporter_stripe_account_id in PaymentIntent ${paymentIntentId} - skipping transfer`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'No connected account for supporter',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate transfer amount (75% of payment, or custom amount for partial scenarios)
    const fullSupporterAmount = Math.round(paymentIntent.amount * SUPPORTER_PERCENTAGE);
    const amountToTransfer = transferAmount ?? fullSupporterAmount;

    console.log(`Transfer request: ${reason}`);
    console.log(`  Session: ${sessionId}`);
    console.log(`  PaymentIntent: ${paymentIntentId} ($${(paymentIntent.amount / 100).toFixed(2)})`);
    console.log(`  Supporter Account: ${supporterStripeAccountId}`);
    console.log(`  Transfer Amount: $${(amountToTransfer / 100).toFixed(2)}`);

    // Check if transfer already exists for this session
    const { data: existingTransfer } = await supabase
      .from('payouts')
      .select('id, stripe_transfer_id')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .single();

    if (existingTransfer) {
      console.log(`Transfer already exists for session ${sessionId}: ${existingTransfer.stripe_transfer_id}`);
      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: 'Transfer already processed',
          existingTransferId: existingTransfer.stripe_transfer_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the transfer to supporter's connected account
    let transfer: Stripe.Transfer;
    try {
      transfer = await stripe.transfers.create({
        amount: amountToTransfer,
        currency: paymentIntent.currency,
        destination: supporterStripeAccountId,
        source_transaction: paymentIntent.latest_charge as string,
        metadata: {
          session_id: sessionId,
          payment_intent_id: paymentIntentId,
          supporter_id: supporterId || '',
          reason: reason,
        },
      });

      console.log(`Transfer created: ${transfer.id}`);
    } catch (transferError: any) {
      // Transfer failed - log error and flag for admin review
      console.error(`Transfer failed for session ${sessionId}:`, transferError.message);

      // Record the failed transfer attempt for admin review
      await supabase
        .from('failed_transfers')
        .insert({
          session_id: sessionId,
          payment_intent_id: paymentIntentId,
          supporter_id: supporterId,
          supporter_stripe_account_id: supporterStripeAccountId,
          amount: amountToTransfer,
          error_message: transferError.message,
          error_code: transferError.code || 'unknown',
          reason: reason,
          requires_admin_review: true,
          created_at: new Date().toISOString(),
        });

      // Update session with transfer failure flag
      await supabase
        .from('sessions')
        .update({
          transfer_failed: true,
          transfer_error: transferError.message,
        })
        .eq('id', sessionId);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Transfer failed - flagged for admin review',
          errorCode: transferError.code,
          errorMessage: transferError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record successful transfer in payouts table
    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        supporter_id: supporterId,
        session_id: sessionId,
        amount: amountToTransfer,
        status: 'completed',
        stripe_transfer_id: transfer.id,
        processed_at: new Date().toISOString(),
        metadata: {
          reason,
          payment_intent_id: paymentIntentId,
        },
      });

    if (payoutError) {
      console.error('Failed to record payout:', payoutError);
      // Transfer succeeded but DB record failed - log but don't fail the response
    }

    // Update supporter's earnings
    if (supporterId) {
      const { data: supporterDetails } = await supabase
        .from('supporter_details')
        .select('pending_payout, total_earnings')
        .eq('supporter_id', supporterId)
        .single();

      if (supporterDetails) {
        await supabase
          .from('supporter_details')
          .update({
            total_earnings: (supporterDetails.total_earnings || 0) + amountToTransfer,
            // Note: We don't add to pending_payout since transfer is already complete
          })
          .eq('supporter_id', supporterId);
      }
    }

    // Update session to mark transfer as complete
    await supabase
      .from('sessions')
      .update({
        transfer_completed: true,
        transfer_id: transfer.id,
        transfer_amount: amountToTransfer,
      })
      .eq('id', sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        transferId: transfer.id,
        amount: amountToTransfer,
        supporterAccountId: supporterStripeAccountId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Transfer to supporter error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process transfer' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
