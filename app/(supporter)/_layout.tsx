import { useEffect, useState } from 'react';
import { Tabs, router } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import {
  PsychiColors,
  Shadows,
  Typography,
  BorderRadius,
  Spacing,
} from '@/constants/theme';
import { HomeIcon, CalendarIcon, ChatIcon, DollarIcon, ProfileIcon } from '@/components/icons';
import { hasRequestedPermissions } from '@/lib/permissions';

// Premium tab bar icon with subtle active indicator
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.coral : PsychiColors.textSoft;
  const iconSize = 22;

  const renderIcon = () => {
    switch (name) {
      case 'index':
        return <HomeIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
      case 'availability':
        return <CalendarIcon size={iconSize} color={iconColor} weight={focused ? 'regular' : 'light'} />;
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
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

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

  if (isCheckingPermissions) {
    return null;
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
        name="feedback"
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
