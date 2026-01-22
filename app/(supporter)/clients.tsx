import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { UsersIcon, ProfileIcon, CalendarIcon, StarIcon, CloseIcon, ArrowLeftIcon, ChevronRightIcon, DotIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { getSupporterClients } from '@/lib/database';
import type { ClientAssignment, ClientAssignmentStatus } from '@/types/database';

export default function ClientsScreen() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | ClientAssignmentStatus>('all');
  const [selectedClient, setSelectedClient] = useState<ClientAssignment | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadClients();
    }
  }, [user?.id]);

  const loadClients = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const data = await getSupporterClients(user.id);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      client.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColors = (status: ClientAssignmentStatus) => {
    switch (status) {
      case 'active':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3b82f6' };
      case 'paused':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' };
      case 'ended':
        return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', text: '#6b7280' };
    }
  };

  // Stats
  const activeCount = clients.filter(c => c.status === 'active').length;
  const totalSessions = clients.reduce((sum, c) => sum + c.sessions_completed, 0);

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
          <LinearGradient
            colors={['#87CEEB', '#4A90E2', '#2E5C8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            <Text style={styles.headerTitle}>My Clients</Text>
            <Text style={styles.headerSubtitle}>
              View and manage your assigned clients
            </Text>
          </LinearGradient>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
              <UsersIcon size={18} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(74, 144, 226, 0.2)' }]}>
              <ProfileIcon size={18} color={PsychiColors.azure} />
            </View>
            <Text style={styles.statValue}>{clients.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <CalendarIcon size={18} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255, 184, 166, 0.2)' }]}>
              <StarIcon size={18} color="#FFB8A6" />
            </View>
            <Text style={styles.statValue}>
              {clients.length > 0 ? (totalSessions / clients.length).toFixed(1) : '0'}
            </Text>
            <Text style={styles.statLabel}>Avg</Text>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.filterSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or email..."
            placeholderTextColor={PsychiColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
            {(['all', 'active', 'paused', 'ended'] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterChip,
                  filterStatus === status && styles.filterChipActive,
                ]}
                onPress={() => setFilterStatus(status)}
              >
                {filterStatus === status ? (
                  <LinearGradient
                    colors={['#4A90E2', '#2E5C8A']}
                    style={styles.filterChipGradient}
                  >
                    <Text style={styles.filterChipTextActive}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.filterChipText}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Clients List */}
        <View style={styles.section}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PsychiColors.azure} />
              <Text style={styles.loadingText}>Loading clients...</Text>
            </View>
          ) : filteredClients.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <UsersIcon size={32} color={PsychiColors.azure} />
              </View>
              <Text style={styles.emptyTitle}>
                {clients.length === 0 ? 'No clients yet' : 'No matching clients'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {clients.length === 0
                  ? 'Clients will appear here once they book sessions with you'
                  : 'Try adjusting your search or filter criteria'}
              </Text>
            </View>
          ) : (
            filteredClients.map((client) => {
              const statusColors = getStatusColors(client.status);
              return (
                <TouchableOpacity
                  key={client.id}
                  style={styles.clientCard}
                  onPress={() => setSelectedClient(client)}
                  activeOpacity={0.8}
                >
                  {client.client_avatar ? (
                    <Image
                      source={{ uri: client.client_avatar }}
                      style={styles.clientAvatar}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#4A90E2', '#2E5C8A']}
                      style={styles.clientAvatarPlaceholder}
                    >
                      <Text style={styles.clientAvatarText}>
                        {client.client_name.charAt(0)}
                      </Text>
                    </LinearGradient>
                  )}
                  <View style={styles.clientInfo}>
                    <View style={styles.clientNameRow}>
                      <Text style={styles.clientName}>{client.client_name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
                        <Text style={[styles.statusText, { color: statusColors.text }]}>
                          {client.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.clientEmail} numberOfLines={1}>
                      {client.client_email}
                    </Text>
                    <View style={styles.clientStats}>
                      <Text style={styles.clientStatText}>
                        {client.sessions_completed} sessions
                      </Text>
                      <DotIcon size={4} color={PsychiColors.textMuted} />
                      <Text style={styles.clientStatText}>
                        Last: {formatDate(client.last_session_date)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Client Detail Modal */}
      <Modal
        visible={!!selectedClient}
        animationType="fade"
        transparent
        onRequestClose={() => setSelectedClient(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setSelectedClient(null)}
            >
              <CloseIcon size={16} color={PsychiColors.textMuted} />
            </TouchableOpacity>

            {selectedClient && (
              <>
                <View style={styles.modalHeader}>
                  {selectedClient.client_avatar ? (
                    <Image
                      source={{ uri: selectedClient.client_avatar }}
                      style={styles.modalAvatar}
                    />
                  ) : (
                    <LinearGradient
                      colors={['#4A90E2', '#2E5C8A']}
                      style={styles.modalAvatarPlaceholder}
                    >
                      <Text style={styles.modalAvatarText}>
                        {selectedClient.client_name.charAt(0)}
                      </Text>
                    </LinearGradient>
                  )}
                  <Text style={styles.modalName}>{selectedClient.client_name}</Text>
                  <Text style={styles.modalEmail}>{selectedClient.client_email}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColors(selectedClient.status).bg, marginTop: Spacing.sm }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColors(selectedClient.status).text }
                    ]}>
                      {selectedClient.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValue}>{selectedClient.sessions_completed}</Text>
                    <Text style={styles.modalStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.modalStatItem}>
                    <Text style={styles.modalStatValueSmall}>{formatDate(selectedClient.started_at)}</Text>
                    <Text style={styles.modalStatLabel}>Started</Text>
                  </View>
                </View>

                {selectedClient.notes && (
                  <View style={styles.modalNotes}>
                    <Text style={styles.modalNotesLabel}>Notes</Text>
                    <Text style={styles.modalNotesText}>{selectedClient.notes}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setSelectedClient(null)}
                >
                  <LinearGradient
                    colors={['#4A90E2', '#2E5C8A']}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  },
  backButton: {
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  headerBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.midnight,
  },
  statLabel: {
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  filterSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: 15,
    color: PsychiColors.midnight,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  filterRow: {
    marginTop: Spacing.md,
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  filterChipActive: {},
  filterChipGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  filterChipTextActive: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: PsychiColors.textMuted,
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
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
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
    color: PsychiColors.textMuted,
    textAlign: 'center',
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  clientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#B0E0E6',
  },
  clientAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  clientInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  clientEmail: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  clientStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  clientStatText: {
    fontSize: 12,
    color: PsychiColors.textSecondary,
  },
  clientStatDot: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginHorizontal: 6,
  },
  chevron: {
    fontSize: 24,
    color: PsychiColors.textMuted,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    ...Shadows.medium,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#B0E0E6',
    marginBottom: Spacing.md,
  },
  modalAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalAvatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  modalName: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.midnight,
  },
  modalEmail: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  modalStatsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalStatItem: {
    flex: 1,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A90E2',
  },
  modalStatValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
  },
  modalStatLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  modalNotes: {
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  modalNotesText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  modalButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
