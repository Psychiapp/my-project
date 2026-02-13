import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import {
  PsychiColors,
  Shadows,
  Typography,
  BorderRadius,
  Spacing,
} from '@/constants/theme';
import { HomeIcon, ChatIcon, DollarIcon, ProfileIcon } from '@/components/icons';
import { hasRequestedPermissions } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { checkSupporterProfileCompletion } from '@/lib/database';

// Premium tab bar icon with subtle active indicator
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.coral : PsychiColors.textSoft;
  const iconSize = 22;

  const renderIcon = () => {
    switch (name) {
      case 'index':
        return <HomeIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
      case 'sessions':
        return <ChatIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
      case 'earnings':
        return <DollarIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
      case 'profile':
        return <ProfileIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
      default:
        return <HomeIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
    }
  };

  return (
    <View style={styles.iconContainer}>
      {renderIcon()}
      {/* Subtle active indicator bar */}
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function SupporterLayout() {
  const { user, isDemoMode } = useAuth();
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check permissions on first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasRequested = await hasRequestedPermissions();
      if (!hasRequested) {
        router.push('/permissions?returnTo=/(supporter)');
      }
      setIsCheckingPermissions(false);
    };

    checkFirstLaunch();
  }, []);

  // Check profile completion
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user?.id) {
        setIsCheckingProfile(false);
        return;
      }

      // Skip profile check in demo mode
      if (isDemoMode) {
        setIsCheckingProfile(false);
        return;
      }

      const completion = await checkSupporterProfileCompletion(user.id);

      if (!completion.isComplete) {
        // Redirect to profile setup with missing fields info
        const missingFieldsParam = encodeURIComponent(completion.missingFields.join(','));
        router.replace(`/profile-setup?role=supporter&missing=${missingFieldsParam}` as any);
      }

      setIsCheckingProfile(false);
    };

    if (!isCheckingPermissions) {
      checkProfileCompletion();
    }
  }, [user?.id, isDemoMode, isCheckingPermissions]);

  if (isCheckingPermissions || isCheckingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={PsychiColors.coral} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PsychiColors.coral,
        tabBarInactiveTintColor: PsychiColors.textSoft,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      {/* 4 Main Tabs */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ focused }) => <TabIcon name="sessions" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Earnings',
          tabBarIcon: ({ focused }) => <TabIcon name="earnings" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
      {/* Hidden screens - accessible via navigation */}
      <Tabs.Screen
        name="availability"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="training"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payout-settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="resources"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="w9-form"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tax-documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="verification"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PsychiColors.cream,
  },
  tabBar: {
    backgroundColor: PsychiColors.cloud,
    borderTopWidth: 0,
    height: 88,
    paddingTop: Spacing['3'],
    paddingBottom: 32,
    paddingHorizontal: Spacing['2'],
    ...Shadows.premium,
  },
  tabItem: {
    paddingTop: Spacing['1'],
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wider,
    marginTop: Spacing['1.5'],
    textTransform: 'uppercase',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['0.5'],
  },
  activeIndicator: {
    position: 'absolute',
    top: -Spacing['3'],
    width: 24,
    height: 3,
    backgroundColor: PsychiColors.gold,
    borderRadius: BorderRadius.full,
  },
});
