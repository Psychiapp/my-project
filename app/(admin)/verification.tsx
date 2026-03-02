import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { CheckIcon, DocumentIcon } from '@/components/icons';
import { getPendingSupporters } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import type { SupporterApplication } from '@/types/database';

export default function AdminVerification() {
  const router = useRouter();
  const { isDemoMode } = useAuth();
  const [supporters, setSupporters] = useState<SupporterApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSupporters = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (isDemoMode) {
        // Demo mode: show sample data
        setSupporters([
          {
            id: 'demo-1',
            email: 'sarah.counselor@example.com',
            full_name: 'Sarah Thompson',
            avatar_url: null,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            bio: 'Licensed therapist with 8 years of experience in cognitive behavioral therapy.',
            specialties: ['Anxiety', 'Depression', 'Stress'],
            education: 'M.A. Clinical Psychology, UCLA',
            languages: ['English', 'Spanish'],
            years_experience: 8,
            training_complete: true,
            training_completed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            is_verified: false,
            transcript_url: 'demo',
            id_document_url: 'demo',
          },
          {
            id: 'demo-2',
            email: 'michael.support@example.com',
            full_name: 'Michael Chen',
            avatar_url: null,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            bio: 'Peer support specialist focusing on addiction recovery and mental wellness.',
            specialties: ['Addiction', 'Recovery', 'Mindfulness'],
            education: 'B.A. Psychology, Stanford',
            languages: ['English', 'Mandarin'],
            years_experience: 5,
            training_complete: true,
            training_completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            is_verified: false,
            transcript_url: 'demo',
            id_document_url: 'demo',
          },
        ]);
      } else {
        const data = await getPendingSupporters();
        setSupporters(data);
      }
    } catch (error) {
      console.error('Error fetching pending supporters:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSupporters();
  }, [isDemoMode]);

  const handleViewSupporter = (supporter: SupporterApplication) => {
    router.push(`/(admin)/supporter/${supporter.id}`);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeSinceApplied = (dateStr: string) => {
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading verifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchSupporters(true)}
            tintColor={PsychiColors.azure}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Verification</Text>
          <Text style={styles.headerSubtitle}>
            {supporters.length} pending {supporters.length === 1 ? 'application' : 'applications'}
          </Text>
        </View>

        {supporters.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <CheckIcon size={48} color={PsychiColors.success} />
            </View>
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptySubtitle}>
              No pending verifications at the moment. New applications will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {supporters.map((supporter) => (
              <TouchableOpacity
                key={supporter.id}
                style={styles.supporterCard}
                onPress={() => handleViewSupporter(supporter)}
                activeOpacity={0.7}
              >
                {/* Header Row */}
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {supporter.full_name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={styles.supporterName}>{supporter.full_name}</Text>
                    <Text style={styles.supporterEmail}>{supporter.email}</Text>
                  </View>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>{getTimeSinceApplied(supporter.created_at)}</Text>
                  </View>
                </View>

                {/* Info Row */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Experience</Text>
                    <Text style={styles.infoValue}>{supporter.years_experience} years</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Education</Text>
                    <Text style={styles.infoValue} numberOfLines={1}>{supporter.education || 'Not provided'}</Text>
                  </View>
                </View>

                {/* Specialties */}
                {supporter.specialties.length > 0 && (
                  <View style={styles.specialtiesRow}>
                    {supporter.specialties.slice(0, 3).map((specialty, index) => (
                      <View key={index} style={styles.specialtyBadge}>
                        <Text style={styles.specialtyText}>{specialty}</Text>
                      </View>
                    ))}
                    {supporter.specialties.length > 3 && (
                      <View style={styles.specialtyBadge}>
                        <Text style={styles.specialtyText}>+{supporter.specialties.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Documents Status */}
                <View style={styles.documentsRow}>
                  <View style={styles.documentItem}>
                    <DocumentIcon size={16} color={supporter.transcript_url ? PsychiColors.success : PsychiColors.textMuted} />
                    <Text style={[styles.documentText, supporter.transcript_url && styles.documentTextComplete]}>
                      Transcript {supporter.transcript_url ? 'uploaded' : 'pending'}
                    </Text>
                  </View>
                  <View style={styles.documentItem}>
                    <DocumentIcon size={16} color={supporter.id_document_url ? PsychiColors.success : PsychiColors.textMuted} />
                    <Text style={[styles.documentText, supporter.id_document_url && styles.documentTextComplete]}>
                      ID {supporter.id_document_url ? 'uploaded' : 'pending'}
                    </Text>
                  </View>
                </View>

                {/* Training Status */}
                <View style={styles.trainingRow}>
                  <View style={[
                    styles.trainingBadge,
                    supporter.training_complete && styles.trainingBadgeComplete
                  ]}>
                    <CheckIcon size={14} color={supporter.training_complete ? PsychiColors.success : PsychiColors.textMuted} />
                    <Text style={[
                      styles.trainingText,
                      supporter.training_complete && styles.trainingTextComplete
                    ]}>
                      Training {supporter.training_complete ? 'complete' : 'incomplete'}
                    </Text>
                  </View>
                </View>

                {/* Action Prompt */}
                <View style={styles.actionPrompt}>
                  <Text style={styles.actionPromptText}>Tap to review and verify</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  headerSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl * 2,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
  },
  supporterCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PsychiColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  headerInfo: {
    flex: 1,
  },
  supporterName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  supporterEmail: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  timeBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F59E0B',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  specialtyBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
  documentsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  documentText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  documentTextComplete: {
    color: PsychiColors.success,
  },
  trainingRow: {
    marginBottom: Spacing.sm,
  },
  trainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  trainingBadgeComplete: {
    // No additional styles needed
  },
  trainingText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  trainingTextComplete: {
    color: PsychiColors.success,
  },
  actionPrompt: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  actionPromptText: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
});
