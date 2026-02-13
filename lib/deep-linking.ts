import * as Linking from 'expo-linking';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// URL scheme: psychi://
// Deep link paths:
// - psychi://session/:sessionId - Open a specific session
// - psychi://supporter/:supporterId - View supporter profile
// - psychi://booking/:supporterId - Book with a supporter
// - psychi://reset-password - Password reset flow
// - psychi://messages - Open messages tab
// - psychi://home - Go to home screen
// - psychi://payout-settings - Stripe Connect onboarding return
// - psychi://edit-profile - Profile editing

type DeepLinkPath =
  | { type: 'session'; sessionId: string }
  | { type: 'supporter'; supporterId: string }
  | { type: 'booking'; supporterId: string }
  | { type: 'reset-password' }
  | { type: 'messages' }
  | { type: 'home' }
  | { type: 'payout-settings'; success?: boolean; refresh?: boolean }
  | { type: 'edit-profile' }
  | { type: 'unknown' };

/**
 * Parse a deep link URL into a structured path
 */
export function parseDeepLink(url: string): DeepLinkPath {
  try {
    const parsed = Linking.parse(url);
    const path = parsed.path || '';
    const pathParts = path.split('/').filter(Boolean);
    const queryParams = parsed.queryParams || {};

    if (pathParts[0] === 'session' && pathParts[1]) {
      return { type: 'session', sessionId: pathParts[1] };
    }

    if (pathParts[0] === 'supporter' && pathParts[1]) {
      return { type: 'supporter', supporterId: pathParts[1] };
    }

    if (pathParts[0] === 'booking' && pathParts[1]) {
      return { type: 'booking', supporterId: pathParts[1] };
    }

    if (pathParts[0] === 'reset-password') {
      return { type: 'reset-password' };
    }

    if (pathParts[0] === 'messages') {
      return { type: 'messages' };
    }

    if (pathParts[0] === 'payout-settings') {
      return {
        type: 'payout-settings',
        success: queryParams.success === 'true',
        refresh: queryParams.refresh === 'true',
      };
    }

    if (pathParts[0] === 'edit-profile') {
      return { type: 'edit-profile' };
    }

    if (pathParts[0] === 'home' || path === '' || path === '/') {
      return { type: 'home' };
    }

    return { type: 'unknown' };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return { type: 'unknown' };
  }
}

/**
 * Navigate based on deep link path
 */
export function handleDeepLink(parsedLink: DeepLinkPath): void {
  switch (parsedLink.type) {
    case 'session':
      router.push(`/session/${parsedLink.sessionId}` as any);
      break;
    case 'supporter':
      router.push(`/(client)/supporter/${parsedLink.supporterId}` as any);
      break;
    case 'booking':
      router.push(`/(client)/supporter/${parsedLink.supporterId}` as any);
      break;
    case 'reset-password':
      router.push('/(auth)/reset-password');
      break;
    case 'messages':
      router.push('/(client)/messages' as any);
      break;
    case 'payout-settings': {
      // Build query string for payout settings
      const params = new URLSearchParams();
      if (parsedLink.success) params.set('success', 'true');
      if (parsedLink.refresh) params.set('refresh', 'true');
      const queryString = params.toString();
      const path = queryString
        ? `/(supporter)/payout-settings?${queryString}`
        : '/(supporter)/payout-settings';
      router.push(path as any);
      break;
    }
    case 'edit-profile':
      router.push('/(supporter)/edit-profile' as any);
      break;
    case 'home':
      router.replace('/(client)/' as any);
      break;
    default:
      console.log('Unknown deep link path');
  }
}

/**
 * Handle notification that was tapped
 */
export function handleNotificationResponse(
  response: Notifications.NotificationResponse
): void {
  const data = response.notification.request.content.data;

  if (!data) return;

  // Handle different notification types
  if (data.type === 'session_reminder' && data.sessionId) {
    router.push(`/session/${data.sessionId}` as any);
  } else if (data.type === 'new_message' && data.conversationId) {
    router.push('/(client)/messages' as any);
  } else if (data.type === 'supporter_update' && data.supporterId) {
    router.push(`/(client)/supporter/${data.supporterId}` as any);
  } else if (data.deepLink) {
    // Generic deep link in notification
    const parsed = parseDeepLink(data.deepLink as string);
    handleDeepLink(parsed);
  }
}

/**
 * Set up deep link listener
 */
export function setupDeepLinkListener(): () => void {
  // Handle initial URL (app opened via link)
  Linking.getInitialURL().then((url) => {
    if (url) {
      const parsed = parseDeepLink(url);
      handleDeepLink(parsed);
    }
  });

  // Handle URLs while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    const parsed = parseDeepLink(url);
    handleDeepLink(parsed);
  });

  return () => subscription.remove();
}

/**
 * Set up notification response listener
 */
export function setupNotificationResponseListener(): () => void {
  // Handle notification that opened the app
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      handleNotificationResponse(response);
    }
  });

  // Handle notifications while app is running
  const subscription = Notifications.addNotificationResponseReceivedListener(
    handleNotificationResponse
  );

  return () => subscription.remove();
}

/**
 * Generate a deep link URL
 */
export function createDeepLink(path: string): string {
  return Linking.createURL(path);
}

export default {
  parseDeepLink,
  handleDeepLink,
  handleNotificationResponse,
  setupDeepLinkListener,
  setupNotificationResponseListener,
  createDeepLink,
};
