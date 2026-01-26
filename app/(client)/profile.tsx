import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  PsychiColors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
} from '@/constants/theme';
import {
  ProfileIcon,
  SlidersIcon,
  CardIcon,
  NotificationsIcon,
  PhoneIcon,
  ShieldIcon,
  HelpIcon,
  LogoutIcon,
  ChevronRightIcon,
  EditIcon,
} from '@/components/icons';

interface MenuItem {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}

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

  const menuItems: MenuItem[] = [
    {
      icon: <ProfileIcon size={20} color={PsychiColors.royalBlue} />,
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => router.push('/settings/edit-profile'),
    },
    {
      icon: <SlidersIcon size={20} color={PsychiColors.violet} />,
      title: 'Preferences',
      subtitle: 'Timezone, session types & matching',
      onPress: () => router.push('/settings/preferences'),
    },
    {
      icon: <CardIcon size={20} color={PsychiColors.coral} />,
      title: 'Subscription',
      subtitle: 'Manage your subscription plan',
      onPress: () => router.push('/(client)/subscription'),
    },
    {
      icon: <NotificationsIcon size={20} color={PsychiColors.warning} />,
      title: 'Notifications',
      subtitle: 'Configure notification settings',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      icon: <PhoneIcon size={20} color={PsychiColors.success} />,
      title: 'Device Permissions',
      subtitle: 'Camera, microphone & notifications',
      onPress: () => router.push('/permissions'),
    },
    {
      icon: <ShieldIcon size={20} color={PsychiColors.sapphire} />,
      title: 'Privacy & Security',
      subtitle: 'Manage your account security',
      onPress: () => router.push('/settings/privacy'),
    },
    {
      icon: <HelpIcon size={20} color={PsychiColors.textMuted} />,
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
            colors={[PsychiColors.azure, PsychiColors.royalBlue]}
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
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.7}
            onPress={() => router.push('/settings/edit-profile')}
          >
            <EditIcon size={16} color={PsychiColors.royalBlue} />
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
              colors={[PsychiColors.coral, PsychiColors.periwinkle]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.menuItemLast,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              {item.icon}
              <View style={styles.menuInfo}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRightIcon size={20} color={PsychiColors.textSoft} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogoutIcon size={20} color={PsychiColors.error} />
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
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['4'],
    paddingBottom: Spacing['3'],
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    letterSpacing: Typography.letterSpacing.tight,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.cloud,
    marginHorizontal: Spacing['5'],
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    marginBottom: Spacing['4'],
    ...Shadows.soft,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing['4'],
  },
  profileName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  profileEmail: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: Spacing['0.5'],
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: `${PsychiColors.royalBlue}10`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscriptionCard: {
    backgroundColor: PsychiColors.cloud,
    marginHorizontal: Spacing['5'],
    borderRadius: BorderRadius.xl,
    padding: Spacing['5'],
    marginBottom: Spacing['5'],
    ...Shadows.soft,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing['1'],
  },
  subscriptionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  planBadge: {
    backgroundColor: `${PsychiColors.lavender}20`,
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['1'],
    borderRadius: BorderRadius.full,
  },
  planBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.violet,
  },
  subscriptionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginBottom: Spacing['4'],
  },
  upgradeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: Spacing['3'],
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.white,
  },
  menuSection: {
    backgroundColor: PsychiColors.cloud,
    marginHorizontal: Spacing['5'],
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing['5'],
    ...Shadows.soft,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing['4'],
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.borderUltraLight,
    gap: Spacing['4'],
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textPrimary,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: Spacing['0.5'],
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.cloud,
    marginHorizontal: Spacing['5'],
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    gap: Spacing['2'],
    borderWidth: 1,
    borderColor: `${PsychiColors.error}15`,
    ...Shadows.sm,
  },
  signOutText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSoft,
    marginTop: Spacing['5'],
  },
});
