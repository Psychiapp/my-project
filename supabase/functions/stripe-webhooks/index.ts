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
  const body = await req.text();

  // Log incoming request for debugging
  console.log('Webhook received:', {
    hasSignature: !!signature,
    bodyLength: body.length,
    bodyPreview: body.substring(0, 200),
  });

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  try {
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    console.log('Event verified:', event.type);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Idempotency check: Skip if we've already processed this event
    const { data: existingEvent } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single();

    if (existingEvent) {
      console.log(`Skipping already processed event: ${event.id}`);
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mark event as being processed (insert before processing to handle race conditions)
    const { error: insertError } = await supabase
      .from('processed_webhook_events')
      .insert({
        stripe_event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });

    // If insert fails due to unique constraint, another instance is processing this event
    if (insertError?.code === '23505') {
      console.log(`Event ${event.id} is being processed by another instance`);
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    switch (event.type) {
      // Connect account events (v1 API)
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

      // Connect account events (v2 API - thin events)
      case 'v2.core.account.updated': {
        // v2 events are "thin" - we need to fetch the full account data
        const accountId = (event.data as any).id || (event as any).related_object?.id;

        if (accountId) {
          try {
            // Fetch full account data from Stripe
            const account = await stripe.accounts.retrieve(accountId);
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

              console.log(`Updated supporter ${supporterId} Connect status to ${status}`);
            }
          } catch (fetchError) {
            console.error('Error fetching account for v2 event:', fetchError);
          }
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
        // Note: session_id may not be in metadata if session is created after payment
        if (paymentIntent.metadata?.session_id) {
          await supabase
            .from('sessions')
            .update({ payment_status: 'completed' })
            .eq('id', paymentIntent.metadata.session_id);
        }

        // Calculate and add to supporter's pending payout (75% cut)
        // This runs even without session_id since earnings are tied to supporter, not session
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
          // Update payment status
          await supabase
            .from('payments')
            .update({ status: 'refunded' })
            .eq('stripe_payment_intent_id', charge.payment_intent);

          // Get the original payment intent to find supporter_id and reverse earnings
          const paymentIntent = await stripe.paymentIntents.retrieve(charge.payment_intent as string);
          const supporterId = paymentIntent.metadata?.supporter_id;

          if (supporterId) {
            // Calculate the supporter's cut that needs to be reversed (75% of refunded amount)
            const refundedAmount = charge.amount_refunded || charge.amount;
            const supporterCutToReverse = Math.floor(refundedAmount * 0.75);

            const { data: supporterDetails } = await supabase
              .from('supporter_details')
              .select('pending_payout, total_earnings')
              .eq('supporter_id', supporterId)
              .single();

            if (supporterDetails) {
              await supabase
                .from('supporter_details')
                .update({
                  pending_payout: Math.max(0, (supporterDetails.pending_payout || 0) - supporterCutToReverse),
                  total_earnings: Math.max(0, (supporterDetails.total_earnings || 0) - supporterCutToReverse),
                })
                .eq('supporter_id', supporterId);

              console.log(`Reversed $${(supporterCutToReverse / 100).toFixed(2)} from supporter ${supporterId} due to refund`);
            }
          }
        }
        break;
      }

      // Payment intent canceled (before capture)
      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Update payment status
        await supabase
          .from('payments')
          .update({ status: 'failed' })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        // If earnings were somehow already credited (shouldn't happen for canceled), reverse them
        const supporterId = paymentIntent.metadata?.supporter_id;
        if (supporterId) {
          const supporterCut = Math.floor(paymentIntent.amount * 0.75);

          const { data: supporterDetails } = await supabase
            .from('supporter_details')
            .select('pending_payout, total_earnings')
            .eq('supporter_id', supporterId)
            .single();

          if (supporterDetails && (supporterDetails.pending_payout || 0) >= supporterCut) {
            await supabase
              .from('supporter_details')
              .update({
                pending_payout: Math.max(0, (supporterDetails.pending_payout || 0) - supporterCut),
                total_earnings: Math.max(0, (supporterDetails.total_earnings || 0) - supporterCut),
              })
              .eq('supporter_id', supporterId);

            console.log(`Reversed $${(supporterCut / 100).toFixed(2)} from supporter ${supporterId} due to payment cancellation`);
          }
        }
        break;
      }

      // Dispute/chargeback events
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;

        // Update payment status to disputed
        if (dispute.payment_intent) {
          await supabase
            .from('payments')
            .update({ status: 'failed' }) // Mark as failed since funds are held
            .eq('stripe_payment_intent_id', dispute.payment_intent);
        }

        // Get the charge to find the payment intent and supporter
        const paymentIntent = dispute.payment_intent
          ? await stripe.paymentIntents.retrieve(dispute.payment_intent as string)
          : null;

        const supporterId = paymentIntent?.metadata?.supporter_id;

        if (supporterId) {
          // Reverse the supporter's earnings immediately on dispute
          // (Even if we win the dispute later, we can credit back then)
          const disputeAmount = dispute.amount;
          const supporterCutToReverse = Math.floor(disputeAmount * 0.75);

          const { data: supporterDetails } = await supabase
            .from('supporter_details')
            .select('pending_payout, total_earnings')
            .eq('supporter_id', supporterId)
            .single();

          if (supporterDetails) {
            await supabase
              .from('supporter_details')
              .update({
                pending_payout: Math.max(0, (supporterDetails.pending_payout || 0) - supporterCutToReverse),
                total_earnings: Math.max(0, (supporterDetails.total_earnings || 0) - supporterCutToReverse),
              })
              .eq('supporter_id', supporterId);

            console.log(`Reversed $${(supporterCutToReverse / 100).toFixed(2)} from supporter ${supporterId} due to dispute`);
          }
        }
        break;
      }

      // Dispute resolved in our favor - restore earnings
      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute;

        // Only restore earnings if we won the dispute
        if (dispute.status === 'won') {
          const paymentIntent = dispute.payment_intent
            ? await stripe.paymentIntents.retrieve(dispute.payment_intent as string)
            : null;

          const supporterId = paymentIntent?.metadata?.supporter_id;

          if (supporterId) {
            const disputeAmount = dispute.amount;
            const supporterCut = Math.floor(disputeAmount * 0.75);

            const { data: supporterDetails } = await supabase
              .from('supporter_details')
              .select('pending_payout, total_earnings')
              .eq('supporter_id', supporterId)
              .single();

            if (supporterDetails) {
              await supabase
                .from('supporter_details')
                .update({
                  pending_payout: (supporterDetails.pending_payout || 0) + supporterCut,
                  total_earnings: (supporterDetails.total_earnings || 0) + supporterCut,
                })
                .eq('supporter_id', supporterId);

              console.log(`Restored $${(supporterCut / 100).toFixed(2)} to supporter ${supporterId} - dispute won`);
            }
          }

          // Update payment status back to completed
          if (dispute.payment_intent) {
            await supabase
              .from('payments')
              .update({ status: 'completed' })
              .eq('stripe_payment_intent_id', dispute.payment_intent);
          }
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
