import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { SupabaseConfig } from '@/constants/config';

// Custom storage adapter for React Native using SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
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
