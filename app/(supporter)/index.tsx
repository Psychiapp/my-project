import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { Config } from '@/constants/config';
import { NotificationsIcon, ChartIcon, DollarIcon, StarIcon, CalendarIcon, BookIcon, VideoIcon, PhoneIcon, ChatIcon } from '@/components/icons';

export default function SupporterHomeScreen() {
  const insets = useSafeAreaInsets();

  // Mock data
  const stats = {
    totalSessions: 47,
    totalEarnings: 705.75,
    rating: 4.9,
    upcomingSessions: 3,
  };

  const upcomingSessions = [
    { id: '1', clientName: 'John D.', type: 'video', time: 'Today, 2:00 PM' },
    { id: '2', clientName: 'Sarah M.', type: 'chat', time: 'Tomorrow, 10:00 AM' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + Spacing.md, paddingBottom: Spacing.xl }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back!</Text>
            <Text style={styles.headerTitle}>Supporter Dashboard</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <NotificationsIcon size={22} color={PsychiColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Launch Banner */}
        <View style={styles.launchBanner}>
          <LinearGradient
            colors={Gradients.supporter}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.launchGradient}
          >
            <View style={styles.launchBadge}>
              <Text style={styles.launchBadgeText}>Pre-Launch</Text>
            </View>
            <Text style={styles.launchTitle}>Platform Launch: {Config.launchDate}</Text>
            <Text style={styles.launchSubtitle}>
              Complete your training to be ready for launch
            </Text>
            <TouchableOpacity style={styles.trainingButton} activeOpacity={0.8}>
              <Text style={styles.trainingButtonText}>Go to Training</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={Gradients.client}
              style={styles.statIconBg}
            >
              <ChartIcon size={22} color={PsychiColors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.statIconBg}
            >
              <DollarIcon size={22} color={PsychiColors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>${stats.totalEarnings.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Earnings</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.statIconBg}
            >
              <StarIcon size={22} color={PsychiColors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.rating}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={Gradients.supporter}
              style={styles.statIconBg}
            >
              <CalendarIcon size={22} color={PsychiColors.white} />
            </LinearGradient>
            <Text style={styles.statValue}>{stats.upcomingSessions}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(supporter)/availability')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.client}
                style={styles.actionIconBg}
              >
                <CalendarIcon size={22} color={PsychiColors.white} />
              </LinearGradient>
              <Text style={styles.actionTitle}>Set Availability</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(supporter)/earnings')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.supporter}
                style={styles.actionIconBg}
              >
                <DollarIcon size={22} color={PsychiColors.white} />
              </LinearGradient>
              <Text style={styles.actionTitle}>View Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FB923C', '#F97316']}
                style={styles.actionIconBg}
              >
                <BookIcon size={22} color={PsychiColors.white} />
              </LinearGradient>
              <Text style={styles.actionTitle}>Training</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/(supporter)/sessions')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {upcomingSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              <LinearGradient
                colors={session.type === 'video' ? ['#FB923C', '#F97316'] : session.type === 'phone' ? Gradients.client : Gradients.primaryButton}
                style={styles.sessionIconBg}
              >
                {session.type === 'video' ? (
                  <VideoIcon size={22} color={PsychiColors.white} />
                ) : session.type === 'phone' ? (
                  <PhoneIcon size={22} color={PsychiColors.white} />
                ) : (
                  <ChatIcon size={22} color={PsychiColors.white} />
                )}
              </LinearGradient>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionClient}>{session.clientName}</Text>
                <Text style={styles.sessionTime}>{session.time}</Text>
              </View>
              <TouchableOpacity
                style={styles.joinSessionButton}
                onPress={() => router.push(`/session/${session.id}?type=${session.type}`)}
              >
                <LinearGradient
                  colors={Gradients.primaryButton}
                  style={styles.joinSessionGradient}
                >
                  <Text style={styles.joinSessionText}>
                    {session.type === 'chat' ? 'Open' : 'Join'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}

          {upcomingSessions.length === 0 && (
            <View style={styles.emptyState}>
              <CalendarIcon size={36} color={PsychiColors.textMuted} />
              <Text style={styles.emptyText}>No upcoming sessions</Text>
            </View>
          )}
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earnings This Week</Text>
          <View style={styles.earningsCard}>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Sessions completed</Text>
              <Text style={styles.earningsValue}>5</Text>
            </View>
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabel}>Gross earnings</Text>
              <Text style={styles.earningsValue}>$120.00</Text>
            </View>
            <View style={styles.earningsDivider} />
            <View style={styles.earningsRow}>
              <Text style={styles.earningsLabelBold}>Your earnings (75%)</Text>
              <Text style={styles.earningsValueBold}>$90.00</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    fontFamily: Typography.fontFamily.serif,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.glassWhiteStrong,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  launchBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.card,
  },
  launchGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  launchBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  launchBadgeText: {
    color: PsychiColors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  launchTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.white,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.serif,
  },
  launchSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  trainingButton: {
    backgroundColor: PsychiColors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius['2xl'],
    ...Shadows.button,
  },
  trainingButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.lavender,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47%',
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  statIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.serif,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    textAlign: 'center',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  sessionIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClient: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  sessionTime: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: Spacing.xs,
  },
  joinSessionButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.button,
  },
  joinSessionGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius['2xl'],
  },
  joinSessionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    ...Shadows.card,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textMuted,
  },
  earningsCard: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.card,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  earningsLabel: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  earningsValue: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: PsychiColors.borderMedium,
    marginVertical: Spacing.sm,
  },
  earningsLabelBold: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  earningsValueBold: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.royalBlue,
  },
});
