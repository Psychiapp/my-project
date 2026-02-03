import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  calculateRefundAmount,
  cancelSessionWithRefund,
  formatCurrency,
  getSessionPrice,
} from '@/lib/refunds';
import { CheckCircleIcon, ClockIcon, CloseIcon, CalendarIcon, ChatIcon, PhoneIcon, VideoIcon, DollarIcon, WarningIcon, ErrorCircleIcon } from '@/components/icons';
import {
  sendSessionCancelledNotification,
  cancelSessionReminders,
} from '@/lib/notifications';
import {
  getPendingRescheduleRequests,
  processExpiredRescheduleRequests,
  getUpcomingSessions,
  getPastSessions,
} from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import RescheduleRequestCard from '@/components/RescheduleRequestCard';
import type { RescheduleRequestWithDetails, SessionWithDetails } from '@/types/database';

type SessionTab = 'upcoming' | 'past';

interface Session {
  id: string;
  supporterName: string;
  supporterEmail: string;
  type: 'chat' | 'phone' | 'video';
  date: string;
  time: string;
  scheduledAt: string;
  duration: number;
}

// Helper to format session data from database
const formatSessionFromDb = (dbSession: SessionWithDetails): Session => {
  const scheduledDate = new Date(dbSession.scheduled_at);
  const supporter = dbSession.supporter as { id: string; full_name: string; avatar_url?: string } | null;

  return {
    id: dbSession.id,
    supporterName: supporter?.full_name || 'Unknown Supporter',
    supporterEmail: '', // Not available from this query
    type: dbSession.session_type as 'chat' | 'phone' | 'video',
    date: scheduledDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    time: scheduledDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    scheduledAt: dbSession.scheduled_at,
    duration: dbSession.duration_minutes || 30,
  };
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'chat':
      return <ChatIcon size={24} color={PsychiColors.azure} />;
    case 'phone':
      return <PhoneIcon size={24} color={PsychiColors.azure} />;
    case 'video':
      return <VideoIcon size={24} color={PsychiColors.azure} />;
    default:
      return <ChatIcon size={24} color={PsychiColors.azure} />;
  }
};

