import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  getAdminSupporterDetail,
  getSupporterStats,
  getPastSessions,
  approveSupporter,
  suspendUser,
  reactivateUser,
  updateVerificationStatus,
} from '@/lib/database';
import type { SupporterApplication, SessionWithDetails } from '@/types/database';

interface SupporterStats {
  totalSessions: number;
  totalEarnings: number;
  upcomingCount: number;
}

export default function AdminSupporterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [supporter, setSupporter] = useState<SupporterApplication | null>(null);
  const [stats, setStats] = useState<SupporterStats | null>(null);
  const [recentSessions, setRecentSessions] = useState<SessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);

  const loadSupporterData = async () => {
    if (!id) return;

    try {
      const [supporterData, supporterStats, sessions] = await Promise.all([
        getAdminSupporterDetail(id),
        getSupporterStats(id),
        getPastSessions(id, 'supporter', 5),
      ]);

      setSupporter(supporterData);
      setStats(supporterStats);
      setRecentSessions(sessions);
    } catch (error) {
      console.error('Error loading supporter data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSupporterData();
  }, [id]);

  const handleApprove = async () => {
    if (!supporter) return;

    Alert.alert(
      'Approve Supporter',
      `Are you sure you want to approve ${supporter.full_name} as a supporter?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setActionLoading(true);
            const success = await approveSupporter(supporter.id);
            setActionLoading(false);
            if (success) {
              Alert.alert('Success', `${supporter.full_name} has been approved.`);
              loadSupporterData();
            } else {
              Alert.alert('Error', 'Failed to approve supporter.');
            }
          },
        },
      ]
    );
  };

  const handleSuspend = async () => {
    if (!supporter) return;

    Alert.alert(
      'Suspend Supporter',
      `Are you sure you want to suspend ${supporter.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            const success = await suspendUser(supporter.id);
            setActionLoading(false);
            if (success) {
              Alert.alert('Success', `${supporter.full_name} has been suspended.`);
              loadSupporterData();
            } else {
              Alert.alert('Error', 'Failed to suspend supporter.');
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
      `Are you sure you want to reactivate ${supporter.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reactivate',
          onPress: async () => {
            setActionLoading(true);
            const success = await reactivateUser(supporter.id);
            setActionLoading(false);
            if (success) {
              Alert.alert('Success', `${supporter.full_name} has been reactivated.`);
              loadSupporterData();
            } else {
              Alert.alert('Error', 'Failed to reactivate supporter.');
            }
          },
        },
      ]
    );
  };

  const handleApproveVerification = async () => {
    if (!supporter) return;

    Alert.alert(
      'Approve Verification',
      `Approve ${supporter.full_name}'s verification documents?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setVerificationLoading(true);
            const success = await updateVerificationStatus(supporter.id, 'approved');
            setVerificationLoading(false);
            if (success) {
              Alert.alert('Success', 'Verification documents approved.');
              loadSupporterData();
            } else {
              Alert.alert('Error', 'Failed to approve verification.');
            }
          },
        },
      ]
    );
  };

  const handleRejectVerification = async () => {
    if (!supporter) return;

    Alert.prompt(
      'Reject Verification',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason?: string) => {
            setVerificationLoading(true);
            const success = await updateVerificationStatus(
              supporter.id,
              'rejected',
              reason || 'Documents did not meet requirements.'
            );
            setVerificationLoading(false);
            if (success) {
              Alert.alert('Success', 'Verification rejected. Supporter will be notified.');
              loadSupporterData();
            } else {
              Alert.alert('Error', 'Failed to reject verification.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading supporter details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!supporter) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Not Found' }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Supporter not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = !supporter.is_verified;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Supporter Details' }} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <View style={styles.headerCard}>
          <LinearGradient
            colors={[PsychiColors.azure, PsychiColors.deep]}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>{supporter.full_name.charAt(0)}</Text>
          </LinearGradient>
          <Text style={styles.supporterName}>{supporter.full_name}</Text>
          <Text style={styles.supporterEmail}>{supporter.email}</Text>

          {/* Status Badge */}
          <View style={[
            styles.statusBadge,
            isPending ? styles.pendingBadge : styles.verifiedBadge
          ]}>
            <Text style={[
              styles.statusBadgeText,
              isPending ? styles.pendingText : styles.verifiedText
            ]}>
              {isPending ? 'Pending Verification' : 'Verified'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {actionLoading ? (
              <ActivityIndicator size="small" color={PsychiColors.azure} />
            ) : (
              <>
                {isPending && (
                  <TouchableOpacity style={styles.approveButton} onPress={handleApprove}>
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                )}
                {!isPending && (
                  <TouchableOpacity style={styles.suspendButton} onPress={handleSuspend}>
                    <Text style={styles.suspendButtonText}>Suspend</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Stats Card */}
        {stats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.upcomingCount}</Text>
                <Text style={styles.statLabel}>Upcoming</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>${stats.totalEarnings}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>
          </View>
        )}

        {/* Training Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Training Status</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Training Complete</Text>
              <View style={[
                styles.trainingBadge,
                supporter.training_complete ? styles.trainingCompleteBadge : styles.trainingInProgressBadge
              ]}>
                <Text style={[
                  styles.trainingBadgeText,
                  supporter.training_complete ? styles.trainingCompleteText : styles.trainingInProgressText
                ]}>
                  {supporter.training_complete ? 'Complete' : 'In Progress'}
                </Text>
              </View>
            </View>
            {supporter.training_completed_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Completed On</Text>
                <Text style={styles.infoValue}>{formatDate(supporter.training_completed_at)}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joined</Text>
              <Text style={styles.infoValue}>{formatDate(supporter.created_at)}</Text>
            </View>
          </View>
        </View>

        {/* W-9 Tax Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>W-9 Tax Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>W-9 Status</Text>
              <View style={[
                styles.trainingBadge,
                supporter.w9_completed ? styles.trainingCompleteBadge : styles.trainingInProgressBadge
              ]}>
                <Text style={[
                  styles.trainingBadgeText,
                  supporter.w9_completed ? styles.trainingCompleteText : styles.trainingInProgressText
                ]}>
                  {supporter.w9_completed ? 'Complete' : 'Pending'}
                </Text>
              </View>
            </View>
            {supporter.w9_completed_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Submitted On</Text>
                <Text style={styles.infoValue}>{formatDate(supporter.w9_completed_at)}</Text>
              </View>
            )}
            {supporter.w9_data && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Legal Name</Text>
                  <Text style={styles.infoValue}>{supporter.w9_data.legal_name || 'N/A'}</Text>
                </View>
                {supporter.w9_data.business_name && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Business Name</Text>
                    <Text style={styles.infoValue}>{supporter.w9_data.business_name}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tax Classification</Text>
                  <Text style={styles.infoValue}>
                    {supporter.w9_data.tax_classification === 'individual' ? 'Individual/Sole Proprietor' :
                     supporter.w9_data.tax_classification === 'llc_single' ? 'Single-member LLC' :
                     supporter.w9_data.tax_classification === 'llc_c' ? 'LLC (C Corp)' :
                     supporter.w9_data.tax_classification === 'llc_s' ? 'LLC (S Corp)' :
                     supporter.w9_data.tax_classification === 'llc_p' ? 'LLC (Partnership)' :
                     supporter.w9_data.tax_classification || 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>
                    {supporter.w9_data.address_line1 || supporter.w9_data.city
                      ? [
                          supporter.w9_data.address_line1,
                          supporter.w9_data.address_line2,
                          supporter.w9_data.city && supporter.w9_data.state
                            ? `${supporter.w9_data.city}, ${supporter.w9_data.state} ${supporter.w9_data.zip_code || ''}`
                            : null
                        ].filter(Boolean).join('\n')
                      : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SSN/EIN</Text>
                  <Text style={styles.infoValue}>
                    {supporter.w9_data.ssn_ein
                      ? `***-**-${supporter.w9_data.ssn_ein.slice(-4)}`
                      : 'N/A'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Document Verification */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Document Verification</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Verification Status</Text>
              <View style={[
                styles.trainingBadge,
                supporter.verification_status === 'approved' ? styles.trainingCompleteBadge :
                supporter.verification_status === 'pending_review' ? styles.trainingInProgressBadge :
                supporter.verification_status === 'rejected' ? styles.rejectedBadge :
                styles.trainingInProgressBadge
              ]}>
                <Text style={[
                  styles.trainingBadgeText,
                  supporter.verification_status === 'approved' ? styles.trainingCompleteText :
                  supporter.verification_status === 'rejected' ? styles.rejectedText :
                  styles.trainingInProgressText
                ]}>
                  {supporter.verification_status === 'approved' ? 'Approved' :
                   supporter.verification_status === 'pending_review' ? 'Pending Review' :
                   supporter.verification_status === 'rejected' ? 'Rejected' :
                   'Not Submitted'}
                </Text>
              </View>
            </View>

            {supporter.transcript_url && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transcript</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Document', 'View transcript at:\n' + supporter.transcript_url)}
                >
                  <Text style={[styles.infoValue, { color: PsychiColors.azure }]}>View Document</Text>
                </TouchableOpacity>
              </View>
            )}

            {supporter.id_document_url && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ID Document</Text>
                <TouchableOpacity
                  onPress={() => Alert.alert('Document', 'View ID at:\n' + supporter.id_document_url)}
                >
                  <Text style={[styles.infoValue, { color: PsychiColors.azure }]}>View Document</Text>
                </TouchableOpacity>
              </View>
            )}

            {supporter.verification_submitted_at && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Submitted On</Text>
                <Text style={styles.infoValue}>{formatDate(supporter.verification_submitted_at)}</Text>
              </View>
            )}

            {supporter.verification_rejection_reason && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Rejection Reason</Text>
                <Text style={[styles.infoValue, { color: PsychiColors.error }]}>
                  {supporter.verification_rejection_reason}
                </Text>
              </View>
            )}

            {/* Verification Action Buttons */}
            {supporter.verification_status === 'pending_review' && (
              <View style={styles.verificationActions}>
                {verificationLoading ? (
                  <ActivityIndicator size="small" color={PsychiColors.azure} />
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.verifyApproveButton}
                      onPress={handleApproveVerification}
                    >
                      <Text style={styles.verifyApproveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.verifyRejectButton}
                      onPress={handleRejectVerification}
                    >
                      <Text style={styles.verifyRejectText}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Education</Text>
              <Text style={styles.infoValue}>{supporter.education || 'Not provided'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>{supporter.years_experience} years</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Languages</Text>
              <Text style={styles.infoValue}>{supporter.languages.join(', ')}</Text>
            </View>
          </View>

          {supporter.specialties.length > 0 && (
            <View style={styles.specialtiesSection}>
              <Text style={styles.infoLabel}>Specialties</Text>
              <View style={styles.specialtiesList}>
                {supporter.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {supporter.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.infoLabel}>Bio</Text>
              <Text style={styles.bioText}>{supporter.bio}</Text>
            </View>
          )}
        </View>

        {/* Recent Sessions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {recentSessions.length > 0 ? (
            <View style={styles.sessionsCard}>
              {recentSessions.map((session, index) => (
                <View
                  key={session.id}
                  style={[
                    styles.sessionItem,
                    index < recentSessions.length - 1 && styles.sessionItemBorder
                  ]}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionClient}>
                      {(session.client as any)?.full_name || 'Client'}
                    </Text>
                    <Text style={styles.sessionDate}>{formatDateTime(session.scheduled_at)}</Text>
                  </View>
                  <View style={styles.sessionMeta}>
                    <Text style={styles.sessionType}>{session.session_type}</Text>
                    <View style={[
                      styles.sessionStatusBadge,
                      session.status === 'completed' && styles.sessionCompletedBadge,
                      session.status === 'cancelled' && styles.sessionCancelledBadge,
                    ]}>
                      <Text style={styles.sessionStatusText}>{session.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No sessions yet</Text>
            </View>
          )}
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
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: PsychiColors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.md,
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
  headerCard: {
    backgroundColor: PsychiColors.white,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  supporterName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  supporterEmail: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pendingText: {
    color: '#F59E0B',
  },
  verifiedText: {
    color: PsychiColors.success,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  approveButton: {
    backgroundColor: PsychiColors.success,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  approveButtonText: {
    color: PsychiColors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  suspendButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  suspendButtonText: {
    color: PsychiColors.error,
    fontWeight: '600',
    fontSize: 15,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
    fontFamily: 'Georgia',
  },
  statsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    ...Shadows.soft,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.azure,
  },
  statLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  infoLabel: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  trainingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  trainingCompleteBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  trainingInProgressBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  trainingBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trainingCompleteText: {
    color: PsychiColors.success,
  },
  trainingInProgressText: {
    color: '#F59E0B',
  },
  specialtiesSection: {
    marginTop: Spacing.md,
  },
  specialtiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  specialtyTag: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  specialtyText: {
    fontSize: 13,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  bioSection: {
    marginTop: Spacing.md,
  },
  bioText: {
    fontSize: 14,
    color: '#2A2A2A',
    lineHeight: 22,
    marginTop: Spacing.sm,
  },
  sessionsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  sessionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  sessionDate: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  sessionMeta: {
    alignItems: 'flex-end',
  },
  sessionType: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    textTransform: 'capitalize',
  },
  sessionStatusBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: 4,
  },
  sessionCompletedBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  sessionCancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  sessionStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.textMuted,
    textTransform: 'capitalize',
  },
  emptyCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyText: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  rejectedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  rejectedText: {
    color: PsychiColors.error,
  },
  verificationActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  verifyApproveButton: {
    flex: 1,
    backgroundColor: PsychiColors.success,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  verifyApproveText: {
    color: PsychiColors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  verifyRejectButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  verifyRejectText: {
    color: PsychiColors.error,
    fontWeight: '600',
    fontSize: 14,
  },
});
