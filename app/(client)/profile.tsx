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

export default function ProfileScreen() {
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

  const menuItems = [
    {
      icon: '👤',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => router.push('/settings/edit-profile'),
    },
    {
      icon: '🎯',
      title: 'Preferences',
      subtitle: 'Manage your support preferences',
      onPress: () => router.push('/settings/edit-profile'),
    },
    {
      icon: '💳',
      title: 'Subscription',
      subtitle: 'Manage your subscription plan',
      onPress: () => router.push('/(client)/subscription'),
    },
    {
      icon: '🔔',
      title: 'Notifications',
      subtitle: 'Configure notification settings',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      icon: '📱',
      title: 'Device Permissions',
      subtitle: 'Camera, microphone & notifications',
      onPress: () => router.push('/permissions'),
    },
    {
      icon: '🔒',
      title: 'Privacy & Security',
      subtitle: 'Manage your account security',
      onPress: () => router.push('/settings/privacy'),
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
            <Text style={styles.avatarText}>
              {profile?.firstName?.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {profile?.firstName && profile?.lastName
                ? `${profile.firstName} ${profile.lastName}`
                : 'User'}
            </Text>
            <Text style={styles.profileEmail}>{profile?.email || 'user@example.com'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Subscription Status */}
        <View style={styles.subscriptionCard}>
          <View style={styles.subscriptionHeader}>
            <Text style={styles.subscriptionTitle}>Current Plan</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>Free</Text>
            </View>
          </View>
          <Text style={styles.subscriptionSubtitle}>
            Upgrade to unlock more features and sessions
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            activeOpacity={0.8}
            onPress={() => router.push('/(client)/subscription')}
          >
            <LinearGradient
              colors={[PsychiColors.violet, PsychiColors.periwinkle]}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>View Plans</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  profileEmail: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  subscriptionCard: {
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  planBadge: {
    backgroundColor: 'rgba(123, 104, 176, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.violet,
  },
  subscriptionSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  upgradeButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
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
