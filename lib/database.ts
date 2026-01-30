/**
 * Database Query Functions for Psychi App
 * All Supabase queries are centralized here
 */

import { supabase } from './supabase';
import type {
  UserProfile,
  ClientProfile,
  SupporterProfile,
  SupporterListing,
  SupporterDetail,
  SupporterReview,
  Session,
  SessionWithDetails,
  ConversationWithParticipant,
  Message,
  Payment,
  SupporterEarnings,
  Payout,
  TrainingProgress,
  SessionType,
  SubscriptionTier,
  AdminStats,
  AdminUserListing,
  SupporterApplication,
  AdminSessionListing,
  ChatTranscript,
  TranscriptMessage,
  RevenueReport,
  UserReport,
  UserBlock,
  ReportReason,
  UserRole,
  ClientAssignment,
  ClientAssignmentStatus,
  RescheduleRequest,
  RescheduleRequestWithDetails,
  RescheduleRequestStatus,
} from '@/types/database';

// ============================================
// USER PROFILE QUERIES
// ============================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Get client profile with subscription data
 */
export async function getClientProfile(userId: string): Promise<ClientProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      subscriptions (
        tier,
        status,
        expires_at,
        sessions_remaining
      )
    `)
    .eq('id', userId)
    .eq('role', 'client')
    .single();

  if (error) {
    console.error('Error fetching client profile:', error);
    return null;
  }

  // Transform to ClientProfile shape
  const subscription = data.subscriptions?.[0];
  return {
    ...data,
    subscription_tier: subscription?.tier || null,
    subscription_status: subscription?.status || null,
    subscription_expires_at: subscription?.expires_at || null,
    sessions_remaining: subscription?.sessions_remaining || { chat: 0, phone: 0, video: 0 },
  };
}

/**
 * Update or create client subscription
 */
export async function updateClientSubscription(
  userId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  if (!supabase) return false;

  // Calculate expiration date (1 month from now)
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  // Default sessions based on tier
  const sessionsRemaining = {
    basic: { chat: 2, phone: 1, video: 0 },
    standard: { chat: 3, phone: 2, video: 0 },
    premium: { chat: 999, phone: 3, video: 0 },
  }[tier];

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      tier,
      status: 'active',
      expires_at: expiresAt.toISOString(),
      sessions_remaining: sessionsRemaining,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (error) {
    console.error('Error updating subscription:', error);
    return false;
  }

  return true;
}

/**
 * Cancel client subscription
 */
export async function cancelClientSubscription(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error cancelling subscription:', error);
    return false;
  }

  return true;
}

/**
 * Get supporter profile with all details
 */
export async function getSupporterProfile(userId: string): Promise<SupporterProfile | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      supporter_details (*)
    `)
    .eq('id', userId)
    .eq('role', 'supporter')
    .single();

  if (error) {
    console.error('Error fetching supporter profile:', error);
    return null;
  }

  const details = data.supporter_details?.[0] || {};
  return {
    ...data,
    ...details,
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    return false;
  }

  return true;
}

// ============================================
// SUPPORTER QUERIES
// ============================================

/**
 * Get all available supporters for browsing
 * Only returns supporters who:
 * - Have completed onboarding (W9, bank info, training)
 * - Are accepting new clients
 */
