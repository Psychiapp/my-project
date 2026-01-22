/**
 * Payout Settings Screen
 * Manage bank account and payout schedule
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { BankIcon, DocumentIcon, ChevronRightIcon } from '@/components/icons';
import { ChevronLeftIcon, CheckIcon, LockIcon } from '@/components/icons';

type PayoutSchedule = 'weekly' | 'biweekly' | 'monthly';

export default function PayoutSettingsScreen() {
  const [bankAccountLinked, setBankAccountLinked] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule>('weekly');
  const [isLinking, setIsLinking] = useState(false);

  // Bank account form
  const [accountHolder, setAccountHolder] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  const handleLinkBankAccount = async () => {
    // Validation
    if (!accountHolder.trim()) {
      Alert.alert('Error', 'Please enter account holder name');
      return;
    }
    if (routingNumber.length !== 9) {
      Alert.alert('Error', 'Routing number must be 9 digits');
      return;
    }
    if (accountNumber.length < 4) {
      Alert.alert('Error', 'Please enter a valid account number');
      return;
    }
    if (accountNumber !== confirmAccountNumber) {
      Alert.alert('Error', 'Account numbers do not match');
      return;
    }

    setIsLinking(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLinking(false);
    setBankAccountLinked(true);
    Alert.alert('Success', 'Bank account linked successfully!');
  };

  const handleUpdateSchedule = (schedule: PayoutSchedule) => {
    setPayoutSchedule(schedule);
    Alert.alert('Updated', `Payout schedule set to ${schedule}`);
  };

  const scheduleOptions = [
    { id: 'weekly' as PayoutSchedule, label: 'Weekly', description: 'Every Friday' },
    { id: 'biweekly' as PayoutSchedule, label: 'Bi-weekly', description: 'Every other Friday' },
    { id: 'monthly' as PayoutSchedule, label: 'Monthly', description: '1st of each month' },
  ];

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
        {/* Bank Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Account</Text>

          {bankAccountLinked ? (
            // Linked Account View
            <View style={styles.linkedAccountCard}>
              <View style={styles.linkedAccountHeader}>
                <View style={styles.bankIcon}>
                  <BankIcon size={24} color={PsychiColors.azure} />
                </View>
                <View style={styles.linkedAccountInfo}>
                  <Text style={styles.linkedAccountName}>{accountHolder || 'Bank Account'}</Text>
                  <Text style={styles.linkedAccountNumber}>
                    ••••{accountNumber.slice(-4)}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <CheckIcon size={16} color={PsychiColors.success} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.changeAccountButton}
                onPress={() => setBankAccountLinked(false)}
              >
                <Text style={styles.changeAccountText}>Change Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Link Account Form
            <View style={styles.formCard}>
              <View style={styles.securityNote}>
                <LockIcon size={16} color={PsychiColors.azure} />
                <Text style={styles.securityText}>
                  Your banking information is encrypted and secure
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name</Text>
                <TextInput
                  style={styles.input}
                  value={accountHolder}
                  onChangeText={setAccountHolder}
                  placeholder="John Doe"
                  placeholderTextColor={PsychiColors.textSoft}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Routing Number</Text>
                <TextInput
                  style={styles.input}
                  value={routingNumber}
                  onChangeText={(text) => setRoutingNumber(text.replace(/\D/g, '').slice(0, 9))}
                  placeholder="9 digits"
                  placeholderTextColor={PsychiColors.textSoft}
                  keyboardType="number-pad"
                  maxLength={9}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number</Text>
                <TextInput
                  style={styles.input}
                  value={accountNumber}
                  onChangeText={(text) => setAccountNumber(text.replace(/\D/g, ''))}
                  placeholder="Your account number"
                  placeholderTextColor={PsychiColors.textSoft}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Account Number</Text>
                <TextInput
                  style={styles.input}
                  value={confirmAccountNumber}
                  onChangeText={(text) => setConfirmAccountNumber(text.replace(/\D/g, ''))}
                  placeholder="Re-enter account number"
                  placeholderTextColor={PsychiColors.textSoft}
                  keyboardType="number-pad"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.linkButton, isLinking && styles.linkButtonDisabled]}
                onPress={handleLinkBankAccount}
                disabled={isLinking}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[PsychiColors.azure, PsychiColors.deep] as const}
                  style={styles.linkButtonGradient}
                >
                  {isLinking ? (
                    <ActivityIndicator color={PsychiColors.white} />
                  ) : (
                    <Text style={styles.linkButtonText}>Link Bank Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Payout Schedule Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payout Schedule</Text>
          <View style={styles.scheduleCard}>
            {scheduleOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.scheduleOption,
                  payoutSchedule === option.id && styles.scheduleOptionActive,
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
        </View>

        {/* Minimum Payout */}
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
          </View>
        </View>

        {/* Tax Info */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.taxCard} activeOpacity={0.7}>
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
  bankEmoji: {
    fontSize: 24,
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
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  securityText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.azure,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.midnight,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: PsychiColors.midnight,
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
  taxEmoji: {
    fontSize: 22,
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
  taxArrow: {
    fontSize: 24,
    color: PsychiColors.textSoft,
  },
});
