/**
 * Admin Dashboard - Supporter Detail View
 * View supporter info, documents, W9 data, and manage verification
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PsychiColors, Shadows, Typography } from '@/constants/theme';
import {
  ChevronLeftIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  AlertIcon,
  FileTextIcon,
  DocumentIcon,
  MailIcon,
  BookIcon,
  CalendarIcon,
} from '@/components/icons';
import { getAdminSupporterDetail, updateVerificationStatus, suspendUser, reactivateUser, deleteUser } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import type { SupporterApplication, W9FormData } from '@/types/database';

export default function SupporterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [supporter, setSupporter] = useState<SupporterApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspensionInput, setShowSuspensionInput] = useState(false);

  const loadSupporter = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getAdminSupporterDetail(id);
      setSupporter(data);
    } catch (error) {
      console.error('Error loading supporter:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSupporter();
  }, [loadSupporter]);

  const handleViewDocument = async (documentUrl: string | null | undefined, docType: string) => {
    if (!documentUrl) {
      Alert.alert('No Document', `No ${docType} has been uploaded.`);
      return;
    }

    // Navigate to document viewer with file path only
    // The viewer screen will generate the signed URL itself to avoid URL encoding issues
    router.push({
      pathname: '/document/[id]',
      params: {
        id: 'remote',
        filePath: documentUrl,
        title: docType,
      },
    });
  };

  const handleApprove = async () => {
    if (!supporter) return;

    Alert.alert(
      'Approve Supporter',
      `Are you sure you want to approve ${supporter.full_name}? They will be able to start accepting clients.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setUpdating(true);
            try {
              const success = await updateVerificationStatus(supporter.id, 'approved');
              if (success) {
                Alert.alert('Success', 'Supporter has been approved.');
                loadSupporter(); // Refresh data
              } else {
                Alert.alert('Error', 'Failed to approve supporter. Please try again.');
              }
            } catch (error) {
              console.error('Error approving supporter:', error);
              Alert.alert('Error', 'Failed to approve supporter. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!supporter) return;

    if (!showRejectionInput) {
      setShowRejectionInput(true);
      return;
    }

    if (!rejectionReason.trim()) {
      Alert.alert('Rejection Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    Alert.alert(
      'Reject Application',
      `Are you sure you want to reject ${supporter.full_name}'s application?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const success = await updateVerificationStatus(supporter.id, 'rejected', rejectionReason);
              if (success) {
                Alert.alert('Application Rejected', 'The supporter has been notified.');
                setShowRejectionInput(false);
                setRejectionReason('');
                loadSupporter(); // Refresh data
              } else {
                Alert.alert('Error', 'Failed to reject application. Please try again.');
              }
            } catch (error) {
              console.error('Error rejecting supporter:', error);
              Alert.alert('Error', 'Failed to reject application. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleSuspend = async () => {
    if (!supporter) return;

    // First click shows the input
    if (!showSuspensionInput) {
      setShowSuspensionInput(true);
      return;
    }

    // Require a reason
    if (!suspensionReason.trim()) {
      Alert.alert('Suspension Reason Required', 'Please provide a reason for suspension.');
      return;
    }

    Alert.alert(
      'Suspend Supporter',
      `Are you sure you want to suspend ${supporter.full_name}? They will no longer be able to accept clients.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const success = await suspendUser(supporter.id, suspensionReason.trim());
              if (success) {
                Alert.alert('Success', 'Supporter has been suspended.');
                setShowSuspensionInput(false);
                setSuspensionReason('');
                loadSupporter(); // Refresh data
              } else {
                Alert.alert('Error', 'Failed to suspend supporter. Please try again.');
              }
            } catch (error: any) {
              console.error('Error suspending supporter:', error);
              Alert.alert('Error', `Failed to suspend supporter: ${error.message || 'Unknown error'}`);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleReactivate = async () => {
    if (!supporter) return;

    Alert.alert(
      'Reactivate Supporter',
      `Are you sure you want to reactivate ${supporter.full_name}? They will be able to accept clients again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            setUpdating(true);
            try {
              const success = await reactivateUser(supporter.id);
              if (success) {
                Alert.alert('Success', 'Supporter has been reactivated.');
                loadSupporter(); // Refresh data
              } else {
                Alert.alert('Error', 'Failed to reactivate supporter. Please try again.');
              }
            } catch (error: any) {
              console.error('Error reactivating supporter:', error);
              Alert.alert('Error', `Failed to reactivate supporter: ${error.message || 'Unknown error'}`);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!supporter) return;

    Alert.alert(
      'Delete User Account',
      `This action is permanent. Are you sure you want to delete ${supporter.full_name}'s account? All their data will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const result = await deleteUser(supporter.id);
              if (result.success) {
                Alert.alert('Success', 'User account has been permanently deleted.', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Error', `Failed to delete user: ${result.error || 'Unknown error'}`);
              }
            } catch (error: any) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', `Failed to delete user: ${error.message || 'Unknown error'}`);
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = () => {
    const status = supporter?.verification_status || 'not_submitted';
    switch (status) {
      case 'approved':
        return (
          <View style={[styles.statusBadge, styles.approvedBadge]}>
            <CheckCircleIcon size={14} color={PsychiColors.success} />
            <Text style={styles.approvedText}>Approved</Text>
          </View>
        );
      case 'rejected':
        return (
          <View style={[styles.statusBadge, styles.rejectedBadge]}>
            <AlertIcon size={14} color={PsychiColors.error} />
            <Text style={styles.rejectedText}>Rejected</Text>
          </View>
        );
      case 'pending_review':
        return (
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <ClockIcon size={14} color={PsychiColors.warning} />
            <Text style={styles.pendingText}>Pending Review</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.statusBadge, styles.notSubmittedBadge]}>
            <Text style={styles.notSubmittedText}>Not Submitted</Text>
          </View>
        );
    }
  };

  const renderW9Data = () => {
    const w9 = supporter?.w9_data as W9FormData | null;
    if (!w9) {
      return (
        <View style={styles.noDataCard}>
          <Text style={styles.noDataText}>W-9 form not submitted</Text>
        </View>
      );
    }

    return (
      <View style={styles.w9Card}>
        <View style={styles.w9Row}>
          <Text style={styles.w9Label}>Legal Name</Text>
          <Text style={styles.w9Value}>{w9.legal_name || '-'}</Text>
        </View>
        <View style={styles.w9Divider} />
        <View style={styles.w9Row}>
          <Text style={styles.w9Label}>Business Name</Text>
          <Text style={styles.w9Value}>{w9.business_name || '-'}</Text>
        </View>
        <View style={styles.w9Divider} />
        <View style={styles.w9Row}>
          <Text style={styles.w9Label}>Tax Classification</Text>
          <Text style={styles.w9Value}>{w9.tax_classification || '-'}</Text>
        </View>
        <View style={styles.w9Divider} />
        <View style={styles.w9Row}>
          <Text style={styles.w9Label}>Address</Text>
          <Text style={styles.w9Value}>
            {w9.address_line1 ? `${w9.address_line1}, ${w9.city || ''} ${w9.state || ''} ${w9.zip_code || ''}` : '-'}
          </Text>
        </View>
        <View style={styles.w9Divider} />
        <View style={styles.w9Row}>
          <Text style={styles.w9Label}>SSN/EIN</Text>
          <Text style={styles.w9Value}>
            {w9.ssn_ein ? `***-**-${w9.ssn_ein.slice(-4)}` : '-'}
          </Text>
        </View>
        <View style={styles.w9Divider} />
        <View style={styles.w9Row}>
          <Text style={styles.w9Label}>Submitted</Text>
          <Text style={styles.w9Value}>
            {w9.submitted_at ? new Date(w9.submitted_at).toLocaleDateString() : '-'}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Supporter Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!supporter) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Supporter Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Supporter not found</Text>
            <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  const needsReview = supporter.verification_status === 'pending_review';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Supporter Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {supporter.avatar_url ? (
                <Image source={{ uri: supporter.avatar_url }} style={styles.avatar} />
              ) : (
                <UserCircleIcon size={80} color={PsychiColors.textMuted} />
              )}
            </View>
            <Text style={styles.name}>{supporter.full_name}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${supporter.email}`)}>
              <Text style={styles.email}>{supporter.email}</Text>
            </TouchableOpacity>
            <View style={styles.statusContainer}>{getStatusBadge()}</View>
          </View>

          {/* Education Info */}
          <Text style={styles.sectionTitle}>Education</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <BookIcon size={18} color={PsychiColors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>School</Text>
                <Text style={styles.infoValue}>{supporter.school_name || '-'}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <BookIcon size={18} color={PsychiColors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Major</Text>
                <Text style={styles.infoValue}>{supporter.major || '-'}</Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <CalendarIcon size={18} color={PsychiColors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Expected Graduation</Text>
                <Text style={styles.infoValue}>{supporter.expected_graduation || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Verification Documents */}
          <Text style={styles.sectionTitle}>Verification Documents</Text>
          <View style={styles.documentsCard}>
            <TouchableOpacity
              style={styles.documentRow}
              onPress={() => handleViewDocument(supporter.transcript_url, 'Transcript')}
            >
              <View style={styles.documentIcon}>
                <FileTextIcon size={24} color={supporter.transcript_url ? PsychiColors.royalBlue : PsychiColors.textMuted} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentLabel}>Academic Transcript</Text>
                <Text style={styles.documentStatus}>
                  {supporter.transcript_url ? 'Uploaded - Tap to view' : 'Not uploaded'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.documentDivider} />
            <TouchableOpacity
              style={styles.documentRow}
              onPress={() => handleViewDocument(supporter.id_document_url, 'ID Document')}
            >
              <View style={styles.documentIcon}>
                <DocumentIcon size={24} color={supporter.id_document_url ? PsychiColors.royalBlue : PsychiColors.textMuted} />
              </View>
              <View style={styles.documentInfo}>
                <Text style={styles.documentLabel}>ID Document</Text>
                <Text style={styles.documentStatus}>
                  {supporter.id_document_url ? 'Uploaded - Tap to view' : 'Not uploaded'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* W-9 Form Data */}
          <Text style={styles.sectionTitle}>W-9 Tax Information</Text>
          {renderW9Data()}

          {/* Bio */}
          {supporter.bio && (
            <>
              <Text style={styles.sectionTitle}>Bio</Text>
              <View style={styles.bioCard}>
                <Text style={styles.bioText}>{supporter.bio}</Text>
              </View>
            </>
          )}

          {/* Specialties */}
          {supporter.specialties && supporter.specialties.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.specialtiesContainer}>
                {supporter.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyBadge}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Rejection Reason (if rejected) */}
          {supporter.verification_status === 'rejected' && supporter.verification_rejection_reason && (
            <>
              <Text style={styles.sectionTitle}>Rejection Reason</Text>
              <View style={styles.rejectionCard}>
                <Text style={styles.rejectionText}>{supporter.verification_rejection_reason}</Text>
              </View>
            </>
          )}

          {/* Suspension Reason (if suspended) */}
          {supporter.verification_status === 'approved' && !supporter.is_verified && supporter.suspension_reason && (
            <>
              <Text style={styles.sectionTitle}>Suspension Reason</Text>
              <View style={styles.suspensionCard}>
                <Text style={styles.suspensionText}>{supporter.suspension_reason}</Text>
                {supporter.suspended_at && (
                  <Text style={styles.suspensionDate}>
                    Suspended on {new Date(supporter.suspended_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                )}
              </View>
            </>
          )}

          {/* Action Buttons - Show based on status */}
          <View style={styles.actionContainer}>
            {/* Pending Review: Approve + Deny */}
            {needsReview && (
              <>
                {showRejectionInput && (
                  <TextInput
                    style={styles.rejectionInput}
                    placeholder="Enter rejection reason..."
                    placeholderTextColor={PsychiColors.textMuted}
                    value={rejectionReason}
                    onChangeText={setRejectionReason}
                    multiline
                    numberOfLines={3}
                  />
                )}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={handleReject}
                    disabled={updating}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color={PsychiColors.white} />
                    ) : (
                      <Text style={styles.rejectButtonText}>
                        {showRejectionInput ? 'Confirm Rejection' : 'Deny'}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={handleApprove}
                    disabled={updating}
                  >
                    {updating ? (
                      <ActivityIndicator size="small" color={PsychiColors.white} />
                    ) : (
                      <Text style={styles.approveButtonText}>Approve</Text>
                    )}
                  </TouchableOpacity>
                </View>
                {showRejectionInput && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowRejectionInput(false);
                      setRejectionReason('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Approved and Active: Show Suspend */}
            {supporter?.verification_status === 'approved' && supporter?.is_verified && (
              <>
                {showSuspensionInput && (
                  <TextInput
                    style={styles.rejectionInput}
                    placeholder="Enter suspension reason..."
                    placeholderTextColor={PsychiColors.textMuted}
                    value={suspensionReason}
                    onChangeText={setSuspensionReason}
                    multiline
                    numberOfLines={3}
                  />
                )}
                <TouchableOpacity
                  style={[styles.actionButton, styles.suspendButton]}
                  onPress={handleSuspend}
                  disabled={updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color={PsychiColors.white} />
                  ) : (
                    <Text style={styles.suspendButtonText}>
                      {showSuspensionInput ? 'Confirm Suspension' : 'Suspend Supporter'}
                    </Text>
                  )}
                </TouchableOpacity>
                {showSuspensionInput && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowSuspensionInput(false);
                      setSuspensionReason('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Suspended (approved but is_verified=false) or Rejected: Show Reactivate */}
            {((supporter?.verification_status === 'approved' && !supporter?.is_verified) ||
              supporter?.verification_status === 'rejected') && (
              <TouchableOpacity
                style={[styles.actionButton, styles.reactivateButton]}
                onPress={handleReactivate}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color={PsychiColors.white} />
                ) : (
                  <Text style={styles.reactivateButtonText}>Reactivate Supporter</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Delete - Available for all statuses */}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton, { marginTop: 16 }]}
              onPress={handleDelete}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator size="small" color={PsychiColors.white} />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.divider,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: PsychiColors.textSecondary,
    marginBottom: 16,
  },
  backLink: {
    padding: 12,
  },
  backLinkText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  profileCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Shadows.soft,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PsychiColors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.midnight,
    marginBottom: 4,
  },
  email: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.royalBlue,
    marginBottom: 12,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  approvedBadge: {
    backgroundColor: PsychiColors.successMuted,
  },
  approvedText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.success,
    fontWeight: Typography.fontWeight.medium,
  },
  rejectedBadge: {
    backgroundColor: PsychiColors.errorMuted,
  },
  rejectedText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.error,
    fontWeight: Typography.fontWeight.medium,
  },
  pendingBadge: {
    backgroundColor: PsychiColors.warningMuted,
  },
  pendingText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.warning,
    fontWeight: Typography.fontWeight.medium,
  },
  notSubmittedBadge: {
    backgroundColor: PsychiColors.frost,
  },
  notSubmittedText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
    marginTop: 24,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
    marginVertical: 4,
  },
  documentsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.soft,
  },
  documentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: PsychiColors.frost,
    justifyContent: 'center',
    alignItems: 'center',
  },
  documentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  documentLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.midnight,
    marginBottom: 2,
  },
  documentStatus: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  documentDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
  },
  w9Card: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.soft,
  },
  w9Row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  w9Label: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  w9Value: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  w9Divider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
  },
  noDataCard: {
    backgroundColor: PsychiColors.frost,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  bioCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.soft,
  },
  bioText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    lineHeight: 22,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: `${PsychiColors.royalBlue}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
  },
  rejectionCard: {
    backgroundColor: PsychiColors.errorMuted,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${PsychiColors.error}30`,
  },
  rejectionText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.error,
  },
  suspensionCard: {
    backgroundColor: PsychiColors.warningMuted,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: `${PsychiColors.warning}30`,
  },
  suspensionText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.warning,
  },
  suspensionDate: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: 8,
  },
  actionContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: PsychiColors.divider,
  },
  rejectionInput: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: PsychiColors.error,
  },
  rejectButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  approveButton: {
    backgroundColor: PsychiColors.success,
  },
  approveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  suspendButton: {
    backgroundColor: PsychiColors.warning,
  },
  suspendButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  reactivateButton: {
    backgroundColor: PsychiColors.royalBlue,
  },
  reactivateButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  deleteButton: {
    backgroundColor: PsychiColors.error,
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
});