export async function getAvailableSupporters(): Promise<SupporterListing[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      onboarding_complete,
      supporter_details (
        bio,
        specialties,
        education,
        total_sessions,
        is_available,
        accepting_clients,
        training_complete
      )
    `)
    .eq('role', 'supporter')
    .eq('onboarding_complete', true) // Must complete W9, bank, and training
    .eq('supporter_details.accepting_clients', true);

  if (error) {
    console.error('Error fetching supporters:', error);
    return [];
  }

  // Transform and flatten the data
  return (data || []).map((supporter) => {
    const details = supporter.supporter_details?.[0] || {};
    return {
      id: supporter.id,
      full_name: supporter.full_name,
      avatar_url: supporter.avatar_url,
      bio: details.bio || '',
      specialties: details.specialties || [],
      education: details.education || '',
      total_sessions: details.total_sessions || 0,
      is_available: details.is_available || false,
      accepting_clients: details.accepting_clients || false,
      training_complete: details.training_complete || false,
      onboarding_complete: supporter.onboarding_complete || false,
    };
  });
}

/**
 * Search supporters by name or specialty
 * Only returns supporters who have completed onboarding
 */
export async function searchSupporters(
  query: string,
  specialty?: string
): Promise<SupporterListing[]> {
  if (!supabase) return [];

  let queryBuilder = supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      onboarding_complete,
      supporter_details (
        bio,
        specialties,
        education,
        total_sessions,
        is_available,
        accepting_clients,
        training_complete
      )
    `)
    .eq('role', 'supporter')
    .eq('onboarding_complete', true) // Must complete W9, bank, and training
    .eq('supporter_details.accepting_clients', true);

  // Add name search if query provided
  if (query) {
    queryBuilder = queryBuilder.ilike('full_name', `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error searching supporters:', error);
    return [];
  }

  // Filter by specialty in memory (JSON array filtering)
  let results = (data || []).map((supporter) => {
    const details = supporter.supporter_details?.[0] || {};
    return {
      id: supporter.id,
      full_name: supporter.full_name,
      avatar_url: supporter.avatar_url,
      bio: details.bio || '',
      specialties: details.specialties || [],
      education: details.education || '',
      total_sessions: details.total_sessions || 0,
      is_available: details.is_available || false,
      accepting_clients: details.accepting_clients || false,
      training_complete: details.training_complete || false,
      onboarding_complete: supporter.onboarding_complete || false,
    };
  });

  if (specialty && specialty !== 'All') {
    results = results.filter((s) => s.specialties.includes(specialty));
  }

  return results;
}

/**
 * Get supporter detail by ID (for profile page)
 */
export async function getSupporterDetail(supporterId: string): Promise<SupporterDetail | null> {
  if (!supabase) return null;

  // Query profiles for basic info (only columns that definitely exist)
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', supporterId)
    .eq('role', 'supporter')
    .single();

  if (profileError) {
    console.error('Error fetching supporter profile:', profileError);
    return null;
  }

  // Query supporter_details separately for supporter-specific info
  const { data: detailsData, error: detailsError } = await supabase
    .from('supporter_details')
    .select(`
      bio,
      specialties,
      education,
      languages,
      years_experience,
      approach,
      total_sessions,
      is_available,
      accepting_clients,
      training_complete,
      availability,
      session_types
    `)
    .eq('supporter_id', supporterId)
    .single();

  // Details may not exist yet for new supporters - that's ok
  const details = detailsData || {};

  // Fetch reviews/feedback separately
  const reviews = await getSupporterReviews(supporterId);

  return {
    id: profileData.id,
    full_name: profileData.full_name,
    avatar_url: profileData.avatar_url,
    bio: details.bio || '',
    specialties: details.specialties || [],
    education: details.education || '',
    languages: details.languages || ['English'],
    years_experience: details.years_experience || 0,
    approach: details.approach || '',
    total_sessions: details.total_sessions || 0,
    is_available: details.is_available || false,
    accepting_clients: details.accepting_clients || false,
    training_complete: details.training_complete || false,
    onboarding_complete: details.training_complete || false, // Use training_complete as proxy
    availability: details.availability || {},
    session_types: details.session_types || ['chat', 'phone', 'video'],
    reviews,
  };
}

/**
 * Get supporter reviews/feedback (without ratings)
 */
export async function getSupporterReviews(supporterId: string): Promise<SupporterReview[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      client_id,
      comment,
      created_at,
      session_type,
      profiles!reviews_client_id_fkey (full_name)
    `)
    .eq('supporter_id', supporterId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return (data || []).map((review: any) => ({
    id: review.id,
    client_id: review.client_id,
    client_name: review.profiles?.full_name || 'Anonymous',
    comment: review.comment,
    created_at: review.created_at,
    session_type: review.session_type,
  }));
}

/**
 * Update supporter availability status
 */
export async function updateSupporterAvailability(
  supporterId: string,
  isAvailable: boolean
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('supporter_details')
    .update({ is_available: isAvailable })
    .eq('supporter_id', supporterId);

  if (error) {
    console.error('Error updating availability:', error);
    return false;
  }

  return true;
}

/**
 * Update whether supporter is accepting new clients
 */
export async function updateAcceptingClients(
  supporterId: string,
  acceptingClients: boolean
): Promise<boolean> {
  if (!supabase) return false;

  // First check if the row exists
  const { data: existing } = await supabase
    .from('supporter_details')
    .select('id')
    .eq('supporter_id', supporterId)
    .single();

  if (existing) {
    // Row exists, update it
    const { error } = await supabase
      .from('supporter_details')
      .update({ accepting_clients: acceptingClients })
      .eq('supporter_id', supporterId);

    if (error) {
      console.error('Error updating accepting clients status:', error);
      return false;
    }
  } else {
    // Row doesn't exist, insert it
    const { error } = await supabase
      .from('supporter_details')
      .insert({
        supporter_id: supporterId,
        accepting_clients: acceptingClients,
      });

    if (error) {
      console.error('Error inserting supporter details:', error);
      return false;
    }
  }

  return true;
}

// ============================================
// SESSION QUERIES
// ============================================

/**
 * Get upcoming sessions for a user
 */
export async function getUpcomingSessions(
  userId: string,
  role: 'client' | 'supporter'
): Promise<SessionWithDetails[]> {
  if (!supabase) return [];

  const userIdField = role === 'client' ? 'client_id' : 'supporter_id';
  const otherField = role === 'client' ? 'supporter_id' : 'client_id';

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      ${role === 'client' ? 'supporter:profiles!sessions_supporter_id_fkey' : 'client:profiles!sessions_client_id_fkey'} (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq(userIdField, userId)
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get past sessions for a user
 */
export async function getPastSessions(
  userId: string,
  role: 'client' | 'supporter',
  limit: number = 20
): Promise<SessionWithDetails[]> {
  if (!supabase) return [];

  const userIdField = role === 'client' ? 'client_id' : 'supporter_id';

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      ${role === 'client' ? 'supporter:profiles!sessions_supporter_id_fkey' : 'client:profiles!sessions_client_id_fkey'} (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq(userIdField, userId)
    .in('status', ['completed', 'cancelled', 'no_show'])
    .order('scheduled_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching past sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<SessionWithDetails | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      supporter:profiles!sessions_supporter_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      client:profiles!sessions_client_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
}

/**
 * Create a new session booking
 */
export async function createSession(
  clientId: string,
  supporterId: string,
  sessionType: SessionType,
  scheduledAt: string,
  durationMinutes: number
): Promise<Session | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      client_id: clientId,
      supporter_id: supporterId,
      session_type: sessionType,
      scheduled_at: scheduledAt,
      duration_minutes: durationMinutes,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return null;
  }

  return data;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: Session['status']
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session status:', error);
    return false;
  }

  return true;
}

/**
 * Submit feedback for a completed session (without rating)
 */
export async function submitSessionFeedback(
  sessionId: string,
  comment: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('sessions')
    .update({
      feedback_comment: comment || null,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error submitting session feedback:', error);
    return false;
  }

  return true;
}

// ============================================
// SUPPORTER DASHBOARD STATS
// ============================================

/**
 * Get supporter dashboard statistics
 */
export async function getSupporterStats(supporterId: string): Promise<{
  totalSessions: number;
  totalEarnings: number;
  upcomingCount: number;
}> {
  if (!supabase) {
    return { totalSessions: 0, totalEarnings: 0, upcomingCount: 0 };
  }

  // Get total sessions
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('supporter_id', supporterId)
    .eq('status', 'completed');

  // Get upcoming sessions count
  const { count: upcomingCount } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('supporter_id', supporterId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString());

  // Get supporter details for earnings
  const { data: details } = await supabase
    .from('supporter_details')
    .select('total_earnings')
    .eq('supporter_id', supporterId)
    .single();

  return {
    totalSessions: totalSessions || 0,
    totalEarnings: details?.total_earnings || 0,
    upcomingCount: upcomingCount || 0,
  };
}

/**
 * Get supporter earnings breakdown
 */
export async function getSupporterEarnings(supporterId: string): Promise<SupporterEarnings> {
  if (!supabase) {
    return {
      this_month: 0,
      last_month: 0,
      total_earnings: 0,
      pending_payout: 0,
      next_payout_date: null,
    };
  }

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // Get this month's earnings
  const { data: thisMonthData } = await supabase
    .from('payouts')
    .select('amount')
    .eq('supporter_id', supporterId)
    .gte('created_at', startOfThisMonth);

  const thisMonth = (thisMonthData || []).reduce((sum, p) => sum + p.amount, 0);

  // Get last month's earnings
  const { data: lastMonthData } = await supabase
    .from('payouts')
    .select('amount')
    .eq('supporter_id', supporterId)
    .gte('created_at', startOfLastMonth)
    .lt('created_at', startOfThisMonth);

  const lastMonth = (lastMonthData || []).reduce((sum, p) => sum + p.amount, 0);

  // Get totals from supporter_details
  const { data: details } = await supabase
    .from('supporter_details')
    .select('total_earnings, pending_payout')
    .eq('supporter_id', supporterId)
    .single();

  return {
    this_month: thisMonth,
    last_month: lastMonth,
    total_earnings: details?.total_earnings || 0,
    pending_payout: details?.pending_payout || 0,
    next_payout_date: null, // Calculate based on your payout schedule
  };
}

/**
 * Get supporter payouts
 */
export async function getSupporterPayouts(supporterId: string, limit: number = 10): Promise<Payout[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('payouts')
    .select('*')
    .eq('supporter_id', supporterId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching payouts:', error);
    return [];
  }

  return data || [];
}

/**
 * Get session count for supporter in time range
 */
export async function getSupporterSessionCount(
  supporterId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  if (!supabase) return 0;

  let query = supabase
    .from('sessions')
    .select('id', { count: 'exact' })
    .eq('supporter_id', supporterId)
    .eq('status', 'completed');

  if (startDate) {
    query = query.gte('scheduled_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lt('scheduled_at', endDate.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error fetching session count:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// CLIENT ASSIGNMENT QUERIES
// ============================================

/**
 * Get all client assignments for a supporter
 */
export async function getSupporterClients(supporterId: string): Promise<ClientAssignment[]> {
  if (!supabase) return [];

  // First, get unique clients from sessions
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      client_id,
      scheduled_at,
      status,
      client:profiles!sessions_client_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('supporter_id', supporterId)
    .order('scheduled_at', { ascending: false });

  if (error) {
    console.error('Error fetching supporter clients:', error);
    return [];
  }

  // Group sessions by client
  const clientMap = new Map<string, {
    client: { id: string; full_name: string; email: string; avatar_url: string | null };
    sessions: Array<{ scheduled_at: string; status: string }>;
  }>();

  sessions?.forEach((session: any) => {
    if (!session.client) return;
    const clientId = session.client_id;
    if (!clientMap.has(clientId)) {
      clientMap.set(clientId, {
        client: session.client,
        sessions: [],
      });
    }
    clientMap.get(clientId)!.sessions.push({
      scheduled_at: session.scheduled_at,
      status: session.status,
    });
  });

  // Transform to ClientAssignment format
  const assignments: ClientAssignment[] = [];
  clientMap.forEach((value, clientId) => {
    const completedSessions = value.sessions.filter(s => s.status === 'completed');
    const sortedSessions = [...value.sessions].sort(
      (a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()
    );
    const lastSession = completedSessions.length > 0
      ? completedSessions.sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())[0]
      : null;

    // Determine status based on recent activity
    const hasRecentSession = sortedSessions.some(s => {
      const sessionDate = new Date(s.scheduled_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return sessionDate > thirtyDaysAgo;
    });

    let status: ClientAssignmentStatus = 'active';
    if (!hasRecentSession && completedSessions.length > 0) {
      status = 'paused';
    }

    assignments.push({
      id: clientId,
      supporter_id: supporterId,
      client_id: clientId,
      client_name: value.client.full_name,
      client_email: value.client.email,
      client_avatar: value.client.avatar_url,
      status,
      sessions_completed: completedSessions.length,
      started_at: sortedSessions.length > 0
        ? sortedSessions[sortedSessions.length - 1].scheduled_at
        : new Date().toISOString(),
      last_session_date: lastSession?.scheduled_at || null,
      notes: null,
    });
  });

  // Sort by most recent activity
  return assignments.sort((a, b) => {
    const aDate = a.last_session_date ? new Date(a.last_session_date).getTime() : 0;
    const bDate = b.last_session_date ? new Date(b.last_session_date).getTime() : 0;
    return bDate - aDate;
  });
}

// ============================================
// TRAINING QUERIES
// ============================================

/**
 * Get supporter training progress
 */
export async function getTrainingProgress(supporterId: string): Promise<TrainingProgress[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('training_progress')
    .select('*')
    .eq('supporter_id', supporterId);

  if (error) {
    console.error('Error fetching training progress:', error);
    return [];
  }

  return data || [];
}

/**
 * Mark training module as complete
 */
export async function completeTrainingModule(
  supporterId: string,
  moduleId: string,
  quizScore: number
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('training_progress')
    .upsert({
      supporter_id: supporterId,
      module_id: moduleId,
      completed: true,
      quiz_score: quizScore,
      completed_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error completing training module:', error);
    return false;
  }

  // Check if all modules are complete
  const { data: progress } = await supabase
    .from('training_progress')
    .select('completed')
    .eq('supporter_id', supporterId);

  const { data: modules } = await supabase
    .from('training_modules')
    .select('id');

  const totalModules = modules?.length || 5;
  const completedModules = (progress || []).filter((p) => p.completed).length;

  // If all modules complete, update supporter as training complete
  if (completedModules >= totalModules) {
    await supabase
      .from('supporter_details')
      .update({
        training_complete: true,
        training_completed_at: new Date().toISOString(),
      })
      .eq('supporter_id', supporterId);
  }

  return true;
}

// ============================================
// SUPPORTER SIGNUP/ONBOARDING
// ============================================

/**
 * Create supporter profile after signup
 */
export async function createSupporterProfile(
  userId: string,
  profileData: {
    bio: string;
    specialties: string[];
    education: string;
    languages?: string[];
    years_experience?: number;
    approach?: string;
  }
): Promise<boolean> {
  if (!supabase) return false;

  // Update main profile role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'supporter' })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile role:', profileError);
    return false;
  }

  // Create supporter details
  const { error: detailsError } = await supabase
    .from('supporter_details')
    .insert({
      supporter_id: userId,
      bio: profileData.bio,
      specialties: profileData.specialties,
      education: profileData.education,
      languages: profileData.languages || ['English'],
      years_experience: profileData.years_experience || 0,
      approach: profileData.approach || '',
      total_sessions: 0,
      is_available: false,
      accepting_clients: false,
      training_complete: false,
      total_earnings: 0,
      pending_payout: 0,
      session_types: ['chat', 'phone', 'video'],
      availability: {},
    });

  if (detailsError) {
    console.error('Error creating supporter details:', detailsError);
    return false;
  }

  return true;
}

/**
 * Update supporter details
 */
export async function updateSupporterDetails(
  supporterId: string,
  updates: Partial<{
    bio: string;
    specialties: string[];
    education: string;
    languages: string[];
    years_experience: number;
    approach: string;
    availability: Record<string, string[]>;
    session_types: SessionType[];
  }>
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('supporter_details')
    .update(updates)
    .eq('supporter_id', supporterId);

  if (error) {
    console.error('Error updating supporter details:', error);
    return false;
  }

  return true;
}

// ============================================
// AVAILABILITY & BOOKING CHECKS
// ============================================

/**
 * Get supporter's availability settings
 */
export async function getSupporterAvailability(supporterId: string): Promise<{
  availability: Record<string, string[]>;
  isAvailable: boolean;
  acceptingClients: boolean;
} | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('supporter_details')
    .select('availability, is_available, accepting_clients')
    .eq('supporter_id', supporterId)
    .single();

  if (error) {
    // If no row exists (PGRST116), return defaults
    if (error.code === 'PGRST116') {
      return {
        availability: {},
        isAvailable: true,
        acceptingClients: true,
      };
    }
    console.error('Error fetching supporter availability:', error);
    return null;
  }

  return {
    availability: data.availability || {},
    isAvailable: data.is_available ?? true,
    acceptingClients: data.accepting_clients ?? true,
  };
}

/**
 * Get booked sessions for a supporter on a specific date
 */
export async function getBookedSlotsForDate(
  supporterId: string,
  date: Date
): Promise<{ startTime: string; endTime: string; durationMinutes: number }[]> {
  if (!supabase) return [];

  // Get start and end of the day
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from('sessions')
    .select('scheduled_at, duration_minutes')
    .eq('supporter_id', supporterId)
    .in('status', ['scheduled', 'in_progress'])
    .gte('scheduled_at', startOfDay.toISOString())
    .lte('scheduled_at', endOfDay.toISOString());

  if (error) {
    console.error('Error fetching booked slots:', error);
    return [];
  }

  return (data || []).map((session: any) => {
    const scheduledAt = new Date(session.scheduled_at);
    const hours = scheduledAt.getHours();
    const minutes = scheduledAt.getMinutes();
    const durationMinutes = session.duration_minutes || 30;

    const endMinutes = minutes + durationMinutes;
    const endHours = hours + Math.floor(endMinutes / 60);
    const actualEndMinutes = endMinutes % 60;

    return {
      startTime: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      endTime: `${endHours.toString().padStart(2, '0')}:${actualEndMinutes.toString().padStart(2, '0')}`,
      durationMinutes,
    };
  });
}

/**
 * Check if a specific time slot is available for a supporter
 */
export function isSlotAvailable(
  slotStart: string,
  slotEnd: string,
  bookedSlots: { startTime: string; endTime: string }[]
): boolean {
  const parseTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const newStart = parseTime(slotStart);
  const newEnd = parseTime(slotEnd);

  for (const booked of bookedSlots) {
    const bookedStart = parseTime(booked.startTime);
    const bookedEnd = parseTime(booked.endTime);

    // Check for overlap
    if (newStart < bookedEnd && newEnd > bookedStart) {
      return false;
    }
  }

  return true;
}

/**
 * Check if a day is available based on supporter's availability settings
 */
export function isDayAvailable(
  date: Date,
  availability: Record<string, string[]>
): boolean {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];

  const daySlots = availability[dayName] || availability[dayName.charAt(0).toUpperCase() + dayName.slice(1)];

  return daySlots && daySlots.length > 0;
}

/**
 * Get available time slots for a supporter on a specific date
 */
export function getAvailableTimeSlots(
  date: Date,
  availability: Record<string, string[]>,
  bookedSlots: { startTime: string; endTime: string }[],
  sessionDurationMinutes: number
): { startTime: string; endTime: string; display: string }[] {
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];

  // Try both lowercase and capitalized day names
  const dayAvailability = availability[dayName] || availability[dayName.charAt(0).toUpperCase() + dayName.slice(1)] || [];

  if (dayAvailability.length === 0) {
    return [];
  }

  const slots: { startTime: string; endTime: string; display: string }[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  // Parse availability ranges and generate slots
  for (const range of dayAvailability) {
    // Handle different formats: "9:00-17:00", "09:00 - 17:00", etc.
    const parts = range.replace(/\s/g, '').split('-');
    if (parts.length !== 2) continue;

    const [rangeStart, rangeEnd] = parts;
    const [startHour, startMin] = rangeStart.split(':').map(Number);
    const [endHour, endMin] = rangeEnd.split(':').map(Number);

    // Generate 30-minute slots within the range
    for (let hour = startHour; hour < endHour || (hour === endHour && 0 < endMin); hour++) {
      for (let minute = (hour === startHour ? startMin : 0); minute < 60; minute += 30) {
        // Skip if past end time
        if (hour > endHour || (hour === endHour && minute >= endMin)) {
          break;
        }

        // Skip past times for today
        if (isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()))) {
          continue;
        }

        // Calculate end time for this slot
        const slotEndMinutes = minute + sessionDurationMinutes;
        const slotEndHour = hour + Math.floor(slotEndMinutes / 60);
        const slotEndMinute = slotEndMinutes % 60;

        // Skip if session would extend past availability window
        if (slotEndHour > endHour || (slotEndHour === endHour && slotEndMinute > endMin)) {
          continue;
        }

        const slotStart = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;

        // Check if slot is available (not already booked)
        if (isSlotAvailable(slotStart, slotEnd, bookedSlots)) {
          const displayHour = hour % 12 || 12;
          const ampm = hour >= 12 ? 'PM' : 'AM';

          slots.push({
            startTime: slotStart,
            endTime: slotEnd,
            display: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
          });
        }
      }
    }
  }

  return slots;
}

/**
 * Get available dates for a supporter (next N days)
 */
export async function getAvailableDatesForSupporter(
  supporterId: string,
  daysAhead: number = 14
): Promise<Date[]> {
  const supporterAvailability = await getSupporterAvailability(supporterId);

  if (!supporterAvailability || !supporterAvailability.acceptingClients) {
    return [];
  }

  const availableDates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    if (isDayAvailable(date, supporterAvailability.availability)) {
      availableDates.push(date);
    }
  }

  return availableDates;
}

// ============================================
// ADMIN QUERIES
// ============================================

/**
 * Get admin dashboard statistics
 */
export async function getAdminStats(): Promise<AdminStats> {
  if (!supabase) {
    return {
      totalUsers: 0,
      totalClients: 0,
      totalSupporters: 0,
      activeSupporters: 0,
      pendingSupporters: 0,
      totalSessions: 0,
      activeSessions: 0,
      completedSessions: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
    };
  }

  // Get user counts by role
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: totalClients } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client');

  const { count: totalSupporters } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'supporter');

  // Get active supporters (verified and accepting clients)
  const { count: activeSupporters } = await supabase
    .from('supporter_details')
    .select('*', { count: 'exact', head: true })
    .eq('training_complete', true)
    .eq('accepting_clients', true);

  // Get pending supporters (not yet verified)
  const { count: pendingSupporters } = await supabase
    .from('supporter_details')
    .select('*', { count: 'exact', head: true })
    .eq('is_verified', false);

  // Get session counts
  const { count: totalSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true });

  const { count: activeSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['scheduled', 'in_progress']);

  const { count: completedSessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Get revenue data
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'completed');

  const totalRevenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  // Calculate this month's revenue
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenue = (payments || [])
    .filter(p => new Date(p.created_at) >= startOfMonth)
    .reduce((sum, p) => sum + (p.amount || 0), 0) / 100;

  return {
    totalUsers: totalUsers || 0,
    totalClients: totalClients || 0,
    totalSupporters: totalSupporters || 0,
    activeSupporters: activeSupporters || 0,
    pendingSupporters: pendingSupporters || 0,
    totalSessions: totalSessions || 0,
    activeSessions: activeSessions || 0,
    completedSessions: completedSessions || 0,
    totalRevenue,
    monthlyRevenue,
  };
}

