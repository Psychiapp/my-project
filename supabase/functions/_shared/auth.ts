/**
 * Shared auth utilities for Supabase Edge Functions.
 *
 * Two guards:
 *  - requireUserAuth: for user-facing functions — verifies JWT via auth.admin.getUser()
 *  - requireServiceRole: for cron/internal functions — checks service role key
 *
 * NOTE: Do NOT create a Supabase client with the anon key here. Doing so triggers
 * Node.js process compatibility shims (deno.land/std/node) that are not supported
 * in the Supabase Edge Runtime and cause "Deno.core.runMicrotasks() is not supported".
 * Use auth.admin.getUser(token) on the service role client instead.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

export interface AuthedUser {
  id: string;
  email?: string;
}

/**
 * Verify the request's JWT and return the authenticated user.
 * Uses auth.admin.getUser(token) on the service role client — the correct
 * server-side JWT verification pattern for Supabase Edge Functions.
 */
export async function requireUserAuth(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error } = await supabase.auth.admin.getUser(token);
    if (error || !user) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
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
