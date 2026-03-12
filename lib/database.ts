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
 * Profile completion status for clients
 * Required: full_name, email
 */
export interface ClientProfileCompletion {
  isComplete: boolean;
  missingFields: string[];
  firstName: string | null;
  lastName: string | null;
  email: string | null;
}

/**
 * Profile completion status for supporters
 * Required: full_name, email (in profiles); bio, avatar_url, specialties, availability (in supporter_details)
 */
export interface SupporterProfileCompletion {
  isComplete: boolean;
  missingFields: string[];
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  specialties: string[] | null;
  hasAvailability: boolean;
  // Education fields
  schoolName: string | null;
  major: string | null;
  yearsAttending: number | null;
  expectedGraduation: string | null;
}

/**
 * Check if a client's profile is complete
 * Required fields: full_name (parsed as first/last), email
 */
export async function checkClientProfileCompletion(
  userId: string,
  retryCount: number = 3
): Promise<ClientProfileCompletion> {
  if (!supabase) {
    return {
      isComplete: false,
      missingFields: ['Database not configured'],
      firstName: null,
      lastName: null,
      email: null,
    };
  }

  let data = null;
  let error = null;

  // Retry logic to handle race condition after signup
  for (let attempt = 0; attempt < retryCount; attempt++) {
    const result = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', userId)
      .single();

    data = result.data;
    error = result.error;

    if (data) break; // Success, exit retry loop

    // Wait before retrying (500ms, 1000ms, 1500ms)
    if (attempt < retryCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  if (error || !data) {
    return {
      isComplete: false,
      missingFields: ['Profile not found'],
      firstName: null,
      lastName: null,
      email: null,
    };
  }

  // Parse name from full_name
  const nameParts = (data.full_name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  const missingFields: string[] = [];
  if (!firstName?.trim()) missingFields.push('First Name');
  if (!lastName?.trim()) missingFields.push('Last Name');
  if (!data.email?.trim()) missingFields.push('Email');

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    firstName: firstName?.trim() || null,
    lastName: lastName?.trim() || null,
    email: data.email || null,
  };
}

/**
 * Check if a supporter's profile is complete
 * Required: full_name, email (in profiles); bio, avatar_url, specialties, availability (in supporter_details)
 */
export async function checkSupporterProfileCompletion(
  userId: string,
  retryCount: number = 3
): Promise<SupporterProfileCompletion> {
  if (!supabase) {
    return {
      isComplete: false,
      missingFields: ['Database not configured'],
      firstName: null,
      lastName: null,
      email: null,
      bio: null,
      avatarUrl: null,
      specialties: null,
      hasAvailability: false,
      schoolName: null,
      major: null,
      yearsAttending: null,
      expectedGraduation: null,
    };
  }

  let profileData = null;
  let profileError = null;

  // Retry logic to handle race condition after signup
  for (let attempt = 0; attempt < retryCount; attempt++) {
    const result = await supabase
      .from('profiles')
      .select('full_name, email, avatar_url')
      .eq('id', userId)
      .single();

    profileData = result.data;
    profileError = result.error;

    if (profileData) break; // Success, exit retry loop

    // Wait before retrying (500ms, 1000ms, 1500ms)
    if (attempt < retryCount - 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  // Fetch supporter details (no retry needed - may not exist yet for new users)
  const { data: detailsData } = await supabase
    .from('supporter_details')
    .select('bio, specialties, availability, school_name, major, years_attending, expected_graduation')
    .eq('supporter_id', userId)
    .single();

  if (profileError || !profileData) {
    return {
      isComplete: false,
      missingFields: ['Profile not found'],
      firstName: null,
      lastName: null,
      email: null,
      bio: null,
      avatarUrl: null,
      specialties: null,
      hasAvailability: false,
      schoolName: null,
      major: null,
      yearsAttending: null,
      expectedGraduation: null,
    };
  }

  // Parse name from full_name
  const nameParts = (profileData.full_name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  const bio = detailsData?.bio || null;
  const specialties = detailsData?.specialties || null;
  const availability = detailsData?.availability || null;
  const hasAvailability = availability && Object.keys(availability).length > 0;

  // Education fields
  const schoolName = detailsData?.school_name || null;
  const major = detailsData?.major || null;
  const yearsAttending = detailsData?.years_attending || null;
  const expectedGraduation = detailsData?.expected_graduation || null;

  const missingFields: string[] = [];
  if (!firstName?.trim()) missingFields.push('First Name');
  if (!lastName?.trim()) missingFields.push('Last Name');
  if (!profileData.email?.trim()) missingFields.push('Email');
  if (!bio?.trim()) missingFields.push('Bio');
  // Profile photo is optional during initial setup - can be added later
  // This prevents redirect loops if photo upload fails
  if (!specialties || specialties.length === 0) missingFields.push('Specialties');
  if (!hasAvailability) missingFields.push('Availability');
  // Education fields are required for supporters
  if (!schoolName?.trim()) missingFields.push('School Name');
  if (!major?.trim()) missingFields.push('Major');
  if (!yearsAttending) missingFields.push('Years Attending');
  if (!expectedGraduation?.trim()) missingFields.push('Expected Graduation');

  return {
    isComplete: missingFields.length === 0,
    missingFields,
    firstName: firstName?.trim() || null,
    lastName: lastName?.trim() || null,
    email: profileData.email || null,
    bio: bio?.trim() || null,
    avatarUrl: profileData.avatar_url || null,
    specialties,
    hasAvailability,
    // Education fields
    schoolName: schoolName?.trim() || null,
    major: major?.trim() || null,
    yearsAttending,
    expectedGraduation: expectedGraduation?.trim() || null,
  };
}

/**
 * Upload avatar image to Supabase storage and update profile
 * Returns the public URL of the uploaded image or null on failure
 */
export async function uploadAvatar(
  userId: string,
  imageUri: string
): Promise<string | null> {
  if (!supabase) return null;

  try {
    // Import dependencies - use legacy API for expo-file-system v54+
    const FileSystem = require('expo-file-system/legacy');
    const { decode } = require('base64-arraybuffer');

    // Read file as base64 using the legacy FileSystem API
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Generate unique filename
    const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    // Upload to Supabase storage using base64-arraybuffer decode
    // This is the recommended approach for React Native
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64Data), {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2));
      // Provide specific error message
      if (uploadError.message?.includes('Bucket not found')) {
        throw new Error('Storage not configured. Please contact support.');
      }
      if (uploadError.message?.includes('row-level security') || uploadError.message?.includes('policy')) {
        throw new Error('Permission denied. Please sign out and sign in again.');
      }
      if (uploadError.message?.includes('exceeded') || uploadError.message?.includes('size')) {
        throw new Error('Image is too large. Please use a smaller image (max 5MB).');
      }
      throw new Error(uploadError.message || 'Failed to upload image');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;

    if (publicUrl) {
      // Update profile with new avatar URL
      console.log('Updating profile with avatar URL:', publicUrl);

      // Don't use .select() as RLS might block it even if UPDATE succeeds
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);
        console.error('Update error code:', updateError.code);
        console.error('Update error details:', updateError.details);
        console.error('Update error hint:', updateError.hint);
        // Delete the uploaded file since we couldn't update the profile
        await supabase.storage.from('avatars').remove([filePath]);
        throw new Error(`Failed to save avatar to profile: ${updateError.message}`);
      }

      // Verify the update worked by fetching the profile
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (verifyError) {
        console.warn('Could not verify avatar update, but it may have succeeded:', verifyError);
        // Don't throw - the upload succeeded and the update didn't return an error
      } else if (verifyData?.avatar_url !== publicUrl) {
        console.warn('Avatar URL verification mismatch - expected:', publicUrl, 'got:', verifyData?.avatar_url);
        // Still return success - the upload and update didn't error
      } else {
        console.log('Profile avatar updated and verified successfully');
      }

      return publicUrl;
    }

    return null;
  } catch (error) {
    console.error('Error in uploadAvatar:', error);
    throw error; // Re-throw so UI can show error message
  }
}

/**
 * Update user avatar URL directly (for cases where image is already hosted)
 */
export async function updateAvatarUrl(
  userId: string,
  avatarUrl: string | null
): Promise<boolean> {
  if (!supabase) return false;

  // Don't use .select() as RLS might block it even if UPDATE succeeds
  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating avatar URL:', error);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    return false;
  }

  console.log('Avatar URL updated successfully');
  return true;
}

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

  const details = data.supporter_details || {};
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
 * - Have verified documents (transcript + ID approved by admin)
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
      stripe_connect_id,
      stripe_connect_status,
      stripe_payouts_enabled,
      supporter_details (
        bio,
        specialties,
        education,
        total_sessions,
        is_available,
        accepting_clients,
        training_complete,
        verification_status
      )
    `)
    .eq('role', 'supporter')
    .eq('onboarding_complete', true) // Must complete W9, bank, and training
    .eq('supporter_details.accepting_clients', true)
    .eq('supporter_details.verification_status', 'approved') // Must have verified documents
    .eq('stripe_payouts_enabled', true); // Must have Stripe Connect fully set up for payouts

  if (error) {
    console.error('Error fetching supporters:', error);
    return [];
  }

  // Transform and flatten the data - only include supporters with active Stripe Connect
  return (data || [])
    .filter((supporter) => supporter.stripe_connect_id && supporter.stripe_payouts_enabled) // Verify Stripe Connect is active
    .map((supporter) => {
      const details = (supporter.supporter_details || {}) as any;
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
        verification_status: details.verification_status || 'not_submitted',
        stripe_connect_id: supporter.stripe_connect_id,
        stripe_connect_status: supporter.stripe_connect_status || null,
        stripe_payouts_enabled: supporter.stripe_payouts_enabled || false,
      };
    });
}

/**
 * Search supporters by name or specialty
 * Only returns supporters who have completed onboarding and verification
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
      stripe_connect_id,
      stripe_connect_status,
      stripe_payouts_enabled,
      supporter_details (
        bio,
        specialties,
        education,
        total_sessions,
        is_available,
        accepting_clients,
        training_complete,
        verification_status
      )
    `)
    .eq('role', 'supporter')
    .eq('onboarding_complete', true) // Must complete W9, bank, and training
    .eq('supporter_details.accepting_clients', true)
    .eq('supporter_details.verification_status', 'approved') // Must have verified documents
    .eq('stripe_payouts_enabled', true); // Must have Stripe Connect fully set up for payouts

  // Add name search if query provided
  if (query) {
    queryBuilder = queryBuilder.ilike('full_name', `%${query}%`);
  }

  const { data, error } = await queryBuilder;

  if (error) {
    console.error('Error searching supporters:', error);
    return [];
  }

  // Filter by specialty in memory (JSON array filtering) - only include supporters with Stripe Connect
  let results = (data || [])
    .filter((supporter) => supporter.stripe_connect_id && supporter.stripe_payouts_enabled) // Verify Stripe Connect is active
    .map((supporter) => {
      const details = (supporter.supporter_details || {}) as any;
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
        verification_status: details.verification_status || 'not_submitted',
        stripe_connect_id: supporter.stripe_connect_id,
        stripe_connect_status: supporter.stripe_connect_status || null,
        stripe_payouts_enabled: supporter.stripe_payouts_enabled || false,
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

  // Query profiles for basic info including Stripe Connect status
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, stripe_connect_id, stripe_connect_status, stripe_payouts_enabled')
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
      session_types,
      verification_status
    `)
    .eq('supporter_id', supporterId)
    .single();

  // Details may not exist yet for new supporters - that's ok
  const details = detailsData as {
    bio?: string;
    specialties?: string[];
    education?: string;
    languages?: string[];
    years_experience?: number;
    approach?: string;
    total_sessions?: number;
    is_available?: boolean;
    accepting_clients?: boolean;
    training_complete?: boolean;
    availability?: { [key: string]: string[] };
    session_types?: SessionType[];
    verification_status?: 'not_submitted' | 'pending_review' | 'approved' | 'rejected';
  } | null;

  // Fetch reviews/feedback separately
  const reviews = await getSupporterReviews(supporterId);

  return {
    id: profileData.id,
    full_name: profileData.full_name,
    avatar_url: profileData.avatar_url,
    stripe_connect_id: profileData.stripe_connect_id || null,
    stripe_connect_status: profileData.stripe_connect_status || null,
    stripe_payouts_enabled: profileData.stripe_payouts_enabled || false,
    bio: details?.bio || '',
    specialties: details?.specialties || [],
    education: details?.education || '',
    languages: details?.languages || ['English'],
    years_experience: details?.years_experience || 0,
    approach: details?.approach || '',
    total_sessions: details?.total_sessions || 0,
    is_available: details?.is_available || false,
    accepting_clients: details?.accepting_clients || false,
    training_complete: details?.training_complete || false,
    onboarding_complete: details?.training_complete || false, // Use training_complete as proxy
    verification_status: details?.verification_status || 'not_submitted',
    availability: details?.availability || {} as { [key: string]: string[] },
    session_types: details?.session_types || ['chat', 'phone', 'video'] as SessionType[],
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

/**
 * Save supporter's weekly availability schedule
 * @param supporterId - The supporter's user ID
 * @param schedule - Record of day names to arrays of time strings (e.g., { Monday: ['09:00', '10:00', '11:00'] })
 */
export async function saveSupporterSchedule(
  supporterId: string,
  schedule: Record<string, string[]>
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
      .update({ availability: schedule })
      .eq('supporter_id', supporterId);

    if (error) {
      console.error('Error updating supporter schedule:', error);
      return false;
    }
  } else {
    // Row doesn't exist, insert it
    const { error } = await supabase
      .from('supporter_details')
      .insert({
        supporter_id: supporterId,
        availability: schedule,
      });

    if (error) {
      console.error('Error inserting supporter schedule:', error);
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
  durationMinutes: number,
  paymentIntentId?: string
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
      stripe_payment_intent_id: paymentIntentId || null,
      // If we have a payment intent, payment already succeeded (webhook already processed)
      payment_status: paymentIntentId ? 'completed' : 'pending',
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
  status: Session['status'],
  additionalFields?: { ended_at?: string; room_url?: string }
): Promise<boolean> {
  if (!supabase) return false;

  const updateData: Record<string, unknown> = { status };
  if (additionalFields?.ended_at) {
    updateData.ended_at = additionalFields.ended_at;
  }
  if (additionalFields?.room_url) {
    updateData.room_url = additionalFields.room_url;
  }

  const { error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session status:', error);
    return false;
  }

  return true;
}

/**
 * Update session room URL (for video/voice calls)
 */
export async function updateSessionRoomUrl(
  sessionId: string,
  roomUrl: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('sessions')
    .update({
      room_url: roomUrl,
      status: 'in_progress'
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session room URL:', error);
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
    const now = new Date().toISOString();

    // Update supporter_details
    await supabase
      .from('supporter_details')
      .update({
        training_complete: true,
        training_completed_at: now,
      })
      .eq('supporter_id', supporterId);

    // Also update profiles table for the onboarding checklist
    await supabase
      .from('profiles')
      .update({
        training_complete: true,
        updated_at: now,
      })
      .eq('id', supporterId);

    // Check if all onboarding requirements are now met
    await checkAndCompleteOnboarding(supporterId);
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
    const supporterDetails = user.supporter_details;
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
        is_verified,
        verification_status,
        verification_submitted_at,
        transcript_url,
        id_document_url
      )
    `)
    .eq('role', 'supporter');

  if (error) {
    console.error('Error fetching pending supporters:', error);
    return [];
  }

  const result = (data || [])
    .map((supporter: any) => {
      const details = supporter.supporter_details || {};
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
        verification_status: details.verification_status || 'not_submitted',
        verification_submitted_at: details.verification_submitted_at,
        transcript_url: details.transcript_url,
        id_document_url: details.id_document_url,
      };
    })
    .filter(s => !s.is_verified); // Only return unverified supporters

  return result;
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
 * Delete a user account (admin only)
 * Calls the delete-user Edge Function which uses service role to delete from auth.users
 * This cascades to profiles -> supporter_details -> all related tables
 */
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not initialized' };

  try {
    // Call the delete-user Edge Function
    // This requires admin role and uses service role key to delete from auth.users
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { userId },
    });

    if (error) {
      console.error('Error calling delete-user function:', error);
      return { success: false, error: `Function error: ${error.message}` };
    }

    // Check for error in response body
    if (data?.error) {
      console.error('Delete user failed:', data.error, data.details);
      return { success: false, error: `${data.error}${data.details ? ': ' + data.details : ''}` };
    }

    // Verify success
    if (data?.success) {
      console.log('User deleted successfully:', data.message);
      return { success: true };
    }

    console.error('Unexpected response from delete-user:', data);
    return { success: false, error: 'Unexpected response from server' };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
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
      verification_status,
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
        session_types,
        school_name,
        major,
        years_attending,
        expected_graduation,
        verification_status,
        verification_submitted_at,
        verification_rejection_reason,
        transcript_url,
        id_document_url
      )
    `)
    .eq('id', supporterId)
    .eq('role', 'supporter')
    .single();

  if (error) {
    console.error('Error fetching supporter detail:', error);
    return null;
  }

  const details = (data.supporter_details || {}) as any;

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
    // Prefer supporter_details.verification_status (source of truth for submissions)
    // Fall back to profiles.verification_status for newer data
    verification_status: details.verification_status || data.verification_status || 'not_submitted',
    // These fields are in supporter_details
    verification_submitted_at: details.verification_submitted_at,
    verification_rejection_reason: details.verification_rejection_reason,
    transcript_url: details.transcript_url,
    id_document_url: details.id_document_url,
    school_name: details.school_name,
    major: details.major,
    years_attending: details.years_attending,
    expected_graduation: details.expected_graduation,
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
      stripe_connect_id,
      stripe_connect_status,
      stripe_payouts_enabled,
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
        session_types,
        verification_status
      )
    `)
    .eq('role', 'supporter')
    .eq('onboarding_complete', true) // Must complete W9, bank, and training
    .eq('stripe_payouts_enabled', true); // Must have Stripe Connect fully set up for payouts

  if (error) {
    console.error('Error fetching supporters for matching:', error);
    return [];
  }

  // Filter to only active supporters and calculate match scores
  const matchedSupporters: MatchedSupporter[] = [];

  for (const supporter of data || []) {
    const details = supporter.supporter_details as any;

    // Skip if not fully active (verified, accepting clients, and has Stripe Connect enabled)
    if (!details?.accepting_clients || !details?.is_verified || !supporter.stripe_connect_id || !supporter.stripe_payouts_enabled) {
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
      verification_status: details.verification_status || 'approved', // Only matched supporters are verified
      stripe_connect_id: supporter.stripe_connect_id || null,
      stripe_connect_status: supporter.stripe_connect_status || null,
      stripe_payouts_enabled: supporter.stripe_payouts_enabled || false,
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
 * Stores preferences as JSONB in the profiles.preferences column
 */
export async function saveClientPreferences(
  clientId: string,
  preferences: ClientPreferences
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({
      preferences: preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId);

  if (error) {
    console.error('Error saving preferences:', error);
    return false;
  }

  return true;
}

/**
 * Get client preferences from database
 * Reads from profiles.preferences JSONB column
 */
export async function getClientPreferences(
  clientId: string
): Promise<ClientPreferences | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('preferences')
    .eq('id', clientId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }

  return data?.preferences as ClientPreferences | null;
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
 * Match a client with the best available supporter based on preferences
 * and create the assignment. Returns the assigned supporter info.
 */
export async function matchAndAssignSupporter(
  clientId: string,
  preferences: ClientPreferences
): Promise<{ success: boolean; supporter?: { id: string; name: string; specialty: string }; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Database not available' };
  }

  try {
    // Find matching supporters based on preferences
    const matches = await matchSupportersToClient(preferences);

    if (matches.length === 0) {
      return {
        success: false,
        error: 'No supporters are currently available. Please try again later.',
      };
    }

    // Get the best match (highest score)
    const bestMatch = matches[0];

    // End any existing active assignments for this client
    await supabase
      .from('client_assignments')
      .update({ status: 'ended' })
      .eq('client_id', clientId)
      .eq('status', 'active');

    // Create the new assignment
    const assigned = await assignSupporterToClient(clientId, bestMatch.id);

    if (!assigned) {
      return {
        success: false,
        error: 'Failed to create supporter assignment. Please try again.',
      };
    }

    return {
      success: true,
      supporter: {
        id: bestMatch.id,
        name: bestMatch.full_name,
        specialty: bestMatch.matchReasons?.[0] || 'Peer Support',
      },
    };
  } catch (error) {
    console.error('Error in matchAndAssignSupporter:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
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
        verification_status: 'approved',
        stripe_connect_id: null,
        stripe_connect_status: null,
        stripe_payouts_enabled: false,
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

// ============================================
// VERIFICATION DOCUMENTS
// ============================================

/**
 * Get verification status for a supporter
 */
export async function getVerificationStatus(supporterId: string): Promise<{
  status: 'not_submitted' | 'pending_review' | 'approved' | 'rejected';
  transcriptUrl: string | null;
  idDocumentUrl: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
} | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('supporter_details')
    .select('verification_status, transcript_url, id_document_url, verification_submitted_at, verification_reviewed_at, verification_rejection_reason')
    .eq('supporter_id', supporterId)
    .single();

  if (error) {
    // Row might not exist yet
    if (error.code !== 'PGRST116') {
      console.error('Error fetching verification status:', error);
    }
    return {
      status: 'not_submitted',
      transcriptUrl: null,
      idDocumentUrl: null,
      submittedAt: null,
      reviewedAt: null,
      rejectionReason: null,
    };
  }

  return {
    status: data?.verification_status || 'not_submitted',
    transcriptUrl: data?.transcript_url || null,
    idDocumentUrl: data?.id_document_url || null,
    submittedAt: data?.verification_submitted_at || null,
    reviewedAt: data?.verification_reviewed_at || null,
    rejectionReason: data?.verification_rejection_reason || null,
  };
}

/**
 * Submit verification documents (transcript and ID)
 */
export async function submitVerificationDocuments(
  supporterId: string,
  transcriptUrl: string,
  idDocumentUrl: string
): Promise<boolean> {
  if (!supabase) return false;

  // Verify we have a valid session before making database changes
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    console.error('No valid session for submitVerificationDocuments');
    return false;
  }

  // Verify the supporterId matches the authenticated user
  if (sessionData.session.user.id !== supporterId) {
    console.error('User ID mismatch: session user does not match supporterId');
    return false;
  }

  const verificationData = {
    transcript_url: transcriptUrl,
    id_document_url: idDocumentUrl,
    verification_status: 'pending_review',
    verification_submitted_at: new Date().toISOString(),
    verification_rejection_reason: null, // Clear any previous rejection
  };

  // Use upsert to handle both INSERT and UPDATE in one operation
  // This is more reliable than checking existence first
  const { data: upsertedData, error: upsertError } = await supabase
    .from('supporter_details')
    .upsert(
      {
        supporter_id: supporterId,
        ...verificationData,
      },
      {
        onConflict: 'supporter_id',
      }
    )
    .select('supporter_id, transcript_url, id_document_url')
    .single();

  if (upsertError) {
    console.error('Error upserting verification documents:', upsertError);
    return false;
  }

  // Verify the data was actually saved
  if (!upsertedData || !upsertedData.transcript_url || !upsertedData.id_document_url) {
    console.error('Verification documents were not saved correctly:', upsertedData);
    return false;
  }

  // Also update verification_status in profiles table
  // This is needed because the admin view and onboarding checklist read from profiles
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      verification_status: 'pending_review',
      updated_at: new Date().toISOString(),
    })
    .eq('id', supporterId);

  if (profileError) {
    console.error('Error updating profiles verification status:', profileError);
    // Don't return false - the main data was saved, this is supplementary
  }

  return true;
}

/**
 * Admin: Update verification status (approve/reject)
 */
export async function updateVerificationStatus(
  supporterId: string,
  status: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<boolean> {
  if (!supabase) return false;

  const updateData: Record<string, any> = {
    verification_status: status,
    verification_reviewed_at: new Date().toISOString(),
  };

  if (status === 'rejected' && rejectionReason) {
    updateData.verification_rejection_reason = rejectionReason;
  } else {
    updateData.verification_rejection_reason = null;
  }

  // If approved, also set is_verified to true
  if (status === 'approved') {
    // Update supporter_details
    const { error: detailsError } = await supabase
      .from('supporter_details')
      .update(updateData)
      .eq('supporter_id', supporterId);

    if (detailsError) {
      console.error('Error updating verification status:', detailsError);
      return false;
    }

    // Also update profiles.is_verified and verification_status
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verification_status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .eq('id', supporterId);

    if (profileError) {
      console.error('Error updating profile verification:', profileError);
      // Continue anyway, main update succeeded
    }

    // Check if all onboarding requirements are now met
    // This will auto-enable client matching if all steps are complete
    await checkAndCompleteOnboarding(supporterId);

    return true;
  } else {
    // Rejected
    const { error } = await supabase
      .from('supporter_details')
      .update(updateData)
      .eq('supporter_id', supporterId);

    if (error) {
      console.error('Error updating verification status:', error);
      return false;
    }

    // Also update profiles.verification_status for rejected
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        verification_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', supporterId);

    if (profileError) {
      console.error('Error updating profile verification status:', profileError);
      // Continue anyway, main update succeeded
    }

    return true;
  }
}

/**
 * Check if all onboarding requirements are met and auto-complete onboarding
 * This should be called after any onboarding step completes:
 * - W9 form submission
 * - Stripe payout setup
 * - Training completion
 * - Verification approval
 *
 * When all 4 requirements are met, sets:
 * - profiles.onboarding_complete = true
 * - supporter_details.accepting_clients = true
 */
export async function checkAndCompleteOnboarding(supporterId: string): Promise<{
  isComplete: boolean;
  missingSteps: string[];
}> {
  if (!supabase) return { isComplete: false, missingSteps: ['Database not available'] };

  try {
    // Fetch current status from profiles and supporter_details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('w9_completed, stripe_payouts_enabled, training_complete, verification_status, onboarding_complete')
      .eq('id', supporterId)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile for onboarding check:', profileError);
      return { isComplete: false, missingSteps: ['Could not fetch profile'] };
    }

    // Check each requirement
    const missingSteps: string[] = [];

    if (!profile.w9_completed) {
      missingSteps.push('W-9 form');
    }
    if (!profile.stripe_payouts_enabled) {
      missingSteps.push('Payout setup');
    }
    if (!profile.training_complete) {
      missingSteps.push('Training');
    }
    if (profile.verification_status !== 'approved') {
      missingSteps.push('Document verification');
    }

    const isComplete = missingSteps.length === 0;

    // If all requirements met and not already complete, mark as complete
    if (isComplete && !profile.onboarding_complete) {
      // Update profiles table
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          onboarding_complete: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', supporterId);

      if (updateProfileError) {
        console.error('Error updating onboarding_complete:', updateProfileError);
      }

      // Update supporter_details to enable client matching
      const { error: updateDetailsError } = await supabase
        .from('supporter_details')
        .update({
          accepting_clients: true,
          is_verified: true,
        })
        .eq('supporter_id', supporterId);

      if (updateDetailsError) {
        console.error('Error updating accepting_clients:', updateDetailsError);
      }

      console.log(`Supporter ${supporterId} onboarding completed - now accepting clients`);
    }

    // If requirements not met but was previously complete, mark as incomplete
    if (!isComplete && profile.onboarding_complete) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          onboarding_complete: false,
          onboarding_completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supporterId);

      if (updateError) {
        console.error('Error resetting onboarding_complete:', updateError);
      }
    }

    return { isComplete, missingSteps };
  } catch (error) {
    console.error('Error in checkAndCompleteOnboarding:', error);
    return { isComplete: false, missingSteps: ['Error checking status'] };
  }
}

