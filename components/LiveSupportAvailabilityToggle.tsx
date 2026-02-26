/**
 * LiveSupportAvailabilityToggle Component
 * Toggle for supporters to set their availability for live support requests
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { LightningIcon, ClockIcon } from '@/components/icons';
import type { PresenceState } from '@/types/liveSupport';

interface LiveSupportAvailabilityToggleProps {
  presence: PresenceState;
  onToggle: (available: boolean) => Promise<void>;
  disabled?: boolean;
  compact?: boolean;
}

export default function LiveSupportAvailabilityToggle({
  presence,
  onToggle,
  disabled = false,
  compact = false,
}: LiveSupportAvailabilityToggleProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (disabled || isUpdating || presence.inSession) return;

    setIsUpdating(true);
    try {
      await onToggle(!presence.availableForLiveSupport);
    } finally {
      setIsUpdating(false);
    }
  };

  const isAvailable = presence.availableForLiveSupport;
  const isInSession = presence.inSession;

  if (compact) {
    return (
      <TouchableOpacity
        style={[
          styles.compactContainer,
          isAvailable && styles.compactContainerActive,
          (disabled || isInSession) && styles.compactContainerDisabled,
        ]}
        onPress={handleToggle}
        disabled={disabled || isInSession || isUpdating}
        activeOpacity={0.7}
      >
        {isUpdating ? (
          <ActivityIndicator size="small" color={isAvailable ? PsychiColors.white : PsychiColors.azure} />
        ) : (
          <>
            <LightningIcon
              size={16}
              color={isAvailable ? PsychiColors.white : PsychiColors.azure}
              weight={isAvailable ? 'fill' : 'light'}
            />
            <Text style={[styles.compactText, isAvailable && styles.compactTextActive]}>
              {isInSession ? 'In Session' : isAvailable ? 'Live' : 'Go Live'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, isAvailable && styles.iconContainerActive]}>
          <LightningIcon
            size={20}
            color={isAvailable ? PsychiColors.white : PsychiColors.azure}
            weight={isAvailable ? 'fill' : 'light'}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Live Support</Text>
          <Text style={styles.subtitle}>
            {isInSession
              ? 'Currently in a session'
              : isAvailable
              ? 'Accepting live requests'
              : 'Not accepting requests'}
          </Text>
        </View>
        {isUpdating ? (
          <ActivityIndicator size="small" color={PsychiColors.azure} />
        ) : (
          <Switch
            value={isAvailable}
            onValueChange={handleToggle}
            disabled={disabled || isInSession}
            trackColor={{
              false: PsychiColors.frost,
              true: PsychiColors.success,
            }}
            thumbColor={PsychiColors.white}
            ios_backgroundColor={PsychiColors.frost}
          />
        )}
      </View>

      {isAvailable && !isInSession && (
        <View style={styles.statusBanner}>
          <ClockIcon size={14} color={PsychiColors.success} />
          <Text style={styles.statusText}>
            You'll receive notifications for incoming requests
          </Text>
        </View>
      )}

      {isInSession && (
        <View style={styles.inSessionBanner}>
          <Text style={styles.inSessionText}>
            Complete your current session before accepting new requests
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: `${PsychiColors.azure}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  iconContainerActive: {
    backgroundColor: PsychiColors.success,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.successMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    color: PsychiColors.success,
  },
  inSessionBanner: {
    backgroundColor: PsychiColors.warningMuted,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  inSessionText: {
    fontSize: 12,
    color: PsychiColors.warning,
    textAlign: 'center',
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: `${PsychiColors.azure}15`,
    gap: Spacing.xs,
  },
  compactContainerActive: {
    backgroundColor: PsychiColors.success,
  },
  compactContainerDisabled: {
    opacity: 0.5,
  },
  compactText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  compactTextActive: {
    color: PsychiColors.white,
  },
});