/**
 * Get all users for admin management
 */
export async function getAllUsers(
  filter?: 'all' | 'clients' | 'supporters' | 'pending'
): Promise<AdminUserListing[]> {
  if (!supabase) return [];

  let query = supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      role,
      created_at,
      supporter_details (
        training_complete,
        is_verified,
        accepting_clients,
        total_sessions
      )
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filter === 'clients') {
    query = query.eq('role', 'client');
  } else if (filter === 'supporters') {
    query = query.eq('role', 'supporter');
  } else if (filter === 'pending') {
    query = query.eq('role', 'supporter');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }

  let users = (data || []).map((user: any) => {
    const supporterDetails = user.supporter_details?.[0];
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name || 'Unknown',
      avatar_url: user.avatar_url,
      role: user.role as UserRole,
      created_at: user.created_at,
      is_active: true, // Could be tracked in a separate field
      last_login_at: null,
      training_complete: supporterDetails?.training_complete,
      is_verified: supporterDetails?.is_verified,
      accepting_clients: supporterDetails?.accepting_clients,
      total_sessions: supporterDetails?.total_sessions,
    };
  });

  // Filter pending supporters (not verified)
  if (filter === 'pending') {
    users = users.filter(u => u.role === 'supporter' && !u.is_verified);
  }

  return users;
}

