import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { reportUser } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import type { ReportReason } from '@/types/database';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUserId: string;
  reportedUserName: string;
  sessionId?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  {
    value: 'inappropriate_content',
    label: 'Inappropriate Content',
    description: 'Sharing explicit, offensive, or harmful content',
  },
  {
    value: 'harassment',
    label: 'Harassment',
    description: 'Bullying, threats, or targeted harassment',
  },
  {
    value: 'spam',
    label: 'Spam',
    description: 'Unsolicited messages or promotional content',
  },
  {
    value: 'unprofessional_behavior',
    label: 'Unprofessional Behavior',
    description: 'Behavior that violates community guidelines',
  },
  {
    value: 'safety_concern',
    label: 'Safety Concern',
    description: 'Behavior that raises safety concerns',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other reason not listed above',
  },
];

export default function ReportUserModal({
  visible,
  onClose,
  reportedUserId,
  reportedUserName,
  sessionId,
}: ReportUserModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason || !user?.id) return;

    if (!description.trim()) {
      Alert.alert('Description Required', 'Please provide details about this report.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reportUser(
        user.id,
        reportedUserId,
        selectedReason,
        description.trim(),
        sessionId
      );

      if (result) {
        Alert.alert(
          'Report Submitted',
          'Thank you for your report. Our safety team will review it within 24 hours.',
          [{ text: 'OK', onPress: handleClose }]
        );
      } else {
        Alert.alert('Error', 'Failed to submit report. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report User</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Report {reportedUserName} for violating our community guidelines
          </Text>

          <Text style={styles.sectionTitle}>Select a reason</Text>
          {REPORT_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonCard,
                selectedReason === reason.value && styles.reasonCardSelected,
              ]}
              onPress={() => setSelectedReason(reason.value)}
            >
              <View style={styles.radioButton}>
                {selectedReason === reason.value && (
                  <View style={styles.radioButtonInner} />
                )}
              </View>
              <View style={styles.reasonContent}>
                <Text style={styles.reasonLabel}>{reason.label}</Text>
                <Text style={styles.reasonDescription}>{reason.description}</Text>
              </View>
            </TouchableOpacity>
          ))}

          <Text style={styles.sectionTitle}>Provide details</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Please describe what happened..."
            placeholderTextColor={PsychiColors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={styles.notice}>
            <Text style={styles.noticeIcon}>ℹ️</Text>
            <Text style={styles.noticeText}>
              Reports are confidential. The reported user will not know who filed the report.
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!selectedReason || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={PsychiColors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Submit Report</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </View>
    </Modal>
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
    paddingVertical: Spacing.md,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  cancelButton: {
    fontSize: 16,
    color: PsychiColors.azure,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  subtitle: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.soft,
  },
  reasonCardSelected: {
    borderColor: PsychiColors.azure,
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PsychiColors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PsychiColors.azure,
  },
  reasonContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  textInput: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: PsychiColors.midnight,
    minHeight: 120,
    ...Shadows.soft,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  noticeIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: PsychiColors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
