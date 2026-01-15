/**
 * E2E Encryption Service
 * Uses TweetNaCl for public-key authenticated encryption (box)
 *
 * How it works:
 * 1. Each user generates a key pair (public + private key)
 * 2. Public keys are exchanged via the server (stored in Supabase)
 * 3. Messages are encrypted with recipient's public key + sender's private key
 * 4. Only the recipient can decrypt with their private key + sender's public key
 *
 * Security: The server never sees private keys or unencrypted messages
 */

import 'react-native-get-random-values'; // Must be imported before nacl
import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from 'tweetnacl-util';
import * as SecureStore from 'expo-secure-store';

// Storage keys
const PRIVATE_KEY_STORAGE_KEY = 'psychi_e2e_private_key';
const PUBLIC_KEY_STORAGE_KEY = 'psychi_e2e_public_key';

export interface KeyPair {
  publicKey: string; // Base64 encoded
  privateKey: string; // Base64 encoded
}

export interface EncryptedMessage {
  ciphertext: string; // Base64 encoded encrypted message
  nonce: string; // Base64 encoded nonce (required for decryption)
  senderPublicKey: string; // Base64 encoded sender's public key
}

/**
 * Generate a new key pair for the user
 * Should be called once when user first sets up the app
 */
export const generateKeyPair = (): KeyPair => {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keyPair.publicKey),
    privateKey: encodeBase64(keyPair.secretKey),
  };
};

/**
 * Store the key pair securely on the device
 */
export const storeKeyPair = async (keyPair: KeyPair): Promise<void> => {
  await SecureStore.setItemAsync(PRIVATE_KEY_STORAGE_KEY, keyPair.privateKey);
  await SecureStore.setItemAsync(PUBLIC_KEY_STORAGE_KEY, keyPair.publicKey);
};

/**
 * Retrieve the stored key pair
 */
export const getStoredKeyPair = async (): Promise<KeyPair | null> => {
  const privateKey = await SecureStore.getItemAsync(PRIVATE_KEY_STORAGE_KEY);
  const publicKey = await SecureStore.getItemAsync(PUBLIC_KEY_STORAGE_KEY);

  if (!privateKey || !publicKey) {
    return null;
  }

  return { publicKey, privateKey };
};

/**
 * Get or create a key pair
 * Returns existing key pair if available, otherwise generates and stores a new one
 */
export const getOrCreateKeyPair = async (): Promise<KeyPair> => {
  const existingKeyPair = await getStoredKeyPair();

  if (existingKeyPair) {
    return existingKeyPair;
  }

  const newKeyPair = generateKeyPair();
  await storeKeyPair(newKeyPair);
  return newKeyPair;
};

/**
 * Delete stored keys (for logout/account deletion)
 */
export const deleteStoredKeys = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(PRIVATE_KEY_STORAGE_KEY);
  await SecureStore.deleteItemAsync(PUBLIC_KEY_STORAGE_KEY);
};

/**
 * Encrypt a message for a recipient
 *
 * @param message - Plain text message to encrypt
 * @param recipientPublicKey - Base64 encoded public key of the recipient
 * @param senderPrivateKey - Base64 encoded private key of the sender
 * @returns Encrypted message object
 */
export const encryptMessage = (
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): EncryptedMessage => {
  // Decode keys from Base64
  const recipientPubKeyBytes = decodeBase64(recipientPublicKey);
  const senderPrivKeyBytes = decodeBase64(senderPrivateKey);

  // Convert message to bytes
  const messageBytes = decodeUTF8(message);

  // Generate a random nonce (24 bytes for box)
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  // Encrypt the message
  const encryptedBytes = nacl.box(
    messageBytes,
    nonce,
    recipientPubKeyBytes,
    senderPrivKeyBytes
  );

  if (!encryptedBytes) {
    throw new Error('Encryption failed');
  }

  // Get sender's public key from private key for verification
  const senderKeyPair = nacl.box.keyPair.fromSecretKey(senderPrivKeyBytes);

  return {
    ciphertext: encodeBase64(encryptedBytes),
    nonce: encodeBase64(nonce),
    senderPublicKey: encodeBase64(senderKeyPair.publicKey),
  };
};

/**
 * Decrypt a message from a sender
 *
 * @param encryptedMessage - The encrypted message object
 * @param recipientPrivateKey - Base64 encoded private key of the recipient
 * @returns Decrypted plain text message
 */
export const decryptMessage = (
  encryptedMessage: EncryptedMessage,
  recipientPrivateKey: string
): string => {
  // Decode from Base64
  const ciphertextBytes = decodeBase64(encryptedMessage.ciphertext);
  const nonceBytes = decodeBase64(encryptedMessage.nonce);
  const senderPubKeyBytes = decodeBase64(encryptedMessage.senderPublicKey);
  const recipientPrivKeyBytes = decodeBase64(recipientPrivateKey);

  // Decrypt the message
  const decryptedBytes = nacl.box.open(
    ciphertextBytes,
    nonceBytes,
    senderPubKeyBytes,
    recipientPrivKeyBytes
  );

  if (!decryptedBytes) {
    throw new Error('Decryption failed - message may be tampered or wrong key');
  }

  // Convert bytes back to string
  return encodeUTF8(decryptedBytes);
};

/**
 * Verify a message was signed by the expected sender
 * This is automatically done by nacl.box.open - if decryption succeeds,
 * the message is authenticated
 */
export const verifyMessageAuthenticity = (
  encryptedMessage: EncryptedMessage,
  expectedSenderPublicKey: string
): boolean => {
  return encryptedMessage.senderPublicKey === expectedSenderPublicKey;
};

/**
 * Create a shared secret for a conversation
 * This can be used for additional verification or key derivation
 */
export const createSharedSecret = (
  theirPublicKey: string,
  myPrivateKey: string
): string => {
  const theirPubKeyBytes = decodeBase64(theirPublicKey);
  const myPrivKeyBytes = decodeBase64(myPrivateKey);

  const sharedSecret = nacl.box.before(theirPubKeyBytes, myPrivKeyBytes);
  return encodeBase64(sharedSecret);
};

// Export types and utilities for use elsewhere
export { encodeBase64, decodeBase64 };
