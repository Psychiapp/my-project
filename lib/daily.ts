/**
 * Daily.co Video/Voice Call Service for React Native
 * Handles room creation and session management
 */

const DAILY_API_URL = 'https://api.daily.co/v1';
// TEMPORARY: Hardcoded API key until next full build
// The || fallback wasn't working because process.env returns empty string, not undefined
const DAILY_API_KEY = '95564a26a801e68281cf572e06423bc1546915ca1110f57041cb99a0ac5cc957';

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

// Create a Daily.co room
export const createRoom = async (options: CreateRoomOptions = {}): Promise<DailyRoom | null> => {
  const {
    name = generateRoomName(),
    expiryMinutes = 60,
    maxParticipants = 2,
    startVideoOff = false,
    startAudioOff = false,
  } = options;

  const exp = Math.floor(Date.now() / 1000) + (expiryMinutes * 60);

  try {
    // Debug: Log API key status
    console.log('Daily.co: API key check - length:', DAILY_API_KEY?.length || 0, 'truthy:', !!DAILY_API_KEY);

    // If no API key, video/voice calls are not available
    if (!DAILY_API_KEY) {
      console.error('Daily.co: No API key configured - this should not happen with hardcoded key');
      return null;
    }

    console.log('Daily.co: Creating room with name:', name);
    console.log('Daily.co: API key prefix:', DAILY_API_KEY.substring(0, 12) + '...');

    const response = await fetch(`${DAILY_API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name,
        properties: {
          exp,
          max_participants: maxParticipants,
          enable_chat: true,
          start_video_off: startVideoOff,
          start_audio_off: startAudioOff,
          enable_screenshare: false,
          enable_recording: false,
          // Note: E2EE SFrame requires a paid Daily.co plan
          // Calls are still encrypted in transit via SRTP
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Failed to create Daily room:', response.status, errorBody);
      throw new Error(`Daily API error ${response.status}: ${errorBody}`);
    }

    const room = await response.json();
    console.log('Daily.co: Room created successfully:', room.name, room.url);
    return room;
  } catch (error: any) {
    const errorMsg = error?.message || String(error);
    console.error('Error creating Daily room:', errorMsg);
    // Throw with details so caller can show them
    throw new Error(`Daily room creation failed: ${errorMsg}`);
  }
};

// Delete a Daily.co room
export const deleteRoom = async (roomName: string): Promise<boolean> => {
  if (!DAILY_API_KEY) {
    return true;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting Daily room:', error);
    return false;
  }
};

// Get room info
export const getRoom = async (roomName: string): Promise<DailyRoom | null> => {
  if (!DAILY_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Daily room:', error);
    return null;
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

// Check if Daily.co is configured
export const isDailyConfigured = (): boolean => {
  return !!DAILY_API_KEY;
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
