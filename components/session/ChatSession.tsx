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
  ActivityIndicator,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { LockIcon, MoreHorizontalIcon } from '@/components/icons';
import { useEncryptedChat, ChatMessage } from '@/hooks/useEncryptedChat';
import EmergencyButton from './EmergencyButton';
import ReportUserModal from '@/components/ReportUserModal';
import BlockUserModal from '@/components/BlockUserModal';

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

  // Local state for messages (fallback when encryption not available)
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const showMoreOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report User', 'Block User'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setShowReportModal(true);
          } else if (buttonIndex === 2) {
            setShowBlockModal(true);
          }
        }
      );
    } else {
      // Android fallback using Alert
      Alert.alert(
        'Options',
        '',
        [
          { text: 'Report User', onPress: () => setShowReportModal(true) },
          { text: 'Block User', onPress: () => setShowBlockModal(true), style: 'destructive' },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleUserBlocked = () => {
    // End the session when user is blocked
    onEndSession();
  };

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
    // Note: In local mode, messages are only stored locally
    // For real-time chat, encryption must be set up for both users
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
          <TouchableOpacity style={styles.moreButton} onPress={showMoreOptions}>
            <MoreHorizontalIcon size={20} color={PsychiColors.textSecondary} />
          </TouchableOpacity>
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

      {/* Report/Block Modals */}
      <ReportUserModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={otherParticipant.id}
        reportedUserName={otherParticipant.name}
        sessionId={sessionId}
      />
      <BlockUserModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        blockedUserId={otherParticipant.id}
        blockedUserName={otherParticipant.name}
        onBlocked={handleUserBlocked}
      />
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
    paddingVertical: Spacing.sm + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    color: PsychiColors.textPrimary,
    letterSpacing: 0.3,
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
  moreButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  endButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
  },
  endButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.error,
    letterSpacing: 0.2,
  },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.06)',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 99, 235, 0.08)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  messageBubbleOwn: {
    backgroundColor: PsychiColors.azure,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  messageText: {
    fontSize: 15,
    color: PsychiColors.textPrimary,
    lineHeight: 21,
    letterSpacing: 0.2,
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
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
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
    paddingVertical: Spacing.sm + 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.5)',
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 16,
    maxHeight: 100,
    color: PsychiColors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
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