/**
 * Get count of supporters pending verification review
 */
export async function getVerificationPendingCount(): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('supporter_details')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending_review');

  if (error) {
    console.error('Error counting pending verifications:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// LIVE SUPPORT FUNCTIONS
// ============================================

import type {
  LiveSupportRequestRow,
  AllowanceCheckResult,
  PresenceState,
} from '@/types/liveSupport';
import { TIER_ALLOWANCES, PAYG_PRICES, TIER_MAP } from '@/types/liveSupport';

/**
 * Get available supporters for live support
 * Returns supporters who are online, not in session, and available for live support
 */
export async function getAvailableSupportersForLiveSupport(
  excludeIds: string[] = []
): Promise<{ id: string; fullName: string; avatarUrl: string | null }[]> {
  if (!supabase) return [];

  let query = supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'supporter')
    .eq('is_online', true)
    .eq('in_session', false)
    .eq('available_for_live_support', true);

  if (excludeIds.length > 0) {
    query = query.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching available supporters:', error);
    return [];
  }

  return (data || []).map(s => ({
    id: s.id,
    fullName: s.full_name || 'Supporter',
    avatarUrl: s.avatar_url,
  }));
}

/**
 * Find the best available supporter using database function
 */
export async function findAvailableSupporter(
  excludeIds: string[] = []
): Promise<string | null> {
  if (!supabase) return null;

  const { data: supporterId, error } = await supabase
    .rpc('find_available_supporter', { p_exclude_ids: excludeIds });

  if (error) {
    console.error('Error finding available supporter:', error);
    return null;
  }

  return supporterId || null;
}

/**
 * Create a live support request
 */
export async function createLiveSupportRequest(params: {
  clientId: string;
  supporterId: string;
  sessionType: SessionType;
  paymentIntentId?: string;
  chargedAsPayg: boolean;
  amountCharged?: number;
  expiresAt: Date;
}): Promise<LiveSupportRequestRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('live_support_requests')
    .insert({
      client_id: params.clientId,
      requested_supporter_id: params.supporterId,
      session_type: params.sessionType,
      status: 'pending',
      payment_intent_id: params.paymentIntentId || null,
      charged_as_payg: params.chargedAsPayg,
      amount_charged: params.amountCharged || null,
      expires_at: params.expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating live support request:', error);
    return null;
  }

  return data;
}

/**
 * Update live support request status
 */
export async function updateLiveSupportRequestStatus(
  requestId: string,
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' | 'completed' | 'no_supporters',
  additionalData?: {
    acceptedAt?: Date;
    completedAt?: Date;
    sessionId?: string;
  }
): Promise<boolean> {
  if (!supabase) return false;

  const updateData: Record<string, any> = { status };

  if (additionalData?.acceptedAt) {
    updateData.accepted_at = additionalData.acceptedAt.toISOString();
  }
  if (additionalData?.completedAt) {
    updateData.completed_at = additionalData.completedAt.toISOString();
  }
  if (additionalData?.sessionId) {
    updateData.session_id = additionalData.sessionId;
  }

  const { error } = await supabase
    .from('live_support_requests')
    .update(updateData)
    .eq('id', requestId);

  if (error) {
    console.error('Error updating live support request:', error);
    return false;
  }

  return true;
}

/**
 * Get live support request by ID
 */
export async function getLiveSupportRequest(
  requestId: string
): Promise<LiveSupportRequestRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('live_support_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    console.error('Error fetching live support request:', error);
    return null;
  }

  return data;
}

