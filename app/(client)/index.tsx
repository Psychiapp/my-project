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
import { useAuth } from '@/contexts/AuthContext';
import {
  PsychiColors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/theme';
import {
  CalendarIcon,
  CheckCircleIcon,
  SettingsIcon,
  CardIcon,
  SparkleIcon,
  ArrowRightIcon,
  PlusIcon,
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
          // Small delay to let the dashboard render first
          setTimeout(() => setShowTutorial(true), 500);
        }
      } catch (error) {
        console.error('Error checking tutorial status:', error);
      }
    };
    checkTutorialStatus();
  }, []);

  // Handle tutorial completion
  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
      setShowTutorial(false);
    }
  };

  // Handle tutorial skip (same as complete - they've seen it)
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
        contentContainerStyle={{ paddingTop: insets.top + Spacing['4'], paddingBottom: Spacing['8'] }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{profile?.firstName || 'there'}</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/(client)/profile')}
            activeOpacity={0.7}
          >
            <SettingsIcon size={22} color={PsychiColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <SparkleIcon size={24} color={PsychiColors.royalBlue} weight="regular" />
            </View>
            <Text style={styles.heroTitle}>
              {assignedSupporter
                ? `Ready for your next session?`
                : 'Your wellness journey starts here'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {assignedSupporter !== null
                ? `You're connected with ${(assignedSupporter as AssignedSupporter).name}`
                : 'Book a session to connect with a trained peer supporter'}
            </Text>
            <TouchableOpacity
              style={styles.heroCta}
              onPress={() => router.push('/(client)/book')}
              activeOpacity={0.8}
            >
              <Text style={styles.heroCtaText}>Book a Session</Text>
              <ArrowRightIcon size={18} color={PsychiColors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: `${PsychiColors.royalBlue}12` }]}>
              <CalendarIcon size={20} color={PsychiColors.royalBlue} />
            </View>
            <Text style={styles.statValue}>{upcomingSessions}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: `${PsychiColors.success}12` }]}>
              <CheckCircleIcon size={20} color={PsychiColors.success} />
            </View>
            <Text style={styles.statValue}>{completedSessions}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBg, { backgroundColor: `${PsychiColors.lavender}20` }]}>
              <CardIcon size={20} color={PsychiColors.violet} />
            </View>
            <Text style={styles.statValueSmall}>{selectedPlan ? planLabels[selectedPlan] : 'None'}</Text>
            <Text style={styles.statLabel}>Plan</Text>
          </View>
        </View>

        {/* Your Supporter - shown when assigned */}
        {assignedSupporter !== null && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Supporter</Text>
            <View style={styles.supporterCard}>
              <Image
                source={{ uri: (assignedSupporter as AssignedSupporter).image }}
                style={styles.supporterImage}
              />
              <View style={styles.supporterInfo}>
                <View style={styles.supporterHeader}>
                  <Text style={styles.supporterName}>{(assignedSupporter as AssignedSupporter).name}</Text>
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>{(assignedSupporter as AssignedSupporter).compatibilityScore}%</Text>
                  </View>
                </View>
                <Text style={styles.supporterMeta}>
                  {(assignedSupporter as AssignedSupporter).year} at {(assignedSupporter as AssignedSupporter).university}
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
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/book')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${PsychiColors.royalBlue}10` }]}>
                <PlusIcon size={22} color={PsychiColors.royalBlue} />
              </View>
              <Text style={styles.actionTitle}>Book Session</Text>
              <Text style={styles.actionSubtitle}>Schedule support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/sessions')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${PsychiColors.coral}10` }]}>
                <CalendarIcon size={22} color={PsychiColors.coral} />
              </View>
              <Text style={styles.actionTitle}>Sessions</Text>
              <Text style={styles.actionSubtitle}>View history</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/profile')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconBg, { backgroundColor: `${PsychiColors.lavender}20` }]}>
                <SettingsIcon size={22} color={PsychiColors.violet} />
              </View>
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionSubtitle}>Preferences</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['5'],
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wide,
  },
  userName: {
    fontSize: Typography.fontSize['2xl'],
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: Spacing['0.5'],
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cloud,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },

  // Hero Card
  heroCard: {
    marginHorizontal: Spacing['5'],
    marginBottom: Spacing['6'],
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  heroContent: {
    padding: Spacing['5'],
  },
  heroIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${PsychiColors.royalBlue}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['4'],
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing['2'],
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textMuted,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
    marginBottom: Spacing['5'],
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.royalBlue,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['5'],
    borderRadius: BorderRadius.lg,
    gap: Spacing['2'],
    ...Shadows.button,
  },
  heroCtaText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.white,
    fontWeight: Typography.fontWeight.medium,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['6'],
    gap: Spacing['3'],
  },
  statCard: {
    flex: 1,
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    alignItems: 'center',
    ...Shadows.sm,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['2'],
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['0.5'],
  },
  statValueSmall: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['0.5'],
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // Section
  section: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['6'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['4'],
    letterSpacing: Typography.letterSpacing.tight,
  },

  // Supporter Card
  supporterCard: {
    flexDirection: 'row',
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    ...Shadows.soft,
  },
  supporterImage: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
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
    backgroundColor: `${PsychiColors.success}15`,
    paddingHorizontal: Spacing['2'],
    paddingVertical: Spacing['0.5'],
    borderRadius: BorderRadius.full,
  },
  matchBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.success,
  },
  supporterMeta: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginBottom: Spacing['2'],
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

  // Quick Actions
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  actionCard: {
    flex: 1,
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    alignItems: 'center',
    ...Shadows.sm,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['3'],
  },
  actionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['0.5'],
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },
});
