import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { ChatIcon, CheckIcon, ArrowLeftIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { getSupporterReviews } from '@/lib/database';
import type { SupporterReview } from '@/types/database';

export default function FeedbackScreen() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<SupporterReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'chat' | 'phone' | 'video'>('all');

  useEffect(() => {
    if (user?.id) {
      loadReviews();
    }
  }, [user?.id]);

  const loadReviews = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getSupporterReviews(user.id);
      setReviews(data);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.session_type === filter);

  const sessionTypeCounts = {
    all: reviews.length,
    chat: reviews.filter(r => r.session_type === 'chat').length,
    phone: reviews.filter(r => r.session_type === 'phone').length,
    video: reviews.filter(r => r.session_type === 'video').length,
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArrowLeftIcon size={16} color={PsychiColors.azure} />
              <Text style={styles.backButtonText}> Back</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Feedback</Text>
          <Text style={styles.headerSubtitle}>
            See what clients are saying about your support sessions
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PsychiColors.azure} />
            <Text style={styles.loadingText}>Loading feedback...</Text>
          </View>
        ) : (
          <>
            {/* Stats Overview */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{reviews.length}</Text>
                <Text style={styles.statLabel}>Total Feedback</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#2E5C8A' }]}>{sessionTypeCounts.chat}</Text>
                <Text style={styles.statLabel}>Chat</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#4A90E2' }]}>{sessionTypeCounts.phone}</Text>
                <Text style={styles.statLabel}>Phone</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: '#87CEEB' }]}>{sessionTypeCounts.video}</Text>
                <Text style={styles.statLabel}>Video</Text>
              </View>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(['all', 'chat', 'phone', 'video'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.filterTab,
                      filter === tab && styles.filterTabActive,
                    ]}
                    onPress={() => setFilter(tab)}
                  >
                    <Text style={[
                      styles.filterTabText,
                      filter === tab && styles.filterTabTextActive,
                    ]}>
                      {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Feedback List */}
            <View style={styles.section}>
              {filteredReviews.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <ChatIcon size={32} color={PsychiColors.azure} />
                  </View>
                  <Text style={styles.emptyTitle}>
                    {reviews.length === 0 ? 'No feedback yet' : 'No matching feedback'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {reviews.length === 0
                      ? 'Feedback from clients will appear here after sessions'
                      : 'No feedback matches the selected filter'}
                  </Text>
                </View>
              ) : (
                filteredReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <LinearGradient
                        colors={['#4A90E2', '#2E5C8A']}
                        style={styles.reviewAvatar}
                      >
                        <Text style={styles.reviewAvatarText}>
                          {review.client_name.charAt(0)}
                        </Text>
                      </LinearGradient>
                      <View style={styles.reviewHeaderInfo}>
                        <Text style={styles.reviewName}>{review.client_name}</Text>
                        <Text style={styles.reviewMeta}>
                          {review.session_type.charAt(0).toUpperCase() + review.session_type.slice(1)} Session
                        </Text>
                      </View>
                      <View style={styles.reviewDateContainer}>
                        <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    ) : (
                      <View style={styles.noCommentContainer}>
                        <CheckIcon size={16} color={PsychiColors.azure} />
                        <Text style={styles.noCommentText}>Session completed successfully</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  backButton: {
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: PsychiColors.midnight,
    marginTop: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: 15,
    color: PsychiColors.azure,
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: PsychiColors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: PsychiColors.midnight,
  },
  statLabel: {
    fontSize: 11,
    color: PsychiColors.azure,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  filterTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
  filterTabTextActive: {
    color: '#2E5C8A',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(176, 224, 230, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PsychiColors.azure,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  reviewHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  reviewName: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  reviewMeta: {
    fontSize: 12,
    color: PsychiColors.azure,
    marginTop: 2,
  },
  reviewDateContainer: {
    alignItems: 'flex-end',
  },
  reviewDate: {
    fontSize: 11,
    color: PsychiColors.azure,
  },
  reviewComment: {
    fontSize: 14,
    color: PsychiColors.midnight,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  noCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  noCommentText: {
    fontSize: 14,
    color: PsychiColors.azure,
    fontStyle: 'italic',
  },
});
