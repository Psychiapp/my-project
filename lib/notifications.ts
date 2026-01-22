import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationType,
  getNotificationContent,
  formatTimeUntil,
  NOTIFICATION_CHANNELS,
  REMINDER_TIMES,
} from '@/constants/notifications';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationSettings {
  sessionReminders: boolean;
  newMessages: boolean;
  supporterUpdates: boolean;
  promotions: boolean;
  // Supporter-specific
  newBookings: boolean;
  availabilityReminders: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  sessionReminders: true,
  newMessages: true,
  supporterUpdates: true,
  promotions: false,
  newBookings: true,
  availabilityReminders: true,
};

const STORAGE_KEYS = {
  PUSH_TOKEN: '@psychi:push_token',
  NOTIFICATION_SETTINGS: '@psychi:notification_settings',
  SCHEDULED_REMINDERS: '@psychi:scheduled_reminders',
};

// ============================================
// Core Registration & Permissions
// ============================================

/**
 * Register for push notifications and get the token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Check if it's a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  // Get the token
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId,
    });
    token = tokenData.data;

    // Store token locally
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Android-specific channel configuration
  if (Platform.OS === 'android') {
    await setupAndroidChannels();
  }

  return token;
}

/**
 * Set up Android notification channels
 */
async function setupAndroidChannels() {
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DEFAULT, {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4A90E2',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.MESSAGES, {
    name: 'Messages',
    description: 'New message notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4A90E2',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.SESSIONS, {
    name: 'Session Reminders',
    description: 'Reminders for upcoming sessions',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4A90E2',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.BOOKINGS, {
    name: 'Bookings',
    description: 'New booking notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4A90E2',
  });

  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.REMINDERS, {
    name: 'Reminders',
    description: 'Weekly reminders and alerts',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#4A90E2',
  });
}

// ============================================
// Settings Management
// ============================================

/**
 * Get notification settings
 */
export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATION_SETTINGS);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error getting notification settings:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<void> {
  try {
    const current = await getNotificationSettings();
    const updated = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATION_SETTINGS, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating notification settings:', error);
  }
}

// ============================================
// Chat Message Notifications
// ============================================

/**
 * Send notification for new chat message
 */
export async function sendChatMessageNotification(params: {
  senderName: string;
  senderId: string;
  conversationId: string;
  messagePreview: string;
  isFromSupporter?: boolean;
}): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.newMessages) return;

  const type: NotificationType = params.isFromSupporter ? 'supporter_message' : 'chat_message';
  const content = getNotificationContent(type, {
    senderName: params.senderName,
    supporterName: params.senderName,
    preview: params.messagePreview,
    conversationId: params.conversationId,
    senderId: params.senderId,
    supporterId: params.senderId,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
      categoryIdentifier: NOTIFICATION_CHANNELS.MESSAGES,
    },
    trigger: null, // Immediately
  });
}

// ============================================
// Session Reminder Notifications
// ============================================

/**
 * Schedule session reminder notification
 */
export async function scheduleSessionReminder(params: {
  sessionId: string;
  otherPartyName: string;
  sessionType: 'chat' | 'phone' | 'video';
  scheduledTime: Date;
  reminderMinutes?: number;
}): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.sessionReminders) return null;

  const { sessionId, otherPartyName, sessionType, scheduledTime, reminderMinutes = 15 } = params;
  const reminderTime = new Date(scheduledTime.getTime() - reminderMinutes * 60 * 1000);

  // Don't schedule if reminder time has passed
  if (reminderTime <= new Date()) {
    return null;
  }

  const content = getNotificationContent('session_reminder', {
    sessionId,
    otherPartyName,
    sessionType,
    timeUntil: formatTimeUntil(reminderMinutes),
  });

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
      categoryIdentifier: NOTIFICATION_CHANNELS.SESSIONS,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderTime,
      channelId: NOTIFICATION_CHANNELS.SESSIONS,
    },
  });

  // Store scheduled reminder for tracking
  await storeScheduledReminder(sessionId, notificationId);

  return notificationId;
}

/**
 * Schedule multiple reminders for a session (15 min, 1 hour, 1 day)
 */
export async function scheduleAllSessionReminders(params: {
  sessionId: string;
  otherPartyName: string;
  sessionType: 'chat' | 'phone' | 'video';
  scheduledTime: Date;
}): Promise<string[]> {
  const notificationIds: string[] = [];
  const reminderTimes = [
    REMINDER_TIMES.SESSION_15_MIN,
    REMINDER_TIMES.SESSION_1_HOUR,
    REMINDER_TIMES.SESSION_1_DAY,
  ];

  for (const minutes of reminderTimes) {
    const id = await scheduleSessionReminder({
      ...params,
      reminderMinutes: minutes,
    });
    if (id) notificationIds.push(id);
  }

  return notificationIds;
}

