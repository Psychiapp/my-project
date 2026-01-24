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
    const { accountId, refreshUrl, returnUrl } = await req.json();

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: accountId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || 'psychi://payout-settings?refresh=true',
      return_url: returnUrl || 'psychi://payout-settings?success=true',
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create account link error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
