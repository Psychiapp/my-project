import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PsychiColors, Shadows, Typography, BorderRadius } from '@/constants/theme';
import { HomeIcon, CalendarIcon, ChatIcon, DollarIcon, ProfileIcon } from '@/components/icons';
import { hasRequestedPermissions } from '@/lib/permissions';

// Tab bar icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.coral : PsychiColors.textMuted;
  const iconSize = 24;

  const renderIcon = () => {
    switch (name) {
      case 'index':
        return <HomeIcon size={iconSize} color={iconColor} />;
      case 'availability':
        return <CalendarIcon size={iconSize} color={iconColor} />;
      case 'sessions':
        return <ChatIcon size={iconSize} color={iconColor} />;
      case 'earnings':
        return <DollarIcon size={iconSize} color={iconColor} />;
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

export default function SupporterLayout() {
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasRequested = await hasRequestedPermissions();
      if (!hasRequested) {
        // First launch - show permissions screen
        router.push('/permissions?returnTo=/(supporter)');
      }
      setIsCheckingPermissions(false);
    };

    checkFirstLaunch();
  }, []);

  // Don't render tabs until we've checked permissions
  if (isCheckingPermissions) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PsychiColors.coral,
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
        name="availability"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabIcon name="availability" focused={focused} />,
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
      <Tabs.Screen
        name="training"
        options={{
          href: null, // Hide from tab bar - accessed via buttons
        }}
      />
      <Tabs.Screen
        name="payout-settings"
        options={{
          href: null, // Hide from tab bar - accessed via earnings page
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Hide from tab bar - accessed via profile page
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
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: Typography.fontWeight.semibold,
    marginTop: 4,
  },
  iconContainer: {
    width: 40,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
  },
});
