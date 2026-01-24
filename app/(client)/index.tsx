import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
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
} from '@/components/icons';
import DashboardTutorial from '@/components/DashboardTutorial';

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
  'tier-1': 'Essential',
  'tier-2': 'Growth',
  'tier-3': 'Unlimited',
  'pay-as-you-go': 'Pay As You Go',
};

export default function ClientHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  // Dashboard tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

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
  const assignedSupporter: AssignedSupporter | null = null;
  const bookingHistory: { id: string; status: string; session_date: string }[] = [];
  const selectedPlan: string | null = null;

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

            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CardIcon size={20} color={PsychiColors.violet} />
              </View>
              <Text style={styles.statValueSmall}>
                {selectedPlan ? planLabels[selectedPlan] : 'Free'}
              </Text>
              <Text style={styles.statLabel}>Plan</Text>
            </View>
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
              <Image
                source={{ uri: (assignedSupporter as AssignedSupporter).image }}
                style={styles.supporterImage}
              />
              <View style={styles.supporterInfo}>
                <View style={styles.supporterHeader}>
                  <Text style={styles.supporterName}>
                    {(assignedSupporter as AssignedSupporter).name}
                  </Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      {(assignedSupporter as AssignedSupporter).compatibilityScore}% match
                    </Text>
                  </View>
                </View>
                <Text style={styles.supporterMeta}>
                  {(assignedSupporter as AssignedSupporter).year} · {(assignedSupporter as AssignedSupporter).university}
                </Text>
                <View style={styles.specialtiesRow}>
                  {(assignedSupporter as AssignedSupporter).specialties.slice(0, 3).map((specialty: string, idx: number) => (
                    <View key={idx} style={styles.specialtyTag}>
                      <Text style={styles.specialtyText}>{specialty}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
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
