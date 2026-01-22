import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { PsychiColors, Shadows, Typography, BorderRadius, Spacing } from '@/constants/theme';
import { HomeIcon, ProfileIcon, ChatIcon, DollarIcon, LogoutIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

// Custom Tab Bar with Logout Button
function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { signOut } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
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

  // Filter out hidden routes (supporter, transcript)
  const visibleRoutes = state.routes.filter(
    route => !['supporter', 'transcript'].includes(route.name)
  );

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 8 }]}>
      {visibleRoutes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;
        const isFocused = state.index === state.routes.indexOf(route);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabButton}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <TabIcon name={route.name} focused={isFocused} />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Logout Button */}
      <TouchableOpacity
        style={styles.tabButton}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <LogoutIcon size={24} color={PsychiColors.error} />
        </View>
        <Text style={[styles.tabLabel, { color: PsychiColors.error }]}>
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AdminLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          title: 'Sessions',
        }}
      />
      <Tabs.Screen
        name="revenue"
        options={{
          title: 'Revenue',
        }}
      />
      {/* Hide nested route folders from tab bar */}
      <Tabs.Screen
        name="supporter"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transcript"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderTopColor: PsychiColors.borderLight,
    borderTopWidth: 1,
    paddingTop: 8,
    ...Shadows.soft,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  tabLabel: {
    fontSize: Typography.fontSize.xs - 2,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 4,
    color: PsychiColors.textMuted,
  },
  tabLabelFocused: {
    color: PsychiColors.deep,
    fontWeight: Typography.fontWeight.semibold,
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
