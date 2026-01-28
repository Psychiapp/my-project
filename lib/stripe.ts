import { Alert, Linking } from 'react-native';
import { StripeConfig, Config, SupabaseConfig } from '@/constants/config';
import type { StripeConnectStatus } from '@/types/database';

// Conditionally import Stripe to avoid crash in Expo Go
let initPaymentSheet: any = null;
let presentPaymentSheet: any = null;
export let stripeAvailable = false;

try {
  const stripe = require('@stripe/stripe-react-native');
  initPaymentSheet = stripe.initPaymentSheet;
  presentPaymentSheet = stripe.presentPaymentSheet;
  stripeAvailable = true;
} catch (e) {
  console.log('Stripe native module not available (running in Expo Go)');
}

// Stripe integration with payment sheet support

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

interface CreatePaymentParams {
  amount: number; // in cents
  currency?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

// Create a payment intent via Supabase Edge Function
export async function createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntentResponse> {
  const { amount, currency = 'usd', customerId, metadata } = params;

  if (!SupabaseConfig.url || !SupabaseConfig.anonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${SupabaseConfig.url}/functions/v1/create-payment-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
    },
    body: JSON.stringify({ amount, currency, customerId, metadata }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment intent');
  }

  return response.json();
}

// Confirm payment
export async function confirmPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
  // In production, this would use Stripe SDK
  console.log('Confirming payment with secret:', clientSecret);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1500);
  });
}

// Get saved payment methods for a customer
export async function getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
  // TODO: Implement Stripe API call when backend is ready
  // For now, return empty array - payment methods will be added during checkout
  if (!StripeConfig.publishableKey) {
    return [];
  }

  // In production, this would fetch from your backend:
  // const response = await fetch(`${API_URL}/payment-methods/${customerId}`);
  // return response.json();

  return [];
}

// Add a new payment method
export async function addPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('Adding payment method:', { customerId, paymentMethodId });
  return { success: true };
}

// Create or update subscription
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  paymentMethodId: string;
}): Promise<{ subscriptionId: string; status: string }> {
  console.log('Creating subscription:', params);

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        subscriptionId: 'sub_' + Date.now(),
        status: 'active',
      });
    }, 1500);
  });
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string): Promise<{ success: boolean }> {
  console.log('Canceling subscription:', subscriptionId);
  return { success: true };
}

// Types
export interface PaymentMethod {
  id: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  amount: number;
  interval: 'month' | 'year';
  features: string[];
}

// Subscription plans
export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    priceId: 'price_basic_monthly',
    amount: 9500,
    interval: 'month',
    features: [
      '4 chat sessions per month',
      'Message your supporter',
      'Session history',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    priceId: 'price_standard_monthly',
    amount: 14500,
    interval: 'month',
    features: [
      '4 chat sessions per month',
      '2 phone sessions per month',
      'Priority matching',
      'Extended session notes',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceId: 'price_premium_monthly',
    amount: 17500,
    interval: 'month',
    features: [
      '4 chat sessions per month',
      '2 phone sessions per month',
      '2 video sessions per month',
      'Priority matching',
      '24/7 message support',
      'Wellness resources',
    ],
  },
];

// Payment Sheet Functions

/**
 * Initialize and present payment sheet for session booking
 */
export async function processSessionPayment(
  sessionType: 'chat' | 'phone' | 'video',
  supporterId: string,
  sessionDate: string
): Promise<boolean> {
  const pricing = Config.pricing[sessionType];

  // Check if Stripe is configured
  if (!StripeConfig.publishableKey || !stripeAvailable) {
    Alert.alert(
      'Payment Not Available',
      'Payment processing is not available in this environment.',
      [{ text: 'OK' }]
    );
    return false;
  }

  try {
    // Create payment intent on your backend
    const paymentIntent = await createPaymentIntent({
      amount: pricing.amount,
      metadata: { sessionType, supporterId, sessionDate },
    });

    // Initialize payment sheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: Config.appName,
      paymentIntentClientSecret: paymentIntent.clientSecret,
      allowsDelayedPaymentMethods: false,
    });

    if (initError) {
      console.error('Error initializing payment sheet:', initError);
      Alert.alert('Error', 'Unable to load payment form. Please try again.');
      return false;
    }

    // Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code !== 'Canceled') {
        Alert.alert('Payment Failed', presentError.message || 'Please try again.');
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Payment error:', error);
    Alert.alert('Error', 'Payment failed. Please try again.');
    return false;
  }
}

/**
 * Process subscription payment with payment sheet
 */
