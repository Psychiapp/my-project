/**
 * Daily.co Video/Voice Call Service for React Native
 * Handles room creation and session management
 */

const DAILY_API_URL = 'https://api.daily.co/v1';
const DAILY_API_KEY = process.env.EXPO_PUBLIC_DAILY_API_KEY || '';

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
    // If no API key, use demo mode
    if (!DAILY_API_KEY) {
      console.log('Daily.co: No API key found, using demo mode');
      return {
        id: name,
        name: name,
        url: `https://psychi.daily.co/${name}`,
        created_at: new Date().toISOString(),
        config: {
          exp,
          max_participants: maxParticipants,
          start_video_off: startVideoOff,
          start_audio_off: startAudioOff,
        },
      };
    }

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
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Failed to create Daily room:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Daily room:', error);
    return null;
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
export const createSession = async (
  type: SessionType,
  participantName: string
): Promise<SessionConfig | null> => {
  if (type === 'chat') {
    return {
      type: 'chat',
      participantName,
      roomName: generateRoomName('chat'),
    };
  }

  // Create Daily room for video/voice
  const room = await createRoom({
    startVideoOff: type === 'voice',
    startAudioOff: false,
  });

  if (!room) {
    return null;
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
