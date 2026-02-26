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

interface SendNotificationRequest {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
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

    const { userId, title, body, data, priority = 'high' }: SendNotificationRequest = await req.json();

    // Validate required fields
    if (!userId || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: userId, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's push token from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('expo_push_token, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found or no push token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const pushToken = profile.expo_push_token;

    if (!pushToken) {
      return new Response(
        JSON.stringify({ error: 'User has no push token registered', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate push token format
    if (!pushToken.startsWith('ExponentPushToken[') && !pushToken.startsWith('ExpoPushToken[')) {
      console.error('Invalid push token format:', pushToken);
      return new Response(
        JSON.stringify({ error: 'Invalid push token format', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct the push message
    const pushMessage: PushMessage = {
      to: pushToken,
      title,
      body,
      data: data || {},
      sound: 'default',
      priority,
      channelId: 'live_support',
    };

    // Send via Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pushMessage),
    });

    const pushResult = await pushResponse.json();

    if (!pushResponse.ok) {
      console.error('Expo Push API error:', pushResult);
      return new Response(
        JSON.stringify({ error: 'Failed to send push notification', details: pushResult }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for individual message errors in the response
    if (pushResult.data && pushResult.data[0]) {
      const ticketStatus = pushResult.data[0].status;
      if (ticketStatus === 'error') {
        console.error('Push ticket error:', pushResult.data[0]);
        return new Response(
          JSON.stringify({
            sent: false,
            error: pushResult.data[0].message,
            details: pushResult.data[0].details
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        sent: true,
        ticket: pushResult.data?.[0],
        recipient: profile.full_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Send notification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