/**
 * Get pending supporter applications
 */
export async function getPendingSupporters(): Promise<SupporterApplication[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      created_at,
      supporter_details (
        bio,
        specialties,
        education,
        languages,
        years_experience,
        training_complete,
        training_completed_at,
        is_verified
      )
    `)
    .eq('role', 'supporter');

  if (error) {
    console.error('Error fetching pending supporters:', error);
    return [];
  }

  return (data || [])
    .map((supporter: any) => {
      const details = supporter.supporter_details?.[0] || {};
      return {
        id: supporter.id,
        email: supporter.email,
        full_name: supporter.full_name || 'Unknown',
        avatar_url: supporter.avatar_url,
        created_at: supporter.created_at,
        bio: details.bio || '',
        specialties: details.specialties || [],
        education: details.education || '',
        languages: details.languages || ['English'],
        years_experience: details.years_experience || 0,
        training_complete: details.training_complete || false,
        training_completed_at: details.training_completed_at,
        is_verified: details.is_verified || false,
      };
    })
    .filter(s => !s.is_verified); // Only return unverified supporters
}

/**
 * Approve a supporter application
 */
export async function approveSupporter(supporterId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('supporter_details')
    .update({ is_verified: true })
    .eq('supporter_id', supporterId);

  if (error) {
    console.error('Error approving supporter:', error);
    return false;
  }

  return true;
}

/**
 * Reject/suspend a supporter
 */
export async function suspendUser(userId: string): Promise<boolean> {
  if (!supabase) return false;

  // For supporters, mark as not verified and not accepting clients
  const { error } = await supabase
    .from('supporter_details')
    .update({
      is_verified: false,
      accepting_clients: false
    })
    .eq('supporter_id', userId);

  if (error) {
    console.error('Error suspending user:', error);
    return false;
  }

  return true;
}

/**
 * Reactivate a user
 */
export async function reactivateUser(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('supporter_details')
    .update({ is_verified: true })
    .eq('supporter_id', userId);

  if (error) {
    console.error('Error reactivating user:', error);
    return false;
  }

  return true;
}

/**
 * Get all sessions for admin viewing
 */
export async function getAllSessions(
  filter?: 'all' | 'active' | 'completed' | 'cancelled'
): Promise<AdminSessionListing[]> {
  if (!supabase) return [];

  let query = supabase
    .from('sessions')
    .select(`
      id,
      client_id,
      supporter_id,
      session_type,
      scheduled_at,
      ended_at,
      duration_minutes,
      status,
      client:profiles!sessions_client_id_fkey (
        id,
        full_name,
        avatar_url
      ),
      supporter:profiles!sessions_supporter_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .order('scheduled_at', { ascending: false });

  // Apply status filter
  if (filter === 'active') {
    query = query.in('status', ['scheduled', 'in_progress']);
  } else if (filter === 'completed') {
    query = query.eq('status', 'completed');
  } else if (filter === 'cancelled') {
    query = query.in('status', ['cancelled', 'no_show']);
  }

  const { data, error } = await query.limit(100);

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return (data || []).map((session: any) => ({
    id: session.id,
    client_id: session.client_id,
    client_name: session.client?.full_name || 'Unknown',
    client_avatar: session.client?.avatar_url,
    supporter_id: session.supporter_id,
    supporter_name: session.supporter?.full_name || 'Unknown',
    supporter_avatar: session.supporter?.avatar_url,
    session_type: session.session_type,
    scheduled_at: session.scheduled_at,
    ended_at: session.ended_at,
    duration_minutes: session.duration_minutes,
    status: session.status,
    has_transcript: session.session_type === 'chat', // Chat sessions have transcripts
  }));
}

