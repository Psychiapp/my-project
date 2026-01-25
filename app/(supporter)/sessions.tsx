import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  ChatIcon,
  PhoneIcon,
  VideoIcon,
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  InfoIcon,
  CloseIcon,
} from '@/components/icons';
import {
  cancelSessionWithRefund,
  formatCurrency,
  getSessionPrice,
} from '@/lib/refunds';
import {
  sendSessionCancelledNotification,
  sendRescheduleRequestNotification,
  cancelSessionReminders,
} from '@/lib/notifications';
import {
  createRescheduleRequest,
  calculateResponseDeadline,
  getTimeUntilDeadline,
  getUpcomingSessions,
  getPastSessions,
} from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import type { SessionWithDetails } from '@/types/database';
import { Config } from '@/constants/config';

type SessionTab = 'upcoming' | 'past';

interface Session {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  type: 'chat' | 'phone' | 'video';
  date: string;
  time: string;
  scheduledAt: string;
  duration: number;
  earnings?: number;
  pendingReschedule?: boolean;
}

// Helper to format session data from database
const formatSessionFromDb = (dbSession: SessionWithDetails): Session => {
  const scheduledDate = new Date(dbSession.scheduled_at);
  const client = dbSession.client as { id: string; full_name: string; avatar_url?: string } | null;
  const sessionType = dbSession.session_type as 'chat' | 'phone' | 'video';
  const pricing = Config.pricing[sessionType];

  return {
    id: dbSession.id,
    clientId: client?.id || '',
    clientName: client?.full_name || 'Unknown Client',
    clientEmail: '',
    type: sessionType,
    date: scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    scheduledAt: dbSession.scheduled_at,
    duration: dbSession.duration_minutes || 30,
    earnings: dbSession.status === 'completed' ? (pricing?.supporterCut || 0) / 100 : undefined,
  };
};

const typeIcons: Record<string, React.FC<{ size?: number; color?: string }>> = {
  chat: ChatIcon,
  phone: PhoneIcon,
  video: VideoIcon,
};

// Available time slots for rescheduling
const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

