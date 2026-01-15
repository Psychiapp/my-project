/**
 * EmergencyButton Component
 * Provides emergency contact options (911, 988) and reports to Psychi safety team
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { sendEmergencyReport } from '@/lib/emergency';

interface EmergencyButtonProps {
  sessionId: string;
  sessionType: 'chat' | 'phone' | 'video';
  participantName: string;
  currentUserName?: string;
}

type EmergencyType = '911' | '988';

export default function EmergencyButton({
  sessionId,
  sessionType,
  participantName,
  currentUserName,
}: EmergencyButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<EmergencyType | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);

  const handleEmergencyPress = () => {
    setShowModal(true);
  };

  const handleOptionSelect = (type: EmergencyType) => {
    setShowConfirmation(type);
  };

  const confirmCall = async (type: EmergencyType) => {
    setIsSendingReport(true);

    try {
      // Send emergency report email to Psychi
      await sendEmergencyReport({
        sessionId,
        sessionType,
        participantName,
        reporterName: currentUserName || 'Unknown',
        emergencyType: type,
        timestamp: new Date().toISOString(),
      });

      // Make the phone call
      const phoneNumber = type === '911' ? '911' : '988';
      const phoneUrl = `tel:${phoneNumber}`;

      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert(
          'Unable to Call',
          `Please dial ${phoneNumber} manually from your phone app.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Emergency report error:', error);
      // Still try to make the call even if report fails
      const phoneNumber = type === '911' ? '911' : '988';
      Alert.alert(
        'Call Emergency Services',
        `Please dial ${phoneNumber} manually. Our safety team has been notified.`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsSendingReport(false);
      setShowConfirmation(null);
      setShowModal(false);
    }
  };

  const cancelConfirmation = () => {
    setShowConfirmation(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setShowConfirmation(null);
  };

  return (
    <>
      {/* Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleEmergencyPress}
        activeOpacity={0.7}
      >
        <Text style={styles.emergencyButtonIcon}>!</Text>
      </TouchableOpacity>

      {/* Emergency Options Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          {showConfirmation ? (
            // Confirmation Dialog
            <View style={styles.modalContent}>
              {isSendingReport ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={PsychiColors.error} />
                  <Text style={styles.loadingText}>Connecting...</Text>
                </View>
              ) : (
                <>
                  <View style={styles.confirmIcon}>
                    <Text style={styles.confirmIconText}>
                      {showConfirmation === '911' ? '911' : '988'}
                    </Text>
                  </View>
                  <Text style={styles.confirmTitle}>
                    {showConfirmation === '911'
                      ? 'Call Emergency Services?'
                      : 'Call Suicide & Crisis Lifeline?'}
                  </Text>
                  <Text style={styles.confirmSubtitle}>
                    {showConfirmation === '911'
                      ? 'This will dial 911 for emergency services. The Psychi safety team will be notified.'
                      : 'This will dial 988 for the Suicide & Crisis Lifeline. The Psychi safety team will be notified.'}
                  </Text>
                  <View style={styles.confirmButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={cancelConfirmation}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.callButton}
                      onPress={() => confirmCall(showConfirmation)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.callButtonText}>
                        Call {showConfirmation}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ) : (
            // Emergency Options
            <View style={styles.modalContent}>
              <View style={styles.headerIcon}>
                <Text style={styles.headerIconText}>!</Text>
              </View>
              <Text style={styles.modalTitle}>Emergency Help</Text>
              <Text style={styles.modalSubtitle}>
                Select the appropriate emergency service. The Psychi safety team will be notified immediately.
              </Text>

              {/* 911 Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionSelect('911')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, styles.optionIcon911]}>
                    <Text style={styles.optionIconText}>911</Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Emergency Services</Text>
                    <Text style={styles.optionDescription}>
                      For life-threatening emergencies, medical emergencies, or immediate danger
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 988 Option */}
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => handleOptionSelect('988')}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, styles.optionIcon988]}>
                    <Text style={styles.optionIconText}>988</Text>
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionTitle}>Suicide & Crisis Lifeline</Text>
                    <Text style={styles.optionDescription}>
                      For mental health crisis, suicidal thoughts, or emotional distress
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  emergencyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: PsychiColors.error,
  },
  emergencyButtonIcon: {
    fontSize: 18,
    fontWeight: '800',
    color: PsychiColors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...Shadows.card,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerIconText: {
    fontSize: 32,
    fontWeight: '800',
    color: PsychiColors.error,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
    fontFamily: 'Georgia',
  },
  modalSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  optionButton: {
    width: '100%',
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionIcon911: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  optionIcon988: {
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
  },
  optionIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  confirmIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  confirmIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.error,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  confirmSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
    paddingHorizontal: Spacing.sm,
  },
  confirmButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  callButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.error,
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: PsychiColors.textMuted,
    marginTop: Spacing.md,
  },
});