/**
 * Get chat transcript for a session
 */
export async function getSessionTranscript(sessionId: string): Promise<ChatTranscript | null> {
  if (!supabase) return null;

  // Get session info
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select(`
      id,
      session_type,
      scheduled_at,
      ended_at,
      duration_minutes,
      status,
      client:profiles!sessions_client_id_fkey (
        id,
        full_name
      ),
      supporter:profiles!sessions_supporter_id_fkey (
        id,
        full_name
      )
    `)
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    console.error('Error fetching session:', sessionError);
    return null;
  }

  // Get messages for this session's conversation
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      content,
      created_at
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  }

  const clientId = (session.client as any)?.id;
  const clientName = (session.client as any)?.full_name || 'Client';
  const supporterName = (session.supporter as any)?.full_name || 'Supporter';

  return {
    session_id: sessionId,
    messages: (messages || []).map((msg: any) => ({
      id: msg.id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_id === clientId ? clientName : supporterName,
      sender_role: msg.sender_id === clientId ? 'client' : 'supporter',
      content: msg.content,
      created_at: msg.created_at,
    })),
    session_info: {
      client_name: clientName,
      supporter_name: supporterName,
      session_type: session.session_type,
      scheduled_at: session.scheduled_at,
      ended_at: session.ended_at,
      status: session.status,
      duration_minutes: session.duration_minutes,
    },
  };
}

/**
 * Get revenue reports
 */
