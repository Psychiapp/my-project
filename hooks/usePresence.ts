/**
 * usePresence Hook
 * Manages user online/offline presence with AppState integration and heartbeat
 *
 * Features:
 * - Automatically sets online when app is active, offline when backgrounded
 * - 60-second heartbeat to keep last_seen updated
 * - Toggle for supporter availability for live support
 * - In-session status tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/lib/supabase';
import { HEARTBEAT_INTERVAL_MS } from '@/types/liveSupport';
import type { PresenceState } from '@/types/liveSupport';

interface UsePresenceOptions {
  enableHeartbeat?: boolean;
}

interface UsePresenceReturn {
  presence: PresenceState;
  isLoading: boolean;
  setAvailableForLiveSupport: (available: boolean) => Promise<void>;
  setInSession: (inSession: boolean) => Promise<void>;
  updatePresence: (isOnline: boolean) => Promise<void>;
}

export function usePresence(
  userId: string | null,
  options: UsePresenceOptions = {}
): UsePresenceReturn {
  const { enableHeartbeat = true } = options;

  const [presence, setPresence] = useState<PresenceState>({
    isOnline: false,
    lastSeen: null,
    inSession: false,
    availableForLiveSupport: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const isUnmountedRef = useRef(false);

  // Update presence in database
  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!userId || !supabase || isUnmountedRef.current) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.warn('Failed to update presence:', error);
      } else if (!isUnmountedRef.current) {
        setPresence(prev => ({ ...prev, isOnline }));
      }
    } catch (err) {
      console.warn('Presence update error:', err);
    }
  }, [userId]);

  // Heartbeat function using database function
  const sendHeartbeat = useCallback(async () => {
    if (!userId || !supabase || isUnmountedRef.current) return;

    try {
      await supabase.rpc('update_heartbeat', { p_user_id: userId });
    } catch (err) {
      console.warn('Heartbeat error:', err);
    }
  }, [userId]);

  // Toggle live support availability (for supporters)
  const setAvailableForLiveSupport = useCallback(async (available: boolean) => {
    if (!userId || !supabase) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ available_for_live_support: available })
        .eq('id', userId);

      if (!error) {
        setPresence(prev => ({ ...prev, availableForLiveSupport: available }));
      } else {
        console.warn('Failed to update live support availability:', error);
      }
    } catch (err) {
      console.warn('Failed to update live support availability:', err);
    }
  }, [userId]);

  // Set in_session status
  const setInSession = useCallback(async (inSession: boolean) => {
    if (!userId || !supabase) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ in_session: inSession })
        .eq('id', userId);

      if (!error) {
        setPresence(prev => ({ ...prev, inSession }));
      } else {
        console.warn('Failed to update in_session:', error);
      }
    } catch (err) {
      console.warn('Failed to update in_session:', err);
    }
  }, [userId]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (isUnmountedRef.current) return;

      // App came to foreground
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        updatePresence(true);
        if (enableHeartbeat) {
          sendHeartbeat();
        }
      }
      // App went to background
      else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        updatePresence(false);
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [updatePresence, sendHeartbeat, enableHeartbeat]);

  // Initial presence load and setup
  useEffect(() => {
    isUnmountedRef.current = false;

    if (!userId || !supabase) {
      setIsLoading(false);
      return;
    }

    const db = supabase;
    const currentUserId = userId;

    const loadPresence = async () => {
      try {
        const { data, error } = await db
          .from('profiles')
          .select('is_online, last_seen, in_session, available_for_live_support')
          .eq('id', currentUserId)
          .single();

        if (!isUnmountedRef.current && data && !error) {
          setPresence({
            isOnline: data.is_online || false,
            lastSeen: data.last_seen ? new Date(data.last_seen) : null,
            inSession: data.in_session || false,
            availableForLiveSupport: data.available_for_live_support || false,
          });
        }

        // Set online on mount
        await updatePresence(true);
      } catch (err) {
        console.warn('Failed to load presence:', err);
      } finally {
        if (!isUnmountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadPresence();

    // Start heartbeat
    if (enableHeartbeat) {
      heartbeatIntervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    }

    // Cleanup: set offline on unmount
    return () => {
      isUnmountedRef.current = true;

      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Set offline on unmount (fire and forget)
      db
        .from('profiles')
        .update({ is_online: false, last_seen: new Date().toISOString() })
        .eq('id', currentUserId)
        .then(() => {}, () => {});
    };
  }, [userId, updatePresence, sendHeartbeat, enableHeartbeat]);

  return {
    presence,
    isLoading,
    setAvailableForLiveSupport,
    setInSession,
    updatePresence,
  };
}