/**
 * Get active live support request for a client
 */
export async function getClientActiveLiveSupportRequest(
  clientId: string
): Promise<LiveSupportRequestRow | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('live_support_requests')
    .select('*')
    .eq('client_id', clientId)
    .in('status', ['pending', 'accepted'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching client active request:', error);
    return null;
  }

  return data;
}

/**
 * Get pending live support requests for a supporter
 */
export async function getSupporterPendingRequests(
  supporterId: string
): Promise<LiveSupportRequestRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('live_support_requests')
    .select('*')
    .eq('requested_supporter_id', supporterId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }

  return data || [];
}

/**
 * Route live support request to next available supporter
 */
export async function routeToNextSupporter(requestId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data: nextSupporterId, error } = await supabase
    .rpc('route_to_next_supporter', { p_request_id: requestId });

  if (error) {
    console.error('Error routing to next supporter:', error);
    return null;
  }

  return nextSupporterId || null;
}

/**
 * Get current period usage for a client
 */
export async function getClientCurrentPeriodUsage(
  clientId: string
): Promise<{ chatCount: number; voiceVideoCount: number; billingPeriodStart: string; billingPeriodEnd: string } | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .rpc('get_current_period_usage', { p_client_id: clientId });

  if (error) {
    console.error('Error fetching period usage:', error);
    return null;
  }

  const row = data?.[0];
  if (!row) return null;

  return {
    chatCount: row.chat_count || 0,
    voiceVideoCount: row.voice_video_count || 0,
    billingPeriodStart: row.billing_period_start,
    billingPeriodEnd: row.billing_period_end,
  };
}