export async function getRevenueReports(period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueReport[]> {
  if (!supabase) return [];

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, created_at, description')
    .eq('status', 'completed')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount, created_at')
    .eq('status', 'completed');

  // Group by period
  const reports: { [key: string]: RevenueReport } = {};

  (payments || []).forEach((payment: any) => {
    const date = new Date(payment.created_at);
    let periodKey: string;

    if (period === 'daily') {
      periodKey = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!reports[periodKey]) {
      reports[periodKey] = {
        period: periodKey,
        total_revenue: 0,
        subscription_revenue: 0,
        session_revenue: 0,
        supporter_payouts: 0,
        net_revenue: 0,
        transaction_count: 0,
      };
    }

    const amount = (payment.amount || 0) / 100;
    reports[periodKey].total_revenue += amount;
    reports[periodKey].transaction_count += 1;

    // Categorize by description
    if (payment.description?.toLowerCase().includes('subscription')) {
      reports[periodKey].subscription_revenue += amount;
    } else {
      reports[periodKey].session_revenue += amount;
    }
  });

  // Add payouts
  (payouts || []).forEach((payout: any) => {
    const date = new Date(payout.created_at);
    let periodKey: string;

    if (period === 'daily') {
      periodKey = date.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      periodKey = weekStart.toISOString().split('T')[0];
    } else {
      periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (reports[periodKey]) {
      reports[periodKey].supporter_payouts += (payout.amount || 0) / 100;
    }
  });

  // Calculate net revenue
  Object.values(reports).forEach(report => {
    report.net_revenue = report.total_revenue - report.supporter_payouts;
  });

  return Object.values(reports).sort((a, b) => b.period.localeCompare(a.period));
}

/**
 * Get supporter detail for admin view (includes verification status)
 */
export async function getAdminSupporterDetail(supporterId: string): Promise<SupporterApplication | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      avatar_url,
      created_at,
      w9_completed,
      w9_completed_at,
      w9_data,
      supporter_details (
        bio,
        specialties,
        education,
        languages,
        years_experience,
        training_complete,
        training_completed_at,
        is_verified,
        total_sessions,
        total_earnings,
        approach,
        session_types
      )
    `)
    .eq('id', supporterId)
    .eq('role', 'supporter')
    .single();

  if (error) {
    console.error('Error fetching supporter detail:', error);
    return null;
  }

  const details = data.supporter_details?.[0] || {};

  return {
    id: data.id,
    email: data.email,
    full_name: data.full_name || 'Unknown',
    avatar_url: data.avatar_url,
    created_at: data.created_at,
    bio: details.bio || '',
    specialties: details.specialties || [],
    education: details.education || '',
    languages: details.languages || ['English'],
    years_experience: details.years_experience || 0,
    training_complete: details.training_complete || false,
    training_completed_at: details.training_completed_at,
    is_verified: details.is_verified || false,
    w9_completed: data.w9_completed || false,
    w9_completed_at: data.w9_completed_at,
    w9_data: data.w9_data,
  };
}

// ============================================
// SUPPORTER MATCHING ALGORITHM
// ============================================

/**
 * Client preferences from onboarding quiz
 */
export interface ClientPreferences {
  mood: number;
  topics: string[];
  communication_style: string;
  preferred_session_types: string[];
  scheduling_preference: string;
  preferred_times: string[];
  personality_preference: string;
  goals: string[];
  urgency: string;
  timezone: string;
}

/**
 * Matched supporter with compatibility score
 */
export interface MatchedSupporter extends SupporterListing {
  compatibilityScore: number;
  matchReasons: string[];
}

/**
 * Map client topic IDs to supporter specialty names
 * This ensures the quiz topics match the database specialties
 */
const topicToSpecialtyMap: Record<string, string[]> = {
  'anxiety': ['Anxiety'],
  'stress': ['Stress'],
  'depression': ['Depression'],
  'relationships': ['Relationships'],
  'loneliness': ['Loneliness'],
  'work_career': ['Work-Life Balance', 'Career'],
  'academic': ['Academic Pressure'],
  'self_esteem': ['Self-Esteem'],
  'family': ['Family Issues', 'Family'],
  'grief': ['Grief/Loss', 'Grief'],
  'transitions': ['Life Transitions', 'Transitions'],
  'identity': ['LGBTQ+', 'Identity', 'Coming Out'], // LGBTQ+ mapping
};

/**
 * Match supporters to a client based on their preferences
 * Returns sorted list of supporters with compatibility scores
 * Only matches supporters who have completed full onboarding
 */
export async function matchSupportersToClient(
  preferences: ClientPreferences
): Promise<MatchedSupporter[]> {
  if (!supabase) return [];

  // Get all available supporters who have completed onboarding
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      avatar_url,
      onboarding_complete,
      supporter_details (
        bio,
        specialties,
        education,
        languages,
        approach,
        total_sessions,
        is_available,
        is_verified,
        accepting_clients,
        training_complete,
        availability,
        session_types
      )
    `)
    .eq('role', 'supporter')
    .eq('onboarding_complete', true); // Must complete W9, bank, and training

  if (error) {
    console.error('Error fetching supporters for matching:', error);
    return [];
  }

  // Filter to only active supporters and calculate match scores
  const matchedSupporters: MatchedSupporter[] = [];

  for (const supporter of data || []) {
    const details = supporter.supporter_details?.[0];

    // Skip if not fully active (verified and accepting clients)
    if (!details?.accepting_clients || !details?.is_verified) {
      continue;
    }

    const supporterSpecialties = details.specialties || [];
    const supporterSessionTypes = details.session_types || ['chat', 'phone', 'video'];
    const supporterAvailability = details.availability || {};
    const supporterApproach = details.approach || '';

    let score = 0;
    const matchReasons: string[] = [];

    // 1. SPECIALTY/TOPIC MATCHING (most important - up to 40 points)
    let specialtyMatches = 0;
    for (const topic of preferences.topics) {
      const matchingSpecialties = topicToSpecialtyMap[topic] || [topic];

      for (const specialty of matchingSpecialties) {
        if (supporterSpecialties.some((s: string) =>
          s.toLowerCase() === specialty.toLowerCase()
        )) {
          specialtyMatches++;
          matchReasons.push(`Specializes in ${specialty}`);
          break; // Count each topic only once
        }
      }
    }

    if (preferences.topics.length > 0) {
      const specialtyScore = (specialtyMatches / preferences.topics.length) * 40;
      score += specialtyScore;
    }

    // 2. SESSION TYPE COMPATIBILITY (up to 20 points)
    const sessionTypeMatches = preferences.preferred_session_types.filter(
      type => supporterSessionTypes.includes(type)
    ).length;

    if (preferences.preferred_session_types.length > 0) {
      const sessionScore = (sessionTypeMatches / preferences.preferred_session_types.length) * 20;
      score += sessionScore;

      if (sessionTypeMatches === preferences.preferred_session_types.length) {
        matchReasons.push('Offers all your preferred session types');
      }
    }

    // 3. AVAILABILITY/TIME MATCHING (up to 20 points)
    const timeMatchScore = calculateTimeMatchScore(
      preferences.preferred_times,
      supporterAvailability
    );
    score += timeMatchScore;
    if (timeMatchScore >= 15) {
      matchReasons.push('Available when you need');
    }

    // 4. COMMUNICATION STYLE / APPROACH MATCHING (up to 15 points)
    const approachScore = calculateApproachMatchScore(
      preferences.communication_style,
      preferences.personality_preference,
      supporterApproach
    );
    score += approachScore;
    if (approachScore >= 10) {
      matchReasons.push('Communication style match');
    }

    // 5. CURRENT AVAILABILITY BONUS (up to 5 points)
    if (details.is_available) {
      score += 5;
      if (preferences.urgency === 'soon') {
        matchReasons.push('Available now');
      }
    }

    // Add all eligible supporters with their scores
    matchedSupporters.push({
      id: supporter.id,
      full_name: supporter.full_name,
      avatar_url: supporter.avatar_url,
      bio: details.bio || '',
      specialties: supporterSpecialties,
      education: details.education || '',
      total_sessions: details.total_sessions || 0,
      is_available: details.is_available || false,
      accepting_clients: details.accepting_clients || false,
      training_complete: details.training_complete || false,
      onboarding_complete: supporter.onboarding_complete || false,
      compatibilityScore: Math.round(score),
      matchReasons: matchReasons.length > 0 ? matchReasons.slice(0, 3) : ['Available to support you'],
    });
  }

  // Sort by compatibility score (highest first)
  matchedSupporters.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Always return at least one match if any supporters are available
  // Filter to high matches (score >= 15 or specialty match) but keep all if none qualify
  const highMatches = matchedSupporters.filter(s => s.compatibilityScore >= 15);

  if (highMatches.length > 0) {
    return highMatches;
  }

  // No high matches - return best available supporters anyway
  // Client will still get matched with whoever is most compatible
  return matchedSupporters;
}

/**
 * Calculate time/availability match score
 */
function calculateTimeMatchScore(
  preferredTimes: string[],
  supporterAvailability: Record<string, string[]>
): number {
  if (preferredTimes.length === 0) return 10; // No preference = flexible

  // Map preferred times to hour ranges
  const timeRanges: Record<string, { start: number; end: number }> = {
    'early_morning': { start: 6, end: 9 },
    'morning': { start: 9, end: 12 },
    'afternoon': { start: 12, end: 17 },
    'evening': { start: 17, end: 21 },
    'night': { start: 21, end: 24 },
  };

  let matchCount = 0;

  // Check if supporter has any availability in preferred time ranges
  for (const prefTime of preferredTimes) {
    if (prefTime === 'weekends') {
      // Check if supporter has weekend availability
      if (supporterAvailability['saturday'] || supporterAvailability['sunday'] ||
          supporterAvailability['Saturday'] || supporterAvailability['Sunday']) {
        matchCount++;
      }
      continue;
    }

    const range = timeRanges[prefTime];
    if (!range) continue;

    // Check each day's availability
    for (const slots of Object.values(supporterAvailability)) {
      if (!Array.isArray(slots)) continue;

      for (const slot of slots) {
        // Parse time slot (e.g., "09:00" or "9:00-17:00")
        const hour = parseInt(slot.split(':')[0], 10);
        if (hour >= range.start && hour < range.end) {
          matchCount++;
          break;
        }
      }
    }
  }

  // Calculate score based on matches
  if (preferredTimes.length > 0) {
    return Math.min(20, (matchCount / preferredTimes.length) * 20);
  }
  return 0;
}

/**
 * Calculate communication style / approach match score
 */
