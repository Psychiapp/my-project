/**
 * Admin Dashboard - Reports Tab
 * View and manage user reports
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PsychiColors, Shadows, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { AlertIcon, CheckIcon, ClockIcon, ChevronRightIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface UserReport {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  reviewed_at: string | null;
  action_taken: string | null;
  created_at: string;
  reporter?: {
    full_name: string;
    email: string;
    role: string;
  };
  reported_user?: {
    full_name: string;
    email: string;
    role: string;
  };
}

type FilterStatus = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export default function AdminReportsScreen() {
  const { user } = useAuth();
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const loadReports = useCallback(async () => {
    if (!supabase) return;

    try {
      let query = supabase
        .from('user_reports')
        .select(`
          *,
          reporter:reporter_id(full_name, email, role),
          reported_user:reported_user_id(full_name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatReason = (reason: string) => {
    return reason
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return PsychiColors.warning;
      case 'reviewed':
        return PsychiColors.azure;
      case 'resolved':
        return PsychiColors.success;
      case 'dismissed':
        return PsychiColors.textMuted;
      default:
        return PsychiColors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon size={14} color={PsychiColors.warning} />;
      case 'reviewed':
        return <AlertIcon size={14} color={PsychiColors.azure} />;
      case 'resolved':
        return <CheckIcon size={14} color={PsychiColors.success} />;
      default:
        return null;
    }
  };

  const updateReportStatus = async (
    reportId: string,
    newStatus: 'reviewed' | 'resolved' | 'dismissed',
    actionTaken?: string
  ) => {
    if (!supabase || !user?.id) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('user_reports')
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          action_taken: actionTaken || null,
        })
        .eq('id', reportId);

      if (error) throw error;

      Alert.alert('Success', `Report marked as ${newStatus}`);
      setSelectedReport(null);
      setAdminNotes('');
      loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      Alert.alert('Error', 'Failed to update report');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReportAction = (report: UserReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');

    Alert.alert(
      'Update Report Status',
      `Reporter: ${report.reporter?.full_name}\nReported: ${report.reported_user?.full_name}\nReason: ${formatReason(report.reason)}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedReport(null) },
        {
          text: 'Dismiss',
          onPress: () => updateReportStatus(report.id, 'dismissed'),
        },
        {
          text: 'Mark Reviewed',
          onPress: () => updateReportStatus(report.id, 'reviewed'),
        },
        {
          text: 'Resolve',
          onPress: () => {
            Alert.prompt(
              'Action Taken',
              'Describe the action taken to resolve this report:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Resolve',
                  onPress: (action?: string) => updateReportStatus(report.id, 'resolved', action),
                },
              ],
              'plain-text'
            );
          },
        },
      ]
    );
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['pending', 'reviewed', 'resolved', 'dismissed', 'all'] as FilterStatus[]).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterTab, filterStatus === status && styles.filterTabActive]}
            onPress={() => setFilterStatus(status)}
          >
            <Text
              style={[styles.filterText, filterStatus === status && styles.filterTextActive]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && pendingCount > 0 && ` (${pendingCount})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {reports.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertIcon size={48} color={PsychiColors.textMuted} />
            <Text style={styles.emptyTitle}>No reports</Text>
            <Text style={styles.emptySubtitle}>
              {filterStatus === 'all'
                ? 'No user reports have been submitted'
                : `No ${filterStatus} reports`}
            </Text>
          </View>
        ) : (
          reports.map((report) => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => handleReportAction(report)}
              activeOpacity={0.7}
            >
              <View style={styles.reportHeader}>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(report.status)}20` }]}>
                  {getStatusIcon(report.status)}
                  <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Text>
                </View>
                <Text style={styles.reportDate}>{formatDate(report.created_at)}</Text>
              </View>

              <View style={styles.reportBody}>
                <View style={styles.userRow}>
                  <Text style={styles.userLabel}>Reporter:</Text>
                  <Text style={styles.userName}>
                    {report.reporter?.full_name || 'Unknown'}{' '}
                    <Text style={styles.userRole}>({report.reporter?.role})</Text>
                  </Text>
                </View>
                <View style={styles.userRow}>
                  <Text style={styles.userLabel}>Reported:</Text>
                  <Text style={styles.userName}>
                    {report.reported_user?.full_name || 'Unknown'}{' '}
                    <Text style={styles.userRole}>({report.reported_user?.role})</Text>
                  </Text>
                </View>
              </View>

              <View style={styles.reasonContainer}>
                <Text style={styles.reasonLabel}>{formatReason(report.reason)}</Text>
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {report.description}
                </Text>
              </View>

              {report.action_taken && (
                <View style={styles.actionContainer}>
                  <Text style={styles.actionLabel}>Action taken:</Text>
                  <Text style={styles.actionText}>{report.action_taken}</Text>
                </View>
              )}

              <View style={styles.reportFooter}>
                <Text style={styles.tapToReview}>Tap to review</Text>
                <ChevronRightIcon size={16} color={PsychiColors.textMuted} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterTab: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  filterTabActive: {
    backgroundColor: PsychiColors.azure,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  filterTextActive: {
    color: PsychiColors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  reportCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
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
    fontSize: 12,
    fontWeight: '600',
  },
  reportDate: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  reportBody: {
    marginBottom: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  userRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  userLabel: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    width: 70,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.midnight,
    flex: 1,
  },
  userRole: {
    fontWeight: '400',
    color: PsychiColors.textMuted,
  },
  reasonContainer: {
    marginBottom: Spacing.sm,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.error,
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
  actionContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.success,
    marginBottom: 2,
  },
  actionText: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  tapToReview: {
    fontSize: 12,
    color: PsychiColors.azure,
    marginRight: 4,
  },
});
