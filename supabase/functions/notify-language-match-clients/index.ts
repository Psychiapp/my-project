/**
 * notify-language-match-clients
 *
 * Called by a database trigger when a supporter saves or updates their languages_spoken.
 * Identifies clients who were waiting for a supporter in that language and:
 *   - PENDING clients  (pending_language_match = true): notified + re-matching attempted
 *   - FALLBACK clients (language_match_status = 'fallback'): notified only, no auto re-match
 *
 * Input: { supporter_id: string, languages: string[] }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { requireServiceRole, unauthorizedResponse } from '../_shared/auth.ts';

const SUPABASE_URL       = Deno.env.get('SUPABASE_URL') as string;
const SERVICE_ROLE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const EXPO_PUSH_URL      = 'https://exp.host/--/api/v2/push/send';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (!requireServiceRole(req)) return unauthorizedResponse(corsHeaders);

  try {
    const { supporter_id, languages } = await req.json() as {
      supporter_id: string;
      languages: string[];
    };

    if (!supporter_id || !languages?.length) {
      return new Response(
        JSON.stringify({ error: 'supporter_id and languages are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const results: Record<string, unknown> = {};

    for (const language of languages) {
      const langKey = language.toLowerCase();
      results[language] = { pending: 0, fallback: 0, errors: [] as string[] };
      const r = results[language] as { pending: number; fallback: number; errors: string[] };

      // ── 1. PENDING CLIENTS ──────────────────────────────────────────────
      // Clients with no current assignment waiting for this language
      const { data: pendingClients } = await supabase
        .from('profiles')
        .select('id, full_name, expo_push_token, preferred_language')
        .eq('role', 'client')
        .eq('pending_language_match', true)
        .ilike('preferred_language', langKey);

      for (const client of pendingClients ?? []) {
        try {
          // Send "a supporter just joined" push notification
          if (client.expo_push_token) {
            await sendPush(client.expo_push_token, {
              title: 'Great news!',
              body: `A supporter who speaks ${client.preferred_language} just joined Psychi. Open the app to get matched.`,
              data: { type: 'language_match_available', language: client.preferred_language },
            });
          }

          // Attempt re-matching — the new supporter is now in the pool
          const { error: matchErr } = await supabase.rpc('match_and_assign_client', {
            p_client_id: client.id,
          });

          if (matchErr) {
            // Re-match RPC failed — keep pending flag, they'll see the notification
            console.warn(`Re-match failed for client ${client.id}:`, matchErr.message);
            r.errors.push(`Re-match failed for ${client.id}: ${matchErr.message}`);
          } else {
            // Successfully matched — clear the pending flag
            await supabase
              .from('profiles')
              .update({ pending_language_match: false })
              .eq('id', client.id);
          }

          r.pending++;
        } catch (err: any) {
          r.errors.push(`Pending client ${client.id}: ${err.message}`);
        }
      }

      // ── 2. FALLBACK CLIENTS ─────────────────────────────────────────────
      // Clients who got an English-speaking supporter but prefer this language
      const { data: fallbackAssignments } = await supabase
        .from('client_assignments')
        .select(`
          client_id,
          profiles!client_assignments_client_id_fkey (
            id,
            expo_push_token,
            preferred_language
          )
        `)
        .eq('status', 'active')
        .eq('language_match_status', 'fallback')
        .not('client_id', 'is', null);

      const fallbackClients = (fallbackAssignments ?? []).filter((a: any) => {
        const pl = a.profiles?.preferred_language?.toLowerCase() ?? '';
        return pl === langKey;
      });

      for (const assignment of fallbackClients) {
        const client = assignment.profiles as any;
        if (!client) continue;
        try {
          if (client.expo_push_token) {
            await sendPush(client.expo_push_token, {
              title: 'Language match now available',
              body: `A supporter who speaks ${client.preferred_language} is now available on Psychi. You can request a new match from your profile settings.`,
              data: {
                type: 'language_fallback_upgrade_available',
                language: client.preferred_language,
              },
            });
          }
          r.fallback++;
        } catch (err: any) {
          r.errors.push(`Fallback client ${client.id}: ${err.message}`);
        }
      }
    }

    console.log('Language match notifications result:', JSON.stringify(results));
    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('notify-language-match-clients error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendPush(
  token: string,
  { title, body, data }: { title: string; body: string; data: Record<string, unknown> }
) {
  const res = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default', priority: 'high' }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Expo push failed: ${JSON.stringify(json)}`);
  return json;
}