function calculateApproachMatchScore(
  communicationStyle: string,
  personalityPreference: string,
  supporterApproach: string
): number {
  if (!supporterApproach) return 5; // Neutral score if no approach defined

  const approachLower = supporterApproach.toLowerCase();
  let score = 0;

  // Match communication style keywords
  const styleKeywords: Record<string, string[]> = {
    'direct': ['practical', 'actionable', 'direct', 'solution', 'goal'],
    'empathetic': ['empathy', 'listen', 'understand', 'support', 'validate', 'safe'],
    'balanced': ['balance', 'both', 'combine', 'flexible', 'adapt'],
    'exploratory': ['explore', 'reflect', 'question', 'understand', 'insight', 'discover'],
  };

  const personalityKeywords: Record<string, string[]> = {
    'warm': ['warm', 'caring', 'nurturing', 'gentle', 'compassion', 'comfort'],
    'motivating': ['motivat', 'energy', 'uplift', 'encourage', 'action', 'positive'],
    'calm': ['calm', 'peace', 'steady', 'ground', 'reassur', 'relax'],
    'analytical': ['analytic', 'logic', 'thought', 'method', 'insight', 'understand'],
  };

  // Check communication style match
  const styleWords = styleKeywords[communicationStyle] || [];
  for (const keyword of styleWords) {
    if (approachLower.includes(keyword)) {
      score += 5;
      break;
    }
  }

  // Check personality match
  const personalityWords = personalityKeywords[personalityPreference] || [];
  for (const keyword of personalityWords) {
    if (approachLower.includes(keyword)) {
      score += 5;
      break;
    }
  }

  // General approach quality bonus
  if (supporterApproach.length > 50) {
    score += 5; // Detailed approach shows dedication
  }

  return Math.min(15, score);
}

/**
 * Get the best matched supporter for a client
 * Returns the top match or null if no suitable matches
 */
