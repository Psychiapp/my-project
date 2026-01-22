import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChatIcon, LockIcon } from '@/components/icons';
import { getSessionTranscript } from '@/lib/database';
import type { ChatTranscript, TranscriptMessage } from '@/types/database';

export default function TranscriptViewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [transcript, setTranscript] = useState<ChatTranscript | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTranscript();
    }
  }, [id]);

  const loadTranscript = async () => {
    if (!id) return;

    try {
      const data = await getSessionTranscript(id);
      setTranscript(data);
    } catch (error) {
      console.error('Error loading transcript:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'Unknown';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading transcript...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transcript) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Transcript not found</Text>
          <Text style={styles.errorSubtext}>
            This session may not have a chat transcript, or the session data is unavailable.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Chat Transcript' }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Session Info Header */}
        <View style={styles.sessionInfoCard}>
          <View style={styles.participantsRow}>
            <View style={styles.participantColumn}>
              <Text style={styles.participantRole}>Client</Text>
              <Text style={styles.participantName}>{transcript.session_info.client_name}</Text>
            </View>
            <View style={styles.arrowContainer}>
              <ChatIcon size={24} color={PsychiColors.azure} />
            </View>
            <View style={[styles.participantColumn, styles.rightAlign]}>
              <Text style={styles.participantRole}>Supporter</Text>
              <Text style={styles.participantName}>{transcript.session_info.supporter_name}</Text>
            </View>
          </View>

          <View style={styles.sessionMetaRow}>
            <View style={styles.sessionMeta}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>{formatDate(transcript.session_info.scheduled_at)}</Text>
            </View>
            <View style={styles.sessionMeta}>
              <Text style={styles.metaLabel}>Duration</Text>
              <Text style={styles.metaValue}>{formatDuration(transcript.session_info.duration_minutes)}</Text>
            </View>
            <View style={styles.sessionMeta}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                transcript.session_info.status === 'completed' && styles.statusCompleted
              ]}>
                <Text style={styles.statusText}>
                  {transcript.session_info.status.charAt(0).toUpperCase() + transcript.session_info.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        <View style={styles.messagesSection}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          <Text style={styles.messageCount}>{transcript.messages.length} messages</Text>

          {transcript.messages.length === 0 ? (
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyText}>No messages in this transcript</Text>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {transcript.messages.map((message, index) => (
                <View key={message.id || index} style={styles.messageWrapper}>
                  {/* Date separator - show if first message or different day */}
                  {index === 0 || (
                    new Date(message.created_at).toDateString() !==
                    new Date(transcript.messages[index - 1].created_at).toDateString()
                  ) && (
                    <View style={styles.dateSeparator}>
                      <View style={styles.dateLine} />
                      <Text style={styles.dateText}>
                        {new Date(message.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <View style={styles.dateLine} />
                    </View>
                  )}

                  <View style={[
                    styles.messageBubble,
                    message.sender_role === 'client' ? styles.clientMessage : styles.supporterMessage
                  ]}>
                    <View style={styles.messageHeader}>
                      <Text style={[
                        styles.senderName,
                        message.sender_role === 'client' ? styles.clientName : styles.supporterName
                      ]}>
                        {message.sender_name}
                      </Text>
                      <Text style={styles.messageTime}>{formatTime(message.created_at)}</Text>
                    </View>
                    <Text style={styles.messageContent}>{message.content}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <LockIcon size={16} color={PsychiColors.textMuted} />
          <Text style={styles.privacyText}>
            This transcript is confidential. Access is logged for security purposes.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: PsychiColors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  errorSubtext: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: {
    backgroundColor: PsychiColors.azure,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: PsychiColors.white,
    fontWeight: '600',
  },
  sessionInfoCard: {
    backgroundColor: PsychiColors.white,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  participantsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: Spacing.md,
  },
  participantColumn: {
    flex: 1,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  participantRole: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  arrowContainer: {
    paddingHorizontal: Spacing.md,
  },
  sessionMetaRow: {
    flexDirection: 'row',
  },
  sessionMeta: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  statusBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  messagesSection: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  messageCount: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  emptyMessages: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyText: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  messagesContainer: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  messageWrapper: {
    marginBottom: Spacing.sm,
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dateText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    paddingHorizontal: Spacing.md,
  },
  messageBubble: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    maxWidth: '90%',
  },
  clientMessage: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignSelf: 'flex-start',
  },
  supporterMessage: {
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
  },
  clientName: {
    color: PsychiColors.azure,
  },
  supporterName: {
    color: PsychiColors.coral,
  },
  messageTime: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginLeft: Spacing.sm,
  },
  messageContent: {
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 20,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  privacyIcon: {
    marginRight: Spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: PsychiColors.textMuted,
    lineHeight: 18,
  },
});
