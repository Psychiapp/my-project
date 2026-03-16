/**
 * Admin Dashboard - Revenue Tab
 * Revenue analytics and payout tracking
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PsychiColors, Shadows, Typography } from '@/constants/theme';
import { DollarIcon, ChartIcon, UsersIcon, ArrowUpIcon, ArrowDownIcon } from '@/components/icons';
import { getRevenueReports, getAdminStats } from '@/lib/database';
import type { RevenueReport, AdminStats } from '@/types/database';

const { width } = Dimensions.get('window');

interface RevenueCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

function RevenueCard({
  title,
  value,
  subtitle,
  icon,
  color = PsychiColors.royalBlue,
  trend,
  trendValue,
}: RevenueCardProps) {
  return (
    <View style={styles.revenueCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
          {icon}
        </View>
        {trend && trendValue && (
          <View style={[styles.trendBadge, trend === 'up' ? styles.trendUp : styles.trendDown]}>
            {trend === 'up' ? (
              <ArrowUpIcon size={12} color={PsychiColors.success} />
            ) : (
              <ArrowDownIcon size={12} color={PsychiColors.error} />
            )}
            <Text style={[styles.trendText, trend === 'up' ? styles.trendTextUp : styles.trendTextDown]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function AdminRevenueScreen() {
  const [reports, setReports] = useState<RevenueReport[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [revenueData, statsData] = await Promise.all([
        getRevenueReports('monthly'),
        getAdminStats(),
      ]);
      setReports(revenueData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals from reports
  const totalRevenue = reports.reduce((sum, r) => sum + r.total_revenue, 0);
  const totalPayouts = reports.reduce((sum, r) => sum + r.supporter_payouts, 0);
  const netRevenue = reports.reduce((sum, r) => sum + r.net_revenue, 0);
  const subscriptionRevenue = reports.reduce((sum, r) => sum + r.subscription_revenue, 0);
  const sessionRevenue = reports.reduce((sum, r) => sum + r.session_revenue, 0);

  // Calculate current month vs previous month for trends
  const currentMonth = reports[0];
  const previousMonth = reports[1];
  const revenueTrend = currentMonth && previousMonth && previousMonth.total_revenue > 0
    ? ((currentMonth.total_revenue - previousMonth.total_revenue) / previousMonth.total_revenue) * 100
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
          <Text style={styles.loadingText}>Loading revenue data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <Text style={styles.sectionTitle}>Revenue Summary</Text>
        <View style={styles.summaryGrid}>
          <RevenueCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            subtitle="All time"
            icon={<DollarIcon size={24} color={PsychiColors.success} />}
            color={PsychiColors.success}
          />
          <RevenueCard
            title="This Month"
            value={formatCurrency(stats?.monthlyRevenue || 0)}
            icon={<ChartIcon size={24} color={PsychiColors.royalBlue} />}
            color={PsychiColors.royalBlue}
            trend={revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : undefined}
            trendValue={revenueTrend !== 0 ? `${Math.abs(revenueTrend).toFixed(0)}%` : undefined}
          />
        </View>

        {/* Revenue Breakdown */}
        <Text style={styles.sectionTitle}>Revenue Breakdown (Last 6 Months)</Text>
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.breakdownDot, { backgroundColor: PsychiColors.royalBlue }]} />
              <Text style={styles.breakdownText}>Subscription Revenue</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(subscriptionRevenue)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.breakdownDot, { backgroundColor: PsychiColors.coral }]} />
              <Text style={styles.breakdownText}>Session Revenue</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(sessionRevenue)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.breakdownDot, { backgroundColor: PsychiColors.warning }]} />
              <Text style={styles.breakdownText}>Supporter Payouts</Text>
            </View>
            <Text style={[styles.breakdownValue, { color: PsychiColors.warning }]}>
              -{formatCurrency(totalPayouts)}
            </Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={[styles.breakdownRow, styles.breakdownTotal]}>
            <View style={styles.breakdownLabel}>
              <View style={[styles.breakdownDot, { backgroundColor: PsychiColors.success }]} />
              <Text style={[styles.breakdownText, styles.totalText]}>Net Revenue</Text>
            </View>
            <Text style={[styles.breakdownValue, styles.totalValue]}>{formatCurrency(netRevenue)}</Text>
          </View>
        </View>

        {/* Monthly Breakdown */}
        <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
        {reports.length > 0 ? (
          <View style={styles.monthlyList}>
            {reports.map((report, index) => (
              <View key={report.period} style={styles.monthlyCard}>
                <View style={styles.monthlyHeader}>
                  <Text style={styles.monthlyPeriod}>{report.period}</Text>
                  <Text style={styles.monthlyRevenue}>{formatCurrency(report.total_revenue)}</Text>
                </View>
                <View style={styles.monthlyDetails}>
                  <View style={styles.monthlyDetail}>
                    <Text style={styles.monthlyDetailLabel}>Subscriptions</Text>
                    <Text style={styles.monthlyDetailValue}>{formatCurrency(report.subscription_revenue)}</Text>
                  </View>
                  <View style={styles.monthlyDetail}>
                    <Text style={styles.monthlyDetailLabel}>Sessions</Text>
                    <Text style={styles.monthlyDetailValue}>{formatCurrency(report.session_revenue)}</Text>
                  </View>
                  <View style={styles.monthlyDetail}>
                    <Text style={styles.monthlyDetailLabel}>Payouts</Text>
                    <Text style={[styles.monthlyDetailValue, { color: PsychiColors.warning }]}>
                      -{formatCurrency(report.supporter_payouts)}
                    </Text>
                  </View>
                  <View style={styles.monthlyDetail}>
                    <Text style={styles.monthlyDetailLabel}>Net</Text>
                    <Text style={[styles.monthlyDetailValue, { color: PsychiColors.success, fontWeight: '600' }]}>
                      {formatCurrency(report.net_revenue)}
                    </Text>
                  </View>
                </View>
                <View style={styles.monthlyFooter}>
                  <Text style={styles.monthlyTransactions}>{report.transaction_count} transactions</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <ChartIcon size={48} color={PsychiColors.textMuted} />
            <Text style={styles.emptyTitle}>No revenue data</Text>
            <Text style={styles.emptySubtitle}>Revenue data will appear here once transactions are recorded</Text>
          </View>
        )}

        {/* Platform Stats */}
        <Text style={styles.sectionTitle}>Platform Stats</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Sessions</Text>
            <Text style={styles.statValue}>{stats?.totalSessions || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Completed Sessions</Text>
            <Text style={styles.statValue}>{stats?.completedSessions || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Active Supporters</Text>
            <Text style={styles.statValue}>{stats?.activeSupporters || 0}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Clients</Text>
            <Text style={styles.statValue}>{stats?.totalClients || 0}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
    marginTop: 20,
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  revenueCard: {
    flex: 1,
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
    padding: 16,
    ...Shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  trendUp: {
    backgroundColor: PsychiColors.successMuted,
  },
  trendDown: {
    backgroundColor: PsychiColors.errorMuted,
  },
  trendText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
  },
  trendTextUp: {
    color: PsychiColors.success,
  },
  trendTextDown: {
    color: PsychiColors.error,
  },
  cardValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.midnight,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textSecondary,
  },
  cardSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
    padding: 16,
    ...Shadows.soft,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  breakdownValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.midnight,
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
  },
  breakdownTotal: {
    paddingTop: 16,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: PsychiColors.divider,
  },
  totalText: {
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
  },
  totalValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.success,
  },
  monthlyList: {
    gap: 12,
  },
  monthlyCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.soft,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.divider,
  },
  monthlyPeriod: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
  },
  monthlyRevenue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.royalBlue,
  },
  monthlyDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthlyDetail: {
    width: '50%',
    paddingVertical: 6,
  },
  monthlyDetailLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  monthlyDetailValue: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textPrimary,
  },
  monthlyFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PsychiColors.divider,
  },
  monthlyTransactions: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  statsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
    padding: 16,
    ...Shadows.soft,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
  },
  statDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
  },
});
