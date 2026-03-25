/**
 * Cleanup Stale Sessions Edge Function
 *
 * This function should be triggered periodically (via cron job or external scheduler)
 * to clean up sessions that are stuck in "in_progress" status.
 *
 * Scenarios handled:
 * 1. Both users disconnect - session never gets marked as completed
 * 2. App crashes during session - status never updated
 * 3. Daily.co room expires but session not closed
 *
 * Sessions are marked as completed if:
 * - Status is "in_progress" AND
 * - (scheduled_at + duration_minutes + 30 min buffer) has passed
 *
 * Sessions are marked as "no_show" if:
 * - Status is "scheduled" AND
 * - (scheduled_at + 15 minutes) has passed without starting
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// Helper function to trigger transfer to supporter after session completion
async function triggerTransferToSupporter(
  sessionId: string,
  paymentIntentId: string | null,
  reason: 'session_completed' | 'no_refund_cancellation' | 'partial_refund_retained'
): Promise<{ success: boolean; error?: string }> {
  if (!paymentIntentId) {
    console.log(`No payment intent for session ${sessionId} - skipping transfer`);
    return { success: true }; // Not an error, just no payment to transfer
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/transfer-to-supporter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        sessionId,
        paymentIntentId,
        reason,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`Transfer failed for session ${sessionId}:`, result.error);
      return { success: false, error: result.error };
    }

    console.log(`Transfer triggered for session ${sessionId}:`, result);
    return { success: true };
  } catch (error: any) {
    console.error(`Error triggering transfer for session ${sessionId}:`, error.message);
    return { success: false, error: error.message };
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Buffer time after session should have ended before marking as stale (30 minutes)
const STALE_SESSION_BUFFER_MINUTES = 30;
// Time after scheduled start before marking as no-show (15 minutes)
const NO_SHOW_THRESHOLD_MINUTES = 15;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    // 1. Find and complete stale "in_progress" sessions
    // A session is stale if: scheduled_at + duration_minutes + buffer has passed
    const { data: staleSessions, error: staleError } = await supabase
      .from('sessions')
      .select('id, scheduled_at, duration_minutes, session_type, client_id, supporter_id, stripe_payment_intent_id, notes')
      .eq('status', 'in_progress');

    if (staleError) {
      console.error('Error fetching stale sessions:', staleError);
    }

    let completedCount = 0;
    if (staleSessions) {
      for (const session of staleSessions) {
        const scheduledAt = new Date(session.scheduled_at);
        const shouldHaveEndedAt = new Date(
          scheduledAt.getTime() +
          (session.duration_minutes + STALE_SESSION_BUFFER_MINUTES) * 60 * 1000
        );

        if (now > shouldHaveEndedAt) {
          // Mark as completed (session ran its course but wasn't properly closed)
          const { error: updateError } = await supabase
            .from('sessions')
            .update({
              status: 'completed',
              ended_at: shouldHaveEndedAt.toISOString(), // Use expected end time
              notes: (session.notes || '') + '\n[Auto-completed by cleanup job]',
            })
            .eq('id', session.id);

          if (!updateError) {
            completedCount++;
            console.log(`Auto-completed stale session: ${session.id}`);

            // Trigger transfer to supporter now that session is complete
            await triggerTransferToSupporter(
              session.id,
              session.stripe_payment_intent_id,
              'session_completed'
            );
          } else {
            console.error(`Failed to complete session ${session.id}:`, updateError);
          }
        }
      }
    }

    // 2. Find and mark "no_show" sessions
    // A session is no-show if: scheduled_at + 15 min has passed and still "scheduled"
    const noShowThreshold = new Date(now.getTime() - NO_SHOW_THRESHOLD_MINUTES * 60 * 1000);

    const { data: noShowSessions, error: noShowError } = await supabase
      .from('sessions')
      .select('id, scheduled_at, session_type, client_id, supporter_id, stripe_payment_intent_id')
      .eq('status', 'scheduled')
      .lt('scheduled_at', noShowThreshold.toISOString());

    if (noShowError) {
      console.error('Error fetching no-show sessions:', noShowError);
    }

    let noShowCount = 0;
    if (noShowSessions) {
      for (const session of noShowSessions) {
        const { error: updateError } = await supabase
          .from('sessions')
          .update({
            status: 'no_show',
            ended_at: now.toISOString(),
            notes: (session.notes || '') + '\n[Marked as no-show by cleanup job - neither party joined]',
          })
          .eq('id', session.id);

        if (!updateError) {
          noShowCount++;
          console.log(`Marked session as no-show: ${session.id}`);

          // Note: Refund handling for no-shows should be done via a separate policy
          // The webhook will handle refunds if process-refund is called
        } else {
          console.error(`Failed to mark session ${session.id} as no-show:`, updateError);
        }
      }
    }

    // 3. Clean up old processed webhook events (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const { error: cleanupError, count: deletedEvents } = await supabase
      .from('processed_webhook_events')
      .delete()
      .lt('processed_at', sevenDaysAgo.toISOString());

    if (cleanupError) {
      console.error('Error cleaning up old webhook events:', cleanupError);
    }

    const result = {
      success: true,
      timestamp: now.toISOString(),
      sessionsCompleted: completedCount,
      sessionsMarkedNoShow: noShowCount,
      webhookEventsDeleted: deletedEvents || 0,
    };

    console.log('Cleanup completed:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