/**
 * Record session usage for a client
 */
export async function recordSessionUsage(params: {
  clientId: string;
  sessionType: SessionType;
  sessionId?: string;
  chargedAsPayg: boolean;
  paymentIntentId?: string;
}): Promise<boolean> {
  if (!supabase) return false;

  // Get billing period start
  const { data: periodStart, error: periodError } = await supabase
    .rpc('get_billing_period_start', { p_client_id: params.clientId });

  if (periodError) {
    console.error('Error getting billing period:', periodError);
    return false;
  }

  // Get subscription tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', params.clientId)
    .single();

  if (profileError) {
    console.error('Error getting profile:', profileError);
    return false;
  }

  const tierString = profile?.subscription_tier;
  const isActive = profile?.subscription_status === 'active';
  const tierNumber = (tierString && isActive) ? (TIER_MAP[tierString] || 0) : 0;

  // Insert usage record
  const { error: insertError } = await supabase
    .from('session_usage')
    .insert({
      client_id: params.clientId,
      session_type: params.sessionType,
      session_id: params.sessionId || null,
      billing_period_start: periodStart,
      subscription_tier: tierNumber,
      charged_as_payg: params.chargedAsPayg,
      payment_intent_id: params.paymentIntentId || null,
    });

  if (insertError) {
    console.error('Error recording usage:', insertError);
    return false;
  }

  return true;
}

