import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PsychiColors, Shadows, Typography, BorderRadius } from '@/constants/theme';
import { HomeIcon, SearchIcon, ChatIcon, ProfileIcon } from '@/components/icons';
import { hasRequestedPermissions } from '@/lib/permissions';

// Tab bar icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.royalBlue : PsychiColors.textMuted;
  const iconSize = 24;

  const renderIcon = () => {
    switch (name) {
      case 'index':
        return <HomeIcon size={iconSize} color={iconColor} />;
      case 'browse':
        return <SearchIcon size={iconSize} color={iconColor} />;
      case 'sessions':
        return <ChatIcon size={iconSize} color={iconColor} />;
      case 'profile':
        return <ProfileIcon size={iconSize} color={iconColor} />;
      default:
        return <HomeIcon size={iconSize} color={iconColor} />;
    }
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      {renderIcon()}
    </View>
  );
}

export default function ClientLayout() {
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasRequested = await hasRequestedPermissions();
      if (!hasRequested) {
        // First launch - show permissions screen
        router.push('/permissions?returnTo=/(client)');
      }
      setIsCheckingPermissions(false);
    };

    checkFirstLaunch();
  }, []);

  // Don't render tabs until we've checked permissions
  // This prevents a flash of the home screen before redirecting
  if (isCheckingPermissions) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PsychiColors.royalBlue,
        tabBarInactiveTintColor: PsychiColors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
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
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ focused }) => <TabIcon name="browse" focused={focused} />,
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
          href: null, // Hide from tab bar - accessed via buttons
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null, // Hide from tab bar - accessed via profile
        }}
      />
      <Tabs.Screen
        name="supporter"
        options={{
          href: null, // Hide from tab bar - accessed via browse
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderTopColor: PsychiColors.borderLight,
    borderTopWidth: 1,
    height: 88,
    paddingTop: 8,
    paddingBottom: 28,
    ...Shadows.soft,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: 4,
  },
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
});
