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
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { DollarIcon } from '@/components/icons';
import { getAdminStats } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import { Config } from '@/constants/config';
import type { AdminStats } from '@/types/database';

// Stripe fee: 2.9% + $0.30 per transaction
const STRIPE_PERCENTAGE = 0.029;
const STRIPE_FIXED_FEE = 0.30;

export default function AdminRevenue() {
  const { isDemoMode } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
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

  // Calculate revenue distribution
  const totalRevenue = stats?.totalRevenue || 0;
  const completedSessions = stats?.completedSessions || 0;

  // Estimate Stripe fees (2.9% + $0.30 per transaction)
  const stripeFees = (totalRevenue * STRIPE_PERCENTAGE) + (completedSessions * STRIPE_FIXED_FEE);
  const revenueAfterStripe = totalRevenue - stripeFees;

  // Distribution after Stripe fees
  const psychiShare = revenueAfterStripe * Config.platformCommission;
  const supportersShare = revenueAfterStripe * Config.supporterCommission;

  const handleRequestPayout = () => {
    if (psychiShare < 100) {
      Alert.alert(
        'Minimum Not Met',
        'Minimum payout amount is $100. Current Psychi balance: $' + psychiShare.toFixed(2)
      );
      return;
    }

    Alert.alert(
      'Request Payout',
      `Request payout of $${psychiShare.toFixed(2)} to Psychi's account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Payout',
          onPress: () => {
            Alert.alert('Success', 'Payout request submitted. Funds will arrive in 2-3 business days.');
          },
        },
      ]
    );
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
          <Text style={styles.headerTitle}>Revenue</Text>
          {isDemoMode && (
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>Demo</Text>
            </View>
          )}
        </View>

        {/* Total Revenue Card */}
        <View style={styles.totalCard}>
          <LinearGradient
            colors={[PsychiColors.deep, PsychiColors.azure]}
            style={styles.totalGradient}
          >
            <Text style={styles.totalLabel}>Total Revenue</Text>
            <Text style={styles.totalAmount}>
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            <Text style={styles.totalSessions}>
              from {completedSessions} completed sessions
            </Text>
          </LinearGradient>
        </View>

        {/* Revenue Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Distribution</Text>
          <View style={styles.distributionCard}>
            {/* Gross Revenue */}
            <View style={styles.distRow}>
              <Text style={styles.distLabel}>Gross Revenue</Text>
              <Text style={styles.distValue}>${totalRevenue.toFixed(2)}</Text>
            </View>

            <View style={styles.distDivider} />

            {/* Stripe Fees */}
            <View style={styles.distRow}>
              <View>
                <Text style={styles.distLabel}>Stripe Fees</Text>
                <Text style={styles.distSub}>2.9% + $0.30/transaction</Text>
              </View>
              <Text style={[styles.distValue, { color: PsychiColors.error }]}>
                -${stripeFees.toFixed(2)}
              </Text>
            </View>

            <View style={styles.distDivider} />

            {/* Net Revenue */}
            <View style={styles.distRow}>
              <Text style={[styles.distLabel, { fontWeight: '600' }]}>Net Revenue</Text>
              <Text style={[styles.distValue, { fontWeight: '700' }]}>${revenueAfterStripe.toFixed(2)}</Text>
            </View>

            <View style={styles.distSpacer} />

            {/* Psychi Share */}
            <View style={styles.distRow}>
              <View>
                <Text style={styles.distLabel}>Psychi ({(Config.platformCommission * 100).toFixed(0)}%)</Text>
                <Text style={styles.distSub}>Platform commission</Text>
              </View>
              <Text style={[styles.distValue, { color: PsychiColors.success }]}>
                ${psychiShare.toFixed(2)}
              </Text>
            </View>

            <View style={styles.distDivider} />

            {/* Supporters Share */}
            <View style={styles.distRow}>
              <View>
                <Text style={styles.distLabel}>Supporters ({(Config.supporterCommission * 100).toFixed(0)}%)</Text>
                <Text style={styles.distSub}>Paid to supporters</Text>
              </View>
              <Text style={[styles.distValue, { color: PsychiColors.coral }]}>
                ${supportersShare.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Psychi Payout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Psychi Payout</Text>
          <View style={styles.payoutCard}>
            <View style={styles.payoutBalance}>
              <Text style={styles.payoutLabel}>Available Balance</Text>
              <Text style={styles.payoutAmount}>${psychiShare.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.payoutButton, psychiShare < 100 && styles.payoutButtonDisabled]}
              onPress={handleRequestPayout}
            >
              <DollarIcon size={18} color={PsychiColors.white} />
              <Text style={styles.payoutButtonText}>Request Payout</Text>
            </TouchableOpacity>
            <Text style={styles.payoutNote}>Minimum payout: $100</Text>
          </View>
        </View>

        {/* Monthly Revenue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Month</Text>
          <View style={styles.monthCard}>
            <View style={styles.monthRow}>
              <Text style={styles.monthLabel}>Monthly Revenue</Text>
              <Text style={styles.monthValue}>${(stats?.monthlyRevenue || 0).toFixed(2)}</Text>
            </View>
            <View style={styles.monthDivider} />
            <View style={styles.monthRow}>
              <Text style={styles.monthLabel}>Psychi's Share</Text>
              <Text style={[styles.monthValue, { color: PsychiColors.success }]}>
                ${((stats?.monthlyRevenue || 0) * Config.platformCommission * (1 - STRIPE_PERCENTAGE)).toFixed(2)}
              </Text>
            </View>
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
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: PsychiColors.white,
    marginTop: 4,
  },
  totalSessions: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.xs,
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
  distributionCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  distRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  distLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  distSub: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  distValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  distDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  distSpacer: {
    height: Spacing.sm,
    borderTopWidth: 2,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: Spacing.xs,
  },
  payoutCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  payoutBalance: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  payoutLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  payoutAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: PsychiColors.success,
    marginTop: 4,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.deep,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    width: '100%',
  },
  payoutButtonDisabled: {
    backgroundColor: PsychiColors.textMuted,
  },
  payoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  payoutNote: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: Spacing.sm,
  },
  monthCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  monthLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  monthValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  monthDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});
