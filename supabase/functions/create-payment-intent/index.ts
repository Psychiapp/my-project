import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getStripe, getStripeMode } from '../_shared/stripe.ts';
import { requireUserAuth, unauthorizedResponse } from '../_shared/auth.ts';

const stripe = getStripe();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const user = await requireUserAuth(req);
  if (!user) return unauthorizedResponse(corsHeaders);

  try {
    const { amount, currency = 'usd', metadata, supporterStripeAccountId } = await req.json();

    // Validate amount
    if (!amount || amount < 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Minimum is 50 cents.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build payment intent options
    // IMPORTANT: We do NOT use transfer_data.destination here because that would
    // transfer funds to the supporter immediately at charge time. Instead, we hold
    // funds in the platform account and transfer to supporter AFTER session completion.
    const paymentIntentOptions: any = {
      amount,
      currency,
      metadata: {
        ...(metadata || {}),
        // Store supporter info for deferred transfer after session completion
        ...(supporterStripeAccountId ? {
          supporter_stripe_account_id: supporterStripeAccountId,
          transfer_pending: 'true', // Flag indicating transfer needed after completion
        } : {}),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Log payment info (no immediate transfer)
    if (supporterStripeAccountId) {
      const supporterAmount = Math.round(amount * 0.75); // 75% to supporter
      const platformFee = amount - supporterAmount; // 25% platform fee
      console.log(`Payment created: $${(amount/100).toFixed(2)} total (held in platform account)`);
      console.log(`After session completion: $${(supporterAmount/100).toFixed(2)} to supporter, $${(platformFee/100).toFixed(2)} platform fee`);
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
