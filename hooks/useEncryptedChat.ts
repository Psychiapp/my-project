/**
 * useEncryptedChat Hook
 * Provides E2E encrypted messaging functionality for chat sessions
 *
 * Usage:
 * const { sendMessage, messages, isReady } = useEncryptedChat(sessionId, recipientId);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  encryptMessage,
  decryptMessage,
  getStoredKeyPair,
  EncryptedMessage,
} from '@/lib/encryption';
import { getPublicKey, initializeE2EEncryption } from '@/lib/keyExchange';
import { sendChatMessageNotification } from '@/lib/notifications';

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isOwn: boolean;
  isEncrypted: boolean;
  decryptionFailed?: boolean;
}

interface EncryptedChatState {
  messages: ChatMessage[];
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  recipientPublicKey: string | null;
}

interface UseEncryptedChatReturn extends EncryptedChatState {
  sendMessage: (content: string) => Promise<boolean>;
  refreshMessages: () => Promise<void>;
}

export const useEncryptedChat = (
  sessionId: string,
  currentUserId: string,
  recipientId: string,
  options?: {
    senderName?: string; // Name of current user for outgoing notifications
    recipientName?: string; // Name of recipient for display
    conversationId?: string; // For notification deep linking
  }
): UseEncryptedChatReturn => {
  const [state, setState] = useState<EncryptedChatState>({
    messages: [],
    isReady: false,
    isLoading: true,
    error: null,
    recipientPublicKey: null,
  });

  const myKeyPairRef = useRef<{ publicKey: string; privateKey: string } | null>(null);
  const subscriptionRef = useRef<any>(null);

  // Initialize encryption keys
  useEffect(() => {
    const initKeys = async () => {
      try {
        // Initialize our encryption (creates keys if needed)
        const myKeyPair = await initializeE2EEncryption(currentUserId);
        myKeyPairRef.current = myKeyPair;

        // Get recipient's public key
        const recipientPubKey = await getPublicKey(recipientId);

        if (!recipientPubKey) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Recipient has not set up encryption yet',
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          isReady: true,
          isLoading: false,
          recipientPublicKey: recipientPubKey,
        }));

        // Load existing messages
        await loadMessages(recipientPubKey);

        // Subscribe to new messages
        subscribeToMessages(recipientPubKey);
      } catch (err) {
        console.error('Failed to initialize encryption:', err);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize encryption',
        }));
      }
    };

    initKeys();

    return () => {
      // Cleanup subscription
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [sessionId, currentUserId, recipientId]);

  // Load existing messages from database
  const loadMessages = async (recipientPubKey: string) => {
    if (!supabase || !myKeyPairRef.current) return;

    try {
      const { data, error } = await supabase
        .from('encrypted_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Failed to load messages:', error.message);
        return;
      }

      const decryptedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          return decryptStoredMessage(msg, recipientPubKey);
        })
      );

      setState((prev) => ({
        ...prev,
        messages: decryptedMessages.filter(Boolean) as ChatMessage[],
      }));
    } catch (err) {
      console.warn('Error loading messages:', err);
    }
  };

  // Decrypt a message from the database
  const decryptStoredMessage = async (
    dbMessage: any,
    recipientPubKey: string
  ): Promise<ChatMessage | null> => {
    if (!myKeyPairRef.current) return null;

    const isOwn = dbMessage.sender_id === currentUserId;
    const encryptedMsg: EncryptedMessage = {
      ciphertext: dbMessage.ciphertext,
      nonce: dbMessage.nonce,
      senderPublicKey: dbMessage.sender_public_key,
    };

    try {
      // Decrypt the message
      const decryptedContent = decryptMessage(
        encryptedMsg,
        myKeyPairRef.current.privateKey
      );

      return {
        id: dbMessage.id,
        content: decryptedContent,
        senderId: dbMessage.sender_id,
        timestamp: new Date(dbMessage.created_at),
        isOwn,
        isEncrypted: true,
      };
    } catch (err) {
      console.warn('Failed to decrypt message:', err);
      return {
        id: dbMessage.id,
        content: '[Unable to decrypt message]',
        senderId: dbMessage.sender_id,
        timestamp: new Date(dbMessage.created_at),
        isOwn,
        isEncrypted: true,
        decryptionFailed: true,
      };
    }
  };

  // Subscribe to new messages in real-time
  const subscribeToMessages = (recipientPubKey: string) => {
    if (!supabase) return;

    subscriptionRef.current = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'encrypted_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        async (payload) => {
          const newMessage = await decryptStoredMessage(payload.new, recipientPubKey);
          if (newMessage) {
            setState((prev) => ({
              ...prev,
              messages: [...prev.messages, newMessage],
            }));
          }
        }
      )
      .subscribe();
  };

  // Send an encrypted message
  const sendMessage = useCallback(
    async (content: string): Promise<boolean> => {
      if (!myKeyPairRef.current || !state.recipientPublicKey || !supabase) {
        console.warn('Cannot send message - encryption not ready');
        return false;
      }

      try {
        // Encrypt the message
        const encrypted = encryptMessage(
          content,
          state.recipientPublicKey,
          myKeyPairRef.current.privateKey
        );

        // Store in database
        const { error } = await supabase.from('encrypted_messages').insert({
          session_id: sessionId,
          sender_id: currentUserId,
          recipient_id: recipientId,
          ciphertext: encrypted.ciphertext,
          nonce: encrypted.nonce,
          sender_public_key: encrypted.senderPublicKey,
        });

        if (error) {
          console.error('Failed to send message:', error.message);
          return false;
        }

        // Optimistically add to local messages (will also come via subscription)
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          content,
          senderId: currentUserId,
          timestamp: new Date(),
          isOwn: true,
          isEncrypted: true,
        };

        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, newMessage],
        }));

        // Send push notification to recipient
        if (options?.senderName) {
          // Truncate message preview for notification
          const messagePreview = content.length > 50 ? content.substring(0, 50) + '...' : content;

          sendChatMessageNotification({
            senderName: options.senderName,
            senderId: currentUserId,
            conversationId: options.conversationId || sessionId,
            messagePreview,
          }).catch((err) => {
            // Don't fail the message send if notification fails
            console.warn('Failed to send chat notification:', err);
          });
        }

        return true;
      } catch (err) {
        console.error('Failed to encrypt/send message:', err);
        return false;
      }
    },
    [sessionId, currentUserId, recipientId, state.recipientPublicKey, options?.senderName, options?.conversationId]
  );

  // Refresh messages manually
  const refreshMessages = useCallback(async () => {
    if (state.recipientPublicKey) {
      await loadMessages(state.recipientPublicKey);
    }
  }, [state.recipientPublicKey]);

  return {
    ...state,
    sendMessage,
    refreshMessages,
  };
};

/**
 * Hook for offline-capable encrypted messaging
 * Messages are encrypted locally and queued for sending when online
 */
export const useOfflineEncryptedChat = (
  sessionId: string,
  currentUserId: string,
  recipientId: string,
  options?: {
    senderName?: string;
    recipientName?: string;
    conversationId?: string;
  }
) => {
  // This would extend useEncryptedChat with offline queue functionality
  // For now, just use the online version
  return useEncryptedChat(sessionId, currentUserId, recipientId, options);
};
