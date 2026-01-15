import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { PsychiColors, Shadows, Typography, BorderRadius } from '@/constants/theme';
import { HomeIcon, ProfileIcon, ChatIcon, DollarIcon } from '@/components/icons';

// Admin tab icons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconColor = focused ? PsychiColors.deep : PsychiColors.textMuted;
  const iconSize = 24;

  const renderIcon = () => {
    switch (name) {
      case 'index':
        return <HomeIcon size={iconSize} color={iconColor} />;
      case 'users':
        return <ProfileIcon size={iconSize} color={iconColor} />;
      case 'sessions':
        return <ChatIcon size={iconSize} color={iconColor} />;
      case 'revenue':
        return <DollarIcon size={iconSize} color={iconColor} />;
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

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: PsychiColors.deep,
        tabBarInactiveTintColor: PsychiColors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon name="index" focused={focused} />,
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
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Revenue',
          tabBarIcon: ({ focused }) => <TabIcon name="revenue" focused={focused} />,
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
    backgroundColor: 'rgba(43, 58, 103, 0.15)',
  },
});
