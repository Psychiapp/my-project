import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChatIcon, PhoneIcon, VideoIcon, ArrowLeftRightIcon } from '@/components/icons';

type SessionFilter = 'all' | 'active' | 'completed' | 'cancelled';
type SessionType = 'chat' | 'phone' | 'video';

interface Session {
  id: string;
  client: string;
  supporter: string;
  type: SessionType;
  status: 'active' | 'completed' | 'cancelled' | 'scheduled';
  date: string;
  duration: string;
  amount: number;
}

export default function AdminSessionsScreen() {
  const [filter, setFilter] = useState<SessionFilter>('all');

  // Empty array - would be populated from database
  const sessions: Session[] = [];

  const stats = {
    active: sessions.filter(s => s.status === 'active').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
    todayRevenue: sessions.filter(s => s.status === 'completed' && s.date.includes('Today')).reduce((sum, s) => sum + s.amount, 0),
  };

  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'active') return session.status === 'active';
    if (filter === 'completed') return session.status === 'completed';
    if (filter === 'cancelled') return session.status === 'cancelled';
    return true;
  });

  const typeIcons: Record<SessionType, React.FC<{ size?: number; color?: string }>> = {
    chat: ChatIcon,
    phone: PhoneIcon,
    video: VideoIcon,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return PsychiColors.success;
      case 'completed': return PsychiColors.azure;
      case 'cancelled': return PsychiColors.error;
      case 'scheduled': return '#F59E0B';
      default: return PsychiColors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Sessions</Text>
          <Text style={styles.headerSubtitle}>Monitor all platform sessions</Text>
        </View>

        {/* Live Stats */}
        <View style={styles.liveStatsContainer}>
          <View style={[styles.liveStatCard, styles.activeCard]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveStatValue}>{stats.active}</Text>
            <Text style={styles.liveStatLabel}>Active Now</Text>
          </View>
          <View style={styles.liveStatCard}>
            <Text style={styles.statValue}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          <View style={styles.liveStatCard}>
            <Text style={styles.statValue}>${(stats.todayRevenue / 100).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Revenue Today</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          {['all', 'active', 'completed', 'cancelled'].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f as SessionFilter)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sessions List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {filter === 'all' ? 'All Sessions' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Sessions`}
          </Text>

          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No sessions found</Text>
            </View>
          ) : (
            filteredSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTypeContainer}>
                    {(() => {
                      const IconComponent = typeIcons[session.type];
                      return <IconComponent size={20} color={PsychiColors.azure} />;
                    })()}
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(session.status)}20` }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(session.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(session.status) }]}>
                        {session.status}
                      </Text>
                    </View>
                  </View>
                  {session.status === 'active' && (
                    <View style={styles.liveIndicator}>
                      <View style={styles.liveIndicatorDot} />
                      <Text style={styles.liveIndicatorText}>LIVE</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sessionParticipants}>
                  <View style={styles.participant}>
                    <Text style={styles.participantRole}>Client</Text>
                    <Text style={styles.participantName}>{session.client}</Text>
                  </View>
                  <View style={styles.connectionArrow}>
                    <ArrowLeftRightIcon size={16} color={PsychiColors.textSoft} />
                  </View>
                  <View style={styles.participant}>
                    <Text style={styles.participantRole}>Supporter</Text>
                    <Text style={styles.participantName}>{session.supporter}</Text>
                  </View>
                </View>

                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>Time</Text>
                    <Text style={styles.detailValue}>{session.date}</Text>
                  </View>
                  <View style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{session.duration}</Text>
                  </View>
                  <View style={styles.sessionDetail}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={[styles.detailValue, session.amount > 0 && styles.amountValue]}>
                      {session.amount > 0 ? `$${(session.amount / 100).toFixed(2)}` : '-'}
                    </Text>
                  </View>
                </View>

                {session.status === 'active' && (
                  <TouchableOpacity style={styles.monitorButton}>
                    <Text style={styles.monitorButtonText}>Monitor Session</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  liveStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  liveStatCard: {
    flex: 1,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  activeCard: {
    backgroundColor: PsychiColors.deep,
  },
  liveDot: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PsychiColors.success,
  },
  liveStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  liveStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  statLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.white,
    alignItems: 'center',
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
  section: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
    fontFamily: 'Georgia',
  },
  emptyState: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyStateText: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  sessionCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sessionTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sessionTypeIcon: {
    marginRight: Spacing.xs,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
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
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  liveIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PsychiColors.error,
  },
  liveIndicatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: PsychiColors.error,
  },
  sessionParticipants: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: Spacing.sm,
  },
  participant: {
    flex: 1,
  },
  participantRole: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  connectionArrow: {
    marginHorizontal: Spacing.sm,
  },
  sessionDetails: {
    flexDirection: 'row',
  },
  sessionDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  amountValue: {
    color: PsychiColors.success,
    fontWeight: '600',
  },
  monitorButton: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(43, 58, 103, 0.1)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  monitorButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.deep,
  },
});
