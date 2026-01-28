/**
 * Payout Settings Screen
 * Manage Stripe Connect account and payout schedule
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { BankIcon, DocumentIcon, ChevronRightIcon } from '@/components/icons';
import { ChevronLeftIcon, CheckIcon, LockIcon, AlertIcon, ClockIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  createConnectAccount,
  openConnectOnboarding,
  isPayoutReady,
  stripeAvailable,
} from '@/lib/stripe';
import type { StripeConnectStatus, PayoutSchedule } from '@/types/database';

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

const DAYS_OF_MONTH = Array.from({ length: 28 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function PayoutSettingsScreen() {
  const { user, isDemoMode } = useAuth();
  const params = useLocalSearchParams();

  // Stripe Connect state
  const [stripeConnectId, setStripeConnectId] = useState<string | null>(null);
  const [stripeConnectStatus, setStripeConnectStatus] = useState<StripeConnectStatus | null>(null);
  const [payoutsEnabled, setPayoutsEnabled] = useState(false);
  const [fullName, setFullName] = useState<string>('Supporter');
  const [isLoading, setIsLoading] = useState(true);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Payout schedule state
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule>('weekly');
  const [weeklyDay, setWeeklyDay] = useState('friday');
  const [monthlyDay, setMonthlyDay] = useState(1);

  // Load supporter profile data
  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  // Handle return from Stripe onboarding
  useEffect(() => {
    if (params.success === 'true') {
      loadProfile();
      Alert.alert('Success', 'Your payout account has been set up!');
    } else if (params.refresh === 'true') {
      loadProfile();
    }
  }, [params.success, params.refresh]);

  const loadProfile = async () => {
    if (!user?.id || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('stripe_connect_id, stripe_connect_status, stripe_payouts_enabled, payout_schedule, payout_schedule_day, full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setStripeConnectId(data.stripe_connect_id);
        setStripeConnectStatus(data.stripe_connect_status);
        setPayoutsEnabled(data.stripe_payouts_enabled || false);
        if (data.full_name) {
          setFullName(data.full_name);
        }
        if (data.payout_schedule) {
          setPayoutSchedule(data.payout_schedule);
        }
        if (data.payout_schedule_day) {
          if (data.payout_schedule === 'weekly') {
            setWeeklyDay(data.payout_schedule_day);
          } else if (data.payout_schedule === 'monthly') {
            setMonthlyDay(parseInt(data.payout_schedule_day, 10) || 1);
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPayouts = async () => {
    // Check for demo mode - payout setup requires real Stripe integration
    if (isDemoMode || !stripeAvailable) {
      Alert.alert(
        'Demo Mode',
        'Payout setup is not available in demo mode. In the live app, you\'ll be guided through a secure process to verify your identity and link your bank account.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user?.id || !user?.email) {
      Alert.alert('Error', 'User information not available');
      return;
    }

    setIsSettingUp(true);

    try {
      if (stripeConnectId) {
        // Already have an account, just open onboarding to complete/update
        await openConnectOnboarding(stripeConnectId);
      } else {
        // Create a new Connect account
        const { accountId } = await createConnectAccount(
          user.id,
          user.email,
          fullName
        );
        setStripeConnectId(accountId);
        setStripeConnectStatus('pending');

        // Open onboarding
        await openConnectOnboarding(accountId);
      }
    } catch (error: unknown) {
      console.error('Setup error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to set up payouts');
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleUpdateSchedule = async (schedule: PayoutSchedule) => {
    setPayoutSchedule(schedule);

    if (!user?.id || !supabase) return;

    try {
      await supabase
        .from('profiles')
        .update({
          payout_schedule: schedule,
          payout_schedule_day: schedule === 'weekly' ? weeklyDay : schedule === 'monthly' ? monthlyDay.toString() : null,
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };

  const handleUpdateScheduleDay = async (day: string | number) => {
    if (payoutSchedule === 'weekly') {
      setWeeklyDay(day as string);
    } else if (payoutSchedule === 'monthly') {
      setMonthlyDay(day as number);
    }

    if (!user?.id || !supabase) return;

    try {
      await supabase
        .from('profiles')
        .update({
          payout_schedule_day: day.toString(),
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating schedule day:', error);
    }
  };

  const getScheduleDescription = (schedule: PayoutSchedule): string => {
    switch (schedule) {
      case 'manual':
        return 'You trigger payouts manually';
      case 'daily':
        return 'Every business day';
      case 'weekly':
        return `Every ${DAYS_OF_WEEK.find(d => d.value === weeklyDay)?.label || 'Friday'}`;
      case 'monthly':
        return `${monthlyDay}${getOrdinalSuffix(monthlyDay)} of each month`;
      default:
        return '';
    }
  };

  const scheduleOptions = [
    { id: 'manual' as PayoutSchedule, label: 'Manual', description: 'Trigger payouts yourself' },
    { id: 'daily' as PayoutSchedule, label: 'Daily', description: 'Every business day (2-day delay)' },
    { id: 'weekly' as PayoutSchedule, label: 'Weekly', description: 'Choose your payout day' },
    { id: 'monthly' as PayoutSchedule, label: 'Monthly', description: 'Choose your payout date' },
  ];

  const payoutStatus = isPayoutReady(stripeConnectId, stripeConnectStatus, payoutsEnabled);

  const getStatusBadge = () => {
    if (!stripeConnectId) {
      return null;
    }

    if (stripeConnectStatus === 'active' && payoutsEnabled) {
      return (
        <View style={styles.verifiedBadge}>
          <CheckIcon size={16} color={PsychiColors.success} />
          <Text style={styles.verifiedText}>Active</Text>
        </View>
      );
    }

    if (stripeConnectStatus === 'pending_verification') {
      return (
        <View style={styles.pendingBadge}>
          <ClockIcon size={16} color={PsychiColors.warning} />
          <Text style={styles.pendingText}>Verifying</Text>
        </View>
      );
    }

    if (stripeConnectStatus === 'pending') {
      return (
        <View style={styles.pendingBadge}>
          <AlertIcon size={16} color={PsychiColors.warning} />
          <Text style={styles.pendingText}>Incomplete</Text>
        </View>
      );
    }

    return (
      <View style={styles.errorBadge}>
        <AlertIcon size={16} color={PsychiColors.error} />
        <Text style={styles.errorText}>Issue</Text>
      </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payout Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Payout Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Account</Text>

          {stripeConnectId && stripeConnectStatus === 'active' && payoutsEnabled ? (
            // Connected Account View
            <View style={styles.linkedAccountCard}>
              <View style={styles.linkedAccountHeader}>
                <View style={styles.bankIcon}>
                  <BankIcon size={24} color={PsychiColors.azure} />
                </View>
                <View style={styles.linkedAccountInfo}>
                  <Text style={styles.linkedAccountName}>Bank Account Connected</Text>
                  <Text style={styles.linkedAccountNumber}>
                    Powered by Stripe
                  </Text>
                </View>
                {getStatusBadge()}
              </View>
              <TouchableOpacity
                style={styles.changeAccountButton}
                onPress={handleSetupPayouts}
              >
                <Text style={styles.changeAccountText}>Update Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Setup Account Card
            <View style={styles.formCard}>
              <View style={styles.securityNote}>
                <LockIcon size={16} color={PsychiColors.azure} />
                <Text style={styles.securityText}>
                  Secure bank setup powered by Stripe
                </Text>
              </View>

              {stripeConnectId && (
                <View style={styles.statusCard}>
                  <View style={styles.statusHeader}>
                    {getStatusBadge()}
                  </View>
                  <Text style={styles.statusMessage}>{payoutStatus.message}</Text>
                </View>
              )}

              <Text style={styles.setupDescription}>
                {stripeConnectId
                  ? 'Complete your account setup to start receiving payouts for your sessions.'
                  : 'Set up your payout account to receive earnings from your sessions. You\'ll be guided through a secure process to verify your identity and link your bank account.'
                }
              </Text>

              <TouchableOpacity
                style={[styles.linkButton, isSettingUp && styles.linkButtonDisabled]}
                onPress={handleSetupPayouts}
                disabled={isSettingUp}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[PsychiColors.azure, PsychiColors.deep] as const}
                  style={styles.linkButtonGradient}
                >
                  {isSettingUp ? (
                    <ActivityIndicator color={PsychiColors.white} />
                  ) : (
                    <Text style={styles.linkButtonText}>
                      {stripeConnectId ? 'Complete Setup' : 'Set Up Payouts'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payout Schedule Section - Only show if account is set up */}
        {stripeConnectId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payout Schedule</Text>
            <View style={styles.scheduleCard}>
              {scheduleOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.scheduleOption,
                    payoutSchedule === option.id && styles.scheduleOptionActive,
                    index === scheduleOptions.length - 1 && styles.scheduleOptionLast,
                  ]}
                  onPress={() => handleUpdateSchedule(option.id)}
                >
                  <View style={styles.scheduleOptionLeft}>
                    <View style={[
                      styles.radioCircle,
                      payoutSchedule === option.id && styles.radioCircleActive,
                    ]}>
                      {payoutSchedule === option.id && <View style={styles.radioInner} />}
                    </View>
                    <View>
                      <Text style={[
                        styles.scheduleLabel,
                        payoutSchedule === option.id && styles.scheduleLabelActive,
                      ]}>
                        {option.label}
                      </Text>
                      <Text style={styles.scheduleDescription}>{option.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Weekly Day Picker */}
            {payoutSchedule === 'weekly' && (
              <View style={styles.dayPickerCard}>
                <Text style={styles.dayPickerLabel}>Payout Day</Text>
                <View style={styles.dayPickerOptions}>
                  {DAYS_OF_WEEK.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.dayOption,
                        weeklyDay === day.value && styles.dayOptionActive,
                      ]}
                      onPress={() => handleUpdateScheduleDay(day.value)}
                    >
                      <Text style={[
                        styles.dayOptionText,
                        weeklyDay === day.value && styles.dayOptionTextActive,
                      ]}>
                        {day.label.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.dayPickerNote}>
                  Payouts will be sent every {DAYS_OF_WEEK.find(d => d.value === weeklyDay)?.label}
                </Text>
              </View>
            )}

            {/* Monthly Day Picker */}
            {payoutSchedule === 'monthly' && (
              <View style={styles.dayPickerCard}>
                <Text style={styles.dayPickerLabel}>Payout Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.monthlyDayScroll}
                >
                  {DAYS_OF_MONTH.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.monthDayOption,
                        monthlyDay === day.value && styles.monthDayOptionActive,
                      ]}
                      onPress={() => handleUpdateScheduleDay(day.value)}
                    >
                      <Text style={[
                        styles.monthDayText,
                        monthlyDay === day.value && styles.monthDayTextActive,
                      ]}>
                        {day.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={styles.dayPickerNote}>
                  Payouts will be sent on the {monthlyDay}{getOrdinalSuffix(monthlyDay)} of each month
                </Text>
              </View>
            )}

            {/* Current Schedule Summary */}
            <View style={styles.scheduleSummary}>
              <Text style={styles.scheduleSummaryLabel}>Current Schedule:</Text>
              <Text style={styles.scheduleSummaryValue}>{getScheduleDescription(payoutSchedule)}</Text>
            </View>
          </View>
        )}

        {/* Payout Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Info</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Minimum Payout</Text>
              <Text style={styles.infoValue}>$25.00</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Processing Time</Text>
              <Text style={styles.infoValue}>2-3 business days</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Transfer Fee</Text>
              <Text style={styles.infoValue}>Free</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Your Earnings</Text>
              <Text style={styles.infoValue}>75% of session fee</Text>
            </View>
          </View>
        </View>

        {/* Tax Info */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.taxCard}
            activeOpacity={0.7}
            onPress={() => router.push('/(supporter)/tax-documents')}
          >
            <View style={styles.taxIcon}>
              <DocumentIcon size={24} color={PsychiColors.azure} />
            </View>
            <View style={styles.taxInfo}>
              <Text style={styles.taxTitle}>Tax Documents</Text>
              <Text style={styles.taxSubtitle}>View and download 1099 forms</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.serif,
  },
  linkedAccountCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  linkedAccountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  linkedAccountInfo: {
    flex: 1,
  },
  linkedAccountName: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  linkedAccountNumber: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  pendingText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.warning,
  },
  errorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  changeAccountButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  changeAccountText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  formCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.azure,
  },
  statusCard: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statusHeader: {
    marginBottom: Spacing.xs,
  },
  statusMessage: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  setupDescription: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  linkButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  linkButtonDisabled: {
    opacity: 0.7,
  },
  linkButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  scheduleCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  scheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  scheduleOptionLast: {
    borderBottomWidth: 0,
  },
  scheduleOptionActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
  },
  scheduleOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PsychiColors.textMuted,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: PsychiColors.azure,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PsychiColors.azure,
  },
  scheduleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: PsychiColors.midnight,
  },
  scheduleLabelActive: {
    color: PsychiColors.azure,
    fontWeight: '600',
  },
  scheduleDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.sm,
  },
  taxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  taxIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  taxInfo: {
    flex: 1,
  },
  taxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  taxSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  dayPickerCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    ...Shadows.soft,
  },
  dayPickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.sm,
  },
  dayPickerOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  dayOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.cream,
    alignItems: 'center',
  },
  dayOptionActive: {
    backgroundColor: PsychiColors.azure,
  },
  dayOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.textSecondary,
  },
  dayOptionTextActive: {
    color: PsychiColors.white,
    fontWeight: '600',
  },
  dayPickerNote: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  monthlyDayScroll: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  monthDayOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PsychiColors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  monthDayOptionActive: {
    backgroundColor: PsychiColors.azure,
  },
  monthDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: PsychiColors.textSecondary,
  },
  monthDayTextActive: {
    color: PsychiColors.white,
    fontWeight: '600',
  },
  scheduleSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  scheduleSummaryLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  scheduleSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
});
