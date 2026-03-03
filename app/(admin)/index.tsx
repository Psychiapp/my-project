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
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { UsersIcon, CheckIcon, DollarIcon, ChartIcon } from '@/components/icons';
import { getAdminStats, getPendingSupporters } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminStats } from '@/types/database';

export default function AdminOverview() {
  const router = useRouter();
  const { isDemoMode } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (isDemoMode) {
        // Demo mode: show sample data
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
        setPendingCount(2);
      } else {
        const [adminStats, pendingSupporters] = await Promise.all([
          getAdminStats(),
          getPendingSupporters(),
        ]);
        setStats(adminStats);
        setPendingCount(pendingSupporters.length);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isDemoMode]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
          <Text style={styles.headerTitle}>Overview</Text>
          {isDemoMode && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Demo Mode</Text>
            </View>
          )}
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Total Users */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(74, 144, 226, 0.1)' }]}>
              <UsersIcon size={24} color={PsychiColors.azure} />
            </View>
            <Text style={styles.metricValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.metricLabel}>Total Users</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSub}>{stats?.totalClients || 0} clients</Text>
              <Text style={styles.metricDot}>•</Text>
              <Text style={styles.metricSub}>{stats?.totalSupporters || 0} supporters</Text>
            </View>
          </View>

          {/* Pending Verifications */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => router.push('/(admin)/verification' as any)}
            activeOpacity={0.7}
          >
            <View style={[styles.metricIcon, { backgroundColor: pendingCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(52, 199, 89, 0.1)' }]}>
              <CheckIcon size={24} color={pendingCount > 0 ? '#F59E0B' : PsychiColors.success} />
            </View>
            <Text style={[styles.metricValue, pendingCount > 0 && { color: '#F59E0B' }]}>
              {pendingCount}
            </Text>
            <Text style={styles.metricLabel}>Pending Verification</Text>
            <Text style={[styles.metricAction, pendingCount > 0 && { color: '#F59E0B' }]}>
              {pendingCount > 0 ? 'Review now →' : 'All caught up'}
            </Text>
          </TouchableOpacity>

          {/* Sessions */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(138, 43, 226, 0.1)' }]}>
              <ChartIcon size={24} color={PsychiColors.violet} />
            </View>
            <Text style={styles.metricValue}>{stats?.completedSessions || 0}</Text>
            <Text style={styles.metricLabel}>Total Sessions</Text>
            <View style={styles.metricSubRow}>
              <Text style={styles.metricSub}>{stats?.activeSessions || 0} active</Text>
            </View>
          </View>

          {/* Revenue */}
          <TouchableOpacity
            style={styles.metricCard}
            onPress={() => router.push('/(admin)/revenue')}
            activeOpacity={0.7}
          >
            <View style={[styles.metricIcon, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
              <DollarIcon size={24} color={PsychiColors.success} />
            </View>
            <Text style={[styles.metricValue, { color: PsychiColors.success }]}>
              ${(stats?.monthlyRevenue || 0).toLocaleString()}
            </Text>
            <Text style={styles.metricLabel}>This Month</Text>
            <Text style={styles.metricAction}>View details →</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Active Supporters</Text>
              <Text style={styles.summaryValue}>{stats?.activeSupporters || 0}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Revenue (All Time)</Text>
              <Text style={[styles.summaryValue, { color: PsychiColors.success }]}>
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pending Supporters</Text>
              <Text style={[styles.summaryValue, pendingCount > 0 && { color: '#F59E0B' }]}>
                {stats?.pendingSupporters || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/users')}
            >
              <UsersIcon size={24} color={PsychiColors.azure} />
              <Text style={styles.actionText}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionCard, pendingCount > 0 && styles.actionCardHighlight]}
              onPress={() => router.push('/(admin)/verification' as any)}
            >
              <CheckIcon size={24} color={pendingCount > 0 ? '#F59E0B' : PsychiColors.azure} />
              <Text style={[styles.actionText, pendingCount > 0 && { color: '#F59E0B' }]}>
                Verify Supporters
              </Text>
              {pendingCount > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{pendingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/revenue')}
            >
              <ChartIcon size={24} color={PsychiColors.azure} />
              <Text style={styles.actionText}>View Revenue</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/revenue')}
            >
              <DollarIcon size={24} color={PsychiColors.azure} />
              <Text style={styles.actionText}>Process Payouts</Text>
            </TouchableOpacity>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  metricCard: {
    width: '48%',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  metricLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  metricSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  metricDot: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginHorizontal: 4,
  },
  metricAction: {
    fontSize: 12,
    color: PsychiColors.azure,
    fontWeight: '500',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
    fontFamily: 'Georgia',
  },
  summaryCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  actionCardHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2A2A',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  actionBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PsychiColors.white,
  },
});
