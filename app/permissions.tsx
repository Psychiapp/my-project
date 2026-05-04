/**
 * Permissions Request Screen
 * Informs the user why permissions are needed before the system dialogs appear.
 * Apple guideline: the informational screen must always advance to the system
 * prompt — no "Skip" or "Deny" path. The user can deny in the system dialog.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  PermissionStatus,
  PermissionType,
  getPermissionStatus,
  requestPermission,
  markPermissionsRequested,
  getPermissionDisplayName,
  getPermissionDescription,
} from '@/lib/permissions';
import { CameraIcon, MicIcon, NotificationsIcon, LockIcon } from '@/components/icons';

export default function PermissionsScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; required?: string }>();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
    notifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  const requiredPermissions: PermissionType[] = params.required
    ? (params.required.split(',') as PermissionType[])
    : ['camera', 'microphone', 'notifications'];

  const icons: Record<PermissionType, React.FC<{ size?: number; color?: string }>> = {
    camera: CameraIcon,
    microphone: MicIcon,
    notifications: NotificationsIcon,
  };

  useEffect(() => {
    getPermissionStatus().then((status) => {
      setPermissions(status);
      setIsLoading(false);
    });
  }, []);

  const handleContinue = async () => {
    setIsRequesting(true);

    // Request each permission in sequence — system dialogs appear one at a time.
    // We request regardless of current state; the OS skips its dialog if already granted.
    const updated = { ...permissions };
    for (const type of requiredPermissions) {
      const granted = await requestPermission(type);
      updated[type] = granted;
    }

    setPermissions(updated);
    await markPermissionsRequested();
    setIsRequesting(false);

    if (params.returnTo) {
      router.replace(params.returnTo as any);
    } else {
      router.back();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <LockIcon size={40} color={PsychiColors.azure} />
          </View>
          <Text style={styles.title}>App Permissions</Text>
          <Text style={styles.subtitle}>
            Psychi needs access to the following features on your device to provide video and voice sessions.
          </Text>
        </View>

        {/* Permission list — informational only, no per-item buttons */}
        <View style={styles.permissionsList}>
          {requiredPermissions.map((type, index) => {
            const IconComponent = icons[type];
            const isLast = index === requiredPermissions.length - 1;
            return (
              <View
                key={type}
                style={[styles.permissionItem, isLast && styles.permissionItemLast]}
              >
                <View style={styles.permissionIcon}>
                  <IconComponent size={24} color={PsychiColors.azure} />
                </View>
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionName}>{getPermissionDisplayName(type)}</Text>
                  <Text style={styles.permissionDescription}>{getPermissionDescription(type)}</Text>
                </View>
                {permissions[type] && (
                  <View style={styles.grantedBadge}>
                    <Text style={styles.grantedText}>Granted</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Info note */}
        <Text style={styles.infoNote}>
          You can change these permissions at any time in your device Settings.
        </Text>

        {/* Single Continue button — always shown, always advances to system dialogs */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={isRequesting}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <LinearGradient
            colors={[PsychiColors.royalBlue, PsychiColors.azure]}
            style={styles.continueGradient}
          >
            {isRequesting ? (
              <ActivityIndicator color={PsychiColors.white} />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  permissionsList: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  permissionItemLast: {
    borderBottomWidth: 0,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  permissionInfo: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    lineHeight: 18,
  },
  grantedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  grantedText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  infoNote: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  continueButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  continueGradient: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: PsychiColors.white,
    letterSpacing: 0.3,
  },
});
