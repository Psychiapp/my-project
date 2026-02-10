import { Alert } from 'react-native';
import { StripeConfig, Config, SupabaseConfig } from '@/constants/config';

export interface RefundRequest {
  sessionId: string;
  paymentIntentId: string;
  amount: number;
  reason: 'supporter_cancelled' | 'supporter_rescheduled' | 'client_cancelled' | 'no_show' | 'other';
  initiatedBy: 'supporter' | 'client' | 'admin';
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface SessionRefundInfo {
  sessionId: string;
  clientName: string;
  clientEmail: string;
  sessionType: 'chat' | 'phone' | 'video';
  amount: number;
  scheduledAt: string;
}

// Refund policies
export const REFUND_POLICIES = {
  // Full refund if cancelled more than 24 hours before
  FULL_REFUND_HOURS: 24,
  // Partial refund (50%) if cancelled within 24 hours
  PARTIAL_REFUND_PERCENTAGE: 50,
  // No refund if cancelled within 2 hours (unless supporter initiated)
  NO_REFUND_HOURS: 2,
  // Supporter-initiated cancellations always get full refund
  SUPPORTER_ALWAYS_FULL_REFUND: true,
};

/**
 * Calculate refund amount based on cancellation timing and initiator
 */
export function calculateRefundAmount(
  originalAmount: number,
  scheduledTime: Date,
  initiatedBy: 'supporter' | 'client'
): { amount: number; percentage: number; reason: string } {
  // Supporter-initiated cancellations always get full refund
  if (initiatedBy === 'supporter') {
    return {
      amount: originalAmount,
      percentage: 100,
      reason: 'Full refund - cancelled by supporter',
    };
  }

  const now = new Date();
  const hoursUntilSession = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilSession >= REFUND_POLICIES.FULL_REFUND_HOURS) {
    return {
      amount: originalAmount,
      percentage: 100,
      reason: 'Full refund - cancelled more than 24 hours before session',
    };
  }

  if (hoursUntilSession >= REFUND_POLICIES.NO_REFUND_HOURS) {
    const partialAmount = Math.round(originalAmount * (REFUND_POLICIES.PARTIAL_REFUND_PERCENTAGE / 100));
    return {
      amount: partialAmount,
      percentage: REFUND_POLICIES.PARTIAL_REFUND_PERCENTAGE,
      reason: 'Partial refund - cancelled within 24 hours of session',
    };
  }

  return {
    amount: 0,
    percentage: 0,
    reason: 'No refund - cancelled within 2 hours of session',
  };
}

/**
 * Process a refund for a cancelled or rescheduled session
 */
export async function processRefund(request: RefundRequest): Promise<RefundResult> {
  console.log('Processing refund:', request);

  // Check if Stripe is configured
  if (!StripeConfig.publishableKey) {
    console.warn('Stripe not configured - refund cannot be processed');
    return {
      success: false,
      error: 'Payment processing is not configured. Please contact support.',
    };
  }

  // Check if Supabase is configured
  if (!SupabaseConfig.url || !SupabaseConfig.anonKey) {
    console.warn('Supabase not configured - refund cannot be processed');
    return {
      success: false,
      error: 'Backend not configured. Please contact support.',
    };
  }

  try {
    const response = await fetch(`${SupabaseConfig.url}/functions/v1/process-refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to process refund',
      };
    }

    return {
      success: true,
      refundId: data.refundId,
    };
  } catch (error: any) {
    console.error('Refund error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process refund',
    };
  }
}

/**
 * Cancel a session and process refund
 */
export async function cancelSessionWithRefund(
  sessionInfo: SessionRefundInfo,
  reason: string,
  initiatedBy: 'supporter' | 'client'
): Promise<{ success: boolean; refundAmount: number; error?: string }> {
  const scheduledTime = new Date(sessionInfo.scheduledAt);
  const refundCalc = calculateRefundAmount(sessionInfo.amount, scheduledTime, initiatedBy);

  if (refundCalc.amount === 0 && initiatedBy === 'client') {
    return {
      success: true,
      refundAmount: 0,
    };
  }

  const refundResult = await processRefund({
    sessionId: sessionInfo.sessionId,
    paymentIntentId: 'pi_' + sessionInfo.sessionId, // In production, get actual payment intent ID
    amount: refundCalc.amount,
    reason: initiatedBy === 'supporter' ? 'supporter_cancelled' : 'client_cancelled',
    initiatedBy,
  });

  if (!refundResult.success) {
    return {
      success: false,
      refundAmount: 0,
      error: refundResult.error,
    };
  }

  // Send notification to client about refund
  await notifyClientOfRefund(sessionInfo, refundCalc);

  return {
    success: true,
    refundAmount: refundCalc.amount,
  };
}

/**
 * Reschedule a session - may involve partial refund depending on policy
 */
export async function rescheduleSession(
  sessionInfo: SessionRefundInfo,
  newScheduledTime: Date,
  initiatedBy: 'supporter' | 'client'
): Promise<{ success: boolean; message: string }> {
  // For supporter-initiated reschedules, no refund needed but notify client
  if (initiatedBy === 'supporter') {
    // In production, update the session in the database
    console.log('Rescheduling session to:', newScheduledTime);

    // Notify client
    await notifyClientOfReschedule(sessionInfo, newScheduledTime);

    return {
      success: true,
      message: 'Session rescheduled. Client has been notified.',
    };
  }

  // Client-initiated reschedules might have different policies
  return {
    success: true,
    message: 'Session rescheduled successfully.',
  };
}

/**
 * Notify client about refund (would integrate with push notifications)
 */
async function notifyClientOfRefund(
  sessionInfo: SessionRefundInfo,
  refundInfo: { amount: number; percentage: number; reason: string }
): Promise<void> {
  console.log('Notifying client of refund:', {
    clientEmail: sessionInfo.clientEmail,
    refundAmount: refundInfo.amount / 100,
    reason: refundInfo.reason,
  });

  // In production:
  // 1. Send push notification
  // 2. Send email notification
  // 3. Update in-app notifications
}

/**
 * Notify client about reschedule
 */
async function notifyClientOfReschedule(
  sessionInfo: SessionRefundInfo,
  newTime: Date
): Promise<void> {
  console.log('Notifying client of reschedule:', {
    clientEmail: sessionInfo.clientEmail,
    oldTime: sessionInfo.scheduledAt,
    newTime: newTime.toISOString(),
  });

  // In production:
  // 1. Send push notification
  // 2. Send email notification
  // 3. Update calendar
}

/**
 * Get pricing for session type
 */
export function getSessionPrice(sessionType: 'chat' | 'phone' | 'video'): number {
  return Config.pricing[sessionType].amount;
}

/**
 * Format currency for display
 */
export function formatCurrency(amountInCents: number): string {
  return '$' + (amountInCents / 100).toFixed(2);
}

export default {
  calculateRefundAmount,
  processRefund,
  cancelSessionWithRefund,
  rescheduleSession,
  getSessionPrice,
  formatCurrency,
  REFUND_POLICIES,
};