export async function processSubscriptionPaymentSheet(
  tier: 'basic' | 'standard' | 'premium'
): Promise<boolean> {
  const plan = subscriptionPlans.find(p => p.id === tier);
  if (!plan) return false;

  // Check if Stripe is configured
  if (!StripeConfig.publishableKey || !stripeAvailable) {
    Alert.alert(
      'Payment Not Available',
      'Payment processing is not available in this environment.',
      [{ text: 'OK' }]
    );
    return false;
  }

  try {
    // Create payment intent for first month
    const paymentIntent = await createPaymentIntent({
      amount: plan.amount,
      metadata: { type: 'subscription', tier },
    });

    // Initialize payment sheet
    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: Config.appName,
      paymentIntentClientSecret: paymentIntent.clientSecret,
      allowsDelayedPaymentMethods: false,
    });

    if (initError) {
      console.error('Error initializing payment sheet:', initError);
      Alert.alert('Error', 'Unable to load payment form. Please try again.');
      return false;
    }

    // Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code !== 'Canceled') {
        Alert.alert('Payment Failed', presentError.message || 'Please try again.');
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Subscription payment error:', error);
    Alert.alert('Error', 'Payment failed. Please try again.');
    return false;
  }
}

// ============================================
// STRIPE CONNECT FUNCTIONS (Supporter Payouts)
// ============================================

interface ConnectAccountResponse {
  accountId: string;
  status: StripeConnectStatus;
}

interface AccountLinkResponse {
  url: string;
  expiresAt: number;
}

interface AccountStatusResponse {
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

interface PayoutResponse {
  transferId: string;
  amount: number;
  status: string;
  payoutId?: string;
}

/**
 * Create a Stripe Connect Express account for a supporter
 */
export async function createConnectAccount(
  supporterId: string,
  email: string,
  fullName: string
): Promise<ConnectAccountResponse> {
  if (!SupabaseConfig.url || !SupabaseConfig.anonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${SupabaseConfig.url}/functions/v1/create-connect-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
    },
    body: JSON.stringify({ supporterId, email, fullName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create Connect account');
  }

  return response.json();
}

/**
 * Get an onboarding link for a Stripe Connect account
 */
export async function getConnectOnboardingLink(
  accountId: string,
  refreshUrl?: string,
  returnUrl?: string
): Promise<AccountLinkResponse> {
  if (!SupabaseConfig.url || !SupabaseConfig.anonKey) {
    throw new Error('Supabase configuration missing');
  }

  const response = await fetch(`${SupabaseConfig.url}/functions/v1/create-account-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
    },
    body: JSON.stringify({ accountId, refreshUrl, returnUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create account link');
  }

  return response.json();
}

/**
 * Open Stripe Connect onboarding in browser
 */
export async function openConnectOnboarding(accountId: string): Promise<boolean> {
  try {
    const { url } = await getConnectOnboardingLink(accountId);

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      Alert.alert('Error', 'Unable to open browser for account setup.');
      return false;
    }
  } catch (error) {
    console.error('Onboarding error:', error);
    Alert.alert('Error', 'Failed to start account setup. Please try again.');
    return false;
  }
}

/**
 * Request a payout to a supporter's connected account
 */
export async function requestPayout(
  supporterId: string,
  amount: number,
  stripeConnectId: string
): Promise<PayoutResponse> {
  if (!SupabaseConfig.url || !SupabaseConfig.anonKey) {
    throw new Error('Supabase configuration missing');
  }

  // Minimum payout check
  if (amount < 2500) {
    throw new Error('Minimum payout amount is $25.00');
  }

  const response = await fetch(`${SupabaseConfig.url}/functions/v1/create-payout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
    },
    body: JSON.stringify({ supporterId, amount, stripeConnectId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to process payout');
  }

  return response.json();
}

/**
 * Check if a supporter's Connect account is ready for payouts
 */
export function isPayoutReady(
  stripeConnectId: string | null,
  stripeConnectStatus: StripeConnectStatus | null,
  payoutsEnabled: boolean
): { ready: boolean; message: string } {
  if (!stripeConnectId) {
    return {
      ready: false,
      message: 'Set up your payout account to receive earnings.',
    };
  }

  if (stripeConnectStatus === 'pending') {
    return {
      ready: false,
      message: 'Complete your account setup to receive payouts.',
    };
  }

  if (stripeConnectStatus === 'pending_verification') {
    return {
      ready: false,
      message: 'Your account is being verified. This usually takes 1-2 business days.',
    };
  }

  if (!payoutsEnabled) {
    return {
      ready: false,
      message: 'Payouts are temporarily disabled. Please update your account information.',
    };
  }

  if (stripeConnectStatus === 'restricted' || stripeConnectStatus === 'disabled') {
    return {
      ready: false,
      message: 'Your account has restrictions. Please contact support.',
    };
  }

  return {
    ready: true,
    message: 'Your account is ready to receive payouts.',
  };
}
