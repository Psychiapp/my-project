/**
 * Psychi App Configuration
 */

export const Config = {
  // App Info
  appName: 'Psychi',
  appTagline: 'Peer Support, Reimagined',
  launchDate: 'April 1st, 2026',

  // Pricing (in cents)
  pricing: {
    chat: {
      amount: 700,
      display: '$7',
      supporterCut: 525,
      platformCut: 175,
    },
    phone: {
      amount: 1500,
      display: '$15',
      supporterCut: 1125,
      platformCut: 375,
    },
    video: {
      amount: 2000,
      display: '$20',
      supporterCut: 1500,
      platformCut: 500,
    },
  },

  // Subscription tiers (monthly, in cents)
  subscriptions: {
    basic: {
      amount: 5500,
      display: '$55/month',
      description: '1 live call/week + 2 chat sessions',
      chatSessionsPerMonth: 2,
      liveCallsPerWeek: 1, // phone or video
    },
    standard: {
      amount: 10900,
      display: '$109/month',
      description: '2 live calls/week + 3 chat sessions',
      chatSessionsPerMonth: 3,
      liveCallsPerWeek: 2, // phone or video
    },
    premium: {
      amount: 14900,
      display: '$149/month',
      description: '3 live calls/week + unlimited chat',
      chatSessionsPerMonth: -1, // unlimited
      liveCallsPerWeek: 3, // phone or video
    },
  },

  // Session durations (in minutes)
  sessionDurations: {
    chat: 25,
    phone: 45,
    video: 45,
  },

  // Supporter commission
  supporterCommission: 0.75, // 75%
  platformCommission: 0.25, // 25%
};

// Supabase config - use environment variables in production
export const SupabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
};

// Stripe config
// TEMPORARY: Hardcoded test key for testing. Remove after testing!
const STRIPE_TEST_MODE = true;
export const StripeConfig = {
  publishableKey: STRIPE_TEST_MODE
    ? 'pk_test_51Sl1DV5j4QYgLJTnG2TCfCrF39yPYtxi7eKOg8ptaNiAGB6gF5FyHwreNKdAIZLRqOda3LVPIH2q1eYhlRBw3E6100ugw5GH9g'
    : (process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''),
};

// Sentry config
export const SentryConfig = {
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__, // Only enable in production builds
};

// External URLs
export const ExternalUrls = {
  // Legal documents
  termsOfService: 'https://psychimobile.com/terms-of-service.html',
  privacyPolicy: 'https://psychimobile.com/privacy-policy.html',
  safetyPolicy: 'https://psychimobile.com/safety-policy.html',
  refundPolicy: 'https://psychimobile.com/refund-policy.html',
  confidentialityAgreement: 'https://psychimobile.com/privacy-policy.html', // Using privacy policy for now
  supporterGuidelines: 'https://psychimobile.com/safety-policy.html', // Using safety policy for now

  // Contact
  supportEmail: 'psychiapp@outlook.com',

  // Social
  instagram: 'https://www.instagram.com/psychi.app/',
};
