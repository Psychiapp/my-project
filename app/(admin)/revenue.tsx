import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { DollarIcon, ChartIcon, UsersIcon } from '@/components/icons';
import { getAdminStats } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { Config } from '@/constants/config';
import type { AdminStats } from '@/types/database';

type TimeRange = 'week' | 'month' | 'year';

export default function AdminRevenue() {
  const { isDemoMode } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Demo data for different time ranges
  const demoData: Record<TimeRange, { total: number; sessions: number; platform: number; supporters: number }> = {
    week: { total: 1250, sessions: 24, platform: 312.5, supporters: 937.5 },
    month: { total: 4850, sessions: 96, platform: 1212.5, supporters: 3637.5 },
    year: { total: 52400, sessions: 1120, platform: 13100, supporters: 39300 },
  };

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (isDemoMode) {
        setStats({
          totalUsers: 156,
          totalClients: 142,
          totalSupporters: 14,
          activeSupporters: 12,
          pendingSupporters: 2,
          totalSessions: 847,
          activeSessions: 3,
          completedSessions: 820,
          totalRevenue: 28450,
          monthlyRevenue: 4250,
        });
      } else {
        const adminStats = await getAdminStats();
        setStats(adminStats);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode]);

  const currentPeriodData = isDemoMode
    ? demoData[timeRange]
    : {
        total: timeRange === 'month' ? (stats?.monthlyRevenue || 0) : (stats?.totalRevenue || 0),
        sessions: timeRange === 'month' ? Math.round((stats?.completedSessions || 0) / 12) : (stats?.completedSessions || 0),
        platform: (timeRange === 'month' ? (stats?.monthlyRevenue || 0) : (stats?.totalRevenue || 0)) * Config.platformCommission,
        supporters: (timeRange === 'month' ? (stats?.monthlyRevenue || 0) : (stats?.totalRevenue || 0)) * Config.supporterCommission,
      };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading revenue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchData(true)}
            tintColor={PsychiColors.azure}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Revenue</Text>
          {isDemoMode && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Demo Mode</Text>
            </View>
          )}
        </View>

        {/* Time Range Selector */}
        <View style={styles.rangeContainer}>
          {(['week', 'month', 'year'] as TimeRange[]).map((range) => (
            <TouchableOpacity
              key={range}
              style={[styles.rangeButton, timeRange === range && styles.rangeButtonActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>
                {range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'This Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Revenue Card */}
        <View style={styles.totalCard}>
          <LinearGradient
            colors={[PsychiColors.deep, PsychiColors.azure]}
            style={styles.totalGradient}
          >
            <DollarIcon size={32} color="rgba(255,255,255,0.8)" />
            <Text style={styles.totalLabel}>Total Revenue</Text>
            <Text style={styles.totalAmount}>
              ${currentPeriodData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.totalSessions}>
              {currentPeriodData.sessions} sessions
            </Text>
          </LinearGradient>
        </View>

        {/* Revenue Split */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Distribution</Text>
          <View style={styles.splitContainer}>
            <View style={styles.splitCard}>
              <View style={[styles.splitBar, { backgroundColor: PsychiColors.deep }]} />
              <Text style={styles.splitLabel}>Platform ({(Config.platformCommission * 100).toFixed(0)}%)</Text>
              <Text style={styles.splitAmount}>
                ${currentPeriodData.platform.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.splitCard}>
              <View style={[styles.splitBar, { backgroundColor: PsychiColors.coral }]} />
              <Text style={styles.splitLabel}>Supporters ({(Config.supporterCommission * 100).toFixed(0)}%)</Text>
              <Text style={styles.splitAmount}>
                ${currentPeriodData.supporters.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* All Time Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All-Time Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <DollarIcon size={20} color={PsychiColors.success} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={[styles.summaryValue, { color: PsychiColors.success }]}>
                    ${(stats?.totalRevenue || 0).toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <ChartIcon size={20} color={PsychiColors.azure} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Total Sessions</Text>
                  <Text style={styles.summaryValue}>{stats?.completedSessions || 0}</Text>
                </View>
              </View>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <UsersIcon size={20} color={PsychiColors.coral} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.summaryLabel}>Active Supporters</Text>
                  <Text style={styles.summaryValue}>{stats?.activeSupporters || 0}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Session Pricing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Pricing</Text>
          <View style={styles.pricingCard}>
            <View style={styles.pricingRow}>
              <View style={[styles.pricingDot, { backgroundColor: PsychiColors.azure }]} />
              <Text style={styles.pricingType}>Chat Session</Text>
              <Text style={styles.pricingPrice}>$7</Text>
            </View>
            <View style={styles.pricingDivider} />
            <View style={styles.pricingRow}>
              <View style={[styles.pricingDot, { backgroundColor: PsychiColors.violet }]} />
              <Text style={styles.pricingType}>Phone Session</Text>
              <Text style={styles.pricingPrice}>$15</Text>
            </View>
            <View style={styles.pricingDivider} />
            <View style={styles.pricingRow}>
              <View style={[styles.pricingDot, { backgroundColor: PsychiColors.coral }]} />
              <Text style={styles.pricingType}>Video Session</Text>
              <Text style={styles.pricingPrice}>$20</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: PsychiColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  demoBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  demoBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
  },
  rangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
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
  totalCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  totalGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.sm,
  },
  totalAmount: {
    fontSize: 40,
    fontWeight: '700',
    color: PsychiColors.white,
    marginTop: 4,
  },
  totalSessions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.xs,
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
  splitBar: {
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
  summaryCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  summaryRow: {
    paddingVertical: Spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  summaryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  pricingCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  pricingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
  },
  pricingType: {
    flex: 1,
    fontSize: 14,
    color: '#2A2A2A',
  },
  pricingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
