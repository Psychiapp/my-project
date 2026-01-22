import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  acceptRescheduleRequest,
  declineRescheduleRequest,
  getTimeUntilDeadline,
} from '@/lib/database';
import {
  sendRescheduleAcceptedNotification,
  sendRescheduleDeclinedNotification,
} from '@/lib/notifications';
import type { RescheduleRequestWithDetails } from '@/types/database';
import { RefreshIcon, WarningIcon } from '@/components/icons';

interface RescheduleRequestCardProps {
  request: RescheduleRequestWithDetails;
  onRespond: (requestId: string, accepted: boolean) => void;
}

export default function RescheduleRequestCard({
  request,
  onRespond,
}: RescheduleRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(
    getTimeUntilDeadline(request.response_deadline)
  );

  // Update countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(getTimeUntilDeadline(request.response_deadline));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [request.response_deadline]);

  // Format date/time for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  const original = formatDateTime(request.original_scheduled_at);
  const proposed = formatDateTime(request.proposed_scheduled_at);
  const supporterName = request.supporter?.full_name || 'Your supporter';

  const handleAccept = async () => {
    setIsProcessing(true);

    const result = await acceptRescheduleRequest(request.id);

    if (result.success) {
      // Send notification to supporter
      await sendRescheduleAcceptedNotification({
        sessionId: request.session_id,
        clientName: 'You', // Would come from auth context
        newDate: proposed.dateStr,
        newTime: proposed.timeStr,
      });

      onRespond(request.id, true);

      Alert.alert(
        'Reschedule Accepted',
        `Your session has been rescheduled to ${proposed.dateStr} at ${proposed.timeStr}.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to accept reschedule request.');
    }

    setIsProcessing(false);
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Reschedule',
      `Are you sure you want to decline? The session will remain at ${original.dateStr} at ${original.timeStr}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setIsProcessing(true);

            const result = await declineRescheduleRequest(request.id);

            if (result.success) {
              // Send notification to supporter
              await sendRescheduleDeclinedNotification({
                sessionId: request.session_id,
                clientName: 'You', // Would come from auth context
                originalDate: original.dateStr,
                originalTime: original.timeStr,
              });

              onRespond(request.id, false);

              Alert.alert(
                'Reschedule Declined',
                `Your session remains at ${original.dateStr} at ${original.timeStr}.`,
                [{ text: 'OK' }]
              );
            } else {
              Alert.alert('Error', result.error || 'Failed to decline reschedule request.');
            }

            setIsProcessing(false);
          },
        },
      ]
    );
  };

  const isUrgent = timeRemaining.hours < 1 && !timeRemaining.isExpired;

  if (timeRemaining.isExpired) {
    return null; // Don't render expired requests
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <RefreshIcon size={20} color="#D97706" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Reschedule Request</Text>
          <Text style={styles.supporterName}>from {supporterName}</Text>
        </View>
        <View style={[styles.urgentBadge, isUrgent && styles.urgentBadgeActive]}>
          <Text style={[styles.urgentBadgeText, isUrgent && styles.urgentBadgeTextActive]}>
            {timeRemaining.formatted}
          </Text>
        </View>
      </View>

      <View style={styles.timesContainer}>
        <View style={styles.timeBox}>
          <Text style={styles.timeLabel}>Original Time</Text>
          <Text style={styles.timeDate}>{original.dateStr}</Text>
          <Text style={styles.timeTime}>{original.timeStr}</Text>
        </View>
        <View style={styles.arrowContainer}>
          <Text style={styles.arrow}>→</Text>
        </View>
        <View style={[styles.timeBox, styles.proposedTimeBox]}>
          <Text style={styles.timeLabel}>Proposed Time</Text>
          <Text style={[styles.timeDate, styles.proposedText]}>{proposed.dateStr}</Text>
          <Text style={[styles.timeTime, styles.proposedText]}>{proposed.timeStr}</Text>
        </View>
      </View>

      {request.reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{request.reason}</Text>
        </View>
      )}

      <View style={styles.warningBox}>
        <WarningIcon size={14} color="#92400E" />
        <Text style={styles.warningText}>
          If you don't respond in time, the session will be automatically cancelled and you'll receive a full refund.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
          onPress={handleDecline}
          disabled={isProcessing}
        >
          <Text style={styles.declineButtonText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color={PsychiColors.white} size="small" />
          ) : (
            <Text style={styles.acceptButtonText}>Accept</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#F59E0B',
    ...Shadows.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  supporterName: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  urgentBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  urgentBadgeActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  urgentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
  },
  urgentBadgeTextActive: {
    color: PsychiColors.error,
  },
  timesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timeBox: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  proposedTimeBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: PsychiColors.azure,
  },
  arrowContainer: {
    paddingHorizontal: Spacing.sm,
  },
  arrow: {
    fontSize: 20,
    color: PsychiColors.textMuted,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: PsychiColors.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  timeTime: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
    marginTop: 2,
  },
  proposedText: {
    color: PsychiColors.azure,
  },
  reasonContainer: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.textMuted,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    alignItems: 'flex-start',
  },
  warningIcon: {
    marginRight: Spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  declineButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.cream,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  acceptButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.azure,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
