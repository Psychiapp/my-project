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
import { NotificationsIcon, SearchIcon, CalendarIcon, ChatIcon, PhoneIcon, VideoIcon, CheckCircleIcon } from '@/components/icons';

export default function ClientHomeScreen() {
  const insets = useSafeAreaInsets();

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
            <Text style={styles.headerTitle}>Your Wellness Hub</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <NotificationsIcon size={22} color={PsychiColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Launch Banner */}
        <View style={styles.launchBanner}>
          <LinearGradient
            colors={Gradients.hero}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.launchGradient}
          >
            <View style={styles.launchBadge}>
              <Text style={styles.launchBadgeText}>Pre-Launch</Text>
            </View>
            <Text style={styles.launchTitle}>Platform Launch: {Config.launchDate}</Text>
            <Text style={styles.launchSubtitle}>
              Get early access to peer support services
            </Text>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/browse')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.client}
                style={styles.actionIconBg}
              >
                <SearchIcon size={26} color={PsychiColors.white} />
              </LinearGradient>
              <Text style={styles.actionTitle}>Find Support</Text>
              <Text style={styles.actionSubtitle}>Browse supporters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(client)/sessions')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.supporter}
                style={styles.actionIconBg}
              >
                <CalendarIcon size={26} color={PsychiColors.white} />
              </LinearGradient>
              <Text style={styles.actionTitle}>My Sessions</Text>
              <Text style={styles.actionSubtitle}>View upcoming</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ways to Connect</Text>

          <TouchableOpacity style={styles.supportTypeCard} activeOpacity={0.8}>
            <LinearGradient
              colors={['#4A90E2', '#2563EB']}
              style={styles.supportTypeIconBg}
            >
              <ChatIcon size={24} color={PsychiColors.white} />
            </LinearGradient>
            <View style={styles.supportTypeInfo}>
              <Text style={styles.supportTypeName}>Chat Support</Text>
              <Text style={styles.supportTypeDesc}>Text-based support sessions</Text>
            </View>
            <View style={styles.supportTypePrice}>
              <Text style={styles.priceText}>{Config.pricing.chat.display}</Text>
              <Text style={styles.priceUnit}>per session</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportTypeCard} activeOpacity={0.8}>
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              style={styles.supportTypeIconBg}
            >
              <PhoneIcon size={24} color={PsychiColors.white} />
            </LinearGradient>
            <View style={styles.supportTypeInfo}>
              <Text style={styles.supportTypeName}>Phone Support</Text>
              <Text style={styles.supportTypeDesc}>Voice call sessions</Text>
            </View>
            <View style={styles.supportTypePrice}>
              <Text style={styles.priceText}>{Config.pricing.phone.display}</Text>
              <Text style={styles.priceUnit}>per session</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.supportTypeCard} activeOpacity={0.8}>
            <LinearGradient
              colors={['#FB923C', '#F97316']}
              style={styles.supportTypeIconBg}
            >
              <VideoIcon size={24} color={PsychiColors.white} />
            </LinearGradient>
            <View style={styles.supportTypeInfo}>
              <Text style={styles.supportTypeName}>Video Support</Text>
              <Text style={styles.supportTypeDesc}>Face-to-face video sessions</Text>
            </View>
            <View style={styles.supportTypePrice}>
              <Text style={styles.priceText}>{Config.pricing.video.display}</Text>
              <Text style={styles.priceUnit}>per session</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsCard}>
            <View style={styles.step}>
              <LinearGradient
                colors={Gradients.primaryButton}
                style={styles.stepNumber}
              >
                <Text style={styles.stepNumberText}>1</Text>
              </LinearGradient>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Browse Supporters</Text>
                <Text style={styles.stepDesc}>Find someone who matches your needs</Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.step}>
              <LinearGradient
                colors={Gradients.primaryButton}
                style={styles.stepNumber}
              >
                <Text style={styles.stepNumberText}>2</Text>
              </LinearGradient>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Book a Session</Text>
                <Text style={styles.stepDesc}>Choose a time that works for you</Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.step}>
              <LinearGradient
                colors={Gradients.primaryButton}
                style={styles.stepNumber}
              >
                <Text style={styles.stepNumberText}>3</Text>
              </LinearGradient>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>Get Support</Text>
                <Text style={styles.stepDesc}>Connect via chat, phone, or video</Text>
              </View>
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.serif,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.card,
  },
  actionIconBg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  supportTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  supportTypeIconBg: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  supportTypeInfo: {
    flex: 1,
  },
  supportTypeName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  supportTypeDesc: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
  },
  supportTypePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.royalBlue,
  },
  priceUnit: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },
  stepsCard: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    ...Shadows.card,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepNumberText: {
    color: PsychiColors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepDesc: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
  },
  stepDivider: {
    height: 24,
    width: 2,
    backgroundColor: PsychiColors.borderMedium,
    marginLeft: 17,
    marginVertical: Spacing.sm,
  },
});
