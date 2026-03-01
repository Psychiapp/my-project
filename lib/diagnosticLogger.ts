/**
 * Diagnostic Logger for Profile Save Issues
 * Sends detailed logs to Sentry for remote debugging
 */

import { Alert } from 'react-native';

// Conditionally import Sentry
let Sentry: any = null;
let sentryInitialized = false;

try {
  Sentry = require('@sentry/react-native');
  // Check if Sentry is actually initialized by looking for the client
  sentryInitialized = Sentry && typeof Sentry.captureMessage === 'function';
  console.log('[DIAG] Sentry module loaded, initialized:', sentryInitialized);
} catch (e) {
  console.log('[DIAG] Sentry not available:', e);
}

interface DiagnosticData {
  [key: string]: unknown;
}

/**
 * Log diagnostic data to both console and Sentry
 */
export function logDiagnostic(tag: string, message: string, data?: DiagnosticData) {
  const timestamp = new Date().toISOString();

  // Always log to console
  console.log(`[DIAG:${tag}] ${message}`, data ? JSON.stringify(data, null, 2) : '');

  // Send to Sentry if available
  if (Sentry && sentryInitialized) {
    try {
      Sentry.addBreadcrumb({
        category: 'diagnostic',
        message: `[${tag}] ${message}`,
        data: data,
        level: 'info',
      });
    } catch (e) {
      console.log('[DIAG] Failed to add Sentry breadcrumb:', e);
    }
  }
}

/**
 * Send a diagnostic report to Sentry with all collected data
 */
export async function sendDiagnosticReport(title: string, data: DiagnosticData) {
  const report = {
    title,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Always log to console
  console.log('========== DIAGNOSTIC REPORT ==========');
  console.log(JSON.stringify(report, null, 2));
  console.log('========================================');

  // Send to Sentry if available
  if (Sentry && sentryInitialized) {
    try {
      const eventId = Sentry.captureMessage(title, {
        level: 'error', // Use error level for better visibility
        tags: {
          diagnostic: 'true',
          type: 'profile_save',
        },
        extra: report,
      });
      console.log('[DIAG] Report sent to Sentry, eventId:', eventId);

      // Force flush to ensure event is sent immediately
      await Sentry.flush(5000);
      console.log('[DIAG] Sentry flush completed');
    } catch (e) {
      console.log('[DIAG] Failed to send to Sentry:', e);
    }
  } else {
    console.log('[DIAG] Sentry not available - report only logged to console');
  }
}

/**
 * Capture an error with diagnostic context
 */
export async function captureErrorWithDiagnostics(error: Error, context: DiagnosticData) {
  const errorReport = {
    errorName: error.name,
    errorMessage: error.message,
    errorStack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };

  // Always log to console
  console.log('========== DIAGNOSTIC ERROR ==========');
  console.log(JSON.stringify(errorReport, null, 2));
  console.log('=======================================');

  // Send to Sentry if available
  if (Sentry && sentryInitialized) {
    try {
      const eventId = Sentry.captureException(error, {
        tags: {
          diagnostic: 'true',
          type: 'profile_save_error',
        },
        extra: context,
      });
      console.log('[DIAG] Error captured in Sentry, eventId:', eventId);

      // Force flush to ensure event is sent immediately
      await Sentry.flush(5000);
      console.log('[DIAG] Sentry flush completed');

      // Show alert so user knows event was sent
      Alert.alert(
        'Diagnostic Sent',
        `Error logged to Sentry.\nEvent ID: ${eventId}\n\nPlease check Sentry dashboard.`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.log('[DIAG] Failed to capture in Sentry:', e);
      Alert.alert('Diagnostic Failed', `Could not send to Sentry: ${e}`);
    }
  } else {
    console.log('[DIAG] Sentry not available - error only logged to console');
    Alert.alert(
      'Diagnostic (Local Only)',
      `Sentry not available.\n\nError: ${error.message}\n\nContext logged to console.`,
      [{ text: 'OK' }]
    );
  }
}
