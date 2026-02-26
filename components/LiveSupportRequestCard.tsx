/**
 * LiveSupportRequestCard Component
 * Displays an incoming live support request for supporters to accept or decline
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  LightningIcon,
  ChatIcon,
  PhoneIcon,
  VideoIcon,
  ClockIcon,
  CheckIcon,
  CloseIcon,
  UserCircleIcon,
} from '@/components/icons';
import type { LiveSupportRequest } from '@/types/liveSupport';
import type { SessionType } from '@/types/database';

interface LiveSupportRequestCardProps {
  request: LiveSupportRequest;
  clientInfo?: {
    fullName: string;
    avatarUrl: string | null;
  };
  onAccept: (requestId: string) => Promise<boolean>;
  onDecline: (requestId: string, reason?: string) => Promise<boolean>;
}

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  chat: 'Chat Session',
  phone: 'Phone Call',
  video: 'Video Call',
};

const SESSION_TYPE_ICONS: Record<SessionType, React.FC<any>> = {
  chat: ChatIcon,
  phone: PhoneIcon,
  video: VideoIcon,
};

const SESSION_TYPE_COLORS: Record<SessionType, string> = {
  chat: PsychiColors.chatAccent,
  phone: PsychiColors.phoneAccent,
  video: PsychiColors.videoAccent,
};

export default function LiveSupportRequestCard({
  request,
  clientInfo,
  onAccept,
  onDecline,
}: LiveSupportRequestCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Calculate remaining time
  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((request.expiresAt.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [request.expiresAt]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      const success = await onAccept(request.id);
      if (!success) {
        Alert.alert('Error', 'Failed to accept request. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Request',
      'Are you sure you want to decline this request? It will be routed to another supporter.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setIsDeclining(true);
            try {
              const success = await onDecline(request.id);
              if (!success) {
                Alert.alert('Error', 'Failed to decline request. Please try again.');
              }
            } catch (error) {
              Alert.alert('Error', 'An error occurred. Please try again.');
            } finally {
              setIsDeclining(false);
            }
          },
        },
      ]
    );
  };

  const TypeIcon = SESSION_TYPE_ICONS[request.sessionType];
  const typeColor = SESSION_TYPE_COLORS[request.sessionType];
  const isUrgent = countdown < 120; // Less than 2 minutes
  const isProcessing = isAccepting || isDeclining;

  if (countdown === 0) {
    return null; // Request has expired
  }

  return (
    <View style={[styles.container, isUrgent && styles.containerUrgent]}>
      {/* Header with lightning icon */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.lightningBadge}>
            <LightningIcon size={16} color={PsychiColors.white} weight="fill" />
          </View>
          <Text style={styles.headerTitle}>Live Support Request</Text>
        </View>
        <View style={[styles.countdownBadge, isUrgent && styles.countdownBadgeUrgent]}>
          <ClockIcon size={12} color={isUrgent ? PsychiColors.error : PsychiColors.textMuted} />
          <Text style={[styles.countdownText, isUrgent && styles.countdownTextUrgent]}>
            {formatTime(countdown)}
          </Text>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.clientInfo}>
        {clientInfo?.avatarUrl ? (
          <Image source={{ uri: clientInfo.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <UserCircleIcon size={24} color={PsychiColors.textMuted} />
          </View>
        )}
        <View style={styles.clientDetails}>
          <Text style={styles.clientName}>{clientInfo?.fullName || 'A client'}</Text>
          <Text style={styles.requestMessage}>is requesting support</Text>
        </View>
      </View>

      {/* Session Type */}
      <View style={[styles.sessionTypeCard, { borderColor: `${typeColor}40` }]}>
        <View style={[styles.sessionTypeIcon, { backgroundColor: `${typeColor}20` }]}>
          <TypeIcon size={20} color={typeColor} />
        </View>
        <Text style={[styles.sessionTypeLabel, { color: typeColor }]}>
          {SESSION_TYPE_LABELS[request.sessionType]}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.declineButton, isProcessing && styles.buttonDisabled]}
          onPress={handleDecline}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isDeclining ? (
            <ActivityIndicator size="small" color={PsychiColors.textSecondary} />
          ) : (
            <>
              <CloseIcon size={18} color={PsychiColors.textSecondary} />
              <Text style={styles.declineButtonText}>Decline</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptButton, isProcessing && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={isProcessing}
          activeOpacity={0.7}
        >
          {isAccepting ? (
            <ActivityIndicator size="small" color={PsychiColors.white} />
          ) : (
            <>
              <CheckIcon size={18} color={PsychiColors.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: PsychiColors.success,
    ...Shadows.elevated,
  },
  containerUrgent: {
    borderColor: PsychiColors.warning,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lightningBadge: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
  },
  countdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.frost,
    gap: 4,
  },
  countdownBadgeUrgent: {
    backgroundColor: PsychiColors.errorMuted,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  countdownTextUrgent: {
    color: PsychiColors.error,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.md,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  clientDetails: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  requestMessage: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  sessionTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  sessionTypeIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  sessionTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.frost,
    gap: Spacing.xs,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  acceptButton: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.success,
    gap: Spacing.xs,
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
