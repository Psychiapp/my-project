/**
 * useLiveSupportRequest Hook
 * Manages live support request lifecycle with realtime updates
 *
 * Features:
 * - Create request with optional PAYG payment
 * - Accept/decline requests (for supporters)
 * - Cancel requests (for clients)
 * - Realtime updates via Supabase
 * - Countdown timer (15 minutes)
 * - Automatic routing to next supporter on decline/timeout
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { sendLocalNotification } from '@/lib/notifications';
import {
  REQUEST_TIMEOUT_MS,
  transformLiveSupportRequest,
} from '@/types/liveSupport';
import type {
  LiveSupportRequest,
  LiveSupportRequestRow,
  AllowanceCheckResult,
} from '@/types/liveSupport';
import type { SessionType } from '@/types/database';

interface UseLiveSupportRequestOptions {
  onRequestAccepted?: (request: LiveSupportRequest) => void;
  onRequestDeclined?: (request: LiveSupportRequest) => void;
  onRequestExpired?: (request: LiveSupportRequest) => void;
  onNoSupportersAvailable?: () => void;
  onError?: (error: string) => void;
}

interface UseLiveSupportRequestReturn {
  activeRequest: LiveSupportRequest | null;
  pendingRequests: LiveSupportRequest[];
  isSubmitting: boolean;
  countdown: number | null;
  createRequest: (
    sessionType: SessionType,
    allowanceCheck: AllowanceCheckResult,
    processPayment: () => Promise<{ success: boolean; paymentIntentId?: string; error?: string }>
  ) => Promise<{ success: boolean; error?: string }>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  declineRequest: (requestId: string, reason?: string) => Promise<boolean>;
  cancelRequest: (requestId: string) => Promise<boolean>;
  clearActiveRequest: () => void;
}

export function useLiveSupportRequest(
  userId: string | null,
  userType: 'client' | 'supporter',
  options: UseLiveSupportRequestOptions = {}
): UseLiveSupportRequestReturn {
  const [activeRequest, setActiveRequest] = useState<LiveSupportRequest | null>(null);
  const [pendingRequests, setPendingRequests] = useState<LiveSupportRequest[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const subscriptionRef = useRef<any>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Create a live support request (client)
  const createRequest = useCallback(async (
    sessionType: SessionType,
    allowanceCheck: AllowanceCheckResult,
    processPayment: () => Promise<{ success: boolean; paymentIntentId?: string; error?: string }>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!userId || !supabase) {
      return { success: false, error: 'Not authenticated' };
    }

    setIsSubmitting(true);

    try {
      let paymentIntentId: string | null = null;

      // Process PAYG payment if needed
      if (allowanceCheck.paygRequired) {
        const paymentResult = await processPayment();

        if (!paymentResult.success) {
          return {
            success: false,
            error: paymentResult.error || 'Payment failed',
          };
        }

        paymentIntentId = paymentResult.paymentIntentId || null;
      }

      // Find available supporter (try matched supporter first, then any available)
      const { data: supporterId, error: findError } = await supabase
        .rpc('find_available_supporter', { p_exclude_ids: [] });

      if (findError) {
        console.error('Error finding supporter:', findError);
      }

      if (!supporterId) {
        return {
          success: false,
          error: 'No supporters are currently available. Please try again later.',
        };
      }

      // Create the request
      const expiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);

      const { data: request, error: createError } = await supabase
        .from('live_support_requests')
        .insert({
          client_id: userId,
          requested_supporter_id: supporterId,
          session_type: sessionType,
          status: 'pending',
          payment_intent_id: paymentIntentId,
          charged_as_payg: allowanceCheck.paygRequired,
          amount_charged: allowanceCheck.paygRequired ? allowanceCheck.paygPrice : null,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      const transformedRequest = transformLiveSupportRequest(request as LiveSupportRequestRow);
      setActiveRequest(transformedRequest);
      setCountdown(Math.floor(REQUEST_TIMEOUT_MS / 1000));

      // TODO: Trigger Edge Function to send push notification to supporter

      return { success: true };
    } catch (err) {
      console.error('Create request error:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create request',
      };
    } finally {
      setIsSubmitting(false);
    }
  }, [userId]);

  // Accept a request (supporter)
  const acceptRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId || !supabase) return false;

    try {
      const { data, error } = await supabase
        .from('live_support_requests')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('requested_supporter_id', userId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Set supporter in_session
      await supabase
        .from('profiles')
        .update({ in_session: true })
        .eq('id', userId);

      const transformedRequest = transformLiveSupportRequest(data as LiveSupportRequestRow);

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));

      options.onRequestAccepted?.(transformedRequest);
      return true;
    } catch (err) {
      console.error('Accept request error:', err);
      options.onError?.(err instanceof Error ? err.message : 'Failed to accept request');
      return false;
    }
  }, [userId, options]);

  // Decline a request (supporter)
  const declineRequest = useCallback(async (
    requestId: string,
    reason?: string
  ): Promise<boolean> => {
    if (!userId || !supabase) return false;

    try {
      // Get current request
      const { data: request, error: fetchError } = await supabase
        .from('live_support_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        throw new Error('Request not found');
      }

      // Update decline history
      const declineHistory = [
        ...(request.decline_history || []),
        {
          supporterId: userId,
          declinedAt: new Date().toISOString(),
          reason,
        },
      ];

      // Update the request with declined status temporarily
      await supabase
        .from('live_support_requests')
        .update({
          decline_history: declineHistory,
        })
        .eq('id', requestId);

      // Route to next supporter using database function
      const { data: nextSupporterId } = await supabase
        .rpc('route_to_next_supporter', { p_request_id: requestId });

      // Remove from pending requests
      setPendingRequests(prev => prev.filter(r => r.id !== requestId));

      if (!nextSupporterId) {
        options.onNoSupportersAvailable?.();
      }

      return true;
    } catch (err) {
      console.error('Decline request error:', err);
      options.onError?.(err instanceof Error ? err.message : 'Failed to decline request');
      return false;
    }
  }, [userId, options]);

  // Cancel a request (client)
  const cancelRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId || !supabase) return false;

    try {
      const { error } = await supabase
        .from('live_support_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId)
        .eq('client_id', userId)
        .eq('status', 'pending');

      if (error) {
        throw new Error(error.message);
      }

      setActiveRequest(null);
      setCountdown(null);

      // TODO: Process refund if PAYG was charged

      return true;
    } catch (err) {
      console.error('Cancel request error:', err);
      options.onError?.(err instanceof Error ? err.message : 'Failed to cancel request');
      return false;
    }
  }, [userId, options]);

  // Clear active request
  const clearActiveRequest = useCallback(() => {
    setActiveRequest(null);
    setCountdown(null);
  }, []);

  // Handle countdown timeout (client-side)
  const handleTimeout = useCallback(async () => {
    if (!activeRequest || !supabase) return;

    // Check current status from database
    const { data, error } = await supabase
      .from('live_support_requests')
      .select('*')
      .eq('id', activeRequest.id)
      .single();

    if (error || !data) return;

    if (data.status === 'pending') {
      // Route to next supporter
      const { data: nextSupporterId } = await supabase
        .rpc('route_to_next_supporter', { p_request_id: activeRequest.id });

      if (nextSupporterId) {
        // Reset countdown for next supporter
        setCountdown(Math.floor(REQUEST_TIMEOUT_MS / 1000));
      } else {
        // No more supporters available
        setActiveRequest(null);
        setCountdown(null);
        options.onNoSupportersAvailable?.();
      }
    }
  }, [activeRequest, options]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!userId || !supabase) return;

    const filterColumn = userType === 'client' ? 'client_id' : 'requested_supporter_id';

    const channel = supabase
      .channel(`live_support:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_support_requests',
          filter: `${filterColumn}=eq.${userId}`,
        },
        (payload) => {
          const request = transformLiveSupportRequest(payload.new as LiveSupportRequestRow);

          if (userType === 'client') {
            // Client: track active request
            if (request.status === 'pending') {
              setActiveRequest(request);
              // Recalculate countdown based on expires_at
              const remaining = Math.max(0, Math.floor((request.expiresAt.getTime() - Date.now()) / 1000));
              setCountdown(remaining);
            } else if (request.status === 'accepted') {
              setActiveRequest(request);
              setCountdown(null);
              options.onRequestAccepted?.(request);
            } else if (request.status === 'no_supporters') {
              setActiveRequest(null);
              setCountdown(null);
              options.onNoSupportersAvailable?.();
            } else if (request.status === 'expired' || request.status === 'cancelled') {
              setActiveRequest(null);
              setCountdown(null);
              if (request.status === 'expired') {
                options.onRequestExpired?.(request);
              }
            }
          } else {
            // Supporter: track pending requests assigned to them
            if (request.status === 'pending' && request.requestedSupporterId === userId) {
              setPendingRequests(prev => {
                const exists = prev.find(r => r.id === request.id);
                if (exists) {
                  return prev.map(r => r.id === request.id ? request : r);
                }
                return [...prev, request];
              });

              // Send local notification
              sendLocalNotification(
                'Live Support Request',
                `A client is requesting a ${request.sessionType} session. Respond within 15 minutes.`,
                { type: 'live_support_request', requestId: request.id }
              );
            } else {
              // Request is no longer pending or not assigned to this supporter
              setPendingRequests(prev => prev.filter(r => r.id !== request.id));
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [userId, userType, options]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (countdown === 0) {
        handleTimeout();
      }
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [countdown, handleTimeout]);

  // Load initial pending requests for supporters
  useEffect(() => {
    if (!userId || !supabase || userType !== 'supporter') return;

    const db = supabase;
    const loadPendingRequests = async () => {
      const { data, error } = await db
        .from('live_support_requests')
        .select('*')
        .eq('requested_supporter_id', userId)
        .eq('status', 'pending');

      if (data && !error) {
        setPendingRequests(
          data.map(row => transformLiveSupportRequest(row as LiveSupportRequestRow))
        );
      }
    };

    loadPendingRequests();
  }, [userId, userType]);

  // Load active request for clients
  useEffect(() => {
    if (!userId || !supabase || userType !== 'client') return;

    const db = supabase;
    const loadActiveRequest = async () => {
      const { data, error } = await db
        .from('live_support_requests')
        .select('*')
        .eq('client_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data && !error) {
        const request = transformLiveSupportRequest(data as LiveSupportRequestRow);
        setActiveRequest(request);
        const remaining = Math.max(0, Math.floor((request.expiresAt.getTime() - Date.now()) / 1000));
        setCountdown(remaining);
      }
    };

    loadActiveRequest();
  }, [userId, userType]);

  return {
    activeRequest,
    pendingRequests,
    isSubmitting,
    countdown,
    createRequest,
    acceptRequest,
    declineRequest,
    cancelRequest,
    clearActiveRequest,
  };
}
