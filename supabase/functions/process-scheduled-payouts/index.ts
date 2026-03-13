/**
 * Process Scheduled Payouts Edge Function
 *
 * This function is triggered by a cron job to automatically process
 * payouts for supporters based on their configured schedule.
 *
 * Payout schedules:
 * - daily: Process every day at scheduled time
 * - weekly: Process on configured day (default: Monday)
 * - monthly: Process on configured day of month (1-28)
 * - manual: Skip (supporter requests payouts manually)
 *
 * Minimum payout: $25 (2500 cents)
 */

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

const MINIMUM_PAYOUT_CENTS = 2500; // $25 minimum

// Map day names to day of week numbers (0 = Sunday, 1 = Monday, etc.)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  'sunday': 0,
  'monday': 1,
  'tuesday': 2,
  'wednesday': 3,
  'thursday': 4,
  'friday': 5,
  'saturday': 6,
};

function shouldProcessToday(
  schedule: string | null,
  scheduleDay: string | null
): boolean {
  if (!schedule || schedule === 'manual') {
    return false;
  }

  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0-6 (Sunday-Saturday)
  const dayOfMonth = now.getUTCDate(); // 1-31

  switch (schedule) {
    case 'daily':
      return true;

    case 'weekly':
      // Default to Monday (1) if no day specified
      const targetDayOfWeek = scheduleDay
        ? DAY_NAME_TO_NUMBER[scheduleDay.toLowerCase()] ?? 1
        : 1;
      return dayOfWeek === targetDayOfWeek;

    case 'monthly':
      // Default to 1st if no day specified
      const targetDayOfMonth = scheduleDay
        ? parseInt(scheduleDay, 10)
        : 1;
      // Handle end of month edge cases (if target is 29-31, use last day of month)
      const lastDayOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();
      const effectiveTargetDay = Math.min(targetDayOfMonth, lastDayOfMonth);
      return dayOfMonth === effectiveTargetDay;

    default:
      return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    console.log(`Processing scheduled payouts at ${now.toISOString()}`);

    // Find supporters with:
    // - pending_payout >= minimum (from supporter_details)
    // - payout_schedule != 'manual' (from profiles)
    // - stripe_connect_id is set (from profiles)
    // - stripe_payouts_enabled = true (from profiles)
    // - role = 'supporter' (from profiles)
    //
    // Query profiles and join with supporter_details
    const { data: eligibleSupporters, error: queryError } = await supabase
      .from('profiles')
      .select(`
        id,
        payout_schedule,
        payout_schedule_day,
        stripe_connect_id,
        supporter_details!inner (
          pending_payout
        )
      `)
      .eq('role', 'supporter')
      .neq('payout_schedule', 'manual')
      .not('stripe_connect_id', 'is', null)
      .eq('stripe_payouts_enabled', true)
      .gte('supporter_details.pending_payout', MINIMUM_PAYOUT_CENTS);

    if (queryError) {
      console.error('Error querying supporters:', queryError);
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!eligibleSupporters || eligibleSupporters.length === 0) {
      console.log('No eligible supporters found for scheduled payouts');
      return new Response(
        JSON.stringify({
          success: true,
          timestamp: now.toISOString(),
          processed: 0,
          skipped: 0,
          failed: 0,
          details: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${eligibleSupporters.length} eligible supporters`);

    const results: Array<{
      supporterId: string;
      status: 'processed' | 'skipped' | 'failed';
      amount?: number;
      reason?: string;
      transferId?: string;
    }> = [];

    for (const supporter of eligibleSupporters) {
      const supporter_id = supporter.id;
      const pending_payout = supporter.supporter_details?.pending_payout || 0;
      const { payout_schedule, payout_schedule_day, stripe_connect_id } = supporter;

      // Check if we should process today based on their schedule
      if (!shouldProcessToday(payout_schedule, payout_schedule_day)) {
        results.push({
          supporterId: supporter_id,
          status: 'skipped',
          reason: `Schedule ${payout_schedule} (${payout_schedule_day || 'default'}) not due today`,
        });
        continue;
      }

      try {
        // Verify the Connect account is active
        const account = await stripe.accounts.retrieve(stripe_connect_id);

        if (!account.charges_enabled || !account.payouts_enabled) {
          results.push({
            supporterId: supporter_id,
            status: 'failed',
            reason: 'Stripe account not fully enabled',
          });
          continue;
        }

        // Create the transfer
        const transfer = await stripe.transfers.create({
          amount: pending_payout,
          currency: 'usd',
          destination: stripe_connect_id,
          metadata: {
            supporter_id: supporter_id,
            platform: 'psychi',
            scheduled_payout: 'true',
          },
        });

        // Record the payout
        const { error: insertError } = await supabase
          .from('payouts')
          .insert({
            supporter_id: supporter_id,
            amount: pending_payout,
            status: 'completed',
            stripe_transfer_id: transfer.id,
            processed_at: now.toISOString(),
          });

        if (insertError) {
          console.error(`Failed to record payout for ${supporter_id}:`, insertError);
        }

        // Reset pending_payout to 0
        const { error: updateError } = await supabase
          .from('supporter_details')
          .update({ pending_payout: 0 })
          .eq('supporter_id', supporter_id);

        if (updateError) {
          console.error(`Failed to update pending_payout for ${supporter_id}:`, updateError);
        }

        results.push({
          supporterId: supporter_id,
          status: 'processed',
          amount: pending_payout,
          transferId: transfer.id,
        });

        console.log(`Processed payout for ${supporter_id}: $${(pending_payout / 100).toFixed(2)}`);

      } catch (error) {
        console.error(`Failed to process payout for ${supporter_id}:`, error);
        results.push({
          supporterId: supporter_id,
          status: 'failed',
          reason: error.message,
        });
      }
    }

    const processed = results.filter(r => r.status === 'processed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'failed').length;

    const response = {
      success: true,
      timestamp: now.toISOString(),
      processed,
      skipped,
      failed,
      details: results,
    };

    console.log('Scheduled payouts complete:', { processed, skipped, failed });

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process scheduled payouts error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
