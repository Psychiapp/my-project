import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getStripe } from '../_shared/stripe.ts';

const stripe = getStripe();

// Use Supabase URL for redirects (goes through stripe-redirect Edge Function)
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;

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

    // Use HTTPS redirect URLs that go through our stripe-redirect Edge Function
    // This function then redirects to the app using deep links
    const baseRedirectUrl = `${supabaseUrl}/functions/v1/stripe-redirect`;
    const defaultRefreshUrl = `${baseRedirectUrl}?type=refresh`;
    const defaultReturnUrl = `${baseRedirectUrl}?type=success`;

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl || defaultRefreshUrl,
      return_url: returnUrl || defaultReturnUrl,
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
    const isStaleAccount = error?.message?.includes('not connected to your platform') ||
      error?.message?.includes('does not exist');
    return new Response(
      JSON.stringify({
        error: isStaleAccount
          ? 'Stripe account not found on this platform. Please create a new payout account.'
          : error.message,
        code: isStaleAccount ? 'ACCOUNT_NOT_FOUND' : 'STRIPE_ERROR',
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
