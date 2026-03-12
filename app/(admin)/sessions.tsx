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
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChatIcon, PhoneIcon, VideoIcon } from '@/components/icons';
import { Avatar } from '@/components/Avatar';
import { getAllSessions } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import type { AdminSessionListing, SessionStatus } from '@/types/database';

type SessionFilter = 'all' | 'upcoming' | 'active' | 'completed' | 'cancelled';

export default function AdminSessions() {
  const { isDemoMode } = useAuth();
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [sessions, setSessions] = useState<AdminSessionListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSessions = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      if (isDemoMode) {
        // Demo data
        const now = new Date();
        setSessions([
          {
            id: 'demo-1',
            client_id: 'c1',
            client_name: 'John Doe',
            client_avatar: null,
            supporter_id: 's1',
            supporter_name: 'Sarah Thompson',
            supporter_avatar: null,
            session_type: 'video',
            scheduled_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
            ended_at: null,
            duration_minutes: 30,
            status: 'scheduled',
            has_transcript: false,
          },
          {
            id: 'demo-2',
            client_id: 'c2',
            client_name: 'Jane Smith',
            client_avatar: null,
            supporter_id: 's1',
            supporter_name: 'Sarah Thompson',
            supporter_avatar: null,
            session_type: 'chat',
            scheduled_at: now.toISOString(),
            ended_at: null,
            duration_minutes: 30,
            status: 'in_progress',
            has_transcript: true,
          },
          {
            id: 'demo-3',
            client_id: 'c1',
            client_name: 'John Doe',
            client_avatar: null,
            supporter_id: 's2',
            supporter_name: 'Michael Chen',
            supporter_avatar: null,
            session_type: 'phone',
            scheduled_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
            ended_at: new Date(now.getTime() - 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
            duration_minutes: 45,
            status: 'completed',
            has_transcript: false,
          },
          {
            id: 'demo-4',
            client_id: 'c3',
            client_name: 'Emily Johnson',
            client_avatar: null,
            supporter_id: 's1',
            supporter_name: 'Sarah Thompson',
            supporter_avatar: null,
            session_type: 'video',
            scheduled_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            ended_at: null,
            duration_minutes: 30,
            status: 'cancelled',
            has_transcript: false,
          },
        ]);
      } else {
        // Map filter to API filter
        let apiFilter: 'all' | 'active' | 'completed' | 'cancelled' = 'all';
        if (filter === 'active' || filter === 'upcoming') {
          apiFilter = 'active';
        } else if (filter === 'completed') {
          apiFilter = 'completed';
        } else if (filter === 'cancelled') {
          apiFilter = 'cancelled';
        }
        const data = await getAllSessions(apiFilter);
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filter, isDemoMode]);

  // Filter sessions locally for more granular control
  const filteredSessions = sessions.filter(session => {
    const now = new Date();
    const scheduledAt = new Date(session.scheduled_at);

    if (filter === 'upcoming') {
      return ['scheduled'].includes(session.status) && scheduledAt > now;
    } else if (filter === 'active') {
      return session.status === 'in_progress';
    }
    return true;
  });

  const stats = {
    total: sessions.length,
    upcoming: sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()).length,
    active: sessions.filter(s => s.status === 'in_progress').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => ['cancelled', 'no_show'].includes(s.status)).length,
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <ChatIcon size={16} color={PsychiColors.azure} />;
      case 'phone':
        return <PhoneIcon size={16} color={PsychiColors.violet} />;
      case 'video':
        return <VideoIcon size={16} color={PsychiColors.coral} />;
      default:
        return <ChatIcon size={16} color={PsychiColors.azure} />;
    }
  };

  const getStatusColor = (status: SessionStatus) => {
    switch (status) {
      case 'scheduled':
        return PsychiColors.azure;
      case 'in_progress':
        return PsychiColors.success;
      case 'completed':
        return PsychiColors.textMuted;
      case 'cancelled':
      case 'no_show':
        return PsychiColors.error;
      default:
        return PsychiColors.textMuted;
    }
  };

  const getStatusLabel = (status: SessionStatus) => {
    switch (status) {
      case 'scheduled':
        return 'Upcoming';
      case 'in_progress':
        return 'Active';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchSessions(true)}
            tintColor={PsychiColors.azure}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sessions</Text>
          <Text style={styles.headerSubtitle}>{stats.total} total</Text>
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'upcoming', label: 'Upcoming', count: stats.upcoming },
            { key: 'active', label: 'Active', count: stats.active },
            { key: 'completed', label: 'Completed', count: stats.completed },
            { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
              onPress={() => setFilter(f.key as SessionFilter)}
            >
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                {f.label}
              </Text>
              {f.count > 0 && (
                <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                  <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                    {f.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Session List */}
        {filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sessions found</Text>
          </View>
        ) : (
          filteredSessions.map((session) => (
            <View key={session.id} style={styles.sessionCard}>
              {/* Header Row */}
              <View style={styles.sessionHeader}>
                <View style={styles.typeIcon}>
                  {getSessionIcon(session.session_type)}
                </View>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionType}>
                    {session.session_type.charAt(0).toUpperCase() + session.session_type.slice(1)} Session
                  </Text>
                  <Text style={styles.sessionTime}>{formatDateTime(session.scheduled_at)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(session.status)}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(session.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
                    {getStatusLabel(session.status)}
                  </Text>
                </View>
              </View>

              {/* Participants */}
              <View style={styles.participants}>
                <View style={styles.participant}>
                  <Avatar
                    imageUrl={session.client_avatar}
                    name={session.client_name}
                    size={32}
                    colors={[PsychiColors.azure, PsychiColors.azure]}
                  />
                  <View>
                    <Text style={styles.participantLabel}>Client</Text>
                    <Text style={styles.participantName}>{session.client_name}</Text>
                  </View>
                </View>
                <View style={styles.participantDivider} />
                <View style={styles.participant}>
                  <Avatar
                    imageUrl={session.supporter_avatar}
                    name={session.supporter_name}
                    size={32}
                    colors={[PsychiColors.coral, PsychiColors.coral]}
                  />
                  <View>
                    <Text style={styles.participantLabel}>Supporter</Text>
                    <Text style={styles.participantName}>{session.supporter_name}</Text>
                  </View>
                </View>
              </View>

              {/* Duration */}
              <View style={styles.sessionFooter}>
                <Text style={styles.duration}>
                  {session.duration_minutes} min session
                </Text>
                {session.has_transcript && (
                  <Text style={styles.transcriptBadge}>Has Transcript</Text>
                )}
              </View>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.xs,
    gap: 6,
    ...Shadows.soft,
  },
  filterButtonActive: {
    backgroundColor: PsychiColors.deep,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  filterTextActive: {
    color: PsychiColors.white,
  },
  filterBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  filterBadgeTextActive: {
    color: PsychiColors.white,
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  sessionCard: {
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionType: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  sessionTime: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  participants: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  participant: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  participantDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: Spacing.sm,
  },
  participantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  participantLabel: {
    fontSize: 10,
    color: PsychiColors.textMuted,
  },
  participantName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  sessionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    marginTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  duration: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  transcriptBadge: {
    fontSize: 11,
    fontWeight: '500',
    color: PsychiColors.azure,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});
