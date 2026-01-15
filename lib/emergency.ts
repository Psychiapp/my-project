/**
 * Emergency Report System
 * Handles emergency reporting during sessions and notifies Psychi safety team
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMERGENCY_EMAIL = 'psychiapp@outlook.com';
const PENDING_REPORTS_KEY = '@psychi_pending_emergency_reports';

export interface EmergencyReport {
  sessionId: string;
  sessionType: 'chat' | 'phone' | 'video';
  participantName: string;
  reporterName: string;
  emergencyType: '911' | '988';
  timestamp: string;
}

interface StoredReport extends EmergencyReport {
  id: string;
  status: 'pending' | 'sent' | 'failed';
}

/**
 * Send an emergency report to Psychi safety team
 * This will:
 * 1. Store the report in Supabase
 * 2. Trigger an email notification to psychiapp@outlook.com
 * 3. Store locally as backup if network fails
 */
export async function sendEmergencyReport(report: EmergencyReport): Promise<boolean> {
  const reportId = `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const storedReport: StoredReport = {
    ...report,
    id: reportId,
    status: 'pending',
  };

  try {
    // First, store locally as backup
    await storeReportLocally(storedReport);

    // Try to send via Supabase
    if (supabase) {
      // Insert into emergency_reports table
      const { error: insertError } = await supabase
        .from('emergency_reports')
        .insert({
          id: reportId,
          session_id: report.sessionId,
          session_type: report.sessionType,
          participant_name: report.participantName,
          reporter_name: report.reporterName,
          emergency_type: report.emergencyType,
          timestamp: report.timestamp,
          email_sent: false,
        });

      if (insertError) {
        console.warn('Failed to insert emergency report:', insertError);
        // Continue - the edge function or backend will handle email
      }

      // Call the send-emergency-email edge function
      const { error: functionError } = await supabase.functions.invoke('send-emergency-email', {
        body: {
          to: EMERGENCY_EMAIL,
          subject: `URGENT: Emergency Report - ${report.emergencyType} Called`,
          report: {
            ...report,
            id: reportId,
          },
        },
      });

      if (functionError) {
        console.warn('Failed to send emergency email via function:', functionError);
        // Fall back to storing for later retry
      } else {
        // Successfully sent - update local status
        await updateReportStatus(reportId, 'sent');
        return true;
      }
    }

    // If we get here, try alternative notification method
    await sendFallbackNotification(storedReport);
    return true;
  } catch (error) {
    console.error('Emergency report error:', error);
    // Report is stored locally, will be retried later
    return false;
  }
}

/**
 * Store report locally for backup/retry
 */
async function storeReportLocally(report: StoredReport): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    const reports: StoredReport[] = existing ? JSON.parse(existing) : [];
    reports.push(report);
    await AsyncStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(reports));
  } catch (error) {
    console.error('Failed to store report locally:', error);
  }
}

/**
 * Update status of a stored report
 */
async function updateReportStatus(reportId: string, status: StoredReport['status']): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    if (!existing) return;

    const reports: StoredReport[] = JSON.parse(existing);
    const updated = reports.map((r) =>
      r.id === reportId ? { ...r, status } : r
    );
    await AsyncStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to update report status:', error);
  }
}

/**
 * Fallback notification when Supabase is unavailable
 * This could be expanded to use other notification services
 */
async function sendFallbackNotification(report: StoredReport): Promise<void> {
  // Log for monitoring/debugging
  console.log('Emergency Report (fallback):', {
    id: report.id,
    emergencyType: report.emergencyType,
    sessionId: report.sessionId,
    timestamp: report.timestamp,
  });

  // In production, this could:
  // 1. Use a backup API endpoint
  // 2. Send via Firebase Cloud Messaging
  // 3. Use Twilio or another SMS service
  // For now, the report is stored locally and will be synced when possible
}

/**
 * Retry sending any pending emergency reports
 * Call this on app startup or when network becomes available
 */
export async function retryPendingReports(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    if (!existing) return;

    const reports: StoredReport[] = JSON.parse(existing);
    const pending = reports.filter((r) => r.status === 'pending' || r.status === 'failed');

    for (const report of pending) {
      try {
        if (supabase) {
          const { error } = await supabase.functions.invoke('send-emergency-email', {
            body: {
              to: EMERGENCY_EMAIL,
              subject: `URGENT: Emergency Report - ${report.emergencyType} Called (Delayed)`,
              report,
            },
          });

          if (!error) {
            await updateReportStatus(report.id, 'sent');
          }
        }
      } catch (err) {
        console.warn('Failed to retry report:', report.id, err);
      }
    }
  } catch (error) {
    console.error('Failed to retry pending reports:', error);
  }
}

/**
 * Get all stored emergency reports (for admin/debugging)
 */
export async function getStoredReports(): Promise<StoredReport[]> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    return existing ? JSON.parse(existing) : [];
  } catch (error) {
    console.error('Failed to get stored reports:', error);
    return [];
  }
}

/**
 * Clear sent reports from local storage
 */
export async function clearSentReports(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(PENDING_REPORTS_KEY);
    if (!existing) return;

    const reports: StoredReport[] = JSON.parse(existing);
    const notSent = reports.filter((r) => r.status !== 'sent');
    await AsyncStorage.setItem(PENDING_REPORTS_KEY, JSON.stringify(notSent));
  } catch (error) {
    console.error('Failed to clear sent reports:', error);
  }
}

/**
 * Format emergency report for email content
 */
export function formatEmergencyEmail(report: EmergencyReport): string {
  const emergencyLabel = report.emergencyType === '911'
    ? 'Emergency Services (911)'
    : 'Suicide & Crisis Lifeline (988)';

  return `
URGENT: Emergency Report

A user has initiated an emergency call during a Psychi support session.

DETAILS:
- Emergency Type: ${emergencyLabel}
- Session ID: ${report.sessionId}
- Session Type: ${report.sessionType}
- Participant: ${report.participantName}
- Reported By: ${report.reporterName}
- Timestamp: ${new Date(report.timestamp).toLocaleString()}

IMMEDIATE ACTION REQUIRED:
Please review this session and follow up according to the Psychi Safety Protocol.

---
This is an automated emergency notification from the Psychi mobile app.
  `.trim();
}