/**
 * Update user presence (online/offline status)
 */
export async function updatePresence(
  userId: string,
  isOnline: boolean
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({
      is_online: isOnline,
      last_seen: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating presence:', error);
    return false;
  }

  return true;
}

/**
 * Send heartbeat to keep presence alive
 */
export async function sendHeartbeat(userId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .rpc('update_heartbeat', { p_user_id: userId });

  if (error) {
    console.error('Error sending heartbeat:', error);
    return false;
  }

  return true;
}

/**
 * Set supporter availability for live support
 */
export async function setLiveSupportAvailability(
  userId: string,
  available: boolean
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ available_for_live_support: available })
    .eq('id', userId);

  if (error) {
    console.error('Error setting live support availability:', error);
    return false;
  }

  return true;
}

/**
 * Set user in-session status
 */
export async function setInSessionStatus(
  userId: string,
  inSession: boolean
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ in_session: inSession })
    .eq('id', userId);

  if (error) {
    console.error('Error setting in-session status:', error);
    return false;
  }

  return true;
}

/**
 * Get user presence state
 */
export async function getPresenceState(userId: string): Promise<PresenceState | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('is_online, last_seen, in_session, available_for_live_support')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching presence:', error);
    return null;
  }

  return {
    isOnline: data.is_online || false,
    lastSeen: data.last_seen ? new Date(data.last_seen) : null,
    inSession: data.in_session || false,
    availableForLiveSupport: data.available_for_live_support || false,
  };
}

