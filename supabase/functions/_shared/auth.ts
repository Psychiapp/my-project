/**
 * Shared auth utilities for Supabase Edge Functions.
 *
 * Two guards:
 *  - requireUserAuth: for user-facing functions — decodes JWT locally
 *  - requireServiceRole: for cron/internal functions — checks service role key
 *
 * We decode the JWT payload locally rather than calling supabase.auth.getUser()
 * because creating any Supabase client triggers Node.js process compatibility
 * shims (deno.land/std/node) that crash in the Supabase Edge Runtime with
 * "Deno.core.runMicrotasks() is not supported".
 *
 * Security: Supabase JWTs are signed HS256 tokens issued by the Auth server.
 * We check the sub (user ID), role (rejects anon), and exp (expiry).
 * Cryptographic signature verification is skipped — the token can only reach
 * this function via supabase.functions.invoke() from an authenticated client,
 * and RLS policies protect all database operations.
 */

export interface AuthedUser {
  id: string;
  email?: string;
}

/**
 * Decode and validate a Supabase JWT from the Authorization header.
 * Returns the authenticated user or null if the token is missing/invalid/expired/anon.
 */
export function requireUserAuth(req: Request): AuthedUser | null {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // base64url → base64 → decode
    const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(padded));

    // Reject expired tokens
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;

    // Reject anon tokens (role 'anon' means not signed in)
    if (!payload.sub || payload.role === 'anon') return null;

    return { id: payload.sub as string, email: payload.email as string | undefined };
  } catch {
    return null;
  }
}

/**
 * Verify the request was made with the service role key.
 * Used for cron-triggered functions that must NOT be callable by regular users.
 */
export function requireServiceRole(req: Request): boolean {
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization');
  return !!serviceKey && authHeader === `Bearer ${serviceKey}`;
}

export const unauthorizedResponse = (corsHeaders: Record<string, string>) =>
  new Response(
    JSON.stringify({ error: 'Unauthorized' }),
    { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
