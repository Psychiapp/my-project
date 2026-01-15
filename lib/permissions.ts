/**
 * Device Permissions Utility
 * Handles requesting and checking camera, microphone, and notification permissions
 */

import { Platform, Linking, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PermissionType = 'camera' | 'microphone' | 'notifications';

export interface PermissionStatus {
  camera: boolean;
  microphone: boolean;
  notifications: boolean;
}

const PERMISSIONS_REQUESTED_KEY = '@psychi:permissions_requested';

/**
 * Check if all permissions have been requested before
 */
export async function hasRequestedPermissions(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(PERMISSIONS_REQUESTED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark permissions as requested
 */
export async function markPermissionsRequested(): Promise<void> {
  try {
    await AsyncStorage.setItem(PERMISSIONS_REQUESTED_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark permissions as requested:', error);
  }
}

/**
 * Get current status of all permissions
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  const [cameraStatus, microphoneStatus, notificationStatus] = await Promise.all([
    getCameraPermissionStatus(),
    getMicrophonePermissionStatus(),
    getNotificationPermissionStatus(),
  ]);

  return {
    camera: cameraStatus,
    microphone: microphoneStatus,
    notifications: notificationStatus,
  };
}

/**
 * Check camera permission status
 */
export async function getCameraPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Camera.getCameraPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check microphone permission status
 */
export async function getMicrophonePermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Audio.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Check notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/**
 * Request camera permission
 */
export async function requestCameraPermission(): Promise<boolean> {
  try {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request camera permission:', error);
    return false;
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request microphone permission:', error);
    return false;
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    if (existingStatus === 'granted') {
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
}

/**
 * Request all permissions at once
 */
export async function requestAllPermissions(): Promise<PermissionStatus> {
  const [camera, microphone, notifications] = await Promise.all([
    requestCameraPermission(),
    requestMicrophonePermission(),
    requestNotificationPermission(),
  ]);

  await markPermissionsRequested();

  return { camera, microphone, notifications };
}

/**
 * Request a specific permission
 */
export async function requestPermission(type: PermissionType): Promise<boolean> {
  switch (type) {
    case 'camera':
      return requestCameraPermission();
    case 'microphone':
      return requestMicrophonePermission();
    case 'notifications':
      return requestNotificationPermission();
    default:
      return false;
  }
}

/**
 * Open device settings to allow user to enable permissions manually
 */
export function openSettings(): void {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else {
    Linking.openSettings();
  }
}

/**
 * Show alert to guide user to settings if permission was denied
 */
export function showPermissionDeniedAlert(
  permissionName: string,
  onOpenSettings?: () => void
): void {
  Alert.alert(
    `${permissionName} Permission Required`,
    `To use this feature, please enable ${permissionName.toLowerCase()} access in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          openSettings();
          onOpenSettings?.();
        },
      },
    ]
  );
}

/**
 * Check if permission is needed for a specific session type
 */
export function getRequiredPermissions(sessionType: 'chat' | 'phone' | 'video'): PermissionType[] {
  switch (sessionType) {
    case 'video':
      return ['camera', 'microphone'];
    case 'phone':
      return ['microphone'];
    case 'chat':
      return [];
    default:
      return [];
  }
}

/**
 * Check and request permissions needed for a session type
 * Returns true if all required permissions are granted
 */
export async function ensureSessionPermissions(
  sessionType: 'chat' | 'phone' | 'video'
): Promise<{ granted: boolean; missing: PermissionType[] }> {
  const required = getRequiredPermissions(sessionType);

  if (required.length === 0) {
    return { granted: true, missing: [] };
  }

  const missing: PermissionType[] = [];

  for (const permission of required) {
    const granted = await requestPermission(permission);
    if (!granted) {
      missing.push(permission);
    }
  }

  return {
    granted: missing.length === 0,
    missing,
  };
}

/**
 * Get user-friendly name for permission type
 */
export function getPermissionDisplayName(type: PermissionType): string {
  switch (type) {
    case 'camera':
      return 'Camera';
    case 'microphone':
      return 'Microphone';
    case 'notifications':
      return 'Notifications';
    default:
      return type;
  }
}

/**
 * Get description for why permission is needed
 */
export function getPermissionDescription(type: PermissionType): string {
  switch (type) {
    case 'camera':
      return 'Required for video calls with your supporter';
    case 'microphone':
      return 'Required for voice and video calls';
    case 'notifications':
      return 'Stay updated with session reminders and messages';
    default:
      return '';
  }
}

export default {
  hasRequestedPermissions,
  markPermissionsRequested,
  getPermissionStatus,
  getCameraPermissionStatus,
  getMicrophonePermissionStatus,
  getNotificationPermissionStatus,
  requestCameraPermission,
  requestMicrophonePermission,
  requestNotificationPermission,
  requestAllPermissions,
  requestPermission,
  openSettings,
  showPermissionDeniedAlert,
  getRequiredPermissions,
  ensureSessionPermissions,
  getPermissionDisplayName,
  getPermissionDescription,
};
