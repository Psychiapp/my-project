/**
 * Session Logger
 * Structured logging for video/voice call events
 *
 * This provides a consistent interface for logging call lifecycle events.
 * Can be extended to send logs to external services (Sentry, LogRocket, etc.)
 */

import { supabase } from './supabase';

export type SessionEventType =
  | 'session_start'
  | 'session_join'
  | 'session_leave'
  | 'session_end'
  | 'session_error'
  | 'room_created'
  | 'room_deleted'
  | 'room_join_failed'
  | 'participant_joined'
  | 'participant_left'
  | 'connection_timeout'
  | 'connection_lost'
  | 'connection_restored'
  | 'audio_toggle'
  | 'video_toggle'
  | 'speaker_toggle'
  | 'chat_message_sent'
  | 'chat_message_failed'
  | 'encryption_error'
  | 'post_call_message';

export type SessionType = 'chat' | 'phone' | 'video';

export interface SessionLogEntry {
  sessionId: string;
  sessionType: SessionType;
  userId: string;
  eventType: SessionEventType;
  timestamp: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
}

// In-memory log buffer for debugging
const logBuffer: SessionLogEntry[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Log a session event
 */
export function logSessionEvent(
  sessionId: string,
  sessionType: SessionType,
  userId: string,
  eventType: SessionEventType,
  metadata?: Record<string, unknown>,
  error?: Error
): void {
  const entry: SessionLogEntry = {
    sessionId,
    sessionType,
    userId,
    eventType,
    timestamp: new Date().toISOString(),
    metadata,
    errorMessage: error?.message,
    errorStack: error?.stack,
  };

  // Add to buffer
  logBuffer.push(entry);
  if (logBuffer.length > MAX_BUFFER_SIZE) {
    logBuffer.shift();
  }

  // Console log with structured format
  const logLevel = error ? 'error' : eventType.includes('error') || eventType.includes('failed') ? 'warn' : 'info';
  const logFn = logLevel === 'error' ? console.error : logLevel === 'warn' ? console.warn : console.log;

  logFn(`[Session:${sessionType}] ${eventType}`, {
    sessionId: sessionId.slice(0, 8) + '...',
    userId: userId.slice(0, 8) + '...',
    ...metadata,
    ...(error && { error: error.message }),
  });

  // Persist error events to database for later analysis
  if (error || eventType.includes('error') || eventType.includes('failed') || eventType === 'connection_timeout') {
    persistSessionLog(entry);
  }
}

/**
 * Persist log entry to database
 */
async function persistSessionLog(entry: SessionLogEntry): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('session_logs').insert({
      session_id: entry.sessionId,
      session_type: entry.sessionType,
      user_id: entry.userId,
      event_type: entry.eventType,
      metadata: entry.metadata,
      error_message: entry.errorMessage,
      error_stack: entry.errorStack,
      created_at: entry.timestamp,
    });
  } catch (err) {
    // Don't let logging errors break the app
    console.warn('Failed to persist session log:', err);
  }
}

/**
 * Get recent logs from buffer (for debugging)
 */
export function getRecentLogs(): SessionLogEntry[] {
  return [...logBuffer];
}

/**
 * Clear log buffer
 */
export function clearLogBuffer(): void {
  logBuffer.length = 0;
}

/**
 * Create a session-scoped logger for convenience
 */
export function createSessionLogger(
  sessionId: string,
  sessionType: SessionType,
  userId: string
) {
  return {
    log: (eventType: SessionEventType, metadata?: Record<string, unknown>) => {
      logSessionEvent(sessionId, sessionType, userId, eventType, metadata);
    },
    error: (eventType: SessionEventType, error: Error, metadata?: Record<string, unknown>) => {
      logSessionEvent(sessionId, sessionType, userId, eventType, metadata, error);
    },
  };
}

/**
 * Log call quality metrics (for future use)
 */
export interface CallQualityMetrics {
  sessionId: string;
  userId: string;
  timestamp: string;
  roundTripTime?: number;
  packetLoss?: number;
  jitter?: number;
  audioLevel?: number;
  videoResolution?: string;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
}

export function logCallQuality(metrics: CallQualityMetrics): void {
  console.log('[CallQuality]', metrics);
  // Can be extended to persist or send to analytics service
}
