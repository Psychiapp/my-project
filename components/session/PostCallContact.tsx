/**
 * PostCallContact Component
 * Provides a 10-minute window for supporter and client to communicate
 * after a call drops due to connection issues.
 * For troubleshooting and rescheduling purposes only.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ClockIcon, SendIcon, AlertIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';

const CONTACT_WINDOW_MINUTES = 10;
const CONTACT_WINDOW_MS = CONTACT_WINDOW_MINUTES * 60 * 1000;

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  isOwn: boolean;
}

interface PostCallContactProps {
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  otherParticipant: {
    id: string;
    name: string;
  };
  issueReason: 'timeout' | 'disconnect' | 'network';
  callType: 'phone' | 'video';
  onClose: () => void;
}

export default function PostCallContact({
  sessionId,
  currentUserId,
  currentUserName,
  otherParticipant,
  issueReason,
  callType,
  onClose,
}: PostCallContactProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(CONTACT_WINDOW_MS);
  const [isExpired, setIsExpired] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const startTimeRef = useRef(Date.now());

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = CONTACT_WINDOW_MS - elapsed;

      if (remaining <= 0) {
        setIsExpired(true);
        setTimeRemaining(0);
        clearInterval(interval);
        Alert.alert(
          'Contact Window Expired',
          'The 10-minute contact window has ended. You can reschedule from your dashboard.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [onClose]);

  // Subscribe to messages (using session_messages table or similar)
  useEffect(() => {
    if (!supabase) return;

    // Create a unique channel for this post-call contact
    const channelId = `post-call-${sessionId}`;

    const channel = supabase
      .channel(channelId)
      .on('broadcast', { event: 'message' }, (payload) => {
        const newMessage: Message = {
          id: payload.payload.id,
          content: payload.payload.content,
          senderId: payload.payload.senderId,
          timestamp: new Date(payload.payload.timestamp),
          isOwn: payload.payload.senderId === currentUserId,
        };
        setMessages((prev) => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, currentUserId]);

  // Format time remaining
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Get issue description
  const getIssueDescription = () => {
    switch (issueReason) {
      case 'timeout':
        return 'The call could not connect';
      case 'disconnect':
        return 'The other participant disconnected';
      case 'network':
        return 'Network connection was lost';
      default:
        return 'Connection issue occurred';
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || isExpired || !supabase) return;

    const messageId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newMessage: Message = {
      id: messageId,
      content: inputText.trim(),
      senderId: currentUserId,
      timestamp: new Date(),
      isOwn: true,
    };

    // Add to local state immediately
    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Broadcast to other participant
    const channelId = `post-call-${sessionId}`;
    await supabase.channel(channelId).send({
      type: 'broadcast',
      event: 'message',
      payload: {
        id: messageId,
        content: newMessage.content,
        senderId: currentUserId,
        senderName: currentUserName,
        timestamp: newMessage.timestamp.toISOString(),
      },
    });

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Render message item
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.isOwn && styles.messageRowOwn]}>
      <View style={[styles.messageBubble, item.isOwn ? styles.messageBubbleOwn : styles.messageBubbleOther]}>
        <Text style={[styles.messageText, item.isOwn && styles.messageTextOwn]}>
          {item.content}
        </Text>
        <Text style={[styles.messageTime, item.isOwn && styles.messageTimeOwn]}>
          {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  // Quick message suggestions
  const quickMessages = [
    "I'm having connection issues. Can we try again?",
    "Let's reschedule for later today.",
    "Sorry about the technical difficulties!",
    "Can you hear me now?",
  ];

  const handleQuickMessage = (message: string) => {
    setInputText(message);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.alertIconContainer}>
            <AlertIcon size={20} color={PsychiColors.warning} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Connection Issue</Text>
            <Text style={styles.headerSubtitle}>{getIssueDescription()}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>

      {/* Timer Banner */}
      <View style={styles.timerBanner}>
        <ClockIcon size={16} color={PsychiColors.white} />
        <Text style={styles.timerText}>
          Contact window: {formatTimeRemaining()} remaining
        </Text>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Temporary Contact Window</Text>
        <Text style={styles.infoText}>
          You have 10 minutes to message {otherParticipant.name} about the {callType} call issue.
          Use this to troubleshoot or reschedule your session.
        </Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Send a message to {otherParticipant.name} about rescheduling
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Quick Messages */}
        {messages.length === 0 && (
          <View style={styles.quickMessagesContainer}>
            <Text style={styles.quickMessagesLabel}>Quick messages:</Text>
            <View style={styles.quickMessagesList}>
              {quickMessages.map((msg, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickMessageChip}
                  onPress={() => handleQuickMessage(msg)}
                >
                  <Text style={styles.quickMessageText}>{msg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={isExpired ? 'Contact window expired' : 'Type a message...'}
            placeholderTextColor={PsychiColors.textMuted}
            editable={!isExpired}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isExpired) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isExpired}
          >
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep]}
              style={styles.sendButtonGradient}
            >
              <SendIcon size={20} color={PsychiColors.white} />
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
    flex: 1,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  closeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  timerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.warning,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  infoCard: {
    backgroundColor: 'rgba(74, 144, 226, 0.08)',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.15)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyStateText: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
  },
  messageRow: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  messageBubbleOwn: {
    backgroundColor: PsychiColors.azure,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: PsychiColors.white,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: PsychiColors.textPrimary,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: PsychiColors.white,
  },
  messageTime: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
  },
  quickMessagesContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  quickMessagesLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.sm,
  },
  quickMessagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  quickMessageChip: {
    backgroundColor: PsychiColors.white,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
  },
  quickMessageText: {
    fontSize: 13,
    color: PsychiColors.azure,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: PsychiColors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: PsychiColors.textPrimary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sendButton: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
