import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { UsersIcon, DollarIcon, ChartIcon, CheckIcon, CloseIcon, LogoutIcon } from '@/components/icons';
import { getAdminStats } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { AdminStats } from '@/types/database';

interface HealthStatus {
  database: 'online' | 'offline' | 'checking';
  lastChecked: Date | null;
}

export default function AdminHome() {
  const router = useRouter();
  const { isDemoMode, signOut } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [health, setHealth] = useState<HealthStatus>({ database: 'checking', lastChecked: null });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const checkHealth = async () => {
    try {
      // Test database connection with a simple query
      const { error } = await supabase.from('profiles').select('id').limit(1);
      setHealth({
        database: error ? 'offline' : 'online',
        lastChecked: new Date(),
      });
    } catch {
      setHealth({ database: 'offline', lastChecked: new Date() });
    }
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
        setHealth({ database: 'online', lastChecked: new Date() });
      } else {
        const [adminStats] = await Promise.all([
          getAdminStats(),
          checkHealth(),
        ]);
        setStats(adminStats);
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

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  const formatTime = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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
          <Text style={styles.headerTitle}>Admin</Text>
          {isDemoMode && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Demo</Text>
            </View>
          )}
        </View>

        {/* Snapshot Cards */}
        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotCard}>
            <UsersIcon size={24} color={PsychiColors.azure} />
            <Text style={styles.snapshotValue}>{stats?.totalUsers || 0}</Text>
            <Text style={styles.snapshotLabel}>Total Users</Text>
          </View>

          <View style={styles.snapshotCard}>
            <DollarIcon size={24} color={PsychiColors.success} />
            <Text style={[styles.snapshotValue, { color: PsychiColors.success }]}>
              ${(stats?.totalRevenue || 0).toLocaleString()}
            </Text>
            <Text style={styles.snapshotLabel}>Total Revenue</Text>
          </View>

          <View style={styles.snapshotCard}>
            <ChartIcon size={24} color={PsychiColors.violet} />
            <Text style={styles.snapshotValue}>{stats?.totalSessions || 0}</Text>
            <Text style={styles.snapshotLabel}>Total Sessions</Text>
          </View>
        </View>

        {/* Platform Health */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Health</Text>
          <View style={styles.healthCard}>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Database</Text>
              <View style={styles.healthStatus}>
                {health.database === 'checking' ? (
                  <ActivityIndicator size="small" color={PsychiColors.azure} />
                ) : health.database === 'online' ? (
                  <>
                    <View style={[styles.healthDot, styles.healthOnline]} />
                    <Text style={[styles.healthText, { color: PsychiColors.success }]}>Online</Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.healthDot, styles.healthOffline]} />
                    <Text style={[styles.healthText, { color: PsychiColors.error }]}>Offline</Text>
                  </>
                )}
              </View>
            </View>
            <View style={styles.healthDivider} />
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>Last Checked</Text>
              <Text style={styles.healthText}>{formatTime(health.lastChecked)}</Text>
            </View>
            <TouchableOpacity style={styles.healthRefresh} onPress={checkHealth}>
              <Text style={styles.healthRefreshText}>Refresh Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Clients</Text>
              <Text style={styles.statValue}>{stats?.totalClients || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Supporters</Text>
              <Text style={styles.statValue}>{stats?.totalSupporters || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Active Sessions</Text>
              <Text style={styles.statValue}>{stats?.activeSessions || 0}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Pending Verification</Text>
              <Text style={[styles.statValue, (stats?.pendingSupporters || 0) > 0 && { color: '#F59E0B' }]}>
                {stats?.pendingSupporters || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogoutIcon size={20} color={PsychiColors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  snapshotGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  snapshotValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    marginTop: Spacing.sm,
  },
  snapshotLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  healthCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  healthLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthOnline: {
    backgroundColor: PsychiColors.success,
  },
  healthOffline: {
    backgroundColor: PsychiColors.error,
  },
  healthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  healthDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  healthRefresh: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  healthRefreshText: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
  statsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  statDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.error,
  },
});
