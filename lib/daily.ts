/**
 * Daily.co Video/Voice Call Service for React Native
 * Handles room creation and session management
 *
 * NOTE: Daily.co API key is stored server-side in Supabase secrets.
 * All Daily.co API operations go through the daily-room Edge Function.
 */

import { supabase } from '@/lib/supabase';

export interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: {
    exp?: number;
    nbf?: number;
    max_participants?: number;
    enable_chat?: boolean;
    start_video_off?: boolean;
    start_audio_off?: boolean;
    enable_e2ee_sframe?: boolean;
  };
}

export interface CreateRoomOptions {
  name?: string;
  expiryMinutes?: number;
  maxParticipants?: number;
  startVideoOff?: boolean;
  startAudioOff?: boolean;
}

// Generate a unique room name
export const generateRoomName = (prefix: string = 'psychi'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
};

// Create a Daily.co room via Edge Function (API key is server-side)
export const createRoom = async (options: CreateRoomOptions = {}): Promise<DailyRoom | null> => {
  const {
    name = generateRoomName(),
    expiryMinutes = 60,
    maxParticipants = 2,
    startVideoOff = false,
    startAudioOff = false,
  } = options;

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    console.log('Daily.co: Creating room via Edge Function:', name);

    const { data, error } = await supabase.functions.invoke('daily-room', {
      body: {
        action: 'create',
        name,
        expiryMinutes,
        maxParticipants,
        startVideoOff,
        startAudioOff,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      throw new Error(`Edge Function error: ${error.message}`);
    }

    if (data?.error) {
      console.error('Daily API error:', data.error);
      throw new Error(data.error);
    }

    console.log('Daily.co: Room created successfully:', data.name, data.url);
    return data;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Error creating Daily room:', errorMsg);
    throw new Error(`Daily room creation failed: ${errorMsg}`);
  }
};

// Delete a Daily.co room via Edge Function (API key is server-side)
export const deleteRoom = async (roomName: string): Promise<boolean> => {
  if (!supabase) {
    console.error('Supabase client not initialized');
    return false;
  }

  try {
    console.log('Daily.co: Deleting room via Edge Function:', roomName);

    const { data, error } = await supabase.functions.invoke('daily-room', {
      body: {
        action: 'delete',
        roomName,
      },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return false;
    }

    return data?.success === true;
  } catch (error) {
    console.error('Error deleting Daily room:', error);
    return false;
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
      roomName: generateRoomName('chat'),
    };
  }

  // Create Daily room for video/voice
  // This will throw with error details if it fails
  const room = await createRoom({
    startVideoOff: type === 'voice',
    startAudioOff: false,
  });

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

// Extract room name from Daily.co room URL
// URL format: https://domain.daily.co/room-name
export const getRoomNameFromUrl = (roomUrl: string): string | null => {
  try {
    const url = new URL(roomUrl);
    const pathname = url.pathname;
    // Remove leading slash and return room name
    return pathname.startsWith('/') ? pathname.slice(1) : pathname;
  } catch {
    return null;
  }
};
