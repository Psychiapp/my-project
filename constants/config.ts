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
      amount: 9500,
      display: '$95/month',
      description: '1 live call/week + 2 chat sessions',
      chatSessionsPerMonth: 2,
      liveCallsPerWeek: 1, // phone or video
    },
    standard: {
      amount: 14500,
      display: '$145/month',
      description: '2 live calls/week + 3 chat sessions',
      chatSessionsPerMonth: 3,
      liveCallsPerWeek: 2, // phone or video
    },
    premium: {
      amount: 17500,
      display: '$175/month',
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
export const StripeConfig = {
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

// External URLs - UPDATE THESE when you deploy your website
export const ExternalUrls = {
  // Legal documents - replace with your actual hosted URLs before App Store submission
  termsOfService: 'https://psychi.app/terms-of-use.pdf',
  privacyPolicy: 'https://psychi.app/privacy-policy.pdf',
  supporterGuidelines: 'https://psychi.app/supporter-guidelines',

  // Contact
  supportEmail: 'psychiapp@outlook.com',

  // Social
  instagram: 'https://www.instagram.com/psychi.app/',
};
