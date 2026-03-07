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
    const { supporterId, email, fullName } = await req.json();

    if (!supporterId || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: supporterId, email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        mcc: '8099', // Health services
        product_description: 'Peer support services through Psychi app',
      },
      metadata: {
        supporter_id: supporterId,
        platform: 'psychi',
      },
    });

    // Store the Connect account ID in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        stripe_connect_id: account.id,
        stripe_connect_status: 'pending',
      })
      .eq('id', supporterId);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      // Don't fail the request, account was created successfully
    }

    return new Response(
      JSON.stringify({
        accountId: account.id,
        status: 'pending',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create Connect account error:', error);

    // Log detailed error info for debugging
    const stripeError = error as any;
    console.error('Stripe error details:', {
      type: stripeError.type,
      code: stripeError.code,
      message: stripeError.message,
      raw: stripeError.raw,
    });

    // Check if this is a Stripe API error
    if (stripeError.type === 'StripeInvalidRequestError') {
      // Check for platform profile not complete - but include diagnostic info
      const errorMessage = stripeError.message || '';
      if (errorMessage.includes('platform profile') || errorMessage.includes('questionnaire')) {
        // Check API key mode to help diagnose
        const secretKey = Deno.env.get('STRIPE_SECRET_KEY') || '';
        const isTestMode = secretKey.startsWith('sk_test_');
        const isLiveMode = secretKey.startsWith('sk_live_');

        console.error('Platform profile error - API key mode:', {
          isTestMode,
          isLiveMode,
          keyPrefix: secretKey.substring(0, 8) + '...',
        });

        return new Response(
          JSON.stringify({
            error: `Stripe Connect setup failed. Please verify: 1) Platform profile is completed in ${isTestMode ? 'TEST' : isLiveMode ? 'LIVE' : 'UNKNOWN'} mode in Stripe Dashboard. 2) The correct API key is configured. Original error: ${errorMessage}`,
            code: 'PLATFORM_PROFILE_ERROR',
            mode: isTestMode ? 'test' : isLiveMode ? 'live' : 'unknown',
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: stripeError.message || 'Failed to create Connect account',
        type: stripeError.type,
        code: stripeError.code,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
