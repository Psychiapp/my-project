import { Alert, Linking, Platform } from 'react-native';
import { StripeConfig, Config, SupabaseConfig } from '@/constants/config';
import type { StripeConnectStatus } from '@/types/database';

// Conditionally import Stripe to avoid crash in Expo Go and on web
let initPaymentSheet: any = null;
let presentPaymentSheet: any = null;
export let stripeAvailable = false;

// Only attempt to load Stripe native module on native platforms (not web)
// Using a function wrapper to hide require from Metro's static analysis
const loadStripeNative = () => {
  if (Platform.OS === 'web') return null;
  try {
    // Dynamic require to prevent Metro from bundling for web
    const moduleName = '@stripe/stripe-react-native';
    return require(moduleName);
  } catch (e) {
    // Stripe native module not available (running in Expo Go)
    return null;
  }
};

const stripe = loadStripeNative();
if (stripe) {
  initPaymentSheet = stripe.initPaymentSheet;
  presentPaymentSheet = stripe.presentPaymentSheet;
  stripeAvailable = true;
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
  supporterStripeAccountId?: string; // For Connect split payments (75% to supporter, 25% platform fee)
}

// Create a payment intent via Supabase Edge Function
export async function createPaymentIntent(params: CreatePaymentParams): Promise<PaymentIntentResponse> {
  const { amount, currency = 'usd', customerId, metadata, supporterStripeAccountId } = params;

  try {
    // Use supabase.functions.invoke so the user's session JWT is automatically attached.
    // Raw fetch with just the anon key was rejected after we added auth to the function.
    const { supabase } = await import('@/lib/supabase');
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.functions.invoke('create-payment-intent', {
      body: { amount, currency, customerId, metadata, supporterStripeAccountId },
    });

    if (error) throw new Error(error.message || 'Failed to create payment intent');
    if (!data?.clientSecret) throw new Error('No client secret returned');

    return data as PaymentIntentResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Unable to connect to payment service. Please check your internet connection.');
    }
    if (error instanceof Error) throw error;
    throw new Error('Payment service unavailable. Please try again later.');
  }
}

// Confirm payment using Stripe Payment Sheet
export async function confirmPayment(clientSecret: string): Promise<{ success: boolean; error?: string }> {
  // If Stripe native module isn't available, return error
  if (!stripeAvailable || !presentPaymentSheet) {
    console.warn('Stripe native module not available for payment confirmation');
    return {
      success: false,
      error: 'Payment processing is not available in this environment. Please use a production build.'
    };
  }

  try {
    // Present the payment sheet to confirm payment
    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === 'Canceled') {
        return { success: false, error: 'Payment cancelled' };
      }
      console.error('Payment confirmation error:', error);
      return { success: false, error: error.message || 'Payment failed' };
    }

    // Payment was successful
    return { success: true };
  } catch (err) {
    console.error('Unexpected payment error:', err);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
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
  return { success: true };
}

