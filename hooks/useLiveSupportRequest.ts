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
import { Alert, AppState, AppStateStatus } from 'react-native';
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
  // Uses broadcast model: notifies ALL eligible supporters, first to accept wins
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
      // Check supporter availability FIRST — before charging anything
      const { data: clientTimezone } = await supabase
        .rpc('get_client_timezone', { p_client_id: userId });

      const { data: supporters, error: supportersError } = await supabase
        .rpc('get_all_eligible_supporters', {
          p_timezone: clientTimezone,
          p_session_type: sessionType,
        });

      if (supportersError) {
        console.error('Error checking eligible supporters:', supportersError);
      }

      if (!supporters || supporters.length === 0) {
        return {
          success: false,
          error: 'No supporters are currently available. Please try again later.',
        };
      }

      // Supporters are available — now process PAYG payment if needed
      let paymentIntentId: string | null = null;

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

      // Create the request (no specific supporter assigned - broadcast model)
      const expiresAt = new Date(Date.now() + REQUEST_TIMEOUT_MS);

      const { data: request, error: createError } = await supabase
        .from('live_support_requests')
        .insert({
          client_id: userId,
          requested_supporter_id: null, // Broadcast to all - no specific supporter
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

      try {
        const broadcastResponse = await supabase.functions.invoke('broadcast-live-support-request', {
          body: {
            requestId: request.id,
            sessionType: sessionType,
            clientId: userId,
          },
        });

        if (broadcastResponse.error) {
          console.error('Broadcast notification error:', broadcastResponse.error);
        }
      } catch (notifyError) {
        console.error('Failed to send broadcast notification:', notifyError);
        // Don't fail the request - notification is best-effort
      }

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
  // Uses atomic function - first to accept wins (race condition safe)
  const acceptRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!userId || !supabase) return false;

    try {
      // Use atomic function to claim the request
      const { data, error } = await supabase
        .rpc('accept_live_support_request', {
          p_request_id: requestId,
          p_supporter_id: userId,
        });

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        // Request was already accepted by another supporter
        options.onError?.('This request has already been accepted by another supporter.');
        // Remove from pending requests
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        return false;
      }

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

    // For clients: filter by their client_id
    // For supporters: listen to ALL pending requests (broadcast model)
    const channel = userType === 'client'
      ? supabase
          .channel(`live_support:${userId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'live_support_requests',
              filter: `client_id=eq.${userId}`,
            },
            (payload) => {
              const request = transformLiveSupportRequest(payload.new as LiveSupportRequestRow);

              // Client: track active request
              if (request.status === 'pending') {
                setActiveRequest(request);
                // Recalculate countdown based on expires_at
                const remaining = Math.max(0, Math.floor((request.expiresAt.getTime() - Date.now()) / 1000));
                setCountdown(remaining);
              } else if (request.status === 'accepted') {
                setActiveRequest(request);
                setCountdown(null);
                // The RPC writes status='accepted' then session_id in two separate
                // updates. Only notify when session_id is present (second update).
                if (request.sessionId) {
                  options.onRequestAccepted?.(request);
                }
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
            }
          )
          .subscribe()
      : supabase
          .channel(`live_support_broadcast:${userId}`)
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'live_support_requests',
            },
            (payload) => {
              const request = transformLiveSupportRequest(payload.new as LiveSupportRequestRow);

              // Supporter: show ALL new pending requests (broadcast model)
              if (request.status === 'pending') {
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
                  `A client needs a ${request.sessionType} session now! First to respond gets it.`,
                  { type: 'live_support_request', requestId: request.id }
                );
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'live_support_requests',
            },
            (payload) => {
              const request = transformLiveSupportRequest(payload.new as LiveSupportRequestRow);

              // If request is no longer pending, remove from list
              if (request.status !== 'pending') {
                setPendingRequests(prev => prev.filter(r => r.id !== request.id));
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
      // Broadcast model: all requests have requested_supporter_id=null
      const { data, error } = await db
        .from('live_support_requests')
        .select('*')
        .is('requested_supporter_id', null)
        .eq('status', 'pending');

      if (data && !error) {
        setPendingRequests(
          data.map(row => transformLiveSupportRequest(row as LiveSupportRequestRow))
        );
      }
    };

    loadPendingRequests();

    // Re-fetch when app foregrounds — the Realtime WebSocket is suspended in the
    // background so INSERT events are missed while the app isn't active. Without
    // this, tapping a push notification and landing on the dashboard shows nothing.
    const appStateRef = { current: AppState.currentState };
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        loadPendingRequests();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
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
