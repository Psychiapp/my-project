/**
 * SessionAllowanceDisplay Component
 * Displays remaining session allowance for the current billing period
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChatIcon, PhoneIcon, VideoIcon, InfoIcon } from '@/components/icons';
import type { PeriodUsageSummary } from '@/types/liveSupport';
import { formatAllowanceDisplay } from '@/types/liveSupport';

interface SessionAllowanceDisplayProps {
  usage: PeriodUsageSummary | null;
  isLoading?: boolean;
  compact?: boolean;
}

export default function SessionAllowanceDisplay({
  usage,
  isLoading = false,
  compact = false,
}: SessionAllowanceDisplayProps) {
  if (isLoading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  if (!usage) {
    return null;
  }

  // Use sessionsRemaining from subscription if available (more accurate)
  const hasSubscriptionData = usage.sessionsRemaining && usage.subscriptionTier > 0;

  // Get remaining counts from subscription data
  const chatRemaining = usage.sessionsRemaining?.chat ?? 0;
  const phoneRemaining = usage.sessionsRemaining?.phone ?? 0;
  const videoRemaining = usage.sessionsRemaining?.video ?? 0;

  // For display purposes
  const isUnlimitedChat = usage.chatAllowed >= 999 || usage.chatAllowed === Infinity;
  const chatDisplay = isUnlimitedChat ? 'Unlimited' : `${chatRemaining} left`;
  const phoneDisplay = `${phoneRemaining} left`;
  const videoDisplay = `${videoRemaining} left`;

  // Calculate days remaining in billing period
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((usage.billingPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact]}>
        <View style={styles.compactRow}>
          <View style={styles.compactItem}>
            <ChatIcon size={16} color={PsychiColors.chatAccent} />
            <Text style={styles.compactValue}>{chatDisplay}</Text>
          </View>
          <View style={styles.compactDivider} />
          <View style={styles.compactItem}>
            <PhoneIcon size={16} color={PsychiColors.phoneAccent} />
            <Text style={styles.compactValue}>{phoneRemaining + videoRemaining} calls</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Session Allowance</Text>
        <Text style={styles.periodInfo}>{daysRemaining} days left</Text>
      </View>

      <View style={styles.allowanceGrid}>
        {/* Chat Sessions */}
        <View style={styles.allowanceCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${PsychiColors.chatAccent}20` }]}>
            <ChatIcon size={20} color={PsychiColors.chatAccent} />
          </View>
          <View style={styles.allowanceInfo}>
            <Text style={styles.allowanceLabel}>Chat Sessions</Text>
            <Text style={styles.allowanceValue}>{chatDisplay}</Text>
          </View>
          {!isUnlimitedChat && hasSubscriptionData && (
            <View style={styles.remainingBadge}>
              <Text style={[styles.remainingText, { color: chatRemaining > 0 ? PsychiColors.chatAccent : PsychiColors.textMuted }]}>
                {chatRemaining}
              </Text>
            </View>
          )}
        </View>

        {/* Phone Sessions */}
        <View style={styles.allowanceCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${PsychiColors.phoneAccent}20` }]}>
            <PhoneIcon size={20} color={PsychiColors.phoneAccent} />
          </View>
          <View style={styles.allowanceInfo}>
            <Text style={styles.allowanceLabel}>Phone Calls</Text>
            <Text style={styles.allowanceValue}>{phoneDisplay}</Text>
          </View>
          {hasSubscriptionData && (
            <View style={styles.remainingBadge}>
              <Text style={[styles.remainingText, { color: phoneRemaining > 0 ? PsychiColors.phoneAccent : PsychiColors.textMuted }]}>
                {phoneRemaining}
              </Text>
            </View>
          )}
        </View>

        {/* Video Sessions */}
        <View style={styles.allowanceCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${PsychiColors.videoAccent}20` }]}>
            <VideoIcon size={20} color={PsychiColors.videoAccent} />
          </View>
          <View style={styles.allowanceInfo}>
            <Text style={styles.allowanceLabel}>Video Calls</Text>
            <Text style={styles.allowanceValue}>{videoDisplay}</Text>
          </View>
          {hasSubscriptionData && (
            <View style={styles.remainingBadge}>
              <Text style={[styles.remainingText, { color: videoRemaining > 0 ? PsychiColors.videoAccent : PsychiColors.textMuted }]}>
                {videoRemaining}
              </Text>
            </View>
          )}
        </View>
      </View>

      {usage.subscriptionTier === 0 && (
        <View style={styles.noSubscriptionBanner}>
          <InfoIcon size={14} color={PsychiColors.azure} />
          <Text style={styles.noSubscriptionText}>
            Subscribe for weekly session allowances and save!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  containerCompact: {
    padding: Spacing.sm,
  },
  loadingPlaceholder: {
    height: 60,
    backgroundColor: PsychiColors.frost,
    borderRadius: BorderRadius.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  periodInfo: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  allowanceGrid: {
    gap: Spacing.sm,
  },
  allowanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  allowanceInfo: {
    flex: 1,
  },
  allowanceLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  allowanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  remainingBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PsychiColors.frost,
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '700',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  compactValue: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
  },
  compactDivider: {
    width: 1,
    height: 16,
    backgroundColor: PsychiColors.borderMedium,
    marginHorizontal: Spacing.md,
  },
  noSubscriptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${PsychiColors.azure}10`,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  noSubscriptionText: {
    flex: 1,
    fontSize: 12,
    color: PsychiColors.azure,
  },
});