/**
 * Check if a client has session allowance for a given session type
 */
export async function checkSessionAllowance(
  clientId: string,
  sessionType: SessionType
): Promise<AllowanceCheckResult> {
  if (!supabase) {
    return {
      hasAllowance: false,
      remaining: 0,
      paygRequired: true,
      paygPrice: PAYG_PRICES[sessionType],
      subscriptionTier: null,
    };
  }

  // Get subscription tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', clientId)
    .single();

  if (profileError) {
    console.error('Error fetching profile:', profileError);
    return {
      hasAllowance: false,
      remaining: 0,
      paygRequired: true,
      paygPrice: PAYG_PRICES[sessionType],
      subscriptionTier: null,
    };
  }

  const tierString = profile?.subscription_tier;
  const isActive = profile?.subscription_status === 'active';
  const tierNumber = (tierString && isActive) ? (TIER_MAP[tierString] || 0) : 0;

  // No subscription - require PAYG
  if (tierNumber === 0) {
    return {
      hasAllowance: false,
      remaining: 0,
      paygRequired: true,
      paygPrice: PAYG_PRICES[sessionType],
      subscriptionTier: null,
    };
  }

  // Get current period usage
  const usageData = await getClientCurrentPeriodUsage(clientId);

  const allowances = TIER_ALLOWANCES[tierNumber as 1 | 2 | 3];
  const isChat = sessionType === 'chat';
  const used = isChat ? (usageData?.chatCount || 0) : (usageData?.voiceVideoCount || 0);
  const allowed = isChat ? allowances.chat : allowances.voiceVideo;

  // Handle unlimited chats (tier 3)
  if (allowed === Infinity) {
    return {
      hasAllowance: true,
      remaining: 999,
      paygRequired: false,
      paygPrice: PAYG_PRICES[sessionType],
      subscriptionTier: tierNumber,
    };
  }

  const remaining = Math.max(0, allowed - used);
  const hasAllowance = remaining > 0;

  return {
    hasAllowance,
    remaining,
    paygRequired: !hasAllowance,
    paygPrice: PAYG_PRICES[sessionType],
    subscriptionTier: tierNumber,
  };
}

