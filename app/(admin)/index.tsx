import React from 'react';
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

export default function AdminDashboard() {
  const router = useRouter();

  // Mock admin stats
  const stats = {
    totalUsers: 1247,
    activeClients: 892,
    activeSupporters: 156,
    pendingVerification: 12,
    todaySessions: 47,
    weekSessions: 312,
    monthRevenue: 15420,
    weekRevenue: 3850,
  };

  const recentActivity = [
    { type: 'session', text: 'Session completed between John D. and Sarah M.', time: '5m ago' },
    { type: 'signup', text: 'New client registered: Emily R.', time: '12m ago' },
    { type: 'verification', text: 'Supporter verification pending: Michael T.', time: '25m ago' },
    { type: 'payout', text: 'Payout processed: $125.00 to supporter Lisa K.', time: '1h ago' },
    { type: 'session', text: 'Video session started: Alex P. with Rachel G.', time: '1h ago' },
  ];

  const alerts = [
    { type: 'warning', text: '12 supporters pending verification', action: 'Review' },
    { type: 'info', text: '3 support tickets awaiting response', action: 'View' },
    { type: 'success', text: 'Monthly revenue target 87% complete', action: 'Details' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Platform Overview</Text>
        </View>

        {/* Key Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep]}
              style={styles.metricGradient}
            >
              <Text style={styles.metricValue}>{stats.totalUsers.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>Total Users</Text>
              <View style={styles.metricSubStats}>
                <Text style={styles.metricSubText}>{stats.activeClients} clients</Text>
                <Text style={styles.metricSubText}>{stats.activeSupporters} supporters</Text>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.metricCard}>
            <LinearGradient
              colors={[PsychiColors.violet, PsychiColors.periwinkle]}
              style={styles.metricGradient}
            >
              <Text style={styles.metricValue}>{stats.todaySessions}</Text>
              <Text style={styles.metricLabel}>Today's Sessions</Text>
              <Text style={styles.metricSubText}>{stats.weekSessions} this week</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Revenue Card */}
        <View style={styles.section}>
          <View style={styles.revenueCard}>
            <View style={styles.revenueHeader}>
              <Text style={styles.revenueTitle}>Revenue</Text>
              <TouchableOpacity onPress={() => router.push('/(admin)/revenue')}>
                <Text style={styles.viewAllLink}>View Details</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.revenueStats}>
              <View style={styles.revenueStat}>
                <Text style={styles.revenueValue}>${stats.monthRevenue.toLocaleString()}</Text>
                <Text style={styles.revenueLabel}>This Month</Text>
              </View>
              <View style={styles.revenueDivider} />
              <View style={styles.revenueStat}>
                <Text style={styles.revenueValue}>${stats.weekRevenue.toLocaleString()}</Text>
                <Text style={styles.revenueLabel}>This Week</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts & Actions</Text>
          {alerts.map((alert, index) => (
            <TouchableOpacity key={index} style={styles.alertCard} activeOpacity={0.7}>
              <View style={[
                styles.alertIndicator,
                alert.type === 'warning' && styles.alertWarning,
                alert.type === 'info' && styles.alertInfo,
                alert.type === 'success' && styles.alertSuccess,
              ]} />
              <Text style={styles.alertText}>{alert.text}</Text>
              <Text style={styles.alertAction}>{alert.action}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/users')}
            >
              <Text style={styles.actionIcon}>👥</Text>
              <Text style={styles.actionLabel}>Manage Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>✅</Text>
              <Text style={styles.actionLabel}>Verify Supporters</Text>
              {stats.pendingVerification > 0 && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>{stats.pendingVerification}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(admin)/sessions')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>View Sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={styles.actionLabel}>Process Payouts</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            {recentActivity.map((activity, index) => (
              <View
                key={index}
                style={[
                  styles.activityItem,
                  index < recentActivity.length - 1 && styles.activityItemBorder,
                ]}
              >
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.text}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Platform Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Health</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthItem}>
              <View style={[styles.healthIndicator, styles.healthGood]} />
              <View style={styles.healthInfo}>
                <Text style={styles.healthLabel}>API Status</Text>
                <Text style={styles.healthValue}>Operational</Text>
              </View>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthItem}>
              <View style={[styles.healthIndicator, styles.healthGood]} />
              <View style={styles.healthInfo}>
                <Text style={styles.healthLabel}>Video Calls</Text>
                <Text style={styles.healthValue}>99.9% Uptime</Text>
              </View>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthItem}>
              <View style={[styles.healthIndicator, styles.healthGood]} />
              <View style={styles.healthInfo}>
                <Text style={styles.healthLabel}>Payments</Text>
                <Text style={styles.healthValue}>Processing</Text>
              </View>
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
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  metricGradient: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  metricLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  metricSubStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metricSubText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
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
  revenueCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  revenueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  revenueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  viewAllLink: {
    fontSize: 14,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  revenueStats: {
    flexDirection: 'row',
  },
  revenueStat: {
    flex: 1,
    alignItems: 'center',
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.success,
  },
  revenueLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  revenueDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  alertIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  alertWarning: {
    backgroundColor: '#F59E0B',
  },
  alertInfo: {
    backgroundColor: PsychiColors.azure,
  },
  alertSuccess: {
    backgroundColor: PsychiColors.success,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#2A2A2A',
  },
  alertAction: {
    fontSize: 14,
    color: PsychiColors.azure,
    fontWeight: '600',
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
  actionIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
    textAlign: 'center',
  },
  actionBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: PsychiColors.coral,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionBadgeText: {
    color: PsychiColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  activityCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PsychiColors.azure,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  healthCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  healthItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  healthDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  healthIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.sm,
  },
  healthGood: {
    backgroundColor: PsychiColors.success,
  },
  healthInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 14,
    color: '#2A2A2A',
  },
  healthValue: {
    fontSize: 14,
    color: PsychiColors.success,
    fontWeight: '500',
  },
});
