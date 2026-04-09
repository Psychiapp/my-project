import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface BroadcastRequest {
  requestId: string;
  sessionType: 'chat' | 'phone' | 'video';
  clientId: string;
  clientName?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const { requestId, sessionType, clientId, clientName }: BroadcastRequest = await req.json();

    // Validate required fields
    if (!requestId || !sessionType || !clientId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestId, sessionType, clientId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the client's timezone
    const { data: clientTimezone } = await supabase
      .rpc('get_client_timezone', { p_client_id: clientId });

    console.log(`Client ${clientId} timezone: ${clientTimezone}`);

    // Get up to 10 eligible supporters in the same timezone
    // Pass session type for schedule conflict checking (e.g., phone calls need 60min free)
    const { data: supporters, error: supportersError } = await supabase
      .rpc('get_all_eligible_supporters', {
        p_timezone: clientTimezone,
        p_session_type: sessionType,
      });

    if (supportersError) {
      console.error('Error fetching eligible supporters:', supportersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch eligible supporters', details: supportersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!supporters || supporters.length === 0) {
      console.log(`No eligible supporters found in timezone: ${clientTimezone}`);

      // Update the request status to no_supporters
      await supabase
        .from('live_support_requests')
        .update({ status: 'no_supporters' })
        .eq('id', requestId);

      return new Response(
        JSON.stringify({
          sent: 0,
          timezone: clientTimezone,
          error: 'No eligible supporters available in your timezone'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${supporters.length} eligible supporters in timezone ${clientTimezone}`);

    // Build push messages for all supporters with push tokens
    const pushMessages: PushMessage[] = supporters
      .filter((s: any) => s.expo_push_token)
      .map((supporter: any) => ({
        to: supporter.expo_push_token,
        title: '🔔 Live Support Request',
        body: `A client needs a ${sessionType} session now! First to respond gets it.`,
        data: {
          type: 'live_support_request',
          requestId,
          sessionType,
          clientName: clientName || 'A client',
        },
        sound: 'default',
        priority: 'high',
        channelId: 'live_support',
      }));

    if (pushMessages.length === 0) {
      console.log('No supporters with push tokens');
      return new Response(
        JSON.stringify({ sent: 0, eligibleCount: supporters.length, error: 'No supporters with push tokens' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send all push notifications (Expo accepts batches)
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessages),
    });

    const pushResult = await pushResponse.json();

    if (!pushResponse.ok) {
      console.error('Expo Push API error:', pushResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send push notifications', details: pushResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Count successful sends
    const successCount = pushResult.data?.filter((ticket: any) => ticket.status === 'ok').length || 0;
    const errorCount = pushResult.data?.filter((ticket: any) => ticket.status === 'error').length || 0;

    console.log(`Broadcast sent to ${successCount} supporters, ${errorCount} failed`);

    return new Response(
      JSON.stringify({
        sent: successCount,
        failed: errorCount,
        total: pushMessages.length,
        eligibleSupporters: supporters.length,
        timezone: clientTimezone,
        tickets: pushResult.data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Broadcast notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
