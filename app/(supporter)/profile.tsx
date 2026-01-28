import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  ProfileIcon,
  BookIcon,
  NotificationsIcon,
  PhoneIcon,
  InfoIcon,
  LogoutIcon,
  ChevronRightIcon,
} from '@/components/icons';
import { getSupporterDetail, getSupporterSessionCount } from '@/lib/database';

interface SupporterProfileData {
  name: string;
  education: string;
  totalSessions: number;
  bio: string;
  specialties: string[];
  communicationStyles: string[];
}

export default function SupporterProfileScreen() {
  const { user, profile, signOut } = useAuth();
  const [supporterData, setSupporterData] = useState<SupporterProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSupporterData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [detail, sessionCount] = await Promise.all([
          getSupporterDetail(user.id),
          getSupporterSessionCount(user.id),
        ]);

        if (detail) {
          setSupporterData({
            name: detail.full_name,
            education: detail.education || '',
            totalSessions: sessionCount || 0,
            bio: detail.bio || '',
            specialties: detail.specialties || [],
            communicationStyles: [], // Not stored in database yet
          });
        }
      } catch (error) {
        console.error('Error fetching supporter data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupporterData();
  }, [user?.id]);

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

  // Use fetched data or defaults
  const supporterProfile = supporterData || {
    name: `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'Your Profile',
    education: '',
    totalSessions: 0,
    bio: 'Add a bio to tell clients about yourself',
    specialties: [],
    communicationStyles: [],
  };

  const menuItems = [
    {
      icon: ProfileIcon,
      title: 'Edit Profile',
      subtitle: 'Update bio, photo, and specialties',
      onPress: () => router.push('/(supporter)/edit-profile'),
    },
    {
      icon: BookIcon,
      title: 'Training Center',
      subtitle: 'Access training materials',
      onPress: () => router.push('/(supporter)/training'),
    },
    {
      icon: NotificationsIcon,
      title: 'Notifications',
      subtitle: 'Configure alerts and reminders',
      onPress: () => router.push('/settings/notifications'),
    },
    {
      icon: PhoneIcon,
      title: 'Device Permissions',
      subtitle: 'Camera, microphone & notifications',
      onPress: () => router.push('/permissions'),
    },
    {
      icon: InfoIcon,
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
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <IconComponent size={20} color={PsychiColors.azure} />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRightIcon size={20} color={PsychiColors.textSoft} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <LogoutIcon size={18} color={PsychiColors.error} />
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
    gap: Spacing.md,
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
  signOutText: {
    marginLeft: Spacing.sm,
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
