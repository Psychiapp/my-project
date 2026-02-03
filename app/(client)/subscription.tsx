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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChevronLeftIcon, CheckIcon, MinusCircleIcon } from '@/components/icons';
import { Config } from '@/constants/config';
import { useAuth } from '@/contexts/AuthContext';
import { getClientProfile, updateClientSubscription, cancelClientSubscription } from '@/lib/database';

type PlanTier = 'basic' | 'standard' | 'premium';

interface PlanFeature {
  label: string;
  basic: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanTier | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch current subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await getClientProfile(user.id);
        if (profile?.subscription_tier && profile?.subscription_status === 'active') {
          setCurrentPlan(profile.subscription_tier as PlanTier);
        }
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id]);

  const plans: Record<PlanTier, { name: string; price: string; description: string; color: string }> = {
    basic: {
      name: 'Basic',
      price: Config.subscriptions.basic.display,
      description: '1 live call/week + 2 chat sessions',
      color: PsychiColors.azure,
    },
    standard: {
      name: 'Standard',
      price: Config.subscriptions.standard.display,
      description: '2 live calls/week + 3 chat sessions',
      color: PsychiColors.violet,
    },
    premium: {
      name: 'Premium',
      price: Config.subscriptions.premium.display,
      description: '3 live calls/week + unlimited chat',
      color: PsychiColors.coral,
    },
  };

  const features: PlanFeature[] = [
    { label: 'Live Calls/week', basic: '1', standard: '2', premium: '3' },
    { label: 'Chat Sessions/mo', basic: '2', standard: '3', premium: 'Unlimited' },
    { label: 'Call Types', basic: 'Phone or Video', standard: 'Phone or Video', premium: 'Phone or Video' },
    { label: 'E2E Encryption', basic: true, standard: true, premium: true },
    { label: 'Priority Matching', basic: true, standard: true, premium: true },
    { label: 'Saved Supporters', basic: true, standard: true, premium: true },
    { label: 'Session History', basic: '30 days', standard: '90 days', premium: 'Unlimited' },
    { label: 'Cancel Anytime', basic: true, standard: true, premium: true },
  ];

  // Mock payment history - empty for new users
  const paymentHistory: { id: string; date: string; amount: number; plan: string; status: string }[] = [];

  const handleSelectPlan = (plan: PlanTier) => {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
  };

  const handleSubscribeToPlan = (plan: PlanTier) => {
    if (plan === currentPlan || !user?.id) return;

    Alert.alert(
      'Confirm Subscription',
      `Subscribe to ${plans[plan].name} plan for ${plans[plan].price}?\n\nThis subscription automatically renews unless canceled at least 24 hours before the end of the current period.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: async () => {
            setIsProcessing(true);
            setSelectedPlan(plan);
            try {
              const success = await updateClientSubscription(user.id, plan);
              if (success) {
                Alert.alert('Success', `You're now subscribed to the ${plans[plan].name} plan!`, [
                  { text: 'OK' }
                ]);
                setCurrentPlan(plan);
                setSelectedPlan(null);
              } else {
                Alert.alert('Error', 'Failed to update subscription. Please try again.');
              }
            } catch (error) {
              console.error('Subscription error:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setIsProcessing(false);
              setSelectedPlan(null);
            }
          },
        },
      ]
    );
  };

  const handleSubscribe = () => {
    if (!selectedPlan || !user?.id) return;
    handleSubscribeToPlan(selectedPlan);
  };

  const handleCancelSubscription = () => {
    if (!currentPlan || !user?.id) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You\'ll lose access to your benefits at the end of the billing period.',
      [
        { text: 'Keep Plan', style: 'cancel' },
        {
          text: 'Cancel Plan',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);
            try {
              const success = await cancelClientSubscription(user.id);
              if (success) {
                setCurrentPlan(null);
                Alert.alert('Subscription Cancelled', 'Your subscription has been cancelled.');
              } else {
                Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
              }
            } catch (error) {
              console.error('Cancel error:', error);
              Alert.alert('Error', 'Something went wrong. Please try again.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <CheckIcon size={16} color={PsychiColors.success} />
      ) : (
        <MinusCircleIcon size={16} color={PsychiColors.textMuted} />
      );
    }
    return <Text style={styles.featureText}>{value}</Text>;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.violet} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={PsychiColors.azure} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Current Plan */}
        <View style={styles.currentPlanCard}>
          <LinearGradient
            colors={currentPlan
              ? [PsychiColors.violet, PsychiColors.periwinkle]
              : [PsychiColors.glassWhiteStrong, PsychiColors.white]}
            style={styles.currentPlanGradient}
          >
            <Text style={[styles.currentPlanLabel, currentPlan && styles.currentPlanLabelLight]}>
              Current Plan
            </Text>
            <Text style={[styles.currentPlanName, currentPlan && styles.currentPlanNameLight]}>
              {currentPlan ? plans[currentPlan].name : 'No Active Plan'}
            </Text>
            <Text style={[styles.currentPlanPrice, currentPlan && styles.currentPlanPriceLight]}>
              {currentPlan ? plans[currentPlan].price : 'Pay as you go'}
            </Text>
            {currentPlan && (
              <Text style={styles.currentPlanRenewal}>
                Renews on Feb 1, 2026
              </Text>
            )}
          </LinearGradient>
        </View>

        {/* Plan Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Plan</Text>

          <View style={styles.plansContainer}>
            {(Object.keys(plans) as PlanTier[]).map((tier) => {
              const plan = plans[tier];
              const isSelected = selectedPlan === tier;
              const isCurrent = currentPlan === tier;
              const isProcessingThis = isProcessing && selectedPlan === tier;

              return (
                <View
                  key={tier}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    isCurrent && styles.planCardCurrent,
                  ]}
                >
                  <View style={styles.planHeader}>
                    <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                    {isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                    {tier === 'standard' && !isCurrent && (
                      <View style={styles.popularBadge}>
                        <Text style={styles.popularBadgeText}>Popular</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>

                  {/* Subscribe Button on each card */}
                  {!isCurrent && (
                    <TouchableOpacity
                      style={[
                        styles.planSubscribeButton,
                        { backgroundColor: plan.color },
                        isProcessingThis && styles.planSubscribeButtonDisabled,
                      ]}
                      onPress={() => handleSubscribeToPlan(tier)}
                      activeOpacity={0.8}
                      disabled={isProcessing}
                    >
                      {isProcessingThis ? (
                        <ActivityIndicator size="small" color={PsychiColors.white} />
                      ) : (
                        <Text style={styles.planSubscribeButtonText}>Subscribe</Text>
                      )}
                    </TouchableOpacity>
                  )}

                  {isCurrent && (
                    <View style={styles.currentPlanIndicator}>
                      <CheckIcon size={14} color={PsychiColors.violet} />
                      <Text style={styles.currentPlanIndicatorText}>Active Plan</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Subscribe Button */}
        {selectedPlan && selectedPlan !== currentPlan && (
          <View style={styles.subscribeSection}>
            {/* Subscription Disclosure */}
            <View style={styles.disclosureContainer}>
              <Text style={styles.disclosureText}>
                This subscription automatically renews unless canceled at least 24 hours before the end of the current period. You can cancel at any time in your App Store account settings. Cancel anytime from your dashboard.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
              onPress={handleSubscribe}
              activeOpacity={0.9}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={[PsychiColors.violet, PsychiColors.periwinkle]}
                style={styles.subscribeGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator color={PsychiColors.white} />
                ) : (
                  <Text style={styles.subscribeText}>
                    Subscribe to {plans[selectedPlan].name}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Features Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Comparison</Text>

          <View style={styles.comparisonCard}>
            {/* Header Row */}
            <View style={styles.comparisonHeader}>
              <View style={styles.featureLabelCell}>
                <Text style={styles.featureLabelHeader}>Feature</Text>
              </View>
              <View style={styles.planCells}>
                {(Object.keys(plans) as PlanTier[]).map((tier) => (
                  <View key={tier} style={styles.planCell}>
                    <Text style={[styles.planCellHeader, { color: plans[tier].color }]}>
                      {plans[tier].name.substring(0, 4)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Feature Rows */}
            {features.map((feature, index) => (
              <View
                key={feature.label}
                style={[styles.comparisonRow, index % 2 === 0 && styles.comparisonRowAlt]}
              >
                <View style={styles.featureLabelCell}>
                  <Text style={styles.featureLabel}>{feature.label}</Text>
                </View>
                <View style={styles.planCells}>
                  <View style={styles.planCell}>{renderFeatureValue(feature.basic)}</View>
                  <View style={styles.planCell}>{renderFeatureValue(feature.standard)}</View>
                  <View style={styles.planCell}>{renderFeatureValue(feature.premium)}</View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment History</Text>

          {paymentHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyHistoryText}>No payment history yet</Text>
            </View>
          ) : (
            paymentHistory.map((payment) => (
              <View key={payment.id} style={styles.paymentCard}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                  <Text style={styles.paymentPlan}>{payment.plan} Plan</Text>
                </View>
                <View style={styles.paymentAmountContainer}>
                  <Text style={styles.paymentAmount}>
                    {payment.amount === 0 ? 'Free' : `$${payment.amount.toFixed(2)}`}
                  </Text>
                  <Text style={styles.paymentStatus}>{payment.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Cancel Subscription */}
        {currentPlan && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelSubscription}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Can I change plans anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade or downgrade at any time. Changes take effect at your next billing cycle.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>What happens to unused sessions?</Text>
            <Text style={styles.faqAnswer}>
              Unused sessions do not roll over to the next month. Each billing cycle starts fresh.
            </Text>
          </View>

          <View style={styles.faqCard}>
            <Text style={styles.faqQuestion}>Can I still pay per session?</Text>
            <Text style={styles.faqAnswer}>
              Yes! On any plan, you can book additional sessions at regular prices after using your included sessions.
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: PsychiColors.textSecondary,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  placeholder: {
    width: 40,
  },
  currentPlanCard: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  currentPlanGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  currentPlanLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  currentPlanLabelLight: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  currentPlanName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  currentPlanNameLight: {
    color: PsychiColors.white,
  },
  currentPlanPrice: {
    fontSize: 16,
    color: PsychiColors.textSecondary,
    marginTop: 4,
  },
  currentPlanPriceLight: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  currentPlanRenewal: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: Spacing.sm,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
    fontFamily: 'Georgia',
  },
  plansContainer: {
    gap: Spacing.sm,
  },
  planCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.soft,
  },
  planCardSelected: {
    borderColor: PsychiColors.violet,
  },
  planCardCurrent: {
    backgroundColor: 'rgba(123, 104, 176, 0.05)',
    borderColor: PsychiColors.violet,
    opacity: 0.8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentBadge: {
    backgroundColor: 'rgba(123, 104, 176, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.violet,
  },
  popularBadge: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  popularBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.coral,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  planDescription: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  selectedIndicator: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PsychiColors.violet,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheck: {
    color: PsychiColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  planSubscribeButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  planSubscribeButtonDisabled: {
    opacity: 0.7,
  },
  planSubscribeButtonText: {
    color: PsychiColors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  currentPlanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(123, 104, 176, 0.1)',
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  currentPlanIndicatorText: {
    color: PsychiColors.violet,
    fontSize: 14,
    fontWeight: '600',
  },
  subscribeSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  disclosureContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  disclosureText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    lineHeight: 18,
    textAlign: 'center',
  },
  subscribeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  subscribeText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  comparisonCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  comparisonRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  comparisonRowAlt: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  featureLabelCell: {
    flex: 1.2,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  featureLabelHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: PsychiColors.textMuted,
    textTransform: 'uppercase',
  },
  featureLabel: {
    fontSize: 13,
    color: '#2A2A2A',
  },
  planCells: {
    flexDirection: 'row',
    flex: 1.5,
  },
  planCell: {
    flex: 1,
    padding: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCellHeader: {
    fontSize: 12,
    fontWeight: '700',
  },
  featureCheck: {
    fontSize: 14,
    color: PsychiColors.success,
    fontWeight: '700',
  },
  featureDash: {
    fontSize: 14,
    color: PsychiColors.textSoft,
  },
  featureText: {
    fontSize: 11,
    color: '#2A2A2A',
    textAlign: 'center',
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  paymentPlan: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  paymentAmountContainer: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  paymentStatus: {
    fontSize: 12,
    color: PsychiColors.success,
    marginTop: 2,
  },
  emptyHistory: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  cancelButton: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  faqCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    lineHeight: 20,
  },
});
