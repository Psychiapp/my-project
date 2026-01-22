import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors } from '@/constants/theme';
import { CalendarIcon, SettingsIcon, ChartIcon, ChatIcon, BookIcon, ClockIcon, DollarIcon, UsersIcon, EditIcon, PauseIcon, PlayIcon } from '@/components/icons';
import { getSupporterAvailability, updateAcceptingClients } from '@/lib/database';
import DashboardTutorial from '@/components/DashboardTutorial';

const TUTORIAL_COMPLETED_KEY = '@psychi_supporter_tutorial_completed';

export default function SupporterHomeScreen() {
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();

  // Dashboard tutorial state
  const [showTutorial, setShowTutorial] = useState(false);

  // Accepting new clients toggle - controls whether new clients can be matched with this supporter
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [isLoadingToggle, setIsLoadingToggle] = useState(true);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState(false);

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

  // Fetch initial accepting clients status from database
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

  // Handle toggle change - update database
  const handleAcceptingClientsToggle = async (value: boolean) => {
    if (!user?.id || isUpdatingToggle) return;

    // Optimistically update UI
    setAcceptingClients(value);
    setIsUpdatingToggle(true);

    const success = await updateAcceptingClients(user.id, value);

    if (!success) {
      // Revert on failure
      setAcceptingClients(!value);
    }

    setIsUpdatingToggle(false);
  };

  // Real data - no mock data
  const totalSessions = 0;
  const todaysSessions = 0;
  const weeklyGross = 0;
  const weeklyCommission = weeklyGross * 0.75;
  const upcomingSessions: { id: number; clientName: string; time: string; date: string; type: string; topic: string }[] = [];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
      >
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <LinearGradient
            colors={['#87CEEB', '#4A90E2', '#2E5C8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.welcomeGradient}
          >
            {/* Decorative elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>
                Welcome back, {profile?.firstName || 'there'}!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Here's what's happening with your support sessions today.
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Accepting New Clients Toggle */}
        <View style={styles.acceptingCard}>
          <View style={styles.acceptingContent}>
            <View style={[
              styles.acceptingIconBg,
              { backgroundColor: acceptingClients ? PsychiColors.successMuted : PsychiColors.errorMuted }
            ]}>
              {isLoadingToggle ? (
                <ActivityIndicator size="small" color={PsychiColors.royalBlue} />
              ) : acceptingClients ? (
                <PlayIcon size={20} color={PsychiColors.success} />
              ) : (
                <PauseIcon size={20} color={PsychiColors.error} />
              )}
            </View>
            <View style={styles.acceptingInfo}>
              <Text style={styles.acceptingTitle}>
                {isLoadingToggle ? 'Loading...' : acceptingClients ? 'Accepting New Clients' : 'Paused'}
              </Text>
              <Text style={styles.acceptingDescription}>
                {isLoadingToggle
                  ? 'Checking your status...'
                  : acceptingClients
                    ? 'New clients can be matched with you.'
                    : 'New matches paused. Existing clients can still book.'}
              </Text>
            </View>
            {isLoadingToggle ? (
              <ActivityIndicator size="small" color={PsychiColors.royalBlue} />
            ) : (
              <Switch
                value={acceptingClients}
                onValueChange={handleAcceptingClientsToggle}
                disabled={isUpdatingToggle}
                trackColor={{ false: PsychiColors.errorMuted, true: PsychiColors.successMuted }}
                thumbColor={acceptingClients ? PsychiColors.success : PsychiColors.error}
              />
            )}
          </View>
          <View style={styles.acceptingTip}>
            <Text style={styles.acceptingTipText}>
              Turn off when at capacity. Existing clients can still book sessions.
            </Text>
          </View>
        </View>

        {/* Launch Date Notice */}
        <View style={styles.launchNotice}>
          <LinearGradient
            colors={['rgba(255, 184, 166, 0.15)', 'rgba(228, 196, 240, 0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.launchNoticeGradient}
          >
            <View style={styles.launchNoticeContent}>
              <View style={styles.launchIconBg}>
                <CalendarIcon size={24} color="#D4847A" />
              </View>
              <View style={styles.launchInfo}>
                <View style={styles.launchTitleRow}>
                  <Text style={styles.launchTitle}>Platform Launch: April 1st, 2026</Text>
                  <View style={styles.preLaunchBadge}>
                    <Text style={styles.preLaunchBadgeText}>Pre-Launch</Text>
                  </View>
                </View>
                <Text style={styles.launchDescription}>
                  Psychi is currently in pre-launch mode. Client matching will begin on{' '}
                  <Text style={styles.launchBold}>April 1st, 2026</Text>. In the meantime, please
                  complete all training modules and obtain your Psychi Supporter Certificate to become
                  eligible for client assignments.
                </Text>
                <TouchableOpacity
                  style={styles.goToTrainingButton}
                  onPress={() => router.push('/(supporter)/training')}
                  activeOpacity={0.8}
                >
                  <BookIcon size={18} color="#2E5C8A" />
                  <Text style={styles.goToTrainingText}>Go to Training</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid - 3 cards matching web */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(74, 144, 226, 0.15)' }]}>
                <ClockIcon size={20} color="#4A90E2" />
              </View>
              <Text style={styles.statLabel}>Today's Sessions</Text>
            </View>
            <Text style={styles.statValue}>{todaysSessions}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(135, 206, 235, 0.2)' }]}>
                <DollarIcon size={20} color="#2E5C8A" />
              </View>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <Text style={[styles.statValue, { color: '#2E5C8A' }]}>${weeklyCommission.toFixed(2)}</Text>
            <Text style={styles.statSubtext}>75% of ${weeklyGross}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(228, 196, 240, 0.2)' }]}>
                <UsersIcon size={20} color="#9B6BA0" />
              </View>
              <Text style={styles.statLabel}>Total Sessions</Text>
            </View>
            <Text style={styles.statValue}>{totalSessions}</Text>
          </View>
        </View>

        {/* Commission Info Banner */}
        <View style={styles.commissionBanner}>
          <LinearGradient
            colors={['rgba(135, 206, 235, 0.2)', 'rgba(176, 224, 230, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.commissionGradient}
          >
            <View style={styles.commissionIconBg}>
              <DollarIcon size={22} color="#2E5C8A" />
            </View>
            <View style={styles.commissionInfo}>
              <Text style={styles.commissionTitle}>
                You earn <Text style={styles.commissionBold}>75% commission</Text> on every session
              </Text>
              <Text style={styles.commissionDetails}>Chat: $5.25 | Phone: $11.25 | Video: $15.00</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(supporter)/earnings')}>
              <Text style={styles.viewDetailsLink}>View Details</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <View style={styles.sessionsCard}>
            <View style={styles.sessionsHeader}>
              <Text style={styles.sessionsTitle}>Upcoming Sessions</Text>
              <TouchableOpacity onPress={() => router.push('/(supporter)/sessions')}>
                <Text style={styles.viewAllLink}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.sessionsList}>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.sessionItem}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#4A90E2', '#2E5C8A']}
                      style={styles.sessionAvatar}
                    >
                      <Text style={styles.sessionAvatarText}>{session.clientName.charAt(0)}</Text>
                    </LinearGradient>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionClientName}>{session.clientName}</Text>
                      <Text style={styles.sessionTopic}>{session.topic} • {session.type}</Text>
                    </View>
                    <View style={styles.sessionTimeInfo}>
                      <Text style={styles.sessionTime}>{session.time}</Text>
                      <Text style={styles.sessionDate}>{session.date}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyStateIconBg}>
                    <CalendarIcon size={32} color="#4A90E2" />
                  </View>
                  <Text style={styles.emptyStateText}>No upcoming sessions</Text>
                  <Text style={styles.emptyStateSubtext}>Sessions will appear here once clients book with you</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions - 4 cards matching web */}
        <View style={styles.section}>
          <View style={styles.quickActionsCard}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/(supporter)/availability')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(228, 196, 240, 0.3)' }]}>
                  <CalendarIcon size={24} color="#2E5C8A" />
                </View>
                <Text style={styles.quickActionLabel}>Set Availability</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/(supporter)/profile')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(74, 144, 226, 0.2)' }]}>
                  <EditIcon size={24} color="#2E5C8A" />
                </View>
                <Text style={styles.quickActionLabel}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/(supporter)/earnings')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(135, 206, 235, 0.3)' }]}>
                  <ChartIcon size={24} color="#2E5C8A" />
                </View>
                <Text style={styles.quickActionLabel}>View Earnings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/(supporter)/training')}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIconBg, { backgroundColor: 'rgba(255, 184, 166, 0.3)' }]}>
                  <BookIcon size={24} color="#2E5C8A" />
                </View>
                <Text style={styles.quickActionLabel}>Training</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    backgroundColor: '#FAF8F5',
  },
  scrollView: {
    flex: 1,
  },

  // Welcome Header
  welcomeHeader: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  welcomeGradient: {
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -40,
    left: -40,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'rgba(228, 196, 240, 0.2)',
  },
  welcomeContent: {
    position: 'relative',
  },
  welcomeTitle: {
    fontSize: 24,
    fontFamily: 'Georgia',
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
  },

  // Accepting Clients Card
  acceptingCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  acceptingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  acceptingIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptingInfo: {
    flex: 1,
  },
  acceptingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B3C',
    marginBottom: 2,
  },
  acceptingDescription: {
    fontSize: 13,
    color: '#4A90E2',
    lineHeight: 18,
  },
  acceptingTip: {
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(176, 224, 230, 0.3)',
  },
  acceptingTipText: {
    fontSize: 12,
    color: '#2E5C8A',
    lineHeight: 16,
  },

  // Launch Date Notice
  launchNotice: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 166, 0.4)',
  },
  launchNoticeGradient: {
    padding: 16,
  },
  launchNoticeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  launchIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 184, 166, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  launchInfo: {
    flex: 1,
  },
  launchTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  launchTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A2B3C',
  },
  preLaunchBadge: {
    backgroundColor: 'rgba(255, 184, 166, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  preLaunchBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#C17A68',
  },
  launchDescription: {
    fontSize: 13,
    color: '#2E5C8A',
    lineHeight: 20,
  },
  launchBold: {
    fontWeight: '700',
  },
  goToTrainingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    alignSelf: 'flex-start',
  },
  goToTrainingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2E5C8A',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    color: '#4A90E2',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A2B3C',
  },
  statSubtext: {
    fontSize: 11,
    color: '#4A90E2',
    marginTop: 2,
  },

  // Commission Banner
  commissionBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.3)',
  },
  commissionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  commissionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commissionInfo: {
    flex: 1,
  },
  commissionTitle: {
    fontSize: 14,
    color: '#1A2B3C',
  },
  commissionBold: {
    fontWeight: '700',
    color: '#2E5C8A',
  },
  commissionDetails: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 2,
  },
  viewDetailsLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  // Sessions Card
  sessionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
    overflow: 'hidden',
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(176, 224, 230, 0.3)',
  },
  sessionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B3C',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
  },
  sessionsList: {
    padding: 16,
    gap: 12,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  sessionAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClientName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A2B3C',
  },
  sessionTopic: {
    fontSize: 13,
    color: '#4A90E2',
    marginTop: 2,
  },
  sessionTimeInfo: {
    alignItems: 'flex-end',
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2B3C',
  },
  sessionDate: {
    fontSize: 12,
    color: '#4A90E2',
    marginTop: 2,
  },

  // Quick Actions
  quickActionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2B3C',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.3)',
    gap: 8,
  },
  quickActionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2B3C',
    textAlign: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A2B3C',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#4A90E2',
    textAlign: 'center',
  },
});
