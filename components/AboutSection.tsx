/**
 * AboutSection - Embedded in homepage, matches web app About content
 * Our Story, Mission, Values
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { HeartIcon, LockIcon, UsersIcon, ArrowRightIcon } from '@/components/icons';

const { width: screenWidth } = Dimensions.get('window');

// Values data - icons match rest of app (simple, black/dark)
const values = [
  {
    id: 'compassion',
    icon: HeartIcon,
    title: 'Compassion',
    description: 'Genuine care and understanding at every interaction',
    accentColor: PsychiColors.coral,
  },
  {
    id: 'privacy',
    icon: LockIcon,
    title: 'Privacy',
    description: 'Your conversations stay confidential and secure',
    accentColor: PsychiColors.lavender,
  },
  {
    id: 'accessibility',
    icon: UsersIcon,
    title: 'Accessibility',
    description: 'Affordable support available when you need it',
    accentColor: PsychiColors.azure,
  },
];

interface AboutSectionProps {
  onGetStarted?: () => void;
}

export default function AboutSection({ onGetStarted }: AboutSectionProps) {
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      router.push('/(auth)/sign-up');
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.labelBadge}>
          <Text style={styles.labelText}>Our Story</Text>
        </View>
        <Text style={styles.sectionTitle}>
          About <Text style={styles.sectionTitleItalic}>Psychi</Text>
        </Text>
      </View>

      {/* Mission Statement */}
      <View style={styles.contentCard}>
        <Text style={styles.cardTitle}>Our Mission</Text>
        <Text style={styles.paragraph}>
          Founded in 2025, Psychi was created to{' '}
          <Text style={styles.highlight}>
            expand access to supportive, psychology-informed guidance
          </Text>{' '}
          while giving psychology students meaningful opportunities to help others.
        </Text>
        <Text style={styles.paragraph}>
          Removing barriers to mental health care and replacing them with real connection.
          Not AI, not a rigid clinician, but a fellow human to forge real connection and
          ease the burden of modern life.
        </Text>
      </View>

      {/* The Solution */}
      <View style={styles.solutionCard}>
        <Text style={styles.cardTitle}>How We Help</Text>
        <Text style={styles.paragraph}>
          Psychi bridges the gap between individuals seeking support and psychology students
          eager to make a difference. Our platform connects you with trained supporters who
          understand what you're going through and can provide genuine, empathetic guidance.
        </Text>
      </View>

      {/* Values */}
      <View style={styles.valuesSection}>
        <Text style={styles.valuesTitle}>Our Values</Text>
        <View style={styles.valuesGrid}>
          {values.map((value) => {
            const IconComponent = value.icon;
            return (
              <View key={value.id} style={styles.valueCard}>
                <IconComponent size={32} color={value.accentColor} style={styles.valueIcon} />
                <Text style={styles.valueTitle}>{value.title}</Text>
                <Text style={styles.valueDescription}>{value.description}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <Text style={styles.ctaText}>
          Ready to experience supportive, judgment-free guidance?
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>Get Started</Text>
          <ArrowRightIcon size={18} color={PsychiColors.white} />
        </TouchableOpacity>
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

  // Header
  header: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  labelBadge: {
    backgroundColor: 'rgba(212, 132, 122, 0.15)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  labelText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.coral,
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 28 : 32,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    textAlign: 'center',
  },
  sectionTitleItalic: {
    fontStyle: 'italic',
  },

  // Content Cards
  contentCard: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  solutionCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing['2xl'],
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.md,
  },
  paragraph: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    lineHeight: 26,
    marginBottom: Spacing.sm,
  },
  highlight: {
    color: PsychiColors.textPrimary,
    fontWeight: '600',
  },

  // Values
  valuesSection: {
    marginBottom: Spacing['2xl'],
  },
  valuesTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  valuesGrid: {
    gap: Spacing.md,
  },
  valueCard: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.soft,
  },
  valueIcon: {
    marginBottom: Spacing.md,
  },
  valueTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  valueDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // CTA
  ctaSection: {
    alignItems: 'center',
  },
  ctaText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.lg,
    color: PsychiColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.royalBlue,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  ctaButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
