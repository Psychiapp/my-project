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

    if (!amount || amount < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid refund amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // Amount in cents
      reason: reason === 'supporter_cancelled' || reason === 'supporter_rescheduled'
        ? 'requested_by_customer'
        : 'requested_by_customer',
      metadata: {
        sessionId: sessionId || '',
        initiatedBy: initiatedBy || 'unknown',
        originalReason: reason || 'unspecified',
      },
    });

    // Update session status in database if sessionId provided
    if (sessionId && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase
        .from('sessions')
        .update({
          status: 'cancelled',
          refund_id: refund.id,
          refund_amount: amount,
          refund_status: refund.status,
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason,
        })
        .eq('id', sessionId);

      // Record refund in payments table
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

    return new Response(
      JSON.stringify({
        success: true,
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount,
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
