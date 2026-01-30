import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') as string;
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      // Connect account events
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        const supporterId = account.metadata?.supporter_id;

        if (supporterId) {
          const status = account.charges_enabled && account.payouts_enabled
            ? 'active'
            : account.details_submitted
              ? 'pending_verification'
              : 'pending';

          await supabase
            .from('profiles')
            .update({
              stripe_connect_status: status,
              stripe_charges_enabled: account.charges_enabled,
              stripe_payouts_enabled: account.payouts_enabled,
            })
            .eq('id', supporterId);
        }
        break;
      }

      // Payment intent events
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Record the payment
        await supabase
          .from('payments')
          .update({ status: 'completed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // If this payment has a session_id in metadata, update session payment status
        if (paymentIntent.metadata?.session_id) {
          await supabase
            .from('sessions')
            .update({ payment_status: 'completed' })
            .eq('id', paymentIntent.metadata.session_id);

          // Calculate and add to supporter's pending payout (75% cut)
          if (paymentIntent.metadata?.supporter_id) {
            const supporterCut = Math.floor(paymentIntent.amount * 0.75);

            const { data: supporterDetails } = await supabase
              .from('supporter_details')
              .select('pending_payout, total_earnings')
              .eq('supporter_id', paymentIntent.metadata.supporter_id)
              .single();

            if (supporterDetails) {
              await supabase
                .from('supporter_details')
                .update({
                  pending_payout: (supporterDetails.pending_payout || 0) + supporterCut,
                  total_earnings: (supporterDetails.total_earnings || 0) + supporterCut,
                })
                .eq('supporter_id', paymentIntent.metadata.supporter_id);
            }
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);
        break;
      }

      // Transfer/payout events
      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        const supporterId = transfer.metadata?.supporter_id;

        if (supporterId) {
          await supabase
            .from('payouts')
            .update({ status: 'pending' })
            .eq('stripe_transfer_id', transfer.id);
        }
        break;
      }

      case 'transfer.paid': {
        const transfer = event.data.object as Stripe.Transfer;

        await supabase
          .from('payouts')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_transfer_id', transfer.id);
        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object as Stripe.Transfer;
        const supporterId = transfer.metadata?.supporter_id;

        await supabase
          .from('payouts')
          .update({ status: 'failed' })
          .eq('stripe_transfer_id', transfer.id);

        // Return amount to pending payout
        if (supporterId) {
          const { data: supporterDetails } = await supabase
            .from('supporter_details')
            .select('pending_payout')
            .eq('supporter_id', supporterId)
            .single();

          if (supporterDetails) {
            await supabase
              .from('supporter_details')
              .update({
                pending_payout: (supporterDetails.pending_payout || 0) + transfer.amount,
              })
              .eq('supporter_id', supporterId);
          }
        }
        break;
      }

      // Refund events
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        if (charge.payment_intent) {
          await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
