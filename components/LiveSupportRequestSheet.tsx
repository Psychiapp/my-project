/**
 * LiveSupportRequestSheet Component
 * Bottom sheet for creating live support requests
 * Handles session type selection, allowance display, and payment
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  ChatIcon,
  PhoneIcon,
  VideoIcon,
  CloseIcon,
  LightningIcon,
  CheckCircleIcon,
  WarningIcon,
  ClockIcon,
} from '@/components/icons';
import type { SessionType } from '@/types/database';
import type { AllowanceCheckResult, PeriodUsageSummary } from '@/types/liveSupport';
import { formatPaygPrice } from '@/types/liveSupport';

interface LiveSupportRequestSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (sessionType: SessionType) => Promise<{ success: boolean; error?: string }>;
  usage: PeriodUsageSummary | null;
  checkAllowance: (sessionType: SessionType) => AllowanceCheckResult;
  isSubmitting: boolean;
  activeRequest?: { sessionType: SessionType; countdown: number } | null;
}

const SESSION_TYPES: { type: SessionType; label: string; description: string; Icon: React.FC<any> }[] = [
  {
    type: 'chat',
    label: 'Chat',
    description: 'Text-based conversation',
    Icon: ChatIcon,
  },
  {
    type: 'phone',
    label: 'Phone Call',
    description: 'Voice conversation',
    Icon: PhoneIcon,
  },
  {
    type: 'video',
    label: 'Video Call',
    description: 'Face-to-face video session',
    Icon: VideoIcon,
  },
];

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  chat: PsychiColors.chatAccent,
  phone: PsychiColors.phoneAccent,
  video: PsychiColors.videoAccent,
};

export default function LiveSupportRequestSheet({
  visible,
  onClose,
  onSubmit,
  usage,
  checkAllowance,
  isSubmitting,
  activeRequest,
}: LiveSupportRequestSheetProps) {
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get allowance info for selected type
  const allowanceInfo = useMemo(() => {
    if (!selectedType) return null;
    return checkAllowance(selectedType);
  }, [selectedType, checkAllowance]);

  const handleSubmit = async () => {
    if (!selectedType) return;

    setError(null);
    const result = await onSubmit(selectedType);

    if (!result.success) {
      setError(result.error || 'Failed to create request');
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedType(null);
      setError(null);
      onClose();
    }
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If there's an active request, show waiting state
  if (activeRequest) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleClose}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.title}>Finding a Supporter</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <CloseIcon size={24} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            </View>

            <View style={styles.waitingContainer}>
              <View style={styles.waitingAnimation}>
                <LightningIcon size={40} color={PsychiColors.azure} weight="fill" />
              </View>
              <Text style={styles.waitingTitle}>Request Sent!</Text>
              <Text style={styles.waitingSubtitle}>
                Waiting for a supporter to accept your {activeRequest.sessionType} session
              </Text>

              <View style={styles.countdownContainer}>
                <ClockIcon size={20} color={PsychiColors.textMuted} />
                <Text style={styles.countdownLabel}>Time remaining:</Text>
                <Text style={styles.countdownValue}>
                  {formatCountdown(activeRequest.countdown)}
                </Text>
              </View>

              <Text style={styles.waitingHint}>
                You'll be notified when a supporter accepts your request
              </Text>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <LightningIcon size={20} color={PsychiColors.azure} />
              <Text style={styles.title}>Request Live Support</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CloseIcon size={24} color={PsychiColors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionLabel}>Select Session Type</Text>

            <View style={styles.sessionTypes}>
              {SESSION_TYPES.map(({ type, label, description, Icon }) => {
                const isSelected = selectedType === type;
                const color = SESSION_TYPE_COLORS[type];
                const typeAllowance = checkAllowance(type);

                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.sessionTypeCard,
                      isSelected && styles.sessionTypeCardSelected,
                      isSelected && { borderColor: color },
                    ]}
                    onPress={() => setSelectedType(type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.sessionTypeIcon, { backgroundColor: `${color}20` }]}>
                      <Icon size={24} color={color} />
                    </View>
                    <View style={styles.sessionTypeInfo}>
                      <Text style={styles.sessionTypeLabel}>{label}</Text>
                      <Text style={styles.sessionTypeDescription}>{description}</Text>
                    </View>
                    {typeAllowance.hasAllowance ? (
                      <View style={styles.allowanceBadge}>
                        <CheckCircleIcon size={14} color={PsychiColors.success} />
                        <Text style={styles.allowanceBadgeText}>
                          {typeAllowance.remaining === 999 ? 'Unlimited' : `${typeAllowance.remaining} left`}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.paygBadge}>
                        <Text style={styles.paygBadgeText}>
                          {formatPaygPrice(type)}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Allowance/Payment Info */}
            {selectedType && allowanceInfo && (
              <View style={styles.allowanceInfo}>
                {allowanceInfo.hasAllowance ? (
                  <View style={styles.allowanceBox}>
                    <CheckCircleIcon size={18} color={PsychiColors.success} />
                    <Text style={styles.allowanceText}>
                      This session is included in your subscription
                    </Text>
                  </View>
                ) : (
                  <View style={styles.paygBox}>
                    <WarningIcon size={18} color={PsychiColors.warning} />
                    <View style={styles.paygContent}>
                      <Text style={styles.paygTitle}>Pay-as-you-go</Text>
                      <Text style={styles.paygDescription}>
                        {allowanceInfo.subscriptionTier
                          ? "You've used your weekly allowance."
                          : "You don't have an active subscription."}
                        {' '}This session will be charged {formatPaygPrice(selectedType)}.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorBox}>
                <WarningIcon size={16} color={PsychiColors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedType || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedType || isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator color={PsychiColors.white} />
              ) : (
                <>
                  <LightningIcon size={18} color={PsychiColors.white} weight="fill" />
                  <Text style={styles.submitButtonText}>
                    {selectedType && allowanceInfo?.paygRequired
                      ? `Request Now (${formatPaygPrice(selectedType)})`
                      : 'Request Now'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PsychiColors.white,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '85%',
    ...Shadows.large,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.borderLight,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    padding: Spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  sessionTypes: {
    gap: Spacing.sm,
  },
  sessionTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sessionTypeCardSelected: {
    backgroundColor: PsychiColors.white,
    ...Shadows.soft,
  },
  sessionTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sessionTypeInfo: {
    flex: 1,
  },
  sessionTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  sessionTypeDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  allowanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: PsychiColors.successMuted,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  allowanceBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  paygBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: PsychiColors.frost,
    borderRadius: BorderRadius.full,
  },
  paygBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  allowanceInfo: {
    marginTop: Spacing.md,
  },
  allowanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.successMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  allowanceText: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.success,
  },
  paygBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PsychiColors.warningMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  paygContent: {
    flex: 1,
  },
  paygTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.warning,
    marginBottom: 4,
  },
  paygDescription: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.errorMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.error,
  },
  footer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: PsychiColors.borderLight,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.button,
  },
  submitButtonDisabled: {
    backgroundColor: PsychiColors.frost,
    ...Shadows.none,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  // Waiting state styles
  waitingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  waitingAnimation: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    backgroundColor: `${PsychiColors.azure}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  waitingSubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.frost,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  countdownLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  countdownValue: {
    fontSize: 16,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
  },
  waitingHint: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.error,
  },
});
