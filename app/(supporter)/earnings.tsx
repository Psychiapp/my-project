import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Config } from '@/constants/config';

type TimeRange = 'week' | 'month' | 'all';

export default function EarningsScreen() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Mock earnings data
  const earnings = {
    week: { total: 90.00, sessions: 5, pending: 45.00 },
    month: { total: 352.50, sessions: 23, pending: 90.00 },
    all: { total: 705.75, sessions: 47, pending: 90.00 },
  };

  const recentPayouts = [
    { id: '1', date: 'Jan 7, 2026', amount: 180.00, status: 'completed' },
    { id: '2', date: 'Dec 31, 2025', amount: 195.75, status: 'completed' },
    { id: '3', date: 'Dec 24, 2025', amount: 150.00, status: 'completed' },
  ];

  const currentEarnings = earnings[timeRange];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>
            You earn {Config.supporterCommission * 100}% of each session
          </Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.rangeContainer}>
          {(['week', 'month', 'all'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Earnings Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={[PsychiColors.azure, PsychiColors.deep]}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryLabel}>Total Earnings</Text>
            <Text style={styles.summaryAmount}>${currentEarnings.total.toFixed(2)}</Text>
            <Text style={styles.summarySubtext}>
              {currentEarnings.sessions} sessions completed
            </Text>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>💰</Text>
            <Text style={styles.statValue}>${currentEarnings.pending.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Pending Payout</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📊</Text>
            <Text style={styles.statValue}>
              ${(currentEarnings.total / (currentEarnings.sessions || 1)).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Avg per Session</Text>
          </View>
        </View>

        {/* Commission Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Earnings Work</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Chat session</Text>
              <View style={styles.breakdownValues}>
                <Text style={styles.breakdownGross}>{Config.pricing.chat.display}</Text>
                <Text style={styles.breakdownArrow}>→</Text>
                <Text style={styles.breakdownNet}>
                  ${(Config.pricing.chat.supporterCut / 100).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Phone session</Text>
              <View style={styles.breakdownValues}>
                <Text style={styles.breakdownGross}>{Config.pricing.phone.display}</Text>
                <Text style={styles.breakdownArrow}>→</Text>
                <Text style={styles.breakdownNet}>
                  ${(Config.pricing.phone.supporterCut / 100).toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.breakdownDivider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Video session</Text>
              <View style={styles.breakdownValues}>
                <Text style={styles.breakdownGross}>{Config.pricing.video.display}</Text>
                <Text style={styles.breakdownArrow}>→</Text>
                <Text style={styles.breakdownNet}>
                  ${(Config.pricing.video.supporterCut / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Payouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payouts</Text>
          {recentPayouts.map((payout) => (
            <View key={payout.id} style={styles.payoutCard}>
              <View style={styles.payoutInfo}>
                <Text style={styles.payoutDate}>{payout.date}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {payout.status === 'completed' ? '✓ Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.payoutAmount}>${payout.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Payout Settings */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(supporter)/payout-settings')}
          >
            <View style={styles.settingsIcon}>
              <Text style={styles.settingsEmoji}>⚙️</Text>
            </View>
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Payout Settings</Text>
              <Text style={styles.settingsSubtitle}>Manage bank account & payout schedule</Text>
            </View>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  headerSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  rangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  rangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.white,
    alignItems: 'center',
    ...Shadows.soft,
  },
  rangeButtonActive: {
    backgroundColor: PsychiColors.azure,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  rangeTextActive: {
    color: PsychiColors.white,
  },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  summaryGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.xs,
  },
  summaryAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  summarySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  statLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
    fontFamily: 'Georgia',
  },
  breakdownCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#2A2A2A',
  },
  breakdownValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownGross: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  breakdownArrow: {
    fontSize: 14,
    color: PsychiColors.textSoft,
    marginHorizontal: Spacing.sm,
  },
  breakdownNet: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.sm,
  },
  payoutCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  statusBadge: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: PsychiColors.success,
    fontWeight: '500',
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  settingsIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsEmoji: {
    fontSize: 22,
  },
  settingsInfo: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  settingsSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  settingsArrow: {
    fontSize: 24,
    color: PsychiColors.textSoft,
  },
});