export default function SupporterSessionsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming');
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reschedule states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Fetch sessions from database
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [upcoming, past] = await Promise.all([
          getUpcomingSessions(user.id, 'supporter'),
          getPastSessions(user.id, 'supporter'),
        ]);

        setUpcomingSessions(upcoming.map(formatSessionFromDb));
        setPastSessions(past.map(formatSessionFromDb));
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user?.id]);

  // Generate next 7 days for date selection
  const getAvailableDates = () => {
    const dates: Date[] = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const formatDateOption = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
  };

  const handleCancelPress = (session: Session) => {
    setSelectedSession(session);
    setCancelReason('');
    setCancelModalVisible(true);
  };

  const handleReschedulePress = (session: Session) => {
    setSelectedSession(session);
    setSelectedDate(null);
    setSelectedTime(null);
    setRescheduleModalVisible(true);
  };

  const confirmCancellation = async () => {
    if (!selectedSession) return;

    if (!cancelReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for cancellation.');
      return;
    }

    setIsProcessing(true);

    const sessionPrice = getSessionPrice(selectedSession.type);
    const result = await cancelSessionWithRefund(
      {
        sessionId: selectedSession.id,
        clientName: selectedSession.clientName,
        clientEmail: selectedSession.clientEmail,
        sessionType: selectedSession.type,
        amount: sessionPrice,
        scheduledAt: selectedSession.scheduledAt,
      },
      cancelReason,
      'supporter'
    );

    setIsProcessing(false);

    if (result.success) {
      // Cancel any scheduled reminders for this session
      await cancelSessionReminders(selectedSession.id);

      // Notify the client about the cancellation
      await sendSessionCancelledNotification({
        sessionId: selectedSession.id,
        sessionType: selectedSession.type,
        date: selectedSession.date,
        otherPartyName: 'Your supporter', // Supporter name would come from auth context in production
        isSupporter: false, // Sending to client
        refundAmount: formatCurrency(result.refundAmount),
      });

      // Remove session from list
      setUpcomingSessions(upcomingSessions.filter(s => s.id !== selectedSession.id));
      setCancelModalVisible(false);

      Alert.alert(
        'Session Cancelled',
        `The session with ${selectedSession.clientName} has been cancelled.\n\nA full refund of ${formatCurrency(result.refundAmount)} has been processed for the client.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to cancel session. Please try again.');
    }
  };

  const confirmReschedule = async () => {
    if (!selectedSession || !selectedDate || !selectedTime) {
      Alert.alert('Select Date & Time', 'Please select both a date and time for the rescheduled session.');
      return;
    }

    setIsProcessing(true);

    // Parse the selected time
    const [time, period] = selectedTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : hours;

    const newScheduledTime = new Date(selectedDate);
    newScheduledTime.setHours(adjustedHours, minutes, 0, 0);

    // Create a reschedule request instead of immediately updating
    const request = await createRescheduleRequest(
      selectedSession.id,
      'supporter_id', // Would come from auth context in production
      selectedSession.clientId,
      selectedSession.scheduledAt,
      newScheduledTime.toISOString()
    );

    setIsProcessing(false);

    if (request) {
      // Calculate the response deadline for display
      const deadline = calculateResponseDeadline(selectedSession.scheduledAt);
      const deadlineInfo = getTimeUntilDeadline(deadline.toISOString());

      // Notify the client about the reschedule request
      await sendRescheduleRequestNotification({
        sessionId: selectedSession.id,
        supporterName: 'Your supporter', // Would come from auth context
        proposedDate: formatDateOption(selectedDate),
        proposedTime: selectedTime,
        responseDeadline: deadline.toISOString(),
      });

      // Mark session as having pending reschedule
      setUpcomingSessions(upcomingSessions.map(s => {
        if (s.id === selectedSession.id) {
          return {
            ...s,
            pendingReschedule: true,
          };
        }
        return s;
      }));

      setRescheduleModalVisible(false);

      Alert.alert(
        'Reschedule Request Sent',
        `A request to reschedule your session with ${selectedSession.clientName} to ${formatDateOption(selectedDate)} at ${selectedTime} has been sent.\n\n${selectedSession.clientName} must respond within ${deadlineInfo.formatted}.\n\nIf they don't respond in time, the session will be automatically cancelled and they will receive a full refund.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert('Error', 'Failed to send reschedule request. Please try again.');
    }
  };

  const renderSession = (session: Session, isUpcoming: boolean) => (
    <View key={session.id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.typeIconContainer}>
          {(() => {
            const IconComponent = typeIcons[session.type];
            return IconComponent ? <IconComponent size={20} color={PsychiColors.white} /> : null;
          })()}
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.clientName}>{session.clientName}</Text>
          <Text style={styles.sessionType}>
            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
          </Text>
        </View>
        {session.pendingReschedule && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Pending</Text>
          </View>
        )}
        {!isUpcoming && session.earnings && (
          <View style={styles.earningsBadge}>
            <Text style={styles.earningsText}>+${session.earnings.toFixed(2)}</Text>
          </View>
        )}
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <CalendarIcon size={14} color={PsychiColors.textMuted} />
          <Text style={styles.detailText}>{session.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <ClockIcon size={14} color={PsychiColors.textMuted} />
          <Text style={styles.detailText}>{session.time}</Text>
        </View>
        <View style={styles.detailItem}>
          <ClockIcon size={14} color={PsychiColors.textMuted} />
          <Text style={styles.detailText}>{session.duration} min</Text>
        </View>
      </View>

      {isUpcoming && (
        <View style={styles.sessionActions}>
          <TouchableOpacity
            style={[styles.rescheduleButton, session.pendingReschedule && styles.buttonDisabled]}
            onPress={() => handleReschedulePress(session)}
            disabled={session.pendingReschedule}
          >
            <Text style={styles.rescheduleButtonText}>
              {session.pendingReschedule ? 'Awaiting Response' : 'Reschedule'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelPress(session)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.joinButton}
            activeOpacity={0.8}
            onPress={() => router.push(`/session/${session.id}?type=${session.type}`)}
          >
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep]}
              style={styles.joinButtonGradient}
            >
              <Text style={styles.joinButtonText}>
                {session.type === 'chat' ? 'Chat' : 'Join'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sessions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
        >
          <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>
            Upcoming
          </Text>
          {upcomingSessions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{upcomingSessions.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PsychiColors.azure} />
          </View>
        ) : activeTab === 'upcoming' ? (
          upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => renderSession(session, true))
          ) : (
            <View style={styles.emptyState}>
              <CalendarIcon size={48} color={PsychiColors.textMuted} />
              <Text style={styles.emptyTitle}>No upcoming sessions</Text>
              <Text style={styles.emptySubtitle}>
                Your upcoming sessions will appear here
              </Text>
            </View>
          )
        ) : pastSessions.length > 0 ? (
          pastSessions.map((session) => renderSession(session, false))
        ) : (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color={PsychiColors.textMuted} />
            <Text style={styles.emptyTitle}>No past sessions</Text>
            <Text style={styles.emptySubtitle}>
              Your completed sessions will appear here
            </Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Cancel Modal */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Session</Text>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                style={styles.closeButton}
              >
                <CloseIcon size={20} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedSession && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.refundInfo}>
                  <DollarIcon size={24} color={PsychiColors.success} />
                  <View style={styles.refundTextContainer}>
                    <Text style={styles.refundTitle}>Full Refund Will Be Processed</Text>
                    <Text style={styles.refundAmount}>
                      {formatCurrency(getSessionPrice(selectedSession.type))}
                    </Text>
                    <Text style={styles.refundNote}>
                      Supporter-initiated cancellations always result in a full refund for the client.
                    </Text>
                  </View>
                </View>

                <View style={styles.sessionSummary}>
                  <Text style={styles.summaryLabel}>Session with</Text>
                  <Text style={styles.summaryValue}>{selectedSession.clientName}</Text>
                  <Text style={styles.summaryLabel}>Scheduled for</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSession.date} at {selectedSession.time}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Reason for cancellation *</Text>
                <TextInput
                  style={styles.reasonInput}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  placeholder="Please explain why you need to cancel..."
                  placeholderTextColor={PsychiColors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setCancelModalVisible(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Keep Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmCancelButton, isProcessing && styles.buttonDisabled]}
                    onPress={confirmCancellation}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color={PsychiColors.white} size="small" />
                    ) : (
                      <Text style={styles.confirmCancelButtonText}>Cancel & Refund</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        visible={rescheduleModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setRescheduleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.rescheduleModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reschedule Session</Text>
              <TouchableOpacity
                onPress={() => setRescheduleModalVisible(false)}
                style={styles.closeButton}
              >
                <CloseIcon size={20} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedSession && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.rescheduleInfo}>
                  <Text style={styles.rescheduleInfoText}>
                    Rescheduling session with {selectedSession.clientName}
                  </Text>
                  <Text style={styles.rescheduleCurrentTime}>
                    Currently: {selectedSession.date} at {selectedSession.time}
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Select New Date</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.dateScrollView}
                >
                  {getAvailableDates().map((date, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateOption,
                        selectedDate?.toDateString() === date.toDateString() &&
                          styles.dateOptionSelected,
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text
                        style={[
                          styles.dateOptionDay,
                          selectedDate?.toDateString() === date.toDateString() &&
                            styles.dateOptionTextSelected,
                        ]}
                      >
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]}
                      </Text>
                      <Text
                        style={[
                          styles.dateOptionDate,
                          selectedDate?.toDateString() === date.toDateString() &&
                            styles.dateOptionTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Select New Time</Text>
                <View style={styles.timeGrid}>
                  {TIME_SLOTS.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        selectedTime === time && styles.timeOptionSelected,
                      ]}
                      onPress={() => setSelectedTime(time)}
                    >
                      <Text
                        style={[
                          styles.timeOptionText,
                          selectedTime === time && styles.timeOptionTextSelected,
                        ]}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.noticeBox}>
                  <InfoIcon size={16} color={PsychiColors.azure} />
                  <Text style={styles.noticeText}>
                    A reschedule request will be sent to the client. They must respond at least 3 hours before the original session time. If they don't respond, the session will be automatically cancelled and they will receive a full refund.
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setRescheduleModalVisible(false)}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmRescheduleButton,
                      (!selectedDate || !selectedTime || isProcessing) && styles.buttonDisabled,
                    ]}
                    onPress={confirmReschedule}
                    disabled={!selectedDate || !selectedTime || isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color={PsychiColors.white} size="small" />
                    ) : (
                      <Text style={styles.confirmRescheduleButtonText}>Send Request</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.white,
    ...Shadows.soft,
  },
  tabActive: {
    backgroundColor: PsychiColors.azure,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  tabTextActive: {
    color: PsychiColors.white,
  },
  tabBadge: {
    backgroundColor: PsychiColors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.xs,
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sessionCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  typeIcon: {
    fontSize: 24,
  },
  sessionInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  sessionType: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  earningsBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  earningsText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pendingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  sessionDetails: {
    flexDirection: 'row',
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  detailText: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
    fontWeight: '500',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  rescheduleButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
  },
  rescheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  joinButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  ratingLabel: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginLeft: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: PsychiColors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  rescheduleModalContent: {
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PsychiColors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: PsychiColors.textMuted,
  },
  refundInfo: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  refundIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  refundTextContainer: {
    flex: 1,
  },
  refundTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.success,
    marginBottom: 2,
  },
  refundAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.success,
    marginBottom: 4,
  },
  refundNote: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    lineHeight: 16,
  },
  sessionSummary: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  reasonInput: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: '#2A2A2A',
    minHeight: 80,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cream,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  confirmCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.error,
    alignItems: 'center',
  },
  confirmCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  confirmRescheduleButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.azure,
    alignItems: 'center',
  },
  confirmRescheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  // Reschedule specific styles
  rescheduleInfo: {
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  rescheduleInfoText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  rescheduleCurrentTime: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  dateScrollView: {
    marginBottom: Spacing.lg,
  },
  dateOption: {
    width: 64,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  dateOptionSelected: {
    backgroundColor: PsychiColors.azure,
  },
  dateOptionDay: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.textMuted,
    marginBottom: 4,
  },
  dateOptionDate: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  dateOptionTextSelected: {
    color: PsychiColors.white,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  timeOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.cream,
  },
  timeOptionSelected: {
    backgroundColor: PsychiColors.azure,
  },
  timeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.textSecondary,
  },
  timeOptionTextSelected: {
    color: PsychiColors.white,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
});
