import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SupabaseConfig } from '@/constants/config';

// Custom storage adapter for React Native using SecureStore
// With error handling to recover from corrupted sessions
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      // If there's an error reading, try to clear the corrupted data
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (e) {
        // Ignore delete errors
      }
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
      // If we can't save, that's okay - user will need to log in again next time
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
      // Ignore remove errors
    }
  },
};

// Create Supabase client (or mock if no config)
let supabase: SupabaseClient | null = null;

if (SupabaseConfig.url && SupabaseConfig.anonKey) {
  supabase = createClient(
    SupabaseConfig.url,
    SupabaseConfig.anonKey,
    {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
}

export { supabase };

// Auth helper functions
export const signUp = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized') };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized') };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  if (!supabase) {
    return { error: new Error('Supabase client not initialized') };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  if (!supabase) {
    return { user: null, error: new Error('Supabase client not initialized') };
  }
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  if (!supabase) {
    return { session: null, error: new Error('Supabase client not initialized') };
  }
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};

export const resetPassword = async (email: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase client not initialized') };
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'psychi://reset-password',
  });
  return { data, error };
};
