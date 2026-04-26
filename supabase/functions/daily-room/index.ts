import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { requireUserAuth, unauthorizedResponse } from '../_shared/auth.ts';

const DAILY_API_URL = 'https://api.daily.co/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const user = await requireUserAuth(req);
  if (!user) return unauthorizedResponse(corsHeaders);

  try {
    const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY');

    if (!DAILY_API_KEY) {
      console.error('DAILY_API_KEY not configured in secrets');
      return new Response(
        JSON.stringify({ error: 'Daily.co API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Route to appropriate handler
    if (action === 'create') {
      return await handleCreate(body, DAILY_API_KEY);
    } else if (action === 'delete') {
      return await handleDelete(body, DAILY_API_KEY);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "create" or "delete".' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Daily room error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleCreate(body: any, apiKey: string): Promise<Response> {
  const { name, expiryMinutes = 60, maxParticipants = 2, startVideoOff = false, startAudioOff = false } = body;

  const exp = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      name,
      properties: {
        exp,
        max_participants: maxParticipants,
        enable_chat: true,
        start_video_off: startVideoOff,
        start_audio_off: startAudioOff,
        enable_screenshare: false,
        enable_recording: false,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Daily API error:', response.status, errorBody);
    return new Response(
      JSON.stringify({ error: `Daily API error ${response.status}: ${errorBody}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const room = await response.json();
  console.log('Daily room created:', room.name);

  return new Response(
    JSON.stringify(room),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDelete(body: any, apiKey: string): Promise<Response> {
  const { roomName } = body;

  if (!roomName) {
    return new Response(
      JSON.stringify({ error: 'roomName is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  // 404 is okay - room may have already been deleted or expired
  if (!response.ok && response.status !== 404) {
    const errorBody = await response.text();
    console.error('Daily API delete error:', response.status, errorBody);
    return new Response(
      JSON.stringify({ error: `Daily API error ${response.status}: ${errorBody}`, success: false }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  console.log('Daily room deleted:', roomName);

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
