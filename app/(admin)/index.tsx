/**
 * Admin Dashboard - Home Tab
 * Platform metrics and overview
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PsychiColors, Shadows, Typography } from '@/constants/theme';
import { UsersIcon, ChartIcon, DollarIcon, ClockIcon, CheckCircleIcon, AlertIcon } from '@/components/icons';
import { getAdminStats } from '@/lib/database';
import type { AdminStats } from '@/types/database';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}

function MetricCard({ title, value, subtitle, icon, color = PsychiColors.royalBlue }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );
}

export default function AdminHomeScreen() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadStats();
  }, [loadStats]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        {/* User Metrics Section */}
        <Text style={styles.sectionTitle}>Users</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={<UsersIcon size={24} color={PsychiColors.royalBlue} />}
            color={PsychiColors.royalBlue}
          />
          <MetricCard
            title="Clients"
            value={stats?.totalClients || 0}
            icon={<UsersIcon size={24} color={PsychiColors.azure} />}
            color={PsychiColors.azure}
          />
          <MetricCard
            title="Supporters"
            value={stats?.totalSupporters || 0}
            subtitle={`${stats?.activeSupporters || 0} active`}
            icon={<UsersIcon size={24} color={PsychiColors.coral} />}
            color={PsychiColors.coral}
          />
          <MetricCard
            title="Pending"
            value={stats?.pendingSupporters || 0}
            subtitle="awaiting review"
            icon={<AlertIcon size={24} color={PsychiColors.warning} />}
            color={PsychiColors.warning}
          />
        </View>

        {/* Sessions Section */}
        <Text style={styles.sectionTitle}>Sessions</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Sessions"
            value={stats?.totalSessions || 0}
            icon={<ChartIcon size={24} color={PsychiColors.royalBlue} />}
            color={PsychiColors.royalBlue}
          />
          <MetricCard
            title="Active"
            value={stats?.activeSessions || 0}
            subtitle="in progress"
            icon={<ClockIcon size={24} color={PsychiColors.success} />}
            color={PsychiColors.success}
          />
          <MetricCard
            title="Completed"
            value={stats?.completedSessions || 0}
            icon={<CheckCircleIcon size={24} color={PsychiColors.coral} />}
            color={PsychiColors.coral}
          />
        </View>

        {/* Revenue Section */}
        <Text style={styles.sectionTitle}>Revenue</Text>
        <View style={styles.metricsGrid}>
          <MetricCard
            title="Total Revenue"
            value={formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarIcon size={24} color={PsychiColors.success} />}
            color={PsychiColors.success}
          />
          <MetricCard
            title="This Month"
            value={formatCurrency(stats?.monthlyRevenue || 0)}
            icon={<DollarIcon size={24} color={PsychiColors.royalBlue} />}
            color={PsychiColors.royalBlue}
          />
        </View>

        {/* Platform Health */}
        <Text style={styles.sectionTitle}>Platform Health</Text>
        <View style={styles.healthCard}>
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Supporter Approval Rate</Text>
            <Text style={styles.healthValue}>
              {stats?.totalSupporters && stats.totalSupporters > 0
                ? `${Math.round(((stats.totalSupporters - (stats.pendingSupporters || 0)) / stats.totalSupporters) * 100)}%`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.healthDivider} />
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Session Completion Rate</Text>
            <Text style={styles.healthValue}>
              {stats?.totalSessions && stats.totalSessions > 0
                ? `${Math.round(((stats.completedSessions || 0) / stats.totalSessions) * 100)}%`
                : 'N/A'}
            </Text>
          </View>
          <View style={styles.healthDivider} />
          <View style={styles.healthRow}>
            <Text style={styles.healthLabel}>Active Supporter Ratio</Text>
            <Text style={styles.healthValue}>
              {stats?.totalSupporters && stats.totalSupporters > 0
                ? `${Math.round(((stats.activeSupporters || 0) / stats.totalSupporters) * 100)}%`
                : 'N/A'}
            </Text>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  metricCard: {
    width: '50%',
    padding: 6,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.midnight,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textSecondary,
  },
  metricSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  healthCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
    padding: 16,
    ...Shadows.soft,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  healthLabel: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  healthValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
  },
  healthDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
  },
});