export default function SessionsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming');
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);
  const [pastSessions, setPastSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequestWithDetails[]>([]);

  // Fetch sessions from database
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const [upcoming, past] = await Promise.all([
          getUpcomingSessions(user.id, 'client'),
          getPastSessions(user.id, 'client'),
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

  // Fetch pending reschedule requests and process expired ones
  useEffect(() => {
    const fetchRescheduleRequests = async () => {
      if (!user?.id) return;

      // First, process any expired requests (auto-cancel sessions)
      await processExpiredRescheduleRequests(user.id);

      // Then fetch pending requests
      const requests = await getPendingRescheduleRequests(user.id);
      setRescheduleRequests(requests);
    };

    fetchRescheduleRequests();

    // Poll for updates every minute
    const interval = setInterval(fetchRescheduleRequests, 60000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleRescheduleResponse = (requestId: string, accepted: boolean) => {
    // Remove the request from the list
    setRescheduleRequests(prev => prev.filter(r => r.id !== requestId));

    // If accepted, refresh sessions to show updated time
    // In production, you would fetch the updated session from the server
  };

  const handleCancelPress = (session: Session) => {
    setSelectedSession(session);
    setCancelModalVisible(true);
  };

  const getRefundInfo = (session: Session) => {
    const sessionPrice = getSessionPrice(session.type);
    const scheduledTime = new Date(session.scheduledAt);
    return calculateRefundAmount(sessionPrice, scheduledTime, 'client');
  };

  const confirmCancellation = async () => {
    if (!selectedSession) return;

    const refundInfo = getRefundInfo(selectedSession);

    if (refundInfo.percentage === 0) {
      Alert.alert(
        'No Refund Available',
        'Cancellations within 2 hours of the session are not eligible for a refund. Are you sure you want to cancel?',
        [
          { text: 'Keep Session', style: 'cancel' },
          {
            text: 'Cancel Anyway',
            style: 'destructive',
            onPress: () => processCancellation(),
          },
        ]
      );
      return;
    }

    processCancellation();
  };

  const processCancellation = async () => {
    if (!selectedSession) return;

    setIsProcessing(true);

    const sessionPrice = getSessionPrice(selectedSession.type);
    const result = await cancelSessionWithRefund(
      {
        sessionId: selectedSession.id,
        clientName: 'You',
        clientEmail: 'client@example.com',
        sessionType: selectedSession.type,
        amount: sessionPrice,
        scheduledAt: selectedSession.scheduledAt,
      },
      'Client requested cancellation',
      'client'
    );

    setIsProcessing(false);

    if (result.success) {
      // Cancel any scheduled reminders for this session
      await cancelSessionReminders(selectedSession.id);

      // Notify the supporter about the cancellation
      await sendSessionCancelledNotification({
        sessionId: selectedSession.id,
        sessionType: selectedSession.type,
        date: selectedSession.date,
        otherPartyName: 'Client', // The client's name would come from auth context in production
        isSupporter: true, // Sending to supporter
        refundAmount: result.refundAmount > 0 ? formatCurrency(result.refundAmount) : undefined,
      });

      setUpcomingSessions(upcomingSessions.filter((s) => s.id !== selectedSession.id));
      setCancelModalVisible(false);

      if (result.refundAmount > 0) {
        Alert.alert(
          'Session Cancelled',
          `Your session has been cancelled.\n\nRefund of ${formatCurrency(result.refundAmount)} will be processed within 5-10 business days.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Session Cancelled', 'Your session has been cancelled.', [
          { text: 'OK' },
        ]);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to cancel session. Please try again.');
    }
  };

  const renderRefundBadge = (session: Session) => {
    const refundInfo = getRefundInfo(session);

    if (refundInfo.percentage === 100) {
      return (
        <View style={[styles.refundBadge, styles.refundBadgeFull]}>
          <Text style={[styles.refundBadgeText, styles.refundBadgeTextFull]}>
            100% Refund
          </Text>
        </View>
      );
    } else if (refundInfo.percentage === 50) {
      return (
        <View style={[styles.refundBadge, styles.refundBadgePartial]}>
          <Text style={[styles.refundBadgeText, styles.refundBadgeTextPartial]}>
            50% Refund
          </Text>
        </View>
      );
    } else {
      return (
        <View style={[styles.refundBadge, styles.refundBadgeNone]}>
          <Text style={[styles.refundBadgeText, styles.refundBadgeTextNone]}>
            No Refund
          </Text>
        </View>
      );
    }
  };

  const renderSession = (session: Session, isUpcoming: boolean) => (
    <View key={session.id} style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.typeIconContainer}>
          {getTypeIcon(session.type)}
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.supporterName}>{session.supporterName}</Text>
          <Text style={styles.sessionType}>
            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <CalendarIcon size={14} color={PsychiColors.textSecondary} />
          <Text style={styles.detailText}>{session.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <ClockIcon size={14} color={PsychiColors.textSecondary} />
          <Text style={styles.detailText}>{session.time}</Text>
        </View>
        <View style={styles.detailItem}>
          <ClockIcon size={14} color={PsychiColors.textSecondary} />
          <Text style={styles.detailText}>{session.duration} min</Text>
        </View>
      </View>

      {isUpcoming && (
        <>
          <View style={styles.refundStatusRow}>
            {renderRefundBadge(session)}
            <TouchableOpacity onPress={() => setPolicyModalVisible(true)} accessibilityRole="link" accessibilityLabel="View cancellation policy">
              <Text style={styles.policyLink}>View cancellation policy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sessionActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => handleCancelPress(session)}
              accessibilityRole="button"
              accessibilityLabel="Cancel session"
              accessibilityHint="Opens cancellation options for this session"
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.joinButton}
              activeOpacity={0.8}
              onPress={() => router.push(`/session/${session.id}?type=${session.type}`)}
              accessibilityRole="button"
              accessibilityLabel={session.type === 'chat' ? 'Open Chat' : 'Join Call'}
              accessibilityHint={`Start your ${session.type} session with ${session.supporterName}`}
            >
              <Text style={styles.joinButtonText}>
                {session.type === 'chat' ? 'Open Chat' : 'Join Call'}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">My Sessions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer} accessibilityRole="tablist">
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
          onPress={() => setActiveTab('upcoming')}
          accessibilityRole="tab"
          accessibilityLabel={`Upcoming sessions${upcomingSessions.length > 0 ? `, ${upcomingSessions.length} sessions` : ''}`}
          accessibilityState={{ selected: activeTab === 'upcoming' }}
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
          accessibilityRole="tab"
          accessibilityLabel="Past sessions"
          accessibilityState={{ selected: activeTab === 'past' }}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Reschedule Requests Section - only show in upcoming tab */}
        {activeTab === 'upcoming' && rescheduleRequests.length > 0 && (
          <View style={styles.rescheduleSection}>
            <Text style={styles.rescheduleSectionTitle}>Action Required</Text>
            {rescheduleRequests.map((request) => (
              <RescheduleRequestCard
                key={request.id}
                request={request}
                onRespond={handleRescheduleResponse}
              />
            ))}
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PsychiColors.azure} />
          </View>
        ) : activeTab === 'upcoming' ? (
          upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => renderSession(session, true))
          ) : rescheduleRequests.length > 0 ? (
            // Don't show empty state if there are reschedule requests
            null
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <CalendarIcon size={32} color={PsychiColors.azure} />
              </View>
              <Text style={styles.emptyTitle}>No upcoming sessions</Text>
              <Text style={styles.emptySubtitle}>
                Book a session with a supporter to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.8}
                onPress={() => router.push('/(client)/book')}
                accessibilityRole="button"
                accessibilityLabel="Find Support"
                accessibilityHint="Navigate to book a session with a supporter"
              >
                <Text style={styles.emptyButtonText}>Find Support</Text>
              </TouchableOpacity>
            </View>
          )
        ) : pastSessions.length > 0 ? (
          pastSessions.map((session) => renderSession(session, false))
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckCircleIcon size={32} color={PsychiColors.azure} />
            </View>
            <Text style={styles.emptyTitle}>No past sessions</Text>
            <Text style={styles.emptySubtitle}>
              Your completed sessions will appear here
            </Text>
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCancelModalVisible(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent} accessibilityRole="alert">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">Cancel Session</Text>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
                accessibilityHint="Closes this dialog"
              >
                <CloseIcon size={20} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            </View>

            {selectedSession && (
              <>
                {/* Refund Info Card */}
                {(() => {
                  const refundInfo = getRefundInfo(selectedSession);
                  const sessionPrice = getSessionPrice(selectedSession.type);

                  return (
                    <View
                      style={[
                        styles.refundInfoCard,
                        refundInfo.percentage === 100 && styles.refundInfoCardFull,
                        refundInfo.percentage === 50 && styles.refundInfoCardPartial,
                        refundInfo.percentage === 0 && styles.refundInfoCardNone,
                      ]}
                    >
                      <View style={styles.refundInfoIcon}>
                        {refundInfo.percentage === 100 ? (
                          <DollarIcon size={24} color={PsychiColors.success} />
                        ) : refundInfo.percentage === 50 ? (
                          <WarningIcon size={24} color={PsychiColors.warning} />
                        ) : (
                          <ErrorCircleIcon size={24} color={PsychiColors.error} />
                        )}
                      </View>
                      <View style={styles.refundInfoContent}>
                        <Text
                          style={[
                            styles.refundInfoTitle,
                            refundInfo.percentage === 0 && styles.refundInfoTitleNone,
                          ]}
                        >
                          {refundInfo.percentage === 100
                            ? 'Full Refund Available'
                            : refundInfo.percentage === 50
                            ? 'Partial Refund Available'
                            : 'No Refund Available'}
                        </Text>
                        <Text style={styles.refundInfoAmount}>
                          {refundInfo.percentage > 0
                            ? `${formatCurrency(refundInfo.amount)} (${refundInfo.percentage}%)`
                            : formatCurrency(0)}
                        </Text>
                        <Text style={styles.refundInfoReason}>{refundInfo.reason}</Text>
                      </View>
                    </View>
                  );
                })()}

                {/* Session Summary */}
                <View style={styles.sessionSummary}>
                  <Text style={styles.summaryLabel}>Session with</Text>
                  <Text style={styles.summaryValue}>{selectedSession.supporterName}</Text>
                  <Text style={styles.summaryLabel}>Scheduled for</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSession.date} at {selectedSession.time}
                  </Text>
                  <Text style={styles.summaryLabel}>Session type</Text>
                  <Text style={styles.summaryValue}>
                    {selectedSession.type.charAt(0).toUpperCase() +
                      selectedSession.type.slice(1)}{' '}
                    - {formatCurrency(getSessionPrice(selectedSession.type))}
                  </Text>
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.keepSessionButton}
                    onPress={() => setCancelModalVisible(false)}
                    accessibilityRole="button"
                    accessibilityLabel="Keep Session"
                    accessibilityHint="Closes this dialog and keeps your session"
                  >
                    <Text style={styles.keepSessionButtonText}>Keep Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmCancelButton, isProcessing && styles.buttonDisabled]}
                    onPress={confirmCancellation}
                    disabled={isProcessing}
                    accessibilityRole="button"
                    accessibilityLabel="Cancel Session"
                    accessibilityHint="Confirms cancellation of your session"
                    accessibilityState={{ disabled: isProcessing }}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color={PsychiColors.white} size="small" />
                    ) : (
                      <Text style={styles.confirmCancelButtonText}>Cancel Session</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Cancellation Policy Modal */}
      <Modal
        visible={policyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPolicyModalVisible(false)}
        accessibilityViewIsModal={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} accessibilityRole="header">Cancellation Policy</Text>
              <TouchableOpacity
                onPress={() => setPolicyModalVisible(false)}
                style={styles.closeButton}
                accessibilityRole="button"
                accessibilityLabel="Close"
                accessibilityHint="Closes this dialog"
              >
                <CloseIcon size={16} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Full Refund */}
            <View style={styles.policyItem}>
              <View style={[styles.policyIconContainer, styles.policyIconFull]}>
                <CheckCircleIcon size={20} color={PsychiColors.success} />
              </View>
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>100% Refund</Text>
                <Text style={styles.policyDescription}>
                  Cancel more than 24 hours before your session
                </Text>
              </View>
            </View>

            {/* Partial Refund */}
            <View style={styles.policyItem}>
              <View style={[styles.policyIconContainer, styles.policyIconPartial]}>
                <ClockIcon size={20} color="#F59E0B" />
              </View>
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>50% Refund</Text>
                <Text style={styles.policyDescription}>
                  Cancel 2-24 hours before your session
                </Text>
              </View>
            </View>

            {/* No Refund */}
            <View style={styles.policyItem}>
              <View style={[styles.policyIconContainer, styles.policyIconNone]}>
                <CloseIcon size={20} color={PsychiColors.error} />
              </View>
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>No Refund</Text>
                <Text style={styles.policyDescription}>
                  Cancel less than 2 hours before your session
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.gotItButton}
              onPress={() => setPolicyModalVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Got It"
              accessibilityHint="Closes this dialog"
            >
              <Text style={styles.gotItButtonText}>Got It</Text>
            </TouchableOpacity>
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
  sessionInfo: {
    flex: 1,
  },
  supporterName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  sessionType: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
  sessionDetails: {
    flexDirection: 'row',
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
    fontWeight: '500',
  },
  refundStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  refundBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  refundBadgeFull: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  refundBadgePartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  refundBadgeNone: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  refundBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  refundBadgeTextFull: {
    color: PsychiColors.success,
  },
  refundBadgeTextPartial: {
    color: '#F59E0B',
  },
  refundBadgeTextNone: {
    color: PsychiColors.error,
  },
  policyLink: {
    fontSize: 12,
    color: PsychiColors.azure,
    textDecorationLine: 'underline',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  joinButton: {
    flex: 2,
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
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
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
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
    maxHeight: '85%',
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
  refundInfoCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  refundInfoCardFull: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  refundInfoCardPartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  refundInfoCardNone: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  refundInfoIcon: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  refundInfoContent: {
    flex: 1,
  },
  refundInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.success,
    marginBottom: 2,
  },
  refundInfoTitleNone: {
    color: PsychiColors.error,
  },
  refundInfoAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  refundInfoReason: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    lineHeight: 18,
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
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  keepSessionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cream,
    alignItems: 'center',
  },
  keepSessionButtonText: {
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
  buttonDisabled: {
    opacity: 0.5,
  },
  // Policy modal styles
  policyItem: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  policyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  policyIconFull: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  policyIconPartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  policyIconNone: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  policyContent: {
    flex: 1,
  },
  policyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    lineHeight: 20,
  },
  gotItButton: {
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  gotItButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  rescheduleSection: {
    marginBottom: Spacing.md,
  },
  rescheduleSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
});
