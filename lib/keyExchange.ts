/**
 * Key Exchange Service
 * Handles public key storage and retrieval via Supabase
 *
 * Security notes:
 * - Only PUBLIC keys are stored in the database
 * - Private keys NEVER leave the device
 * - Public keys can be safely shared - they're used for encryption only
 */

import { supabase } from './supabase';
import {
  getOrCreateKeyPair,
  getStoredKeyPair,
  deleteStoredKeys,
  KeyPair,
} from './encryption';

/**
 * Initialize E2E encryption for the current user
 * - Gets or creates a key pair
 * - Uploads the public key to Supabase
 *
 * @param userId - The current user's ID
 * @returns The user's key pair
 */
export const initializeE2EEncryption = async (userId: string): Promise<KeyPair> => {
  // Get or create the local key pair
  const keyPair = await getOrCreateKeyPair();

  // Upload public key to Supabase (if Supabase is available)
  if (supabase) {
    try {
      // Upsert the public key (insert or update if exists)
      const { error } = await supabase
        .from('user_public_keys')
        .upsert(
          {
            user_id: userId,
            public_key: keyPair.publicKey,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) {
        console.warn('Failed to upload public key to server:', error.message);
        // Don't throw - encryption can still work locally
      }
    } catch (err) {
      console.warn('Error uploading public key:', err);
    }
  }

  return keyPair;
};

/**
 * Get another user's public key for encrypting messages to them
 *
 * @param userId - The user ID whose public key we want
 * @returns The user's public key (Base64 encoded) or null if not found
 */
export const getPublicKey = async (userId: string): Promise<string | null> => {
  if (!supabase) {
    console.warn('Supabase not initialized');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('user_public_keys')
      .select('public_key')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.warn('Failed to fetch public key:', error.message);
      return null;
    }

    return data?.public_key || null;
  } catch (err) {
    console.warn('Error fetching public key:', err);
    return null;
  }
};

/**
 * Get public keys for multiple users (batch fetch)
 *
 * @param userIds - Array of user IDs
 * @returns Map of userId -> publicKey
 */
export const getPublicKeys = async (
  userIds: string[]
): Promise<Map<string, string>> => {
  const keyMap = new Map<string, string>();

  if (!supabase || userIds.length === 0) {
    return keyMap;
  }

  try {
    const { data, error } = await supabase
      .from('user_public_keys')
      .select('user_id, public_key')
      .in('user_id', userIds);

    if (error) {
      console.warn('Failed to fetch public keys:', error.message);
      return keyMap;
    }

    data?.forEach((row) => {
      keyMap.set(row.user_id, row.public_key);
    });
  } catch (err) {
    console.warn('Error fetching public keys:', err);
  }

  return keyMap;
};

/**
 * Rotate keys - generates new key pair and uploads new public key
 * Use this if keys are compromised or for periodic security rotation
 *
 * @param userId - The current user's ID
 * @returns The new key pair
 */
export const rotateKeys = async (userId: string): Promise<KeyPair> => {
  // Delete old keys
  await deleteStoredKeys();

  // Initialize will create new keys and upload
  return initializeE2EEncryption(userId);
};

/**
 * Verify a conversation partner's public key
 * This can be used for manual key verification (like Signal's safety numbers)
 *
 * @param userId - The user to verify
 * @param expectedPublicKey - The expected public key (from out-of-band verification)
 * @returns True if the keys match
 */
export const verifyPublicKey = async (
  userId: string,
  expectedPublicKey: string
): Promise<boolean> => {
  const actualPublicKey = await getPublicKey(userId);
  return actualPublicKey === expectedPublicKey;
};

/**
 * Get the current user's public key (for sharing/verification)
 */
export const getMyPublicKey = async (): Promise<string | null> => {
  const keyPair = await getStoredKeyPair();
  return keyPair?.publicKey || null;
};

/**
 * Generate a verification code from a public key
 * This creates a short, human-readable code for verifying keys in person
 *
 * @param publicKey - Base64 encoded public key
 * @returns A short verification code
 */
export const generateVerificationCode = (publicKey: string): string => {
  // Simple hash-like code from the first 8 characters of the key
  // In production, use a proper hash function
  const simplified = publicKey.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const chunks = [];
  for (let i = 0; i < 16 && i < simplified.length; i += 4) {
    chunks.push(simplified.substring(i, i + 4));
  }
  return chunks.join('-');
};
