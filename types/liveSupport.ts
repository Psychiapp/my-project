/**
 * Live Support Types for Psychi App
 * Types and constants for live support requests and session usage tracking
 */

import type { SessionType } from './database';

// Subscription tier allowances
// NOTE: Calls (phone/video) reset WEEKLY, chats reset MONTHLY (with subscription renewal)
// Voice and video share a combined quota
export const TIER_ALLOWANCES = {
  1: { voiceVideo: 1, chat: 2 },     // Basic ($55/mo): 1 call/WEEK, 2 chats/MONTH
  2: { voiceVideo: 2, chat: 3 },     // Standard ($109/mo): 2 calls/WEEK, 3 chats/MONTH
  3: { voiceVideo: 3, chat: Infinity }, // Premium ($149/mo): 3 calls/WEEK, unlimited chats
} as const;

// Pay-as-you-go prices (in cents)
export const PAYG_PRICES = {
  chat: 700,   // $7.00
  phone: 1500, // $15.00
  video: 2000, // $20.00
} as const;

// Request timeout in milliseconds (15 minutes)
export const REQUEST_TIMEOUT_MS = 15 * 60 * 1000;

// Heartbeat interval in milliseconds (60 seconds)
export const HEARTBEAT_INTERVAL_MS = 60 * 1000;

// Stale presence threshold in seconds (90 seconds)
export const STALE_PRESENCE_THRESHOLD_S = 90;

// Map subscription tier strings to numbers
export const TIER_MAP: Record<string, number> = {
  'basic': 1,
  'tier-1': 1,
  'standard': 2,
  'tier-2': 2,
  'premium': 3,
  'tier-3': 3,
};

// Live Support Request Status
export type LiveSupportRequestStatus =
  | 'pending'       // Waiting for supporter response
  | 'accepted'      // Supporter accepted, session starting
  | 'declined'      // Supporter declined (will route to next)
  | 'expired'       // Request timed out
  | 'cancelled'     // Client cancelled the request
  | 'completed'     // Session completed
  | 'no_supporters'; // No supporters available

// Presence state for a user
export interface PresenceState {
  isOnline: boolean;
  lastSeen: Date | null;
  inSession: boolean;
  availableForLiveSupport: boolean;
}

// Session usage record
export interface SessionUsage {
  id: string;
  clientId: string;
  sessionType: SessionType;
  sessionId: string | null;
  usedAt: Date;
  billingPeriodStart: Date;
  subscriptionTier: number;
  chargedAsPayg: boolean;
  paymentIntentId: string | null;
  createdAt: Date;
}

// Current period usage summary
export interface PeriodUsageSummary {
  chatUsed: number;
  chatAllowed: number;
  voiceVideoUsed: number;
  voiceVideoAllowed: number;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  subscriptionTier: number;
  sessionsRemaining?: {
    chat: number;
    phone: number;
    video: number;
  };
}

// Decline history entry
export interface DeclineEntry {
  supporterId: string;
  declinedAt: string;
  reason?: string;
}

// Live support request
export interface LiveSupportRequest {
  id: string;
  clientId: string;
  requestedSupporterId: string | null;
  sessionType: SessionType;
  status: LiveSupportRequestStatus;
  paymentIntentId: string | null;
  chargedAsPayg: boolean;
  amountCharged: number | null;
  createdAt: Date;
  expiresAt: Date;
  acceptedAt: Date | null;
  completedAt: Date | null;
  sessionId: string | null;
  declineHistory: DeclineEntry[];
  attemptCount: number;
}

// Live support request with supporter details
export interface LiveSupportRequestWithSupporter extends LiveSupportRequest {
  supporter?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

// Live support request with client details (for supporters)
export interface LiveSupportRequestWithClient extends LiveSupportRequest {
  client?: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

// Result of checking session allowance
export interface AllowanceCheckResult {
  hasAllowance: boolean;
  remaining: number;
  paygRequired: boolean;
  paygPrice: number; // in cents
  subscriptionTier: number | null;
}

// Database row type for live_support_requests
export interface LiveSupportRequestRow {
  id: string;
  client_id: string;
  requested_supporter_id: string | null;
  session_type: 'chat' | 'phone' | 'video';
  status: LiveSupportRequestStatus;
  payment_intent_id: string | null;
  charged_as_payg: boolean;
  amount_charged: number | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  session_id: string | null;
  decline_history: DeclineEntry[];
  attempt_count: number;
}

// Database row type for session_usage
export interface SessionUsageRow {
  id: string;
  client_id: string;
  session_type: 'chat' | 'phone' | 'video';
  session_id: string | null;
  used_at: string;
  billing_period_start: string;
  subscription_tier: number;
  charged_as_payg: boolean;
  payment_intent_id: string | null;
  created_at: string;
}

// Helper function to transform database row to LiveSupportRequest
export function transformLiveSupportRequest(row: LiveSupportRequestRow): LiveSupportRequest {
  return {
    id: row.id,
    clientId: row.client_id,
    requestedSupporterId: row.requested_supporter_id,
    sessionType: row.session_type,
    status: row.status,
    paymentIntentId: row.payment_intent_id,
    chargedAsPayg: row.charged_as_payg,
    amountCharged: row.amount_charged,
    createdAt: new Date(row.created_at),
    expiresAt: new Date(row.expires_at),
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
    completedAt: row.completed_at ? new Date(row.completed_at) : null,
    sessionId: row.session_id,
    declineHistory: row.decline_history || [],
    attemptCount: row.attempt_count,
  };
}

// Helper function to transform database row to SessionUsage
export function transformSessionUsage(row: SessionUsageRow): SessionUsage {
  return {
    id: row.id,
    clientId: row.client_id,
    sessionType: row.session_type,
    sessionId: row.session_id,
    usedAt: new Date(row.used_at),
    billingPeriodStart: new Date(row.billing_period_start),
    subscriptionTier: row.subscription_tier,
    chargedAsPayg: row.charged_as_payg,
    paymentIntentId: row.payment_intent_id,
    createdAt: new Date(row.created_at),
  };
}

// Helper to format remaining allowance for display
export function formatAllowanceDisplay(
  used: number,
  allowed: number,
  type: 'chat' | 'voiceVideo'
): string {
  if (allowed === Infinity || allowed >= 999) {
    return 'Unlimited';
  }
  const remaining = Math.max(0, allowed - used);
  return `${remaining} of ${allowed}`;
}

// Helper to get PAYG price display
export function formatPaygPrice(sessionType: SessionType): string {
  const price = PAYG_PRICES[sessionType];
  return `$${(price / 100).toFixed(0)}`;
}
