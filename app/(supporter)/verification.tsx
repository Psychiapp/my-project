import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  getVerificationStatus,
  submitVerificationDocuments,
} from '@/lib/database';
import {
  DocumentIcon,
  ProfileIcon,
  CheckIcon,
  InfoIcon,
  CloseIcon,
} from '@/components/icons';

type VerificationStatusType = 'not_submitted' | 'pending_review' | 'approved' | 'rejected';

interface VerificationData {
  status: VerificationStatusType;
  transcriptUrl: string | null;
  idDocumentUrl: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export default function VerificationScreen() {
  const { user, isDemoMode } = useAuth();
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local file selections before upload
  const [transcriptFile, setTranscriptFile] = useState<{ uri: string; name: string } | null>(null);
  const [idDocumentFile, setIdDocumentFile] = useState<{ uri: string; name: string } | null>(null);
  const [transcriptUploading, setTranscriptUploading] = useState(false);
  const [idUploading, setIdUploading] = useState(false);

  useEffect(() => {
    loadVerificationStatus();
  }, [user?.id]);

  const loadVerificationStatus = async () => {
    if (!user?.id || isDemoMode) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getVerificationStatus(user.id);
      setVerificationData(data);
    } catch (error) {
      console.error('Error loading verification status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadFileToStorage = async (
    uri: string,
    fileName: string,
    folder: string
  ): Promise<string | null> => {
    if (!supabase || !user?.id) return null;

    try {
      // Fetch the file as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Generate unique file path
      const extension = fileName.split('.').pop() || 'jpg';
      const filePath = `${folder}/${user.id}/${Date.now()}.${extension}`;

      const { data, error } = await supabase.storage
        .from('verification-documents')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('verification-documents')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const pickTranscript = async () => {
    try {
      // Allow both images and PDFs for transcripts
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setTranscriptFile({
        uri: asset.uri,
        name: asset.name,
      });
    } catch (error) {
      console.error('Error picking transcript:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    }
  };

  const pickIdDocument = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setIdDocumentFile({
        uri: asset.uri,
        name: `id_${Date.now()}.jpg`,
      });
    } catch (error) {
      console.error('Error picking ID:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const takeIdPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to take a photo of your ID.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      setIdDocumentFile({
        uri: asset.uri,
        name: `id_${Date.now()}.jpg`,
      });
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleSubmit = async () => {
    if (!transcriptFile || !idDocumentFile) {
      Alert.alert('Missing Documents', 'Please upload both your transcript and ID document.');
      return;
    }

    if (isDemoMode) {
      Alert.alert('Demo Mode', 'Verification submission is not available in demo mode.');
      return;
    }

    if (!user?.id) return;

    setIsSubmitting(true);

    try {
      // Upload transcript
      setTranscriptUploading(true);
      const transcriptUrl = await uploadFileToStorage(
        transcriptFile.uri,
        transcriptFile.name,
        'transcripts'
      );
      setTranscriptUploading(false);

      if (!transcriptUrl) {
        Alert.alert('Upload Error', 'Failed to upload transcript. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Upload ID
      setIdUploading(true);
      const idUrl = await uploadFileToStorage(
        idDocumentFile.uri,
        idDocumentFile.name,
        'ids'
      );
      setIdUploading(false);

      if (!idUrl) {
        Alert.alert('Upload Error', 'Failed to upload ID document. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Submit to database
      const success = await submitVerificationDocuments(user.id, transcriptUrl, idUrl);

      if (success) {
        Alert.alert(
          'Submitted for Review',
          'Your documents have been submitted and are now pending admin review. You will be notified once the review is complete.',
          [{ text: 'OK', onPress: () => loadVerificationStatus() }]
        );
        setTranscriptFile(null);
        setIdDocumentFile(null);
      } else {
        Alert.alert('Error', 'Failed to submit documents. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting verification:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTranscriptUploading(false);
      setIdUploading(false);
    }
  };

  const getStatusColor = (status: VerificationStatusType) => {
    switch (status) {
      case 'approved':
        return PsychiColors.success;
      case 'rejected':
        return PsychiColors.error;
      case 'pending_review':
        return '#F59E0B';
      default:
        return PsychiColors.textMuted;
    }
  };

  const getStatusLabel = (status: VerificationStatusType) => {
    switch (status) {
      case 'approved':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'pending_review':
        return 'Pending Review';
      default:
        return 'Not Submitted';
    }
  };

  const renderStatusBadge = (status: VerificationStatusType) => {
    const color = getStatusColor(status);
    const label = getStatusLabel(status);

    return (
      <View style={[styles.statusBadge, { backgroundColor: `${color}15` }]}>
        {status === 'approved' && <CheckIcon size={14} color={color} />}
        {status === 'rejected' && <CloseIcon size={14} color={color} />}
        <Text style={[styles.statusText, { color }]}>{label}</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Verification', headerShown: true }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.coral} />
        </View>
      </SafeAreaView>
    );
  }

  const status = verificationData?.status || 'not_submitted';
  const canSubmit = status === 'not_submitted' || status === 'rejected';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Verification', headerShown: true }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Document Verification</Text>
          <Text style={styles.headerSubtitle}>
            Upload your college transcript and government-issued ID to become a verified supporter.
          </Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Verification Status</Text>
            {renderStatusBadge(status)}
          </View>

          {status === 'approved' && verificationData?.reviewedAt && (
            <Text style={styles.statusDate}>
              Verified on {new Date(verificationData.reviewedAt).toLocaleDateString()}
            </Text>
          )}

          {status === 'pending_review' && verificationData?.submittedAt && (
            <Text style={styles.statusDate}>
              Submitted on {new Date(verificationData.submittedAt).toLocaleDateString()}
            </Text>
          )}

          {status === 'rejected' && verificationData?.rejectionReason && (
            <View style={styles.rejectionBox}>
              <InfoIcon size={16} color={PsychiColors.error} />
              <Text style={styles.rejectionText}>{verificationData.rejectionReason}</Text>
            </View>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <InfoIcon size={18} color={PsychiColors.azure} />
          <Text style={styles.infoText}>
            Verification is required before you can be matched with clients. Your documents are securely stored and only reviewed by administrators.
          </Text>
        </View>

        {canSubmit && (
          <>
            {/* Transcript Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>College Transcript</Text>
              <Text style={styles.sectionSubtitle}>
                Upload an official or unofficial transcript showing your degree in psychology, counseling, or related field.
              </Text>

              {transcriptFile ? (
                <View style={styles.fileSelected}>
                  <DocumentIcon size={24} color={PsychiColors.success} />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      {transcriptFile.name}
                    </Text>
                    <Text style={styles.fileStatus}>Ready to upload</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setTranscriptFile(null)}
                  >
                    <CloseIcon size={18} color={PsychiColors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickTranscript}
                  disabled={transcriptUploading}
                >
                  {transcriptUploading ? (
                    <ActivityIndicator size="small" color={PsychiColors.coral} />
                  ) : (
                    <>
                      <DocumentIcon size={28} color={PsychiColors.coral} />
                      <Text style={styles.uploadText}>Tap to select file</Text>
                      <Text style={styles.uploadHint}>PDF or Image</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            {/* ID Document Upload */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Government-Issued ID</Text>
              <Text style={styles.sectionSubtitle}>
                Upload a clear photo of your driver's license, passport, or state ID.
              </Text>

              {idDocumentFile ? (
                <View style={styles.fileSelected}>
                  <Image
                    source={{ uri: idDocumentFile.uri }}
                    style={styles.idPreview}
                  />
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>
                      ID Document
                    </Text>
                    <Text style={styles.fileStatus}>Ready to upload</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setIdDocumentFile(null)}
                  >
                    <CloseIcon size={18} color={PsychiColors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.idUploadOptions}>
                  <TouchableOpacity
                    style={[styles.uploadButton, styles.uploadButtonHalf]}
                    onPress={pickIdDocument}
                    disabled={idUploading}
                  >
                    {idUploading ? (
                      <ActivityIndicator size="small" color={PsychiColors.coral} />
                    ) : (
                      <>
                        <ProfileIcon size={24} color={PsychiColors.coral} />
                        <Text style={styles.uploadTextSmall}>Choose Photo</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadButton, styles.uploadButtonHalf]}
                    onPress={takeIdPhoto}
                    disabled={idUploading}
                  >
                    <>
                      <ProfileIcon size={24} color={PsychiColors.coral} />
                      <Text style={styles.uploadTextSmall}>Take Photo</Text>
                    </>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!transcriptFile || !idDocumentFile) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || !transcriptFile || !idDocumentFile}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={PsychiColors.white} />
              ) : (
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {status === 'pending_review' && (
          <View style={styles.pendingCard}>
            <ActivityIndicator size="small" color="#F59E0B" />
            <Text style={styles.pendingText}>
              Your documents are being reviewed. This usually takes 1-2 business days.
            </Text>
          </View>
        )}

        {status === 'approved' && (
          <View style={styles.approvedCard}>
            <LinearGradient
              colors={[PsychiColors.success, '#059669']}
              style={styles.approvedIcon}
            >
              <CheckIcon size={32} color={PsychiColors.white} />
            </LinearGradient>
            <Text style={styles.approvedTitle}>You're Verified!</Text>
            <Text style={styles.approvedText}>
              You can now be matched with clients and start conducting sessions.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
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
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  statusCard: {
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusDate: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: Spacing.xs,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  rejectionText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.error,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.azure,
    lineHeight: 18,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  uploadButton: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: PsychiColors.coral,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    ...Shadows.soft,
  },
  uploadButtonHalf: {
    flex: 1,
    minHeight: 100,
    padding: Spacing.md,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.coral,
    marginTop: Spacing.sm,
  },
  uploadTextSmall: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.coral,
    marginTop: Spacing.xs,
  },
  uploadHint: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  idUploadOptions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  fileSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  fileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  fileStatus: {
    fontSize: 12,
    color: PsychiColors.success,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  idPreview: {
    width: 48,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: PsychiColors.cream,
  },
  submitButton: {
    backgroundColor: PsychiColors.coral,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: PsychiColors.textMuted,
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  pendingText: {
    flex: 1,
    fontSize: 14,
    color: '#92400E',
  },
  approvedCard: {
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  approvedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  approvedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
  },
  approvedText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
  },
});
