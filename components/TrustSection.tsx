/**
 * TrustSection - Exact match to web app TrustSection.tsx
 * Safety, training, and trust messaging
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { BookIcon, ShieldIcon, EyeIcon, HelpIcon, CheckIcon } from '@/components/icons';

const { width: screenWidth } = Dimensions.get('window');

// Training steps - matches web exactly
const trainingSteps = [
  {
    id: 'training',
    icon: BookIcon,
    title: 'Psychi Designed Training',
    description: 'Comprehensive curriculum covering active listening, empathy, and support techniques',
  },
  {
    id: 'verified',
    icon: ShieldIcon,
    title: 'Identity Verified',
    description: 'All supporters submit government-issued ID',
  },
  {
    id: 'supervision',
    icon: EyeIcon,
    title: 'Ongoing Supervision',
    description: 'Psychi admins review sessions and provide continuous guidance',
  },
  {
    id: 'crisis',
    icon: HelpIcon,
    title: 'Crisis Protocol',
    description: 'Clear escalation paths and immediate referrals for emergency situations',
  },
];

// Safety features
const safetyFeatures = [
  'End-to-end encrypted conversations',
  'No session recordings stored',
];

export default function TrustSection() {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>WHY PSYCHI</Text>
        <Text style={styles.title}>
          Built on{' '}
          <Text style={styles.titleAccent}>trust</Text>
          {' '}and{' '}
          <Text style={styles.titleAccent}>safety</Text>
        </Text>
        <Text style={styles.subtitle}>
          Your wellbeing is our priority. Here's how we ensure a safe, supportive experience.
        </Text>
      </View>

      {/* Training Steps */}
      <View style={styles.trainingContainer}>
        {trainingSteps.map((step, index) => {
          const IconComponent = step.icon;
          return (
            <View key={step.id} style={styles.trainingStep}>
              {/* Icon */}
              <View style={styles.stepIcon}>
                <IconComponent size={24} color={PsychiColors.midnight} />
              </View>

              {/* Content */}
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Safety Features */}
      <View style={styles.safetyContainer}>
        <Text style={styles.safetyTitle}>Your Safety, Our Priority</Text>
        <View style={styles.safetyGrid}>
          {safetyFeatures.map((feature, index) => (
            <View key={index} style={styles.safetyItem}>
              <View style={styles.checkIcon}>
                <CheckIcon size={16} color={PsychiColors.success} />
              </View>
              <Text style={styles.safetyText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          Psychi is a peer support service, not a replacement for professional mental health care.
          If you're experiencing a mental health crisis, please contact emergency services or call 988.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    backgroundColor: PsychiColors.cream,
  },

  // Header styles
  header: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: PsychiColors.royalBlue,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 28 : 32,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  titleAccent: {
    color: PsychiColors.royalBlue,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // Training Steps
  trainingContainer: {
    marginBottom: Spacing['2xl'],
  },
  trainingStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  stepIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },

  // Safety Features
  safetyContainer: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
    ...Shadows.card,
  },
  safetyTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  safetyGrid: {
    gap: Spacing.sm,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    marginRight: Spacing.sm,
  },
  safetyText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    flex: 1,
  },

  // Disclaimer
  disclaimerContainer: {
    padding: Spacing.lg,
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
  },
  disclaimerText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
