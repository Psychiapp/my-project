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
import { HomeIcon, ChatIcon, ProfileIcon } from '@/components/icons';
import { hasRequestedPermissions } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { checkClientProfileCompletion } from '@/lib/database';

// Premium tab bar icon with subtle active indicator
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.royalBlue : PsychiColors.textSoft;
  const iconSize = 22;

  const renderIcon = () => {
    switch (name) {
      case 'index':
        return <HomeIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
      case 'sessions':
        return <ChatIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
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

export default function ClientLayout() {
  const { user, isDemoMode } = useAuth();
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  // Check permissions on first launch
  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasRequested = await hasRequestedPermissions();
      if (!hasRequested) {
        router.push('/permissions?returnTo=/(client)');
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

      const completion = await checkClientProfileCompletion(user.id);

      if (!completion.isComplete) {
        // Redirect to profile setup with missing fields info
        const missingFieldsParam = encodeURIComponent(completion.missingFields.join(','));
        router.replace(`/profile-setup?role=client&missing=${missingFieldsParam}` as any);
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
        <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PsychiColors.royalBlue,
        tabBarInactiveTintColor: PsychiColors.textSoft,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon name="profile" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="supporter"
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
    paddingHorizontal: Spacing['4'],
    ...Shadows.premium,
  },
  tabItem: {
    paddingTop: Spacing['1'],
  },
  tabLabel: {
    fontSize: 10,
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
