import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
  registerForPushNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  scheduleWeeklyAvailabilityReminder,
  cancelWeeklyAvailabilityReminder,
  type NotificationSettings,
} from '@/lib/notifications';

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const isSupporter = profile?.role === 'supporter';

  const [pushEnabled, setPushEnabled] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    sessionReminders: true,
    newMessages: true,
    supporterUpdates: true,
    promotions: false,
    newBookings: true,
    availabilityReminders: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = await registerForPushNotifications();
      setPushEnabled(!!token);

      const storedSettings = await getNotificationSettings();
      setSettings(storedSettings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePush = async () => {
    if (!pushEnabled) {
      const token = await registerForPushNotifications();
      if (token) {
        setPushEnabled(true);
        Alert.alert('Notifications Enabled', 'You will now receive push notifications.');

        // If supporter, set up availability reminder
        if (isSupporter) {
          await scheduleWeeklyAvailabilityReminder();
        }
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive updates.',
          [{ text: 'OK' }]
        );
      }
    } else {
      Alert.alert(
        'Disable Notifications',
        'To disable push notifications, please go to your device settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSettingChange = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    setSettings(newSettings);
    await updateNotificationSettings({ [key]: newValue });

    // Handle availability reminder toggle for supporters
    if (key === 'availabilityReminders' && isSupporter) {
      if (newValue) {
        await scheduleWeeklyAvailabilityReminder();
      } else {
        await cancelWeeklyAvailabilityReminder();
      }
    }
  };

  // Common notification types for all users
  const commonNotifications = [
    {
      key: 'sessionReminders' as const,
      title: 'Session Reminders',
      description: 'Get notified 15 min, 1 hour, and 1 day before sessions',
      icon: '📅',
    },
    {
      key: 'newMessages' as const,
      title: 'New Messages',
      description: 'Notifications when you receive new chat messages',
      icon: '💬',
    },
  ];

  // Client-specific notifications
  const clientNotifications = [
    {
      key: 'supporterUpdates' as const,
      title: 'Supporter Updates',
      description: 'Updates about cancellations and reschedules',
      icon: '🔔',
    },
    {
      key: 'promotions' as const,
      title: 'Promotions & Tips',
      description: 'Special offers and wellness tips',
      icon: '🎁',
    },
  ];

  // Supporter-specific notifications
  const supporterNotifications = [
    {
      key: 'newBookings' as const,
      title: 'New Bookings',
      description: 'Get notified when clients book sessions with you',
      icon: '📆',
    },
    {
      key: 'availabilityReminders' as const,
      title: 'Weekly Availability Reminder',
      description: 'Sunday reminder to set your hours for the week',
      icon: '⏰',
    },
  ];

  const notificationTypes = isSupporter
    ? [...commonNotifications, ...supporterNotifications]
    : [...commonNotifications, ...clientNotifications];

  const reminderOptions = [
    { label: '15 minutes before', value: 15, selected: true },
    { label: '1 hour before', value: 60, selected: true },
    { label: '1 day before', value: 1440, selected: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Push Notifications Toggle */}
        <View style={styles.section}>
          <View style={styles.mainToggleCard}>
            <View style={styles.mainToggleInfo}>
              <Text style={styles.mainToggleTitle}>Push Notifications</Text>
              <Text style={styles.mainToggleDescription}>
                {pushEnabled
                  ? 'You will receive notifications'
                  : 'Enable to receive important updates'}
              </Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: '#E5E7EB', true: 'rgba(74, 144, 226, 0.4)' }}
              thumbColor={pushEnabled ? PsychiColors.azure : '#F3F4F6'}
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>

        {/* Notification Types */}
        {pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            <View style={styles.settingsCard}>
              {notificationTypes.map((item, index) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingRow,
                    index < notificationTypes.length - 1 && styles.settingRowBorder,
                  ]}
                >
                  <View style={styles.settingIcon}>
                    <Text style={styles.settingIconText}>{item.icon}</Text>
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingDescription}>{item.description}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => handleSettingChange(item.key)}
                    trackColor={{ false: '#E5E7EB', true: 'rgba(74, 144, 226, 0.4)' }}
                    thumbColor={settings[item.key] ? PsychiColors.azure : '#F3F4F6'}
                    ios_backgroundColor="#E5E7EB"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Session Reminder Timing */}
        {pushEnabled && settings.sessionReminders && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session Reminder Timing</Text>
            <Text style={styles.sectionSubtitle}>
              You'll receive reminders at these times before sessions
            </Text>
            <View style={styles.settingsCard}>
              {reminderOptions.map((option, index) => (
                <View
                  key={option.value}
                  style={[
                    styles.checkRow,
                    index < reminderOptions.length - 1 && styles.settingRowBorder,
                  ]}
                >
                  <Text style={styles.checkLabel}>{option.label}</Text>
                  <View style={styles.checkCircle}>
                    <Text style={styles.checkIcon}>✓</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Supporter-specific: Availability Reminder Info */}
        {pushEnabled && isSupporter && settings.availabilityReminders && (
          <View style={styles.section}>
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>⏰</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Weekly Reminder</Text>
                <Text style={styles.infoText}>
                  You'll receive a reminder every Sunday at 6:00 PM to set your availability
                  for the upcoming week. This helps ensure clients can find and book time
                  with you!
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Info Section */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>ℹ️</Text>
            <Text style={styles.infoText}>
              You can change notification permissions at any time in your device settings.
            </Text>
          </View>
        </View>

        {/* Notification Summary */}
        {pushEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You'll be notified about:</Text>
            <View style={styles.summaryCard}>
              {settings.sessionReminders && (
                <Text style={styles.summaryItem}>• Upcoming session reminders</Text>
              )}
              {settings.newMessages && (
                <Text style={styles.summaryItem}>• New chat messages</Text>
              )}
              {!isSupporter && settings.supporterUpdates && (
                <Text style={styles.summaryItem}>• Session cancellations & changes</Text>
              )}
              {isSupporter && settings.newBookings && (
                <Text style={styles.summaryItem}>• New session bookings</Text>
              )}
              {isSupporter && settings.availabilityReminders && (
                <Text style={styles.summaryItem}>• Weekly availability reminders</Text>
              )}
              <Text style={styles.summaryItem}>• Refund confirmations</Text>
            </View>
          </View>
        )}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: PsychiColors.textSecondary,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  mainToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  mainToggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  mainToggleTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  mainToggleDescription: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  settingsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingIconText: {
    fontSize: 20,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  settingDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  checkLabel: {
    fontSize: 15,
    color: '#2A2A2A',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: PsychiColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  summaryItem: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 24,
  },
});
