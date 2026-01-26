/**
 * Pricing Section - Exact match to web app PricingComparison.tsx
 * Subscription plans: Essential $95, Growth $145, Unlimited $175
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { CheckIcon } from '@/components/icons';

const { width: screenWidth } = Dimensions.get('window');

interface PricingSectionProps {
  onSelectPlan?: (planId: string) => void;
}

const plans = [
  {
    id: 'essential',
    name: 'Essential',
    price: '$95',
    period: '/month',
    description: 'Perfect for getting started',
    features: [
      '4 chat sessions per month',
      '2 phone sessions per month',
    ],
    popular: false,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$145',
    period: '/month',
    description: 'Our most popular plan',
    features: [
      '8 chat sessions per month',
      '4 phone sessions per month',
      '1 video session per month',
    ],
    popular: true,
  },
  {
    id: 'unlimited',
    name: 'Unlimited',
    price: '$175',
    period: '/month',
    description: 'For comprehensive support',
    features: [
      'Unlimited chat sessions',
      '8 phone sessions per month',
      '4 video sessions per month',
      'VIP matching',
      'Session notes & history',
      'Supporter preference saving',
      'Priority support',
    ],
    popular: false,
  },
];

export default function PricingSection({ onSelectPlan }: PricingSectionProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  return (
    <LinearGradient
      colors={Gradients.pricing}
      style={styles.container}
    >
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>PRICING</Text>
        <Text style={styles.title}>
          Choose your{' '}
          <Text style={styles.titleAccent}>support plan</Text>
        </Text>
        <Text style={styles.subtitle}>
          Flexible plans designed to fit your needs and budget
        </Text>
      </View>

      {/* Pricing Cards */}
      <View style={styles.cardsContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.card,
              plan.popular && styles.cardPopular,
              selectedPlan === plan.id && styles.cardSelected,
            ]}
            onPress={() => {
              setSelectedPlan(plan.id);
              onSelectPlan?.(plan.id);
            }}
            activeOpacity={0.8}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
            )}

            {/* Plan Name & Price */}
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>
              <Text style={styles.planDescription}>{plan.description}</Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={styles.checkIcon}>
                    <CheckIcon size={16} color={PsychiColors.success} />
                  </View>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Select Button */}
            <TouchableOpacity
              style={[
                styles.selectButton,
                plan.popular && styles.selectButtonPopular,
              ]}
              onPress={() => {
                setSelectedPlan(plan.id);
                onSelectPlan?.(plan.id);
              }}
            >
              {plan.popular ? (
                <LinearGradient
                  colors={Gradients.primaryButton}
                  style={styles.selectButtonGradient}
                >
                  <Text style={styles.selectButtonTextWhite}>Get Started</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.selectButtonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pay-as-you-go note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteTitle}>Prefer pay-as-you-go?</Text>
        <Text style={styles.noteText}>
          You can also book individual sessions without a subscription.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
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
  },

  // Cards container
  cardsContainer: {
    gap: Spacing.lg,
  },

  // Card styles
  card: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
    ...Shadows.card,
  },
  cardPopular: {
    borderColor: PsychiColors.royalBlue,
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  cardSelected: {
    borderColor: PsychiColors.royalBlue,
    borderWidth: 2,
  },

  // Popular badge
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: PsychiColors.royalBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  popularBadgeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: PsychiColors.white,
  },

  // Plan header
  planHeader: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  planName: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.xl,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.xs,
  },
  price: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 40,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
  },
  period: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textMuted,
    marginLeft: 4,
  },
  planDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
  },

  // Features
  featuresContainer: {
    marginBottom: Spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  checkIcon: {
    width: 20,
    height: 20,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },

  // Select button
  selectButton: {
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: PsychiColors.royalBlue,
    paddingVertical: 14,
    alignItems: 'center',
  },
  selectButtonPopular: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  selectButtonGradient: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  selectButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: PsychiColors.royalBlue,
  },
  selectButtonTextWhite: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: PsychiColors.white,
  },

  // Note section
  noteContainer: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius['2xl'],
  },
  noteTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  noteText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
  },
});
