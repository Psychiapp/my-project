// Notification Types and Templates for Psychi App

export type NotificationType =
  | 'chat_message'
  | 'session_reminder'
  | 'session_starting'
  | 'session_cancelled'
  | 'session_rescheduled'
  | 'new_booking'
  | 'booking_confirmed'
  | 'availability_reminder'
  | 'refund_processed'
  | 'supporter_message'
  | 'system';

export interface NotificationTemplate {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// Notification channel IDs for Android
export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  MESSAGES: 'messages',
  SESSIONS: 'sessions',
  REMINDERS: 'reminders',
  BOOKINGS: 'bookings',
};

// Reminder timing options (in minutes)
export const REMINDER_TIMES = {
  SESSION_15_MIN: 15,
  SESSION_30_MIN: 30,
  SESSION_1_HOUR: 60,
  SESSION_1_DAY: 1440, // 24 hours
  AVAILABILITY_WEEKLY: 'weekly',
};

// Generate notification content based on type
export function getNotificationContent(
  type: NotificationType,
  params: Record<string, string>
): NotificationTemplate {
  switch (type) {
    // Chat notifications
    case 'chat_message':
      return {
        title: `New message from ${params.senderName}`,
        body: params.preview || 'Tap to view message',
        data: {
          type: 'chat_message',
          conversationId: params.conversationId,
          senderId: params.senderId,
        },
      };

    case 'supporter_message':
      return {
        title: `${params.supporterName} sent you a message`,
        body: params.preview || 'Tap to view',
        data: {
          type: 'supporter_message',
          conversationId: params.conversationId,
          supporterId: params.supporterId,
        },
      };

    // Session reminders
    case 'session_reminder':
      return {
        title: 'Session Starting Soon',
        body: `Your ${params.sessionType} session with ${params.otherPartyName} starts in ${params.timeUntil}`,
        data: {
          type: 'session_reminder',
          sessionId: params.sessionId,
          sessionType: params.sessionType,
        },
      };

    case 'session_starting':
      return {
        title: 'Session Starting Now',
        body: `Your ${params.sessionType} session with ${params.otherPartyName} is ready to begin`,
        data: {
          type: 'session_starting',
          sessionId: params.sessionId,
          sessionType: params.sessionType,
        },
      };

    // Cancellation notifications
    case 'session_cancelled':
      return {
        title: 'Session Cancelled',
        body: params.isSupporter
          ? `${params.clientName} has cancelled their ${params.sessionType} session on ${params.date}`
          : `${params.supporterName} has cancelled your ${params.sessionType} session on ${params.date}. A full refund has been processed.`,
        data: {
          type: 'session_cancelled',
          sessionId: params.sessionId,
          refundAmount: params.refundAmount,
        },
      };

    // Reschedule notifications
    case 'session_rescheduled':
      return {
        title: 'Session Rescheduled',
        body: params.isSupporter
          ? `${params.clientName} has rescheduled their session to ${params.newDate} at ${params.newTime}`
          : `${params.supporterName} has rescheduled your session to ${params.newDate} at ${params.newTime}`,
        data: {
          type: 'session_rescheduled',
          sessionId: params.sessionId,
          newDate: params.newDate,
          newTime: params.newTime,
        },
      };

    // New booking notifications (for supporters)
    case 'new_booking':
      return {
        title: 'New Session Booked!',
        body: `${params.clientName} has booked a ${params.sessionType} session for ${params.date} at ${params.time}`,
        data: {
          type: 'new_booking',
          sessionId: params.sessionId,
          clientId: params.clientId,
          sessionType: params.sessionType,
        },
      };

    // Booking confirmed (for clients)
    case 'booking_confirmed':
      return {
        title: 'Booking Confirmed',
        body: `Your ${params.sessionType} session with ${params.supporterName} on ${params.date} at ${params.time} is confirmed`,
        data: {
          type: 'booking_confirmed',
          sessionId: params.sessionId,
          supporterId: params.supporterId,
        },
      };

    // Availability reminder (for supporters)
    case 'availability_reminder':
      return {
        title: 'Set Your Availability',
        body: "Don't forget to update your availability for the upcoming week. Clients are looking to book sessions!",
        data: {
          type: 'availability_reminder',
        },
      };

    // Refund processed
    case 'refund_processed':
      return {
        title: 'Refund Processed',
        body: `Your refund of ${params.amount} has been processed and will appear in your account within 5-10 business days.`,
        data: {
          type: 'refund_processed',
          refundId: params.refundId,
          amount: params.amount,
        },
      };

    // System notifications
    case 'system':
      return {
        title: params.title || 'Psychi',
        body: params.body || '',
        data: {
          type: 'system',
          ...params,
        },
      };

    default:
      return {
        title: 'Psychi',
        body: 'You have a new notification',
        data: { type: 'unknown' },
      };
  }
}

// Format time until session
export function formatTimeUntil(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minutes`;
  } else if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  } else {
    const days = Math.floor(minutes / 1440);
    return days === 1 ? '1 day' : `${days} days`;
  }
}

export default {
  NOTIFICATION_CHANNELS,
  REMINDER_TIMES,
  getNotificationContent,
  formatTimeUntil,
};
