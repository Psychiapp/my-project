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

      // Get client's subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_status')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw new Error(profileError.message);
      }

      // Map tier string to number (0 if no subscription)
      const tierString = profile?.subscription_tier;
      const isActive = profile?.subscription_status === 'active';
      const tierNumber = (tierString && isActive) ? (TIER_MAP[tierString] || 0) : 0;

      // Get current period usage from database function
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_current_period_usage', { p_client_id: userId });

      if (usageError) {
        throw new Error(usageError.message);
      }

      const row = usageData?.[0];
      const allowances = tierNumber > 0
        ? TIER_ALLOWANCES[tierNumber as 1 | 2 | 3]
        : { voiceVideo: 0, chat: 0 };

      setUsage({
        chatUsed: row?.chat_count || 0,
        chatAllowed: allowances.chat === Infinity ? 999 : allowances.chat,
        voiceVideoUsed: row?.voice_video_count || 0,
        voiceVideoAllowed: allowances.voiceVideo,
        billingPeriodStart: row?.billing_period_start
          ? new Date(row.billing_period_start)
          : new Date(),
        billingPeriodEnd: row?.billing_period_end
          ? new Date(row.billing_period_end)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        subscriptionTier: tierNumber,
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
