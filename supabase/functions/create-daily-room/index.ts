import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const DAILY_API_URL = 'https://api.daily.co/v1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('DAILY_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Daily.co not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { type = 'video', expiryMinutes = 60 } = await req.json();

    const exp = Math.floor(Date.now() / 1000) + expiryMinutes * 60;
    const name = `psychi-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

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
          max_participants: 2,
          enable_chat: true,
          start_video_off: type === 'voice',
          start_audio_off: false,
          enable_screenshare: false,
          enable_recording: false,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Daily.co room creation failed:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create call room' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const room = await response.json();

    return new Response(
      JSON.stringify({ url: room.url, name: room.name }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('create-daily-room error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
