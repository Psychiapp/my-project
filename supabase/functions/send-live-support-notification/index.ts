import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { requireUserAuth, unauthorizedResponse } from '../_shared/auth.ts';

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
  channelId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const user = await requireUserAuth(req);
  if (!user) return unauthorizedResponse(corsHeaders);

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') as string,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    );

    const { userId, title, body, data, priority = 'high', channelId = 'live_support' }: SendNotificationRequest = await req.json();

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
      channelId,
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
      const ticket = pushResult.data[0];
      if (ticket.status === 'error') {
        console.error('Push ticket error:', ticket);

        // If the token is no longer valid, clear it from the profile so we don't
        // keep attempting to send to a dead token on every future notification.
        const isInvalidToken = ticket.details?.error === 'DeviceNotRegistered' ||
          ticket.details?.error === 'InvalidCredentials';
        if (isInvalidToken) {
          console.log(`Clearing invalid push token for user ${userId}`);
          await supabase
            .from('profiles')
            .update({ expo_push_token: null })
            .eq('id', userId);
        }

        return new Response(
          JSON.stringify({
            sent: false,
            error: ticket.message,
            details: ticket.details,
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
