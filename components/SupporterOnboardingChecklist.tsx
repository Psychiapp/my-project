/**
 * Supporter Onboarding Checklist
 * Shows required steps before supporters can receive clients
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  CheckIcon,
  DocumentIcon,
  BankIcon,
  BookIcon,
  ChevronRightIcon,
  AlertIcon,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface OnboardingStatus {
  w9_completed: boolean;
  stripe_payouts_enabled: boolean;
  training_complete: boolean;
  onboarding_complete: boolean;
}

interface ChecklistItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  completed: boolean;
  onPress: () => void;
}

function ChecklistItem({ icon: Icon, title, subtitle, completed, onPress }: ChecklistItemProps) {
  return (
    <TouchableOpacity
      style={styles.checklistItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={completed}
    >
      <View style={[styles.checklistIcon, completed && styles.checklistIconCompleted]}>
        {completed ? (
          <CheckIcon size={18} color={PsychiColors.white} />
        ) : (
          <Icon size={18} color={PsychiColors.azure} />
        )}
      </View>
      <View style={styles.checklistInfo}>
        <Text style={[styles.checklistTitle, completed && styles.checklistTitleCompleted]}>
          {title}
        </Text>
        <Text style={styles.checklistSubtitle}>{subtitle}</Text>
      </View>
      {!completed && (
        <ChevronRightIcon size={18} color={PsychiColors.textMuted} />
      )}
    </TouchableOpacity>
  );
}

interface SupporterOnboardingChecklistProps {
  onComplete?: () => void;
}

export default function SupporterOnboardingChecklist({ onComplete }: SupporterOnboardingChecklistProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<OnboardingStatus>({
    w9_completed: false,
    stripe_payouts_enabled: false,
    training_complete: false,
    onboarding_complete: false,
  });

  useEffect(() => {
    loadOnboardingStatus();
  }, [user?.id]);

  const loadOnboardingStatus = async () => {
    if (!user?.id || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('w9_completed, stripe_payouts_enabled, training_complete, onboarding_complete')
        .eq('id', user.id)
        .single();

      if (profile) {
        setStatus({
          w9_completed: profile.w9_completed || false,
          stripe_payouts_enabled: profile.stripe_payouts_enabled || false,
          training_complete: profile.training_complete || false,
          onboarding_complete: profile.onboarding_complete || false,
        });

        // Call onComplete if all steps are done
        if (profile.onboarding_complete && onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate progress
  const completedSteps = [
    status.w9_completed,
    status.stripe_payouts_enabled,
    status.training_complete,
  ].filter(Boolean).length;
  const totalSteps = 3;
  const progress = completedSteps / totalSteps;

  // Don't show if onboarding is complete
  if (status.onboarding_complete) {
    return null;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={PsychiColors.azure} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(74, 144, 226, 0.08)', 'rgba(123, 104, 176, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <AlertIcon size={20} color={PsychiColors.warning} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Complete Your Setup</Text>
            <Text style={styles.headerSubtitle}>
              Finish these steps before you can receive clients
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {completedSteps} of {totalSteps} complete
          </Text>
        </View>

        {/* Checklist Items */}
        <View style={styles.checklist}>
          <ChecklistItem
            icon={DocumentIcon}
            title="Complete W-9 Form"
            subtitle="Required for tax reporting"
            completed={status.w9_completed}
            onPress={() => router.push('/(supporter)/w9-form')}
          />

          <ChecklistItem
            icon={BankIcon}
            title="Set Up Payout Method"
            subtitle="Connect your bank account via Stripe"
            completed={status.stripe_payouts_enabled}
            onPress={() => router.push('/(supporter)/payout-settings')}
          />

          <ChecklistItem
            icon={BookIcon}
            title="Complete Training"
            subtitle="Finish all training modules"
            completed={status.training_complete}
            onPress={() => router.push('/(supporter)/training')}
          />
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            You will begin receiving client assignments once all steps are complete.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing['6'],
    marginBottom: Spacing['6'],
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.15)',
  },
  loadingContainer: {
    padding: Spacing['6'],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.cloud,
  },
  gradient: {
    padding: Spacing['5'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing['4'],
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${PsychiColors.warning}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing['3'],
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  progressContainer: {
    marginBottom: Spacing['4'],
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing['2'],
  },
  progressFill: {
    height: '100%',
    backgroundColor: PsychiColors.azure,
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },
  checklist: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  checklistIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing['3'],
  },
  checklistIconCompleted: {
    backgroundColor: PsychiColors.success,
  },
  checklistInfo: {
    flex: 1,
  },
  checklistTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  checklistTitleCompleted: {
    color: PsychiColors.textMuted,
    textDecorationLine: 'line-through',
  },
  checklistSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  infoNote: {
    marginTop: Spacing['4'],
    paddingTop: Spacing['3'],
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  infoNoteText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.azure,
    textAlign: 'center',
    lineHeight: Typography.fontSize.xs * Typography.lineHeight.relaxed,
  },
});
