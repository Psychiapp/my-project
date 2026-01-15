import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { LockIcon } from '@/components/icons';
import { useEncryptedChat, ChatMessage } from '@/hooks/useEncryptedChat';
import EmergencyButton from './EmergencyButton';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isOwn: boolean;
  isEncrypted?: boolean;
  decryptionFailed?: boolean;
}

interface ChatSessionProps {
  sessionId: string;
  otherParticipant: {
    id: string;
    name: string;
  };
  currentUserId: string;
  currentUserName?: string; // Name of the current user for notifications
  onEndSession: () => void;
  useEncryption?: boolean; // Enable E2E encryption
}

export default function ChatSession({
  sessionId,
  otherParticipant,
  currentUserId,
  currentUserName,
  onEndSession,
  useEncryption = true,
}: ChatSessionProps) {
  // E2E Encrypted chat hook with notification support
  const encryptedChat = useEncryptedChat(sessionId, currentUserId, otherParticipant.id, {
    senderName: currentUserName,
    recipientName: otherParticipant.name,
    conversationId: sessionId,
  });

  // Local state for demo mode (when encryption not available)
  const [localMessages, setLocalMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! Thank you for reaching out. How are you feeling today?",
      senderId: otherParticipant.id,
      timestamp: new Date(Date.now() - 60000 * 5),
      isOwn: false,
      isEncrypted: useEncryption,
    },
    {
      id: '2',
      content: "I've been feeling a bit overwhelmed with work lately. It's hard to stay focused.",
      senderId: currentUserId,
      timestamp: new Date(Date.now() - 60000 * 4),
      isOwn: true,
      isEncrypted: useEncryption,
    },
    {
      id: '3',
      content: "I understand. Work stress can be really challenging. Can you tell me more about what's been overwhelming you?",
      senderId: otherParticipant.id,
      timestamp: new Date(Date.now() - 60000 * 3),
      isOwn: false,
      isEncrypted: useEncryption,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Use encrypted messages if available, otherwise fall back to local
  const messages = encryptedChat.isReady ? encryptedChat.messages : localMessages;

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setIsSending(true);

    if (useEncryption && encryptedChat.isReady) {
      // Send encrypted message
      const success = await encryptedChat.sendMessage(messageContent);
      if (!success) {
        // Fall back to local if encryption fails
        addLocalMessage(messageContent);
      }
    } else {
      // Demo mode - add locally
      addLocalMessage(messageContent);
    }

    setIsSending(false);
  };

  const addLocalMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      senderId: currentUserId,
      timestamp: new Date(),
      isOwn: true,
      isEncrypted: useEncryption,
    };

    setLocalMessages((prev) => [...prev, newMessage]);

    // Simulate typing indicator and response (demo mode only)
    setTimeout(() => setIsTyping(true), 1000);
    setTimeout(() => {
      setIsTyping(false);
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for sharing that. It sounds like you're dealing with a lot right now. Let's work through this together.",
        senderId: otherParticipant.id,
        timestamp: new Date(),
        isOwn: false,
        isEncrypted: useEncryption,
      };
      setLocalMessages((prev) => [...prev, responseMessage]);
    }, 3000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isOwn && styles.messageRowOwn]}>
      {!item.isOwn && (
        <View style={styles.avatarSmall}>
          <Text style={styles.avatarSmallText}>{otherParticipant.name.charAt(0)}</Text>
        </View>
      )}
      <View style={[styles.messageBubble, item.isOwn && styles.messageBubbleOwn]}>
        <Text style={[styles.messageText, item.isOwn && styles.messageTextOwn]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, item.isOwn && styles.messageTimeOwn]}>
          {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[PsychiColors.azure, PsychiColors.deep]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{otherParticipant.name.charAt(0)}</Text>
          </LinearGradient>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherParticipant.name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <EmergencyButton
            sessionId={sessionId}
            sessionType="chat"
            participantName={otherParticipant.name}
            currentUserName={currentUserName}
          />
          <TouchableOpacity style={styles.endButton} onPress={onEndSession}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Session Info Banner */}
      <View style={styles.sessionBanner}>
        {useEncryption && (
          <View style={styles.encryptionBadge}>
            <LockIcon size={12} color={PsychiColors.success} />
            <Text style={styles.encryptionText}>E2E Encrypted</Text>
          </View>
        )}
        <Text style={styles.sessionBannerText}>Chat session in progress</Text>
        <Text style={styles.sessionBannerTime}>30 min</Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{otherParticipant.name.charAt(0)}</Text>
            </View>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={PsychiColors.textSoft}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <LinearGradient
              colors={inputText.trim() ? [PsychiColors.azure, PsychiColors.deep] : ['rgba(0,0,0,0.2)', PsychiColors.textSoft]}
              style={styles.sendButtonGradient}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  headerInfo: {
    marginLeft: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PsychiColors.success,
    marginRight: 4,
  },
  statusText: {
    fontSize: 13,
    color: PsychiColors.success,
  },
  endButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  endButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  encryptionText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  sessionBannerText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  sessionBannerTime: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  avatarSmallText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  messageBubble: {
    maxWidth: '75%',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.soft,
  },
  messageBubbleOwn: {
    backgroundColor: PsychiColors.azure,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#2A2A2A',
    lineHeight: 21,
  },
  messageTextOwn: {
    color: PsychiColors.white,
  },
  messageTime: {
    fontSize: 11,
    color: PsychiColors.textSoft,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  typingBubble: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    borderBottomLeftRadius: 4,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.soft,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PsychiColors.textSoft,
  },
  typingDot1: {
    opacity: 0.4,
  },
  typingDot2: {
    opacity: 0.6,
  },
  typingDot3: {
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    maxHeight: 100,
    color: '#2A2A2A',
  },
  sendButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.white,
  },
});
