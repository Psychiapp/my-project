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
    const { supporterId, amount, stripeConnectId } = await req.json();

    if (!supporterId || !amount || !stripeConnectId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: supporterId, amount, stripeConnectId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Minimum payout is $25 (2500 cents)
    if (amount < 2500) {
      return new Response(
        JSON.stringify({ error: 'Minimum payout amount is $25.00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the Connect account is active
    const account = await stripe.accounts.retrieve(stripeConnectId);

    if (!account.charges_enabled || !account.payouts_enabled) {
      return new Response(
        JSON.stringify({
          error: 'Account setup incomplete. Please complete bank account verification.',
          accountStatus: {
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
            detailsSubmitted: account.details_submitted,
          }
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amount,
      currency: 'usd',
      destination: stripeConnectId,
      metadata: {
        supporter_id: supporterId,
        platform: 'psychi',
      },
    });

    // Record the payout in the database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: payout, error: insertError } = await supabase
      .from('payouts')
      .insert({
        supporter_id: supporterId,
        amount: amount,
        status: 'completed',
        stripe_transfer_id: transfer.id,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to record payout:', insertError);
      // Transfer was successful, just log the error
    }

    // Update pending_payout in supporter profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        pending_payout: 0,
      })
      .eq('id', supporterId);

    if (updateError) {
      console.error('Failed to update pending payout:', updateError);
    }

    return new Response(
      JSON.stringify({
        transferId: transfer.id,
        amount: transfer.amount,
        status: 'completed',
        payoutId: payout?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Create payout error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
