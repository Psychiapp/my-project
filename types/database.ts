/**
 * Database Types for Psychi App
 * These types match the Supabase database schema
 */

// User roles
export type UserRole = 'client' | 'supporter' | 'admin';

// Session types
export type SessionType = 'chat' | 'phone' | 'video';

// Subscription tiers
export type SubscriptionTier = 'basic' | 'standard' | 'premium';

// Status types
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'expired';
export type RescheduleRequestStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'auto_cancelled';

// Base user profile (from auth.users + profiles table)
export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Client-specific profile data
export interface ClientProfile extends UserProfile {
  role: 'client';
  subscription_tier: SubscriptionTier | null;
  subscription_status: SubscriptionStatus | null;
  subscription_expires_at: string | null;
  favorite_supporters: string[];
  sessions_remaining: {
    chat: number;
    phone: number;
    video: number;
  };
  total_sessions_completed: number;
}

// Supporter-specific profile data
export interface SupporterProfile extends UserProfile {
  role: 'supporter';
  bio: string;
  specialties: string[];
  education: string;
  languages: string[];
  years_experience: number;
  approach: string;
  total_sessions: number;
  is_verified: boolean;
  is_available: boolean;
  accepting_clients: boolean;
  training_complete: boolean;
  training_completed_at: string | null;
  availability: {
    [key: string]: string[]; // day: time slots
  };
  session_types: SessionType[];
  total_earnings: number;
  pending_payout: number;
}

// Supporter listing (simplified view for matching)
export interface SupporterListing {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  specialties: string[];
  education: string;
  total_sessions: number;
  is_available: boolean;
  accepting_clients: boolean;
  training_complete: boolean;
}

// Supporter detail (full profile for profile page)
export interface SupporterDetail extends SupporterListing {
  languages: string[];
  years_experience: number;
  approach: string;
  availability: {
    [key: string]: string[];
  };
  session_types: SessionType[];
  reviews: SupporterReview[];
}

// Supporter review (feedback without ratings)
export interface SupporterReview {
  id: string;
  client_id: string;
  client_name: string;
  comment: string | null;
  created_at: string;
  session_type: SessionType;
}

// Session
export interface Session {
  id: string;
  client_id: string;
  supporter_id: string;
  session_type: SessionType;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  room_url: string | null;
  notes: string | null;
  created_at: string;
  ended_at: string | null;
  feedback_comment: string | null;
}

// Session with related data (for display)
export interface SessionWithDetails extends Session {
  supporter?: SupporterListing;
  client?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// Reschedule request (when supporter requests to change session time)
export interface RescheduleRequest {
  id: string;
  session_id: string;
  supporter_id: string;
  client_id: string;
  original_scheduled_at: string;
  proposed_scheduled_at: string;
  status: RescheduleRequestStatus;
  reason?: string;
  response_deadline: string; // 3 hours before original session time
  created_at: string;
  responded_at?: string;
}

// Reschedule request with related data (for display)
export interface RescheduleRequestWithDetails extends RescheduleRequest {
  session?: Session;
  supporter?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
  client?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// Conversation/Message thread
export interface Conversation {
  id: string;
  client_id: string;
  supporter_id: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface ConversationWithParticipant extends Conversation {
  other_participant: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  };
}

// Message
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  content_encrypted: string | null;
  created_at: string;
  read_at: string | null;
}

// Payment
export interface Payment {
  id: string;
  user_id: string;
  amount: number; // in cents
  description: string;
  status: PaymentStatus;
  stripe_payment_intent_id: string | null;
  created_at: string;
}

// Supporter earnings/payout
export interface SupporterEarnings {
  this_month: number;
  last_month: number;
  total_earnings: number;
  pending_payout: number;
  next_payout_date: string | null;
}

export interface Payout {
  id: string;
  supporter_id: string;
  amount: number;
  status: PaymentStatus;
  stripe_transfer_id: string | null;
  created_at: string;
  processed_at: string | null;
}

// Training module
export interface TrainingModule {
  id: string;
  title: string;
  description: string;
  order: number;
  content_url: string;
  quiz_questions: QuizQuestion[];
  passing_score: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
}

export interface TrainingProgress {
  id: string;
  supporter_id: string;
  module_id: string;
  completed: boolean;
  quiz_score: number | null;
  completed_at: string | null;
}

// Booking/availability slot
export interface AvailabilitySlot {
  id: string;
  supporter_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:mm format
  end_time: string;
  is_active: boolean;
}

// Emergency report
export interface EmergencyReport {
  id: string;
  session_id: string;
  reporter_id: string;
  emergency_type: '911' | '988';
  created_at: string;
}

// User report
export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'unprofessional_behavior'
  | 'safety_concern'
  | 'other';

export interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  session_id?: string;
  reason: ReportReason;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

// User block
export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_user_id: string;
  created_at: string;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ============================================
// ADMIN TYPES
// ============================================

// Admin dashboard statistics
export interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalSupporters: number;
  activeSupporters: number;
  pendingSupporters: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// Supporter application (pending approval)
export interface SupporterApplication {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  bio: string;
  specialties: string[];
  education: string;
  languages: string[];
  years_experience: number;
  training_complete: boolean;
  training_completed_at: string | null;
  is_verified: boolean;
}

// Admin user listing (for user management)
export interface AdminUserListing {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  is_active: boolean;
  last_login_at: string | null;
  // Client-specific
  subscription_tier?: SubscriptionTier | null;
  total_sessions_completed?: number;
  // Supporter-specific
  training_complete?: boolean;
  is_verified?: boolean;
  accepting_clients?: boolean;
  total_sessions?: number;
}

// Chat transcript for admin viewing
export interface ChatTranscript {
  session_id: string;
  messages: TranscriptMessage[];
  session_info: {
    client_name: string;
    supporter_name: string;
    session_type: SessionType;
    scheduled_at: string;
    ended_at: string | null;
    status: SessionStatus;
    duration_minutes: number;
  };
}

export interface TranscriptMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'client' | 'supporter';
  content: string;
  created_at: string;
}

// Admin session listing (with both client and supporter info)
export interface AdminSessionListing {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar: string | null;
  supporter_id: string;
  supporter_name: string;
  supporter_avatar: string | null;
  session_type: SessionType;
  scheduled_at: string;
  ended_at: string | null;
  duration_minutes: number;
  status: SessionStatus;
  has_transcript: boolean;
}

// Revenue report
export interface RevenueReport {
  period: string;
  total_revenue: number;
  subscription_revenue: number;
  session_revenue: number;
  supporter_payouts: number;
  net_revenue: number;
  transaction_count: number;
}

// Client assignment for supporters (My Clients)
export type ClientAssignmentStatus = 'active' | 'paused' | 'ended';

export interface ClientAssignment {
  id: string;
  supporter_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  client_avatar: string | null;
  status: ClientAssignmentStatus;
  sessions_completed: number;
  started_at: string;
  last_session_date: string | null;
  notes: string | null;
}
