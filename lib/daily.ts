/**
 * Daily.co Video/Voice Call Service for React Native
 * Room creation is handled server-side via a Supabase Edge Function.
 * The Daily.co API key is never exposed to the client.
 */

import { SupabaseConfig } from '@/constants/config';

export interface CreateRoomOptions {
  type?: 'video' | 'voice';
  expiryMinutes?: number;
}

export interface DailyRoom {
  url: string;
  name: string;
}

// Create a Daily.co room via the server-side Edge Function
export const createRoom = async (options: CreateRoomOptions = {}): Promise<DailyRoom | null> => {
  if (!SupabaseConfig.url || !SupabaseConfig.anonKey) {
    console.warn('Daily.co: Supabase not configured. Video/voice calls unavailable.');
    return null;
  }

  try {
    const response = await fetch(`${SupabaseConfig.url}/functions/v1/create-daily-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SupabaseConfig.anonKey}`,
      },
      body: JSON.stringify({
        type: options.type ?? 'video',
        expiryMinutes: options.expiryMinutes ?? 60,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Error creating Daily room:', errorMsg);
    throw new Error(`Daily room creation failed: ${errorMsg}`);
  }
};

// Session types
export type SessionType = 'video' | 'voice' | 'chat';

export interface SessionConfig {
  type: SessionType;
  roomUrl?: string;
  roomName?: string;
  participantName: string;
  supporterId?: string;
  clientId?: string;
}

// Create a session based on type
// Throws error with details if room creation fails
export const createSession = async (
  type: SessionType,
  participantName: string
): Promise<SessionConfig> => {
  if (type === 'chat') {
    // Chat sessions use separate E2E encryption via TweetNaCl
    return {
      type: 'chat',
      participantName,
      roomName: `chat-${Date.now()}`,
    };
  }

  const room = await createRoom({ type });

  if (!room) {
    throw new Error('Room creation returned null');
  }

  return {
    type,
    roomUrl: room.url,
    roomName: room.name,
    participantName,
  };
};

// Check if Daily.co is configured (Supabase must be set up)
export const isDailyConfigured = (): boolean => {
  return !!(SupabaseConfig.url && SupabaseConfig.anonKey);
};
