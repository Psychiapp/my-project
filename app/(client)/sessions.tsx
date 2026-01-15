import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  calculateRefundAmount,
  cancelSessionWithRefund,
  formatCurrency,
  getSessionPrice,
  REFUND_POLICIES,
} from '@/lib/refunds';
import {
  sendSessionCancelledNotification,
  cancelSessionReminders,
} from '@/lib/notifications';

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
  rating?: number;
}

// Mock session data
const mockUpcomingSessions: Session[] = [
  {
    id: '1',
    supporterName: 'Sarah Chen',
    supporterEmail: 'sarah@psychi.app',
    type: 'video',
    date: 'Tomorrow',
    time: '2:00 PM',
    scheduledAt: new Date(Date.now() + 26 * 60 * 60 * 1000).toISOString(), // 26 hours from now
    duration: 45,
  },
  {
    id: '2',
    supporterName: 'Marcus Johnson',
    supporterEmail: 'marcus@psychi.app',
    type: 'chat',
    date: 'Thu, Jan 16',
    time: '10:00 AM',
    scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    duration: 30,
  },
];

const mockPastSessions: Session[] = [
  {
    id: '3',
    supporterName: 'Emily Rodriguez',
    supporterEmail: 'emily@psychi.app',
    type: 'phone',
    date: 'Jan 10, 2026',
    time: '3:00 PM',
    scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 30,
    rating: 5,
  },
  {
    id: '4',
    supporterName: 'Sarah Chen',
    supporterEmail: 'sarah@psychi.app',
    type: 'video',
    date: 'Jan 5, 2026',
    time: '11:00 AM',
    scheduledAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 45,
    rating: 5,
  },
];

const typeIcons: Record<string, string> = {
  chat: '💬',
  phone: '📞',
  video: '🎥',
};

export default function SessionsScreen() {
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming');
  const [sessions, setSessions] = useState(mockUpcomingSessions);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

      setSessions(sessions.filter((s) => s.id !== selectedSession.id));
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
          <Text style={styles.typeIcon}>{typeIcons[session.type]}</Text>
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.supporterName}>{session.supporterName}</Text>
          <Text style={styles.sessionType}>
            {session.type.charAt(0).toUpperCase() + session.type.slice(1)} Session
          </Text>
        </View>
        {!isUpcoming && session.rating && (
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>⭐ {session.rating}</Text>
          </View>
        )}
      </View>

      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>{session.date}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>🕐</Text>
          <Text style={styles.detailText}>{session.time}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={styles.detailIcon}>⏱</Text>
          <Text style={styles.detailText}>{session.duration} min</Text>
        </View>
      </View>

      {isUpcoming && (
        <>
          <View style={styles.refundStatusRow}>
            {renderRefundBadge(session)}
            <TouchableOpacity onPress={() => setPolicyModalVisible(true)}>
              <Text style={styles.policyLink}>View cancellation policy</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sessionActions}>
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
                  {session.type === 'chat' ? 'Open Chat' : 'Join Call'}
                </Text>
              </LinearGradient>
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
        <Text style={styles.headerTitle}>My Sessions</Text>
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
          {sessions.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{sessions.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, activeTab === 'past' && styles.tabTextActive]}>
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sessions List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'upcoming' ? (
          sessions.length > 0 ? (
            sessions.map((session) => renderSession(session, true))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>No upcoming sessions</Text>
              <Text style={styles.emptySubtitle}>
                Book a session with a supporter to get started
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                activeOpacity={0.8}
                onPress={() => router.push('/(client)/browse')}
              >
                <LinearGradient
                  colors={[PsychiColors.azure, PsychiColors.deep]}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Find Support</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        ) : mockPastSessions.length > 0 ? (
          mockPastSessions.map((session) => renderSession(session, false))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
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
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancel Session</Text>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
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
                      <Text style={styles.refundInfoIcon}>
                        {refundInfo.percentage === 100
                          ? '💰'
                          : refundInfo.percentage === 50
                          ? '⚠️'
                          : '🚫'}
                      </Text>
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
                  >
                    <Text style={styles.keepSessionButtonText}>Keep Session</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmCancelButton, isProcessing && styles.buttonDisabled]}
                    onPress={confirmCancellation}
                    disabled={isProcessing}
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
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cancellation Policy</Text>
              <TouchableOpacity
                onPress={() => setPolicyModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.policyIntro}>
                We understand that plans change. Here's our cancellation and refund policy:
              </Text>

              {/* Full Refund */}
              <View style={styles.policyItem}>
                <View style={[styles.policyIconContainer, styles.policyIconFull]}>
                  <Text style={styles.policyIcon}>✓</Text>
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>100% Refund</Text>
                  <Text style={styles.policyDescription}>
                    Cancel more than {REFUND_POLICIES.FULL_REFUND_HOURS} hours before your
                    scheduled session to receive a full refund.
                  </Text>
                </View>
              </View>

              {/* Partial Refund */}
              <View style={styles.policyItem}>
                <View style={[styles.policyIconContainer, styles.policyIconPartial]}>
                  <Text style={styles.policyIcon}>½</Text>
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>50% Refund</Text>
                  <Text style={styles.policyDescription}>
                    Cancel between {REFUND_POLICIES.NO_REFUND_HOURS} and{' '}
                    {REFUND_POLICIES.FULL_REFUND_HOURS} hours before your session to receive
                    a 50% refund.
                  </Text>
                </View>
              </View>

              {/* No Refund */}
              <View style={styles.policyItem}>
                <View style={[styles.policyIconContainer, styles.policyIconNone]}>
                  <Text style={styles.policyIcon}>✕</Text>
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>No Refund</Text>
                  <Text style={styles.policyDescription}>
                    Cancellations within {REFUND_POLICIES.NO_REFUND_HOURS} hours of the
                    session are not eligible for a refund.
                  </Text>
                </View>
              </View>

              {/* Supporter Cancellation */}
              <View style={styles.policyItem}>
                <View style={[styles.policyIconContainer, styles.policyIconSupporter]}>
                  <Text style={styles.policyIcon}>💜</Text>
                </View>
                <View style={styles.policyContent}>
                  <Text style={styles.policyTitle}>Supporter Cancellations</Text>
                  <Text style={styles.policyDescription}>
                    If your supporter cancels the session, you will always receive a full
                    refund regardless of timing.
                  </Text>
                </View>
              </View>

              {/* Note */}
              <View style={styles.policyNote}>
                <Text style={styles.policyNoteIcon}>ℹ️</Text>
                <Text style={styles.policyNoteText}>
                  Refunds are typically processed within 5-10 business days and will be
                  returned to your original payment method.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.gotItButton}
                onPress={() => setPolicyModalVisible(false)}
              >
                <Text style={styles.gotItButtonText}>Got It</Text>
              </TouchableOpacity>

              <View style={{ height: 20 }} />
            </ScrollView>
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
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  joinButtonGradient: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
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
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
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
  policyIntro: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
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
  policyIconSupporter: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  policyIcon: {
    fontSize: 16,
    fontWeight: '700',
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
  policyNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  policyNoteIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  policyNoteText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
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
});