/**
 * Send session starting now notification
 */
export async function sendSessionStartingNotification(params: {
  sessionId: string;
  otherPartyName: string;
  sessionType: 'chat' | 'phone' | 'video';
}): Promise<void> {
  const content = getNotificationContent('session_starting', {
    sessionId: params.sessionId,
    otherPartyName: params.otherPartyName,
    sessionType: params.sessionType,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

// ============================================
// Cancellation & Reschedule Notifications
// ============================================

/**
 * Send session cancelled notification
 */
export async function sendSessionCancelledNotification(params: {
  sessionId: string;
  sessionType: 'chat' | 'phone' | 'video';
  date: string;
  otherPartyName: string;
  isSupporter: boolean;
  refundAmount?: string;
}): Promise<void> {
  const content = getNotificationContent('session_cancelled', {
    sessionId: params.sessionId,
    sessionType: params.sessionType,
    date: params.date,
    clientName: params.isSupporter ? params.otherPartyName : '',
    supporterName: params.isSupporter ? '' : params.otherPartyName,
    isSupporter: params.isSupporter ? 'true' : 'false',
    refundAmount: params.refundAmount || '0',
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
    },
    trigger: null,
  });

  // Cancel any scheduled reminders for this session
  await cancelSessionReminders(params.sessionId);
}

/**
 * Send session rescheduled notification
 */
export async function sendSessionRescheduledNotification(params: {
  sessionId: string;
  otherPartyName: string;
  isSupporter: boolean;
  newDate: string;
  newTime: string;
}): Promise<void> {
  const content = getNotificationContent('session_rescheduled', {
    sessionId: params.sessionId,
    clientName: params.isSupporter ? params.otherPartyName : '',
    supporterName: params.isSupporter ? '' : params.otherPartyName,
    isSupporter: params.isSupporter ? 'true' : 'false',
    newDate: params.newDate,
    newTime: params.newTime,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send reschedule request notification to client
 */
export async function sendRescheduleRequestNotification(params: {
  sessionId: string;
  supporterName: string;
  proposedDate: string;
  proposedTime: string;
  responseDeadline: string;
}): Promise<void> {
  // Format the deadline for display
  const deadline = new Date(params.responseDeadline);
  const deadlineStr = deadline.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reschedule Request',
      body: `${params.supporterName} wants to reschedule your session to ${params.proposedDate} at ${params.proposedTime}. Please respond by ${deadlineStr} or the session will be cancelled.`,
      data: {
        type: 'reschedule_request',
        sessionId: params.sessionId,
        action: 'view_reschedule_request',
      },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null,
  });
}

/**
 * Send notification when reschedule request is accepted
 */
export async function sendRescheduleAcceptedNotification(params: {
  sessionId: string;
  clientName: string;
  newDate: string;
  newTime: string;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reschedule Confirmed',
      body: `${params.clientName} accepted your reschedule request. Your session is now on ${params.newDate} at ${params.newTime}.`,
      data: {
        type: 'reschedule_accepted',
        sessionId: params.sessionId,
      },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send notification when reschedule request is declined
 */
export async function sendRescheduleDeclinedNotification(params: {
  sessionId: string;
  clientName: string;
  originalDate: string;
  originalTime: string;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Reschedule Declined',
      body: `${params.clientName} declined your reschedule request. The session remains at ${params.originalDate} at ${params.originalTime}.`,
      data: {
        type: 'reschedule_declined',
        sessionId: params.sessionId,
      },
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Send notification when session is auto-cancelled due to expired reschedule request
 */
export async function sendAutoCancelledNotification(params: {
  sessionId: string;
  recipientType: 'client' | 'supporter';
  refundAmount?: string;
}): Promise<void> {
  const isClient = params.recipientType === 'client';
  const body = isClient
    ? `Your session has been automatically cancelled because you didn't respond to the reschedule request in time.${params.refundAmount ? ` A refund of ${params.refundAmount} has been processed.` : ''}`
    : `Your session has been automatically cancelled because the client didn't respond to your reschedule request in time.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Session Auto-Cancelled',
      body,
      data: {
        type: 'session_auto_cancelled',
        sessionId: params.sessionId,
      },
      sound: true,
    },
    trigger: null,
  });
}

// ============================================
// Booking Notifications (for Supporters)
// ============================================

/**
 * Send new booking notification to supporter
 */
export async function sendNewBookingNotification(params: {
  sessionId: string;
  clientId: string;
  clientName: string;
  sessionType: 'chat' | 'phone' | 'video';
  date: string;
  time: string;
}): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.newBookings) return;

  const content = getNotificationContent('new_booking', {
    sessionId: params.sessionId,
    clientId: params.clientId,
    clientName: params.clientName,
    sessionType: params.sessionType,
    date: params.date,
    time: params.time,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
      categoryIdentifier: NOTIFICATION_CHANNELS.BOOKINGS,
    },
    trigger: null,
  });
}

/**
 * Send booking confirmed notification to client
 */
export async function sendBookingConfirmedNotification(params: {
  sessionId: string;
  supporterId: string;
  supporterName: string;
  sessionType: 'chat' | 'phone' | 'video';
  date: string;
  time: string;
}): Promise<void> {
  const content = getNotificationContent('booking_confirmed', {
    sessionId: params.sessionId,
    supporterId: params.supporterId,
    supporterName: params.supporterName,
    sessionType: params.sessionType,
    date: params.date,
    time: params.time,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
    },
    trigger: null,
  });
}

// ============================================
// Availability Reminder (for Supporters)
// ============================================

/**
 * Schedule weekly availability reminder for supporters
 * Triggers every Sunday at 6 PM local time
 */
export async function scheduleWeeklyAvailabilityReminder(): Promise<string | null> {
  const settings = await getNotificationSettings();
  if (!settings.availabilityReminders) return null;

  // Cancel existing reminder first
  await cancelWeeklyAvailabilityReminder();

  const content = getNotificationContent('availability_reminder', {});

  // Schedule for next Sunday at 6 PM
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
      categoryIdentifier: NOTIFICATION_CHANNELS.REMINDERS,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // Sunday (1-7, Sunday = 1)
      hour: 18,
      minute: 0,
    },
  });

  // Store the ID for cancellation later
  await AsyncStorage.setItem('@psychi:availability_reminder_id', notificationId);

  return notificationId;
}

/**
 * Cancel weekly availability reminder
 */
export async function cancelWeeklyAvailabilityReminder(): Promise<void> {
  try {
    const existingId = await AsyncStorage.getItem('@psychi:availability_reminder_id');
    if (existingId) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      await AsyncStorage.removeItem('@psychi:availability_reminder_id');
    }
  } catch (error) {
    console.error('Error canceling availability reminder:', error);
  }
}

/**
 * Send immediate availability reminder (for testing or manual trigger)
 */
export async function sendAvailabilityReminderNow(): Promise<void> {
  const content = getNotificationContent('availability_reminder', {});

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
    },
    trigger: null,
  });
}

// ============================================
// Refund Notifications
// ============================================

/**
 * Send refund processed notification
 */
export async function sendRefundNotification(params: {
  refundId: string;
  amount: string;
}): Promise<void> {
  const content = getNotificationContent('refund_processed', {
    refundId: params.refundId,
    amount: params.amount,
  });

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
    },
    trigger: null,
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Store scheduled reminder for tracking
 */
async function storeScheduledReminder(sessionId: string, notificationId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_REMINDERS);
    const reminders = stored ? JSON.parse(stored) : {};

    if (!reminders[sessionId]) {
      reminders[sessionId] = [];
    }
    reminders[sessionId].push(notificationId);

    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_REMINDERS, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error storing scheduled reminder:', error);
  }
}

/**
 * Cancel all reminders for a session
 */
export async function cancelSessionReminders(sessionId: string): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULED_REMINDERS);
    if (!stored) return;

    const reminders = JSON.parse(stored);
    const sessionReminders = reminders[sessionId] || [];

    for (const notificationId of sessionReminders) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }

    delete reminders[sessionId];
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULED_REMINDERS, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error canceling session reminders:', error);
  }
}

/**
 * Cancel a specific scheduled notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem(STORAGE_KEYS.SCHEDULED_REMINDERS);
}

/**
 * Get all pending notifications
 */
export async function getPendingNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

/**
 * Send a local notification immediately
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null,
  });
}

/**
 * Clear badge count
 */
export async function clearBadgeCount(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export default {
  registerForPushNotifications,
  getNotificationSettings,
  updateNotificationSettings,
  sendChatMessageNotification,
  scheduleSessionReminder,
  scheduleAllSessionReminders,
  sendSessionStartingNotification,
  sendSessionCancelledNotification,
  sendSessionRescheduledNotification,
  sendRescheduleRequestNotification,
  sendRescheduleAcceptedNotification,
  sendRescheduleDeclinedNotification,
  sendAutoCancelledNotification,
  sendNewBookingNotification,
  sendBookingConfirmedNotification,
  scheduleWeeklyAvailabilityReminder,
  cancelWeeklyAvailabilityReminder,
  sendAvailabilityReminderNow,
  sendRefundNotification,
  cancelSessionReminders,
  cancelNotification,
  cancelAllNotifications,
  getPendingNotifications,
  sendLocalNotification,
  clearBadgeCount,
  setBadgeCount,
  addNotificationResponseListener,
  addNotificationReceivedListener,
  DEFAULT_SETTINGS,
};
