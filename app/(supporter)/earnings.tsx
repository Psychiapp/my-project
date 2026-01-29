import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  DollarIcon,
  ChartIcon,
  ArrowRightIcon,
  CheckIcon,
  SettingsIcon,
  ChevronRightIcon,
  ClockIcon,
  AlertIcon,
  DocumentIcon,
} from '@/components/icons';
import { Config } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { requestPayout, isPayoutReady } from '@/lib/stripe';
import type { Payout, StripeConnectStatus } from '@/types/database';

type TimeRange = 'week' | 'month' | 'all';

interface EarningsData {
  total: number;
  sessions: number;
  pending: number;
}

interface ProfileData {
  total_earnings: number;
  pending_payout: number;
  stripe_connect_id: string | null;
  stripe_connect_status: StripeConnectStatus | null;
  stripe_payouts_enabled: boolean;
}

export default function EarningsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayout, setIsRequestingPayout] = useState(false);

  // Profile data
  const [profile, setProfile] = useState<ProfileData | null>(null);

  // Earnings data
  const [earnings, setEarnings] = useState<Record<TimeRange, EarningsData>>({
    week: { total: 0, sessions: 0, pending: 0 },
    month: { total: 0, sessions: 0, pending: 0 },
    all: { total: 0, sessions: 0, pending: 0 },
  });

  // Payout history
  const [payouts, setPayouts] = useState<Payout[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    if (!user?.id || !supabase) return;

    try {
      // Load profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_earnings, pending_payout, stripe_connect_id, stripe_connect_status, stripe_payouts_enabled')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load session counts for different time ranges
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all completed sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, session_type, scheduled_at')
        .eq('supporter_id', user.id)
        .eq('status', 'completed');

      if (sessionsError) throw sessionsError;

      // Calculate earnings by time range
      const calculateEarnings = (sessionList: typeof sessions) => {
        let total = 0;
        sessionList?.forEach(session => {
          const pricing = Config.pricing[session.session_type as keyof typeof Config.pricing];
          if (pricing) {
            total += pricing.supporterCut;
          }
        });
        return total / 100; // Convert from cents to dollars
      };

      const weekSessions = sessions?.filter(s => new Date(s.scheduled_at) >= weekAgo) || [];
      const monthSessions = sessions?.filter(s => new Date(s.scheduled_at) >= monthAgo) || [];
      const allSessions = sessions || [];

      setEarnings({
        week: {
          total: calculateEarnings(weekSessions),
          sessions: weekSessions.length,
          pending: (profileData?.pending_payout || 0) / 100,
        },
        month: {
          total: calculateEarnings(monthSessions),
          sessions: monthSessions.length,
          pending: (profileData?.pending_payout || 0) / 100,
        },
        all: {
          total: (profileData?.total_earnings || 0) / 100,
          sessions: allSessions.length,
          pending: (profileData?.pending_payout || 0) / 100,
        },
      });

      // Load payout history
      const { data: payoutData, error: payoutError } = await supabase
        .from('payouts')
        .select('*')
        .eq('supporter_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!payoutError && payoutData) {
        setPayouts(payoutData);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async () => {
    if (!user?.id || !profile) return;

    const payoutStatus = isPayoutReady(
      profile.stripe_connect_id,
      profile.stripe_connect_status,
      profile.stripe_payouts_enabled
    );

    if (!payoutStatus.ready) {
      Alert.alert('Cannot Request Payout', payoutStatus.message, [
        { text: 'Set Up Account', onPress: () => router.push('/(supporter)/payout-settings') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    const pendingAmount = profile.pending_payout;
    if (pendingAmount < 2500) {
      Alert.alert(
        'Minimum Not Met',
        `You need at least $25.00 to request a payout. Current balance: $${(pendingAmount / 100).toFixed(2)}`
      );
      return;
    }

    Alert.alert(
      'Request Payout',
      `Transfer $${(pendingAmount / 100).toFixed(2)} to your bank account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Payout',
          onPress: async () => {
            setIsRequestingPayout(true);
            try {
              await requestPayout(user.id, pendingAmount, profile.stripe_connect_id!);
              Alert.alert('Success', 'Payout requested! Funds will arrive in 2-3 business days.');
              loadData(); // Refresh data
            } catch (error: unknown) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to request payout');
            } finally {
              setIsRequestingPayout(false);
            }
          },
        },
      ]
    );
  };

  const currentEarnings = earnings[timeRange];

  const formatPayoutDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPayoutStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckIcon size={12} color={PsychiColors.success} />;
      case 'pending':
        return <ClockIcon size={12} color={PsychiColors.warning} />;
      case 'failed':
        return <AlertIcon size={12} color={PsychiColors.error} />;
      default:
        return null;
    }
  };

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return PsychiColors.success;
      case 'pending':
        return PsychiColors.warning;
      case 'failed':
        return PsychiColors.error;
      default:
        return PsychiColors.textMuted;
    }
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
            <DollarIcon size={24} color={PsychiColors.azure} />
            <Text style={styles.statValue}>${currentEarnings.pending.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Pending Payout</Text>
          </View>
          <View style={styles.statCard}>
            <ChartIcon size={24} color={PsychiColors.azure} />
            <Text style={styles.statValue}>
              ${(currentEarnings.total / (currentEarnings.sessions || 1)).toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Avg per Session</Text>
          </View>
        </View>

        {/* Request Payout Button */}
        {currentEarnings.pending >= 25 && profile?.stripe_connect_status === 'active' && (
          <View style={styles.payoutButtonContainer}>
            <TouchableOpacity
              style={[styles.payoutButton, isRequestingPayout && styles.payoutButtonDisabled]}
              onPress={handleRequestPayout}
              disabled={isRequestingPayout}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[PsychiColors.success, '#16A34A']}
                style={styles.payoutButtonGradient}
              >
                {isRequestingPayout ? (
                  <ActivityIndicator color={PsychiColors.white} />
                ) : (
                  <>
                    <DollarIcon size={20} color={PsychiColors.white} />
                    <Text style={styles.payoutButtonText}>Request Payout</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Commission Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How Earnings Work</Text>
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Chat session</Text>
              <View style={styles.breakdownValues}>
                <Text style={styles.breakdownGross}>{Config.pricing.chat.display}</Text>
                <ArrowRightIcon size={14} color={PsychiColors.textMuted} />
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
                <ArrowRightIcon size={14} color={PsychiColors.textMuted} />
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
                <ArrowRightIcon size={14} color={PsychiColors.textMuted} />
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
          {payouts.length === 0 ? (
            <View style={styles.emptyPayouts}>
              <Text style={styles.emptyPayoutsText}>No payouts yet</Text>
              <Text style={styles.emptyPayoutsSubtext}>
                Complete sessions to start earning
              </Text>
            </View>
          ) : (
            payouts.map((payout) => (
              <View key={payout.id} style={styles.payoutCard}>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutDate}>{formatPayoutDate(payout.created_at)}</Text>
                  <View style={styles.statusBadge}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {getPayoutStatusIcon(payout.status)}
                      <Text style={[styles.statusText, { color: getPayoutStatusColor(payout.status) }]}>
                        {' '}{payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.payoutAmount}>${(payout.amount / 100).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Payout & Tax Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(supporter)/payout-settings')}
          >
            <View style={styles.settingsIcon}>
              <SettingsIcon size={24} color={PsychiColors.azure} />
            </View>
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>Payout Settings</Text>
              <Text style={styles.settingsSubtitle}>
                {profile?.stripe_connect_status === 'active'
                  ? 'Manage bank account & payout schedule'
                  : 'Set up your payout account'}
              </Text>
            </View>
            <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsButton, { marginTop: Spacing.sm }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(supporter)/w9-form')}
          >
            <View style={[styles.settingsIcon, { backgroundColor: 'rgba(107, 114, 128, 0.1)' }]}>
              <DocumentIcon size={24} color={PsychiColors.textSecondary} />
            </View>
            <View style={styles.settingsInfo}>
              <Text style={styles.settingsTitle}>W-9 Tax Form</Text>
              <Text style={styles.settingsSubtitle}>View or update your tax information</Text>
            </View>
            <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  payoutButtonContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  payoutButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  payoutButtonDisabled: {
    opacity: 0.7,
  },
  payoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
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
  emptyPayouts: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyPayoutsText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  emptyPayoutsSubtext: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
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
});