export async function getBestMatchForClient(
  preferences: ClientPreferences
): Promise<MatchedSupporter | null> {
  const matches = await matchSupportersToClient(preferences);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Save client preferences to database for future reference
 */
export async function saveClientPreferences(
  clientId: string,
  preferences: ClientPreferences
): Promise<boolean> {
  if (!supabase) return false;

  // Store preferences in a client_preferences table or as JSON in profiles
  const { error } = await supabase
    .from('client_preferences')
    .upsert({
      client_id: clientId,
      preferences: preferences,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    // If table doesn't exist, store in profiles metadata
    console.log('client_preferences table not found, storing in profiles');
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        preferences: preferences,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (profileError) {
      console.error('Error saving preferences:', profileError);
      return false;
    }
  }

  return true;
}

/**
 * Assign a supporter to a client (create the match)
 */
export async function assignSupporterToClient(
  clientId: string,
  supporterId: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('client_assignments')
    .upsert({
      client_id: clientId,
      supporter_id: supporterId,
      status: 'active',
      started_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Error assigning supporter:', error);
    return false;
  }

  return true;
}

/**
 * Get the client's current active supporter assignment
 */
export async function getClientCurrentAssignment(
  clientId: string
): Promise<ClientAssignment | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('client_assignments')
    .select(`
      *,
      supporter:profiles!client_assignments_supporter_id_fkey (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    // Silently handle if table doesn't exist yet
    if (error.code !== '42P01') {
      console.error('Error fetching client assignment:', error);
    }
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    supporter_id: data.supporter_id,
    client_id: data.client_id,
    client_name: '', // Not needed for this query
    client_email: '',
    client_avatar: null,
    status: data.status,
    sessions_completed: data.sessions_completed || 0,
    started_at: data.started_at,
    last_session_date: data.last_session_date,
    notes: data.notes,
  };
}

/**
 * End/pause a client's current supporter assignment
 */
export async function endClientAssignment(
  clientId: string,
  supporterId: string,
  reason: 'client_requested' | 'supporter_requested' | 'admin' | 'completed' = 'client_requested'
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true }; // Demo mode
  }

  const { error } = await supabase
    .from('client_assignments')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      end_reason: reason,
    })
    .eq('client_id', clientId)
    .eq('supporter_id', supporterId)
    .eq('status', 'active');

  if (error) {
    // Silently handle if table doesn't exist yet
    if (error.code !== '42P01') {
      console.error('Error ending client assignment:', error);
    }
    return { success: false, error: 'Failed to end assignment' };
  }

  return { success: true };
}

/**
 * Request a new supporter - ends current assignment and finds a new match
 * Returns the new supporter info if successful
 */
export async function requestSupporterReassignment(
  clientId: string,
  preferences: Partial<ClientPreferences>,
  currentSupporterId?: string
): Promise<{ success: boolean; newSupporter?: MatchedSupporter; error?: string }> {
  if (!supabase) {
    // Demo mode - return mock success
    return {
      success: true,
      newSupporter: {
        id: 'demo_new_supporter',
        full_name: 'New Supporter',
        avatar_url: null,
        bio: 'Your new matched supporter',
        specialties: ['Anxiety', 'Stress'],
        education: 'Psychology Student',
        total_sessions: 0,
        is_available: true,
        accepting_clients: true,
        training_complete: true,
        onboarding_complete: true,
        compatibilityScore: 85,
        matchReasons: ['Based on your updated preferences'],
      },
    };
  }

  try {
    // Step 1: End the current assignment if one exists
    if (currentSupporterId) {
      const endResult = await endClientAssignment(clientId, currentSupporterId, 'client_requested');
      if (!endResult.success) {
        console.warn('Could not end previous assignment:', endResult.error);
        // Continue anyway - the old assignment might not exist
      }
    }

    // Step 2: Build full preferences with defaults for missing values
    const fullPreferences: ClientPreferences = {
      mood: preferences.mood ?? 3,
      topics: preferences.topics ?? [],
      communication_style: preferences.communication_style ?? 'balanced',
      preferred_session_types: preferences.preferred_session_types ?? ['chat', 'phone', 'video'],
      scheduling_preference: preferences.scheduling_preference ?? 'flexible',
      preferred_times: preferences.preferred_times ?? ['morning', 'afternoon', 'evening'],
      personality_preference: preferences.personality_preference ?? 'warm',
      goals: preferences.goals ?? ['connection'],
      urgency: preferences.urgency ?? 'moderate',
      timezone: preferences.timezone ?? 'America/New_York',
    };

    // Step 3: Find a new match based on preferences, excluding the old supporter
    const matches = await matchSupportersToClient(fullPreferences);

    // Filter out the current supporter from matches
    const availableMatches = currentSupporterId
      ? matches.filter(m => m.id !== currentSupporterId)
      : matches;

    if (availableMatches.length === 0) {
      return {
        success: false,
        error: 'No available supporters match your preferences. Please try adjusting your preferences or try again later.'
      };
    }

    // Step 4: Get the best match
    const newSupporter = availableMatches[0];

    // Step 5: Create the new assignment
    const assigned = await assignSupporterToClient(clientId, newSupporter.id);
    if (!assigned) {
      return { success: false, error: 'Failed to assign new supporter' };
    }

    // Step 6: Optionally notify the old supporter (via notification system)
    // This would be implemented when push notifications are set up
    // await createNotification(currentSupporterId, 'Client has been reassigned', ...);

    return { success: true, newSupporter };
  } catch (error) {
    console.error('Error in supporter reassignment:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============================================
// USER SAFETY: REPORT & BLOCK
// ============================================

/**
 * Report a user for inappropriate behavior
 */
export async function reportUser(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description: string,
  sessionId?: string
): Promise<UserReport | null> {
  if (!supabase) {
    console.error('Supabase not initialized');
    return null;
  }

  const { data, error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: reporterId,
      reported_user_id: reportedUserId,
      reason,
      description,
      session_id: sessionId || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error reporting user:', error);
    return null;
  }

  return data;
}

/**
 * Block a user
 */
export async function blockUser(
  blockerId: string,
  blockedUserId: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_blocks')
    .insert({
      blocker_id: blockerId,
      blocked_user_id: blockedUserId,
    });

  if (error) {
    // If already blocked, that's okay
    if (error.code === '23505') {
      return true;
    }
    console.error('Error blocking user:', error);
    return false;
  }

  return true;
}

/**
 * Unblock a user
 */
export async function unblockUser(
  blockerId: string,
  blockedUserId: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('user_blocks')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', blockedUserId);

  if (error) {
    console.error('Error unblocking user:', error);
    return false;
  }

  return true;
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(
  blockerId: string,
  blockedUserId: string
): Promise<boolean> {
  if (!supabase) return false;

  const { data, error } = await supabase
    .from('user_blocks')
    .select('id')
    .eq('blocker_id', blockerId)
    .eq('blocked_user_id', blockedUserId)
    .maybeSingle();

  if (error) {
    console.error('Error checking block status:', error);
    return false;
  }

  return !!data;
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(userId: string): Promise<UserBlock[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('user_blocks')
    .select('*')
    .eq('blocker_id', userId);

  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }

  return data || [];
}

// ============================================
// RESCHEDULE REQUESTS
// ============================================

/**
 * Calculate the response deadline (3 hours before original session time)
 */
export function calculateResponseDeadline(originalScheduledAt: string): Date {
  const sessionTime = new Date(originalScheduledAt);
  const deadline = new Date(sessionTime.getTime() - (3 * 60 * 60 * 1000)); // 3 hours before
  return deadline;
}

/**
 * Check if a reschedule request has expired
 */
export function isRescheduleRequestExpired(request: RescheduleRequest): boolean {
  const deadline = new Date(request.response_deadline);
  return new Date() > deadline;
}

/**
 * Create a reschedule request
 */
export async function createRescheduleRequest(
  sessionId: string,
  supporterId: string,
  clientId: string,
  originalScheduledAt: string,
  proposedScheduledAt: string,
  reason?: string
): Promise<RescheduleRequest | null> {
  if (!supabase) {
    // Demo mode - return mock data
    const responseDeadline = calculateResponseDeadline(originalScheduledAt);
    return {
      id: 'rr_demo_' + Date.now(),
      session_id: sessionId,
      supporter_id: supporterId,
      client_id: clientId,
      original_scheduled_at: originalScheduledAt,
      proposed_scheduled_at: proposedScheduledAt,
      status: 'pending',
      reason,
      response_deadline: responseDeadline.toISOString(),
      created_at: new Date().toISOString(),
    };
  }

  const responseDeadline = calculateResponseDeadline(originalScheduledAt);

  const { data, error } = await supabase
    .from('reschedule_requests')
    .insert({
      session_id: sessionId,
      supporter_id: supporterId,
      client_id: clientId,
      original_scheduled_at: originalScheduledAt,
      proposed_scheduled_at: proposedScheduledAt,
      status: 'pending',
      reason,
      response_deadline: responseDeadline.toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Silently handle if table doesn't exist yet (code 42P01)
    if (error.code !== '42P01') {
      console.error('Error creating reschedule request:', error);
    }
    return null;
  }

  return data;
}

/**
 * Get pending reschedule requests for a client
 */
export async function getPendingRescheduleRequests(
  clientId: string
): Promise<RescheduleRequestWithDetails[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reschedule_requests')
    .select(`
      *,
      session:sessions(*),
      supporter:profiles!reschedule_requests_supporter_id_fkey (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('client_id', clientId)
    .eq('status', 'pending')
    .order('response_deadline', { ascending: true });

  if (error) {
    // Silently handle if table doesn't exist yet (code 42P01)
    if (error.code !== '42P01') {
      console.error('Error fetching reschedule requests:', error);
    }
    return [];
  }

  return data || [];
}

/**
 * Get reschedule request by session ID
 */
export async function getRescheduleRequestBySession(
  sessionId: string
): Promise<RescheduleRequest | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('reschedule_requests')
    .select('*')
    .eq('session_id', sessionId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    // Silently handle if table doesn't exist yet (code 42P01)
    if (error.code !== '42P01') {
      console.error('Error fetching reschedule request:', error);
    }
    return null;
  }

  return data;
}

/**
 * Accept a reschedule request
 */
export async function acceptRescheduleRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  // Get the request first
  const { data: request, error: fetchError } = await supabase
    .from('reschedule_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    return { success: false, error: 'Request not found' };
  }

  // Check if expired
  if (isRescheduleRequestExpired(request)) {
    return { success: false, error: 'Request has expired' };
  }

  // Update the request status
  const { error: updateError } = await supabase
    .from('reschedule_requests')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (updateError) {
    // Silently handle if table doesn't exist yet (code 42P01)
    if (updateError.code !== '42P01') {
      console.error('Error accepting reschedule request:', updateError);
    }
    return { success: false, error: 'Failed to accept request' };
  }

  // Update the session with new time
  const { error: sessionError } = await supabase
    .from('sessions')
    .update({
      scheduled_at: request.proposed_scheduled_at,
    })
    .eq('id', request.session_id);

  if (sessionError) {
    console.error('Error updating session:', sessionError);
    return { success: false, error: 'Failed to update session time' };
  }

  return { success: true };
}

/**
 * Decline a reschedule request (keeps original time)
 */
export async function declineRescheduleRequest(
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: true };
  }

  const { error } = await supabase
    .from('reschedule_requests')
    .update({
      status: 'declined',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId);

  if (error) {
    // Silently handle if table doesn't exist yet (code 42P01)
    if (error.code !== '42P01') {
      console.error('Error declining reschedule request:', error);
    }
    return { success: false, error: 'Failed to decline request' };
  }

  return { success: true };
}

/**
 * Process expired reschedule requests - auto-cancel sessions and refund
 * This should be called periodically (on app load, or via a background job)
 */
export async function processExpiredRescheduleRequests(
  clientId?: string
): Promise<{ processed: number; cancelled: string[] }> {
  if (!supabase) {
    return { processed: 0, cancelled: [] };
  }

  // Get all pending requests that have passed their deadline
  let query = supabase
    .from('reschedule_requests')
    .select('*')
    .eq('status', 'pending')
    .lt('response_deadline', new Date().toISOString());

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: expiredRequests, error } = await query;

  if (error) {
    // Silently handle if table doesn't exist yet (code 42P01)
    if (error.code !== '42P01') {
      console.error('Error fetching expired requests:', error);
    }
    return { processed: 0, cancelled: [] };
  }

  const cancelled: string[] = [];

  for (const request of expiredRequests || []) {
    // Mark request as expired/auto-cancelled
    await supabase
      .from('reschedule_requests')
      .update({
        status: 'auto_cancelled',
        responded_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    // Cancel the session
    await supabase
      .from('sessions')
      .update({
        status: 'cancelled',
      })
      .eq('id', request.session_id);

    cancelled.push(request.session_id);
  }

  return { processed: expiredRequests?.length || 0, cancelled };
}

/**
 * Get time remaining until response deadline
 */
export function getTimeUntilDeadline(responseDeadline: string): {
  hours: number;
  minutes: number;
  isExpired: boolean;
  formatted: string;
} {
  const deadline = new Date(responseDeadline);
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, isExpired: true, formatted: 'Expired' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let formatted: string;
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m remaining`;
  } else {
    formatted = `${minutes}m remaining`;
  }

  return { hours, minutes, isExpired: false, formatted };
}
