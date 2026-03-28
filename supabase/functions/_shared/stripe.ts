/**
 * Shared Stripe configuration with test/live mode toggle
 *
 * Usage:
 *   import { getStripe, getWebhookSecret, getStripeMode } from '../_shared/stripe.ts';
 *   const stripe = getStripe();
 *
 * Environment variables required:
 *   STRIPE_MODE: 'test' or 'live' (defaults to 'live' if not set)
 *   STRIPE_SECRET_KEY_TEST: Test mode secret key (sk_test_...)
 *   STRIPE_SECRET_KEY_LIVE: Live mode secret key (sk_live_...)
 *   STRIPE_WEBHOOK_SECRET_TEST: Test mode webhook secret (whsec_...)
 *   STRIPE_WEBHOOK_SECRET_LIVE: Live mode webhook secret (whsec_...)
 */

import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno';

export type StripeMode = 'test' | 'live';

/**
 * Get current Stripe mode from environment
 */
export function getStripeMode(): StripeMode {
  const mode = Deno.env.get('STRIPE_MODE')?.toLowerCase();
  if (mode === 'test') return 'test';
  return 'live'; // Default to live for safety
}

/**
 * Get the appropriate Stripe secret key based on current mode
 */
export function getStripeSecretKey(): string {
  const mode = getStripeMode();

  if (mode === 'test') {
    const testKey = Deno.env.get('STRIPE_SECRET_KEY_TEST');
    if (testKey) {
      console.log('[Stripe] Using TEST mode');
      return testKey;
    }
    // Fallback to legacy key if test key not set
    console.warn('[Stripe] STRIPE_SECRET_KEY_TEST not set, falling back to STRIPE_SECRET_KEY');
  } else {
    const liveKey = Deno.env.get('STRIPE_SECRET_KEY_LIVE');
    if (liveKey) {
      console.log('[Stripe] Using LIVE mode');
      return liveKey;
    }
    // Fallback to legacy key if live key not set
    console.warn('[Stripe] STRIPE_SECRET_KEY_LIVE not set, falling back to STRIPE_SECRET_KEY');
  }

  // Fallback to legacy single key (backwards compatibility)
  const legacyKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!legacyKey) {
    throw new Error('[Stripe] No Stripe secret key configured');
  }
  return legacyKey;
}

/**
 * Get the appropriate webhook secret based on current mode
 */
export function getWebhookSecret(): string {
  const mode = getStripeMode();

  if (mode === 'test') {
    const testSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST');
    if (testSecret) return testSecret;
    // Fallback to legacy secret
    console.warn('[Stripe] STRIPE_WEBHOOK_SECRET_TEST not set, falling back to STRIPE_WEBHOOK_SECRET');
  } else {
    const liveSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET_LIVE');
    if (liveSecret) return liveSecret;
    // Fallback to legacy secret
    console.warn('[Stripe] STRIPE_WEBHOOK_SECRET_LIVE not set, falling back to STRIPE_WEBHOOK_SECRET');
  }

  // Fallback to legacy single secret (backwards compatibility)
  const legacySecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!legacySecret) {
    throw new Error('[Stripe] No webhook secret configured');
  }
  return legacySecret;
}

/**
 * Create a Stripe client with the appropriate key for current mode
 */
export function getStripe(): Stripe {
  return new Stripe(getStripeSecretKey(), {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  });
}

/**
 * Check if currently in test mode
 */
export function isTestMode(): boolean {
  return getStripeMode() === 'test';
}
