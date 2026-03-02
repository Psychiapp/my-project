import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { getAllUsers } from '@/lib/database';
import type { AdminUserListing } from '@/types/database';

type UserFilter = 'all' | 'clients' | 'supporters' | 'pending';

export default function AdminUsersScreen() {
  const router = useRouter();
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AdminUserListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsers = async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await getAllUsers(userFilter);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [userFilter]);

  const stats = {
    total: users.length,
    clients: users.filter(u => u.role === 'client').length,
    supporters: users.filter(u => u.role === 'supporter').length,
    pending: users.filter(u => u.role === 'supporter' && !u.is_verified).length,
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      !searchQuery ||
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleViewUser = (user: AdminUserListing) => {
    if (user.role === 'supporter') {
      router.push(`/(admin)/supporter/${user.id}`);
    } else {
      // For clients, show a simple alert for now
      Alert.alert(
        user.full_name,
        `Email: ${user.email}\nRole: ${user.role}\nJoined: ${formatDate(user.created_at)}`
      );
    }
  };

  const getStatusColor = (user: AdminUserListing) => {
    if (user.role === 'supporter') {
      if (user.is_verified) return PsychiColors.success;
      return '#F59E0B'; // pending
    }
    return PsychiColors.success; // clients are always "active"
  };

  const getStatusText = (user: AdminUserListing) => {
    if (user.role === 'supporter') {
      if (user.is_verified) return 'Verified';
      return 'Pending';
    }
    return 'Active';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading users...</Text>
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
            onRefresh={() => fetchUsers(true)}
            tintColor={PsychiColors.azure}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>{stats.total} total users</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={PsychiColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View style={styles.filterContainer}>
          {[
            { key: 'all', label: 'All', count: stats.total },
            { key: 'clients', label: 'Clients', count: stats.clients },
            { key: 'supporters', label: 'Supporters', count: stats.supporters },
            { key: 'pending', label: 'Pending', count: stats.pending },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterButton, userFilter === filter.key && styles.filterButtonActive]}
              onPress={() => setUserFilter(filter.key as UserFilter)}
            >
              <Text style={[styles.filterText, userFilter === filter.key && styles.filterTextActive]}>
                {filter.label}
              </Text>
              <View style={[styles.filterBadge, userFilter === filter.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, userFilter === filter.key && styles.filterBadgeTextActive]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* User List */}
        <View style={styles.section}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'No users match your search' : 'No users found'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userCard}
                onPress={() => handleViewUser(user)}
                activeOpacity={0.7}
              >
                <View style={styles.userHeader}>
                  <View style={[
                    styles.userAvatar,
                    user.role === 'supporter' && styles.supporterAvatar
                  ]}>
                    <Text style={styles.userAvatarText}>
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.full_name || 'No Name'}</Text>
                      <View style={[styles.typeBadge, user.role === 'supporter' && styles.supporterBadge]}>
                        <Text style={[styles.typeBadgeText, user.role === 'supporter' && styles.supporterBadgeText]}>
                          {user.role}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>

                <View style={styles.userStats}>
                  <View style={styles.userStat}>
                    <Text style={styles.userStatLabel}>Status</Text>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(user) }]} />
                      <Text style={[styles.userStatValue, { color: getStatusColor(user) }]}>
                        {getStatusText(user)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userStat}>
                    <Text style={styles.userStatLabel}>Joined</Text>
                    <Text style={styles.userStatValue}>{formatDate(user.created_at)}</Text>
                  </View>
                  {user.role === 'supporter' ? (
                    <View style={styles.userStat}>
                      <Text style={styles.userStatLabel}>Training</Text>
                      <View style={styles.statusRow}>
                        <View style={[
                          styles.statusDot,
                          { backgroundColor: user.training_complete ? PsychiColors.success : '#F59E0B' }
                        ]} />
                        <Text style={[
                          styles.userStatValue,
                          { color: user.training_complete ? PsychiColors.success : '#F59E0B' }
                        ]}>
                          {user.training_complete ? 'Done' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.userStat}>
                      <Text style={styles.userStatLabel}>Sessions</Text>
                      <Text style={styles.userStatValue}>{user.total_sessions_completed || 0}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.viewPrompt}>
                  <Text style={styles.viewPromptText}>
                    {user.role === 'supporter' ? 'Tap to view details & verify' : 'Tap to view'}
                  </Text>
                </View>
              </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchInput: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    color: '#2A2A2A',
    ...Shadows.soft,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: 4,
    ...Shadows.soft,
  },
  filterButtonActive: {
    backgroundColor: PsychiColors.deep,
  },
  filterText: {
    fontSize: 12,
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
  section: {
    paddingHorizontal: Spacing.lg,
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
  userCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  supporterAvatar: {
    backgroundColor: PsychiColors.coral,
  },
  userAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  typeBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.azure,
    textTransform: 'capitalize',
  },
  supporterBadge: {
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
  },
  supporterBadgeText: {
    color: PsychiColors.coral,
  },
  userEmail: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  userStats: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: Spacing.sm,
  },
  userStat: {
    flex: 1,
  },
  userStatLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  userStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viewPrompt: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  viewPromptText: {
    fontSize: 13,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
});
