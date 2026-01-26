import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import {
  PsychiColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Gradients,
} from '@/constants/theme';
import {
  CalendarIcon,
  CheckCircleIcon,
  SettingsIcon,
  CardIcon,
  SparkleIcon,
  ArrowRightIcon,
  PlusIcon,
  ChevronRightIcon,
  AlertIcon,
} from '@/components/icons';
import DashboardTutorial from '@/components/DashboardTutorial';
import { getClientCurrentAssignment, requestSupporterReassignment, getSupporterDetail, getClientProfile } from '@/lib/database';

const TUTORIAL_COMPLETED_KEY = '@psychi_client_tutorial_completed';

interface AssignedSupporter {
  id: string;
  name: string;
  image: string;
  compatibilityScore: number;
  year: string;
  university: string;
  bio: string;
  specialties: string[];
}

const planLabels: Record<string, string> = {
  'basic': 'Basic',
  'standard': 'Standard',
  'premium': 'Premium',
  'tier-1': 'Essential',
  'tier-2': 'Growth',
  'tier-3': 'Unlimited',
  'pay-as-you-go': 'Pay As You Go',
};

export default function ClientHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();

  // Dashboard tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Assigned supporter state
  const [assignedSupporter, setAssignedSupporter] = useState<AssignedSupporter | null>(null);
  const [isLoadingSupporter, setIsLoadingSupporter] = useState(true);
  const [pendingReportEmail, setPendingReportEmail] = useState(false);

  // Subscription state
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);

  // Function to fetch subscription (used for refetching on focus)
  const fetchSubscription = useCallback(async () => {
    if (!user?.id) return;
    try {
      const clientProfile = await getClientProfile(user.id);
      if (clientProfile?.subscription_tier && clientProfile?.subscription_status === 'active') {
        setSubscriptionTier(clientProfile.subscription_tier);
      } else {
        setSubscriptionTier(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }, [user?.id]);

  // Refetch subscription when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSubscription();
    }, [fetchSubscription])
  );

  // Check if tutorial has been completed on mount
  useEffect(() => {
    const checkTutorialStatus = async () => {
      try {
        const completed = await AsyncStorage.getItem(TUTORIAL_COMPLETED_KEY);
        if (!completed) {
          setTimeout(() => setShowTutorial(true), 500);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
    };
    checkTutorialStatus();
  }, []);

  // Fetch assigned supporter and subscription
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        setIsLoadingSupporter(false);
        return;
      }

      try {
        // Fetch supporter and profile in parallel
        const [assignment, clientProfile] = await Promise.all([
          getClientCurrentAssignment(user.id),
          getClientProfile(user.id),
        ]);

        // Set subscription tier
        if (clientProfile?.subscription_tier && clientProfile?.subscription_status === 'active') {
          setSubscriptionTier(clientProfile.subscription_tier);
        }

        // Set assigned supporter
        if (assignment?.supporter_id) {
          const supporterDetail = await getSupporterDetail(assignment.supporter_id);
          if (supporterDetail) {
            setAssignedSupporter({
              id: supporterDetail.id,
              name: supporterDetail.full_name,
              image: supporterDetail.avatar_url || '',
              compatibilityScore: 85,
              year: '',
              university: supporterDetail.education || '',
              bio: supporterDetail.bio,
              specialties: supporterDetail.specialties,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoadingSupporter(false);
      }
    };

    fetchData();
  }, [user?.id]);

  // Listen for app returning from email
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && pendingReportEmail) {
        setPendingReportEmail(false);
        // Show switch supporter prompt after returning from email
        setTimeout(() => {
          Alert.alert(
            'Would you like to switch supporters?',
            'We can match you with a different supporter based on your preferences.',
            [
              { text: 'No, keep current', style: 'cancel' },
              {
                text: 'Yes, switch',
                onPress: handleSwitchSupporter,
              },
            ]
          );
        }, 500);
      }
    });

    return () => subscription.remove();
  }, [pendingReportEmail]);

  const handleReportSupporter = async () => {
    if (!assignedSupporter) return;

    const emailSubject = encodeURIComponent(`Report: ${assignedSupporter.name}`);
    const emailBody = encodeURIComponent(
      `I would like to report an issue with my supporter.\n\nSupporter Name: ${assignedSupporter.name}\n\nPlease describe the issue:\n\n`
    );
    const emailUrl = `mailto:psychiapp@outlook.com?subject=${emailSubject}&body=${emailBody}`;

    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        setPendingReportEmail(true);
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert(
          'Email Not Available',
          'Please send your report to psychiapp@outlook.com',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening email:', error);
      Alert.alert('Error', 'Could not open email app');
    }
  };

  const handleSwitchSupporter = async () => {
    if (!user?.id) return;

    // Navigate to supporter matching flow or call reassignment
    router.push('/(client)/book');
  };

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
      setShowTutorial(false);
    }
  };

  const handleTutorialClose = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
      setShowTutorial(false);
    }
  };

  // Real data - no mock data
  const bookingHistory: { id: string; status: string; session_date: string }[] = [];

  // Calculate stats from real data
  const upcomingSessions = bookingHistory.filter(
    (b) => b.status === 'scheduled' || new Date(b.session_date) > new Date()
  ).length;
  const completedSessions = bookingHistory.filter((b) => b.status === 'completed').length;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing['6'],
          paddingBottom: Spacing['12']
        }}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{profile?.firstName || 'there'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(client)/profile')}
            activeOpacity={0.7}
          >
            <SettingsIcon size={20} color={PsychiColors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Premium Hero Card */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={Gradients.glassCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <SparkleIcon size={24} color={PsychiColors.royalBlue} weight="regular" />
              </View>
              <Text style={styles.heroTitle}>
                {assignedSupporter
                  ? 'Ready for your next session?'
                  : 'Your wellness journey starts here'}
              </Text>
              <Text style={styles.heroSubtitle}>
                {assignedSupporter !== null
                  ? `You're connected with ${(assignedSupporter as AssignedSupporter).name}`
                  : 'Connect with a trained peer supporter who understands'}
              </Text>
              <TouchableOpacity
                style={styles.heroCta}
                onPress={() => router.push('/(client)/book')}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={Gradients.primaryButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.heroCtaGradient}
                >
                  <Text style={styles.heroCtaText}>Book a Session</Text>
                  <ArrowRightIcon size={16} color={PsychiColors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionLabel}>YOUR PROGRESS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CalendarIcon size={20} color={PsychiColors.royalBlue} />
              </View>
              <Text style={styles.statValue}>{upcomingSessions}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CheckCircleIcon size={20} color={PsychiColors.success} />
              </View>
              <Text style={styles.statValue}>{completedSessions}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>

            <TouchableOpacity
              style={styles.statCard}
              onPress={() => router.push('/(client)/subscription')}
              activeOpacity={0.7}
            >
              <View style={styles.statIcon}>
                <CardIcon size={20} color={PsychiColors.violet} />
              </View>
              <Text style={styles.statValueSmall}>
                {subscriptionTier ? planLabels[subscriptionTier] || subscriptionTier : 'Free'}
              </Text>
              <Text style={styles.statLabel}>Plan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Your Supporter - shown when assigned */}
        {assignedSupporter !== null && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Supporter</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={styles.sectionAction}>View Profile</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.supporterCard}>
              {assignedSupporter.image ? (
                <Image
                  source={{ uri: assignedSupporter.image }}
                  style={styles.supporterImage}
                />
              ) : (
                <View style={[styles.supporterImage, styles.supporterImagePlaceholder]}>
                  <Text style={styles.supporterImagePlaceholderText}>
                    {assignedSupporter.name.charAt(0)}
                  </Text>
                </View>
              )}
              <View style={styles.supporterInfo}>
                <View style={styles.supporterHeader}>
                  <Text style={styles.supporterName}>
                    {assignedSupporter.name}
                  </Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      {assignedSupporter.compatibilityScore}% match
                    </Text>
                  </View>
                </View>
                {assignedSupporter.university ? (
                  <Text style={styles.supporterMeta}>
                    {assignedSupporter.year ? `${assignedSupporter.year} · ` : ''}{assignedSupporter.university}
                  </Text>
                ) : null}
                <View style={styles.specialtiesRow}>
                  {assignedSupporter.specialties.slice(0, 3).map((specialty: string, idx: number) => (
                    <View key={idx} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
            {/* Report Button */}
            <TouchableOpacity
              style={styles.reportButton}
              onPress={handleReportSupporter}
              activeOpacity={0.7}
            >
              <AlertIcon size={16} color={PsychiColors.textMuted} />
              <Text style={styles.reportButtonText}>Report an issue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/book')}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <PlusIcon size={22} color={PsychiColors.royalBlue} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Book Session</Text>
                  <Text style={styles.actionSubtitle}>Schedule your next session</Text>
                </View>
              </View>
              <ChevronRightIcon size={18} color={PsychiColors.textSoft} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/sessions')}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <CalendarIcon size={22} color={PsychiColors.coral} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Sessions</Text>
                  <Text style={styles.actionSubtitle}>View upcoming & past</Text>
                </View>
              </View>
              <ChevronRightIcon size={18} color={PsychiColors.textSoft} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/profile')}
              activeOpacity={0.7}
            >
              <View style={styles.actionLeft}>
                <SettingsIcon size={22} color={PsychiColors.violet} />
                <View style={styles.actionText}>
                  <Text style={styles.actionTitle}>Settings</Text>
                  <Text style={styles.actionSubtitle}>Preferences & account</Text>
                </View>
              </View>
              <ChevronRightIcon size={18} color={PsychiColors.textSoft} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Dashboard Tutorial */}
      <DashboardTutorial
        visible={showTutorial}
        onClose={handleTutorialClose}
        onComplete={handleTutorialComplete}
        userType="client"
        userName={profile?.firstName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  scrollView: {
    flex: 1,
  },

  // Editorial Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing['6'],
    marginBottom: Spacing['7'],
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wider,
    textTransform: 'uppercase',
    marginBottom: Spacing['1'],
  },
  userName: {
    fontSize: Typography.fontSize['4xl'],
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tighter,
    fontFamily: Typography.fontFamily.serif,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PsychiColors.cloud,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },

  // Premium Hero Card
  heroCard: {
    marginHorizontal: Spacing['5'],
    marginBottom: Spacing['7'],
    borderRadius: 24,
    overflow: 'hidden',
    ...Shadows.premium,
  },
  heroGradient: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PsychiColors.borderGlass,
  },
  heroContent: {
    padding: Spacing['6'],
  },
  heroIcon: {
    marginBottom: Spacing['4'],
  },
  heroTitle: {
    fontSize: Typography.fontSize['2xl'],
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing['2'],
    lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.tight,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing['6'],
  },
  heroCta: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  heroCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing['6'],
    gap: Spacing['2'],
    ...Shadows.button,
  },
  heroCtaText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.white,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['6'],
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  statCard: {
    flex: 1,
    backgroundColor: PsychiColors.cloud,
    borderRadius: 18,
    padding: Spacing['4'],
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },
  statIcon: {
    marginBottom: Spacing['3'],
  },
  statValue: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tighter,
  },
  statValueSmall: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wide,
    marginTop: Spacing['0.5'],
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
    marginHorizontal: Spacing['6'],
    marginVertical: Spacing['5'],
  },

  // Section
  section: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['6'],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing['4'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  sectionAction: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
  },

  // Supporter Card
  supporterCard: {
    flexDirection: 'row',
    backgroundColor: PsychiColors.cloud,
    borderRadius: 20,
    padding: Spacing['5'],
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },
  supporterImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginRight: Spacing['4'],
  },
  supporterImagePlaceholder: {
    backgroundColor: PsychiColors.royalBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supporterImagePlaceholderText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.white,
  },
  supporterInfo: {
    flex: 1,
  },
  supporterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['2'],
    marginBottom: Spacing['1'],
  },
  supporterName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  matchBadge: {
    backgroundColor: `${PsychiColors.success}12`,
    paddingHorizontal: Spacing['2.5'],
    paddingVertical: Spacing['1'],
    borderRadius: BorderRadius.full,
  },
  matchBadgeText: {
    fontSize: Typography.fontSize['2xs'],
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.success,
  },
  supporterMeta: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginBottom: Spacing['3'],
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['1.5'],
  },
  specialtyTag: {
    backgroundColor: PsychiColors.frost,
    paddingHorizontal: Spacing['2.5'],
    paddingVertical: Spacing['1'],
    borderRadius: BorderRadius.full,
  },
  specialtyText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing['3'],
    paddingVertical: Spacing['2'],
    gap: Spacing['1.5'],
  },
  reportButtonText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },

  // Quick Actions - Editorial List Style
  actionsContainer: {
    gap: Spacing['2'],
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PsychiColors.cloud,
    borderRadius: 16,
    padding: Spacing['4'],
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing['4'],
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['0.5'],
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
});