/**
 * Complete a live support session
 * Updates request status, records usage, and clears in-session status
 */
export async function completeLiveSupportSession(
  requestId: string,
  sessionId: string
): Promise<boolean> {
  if (!supabase) return false;

  // Get the request
  const request = await getLiveSupportRequest(requestId);
  if (!request) return false;

  // Update request status
  const updated = await updateLiveSupportRequestStatus(requestId, 'completed', {
    completedAt: new Date(),
    sessionId,
  });

  if (!updated) return false;

  // Record session usage
  await recordSessionUsage({
    clientId: request.client_id,
    sessionType: request.session_type as SessionType,
    sessionId,
    chargedAsPayg: request.charged_as_payg,
    paymentIntentId: request.payment_intent_id || undefined,
  });

  // Clear supporter in-session status
  if (request.requested_supporter_id) {
    await setInSessionStatus(request.requested_supporter_id, false);
  }

  return true;
}

/**
 * Save Expo push token to user's profile
 */
export async function saveExpoPushToken(
  userId: string,
  token: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId);

  if (error) {
    console.error('Error saving push token:', error);
    return false;
  }

  return true;
}

/**
 * Get user's Expo push token
 */
export async function getExpoPushToken(userId: string): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('expo_push_token')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Error getting push token:', error);
    return null;
  }

  return data.expo_push_token;
}

