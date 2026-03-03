import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { PsychiColors, Shadows, Typography, BorderRadius, Spacing } from '@/constants/theme';
import { HomeIcon, DollarIcon, ProfileIcon, ChatIcon } from '@/components/icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.deep : PsychiColors.textMuted;
  const iconSize = 24;

  switch (name) {
    case 'index':
      return <HomeIcon size={iconSize} color={iconColor} />;
    case 'revenue':
      return <DollarIcon size={iconSize} color={iconColor} />;
    case 'users':
      return <ProfileIcon size={iconSize} color={iconColor} />;
    case 'sessions':
      return <ChatIcon size={iconSize} color={iconColor} />;
    default:
      return <HomeIcon size={iconSize} color={iconColor} />;
  }
}

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: PsychiColors.glassWhiteStrong,
          borderTopColor: PsychiColors.borderLight,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          height: 60 + insets.bottom,
          ...Shadows.soft,
        },
        tabBarActiveTintColor: PsychiColors.deep,
        tabBarInactiveTintColor: PsychiColors.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs - 2,
          fontWeight: '600',
          marginTop: 4,
        },
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
        name="revenue"
        options={{
          title: 'Revenue',
          tabBarIcon: ({ focused }) => <TabIcon name="revenue" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused }) => <TabIcon name="users" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
          tabBarIcon: ({ focused }) => <TabIcon name="sessions" focused={focused} />,
        }}
      />
      {/* Hide nested routes */}
      <Tabs.Screen name="supporter" options={{ href: null }} />
      <Tabs.Screen name="transcript" options={{ href: null }} />
      <Tabs.Screen name="verification" options={{ href: null }} />
    </Tabs>
  );
}
