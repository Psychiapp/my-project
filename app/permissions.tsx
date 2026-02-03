/**
 * Permissions Request Screen
 * Asks user to enable camera, microphone, and notification permissions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  PermissionStatus,
  PermissionType,
  getPermissionStatus,
  requestPermission,
  markPermissionsRequested,
  openSettings,
  getPermissionDisplayName,
  getPermissionDescription,
} from '@/lib/permissions';
import { CameraIcon, MicIcon, NotificationsIcon, LockIcon, InfoIcon } from '@/components/icons';

interface PermissionItemProps {
  type: PermissionType;
  granted: boolean;
  onRequest: () => void;
  isLoading: boolean;
}

function PermissionItem({ type, granted, onRequest, isLoading }: PermissionItemProps) {
  const icons: Record<PermissionType, React.FC<{ size?: number; color?: string }>> = {
    camera: CameraIcon,
    microphone: MicIcon,
    notifications: NotificationsIcon,
  };

  const IconComponent = icons[type];

  return (
    <View style={styles.permissionItem}>
      <View style={styles.permissionIcon}>
        <IconComponent size={24} color={PsychiColors.azure} />
      </View>
      <View style={styles.permissionInfo}>
        <Text style={styles.permissionName}>{getPermissionDisplayName(type)}</Text>
        <Text style={styles.permissionDescription}>{getPermissionDescription(type)}</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={PsychiColors.azure} />
      ) : granted ? (
        <View style={styles.grantedBadge}>
          <Text style={styles.grantedText}>Enabled</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.enableButton} onPress={onRequest}>
          <Text style={styles.enableButtonText}>Enable</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function PermissionsScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; required?: string }>();
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: false,
    microphone: false,
    notifications: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingPermission, setLoadingPermission] = useState<PermissionType | null>(null);

  // Parse required permissions from params
  const requiredPermissions: PermissionType[] = params.required
    ? (params.required.split(',') as PermissionType[])
    : ['camera', 'microphone', 'notifications'];

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setIsLoading(true);
    const status = await getPermissionStatus();
    setPermissions(status);
    setIsLoading(false);
  };

  const handleRequestPermission = async (type: PermissionType) => {
    setLoadingPermission(type);
    const granted = await requestPermission(type);
    setPermissions((prev) => ({ ...prev, [type]: granted }));
    setLoadingPermission(null);

    // If permission was denied, it may have been permanently denied
    // The user will need to go to settings
    if (!granted) {
      // Permission was denied - the alert will be shown by the OS
    }
  };

  const handleRequestAll = async () => {
    setIsLoading(true);
    for (const type of requiredPermissions) {
      if (!permissions[type]) {
        await handleRequestPermission(type);
      }
    }
    setIsLoading(false);
  };

  const handleContinue = async () => {
    await markPermissionsRequested();

    if (params.returnTo) {
      router.replace(params.returnTo as any);
    } else {
      router.back();
    }
  };

  const handleOpenSettings = () => {
    openSettings();
  };

  const allRequiredGranted = requiredPermissions.every((type) => permissions[type]);
  const someGranted = requiredPermissions.some((type) => permissions[type]);

  if (isLoading && !someGranted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Checking permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <LockIcon size={40} color={PsychiColors.azure} />
          </View>
          <Text style={styles.title}>Enable Permissions</Text>
          <Text style={styles.subtitle}>
            To provide the best experience, Psychi needs access to the following features on your
            device.
          </Text>
        </View>

        {/* Permission Items */}
        <View style={styles.permissionsList}>
          {requiredPermissions.map((type) => (
            <PermissionItem
              key={type}
              type={type}
              granted={permissions[type]}
              onRequest={() => handleRequestPermission(type)}
              isLoading={loadingPermission === type}
            />
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <InfoIcon size={16} color={PsychiColors.azure} />
          <Text style={styles.infoText}>
            You can change these permissions anytime in your device settings. Your privacy is
            important to us.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!allRequiredGranted && (
            <TouchableOpacity style={styles.settingsButton} onPress={handleOpenSettings}>
              <Text style={styles.settingsButtonText}>Open Settings</Text>
            </TouchableOpacity>
          )}

          {!allRequiredGranted && !someGranted && (
            <TouchableOpacity
              style={styles.enableAllButton}
              onPress={handleRequestAll}
              activeOpacity={0.8}
            >
              <Text style={styles.enableAllButtonText}>Enable All</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.continueButton,
              allRequiredGranted && styles.continueButtonPrimary,
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={allRequiredGranted ? styles.continueButtonTextPrimary : styles.continueButtonText}>
              {allRequiredGranted ? 'Continue' : 'Skip for Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: PsychiColors.textMuted,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
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
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
  enableButton: {
    backgroundColor: PsychiColors.azure,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  enableButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoIconContainer: {
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    marginTop: 'auto',
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  settingsButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.white,
    alignItems: 'center',
    ...Shadows.soft,
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  enableAllButton: {
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  enableAllButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  continueButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  continueButtonPrimary: {
    backgroundColor: PsychiColors.royalBlue,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  continueButtonTextPrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
