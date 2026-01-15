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
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { Config } from '@/constants/config';

type TimeRange = 'today' | 'week' | 'month' | 'year';

export default function AdminRevenueScreen() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  // Mock revenue data
  const revenueData = {
    today: {
      total: 42000,
      platform: 10500,
      supporters: 31500,
      sessions: 21,
      growth: 15.3,
    },
    week: {
      total: 385000,
      platform: 96250,
      supporters: 288750,
      sessions: 187,
      growth: 8.7,
    },
    month: {
      total: 1542000,
      platform: 385500,
      supporters: 1156500,
      sessions: 742,
      growth: 12.4,
    },
    year: {
      total: 18504000,
      platform: 4626000,
      supporters: 13878000,
      sessions: 8915,
      growth: 34.2,
    },
  };

  const current = revenueData[timeRange];

  const sessionBreakdown = [
    { type: 'Chat', count: timeRange === 'month' ? 412 : Math.round(412 * (current.sessions / 742)), amount: 288400, color: PsychiColors.azure },
    { type: 'Phone', count: timeRange === 'month' ? 198 : Math.round(198 * (current.sessions / 742)), amount: 297000, color: PsychiColors.violet },
    { type: 'Video', count: timeRange === 'month' ? 132 : Math.round(132 * (current.sessions / 742)), amount: 264000, color: PsychiColors.coral },
  ];

  const subscriptionStats = {
    basic: { count: 89, revenue: 845500 },
    standard: { count: 156, revenue: 2262000 },
    premium: { count: 67, revenue: 1172500 },
  };

  const topSupporters = [
    { name: 'Rachel G.', sessions: 89, earnings: 12450 },
    { name: 'Sarah M.', sessions: 76, earnings: 10640 },
    { name: 'Lisa K.', sessions: 68, earnings: 9520 },
    { name: 'Michael T.', sessions: 54, earnings: 7560 },
    { name: 'David W.', sessions: 47, earnings: 6580 },
  ];

  const pendingPayouts = [
    { supporter: 'Rachel G.', amount: 312500, date: 'Jan 15' },
    { supporter: 'Sarah M.', amount: 267500, date: 'Jan 15' },
    { supporter: 'Lisa K.', amount: 238000, date: 'Jan 15' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Revenue & Analytics</Text>
          <Text style={styles.headerSubtitle}>Platform financial overview</Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.rangeContainer}>
          {(['today', 'week', 'month', 'year'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Revenue Card */}
        <View style={styles.totalRevenueCard}>
          <LinearGradient
            colors={[PsychiColors.deep, PsychiColors.azure]}
            style={styles.totalRevenueGradient}
          >
            <Text style={styles.totalRevenueLabel}>Total Revenue</Text>
            <Text style={styles.totalRevenueAmount}>
              ${(current.total / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Text>
            <View style={styles.growthBadge}>
              <Text style={styles.growthText}>↑ {current.growth}% vs last period</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Revenue Split */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Distribution</Text>
          <View style={styles.splitContainer}>
            <View style={styles.splitCard}>
              <View style={[styles.splitIndicator, { backgroundColor: PsychiColors.deep }]} />
              <Text style={styles.splitLabel}>Platform ({Config.platformCommission * 100}%)</Text>
              <Text style={styles.splitAmount}>
                ${(current.platform / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.splitCard}>
              <View style={[styles.splitIndicator, { backgroundColor: PsychiColors.coral }]} />
              <Text style={styles.splitLabel}>Supporters ({Config.supporterCommission * 100}%)</Text>
              <Text style={styles.splitAmount}>
                ${(current.supporters / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Session Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Breakdown</Text>
          <View style={styles.breakdownCard}>
            {sessionBreakdown.map((item, index) => (
              <View key={item.type} style={[styles.breakdownRow, index < sessionBreakdown.length - 1 && styles.breakdownRowBorder]}>
                <View style={styles.breakdownInfo}>
                  <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                  <Text style={styles.breakdownType}>{item.type} Sessions</Text>
                </View>
                <View style={styles.breakdownStats}>
                  <Text style={styles.breakdownCount}>{item.count} sessions</Text>
                  <Text style={styles.breakdownAmount}>
                    ${(item.amount / 100).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Subscription Revenue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription Revenue</Text>
          <View style={styles.subscriptionCard}>
            {Object.entries(subscriptionStats).map(([tier, data], index) => (
              <View key={tier} style={[styles.subscriptionRow, index < 2 && styles.subscriptionRowBorder]}>
                <View style={styles.subscriptionInfo}>
                  <Text style={styles.subscriptionTier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
                  </Text>
                  <Text style={styles.subscriptionCount}>{data.count} subscribers</Text>
                </View>
                <Text style={styles.subscriptionRevenue}>
                  ${(data.revenue / 100).toLocaleString()}
                </Text>
              </View>
            ))}
            <View style={styles.subscriptionTotal}>
              <Text style={styles.subscriptionTotalLabel}>Total Subscription Revenue</Text>
              <Text style={styles.subscriptionTotalAmount}>
                ${((subscriptionStats.basic.revenue + subscriptionStats.standard.revenue + subscriptionStats.premium.revenue) / 100).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Supporters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Earning Supporters</Text>
          <View style={styles.topSupportersCard}>
            {topSupporters.map((supporter, index) => (
              <View key={supporter.name} style={[styles.supporterRow, index < topSupporters.length - 1 && styles.supporterRowBorder]}>
                <View style={styles.supporterRank}>
                  <Text style={styles.supporterRankText}>#{index + 1}</Text>
                </View>
                <View style={styles.supporterInfo}>
                  <Text style={styles.supporterName}>{supporter.name}</Text>
                  <Text style={styles.supporterSessions}>{supporter.sessions} sessions</Text>
                </View>
                <Text style={styles.supporterEarnings}>
                  ${(supporter.earnings / 100).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending Payouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Payouts</Text>
          <View style={styles.payoutsCard}>
            {pendingPayouts.map((payout, index) => (
              <View key={payout.supporter} style={[styles.payoutRow, index < pendingPayouts.length - 1 && styles.payoutRowBorder]}>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutSupporter}>{payout.supporter}</Text>
                  <Text style={styles.payoutDate}>Scheduled: {payout.date}</Text>
                </View>
                <Text style={styles.payoutAmount}>
                  ${(payout.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
            <TouchableOpacity style={styles.processPayoutsButton}>
              <Text style={styles.processPayoutsText}>Process All Payouts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Export Section */}
        <View style={styles.section}>
          <View style={styles.exportCard}>
            <Text style={styles.exportTitle}>Export Financial Reports</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportButton}>
                <Text style={styles.exportButtonText}>Export PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: PsychiColors.deep,
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  rangeTextActive: {
    color: PsychiColors.white,
  },
  totalRevenueCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  totalRevenueGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  totalRevenueLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  totalRevenueAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  growthBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  growthText: {
    fontSize: 13,
    color: PsychiColors.white,
    fontWeight: '600',
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
  splitContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  splitCard: {
    flex: 1,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  splitIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  splitLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: 4,
  },
  splitAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
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
    paddingVertical: Spacing.sm,
  },
  breakdownRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  breakdownInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  breakdownType: {
    fontSize: 15,
    color: '#2A2A2A',
  },
  breakdownStats: {
    alignItems: 'flex-end',
  },
  breakdownCount: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  breakdownAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  subscriptionCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  subscriptionRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  subscriptionInfo: {
    flex: 1,
  },
  subscriptionTier: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  subscriptionCount: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  subscriptionRevenue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  subscriptionTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  subscriptionTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  subscriptionTotalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: PsychiColors.success,
  },
  topSupportersCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  supporterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  supporterRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  supporterRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(43, 58, 103, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  supporterRankText: {
    fontSize: 12,
    fontWeight: '700',
    color: PsychiColors.deep,
  },
  supporterInfo: {
    flex: 1,
  },
  supporterName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  supporterSessions: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  supporterEarnings: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  payoutsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  payoutRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  payoutInfo: {
    flex: 1,
  },
  payoutSupporter: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  payoutDate: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  processPayoutsButton: {
    marginTop: Spacing.md,
    backgroundColor: PsychiColors.deep,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  processPayoutsText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  exportCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportButton: {
    flex: 1,
    backgroundColor: 'rgba(43, 58, 103, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.deep,
  },
});
