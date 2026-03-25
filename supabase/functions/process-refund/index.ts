import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform takes 25%, supporter gets 75%
const SUPPORTER_PERCENTAGE = 0.75;

// Helper to trigger transfer to supporter for retained amounts
async function triggerTransferToSupporter(
  sessionId: string,
  paymentIntentId: string,
  transferAmount: number,
  reason: 'session_completed' | 'no_refund_cancellation' | 'partial_refund_retained'
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/transfer-to-supporter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        sessionId,
        paymentIntentId,
        transferAmount,
        reason,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Transfer failed:`, result.error);
      return { success: false, error: result.error };
    }

    console.log(`Transfer triggered:`, result);
    return { success: true };
  } catch (error: any) {
    console.error(`Error triggering transfer:`, error.message);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { sessionId, paymentIntentId, amount, reason, initiatedBy } = await req.json();

    // Validate required fields
    if (!paymentIntentId) {
      return new Response(
        JSON.stringify({ error: 'Payment intent ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // amount can be 0 for no-refund cancellations
    if (amount === undefined || amount === null || amount < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid refund amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the original payment to determine retained amount
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const originalAmount = paymentIntent.amount;
    const retainedAmount = originalAmount - amount;

    console.log(`Refund request for session ${sessionId}:`);
    console.log(`  Original amount: $${(originalAmount / 100).toFixed(2)}`);
    console.log(`  Refund amount: $${(amount / 100).toFixed(2)}`);
    console.log(`  Retained amount: $${(retainedAmount / 100).toFixed(2)}`);
    console.log(`  Reason: ${reason}, initiated by: ${initiatedBy}`);

    let refund: Stripe.Refund | null = null;

    // Only create a Stripe refund if amount > 0
    if (amount > 0) {
      // Create refund in Stripe
      // reverse_transfer: true claws back any existing transfer (for legacy payments with immediate transfer)
      refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount, // Amount in cents
        reason: reason === 'supporter_cancelled' || reason === 'supporter_rescheduled'
          ? 'requested_by_customer'
          : 'requested_by_customer',
        reverse_transfer: true, // Claw back transfer from supporter's Stripe account (if any)
        metadata: {
          sessionId: sessionId || '',
          initiatedBy: initiatedBy || 'unknown',
          originalReason: reason || 'unspecified',
        },
      });
      console.log(`Stripe refund created: ${refund.id}`);
    } else {
      console.log(`No refund issued (no-refund cancellation window)`);
    }

    // Update session and trigger transfer if needed
    if (sessionId && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Determine final status based on refund type
      const isNoRefundCancellation = amount === 0;
      const isPartialRefund = amount > 0 && amount < originalAmount;
      const isFullRefund = amount === originalAmount;

      await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          refund_id: refund?.id || null,
          refund_amount: amount,
          refund_status: refund?.status || 'none',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', sessionId);

      // Record refund in payments table (only if actual refund was issued)
      if (refund) {
        await supabase
          .from('payments')
          .insert({
            session_id: sessionId,
            stripe_refund_id: refund.id,
            amount: -amount, // Negative amount for refund
            status: refund.status,
            type: 'refund',
            metadata: {
              reason,
              initiatedBy,
              originalPaymentIntent: paymentIntentId,
            },
          });
      }

      // DEFERRED TRANSFER LOGIC:
      // If there's a retained amount, transfer 75% of it to the supporter
      if (retainedAmount > 0) {
        const supporterAmount = Math.round(retainedAmount * SUPPORTER_PERCENTAGE);

        let transferReason: 'no_refund_cancellation' | 'partial_refund_retained';
        if (isNoRefundCancellation) {
          transferReason = 'no_refund_cancellation';
          console.log(`No-refund cancellation: Supporter gets full 75% = $${(supporterAmount / 100).toFixed(2)}`);
        } else {
          transferReason = 'partial_refund_retained';
          console.log(`Partial refund: Supporter gets 75% of retained amount = $${(supporterAmount / 100).toFixed(2)}`);
        }

        // Trigger transfer to supporter
        const transferResult = await triggerTransferToSupporter(
          sessionId,
          paymentIntentId,
          supporterAmount,
          transferReason
        );

        if (!transferResult.success) {
          console.error(`Warning: Transfer to supporter failed: ${transferResult.error}`);
          // Continue - the transfer failure is logged and flagged for admin review
        }
      } else if (isFullRefund) {
        console.log(`Full refund: No transfer to supporter`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund?.id || null,
        status: refund?.status || 'none',
        amount: amount,
        retainedAmount: retainedAmount,
        supporterAmount: retainedAmount > 0 ? Math.round(retainedAmount * SUPPORTER_PERCENTAGE) : 0,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refund error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return new Response(
        JSON.stringify({ error: 'Invalid payment or already refunded' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process refund' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
