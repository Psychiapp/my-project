import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

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
    const { amount, currency = 'usd', metadata, supporterStripeAccountId } = await req.json();

    // Validate amount
    if (!amount || amount < 50) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount. Minimum is 50 cents.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build payment intent options
    const paymentIntentOptions: any = {
      amount,
      currency,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    };

    // Add Connect split if supporter's connected account is provided
    // Platform fee: 25%, Supporter receives: 75%
    if (supporterStripeAccountId) {
      const applicationFee = Math.round(amount * 0.25); // 25% platform fee
      paymentIntentOptions.application_fee_amount = applicationFee;
      paymentIntentOptions.transfer_data = {
        destination: supporterStripeAccountId,
      };
      console.log(`Connect payment: $${(amount/100).toFixed(2)} total, $${(applicationFee/100).toFixed(2)} platform fee, $${((amount-applicationFee)/100).toFixed(2)} to supporter`);
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
