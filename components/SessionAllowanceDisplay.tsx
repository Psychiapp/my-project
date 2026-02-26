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

  const chatDisplay = formatAllowanceDisplay(usage.chatUsed, usage.chatAllowed, 'chat');
  const voiceVideoDisplay = formatAllowanceDisplay(usage.voiceVideoUsed, usage.voiceVideoAllowed, 'voiceVideo');
  const isUnlimitedChat = usage.chatAllowed >= 999 || usage.chatAllowed === Infinity;

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
            <Text style={styles.compactValue}>{voiceVideoDisplay}</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week's Sessions</Text>
        <Text style={styles.periodInfo}>{daysRemaining} days left</Text>
      </View>

      <View style={styles.allowanceGrid}>
        {/* Chat Sessions */}
        <View style={styles.allowanceCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${PsychiColors.chatAccent}20` }]}>
            <ChatIcon size={20} color={PsychiColors.chatAccent} />
          </View>
          <View style={styles.allowanceInfo}>
            <Text style={styles.allowanceLabel}>Chat</Text>
            <Text style={styles.allowanceValue}>
              {isUnlimitedChat ? 'Unlimited' : chatDisplay}
            </Text>
          </View>
          {!isUnlimitedChat && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, (usage.chatUsed / usage.chatAllowed) * 100)}%`,
                    backgroundColor: PsychiColors.chatAccent,
                  },
                ]}
              />
            </View>
          )}
        </View>

        {/* Voice/Video Sessions */}
        <View style={styles.allowanceCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${PsychiColors.videoAccent}20` }]}>
            <VideoIcon size={20} color={PsychiColors.videoAccent} />
          </View>
          <View style={styles.allowanceInfo}>
            <Text style={styles.allowanceLabel}>Calls</Text>
            <Text style={styles.allowanceValue}>{voiceVideoDisplay}</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(100, (usage.voiceVideoUsed / usage.voiceVideoAllowed) * 100)}%`,
                  backgroundColor: PsychiColors.videoAccent,
                },
              ]}
            />
          </View>
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
  progressBar: {
    width: 60,
    height: 4,
    backgroundColor: PsychiColors.frost,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
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
