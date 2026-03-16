/**
 * Admin Dashboard - Users Tab
 * User management with Clients/Supporters sub-tabs
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychiColors, Shadows, Typography } from '@/constants/theme';
import { UserCircleIcon, CheckCircleIcon, ClockIcon, AlertIcon, ChevronRightIcon } from '@/components/icons';
import { getAllUsers, getPendingSupporters } from '@/lib/database';
import type { AdminUserListing, SupporterApplication } from '@/types/database';

type TabType = 'clients' | 'supporters' | 'pending';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('supporters');
  const [users, setUsers] = useState<AdminUserListing[]>([]);
  const [pendingSupporters, setPendingSupporters] = useState<SupporterApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      if (activeTab === 'pending') {
        const data = await getPendingSupporters();
        // Filter to only show pending verification
        const pending = data.filter(s => s.verification_status === 'pending_review');
        setPendingSupporters(pending);
      } else {
        const filter = activeTab === 'clients' ? 'clients' : 'supporters';
        const data = await getAllUsers(filter);
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLoading(true);
    loadUsers();
  }, [loadUsers, activeTab]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, [loadUsers]);

  const handleUserPress = (userId: string) => {
    if (activeTab === 'clients') {
      // Could navigate to client detail if needed
      return;
    }
    // Navigate to supporter detail view
    router.push(`/(admin)/supporter/${userId}`);
  };

  const handlePendingPress = (supporterId: string) => {
    router.push(`/(admin)/supporter/${supporterId}`);
  };

  const renderUserItem = ({ item }: { item: AdminUserListing }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
        ) : (
          <UserCircleIcon size={40} color={PsychiColors.textMuted} />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        {activeTab === 'supporters' && (
          <View style={styles.statusRow}>
            {item.is_verified ? (
              <View style={[styles.statusBadge, styles.verifiedBadge]}>
                <CheckCircleIcon size={12} color={PsychiColors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.pendingBadge]}>
                <ClockIcon size={12} color={PsychiColors.warning} />
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
            {item.total_sessions !== undefined && item.total_sessions > 0 && (
              <Text style={styles.sessionsText}>{item.total_sessions} sessions</Text>
            )}
          </View>
        )}
      </View>
      {activeTab === 'supporters' && (
        <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
      )}
    </TouchableOpacity>
  );

  const renderPendingItem = ({ item }: { item: SupporterApplication }) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handlePendingPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
        ) : (
          <UserCircleIcon size={40} color={PsychiColors.textMuted} />
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, styles.reviewBadge]}>
            <AlertIcon size={12} color={PsychiColors.coral} />
            <Text style={styles.reviewText}>Needs Review</Text>
          </View>
          {item.verification_submitted_at && (
            <Text style={styles.submittedText}>
              Submitted {new Date(item.verification_submitted_at).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <UserCircleIcon size={48} color={PsychiColors.textMuted} />
      <Text style={styles.emptyTitle}>
        {activeTab === 'pending' ? 'No pending applications' : `No ${activeTab} found`}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'pending'
          ? 'All supporter applications have been reviewed'
          : `${activeTab === 'clients' ? 'Clients' : 'Supporters'} will appear here`}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Sub-tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'supporters' && styles.activeTab]}
          onPress={() => setActiveTab('supporters')}
        >
          <Text style={[styles.tabText, activeTab === 'supporters' && styles.activeTabText]}>
            Supporters
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'clients' && styles.activeTab]}
          onPress={() => setActiveTab('clients')}
        >
          <Text style={[styles.tabText, activeTab === 'clients' && styles.activeTabText]}>
            Clients
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
          {pendingSupporters.length > 0 && activeTab !== 'pending' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingSupporters.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* User List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
        </View>
      ) : activeTab === 'pending' ? (
        <FlatList
          data={pendingSupporters}
          keyExtractor={(item) => item.id}
          renderItem={renderPendingItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: PsychiColors.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.divider,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: `${PsychiColors.royalBlue}15`,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.textMuted,
  },
  activeTabText: {
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.semibold,
  },
  badge: {
    backgroundColor: PsychiColors.coral,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: PsychiColors.white,
    fontSize: 11,
    fontWeight: Typography.fontWeight.semibold,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    ...Shadows.soft,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PsychiColors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedBadge: {
    backgroundColor: PsychiColors.successMuted,
  },
  verifiedText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.success,
    fontWeight: Typography.fontWeight.medium,
  },
  pendingBadge: {
    backgroundColor: PsychiColors.warningMuted,
  },
  pendingText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.warning,
    fontWeight: Typography.fontWeight.medium,
  },
  reviewBadge: {
    backgroundColor: `${PsychiColors.coral}15`,
  },
  reviewText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.coral,
    fontWeight: Typography.fontWeight.medium,
  },
  sessionsText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },
  submittedText: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
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
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
