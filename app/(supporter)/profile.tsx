import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function SupporterProfileScreen() {
  const { profile, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/welcome');
          },
        },
      ]
    );
  };

  // Mock profile data
  const supporterProfile = {
    name: 'Sarah Chen',
    education: 'Psychology, Stanford University',
    rating: 4.9,
    totalSessions: 127,
    bio: 'I specialize in helping students navigate academic stress and anxiety. My approach combines active listening with practical coping strategies.',
    specialties: ['Anxiety', 'Stress', 'Academic', 'Motivation'],
    communicationStyles: ['Active Listening', 'Empathetic', 'Solution-Focused'],
  };

  const menuItems = [
    {
      icon: '👤',
      title: 'Edit Profile',
      subtitle: 'Update bio, photo, and specialties',
      onPress: () => router.push('/(supporter)/edit-profile'),
    },
    {
      icon: '🎓',
      title: 'Education & Experience',
      subtitle: 'Update credentials and background',
      onPress: () => router.push('/(supporter)/edit-profile'),
    },
    {
      icon: '💳',
      title: 'Payout Settings',
      subtitle: 'Manage bank account and schedule',
      onPress: () => router.push('/(supporter)/payout-settings'),
    },
    {
      icon: '📚',
      title: 'Training Center',
      subtitle: 'Access training materials',
      onPress: () => router.push('/(supporter)/training'),
    },
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Configure alerts and reminders',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      icon: '📱',
      title: 'Device Permissions',
      subtitle: 'Camera, microphone & notifications',
      onPress: () => router.push('/permissions'),
    },
    {
      icon: '📋',
      title: 'Guidelines',
      subtitle: 'Review supporter guidelines',
      onPress: () => router.push('/(supporter)/training'),
    },
    {
      icon: '❓',
      title: 'Help & Support',
      subtitle: 'Get help or contact us',
      onPress: () => router.push('/settings/help'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[PsychiColors.azure, PsychiColors.deep]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{supporterProfile.name.charAt(0)}</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{supporterProfile.name}</Text>
            <Text style={styles.profileEducation}>{supporterProfile.education}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>⭐ {supporterProfile.rating}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{supporterProfile.totalSessions} sessions</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bio Section */}
        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>About Me</Text>
          <Text style={styles.bioText}>{supporterProfile.bio}</Text>

          <Text style={styles.bioTitle}>Specialties</Text>
          <View style={styles.tagsContainer}>
            {supporterProfile.specialties.map((specialty, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{specialty}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.bioTitle}>Communication Style</Text>
          <View style={styles.tagsContainer}>
            {supporterProfile.communicationStyles.map((style, index) => (
              <View key={index} style={[styles.tag, styles.tagSecondary]}>
                <Text style={[styles.tagText, styles.tagTextSecondary]}>{style}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Text style={styles.menuIconText}>{item.icon}</Text>
              </View>
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* App Version */}
        <Text style={styles.versionText}>Version 1.0.0</Text>

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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  profileEducation: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statItem: {},
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(0,0,0,0.15)',
    marginHorizontal: Spacing.sm,
  },
  bioCard: {
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  bioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  bioText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tagSecondary: {
    backgroundColor: 'rgba(123, 104, 176, 0.1)',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
  tagTextSecondary: {
    color: PsychiColors.violet,
  },
  menuSection: {
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  menuSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  menuArrow: {
    fontSize: 24,
    color: PsychiColors.textSoft,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  signOutIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 13,
    color: PsychiColors.textSoft,
    marginTop: Spacing.lg,
  },
});