// Create or update subscription
export async function createSubscription(params: {
  customerId: string;
  priceId: string;
  paymentMethodId: string;
}): Promise<{ subscriptionId: string; status: string }> {
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
    amount: 5500,
    interval: 'month',
    features: [
      '1 live phone or video call per week',
      '2 chat sessions per month',
      'Session history',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    priceId: 'price_standard_monthly',
    amount: 10900,
    interval: 'month',
    features: [
      '2 live phone or video calls per week',
      '3 chat sessions per month',
      'Priority matching',
      'Extended session notes',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    priceId: 'price_premium_monthly',
    amount: 14900,
    interval: 'month',
    features: [
      '3 live phone or video calls per week',
      'Unlimited chat sessions',
      'Priority matching',
      '24/7 message support',
      'Wellness resources',
    ],
  },
];

// Payment Sheet Functions

/**
 * Result of a session payment
 */
export interface SessionPaymentResult {
  success: boolean;
  paymentIntentId?: string;
}

/**
 * Map a Stripe payment sheet error to a user-friendly message.
 * Stripe error codes: https://stripe.com/docs/error-codes
 */
function stripeErrorMessage(error: { code?: string; message?: string }): string {
  switch (error.code) {
    case 'Canceled':
      return 'Payment was cancelled.';
    case 'Failed':
      return error.message || 'Your payment was declined. Please check your card details and try again.';
    case 'Timeout':
      return 'The payment timed out. Please check your connection and try again.';
    case 'Unknown':
      return 'An unexpected error occurred. Please try again.';
    default:
      // Surface the Stripe message when available — it's already user-facing
      return error.message || 'Payment could not be completed. Please try again.';
  }
}

/** Map a network/fetch error to a user-friendly message. */
function networkOrGenericMessage(message: string): string {
  if (message.includes('Network') || message.includes('network') || message.includes('fetch')) {
    return 'Could not connect to the payment service. Please check your internet connection and try again.';
  }
  if (message.includes('Unauthorized') || message.includes('401')) {
    return 'Authentication error. Please sign out and sign back in, then try again.';
  }
  return 'Something went wrong with your payment. Please try again or contact support.';
}

/**
 * Process PAYG payment for a live support request.
 * Called before a request is created, so no supporter is assigned yet —
 * no Connect account is used; the platform holds the funds and pays out
 * the supporter after they accept.
 */
export async function processLiveSupportPayment(
  sessionType: 'chat' | 'phone' | 'video',
  clientId: string
): Promise<SessionPaymentResult> {
  const pricing = Config.pricing[sessionType];

  if (!StripeConfig.publishableKey || !stripeAvailable || !initPaymentSheet) {
    Alert.alert(
      'Payment Not Available',
      'Payment processing is not available in this environment.',
      [{ text: 'OK' }]
    );
    return { success: false };
  }

  try {
    const paymentIntent = await createPaymentIntent({
      amount: pricing.amount,
      metadata: {
        type: 'live_support_payg',
        sessionType,
        clientId,
      },
    });

    const { error: initError } = await initPaymentSheet({
      merchantDisplayName: Config.appName,
      paymentIntentClientSecret: paymentIntent.clientSecret,
      allowsDelayedPaymentMethods: false,
    });

    if (initError) {
      console.error('Error initializing payment sheet:', initError);
      Alert.alert('Error', 'Unable to load payment form. Please try again.');
      return { success: false };
    }

    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      if (presentError.code !== 'Canceled') {
        Alert.alert('Payment Failed', presentError.message || 'Please try again.');
      }
      return { success: false };
    }

    return { success: true, paymentIntentId: paymentIntent.paymentIntentId };
  } catch (error) {
    console.error('Live support payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('Payment Error', networkOrGenericMessage(message));
    return { success: false };
  }
}

/**
 * Initialize and present payment sheet for session booking
 * If supporterStripeAccountId is provided, payment is split 75/25 (supporter/platform)
 * Returns the payment intent ID on success for refund tracking
 */
export async function processSessionPayment(
  sessionType: 'chat' | 'phone' | 'video',
  supporterId: string,
  sessionDate: string,
  supporterStripeAccountId?: string
): Promise<SessionPaymentResult> {
  const pricing = Config.pricing[sessionType];

  // Check if Stripe is configured
  if (!StripeConfig.publishableKey || !stripeAvailable) {
    Alert.alert(
      'Payment Not Available',
      'Payment processing is not available in this environment.',
      [{ text: 'OK' }]
    );
    return { success: false };
  }

  try {
    // Create payment intent on your backend
    // If supporter has a Stripe Connect account, payment is split 75% to supporter, 25% platform fee
    const paymentIntent = await createPaymentIntent({
      amount: pricing.amount,
      metadata: { sessionType, supporterId, sessionDate },
      supporterStripeAccountId,
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
      return { success: false };
    }

    // Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      console.error('Payment sheet error:', presentError.code, presentError.message);
      if (presentError.code !== 'Canceled') {
        Alert.alert('Payment Failed', stripeErrorMessage(presentError));
      }
      return { success: false };
    }

    return { success: true, paymentIntentId: paymentIntent.paymentIntentId };
  } catch (error) {
    console.error('Payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('Payment Error', networkOrGenericMessage(message));
    return { success: false };
  }
}

/**
 * Process subscription payment with payment sheet
 * If supporterStripeAccountId is provided, payment is split 75/25 (supporter/platform)
 * clientId is required for webhook fallback to update subscription if client-side update fails
 */
export async function processSubscriptionPaymentSheet(
  tier: 'basic' | 'standard' | 'premium',
  clientId: string,
  supporterStripeAccountId?: string
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
    // If supporter has a Stripe Connect account, payment is split 75% to supporter, 25% platform fee
    // Include clientId in metadata so webhook can update subscription as fallback
    const paymentIntent = await createPaymentIntent({
      amount: plan.amount,
      metadata: { type: 'subscription', tier, client_id: clientId },
      supporterStripeAccountId,
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
      console.error('Subscription payment sheet error:', presentError.code, presentError.message);
      if (presentError.code !== 'Canceled') {
        Alert.alert('Payment Failed', stripeErrorMessage(presentError));
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error('Subscription payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    Alert.alert('Payment Error', networkOrGenericMessage(message));
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
  const { supabase } = await import('@/lib/supabase');
  if (!supabase) throw new Error('App configuration missing. Please restart the app.');

  try {
    const { data, error } = await supabase.functions.invoke('create-connect-account', {
      body: { supporterId, email, fullName },
    });

    if (error) throw new Error(error.message || 'Failed to create payout account');
    return data as ConnectAccountResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Unable to connect. Please check your internet connection.');
    }
    throw error;
  }
}

/**
 * Get an onboarding link for a Stripe Connect account
 */
export async function getConnectOnboardingLink(
  accountId: string,
  refreshUrl?: string,
  returnUrl?: string
): Promise<AccountLinkResponse> {
  const { supabase } = await import('@/lib/supabase');
  if (!supabase) throw new Error('App configuration missing. Please restart the app.');

  try {
    const { data, error } = await supabase.functions.invoke('create-account-link', {
      body: { accountId, refreshUrl, returnUrl },
    });

    if (error) throw new Error(error.message || 'Failed to start account setup');
    return data as AccountLinkResponse;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Unable to connect. Please check your internet connection.');
    }
    throw error;
  }
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to start account setup. Please try again.';
    Alert.alert('Error', errorMessage);
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
  if (amount < 2500) {
    throw new Error('Minimum payout amount is $25.00');
  }

  const { supabase } = await import('@/lib/supabase');
  if (!supabase) throw new Error('Supabase configuration missing');

  const { data, error } = await supabase.functions.invoke('create-payout', {
    body: { supporterId, amount, stripeConnectId },
  });

  if (error) throw new Error(error.message || 'Failed to process payout');
  return data as PayoutResponse;
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
