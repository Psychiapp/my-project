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
import { CheckIcon, CloseIcon, TrashIcon, DocumentIcon } from '@/components/icons';
import { getAllUsers, approveSupporter, deleteUser } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';
import {
  sendVerificationApprovedNotification,
  sendVerificationRejectedNotification,
} from '@/lib/notifications';
import type { AdminUserListing } from '@/types/database';

type UserFilter = 'all' | 'clients' | 'supporters' | 'pending';

export default function AdminUsers() {
  const router = useRouter();
  const { isDemoMode } = useAuth();
  const [filter, setFilter] = useState<UserFilter>('all');
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
      if (isDemoMode) {
        // Demo data
        setUsers([
          {
            id: 'demo-client-1',
            email: 'john.doe@example.com',
            full_name: 'John Doe',
            role: 'client',
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            is_verified: true,
            training_complete: false,
            total_sessions_completed: 12,
          },
          {
            id: 'demo-client-2',
            email: 'jane.smith@example.com',
            full_name: 'Jane Smith',
            role: 'client',
            created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            is_verified: true,
            training_complete: false,
            total_sessions_completed: 5,
          },
          {
            id: 'demo-supporter-1',
            email: 'sarah.therapist@example.com',
            full_name: 'Sarah Thompson',
            role: 'supporter',
            created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            is_verified: true,
            training_complete: true,
            total_sessions_completed: 45,
          },
          {
            id: 'demo-supporter-2',
            email: 'mike.counselor@example.com',
            full_name: 'Michael Chen',
            role: 'supporter',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            is_verified: false,
            training_complete: true,
            total_sessions_completed: 0,
          },
        ]);
      } else {
        const data = await getAllUsers(filter);
        setUsers(data);
      }
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
  }, [filter, isDemoMode]);

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.full_name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: users.length,
    clients: users.filter(u => u.role === 'client').length,
    supporters: users.filter(u => u.role === 'supporter').length,
    pending: users.filter(u => u.role === 'supporter' && !u.is_verified).length,
  };

  const handleViewSupporter = (user: AdminUserListing) => {
    router.push(`/(admin)/supporter/${user.id}` as any);
  };

  const handleApprove = async (user: AdminUserListing) => {
    if (isDemoMode) {
      Alert.alert('Demo Mode', 'Cannot approve users in demo mode');
      return;
    }

    Alert.alert(
      'Approve Supporter',
      `Approve ${user.full_name} as a verified supporter?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            const success = await approveSupporter(user.id);
            if (success) {
              await sendVerificationApprovedNotification(user.id);
              Alert.alert('Success', `${user.full_name} has been approved`);
              fetchUsers();
            } else {
              Alert.alert('Error', 'Failed to approve supporter');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (user: AdminUserListing) => {
    if (isDemoMode) {
      Alert.alert('Demo Mode', 'Cannot reject users in demo mode');
      return;
    }

    Alert.alert(
      'Reject Application',
      `Reject ${user.full_name}'s supporter application? They will be notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            await sendVerificationRejectedNotification(user.id, 'Application did not meet requirements');
            Alert.alert('Rejected', `${user.full_name}'s application has been rejected`);
            fetchUsers();
          },
        },
      ]
    );
  };

  const handleDelete = async (user: AdminUserListing) => {
    if (isDemoMode) {
      Alert.alert('Demo Mode', 'Cannot delete users in demo mode');
      return;
    }

    Alert.alert(
      'Delete Account',
      `Permanently delete ${user.full_name}'s account? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteUser(user.id);
            if (success) {
              Alert.alert('Deleted', `${user.full_name}'s account has been deleted`);
              fetchUsers();
            } else {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
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
            onRefresh={() => fetchUsers(true)}
            tintColor={PsychiColors.azure}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Users</Text>
          <Text style={styles.headerSubtitle}>{stats.total} total</Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
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
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterButton, filter === f.key && styles.filterButtonActive]}
              onPress={() => setFilter(f.key as UserFilter)}
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
        </View>

        {/* User List */}
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users match your search' : 'No users found'}
            </Text>
          </View>
        ) : (
          filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              {/* User Header */}
              <View style={styles.userHeader}>
                <View style={[styles.avatar, user.role === 'supporter' && styles.avatarSupporter]}>
                  <Text style={styles.avatarText}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.full_name}</Text>
                    <View style={[styles.roleBadge, user.role === 'supporter' && styles.roleBadgeSupporter]}>
                      <Text style={[styles.roleBadgeText, user.role === 'supporter' && styles.roleBadgeTextSupporter]}>
                        {user.role}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userEmail}>{user.email}</Text>
                </View>
              </View>

              {/* User Stats */}
              <View style={styles.userStats}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Joined</Text>
                  <Text style={styles.statValue}>{formatDate(user.created_at)}</Text>
                </View>
                {user.role === 'supporter' ? (
                  <>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Status</Text>
                      <Text style={[styles.statValue, { color: user.is_verified ? PsychiColors.success : '#F59E0B' }]}>
                        {user.is_verified ? 'Verified' : 'Pending'}
                      </Text>
                    </View>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>Training</Text>
                      <Text style={[styles.statValue, { color: user.training_complete ? PsychiColors.success : '#F59E0B' }]}>
                        {user.training_complete ? 'Complete' : 'Incomplete'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Sessions</Text>
                    <Text style={styles.statValue}>{user.total_sessions_completed || 0}</Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                {user.role === 'supporter' && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleViewSupporter(user)}
                  >
                    <DocumentIcon size={16} color={PsychiColors.azure} />
                    <Text style={styles.actionButtonText}>View Docs</Text>
                  </TouchableOpacity>
                )}

                {user.role === 'supporter' && !user.is_verified && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonApprove]}
                      onPress={() => handleApprove(user)}
                    >
                      <CheckIcon size={16} color={PsychiColors.success} />
                      <Text style={[styles.actionButtonText, { color: PsychiColors.success }]}>Approve</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonReject]}
                      onPress={() => handleReject(user)}
                    >
                      <CloseIcon size={16} color={PsychiColors.error} />
                      <Text style={[styles.actionButtonText, { color: PsychiColors.error }]}>Reject</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  style={[styles.actionButton, styles.actionButtonDelete]}
                  onPress={() => handleDelete(user)}
                >
                  <TrashIcon size={16} color={PsychiColors.error} />
                </TouchableOpacity>
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
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
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
    marginBottom: Spacing.md,
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
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterBadgeText: {
    fontSize: 10,
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
  userCard: {
    backgroundColor: PsychiColors.white,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarSupporter: {
    backgroundColor: PsychiColors.coral,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  userEmail: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  roleBadgeSupporter: {
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: PsychiColors.azure,
    textTransform: 'capitalize',
  },
  roleBadgeTextSupporter: {
    color: PsychiColors.coral,
  },
  userStats: {
    flexDirection: 'row',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: Spacing.md,
  },
  stat: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2A2A',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    gap: 4,
  },
  actionButtonApprove: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  actionButtonReject: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionButtonDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    marginLeft: 'auto',
    paddingHorizontal: Spacing.sm,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.azure,
  },
});
