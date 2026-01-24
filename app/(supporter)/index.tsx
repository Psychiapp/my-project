/**
 * Supporter Dashboard - Premium Editorial Design
 * Haute, magazine-quality interface for peer supporters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Shadows, Spacing, Typography, Gradients, BorderRadius } from '@/constants/theme';
import {
  CalendarIcon,
  ChartIcon,
  BookIcon,
  ClockIcon,
  DollarIcon,
  UsersIcon,
  EditIcon,
  PauseIcon,
  PlayIcon,
  ChevronRightIcon,
} from '@/components/icons';
import { getSupporterAvailability, updateAcceptingClients } from '@/lib/database';
import DashboardTutorial from '@/components/DashboardTutorial';
import { PremiumCard, Divider } from '@/components/ui/PremiumCard';

const TUTORIAL_COMPLETED_KEY = '@psychi_supporter_tutorial_completed';

export default function SupporterHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();

  // Dashboard tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Accepting new clients toggle
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [isLoadingToggle, setIsLoadingToggle] = useState(true);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState(false);

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

  // Handle tutorial skip
  const handleTutorialClose = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Error saving tutorial status:', error);
      setShowTutorial(false);
    }
  };

  // Fetch initial accepting clients status
  useEffect(() => {
    const fetchAcceptingStatus = async () => {
      if (!user?.id) {
        setIsLoadingToggle(false);
        return;
      }

      const availability = await getSupporterAvailability(user.id);
      if (availability) {
        setAcceptingClients(availability.acceptingClients);
      }
      setIsLoadingToggle(false);
    };

    fetchAcceptingStatus();
  }, [user?.id]);

  // Handle toggle change
  const handleAcceptingClientsToggle = async (value: boolean) => {
    if (!user?.id || isUpdatingToggle) return;

    setAcceptingClients(value);
    setIsUpdatingToggle(true);

    const success = await updateAcceptingClients(user.id, value);

    if (!success) {
      setAcceptingClients(!value);
    }

    setIsUpdatingToggle(false);
  };

  // Real data - no mock data
  const todaysSessions = 0;
  const weeklyGross = 0;
  const weeklyCommission = weeklyGross * 0.75;
  const totalSessions = 0;
  const upcomingSessions: { id: number; clientName: string; time: string; date: string; type: string; topic: string }[] = [];

  // Get current time for greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: 40 }}
      >
        {/* Editorial Header */}
        <View style={styles.header}>
          <Text style={styles.greetingLabel}>{greeting.toUpperCase()}</Text>
          <Text style={styles.userName}>{profile?.firstName || 'there'}</Text>
          <Text style={styles.headerSubtitle}>Your support dashboard</Text>
        </View>

        {/* Accepting Clients Status */}
        <View style={styles.statusCard}>
          <LinearGradient
            colors={Gradients.glassCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <View style={[
                styles.statusIconBg,
                { backgroundColor: acceptingClients ? PsychiColors.successMuted : PsychiColors.errorMuted }
              ]}>
                {isLoadingToggle ? (
                  <ActivityIndicator size="small" color={PsychiColors.royalBlue} />
                ) : acceptingClients ? (
                  <PlayIcon size={18} color={PsychiColors.success} />
                ) : (
                  <PauseIcon size={18} color={PsychiColors.error} />
                )}
              </View>
              <View style={styles.statusInfo}>
                <Text style={styles.statusTitle}>
                  {isLoadingToggle ? 'Loading...' : acceptingClients ? 'Accepting Clients' : 'Paused'}
                </Text>
                <Text style={styles.statusSubtitle}>
                  {acceptingClients ? 'New clients can match with you' : 'Existing clients can still book'}
                </Text>
              </View>
              {!isLoadingToggle && (
                <Switch
                  value={acceptingClients}
                  onValueChange={handleAcceptingClientsToggle}
                  disabled={isUpdatingToggle}
                  trackColor={{ false: PsychiColors.frost, true: PsychiColors.successMuted }}
                  thumbColor={acceptingClients ? PsychiColors.success : PsychiColors.textMuted}
                  ios_backgroundColor={PsychiColors.frost}
                />
              )}
            </View>
          </LinearGradient>
        </View>

        {/* Launch Notice Card */}
        <View style={styles.launchCard}>
          <LinearGradient
            colors={['rgba(212, 151, 122, 0.08)', 'rgba(197, 165, 114, 0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.launchGradient}
          >
            <View style={styles.launchHeader}>
              <View style={styles.launchIconBg}>
                <CalendarIcon size={20} color={PsychiColors.coral} />
              </View>
              <View style={styles.launchBadge}>
                <Text style={styles.launchBadgeText}>PRE-LAUNCH</Text>
              </View>
            </View>
            <Text style={styles.launchTitle}>Platform Launch: April 1st, 2026</Text>
            <Text style={styles.launchDescription}>
              Complete all training modules to earn your Psychi Supporter Certificate and become eligible for client assignments.
            </Text>
            <TouchableOpacity
              style={styles.launchButton}
              onPress={() => router.push('/(supporter)/training')}
              activeOpacity={0.7}
            >
              <BookIcon size={16} color={PsychiColors.white} />
              <Text style={styles.launchButtonText}>Go to Training</Text>
              <ChevronRightIcon size={14} color={PsychiColors.white} />
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR STATS</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todaysSessions}</Text>
              <Text style={styles.statLabel}>Today's Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statValueAccent]}>${weeklyCommission.toFixed(0)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalSessions}</Text>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
          </View>
        </View>

        {/* Commission Banner */}
        <View style={styles.commissionBanner}>
          <View style={styles.commissionIconBg}>
            <DollarIcon size={18} color={PsychiColors.gold} />
          </View>
          <View style={styles.commissionInfo}>
            <Text style={styles.commissionText}>
              You earn <Text style={styles.commissionBold}>75% commission</Text> on every session
            </Text>
            <Text style={styles.commissionRates}>Chat $5.25 · Phone $11.25 · Video $15</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(supporter)/earnings')}
            style={styles.commissionLink}
          >
            <Text style={styles.commissionLinkText}>Details</Text>
            <ChevronRightIcon size={14} color={PsychiColors.royalBlue} />
          </TouchableOpacity>
        </View>

        <Divider style={styles.sectionDivider} />

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity
              onPress={() => router.push('/(supporter)/sessions')}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRightIcon size={14} color={PsychiColors.royalBlue} />
            </TouchableOpacity>
          </View>

          {upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionItem}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={Gradients.hero}
                  style={styles.sessionAvatar}
                >
                  <Text style={styles.sessionAvatarText}>{session.clientName.charAt(0)}</Text>
                </LinearGradient>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionClientName}>{session.clientName}</Text>
                  <Text style={styles.sessionDetails}>{session.topic} · {session.type}</Text>
                </View>
                <View style={styles.sessionTime}>
                  <Text style={styles.sessionTimeText}>{session.time}</Text>
                  <Text style={styles.sessionDateText}>{session.date}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconBg}>
                <CalendarIcon size={28} color={PsychiColors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>No upcoming sessions</Text>
              <Text style={styles.emptySubtitle}>Sessions will appear here once clients book with you</Text>
            </View>
          )}
        </View>

        <Divider style={styles.sectionDivider} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(supporter)/availability')}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(181, 163, 189, 0.15)' }]}>
              <CalendarIcon size={20} color={PsychiColors.lavender} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Set Availability</Text>
              <Text style={styles.actionSubtitle}>Manage your schedule</Text>
            </View>
            <ChevronRightIcon size={18} color={PsychiColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(supporter)/profile')}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(137, 167, 196, 0.15)' }]}>
              <EditIcon size={20} color={PsychiColors.azure} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Edit Profile</Text>
              <Text style={styles.actionSubtitle}>Update your bio and photo</Text>
            </View>
            <ChevronRightIcon size={18} color={PsychiColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(supporter)/earnings')}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(197, 165, 114, 0.15)' }]}>
              <ChartIcon size={20} color={PsychiColors.gold} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>View Earnings</Text>
              <Text style={styles.actionSubtitle}>Track your income</Text>
            </View>
            <ChevronRightIcon size={18} color={PsychiColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/(supporter)/training')}
            activeOpacity={0.6}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(212, 151, 122, 0.15)' }]}>
              <BookIcon size={20} color={PsychiColors.coral} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Training Modules</Text>
              <Text style={styles.actionSubtitle}>Continue your certification</Text>
            </View>
            <ChevronRightIcon size={18} color={PsychiColors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dashboard Tutorial */}
      <DashboardTutorial
        visible={showTutorial}
        onClose={handleTutorialClose}
        onComplete={handleTutorialComplete}
        userType="supporter"
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
    paddingHorizontal: Spacing['6'],
    marginBottom: Spacing['6'],
  },
  greetingLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textMuted,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing['1'],
  },
  userName: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tighter,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing['1'],
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    letterSpacing: Typography.letterSpacing.normal,
  },

  // Status Card (Accepting Clients)
  statusCard: {
    marginHorizontal: Spacing['6'],
    marginBottom: Spacing['4'],
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  statusGradient: {
    padding: Spacing['4'],
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
  },
  statusIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },

  // Launch Notice Card
  launchCard: {
    marginHorizontal: Spacing['6'],
    marginBottom: Spacing['6'],
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212, 151, 122, 0.20)',
  },
  launchGradient: {
    padding: Spacing['5'],
  },
  launchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['3'],
  },
  launchIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(212, 151, 122, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchBadge: {
    backgroundColor: 'rgba(212, 151, 122, 0.15)',
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['1'],
    borderRadius: BorderRadius.full,
  },
  launchBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.coral,
    letterSpacing: Typography.letterSpacing.wide,
  },
  launchTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['2'],
  },
  launchDescription: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    marginBottom: Spacing['4'],
  },
  launchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2'],
    backgroundColor: PsychiColors.royalBlue,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['5'],
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  launchButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },

  // Stats Section
  section: {
    paddingHorizontal: Spacing['6'],
    marginBottom: Spacing['2'],
  },
  sectionLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textMuted,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing['4'],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.cloud,
    borderRadius: 20,
    padding: Spacing['5'],
    ...Shadows.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: PsychiColors.divider,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
    marginBottom: Spacing['0.5'],
  },
  statValueAccent: {
    color: PsychiColors.royalBlue,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // Commission Banner
  commissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing['6'],
    marginTop: Spacing['4'],
    marginBottom: Spacing['2'],
    padding: Spacing['4'],
    backgroundColor: 'rgba(197, 165, 114, 0.08)',
    borderRadius: 16,
    gap: Spacing['3'],
  },
  commissionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(197, 165, 114, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commissionInfo: {
    flex: 1,
  },
  commissionText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textPrimary,
  },
  commissionBold: {
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.gold,
  },
  commissionRates: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  commissionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['0.5'],
  },
  commissionLinkText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.royalBlue,
  },

  // Section Divider
  sectionDivider: {
    marginHorizontal: Spacing['6'],
    marginVertical: Spacing['5'],
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['0.5'],
  },
  viewAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.royalBlue,
  },

  // Session Items
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    backgroundColor: PsychiColors.cloud,
    borderRadius: 16,
    marginBottom: Spacing['3'],
    gap: Spacing['3'],
    ...Shadows.ambient,
  },
  sessionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionAvatarText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClientName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  sessionDetails: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  sessionTime: {
    alignItems: 'flex-end',
  },
  sessionTimeText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textPrimary,
  },
  sessionDateText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['10'],
    backgroundColor: PsychiColors.cloud,
    borderRadius: 20,
    ...Shadows.ambient,
  },
  emptyIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: PsychiColors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['3'],
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing['1'],
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing['6'],
  },

  // Quick Actions - List Style
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.divider,
    gap: Spacing['3'],
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
});
