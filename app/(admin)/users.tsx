import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

type UserType = 'all' | 'clients' | 'supporters' | 'pending';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'client' | 'supporter';
  status: 'active' | 'pending' | 'suspended';
  joinDate: string;
  sessions: number;
  w9Completed?: boolean;
}

export default function AdminUsersScreen() {
  const [userFilter, setUserFilter] = useState<UserType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Empty array - would be populated from database
  const users: User[] = [];

  const stats = {
    total: users.length,
    clients: users.filter(u => u.type === 'client').length,
    supporters: users.filter(u => u.type === 'supporter').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter =
      userFilter === 'all' ||
      (userFilter === 'clients' && user.type === 'client') ||
      (userFilter === 'supporters' && user.type === 'supporter') ||
      (userFilter === 'pending' && user.status === 'pending');

    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleUserAction = (user: User, action: string) => {
    Alert.alert(
      `${action} User`,
      `Are you sure you want to ${action.toLowerCase()} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: action, onPress: () => Alert.alert('Success', `User ${action.toLowerCase()}ed (Demo mode)`) },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return PsychiColors.success;
      case 'pending': return '#F59E0B';
      case 'suspended': return PsychiColors.error;
      default: return PsychiColors.textMuted;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
              onPress={() => setUserFilter(filter.key as UserType)}
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
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>{user.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      <View style={[styles.typeBadge, user.type === 'supporter' && styles.supporterBadge]}>
                        <Text style={[styles.typeBadgeText, user.type === 'supporter' && styles.supporterBadgeText]}>
                          {user.type}
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
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
                      <Text style={[styles.userStatValue, { color: getStatusColor(user.status) }]}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userStat}>
                    <Text style={styles.userStatLabel}>Joined</Text>
                    <Text style={styles.userStatValue}>{user.joinDate}</Text>
                  </View>
                  {user.type === 'supporter' ? (
                    <View style={styles.userStat}>
                      <Text style={styles.userStatLabel}>W-9</Text>
                      <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: user.w9Completed ? PsychiColors.success : '#F59E0B' }]} />
                        <Text style={[styles.userStatValue, { color: user.w9Completed ? PsychiColors.success : '#F59E0B' }]}>
                          {user.w9Completed ? 'Complete' : 'Pending'}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.userStat}>
                      <Text style={styles.userStatLabel}>Sessions</Text>
                      <Text style={styles.userStatValue}>{user.sessions}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.userActions}>
                  {user.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleUserAction(user, 'Approve')}
                    >
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('View Profile', `Viewing ${user.name}'s profile (Demo mode)`)}
                  >
                    <Text style={styles.actionButtonText}>View</Text>
                  </TouchableOpacity>
                  {user.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => handleUserAction(user, 'Suspend')}
                    >
                      <Text style={styles.suspendButtonText}>Suspend</Text>
                    </TouchableOpacity>
                  )}
                  {user.status === 'suspended' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.reactivateButton]}
                      onPress={() => handleUserAction(user, 'Reactivate')}
                    >
                      <Text style={styles.reactivateButtonText}>Reactivate</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  userActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  approveButton: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.success,
  },
  suspendButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  suspendButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.error,
  },
  reactivateButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  reactivateButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
});
