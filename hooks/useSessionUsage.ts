/**
 * useSessionUsage Hook
 * Tracks session usage for current billing period and checks allowances
 *
 * Features:
 * - Fetches current period usage (chat count, voice/video count)
 * - Checks allowance for a session type
 * - Records session usage
 * - Calculates remaining sessions based on tier allowances
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  TIER_ALLOWANCES,
  PAYG_PRICES,
  TIER_MAP,
} from '@/types/liveSupport';
import type {
  PeriodUsageSummary,
  AllowanceCheckResult,
} from '@/types/liveSupport';
import type { SessionType } from '@/types/database';

interface UseSessionUsageReturn {
  usage: PeriodUsageSummary | null;
  isLoading: boolean;
  error: string | null;
  checkAllowance: (sessionType: SessionType) => AllowanceCheckResult;
  recordUsage: (
    sessionType: SessionType,
    sessionId: string | null,
    chargedAsPayg: boolean,
    paymentIntentId?: string
  ) => Promise<boolean>;
  refreshUsage: () => Promise<void>;
}

export function useSessionUsage(userId: string | null): UseSessionUsageReturn {
  const [usage, setUsage] = useState<PeriodUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current period usage
  const fetchUsage = useCallback(async () => {
    if (!userId || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Get client's subscription from subscriptions table (more reliable than profiles)
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('tier, status, sessions_remaining, expires_at')
        .eq('user_id', userId)
        .single();

      // If no subscription found, check profiles as fallback
      let tierString: string | null = null;
      let isActive = false;
      let sessionsRemaining: { chat: number; phone: number; video: number } | null = null;
      let expiresAt: string | null = null;

      if (subscription && !subError) {
        tierString = subscription.tier;
        isActive = subscription.status === 'active';
        sessionsRemaining = subscription.sessions_remaining as { chat: number; phone: number; video: number };
        expiresAt = subscription.expires_at;
      }

      // Map tier string to number (0 if no subscription)
      const tierNumber = (tierString && isActive) ? (TIER_MAP[tierString] || 0) : 0;

      // Calculate allowances based on tier
      const allowances = tierNumber > 0
        ? TIER_ALLOWANCES[tierNumber as 1 | 2 | 3]
        : { voiceVideo: 0, chat: 0 };

      // Use sessions_remaining from subscription if available
      // Otherwise fall back to calculated allowances
      const chatRemaining = sessionsRemaining?.chat ?? 0;
      const phoneRemaining = sessionsRemaining?.phone ?? 0;
      const videoRemaining = sessionsRemaining?.video ?? 0;
      const voiceVideoRemaining = phoneRemaining + videoRemaining;

      // For display, "used" is the difference between allowance and remaining
      const chatAllowed = allowances.chat === Infinity ? 999 : allowances.chat;
      const chatUsed = Math.max(0, chatAllowed - chatRemaining);
      const voiceVideoUsed = Math.max(0, allowances.voiceVideo - Math.min(phoneRemaining, allowances.voiceVideo));

      // Calculate billing period (subscription period, or weekly if no subscription)
      const now = new Date();
      let billingStart = new Date();
      let billingEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      if (expiresAt) {
        // Subscription period: 1 month before expiry to expiry
        billingEnd = new Date(expiresAt);
        billingStart = new Date(billingEnd);
        billingStart.setMonth(billingStart.getMonth() - 1);
      }

      setUsage({
        chatUsed,
        chatAllowed,
        voiceVideoUsed,
        voiceVideoAllowed: allowances.voiceVideo,
        billingPeriodStart: billingStart,
        billingPeriodEnd: billingEnd,
        subscriptionTier: tierNumber,
        // Also store raw remaining values for display
        sessionsRemaining: sessionsRemaining || { chat: 0, phone: 0, video: 0 },
      });
    } catch (err) {
      console.error('Failed to fetch usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch usage');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Check if client has allowance for a session type
  const checkAllowance = useCallback((sessionType: SessionType): AllowanceCheckResult => {
    // No subscription or usage data - require PAYG
    if (!usage || usage.subscriptionTier === 0) {
      return {
        hasAllowance: false,
        remaining: 0,
        paygRequired: true,
        paygPrice: PAYG_PRICES[sessionType],
        subscriptionTier: usage?.subscriptionTier || null,
      };
    }

    const isChat = sessionType === 'chat';
    const used = isChat ? usage.chatUsed : usage.voiceVideoUsed;
    const allowed = isChat ? usage.chatAllowed : usage.voiceVideoAllowed;

    // Handle unlimited chats (tier 3)
    if (allowed === 999 || allowed === Infinity) {
      return {
        hasAllowance: true,
        remaining: 999,
        paygRequired: false,
        paygPrice: PAYG_PRICES[sessionType],
        subscriptionTier: usage.subscriptionTier,
      };
    }

    const remaining = Math.max(0, allowed - used);
    const hasAllowance = remaining > 0;

    return {
      hasAllowance,
      remaining,
      paygRequired: !hasAllowance,
      paygPrice: PAYG_PRICES[sessionType],
      subscriptionTier: usage.subscriptionTier,
    };
  }, [usage]);

  // Record session usage
  const recordUsage = useCallback(async (
    sessionType: SessionType,
    sessionId: string | null,
    chargedAsPayg: boolean,
    paymentIntentId?: string
  ): Promise<boolean> => {
    if (!userId || !supabase) return false;

    try {
      // Get billing period start
      const { data: periodStart, error: periodError } = await supabase
        .rpc('get_billing_period_start', { p_client_id: userId });

      if (periodError) {
        throw new Error(periodError.message);
      }

      // Insert usage record
      const { error: insertError } = await supabase
        .from('session_usage')
        .insert({
          client_id: userId,
          session_type: sessionType,
          session_id: sessionId,
          billing_period_start: periodStart,
          subscription_tier: usage?.subscriptionTier || 0,
          charged_as_payg: chargedAsPayg,
          payment_intent_id: paymentIntentId || null,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Refresh usage after recording
      await fetchUsage();
      return true;
    } catch (err) {
      console.error('Failed to record usage:', err);
      return false;
    }
  }, [userId, usage, fetchUsage]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage,
    isLoading,
    error,
    checkAllowance,
    recordUsage,
    refreshUsage: fetchUsage,
  };
}
