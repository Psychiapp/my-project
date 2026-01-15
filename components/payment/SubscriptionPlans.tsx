import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { subscriptionPlans, SubscriptionPlan } from '@/lib/stripe';

interface SubscriptionPlansProps {
  currentPlan?: string;
  onSelectPlan: (plan: SubscriptionPlan) => void;
}

export default function SubscriptionPlans({
  currentPlan,
  onSelectPlan,
}: SubscriptionPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  const handleSelect = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan.id);
    onSelectPlan(plan);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>
          Select the plan that works best for your needs
        </Text>
      </View>

      {subscriptionPlans.map((plan, index) => {
        const isPopular = plan.id === 'standard';
        const isSelected = selectedPlan === plan.id;
        const isCurrent = currentPlan === plan.id;

        return (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              isSelected && styles.planCardSelected,
              isPopular && styles.planCardPopular,
            ]}
            onPress={() => handleSelect(plan)}
            activeOpacity={0.8}
          >
            {isPopular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>Most Popular</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.planPrice}>{formatPrice(plan.amount)}</Text>
                  <Text style={styles.planInterval}>/{plan.interval}</Text>
                </View>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureRow}>
                  <Text style={styles.checkIcon}>✓</Text>
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {isCurrent && (
              <View style={styles.currentBadge}>
                <Text style={styles.currentText}>Current Plan</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* One-time session option */}
      <View style={styles.alternativeSection}>
        <Text style={styles.alternativeTitle}>Or pay per session</Text>
        <Text style={styles.alternativeText}>
          Don't want a subscription? You can book individual sessions starting at $7.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  header: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
  },
  planCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.medium,
  },
  planCardSelected: {
    borderColor: PsychiColors.azure,
  },
  planCardPopular: {
    borderColor: PsychiColors.violet,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: Spacing.md,
    backgroundColor: PsychiColors.violet,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.azure,
  },
  planInterval: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginLeft: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: PsychiColors.azure,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PsychiColors.azure,
  },
  featuresContainer: {
    gap: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    fontSize: 14,
    color: PsychiColors.success,
    marginRight: Spacing.sm,
    fontWeight: '700',
  },
  featureText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  currentBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  currentText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  alternativeSection: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(123, 104, 176, 0.1)',
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  alternativeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
  },
  alternativeText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
  },
});
