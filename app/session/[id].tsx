import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ChatSession from '@/components/session/ChatSession';
import VideoCall from '@/components/session/VideoCall';
import PostCallContact from '@/components/session/PostCallContact';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { createSession as createDailySession, SessionConfig, deleteRoom, getRoomNameFromUrl } from '@/lib/daily';
import { getSession, updateSessionStatus, updateSessionRoomUrl, notifySessionEntered, setInSessionStatus, checkAndMarkEnteredNotificationSent } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { logSessionEvent } from '@/lib/sessionLogger';
import {
  ensureSessionPermissions,
  getPermissionDisplayName,
  showPermissionDeniedAlert,
} from '@/lib/permissions';
import { CheckCircleIcon } from '@/components/icons';

type SessionType = 'chat' | 'phone' | 'video';

interface SessionData {
  id: string;
  type: SessionType;
  participant: {
    id: string;
    name: string;
    role: 'client' | 'supporter';
  };
  scheduledAt: string;
  duration: number;
  roomUrl?: string; // Existing Daily.co room URL if another participant already created it
}

export default function SessionScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { user, profile, isLoading: isAuthLoading } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [dailySession, setDailySession] = useState<SessionConfig | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRetryable, setIsRetryable] = useState(false); // Whether the error can be retried
  const [retryCount, setRetryCount] = useState(0); // Track retries for dependency
  const [showPostCallContact, setShowPostCallContact] = useState(false); // 5-min contact window
  const [connectionIssueReason, setConnectionIssueReason] = useState<'timeout' | 'disconnect' | 'network' | 'session_ended' | null>(null);
  const [sessionEndedAt, setSessionEndedAt] = useState<Date | null>(null); // Track when session ended for 5-min window
  const [followUpTimeRemaining, setFollowUpTimeRemaining] = useState<number>(5 * 60 * 1000); // 5 minutes in ms
  const enteredNotificationSent = useRef(false); // Track if we've notified the other participant
  const sessionExplicitlyEnded = useRef(false); // Set to true only when user taps End Session

  // Get current user name from auth context
  const currentUserName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : 'You';
  const currentUserId = user?.id || '';
  const currentUserRole = profile?.role || 'client';

  // Track auth retry attempts for deep link scenarios
  const authRetryAttempted = useRef(false);

  // Fetch real session data from database
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id) {
        setLoadError('No session ID provided');
        setIsRetryable(false);
        setIsLoadingSession(false);
        return;
      }

      // Wait for auth to be ready before fetching session
      // This prevents RLS errors when opening from a notification before session is restored
      if (isAuthLoading) {
        return;
      }

      // If auth finished loading but user is not logged in, retry once after a brief delay
      // This handles the race condition when opening from a push notification where
      // auth state may not be fully restored yet (e.g., device waking from sleep)
      if (!user) {
        if (!authRetryAttempted.current) {
          authRetryAttempted.current = true;
          console.log('[Session] Auth appears unloaded, retrying after delay...');
          // Wait 1.5 seconds for auth state to potentially restore
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 1500);
          return;
        }
        // Already retried once, show error
        setLoadError('Please sign in to access this session');
        setIsRetryable(false);
        setIsLoadingSession(false);
        return;
      }

      // Reset error state on new fetch attempt (for retries)
      setLoadError(null);
      setIsRetryable(false);

      try {
        setIsLoadingSession(true);
        const session = await getSession(id);

        if (!session) {
          setLoadError('Session not found. It may have been cancelled or does not exist.');
          setIsRetryable(false);
          setIsLoadingSession(false);
          return;
        }

        // Determine who the other participant is based on current user's role
        const isClient = session.client_id === currentUserId || currentUserRole === 'client';
        const otherParticipant = isClient ? session.supporter : session.client;

        if (!otherParticipant) {
          setLoadError('Could not find session participant');
          setIsRetryable(false);
          setIsLoadingSession(false);
          return;
        }

        // CRITICAL: Verify payment before allowing session to start
        // This prevents sessions from proceeding without payment
        // Valid states: 'completed' (paid) or 'not_required' (included in subscription/live support)
        if (session.payment_status !== 'completed' && session.payment_status !== 'not_required') {
          console.error('Session payment not completed:', session.id, session.payment_status);
          setLoadError('Payment required. This session cannot start until payment is confirmed. Please contact support if you believe this is an error.');
          setIsRetryable(false);
          setIsLoadingSession(false);
          return;
        }

        // Check if session can be entered (only allow 5 minutes before scheduled time)
        const scheduledTime = new Date(session.scheduled_at);
        const now = new Date();
        const fiveMinutesBefore = new Date(scheduledTime.getTime() - 5 * 60 * 1000);

        if (now < fiveMinutesBefore) {
          const timeUntilEntry = fiveMinutesBefore.getTime() - now.getTime();
          const hoursUntil = Math.floor(timeUntilEntry / (1000 * 60 * 60));
          const minutesUntil = Math.floor((timeUntilEntry % (1000 * 60 * 60)) / (1000 * 60));

          let timeMessage = '';
          if (hoursUntil > 0) {
            timeMessage = `${hoursUntil} hour${hoursUntil > 1 ? 's' : ''}${minutesUntil > 0 ? ` and ${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}` : ''}`;
          } else {
            timeMessage = `${minutesUntil} minute${minutesUntil > 1 ? 's' : ''}`;
          }

          const formattedTime = scheduledTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          setLoadError(`This session is scheduled for ${formattedTime}. You can enter ${timeMessage} from now (5 minutes before the session starts).`);
          setIsRetryable(false);
          setIsLoadingSession(false);
          return;
        }

        setSessionData({
          id: session.id,
          type: (type as SessionType) || session.session_type || 'chat',
          participant: {
            id: otherParticipant.id,
            name: otherParticipant.full_name || 'Unknown',
            role: isClient ? 'supporter' : 'client',
          },
          scheduledAt: session.scheduled_at,
          duration: session.duration_minutes || 30,
          roomUrl: session.room_url || undefined, // Pass existing room URL if another participant created it
        });
        setIsLoadingSession(false);
      } catch (error: any) {
        console.error('Error fetching session:', error);
        // Check if this is a network/connection error that can be retried
        const errorMessage = error?.message || 'Unknown error';
        const isNetworkError = errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch') ||
          errorMessage.includes('Failed to fetch') ||
          error?.code === 'NETWORK_ERROR';

        setLoadError(isNetworkError
          ? 'Connection error. Please check your internet and try again.'
          : 'Failed to load session. Please try again.');
        setIsRetryable(true); // Allow retry for all fetch errors
        setIsLoadingSession(false);
      }
    };

    fetchSessionData();
  }, [id, type, currentUserId, currentUserRole, isAuthLoading, retryCount]);

  // Check permissions and create Daily.co room for video/voice calls
  useEffect(() => {
    const initDailySession = async () => {
      if (!sessionData || sessionData.type === 'chat') {
        setPermissionsGranted(true); // Chat doesn't need special permissions
        return;
      }

      // Check and request required permissions
      setCheckingPermissions(true);
      const { granted, missing } = await ensureSessionPermissions(sessionData.type);
      setCheckingPermissions(false);

      if (!granted) {
        // Show alert about missing permissions
        const missingNames = missing.map(getPermissionDisplayName).join(' and ');
        Alert.alert(
          'Permissions Required',
          `To join this ${sessionData.type} call, please enable ${missingNames} access.`,
          [
            {
              text: 'Go to Settings',
              onPress: () => router.push('/permissions'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      setPermissionsGranted(true);
      setIsCreatingRoom(true);

      // Re-read room_url from DB immediately before creating — another participant
      // may have created the room in the window between our initial load and now.
      const { data: freshSession } = await supabase
        .from('sessions')
        .select('room_url')
        .eq('id', sessionData.id)
        .single();

      const existingRoomUrl = freshSession?.room_url || sessionData.roomUrl;

      if (existingRoomUrl) {
        // Another participant already created the room — join it
        setDailySession({
          type: sessionData.type === 'video' ? 'video' : 'voice',
          roomUrl: existingRoomUrl,
          participantName: currentUserName,
        });

        logSessionEvent(
          sessionData.id,
          sessionData.type,
          currentUserId,
          'session_join',
          { roomUrl: existingRoomUrl, participantId: sessionData.participant.id }
        );
        setIsCreatingRoom(false);
        return;
      }

      // No existing room — create one
      const dailyType = sessionData.type === 'video' ? 'video' : 'voice';

      try {
        const config = await createDailySession(dailyType, currentUserName);

        if (config && config.roomUrl) {
          setDailySession(config);
          // Save room URL to database so other participant can join the same room
          await updateSessionRoomUrl(sessionData.id, config.roomUrl);

          // Log room creation
          logSessionEvent(
            sessionData.id,
            sessionData.type,
            currentUserId,
            'room_created',
            { roomUrl: config.roomUrl, participantId: sessionData.participant.id }
          );
        } else {
          throw new Error('Room created but no URL returned');
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        // Log room creation failure
        logSessionEvent(
          sessionData.id,
          sessionData.type,
          currentUserId,
          'room_join_failed',
          { reason: errorMessage },
          error
        );
        console.error('Failed to create call session:', errorMessage);
        Alert.alert(
          'Call Setup Error',
          `Unable to set up the call: ${errorMessage}`,
          [
            { text: 'Try Again', onPress: () => initDailySession() },
            { text: 'Go Back', onPress: () => router.back(), style: 'cancel' },
          ]
        );
      }
      setIsCreatingRoom(false);
    };

    initDailySession();
  }, [sessionData]);

  // User clicks to end session - show confirmation first
  const handleEndSession = () => {
    setShowEndConfirm(true);
  };

  // Called when the OTHER participant ends the session (from Daily.co left-meeting event)
  // No confirmation needed - just show session ended screen
  const handleRemoteEndSession = async () => {
    if (sessionEnded) return; // Already ended

    // Log that session was ended by other participant
    if (sessionData?.id) {
      logSessionEvent(
        sessionData.id,
        sessionData.type,
        currentUserId,
        'session_end',
        { endedBy: 'other_participant', participantId: sessionData.participant.id }
      );

      // Reset supporter's in_session flag
      const supporterId = currentUserRole === 'supporter'
        ? currentUserId
        : sessionData.participant.id;
      await setInSessionStatus(supporterId, false);
    }

    // Show alert that session was ended by other participant
    Alert.alert(
      'Session Ended',
      `${sessionData?.participant.name || 'The other participant'} has ended the session.`,
      [{ text: 'OK' }]
    );

    setSessionEndedAt(new Date());
    setSessionEnded(true);
  };

  const confirmEndSession = async () => {
    setShowEndConfirm(false);
    sessionExplicitlyEnded.current = true; // Mark as intentional before any state changes
    const endTime = new Date();

    // Mark session as completed with ended timestamp
    if (sessionData?.id) {
      await updateSessionStatus(sessionData.id, 'completed', {
        ended_at: endTime.toISOString()
      });

      // Reset supporter's in_session flag
      // If current user is supporter, reset their flag
      // If current user is client, the other participant is the supporter
      const supporterId = currentUserRole === 'supporter'
        ? currentUserId
        : sessionData.participant.id;
      await setInSessionStatus(supporterId, false);

      // Log session end
      logSessionEvent(
        sessionData.id,
        sessionData.type,
        currentUserId,
        'session_end',
        { participantId: sessionData.participant.id }
      );

      // Broadcast session end to other participant for immediate notification
      try {
        if (!supabase) throw new Error('Supabase not available');
        const channel = supabase.channel(`session-end:${sessionData.id}`);
        await channel.subscribe();
        await channel.send({
          type: 'broadcast',
          event: 'session_ended',
          payload: {
            endedBy: currentUserId,
            endedAt: endTime.toISOString(),
          },
        });
        // Unsubscribe after sending
        await channel.unsubscribe();
      } catch (broadcastError) {
        // Non-critical - database subscription will still work as backup
        console.log('Broadcast error (non-critical):', broadcastError);
      }
    }

    // Clean up Daily.co room if it exists
    if (dailySession?.roomUrl) {
      const roomName = getRoomNameFromUrl(dailySession.roomUrl);
      if (roomName) {
        await deleteRoom(roomName);

        // Log room deletion
        if (sessionData?.id) {
          logSessionEvent(
            sessionData.id,
            sessionData.type,
            currentUserId,
            'room_deleted',
            { roomUrl: dailySession.roomUrl }
          );
        }
      }
    }

    setSessionEndedAt(endTime);
    setSessionEnded(true);
  };

  // Mark chat session as in_progress when starting
  // Also cleanup on unmount (user navigates away without ending)
  useEffect(() => {
    if (sessionData?.type === 'chat' && sessionData?.id) {
      updateSessionStatus(sessionData.id, 'in_progress');

      // Log chat session start
      logSessionEvent(
        sessionData.id,
        'chat',
        currentUserId,
        'session_start',
        { participantId: sessionData.participant.id }
      );
    }

    // Cleanup function: end session when user navigates away without explicitly ending.
    // Guard with the ref (not state) so we read the current value at unmount time,
    // not the value captured when the effect ran.
    return () => {
      if (sessionData?.type === 'chat' && sessionData?.id && !sessionExplicitlyEnded.current && !sessionEnded) {
        console.log('[Session] Cleanup: User navigated away, ending session automatically');

        // End the session
        updateSessionStatus(sessionData.id, 'completed', {
          ended_at: new Date().toISOString()
        });

        // Reset supporter's in_session flag
        const supporterId = currentUserRole === 'supporter'
          ? currentUserId
          : sessionData.participant?.id;
        if (supporterId) {
          setInSessionStatus(supporterId, false);
        }

        // Log the auto-end
        logSessionEvent(
          sessionData.id,
          'chat',
          currentUserId,
          'session_end',
          { endedBy: 'navigation_cleanup', participantId: sessionData.participant?.id }
        );
      }
    };
  }, [sessionData?.id, sessionData?.type, currentUserId, sessionData?.participant?.id, sessionEnded, currentUserRole]);

  // Notify other participant when session is entered
  useEffect(() => {
    const sendEnteredNotification = async () => {
      console.log('[Session] sendEnteredNotification check:', {
        alreadySent: enteredNotificationSent.current,
        hasSessionData: !!sessionData,
        sessionType: sessionData?.type,
        hasDailyRoomUrl: !!dailySession?.roomUrl,
      });

      // Quick local check - useRef serves as a cache for same-mount-cycle
      if (enteredNotificationSent.current) {
        console.log('[Session] Notification already sent (local cache), skipping');
        return;
      }
      if (!sessionData) {
        console.log('[Session] No session data yet, skipping');
        return;
      }

      // For chat: send immediately when session data loads
      // For video/phone: send when room is ready (dailySession is set)
      const isReady = sessionData.type === 'chat' || dailySession?.roomUrl;
      if (!isReady) {
        console.log('[Session] Session not ready yet (waiting for room URL)');
        return;
      }

      // Check database flag - this is the authoritative check that persists across remounts
      // The function atomically checks and sets the flag, returning true only if this is the first time
      const shouldSend = await checkAndMarkEnteredNotificationSent(
        sessionData.id,
        currentUserRole as 'client' | 'supporter'
      );

      if (!shouldSend) {
        console.log('[Session] Notification already sent (database flag), skipping');
        enteredNotificationSent.current = true; // Sync local cache
        return;
      }

      enteredNotificationSent.current = true;

      console.log('[Session] Sending session entered notification:', {
        sessionId: sessionData.id,
        otherParticipantId: sessionData.participant.id,
        enteredByName: currentUserName,
        enteredByRole: currentUserRole,
        sessionType: sessionData.type,
      });

      // Notify the other participant
      const result = await notifySessionEntered({
        sessionId: sessionData.id,
        otherParticipantId: sessionData.participant.id,
        enteredByName: currentUserName,
        enteredByRole: currentUserRole as 'client' | 'supporter',
        sessionType: sessionData.type,
      });

      console.log('[Session] Session entered notification result:', result);
    };

    sendEnteredNotification();
  }, [sessionData, dailySession?.roomUrl, currentUserName, currentUserRole]);

  // Subscribe to session status changes (detect when other participant ends session)
  // Uses both database subscription AND a broadcast channel for reliable delivery
  useEffect(() => {
    if (!sessionData?.id || !supabase || sessionEnded) return;

    // Handler for when session ends (from any source)
    const handleSessionEnded = (endedAt: Date, endedBy: 'self' | 'other') => {
      if (sessionEnded) return; // Already handled

      // Log that session was ended
      logSessionEvent(
        sessionData.id,
        sessionData.type,
        currentUserId,
        'session_end',
        { endedBy: endedBy === 'other' ? 'other_participant' : 'self', participantId: sessionData.participant.id }
      );

      // Reset supporter's in_session flag
      const supporterId = currentUserRole === 'supporter'
        ? currentUserId
        : sessionData.participant.id;
      setInSessionStatus(supporterId, false); // Fire-and-forget

      // Show alert only if ended by other participant
      if (endedBy === 'other') {
        Alert.alert(
          'Session Ended',
          `${sessionData.participant.name} has ended the session.`,
          [{ text: 'OK' }]
        );
      }

      setSessionEndedAt(endedAt);
      setSessionEnded(true);
    };

    // 1. Subscribe to database changes (as backup)
    const dbChannel = supabase
      .channel(`session-status:${sessionData.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionData.id}`,
        },
        (payload) => {
          // If session was ended by other participant, show ended screen
          if (payload.new.status === 'completed' && !sessionEnded) {
            // Use the actual ended_at timestamp from database if available
            const endedAt = payload.new.ended_at ? new Date(payload.new.ended_at) : new Date();
            handleSessionEnded(endedAt, 'other');
          }
        }
      )
      .subscribe();

    // 2. Subscribe to broadcast channel for immediate notification
    const broadcastChannel = supabase
      .channel(`session-end:${sessionData.id}`)
      .on('broadcast', { event: 'session_ended' }, (payload) => {
        // Ignore if we're the one who sent it
        if (payload.payload?.endedBy === currentUserId) return;
        if (sessionEnded) return;

        const endedAt = payload.payload?.endedAt ? new Date(payload.payload.endedAt) : new Date();
        handleSessionEnded(endedAt, 'other');
      })
      .subscribe();

    return () => {
      dbChannel.unsubscribe();
      broadcastChannel.unsubscribe();
    };
  }, [sessionData?.id, sessionData?.type, sessionData?.participant?.name, sessionData?.participant?.id, currentUserId, sessionEnded]);

  // Handle connection issue - show post-call contact window
  const handleConnectionIssue = async (reason: 'timeout' | 'disconnect' | 'network') => {
    // Log the connection issue
    if (sessionData?.id) {
      const eventType = reason === 'timeout' ? 'connection_timeout' : 'connection_lost';
      logSessionEvent(
        sessionData.id,
        sessionData.type,
        currentUserId,
        eventType,
        { reason, participantId: sessionData.participant.id }
      );
    }

    // Clean up Daily.co room on connection issues
    if (dailySession?.roomUrl) {
      const roomName = getRoomNameFromUrl(dailySession.roomUrl);
      if (roomName) {
        await deleteRoom(roomName);
      }
    }
    setConnectionIssueReason(reason);
    setShowPostCallContact(true);
  };

  // Close post-call contact and go back
  const handleClosePostCallContact = () => {
    setShowPostCallContact(false);
    // If we came from session ended screen, go back to that
    if (connectionIssueReason === 'session_ended') {
      // Stay on session ended screen - don't navigate away
      return;
    }
    // Route to appropriate dashboard based on user role
    router.replace(currentUserRole === 'supporter' ? '/(supporter)' : '/(client)');
  };

  // Open post-call contact for follow-up messaging after session ends
  const handleOpenFollowUpChat = () => {
    // Check if 10-minute window has expired
    if (sessionEndedAt) {
      const elapsed = Date.now() - sessionEndedAt.getTime();
      const tenMinutesMs = 5 * 60 * 1000;
      if (elapsed >= tenMinutesMs) {
        Alert.alert(
          'Contact Window Expired',
          'The 5-minute follow-up window has ended. You can contact your supporter through the messages feature.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setConnectionIssueReason('session_ended');
    setShowPostCallContact(true);
  };

  // Check if follow-up chat is still available (within 10 minutes)
  const isFollowUpAvailable = () => {
    if (!sessionEndedAt) return false;
    return followUpTimeRemaining > 0;
  };

  // Countdown timer for follow-up chat availability
  useEffect(() => {
    if (!sessionEndedAt || !sessionEnded) return;

    const tenMinutesMs = 5 * 60 * 1000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - sessionEndedAt.getTime();
      const remaining = Math.max(0, tenMinutesMs - elapsed);
      setFollowUpTimeRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionEndedAt, sessionEnded]);

  // Subscribe to post-call chat events (when other person opens/closes the chat)
  useEffect(() => {
    if (!sessionData?.id || !supabase || !sessionEnded) return;

    // Capture reference for use in cleanup
    const sb = supabase;
    const channelId = `post-call-${sessionData.id}`;

    const channel = sb
      .channel(channelId)
      .on('broadcast', { event: 'chat_opened' }, (payload) => {
        // Other participant opened the chat - auto-open it for us too
        if (payload.payload?.openedBy !== currentUserId && !showPostCallContact) {
          console.log('[Session] Other participant opened follow-up chat, auto-opening...');
          setConnectionIssueReason('session_ended');
          setShowPostCallContact(true);
        }
      })
      .on('broadcast', { event: 'chat_closed' }, (payload) => {
        // Other participant closed the chat - close it for us too
        if (payload.payload?.closedBy !== currentUserId && showPostCallContact) {
          console.log('[Session] Other participant closed follow-up chat, closing...');
          Alert.alert(
            'Chat Ended',
            `${payload.payload?.closedByName || sessionData.participant.name} has ended the follow-up chat.`,
            [{ text: 'OK' }]
          );
          setShowPostCallContact(false);
        }
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sessionData?.id, sessionEnded, currentUserId, showPostCallContact, sessionData?.participant?.name]);

  // Format remaining time for display
  const formatFollowUpTime = () => {
    const minutes = Math.floor(followUpTimeRemaining / 60000);
    const seconds = Math.floor((followUpTimeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleBackToDashboard = () => {
    // Route to appropriate dashboard based on user role
    router.replace(currentUserRole === 'supporter' ? '/(supporter)' : '/(client)');
  };

  // Loading state
  if (isLoadingSession) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Retry function for retryable errors
  const handleRetry = () => {
    setLoadError(null);
    setIsRetryable(false);
    setIsLoadingSession(true);
    setRetryCount(prev => prev + 1);
  };

  // Error state
  if (loadError || !sessionData) {
    // Determine error title based on error type
    const errorTitle = loadError?.includes('sign in')
      ? 'Sign In Required'
      : loadError?.includes('Connection')
        ? 'Connection Error'
        : loadError?.includes('scheduled for')
          ? 'Too Early'
          : loadError?.includes('Payment')
            ? 'Payment Required'
            : 'Session Not Found';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>{errorTitle}</Text>
          <Text style={styles.errorMessage}>
            {loadError || 'This session could not be loaded. It may have been cancelled or does not exist.'}
          </Text>
          {isRetryable && (
            <TouchableOpacity
              style={[styles.errorButton, { marginBottom: Spacing.md }]}
              onPress={handleRetry}
            >
              <LinearGradient
                colors={[PsychiColors.azure, PsychiColors.deep]}
                style={styles.errorButtonGradient}
              >
                <Text style={styles.errorButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.errorButton, isRetryable && styles.errorButtonSecondary]}
            onPress={() => router.back()}
          >
            {isRetryable ? (
              <View style={styles.errorButtonOutline}>
                <Text style={styles.errorButtonTextOutline}>Go Back</Text>
              </View>
            ) : (
              <LinearGradient
                colors={[PsychiColors.azure, PsychiColors.deep]}
                style={styles.errorButtonGradient}
              >
                <Text style={styles.errorButtonText}>Go Back</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Post-call contact view (10-minute window after connection issue or session end)
  if (showPostCallContact && sessionData) {
    return (
      <PostCallContact
        sessionId={sessionData.id}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        otherParticipant={sessionData.participant}
        issueReason={connectionIssueReason || 'disconnect'}
        callType={sessionData.type}
        onClose={handleClosePostCallContact}
        sessionEndedAt={sessionEndedAt || undefined}
      />
    );
  }

  // Session ended view
  if (sessionEnded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.endedContainer}>
          <View style={styles.endedCard}>
            <View style={styles.endedIcon}>
              <CheckCircleIcon size={60} color={PsychiColors.success} />
            </View>
            <Text style={styles.endedTitle}>Session Completed</Text>
            <Text style={styles.endedSubtitle}>
              Your {sessionData.type} session with {sessionData.participant.name} has ended.
            </Text>

            {/* Session Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Session Type</Text>
                <Text style={styles.summaryValue}>
                  {sessionData.type.charAt(0).toUpperCase() + sessionData.type.slice(1)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{sessionData.duration} minutes</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Supporter</Text>
                <Text style={styles.summaryValue}>{sessionData.participant.name}</Text>
              </View>
            </View>

            {/* Session Complete Message */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>Session Complete</Text>
              <Text style={styles.feedbackText}>
                Thank you for using Psychi. We hope your session was helpful.
              </Text>
            </View>

            {/* Follow-up Message Button - available for 10 minutes after session ends */}
            {isFollowUpAvailable() && (
              <TouchableOpacity
                style={styles.followUpButton}
                onPress={handleOpenFollowUpChat}
                activeOpacity={0.8}
              >
                <Text style={styles.followUpButtonText}>
                  Message {sessionData.participant.name}
                </Text>
                <Text style={styles.followUpSubtext}>
                  {formatFollowUpTime()} remaining
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[PsychiColors.azure, PsychiColors.deep]}
                style={styles.doneButtonGradient}
              >
                <Text style={styles.doneButtonText}>Back to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render appropriate session component
  const renderSession = () => {
    switch (sessionData.type) {
      case 'chat':
        return (
          <ChatSession
            sessionId={sessionData.id}
            otherParticipant={sessionData.participant}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onEndSession={handleEndSession}
            onAutoEnd={confirmEndSession}
            sessionDurationMinutes={sessionData.duration}
          />
        );
      case 'phone':
      case 'video':
        // Show loading while checking permissions or creating room
        if (checkingPermissions) {
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={PsychiColors.azure} />
                <Text style={styles.loadingText}>Checking permissions...</Text>
              </View>
            </View>
          );
        }
        if (!permissionsGranted) {
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <Text style={styles.loadingText}>Permissions required to join call</Text>
              </View>
            </View>
          );
        }
        if (isCreatingRoom || !dailySession?.roomUrl) {
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={PsychiColors.azure} />
                <Text style={styles.loadingText}>Setting up your call...</Text>
              </View>
            </View>
          );
        }
        return (
          <VideoCall
            roomUrl={dailySession.roomUrl}
            participantName={currentUserName}
            otherParticipant={sessionData.participant}
            isVideoEnabled={sessionData.type === 'video'}
            onEndCall={confirmEndSession}
            onRemoteEndCall={handleRemoteEndSession}
            onConnectionIssue={handleConnectionIssue}
            sessionId={sessionData.id}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderSession()}

      {/* End Session Confirmation Modal */}
      <Modal
        visible={showEndConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Session?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to end this {sessionData.type} session?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEndConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmEndSession}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[PsychiColors.error, '#C53030']}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>End Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: PsychiColors.textMuted,
  },
  endedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  endedCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  endedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  endedEmoji: {
    fontSize: 40,
  },
  endedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.xs,
  },
  endedSubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: Spacing.xs,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  feedbackText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  starText: {
    fontSize: 32,
  },
  followUpButton: {
    width: '100%',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
  },
  followUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  followUpSubtext: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  doneButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  // Error state styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorIconText: {
    fontSize: 40,
    fontWeight: '700',
    color: PsychiColors.error,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  errorButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 200,
  },
  errorButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  errorButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  errorButtonSecondary: {
    // No additional styles needed - used as a marker for conditional rendering
  },
  errorButtonOutline: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PsychiColors.azure,
    borderRadius: BorderRadius.lg,
  },
  errorButtonTextOutline: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
});
