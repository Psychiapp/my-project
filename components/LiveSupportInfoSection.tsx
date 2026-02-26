/**
 * LiveSupportInfoSection Component
 * Collapsible informational section about live support for dashboards
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  LightningIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  ChatIcon,
  PhoneIcon,
  VideoIcon,
  CheckCircleIcon,
} from '@/components/icons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LiveSupportInfoSectionProps {
  userType: 'client' | 'supporter';
  defaultExpanded?: boolean;
}

export default function LiveSupportInfoSection({
  userType,
  defaultExpanded = false,
}: LiveSupportInfoSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const clientContent = (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <LightningIcon size={18} color={PsychiColors.azure} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Instant Connection</Text>
          <Text style={styles.infoDescription}>
            Request a live session and get connected with an available supporter within minutes.
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <ClockIcon size={18} color={PsychiColors.azure} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>15-Minute Window</Text>
          <Text style={styles.infoDescription}>
            Supporters have 15 minutes to respond. If unavailable, your request routes to another supporter.
          </Text>
        </View>
      </View>

      <View style={styles.sessionTypesRow}>
        <Text style={styles.sessionTypesLabel}>Available session types:</Text>
        <View style={styles.sessionTypesIcons}>
          <View style={styles.sessionTypeChip}>
            <ChatIcon size={14} color={PsychiColors.chatAccent} />
            <Text style={styles.sessionTypeChipText}>Chat</Text>
          </View>
          <View style={styles.sessionTypeChip}>
            <PhoneIcon size={14} color={PsychiColors.phoneAccent} />
            <Text style={styles.sessionTypeChipText}>Phone</Text>
          </View>
          <View style={styles.sessionTypeChip}>
            <VideoIcon size={14} color={PsychiColors.videoAccent} />
            <Text style={styles.sessionTypeChipText}>Video</Text>
          </View>
        </View>
      </View>

      <View style={styles.tipBox}>
        <CheckCircleIcon size={16} color={PsychiColors.success} />
        <Text style={styles.tipText}>
          Sessions from your weekly allowance are included at no extra cost!
        </Text>
      </View>
    </>
  );

  const supporterContent = (
    <>
      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <LightningIcon size={18} color={PsychiColors.azure} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>Live Support Requests</Text>
          <Text style={styles.infoDescription}>
            When you're available, clients can request immediate sessions with you.
          </Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoIcon}>
          <ClockIcon size={18} color={PsychiColors.azure} />
        </View>
        <View style={styles.infoText}>
          <Text style={styles.infoTitle}>15-Minute Response Time</Text>
          <Text style={styles.infoDescription}>
            You have 15 minutes to accept or decline each request. Declining routes to another supporter.
          </Text>
        </View>
      </View>

      <View style={styles.howItWorksBox}>
        <Text style={styles.howItWorksTitle}>How it works:</Text>
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Toggle "Available for Live Support" when you're ready</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Receive notifications when clients request sessions</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>Accept to start the session immediately</Text>
          </View>
        </View>
      </View>

      <View style={styles.tipBox}>
        <CheckCircleIcon size={16} color={PsychiColors.success} />
        <Text style={styles.tipText}>
          You earn the same rate for live sessions as scheduled sessions!
        </Text>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <LightningIcon size={18} color={PsychiColors.azure} weight="fill" />
          </View>
          <Text style={styles.headerTitle}>About Live Support</Text>
        </View>
        {isExpanded ? (
          <ChevronUpIcon size={20} color={PsychiColors.textMuted} />
        ) : (
          <ChevronDownIcon size={20} color={PsychiColors.textMuted} />
        )}
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {userType === 'client' ? clientContent : supporterContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: `${PsychiColors.azure}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: PsychiColors.borderLight,
    paddingTop: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    backgroundColor: `${PsychiColors.azure}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  infoDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    lineHeight: 18,
  },
  sessionTypesRow: {
    marginBottom: Spacing.md,
  },
  sessionTypesLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.sm,
  },
  sessionTypesIcons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sessionTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  sessionTypeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: PsychiColors.textSecondary,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.successMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.success,
    lineHeight: 18,
  },
  howItWorksBox: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  stepsList: {
    gap: Spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.azure,
    color: PsychiColors.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginRight: Spacing.sm,
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
});
