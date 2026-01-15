import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import ChatSession from '@/components/session/ChatSession';
import VideoCall from '@/components/session/VideoCall';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { createSession, SessionConfig } from '@/lib/daily';
import { useAuth } from '@/contexts/AuthContext';
import {
  ensureSessionPermissions,
  getPermissionDisplayName,
  showPermissionDeniedAlert,
} from '@/lib/permissions';

type SessionType = 'chat' | 'phone' | 'video';

interface SessionData {
  id: string;
  type: SessionType;
  participant: {
    id: string;
    name: string;
    role: 'client' | 'supporter';
  };
  scheduledAt: string;
  duration: number;
}

export default function SessionScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type?: string }>();
  const { user, profile } = useAuth();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [dailySession, setDailySession] = useState<SessionConfig | null>(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(false);

  // Get current user name from auth context
  const currentUserName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : 'You';
  const currentUserId = user?.id || 'current-user-id';

  // Mock session data - in production this would come from API
  useEffect(() => {
    // Simulate fetching session data
    setSessionData({
      id: id || '1',
      type: (type as SessionType) || 'chat',
      participant: {
        id: 'supporter-1',
        name: 'Sarah Chen',
        role: 'supporter',
      },
      scheduledAt: new Date().toISOString(),
      duration: 30,
    });
  }, [id, type]);

  // Check permissions and create Daily.co room for video/voice calls
  useEffect(() => {
    const initDailySession = async () => {
      if (!sessionData || sessionData.type === 'chat') {
        setPermissionsGranted(true); // Chat doesn't need special permissions
        return;
      }

      // Check and request required permissions
      setCheckingPermissions(true);
      const { granted, missing } = await ensureSessionPermissions(sessionData.type);
      setCheckingPermissions(false);

      if (!granted) {
        // Show alert about missing permissions
        const missingNames = missing.map(getPermissionDisplayName).join(' and ');
        Alert.alert(
          'Permissions Required',
          `To join this ${sessionData.type} call, please enable ${missingNames} access.`,
          [
            {
              text: 'Go to Settings',
              onPress: () => router.push('/permissions'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => router.back(),
            },
          ]
        );
        return;
      }

      setPermissionsGranted(true);
      setIsCreatingRoom(true);
      const dailyType = sessionData.type === 'video' ? 'video' : 'voice';
      const config = await createSession(dailyType, currentUserName);

      if (config) {
        setDailySession(config);
      } else {
        Alert.alert('Error', 'Failed to create call session. Please try again.');
      }
      setIsCreatingRoom(false);
    };

    initDailySession();
  }, [sessionData]);

  const handleEndSession = () => {
    setShowEndConfirm(true);
  };

  const confirmEndSession = () => {
    setShowEndConfirm(false);
    setSessionEnded(true);
  };

  const handleBackToDashboard = () => {
    router.replace('/(client)');
  };

  if (!sessionData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Session ended view
  if (sessionEnded) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.endedContainer}>
          <View style={styles.endedCard}>
            <View style={styles.endedIcon}>
              <Text style={styles.endedEmoji}>✅</Text>
            </View>
            <Text style={styles.endedTitle}>Session Completed</Text>
            <Text style={styles.endedSubtitle}>
              Your {sessionData.type} session with {sessionData.participant.name} has ended.
            </Text>

            {/* Session Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Session Type</Text>
                <Text style={styles.summaryValue}>
                  {sessionData.type.charAt(0).toUpperCase() + sessionData.type.slice(1)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>{sessionData.duration} minutes</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Supporter</Text>
                <Text style={styles.summaryValue}>{sessionData.participant.name}</Text>
              </View>
            </View>

            {/* Rating Request */}
            <View style={styles.ratingSection}>
              <Text style={styles.ratingTitle}>How was your session?</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} style={styles.starButton}>
                    <Text style={styles.starText}>⭐</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={styles.doneButton}
              onPress={handleBackToDashboard}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[PsychiColors.azure, PsychiColors.deep]}
                style={styles.doneButtonGradient}
              >
                <Text style={styles.doneButtonText}>Back to Dashboard</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render appropriate session component
  const renderSession = () => {
    switch (sessionData.type) {
      case 'chat':
        return (
          <ChatSession
            sessionId={sessionData.id}
            otherParticipant={sessionData.participant}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            onEndSession={handleEndSession}
          />
        );
      case 'phone':
      case 'video':
        // Show loading while checking permissions or creating room
        if (checkingPermissions) {
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={PsychiColors.azure} />
                <Text style={styles.loadingText}>Checking permissions...</Text>
              </View>
            </View>
          );
        }
        if (!permissionsGranted) {
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <Text style={styles.loadingText}>Permissions required to join call</Text>
              </View>
            </View>
          );
        }
        if (isCreatingRoom || !dailySession?.roomUrl) {
          return (
            <View style={styles.loadingContainer}>
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={PsychiColors.azure} />
                <Text style={styles.loadingText}>Setting up your call...</Text>
              </View>
            </View>
          );
        }
        return (
          <VideoCall
            roomUrl={dailySession.roomUrl}
            participantName={currentUserName}
            otherParticipant={sessionData.participant}
            isVideoEnabled={sessionData.type === 'video'}
            onEndCall={handleEndSession}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderSession()}

      {/* End Session Confirmation Modal */}
      <Modal
        visible={showEndConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndConfirm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Session?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to end this {sessionData.type} session?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowEndConfirm(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmEndSession}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[PsychiColors.error, '#C53030']}
                  style={styles.modalConfirmGradient}
                >
                  <Text style={styles.modalConfirmText}>End Session</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: PsychiColors.textMuted,
  },
  endedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  endedCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  endedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  endedEmoji: {
    fontSize: 40,
  },
  endedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.xs,
  },
  endedSubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: Spacing.xs,
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  starText: {
    fontSize: 32,
  },
  doneButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  modalConfirmButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalConfirmGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