/**
 * Send live support notification via Edge Function
 */
export async function sendLiveSupportPushNotification(params: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  priority?: 'default' | 'normal' | 'high';
}): Promise<{ sent: boolean; error?: string }> {
  if (!supabase) return { sent: false, error: 'Database not initialized' };

  try {
    const { data, error } = await supabase.functions.invoke('send-live-support-notification', {
      body: {
        userId: params.userId,
        title: params.title,
        body: params.body,
        data: params.data,
        priority: params.priority || 'high',
      },
    });

    if (error) {
      console.error('Error invoking push notification function:', error);
      return { sent: false, error: error.message };
    }

    return data as { sent: boolean; error?: string };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { sent: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send live support request notification to a supporter
 */
export async function notifySupporterOfLiveRequest(params: {
  supporterId: string;
  requestId: string;
  clientName: string;
  sessionType: SessionType;
}): Promise<boolean> {
  const result = await sendLiveSupportPushNotification({
    userId: params.supporterId,
    title: 'Live Support Request',
    body: `${params.clientName} is requesting a live ${params.sessionType} session. Tap to respond.`,
    data: {
      type: 'live_support_request',
      requestId: params.requestId,
      sessionType: params.sessionType,
    },
    priority: 'high',
  });

  return result.sent;
}

/**
 * Notify client that their live support request was accepted
 */
export async function notifyClientOfAcceptedRequest(params: {
  clientId: string;
  requestId: string;
  sessionId: string;
  supporterName: string;
  sessionType: SessionType;
}): Promise<boolean> {
  const result = await sendLiveSupportPushNotification({
    userId: params.clientId,
    title: 'Request Accepted!',
    body: `${params.supporterName} accepted your request. Your ${params.sessionType} session is starting now.`,
    data: {
      type: 'live_support_accepted',
      requestId: params.requestId,
      sessionId: params.sessionId,
      sessionType: params.sessionType,
    },
    priority: 'high',
  });

  return result.sent;
}

/**
 * Notify client that no supporters are available
 */
export async function notifyClientNoSupportersAvailable(params: {
  clientId: string;
  requestId: string;
}): Promise<boolean> {
  const result = await sendLiveSupportPushNotification({
    userId: params.clientId,
    title: 'No Supporters Available',
    body: 'We couldn\'t find an available supporter right now. Please try again later or schedule a session.',
    data: {
      type: 'live_support_no_supporters',
      requestId: params.requestId,
    },
    priority: 'default',
  });

  return result.sent;
}

// ============================================
// POST-CALL MESSAGES
// ============================================

export interface PostCallMessage {
  id: string;
  session_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  issue_reason: 'timeout' | 'disconnect' | 'network';
  created_at: string;
}

/**
 * Save a post-call recovery message
 */
export async function savePostCallMessage(params: {
  sessionId: string;
  senderId: string;
  recipientId: string;
  content: string;
  issueReason: 'timeout' | 'disconnect' | 'network';
}): Promise<PostCallMessage | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('post_call_messages')
    .insert({
      session_id: params.sessionId,
      sender_id: params.senderId,
      recipient_id: params.recipientId,
      content: params.content,
      issue_reason: params.issueReason,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving post-call message:', error);
    return null;
  }

  return data;
}

/**
 * Get post-call messages for a session
 */
export async function getPostCallMessages(sessionId: string): Promise<PostCallMessage[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('post_call_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching post-call messages:', error);
    return [];
  }

  return data || [];
}
