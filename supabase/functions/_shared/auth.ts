/**
 * Shared auth utilities for Supabase Edge Functions.
 *
 * Two guards:
 *  - requireUserAuth: for user-facing functions — verifies JWT, returns the authenticated user
 *  - requireServiceRole: for cron/internal functions — checks that the caller presents the service role key
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

export interface AuthedUser {
  id: string;
  email?: string;
}

/**
 * Verify the request's JWT and return the authenticated user.
 * Returns null if the token is missing or invalid.
 */
export async function requireUserAuth(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return null;

  return { id: user.id, email: user.email };
}

/**
 * Verify the request was made with the service role key.
 * Used for cron-triggered functions that must NOT be callable by regular users.
 */
export function requireServiceRole(req: Request): boolean {
  const authHeader = req.headers.get('Authorization');
  return authHeader === `Bearer ${supabaseServiceKey}`;
}

export const unauthorizedResponse = (corsHeaders: Record<string, string>) =>
  new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
