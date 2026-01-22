import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { SearchIcon } from '@/components/icons';

// Mock supporter data
const mockSupporters = [
  {
    id: '1',
    name: 'Sarah Chen',
    education: 'Psychology, Stanford',
    specialties: ['Anxiety', 'Stress', 'Academic'],
    sessions: 127,
    bio: 'I specialize in helping students navigate academic stress and anxiety.',
    available: true,
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    education: 'Clinical Psych, UCLA',
    specialties: ['Depression', 'Life Transitions', 'Relationships'],
    sessions: 89,
    bio: 'Passionate about helping people through major life changes.',
    available: true,
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    education: 'Counseling, NYU',
    specialties: ['Self-Esteem', 'Career', 'Motivation'],
    sessions: 156,
    bio: 'I help clients build confidence and find their path forward.',
    available: false,
  },
  {
    id: '4',
    name: 'David Kim',
    education: 'Psychology, Berkeley',
    specialties: ['Anxiety', 'Social Skills', 'Identity'],
    sessions: 64,
    bio: 'Creating a safe space to explore who you are and who you want to be.',
    available: true,
  },
];

const specialtyFilters = ['All', 'Anxiety', 'Stress', 'Depression', 'Relationships', 'Academic'];

export default function BrowseSupportersScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filteredSupporters = mockSupporters.filter((supporter) => {
    const matchesSearch = supporter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supporter.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === 'All' || supporter.specialties.includes(selectedFilter);
    return matchesSearch && matchesFilter;
  });

  const renderSupporter = ({ item }: { item: typeof mockSupporters[0] }) => (
    <TouchableOpacity style={styles.supporterCard} activeOpacity={0.8}>
      <View style={styles.supporterHeader}>
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[PsychiColors.azure, PsychiColors.deep]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </LinearGradient>
          {item.available && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.supporterInfo}>
          <Text style={styles.supporterName}>{item.name}</Text>
          <Text style={styles.supporterEducation}>{item.education}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.sessionsText}>{item.sessions} sessions completed</Text>
          </View>
        </View>
      </View>

      <Text style={styles.supporterBio} numberOfLines={2}>{item.bio}</Text>

      <View style={styles.specialtiesContainer}>
        {item.specialties.map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        activeOpacity={0.8}
        onPress={() => router.push(`/(client)/supporter/${item.id}`)}
      >
        <LinearGradient
          colors={[PsychiColors.azure, PsychiColors.deep]}
          style={styles.bookButtonGradient}
        >
          <Text style={styles.bookButtonText}>View Profile</Text>
        </LinearGradient>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Support</Text>
        <Text style={styles.headerSubtitle}>Browse our trained peer supporters</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color={PsychiColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty..."
            placeholderTextColor={PsychiColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {specialtyFilters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === filter && styles.filterTextActive,
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Supporters List */}
      <FlatList
        data={filteredSupporters}
        renderItem={renderSupporter}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <SearchIcon size={48} color={PsychiColors.textMuted} />
            <Text style={styles.emptyTitle}>No supporters found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
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
    paddingBottom: Spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...Shadows.soft,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: '#2A2A2A',
  },
  filtersContainer: {
    maxHeight: 48,
    marginBottom: Spacing.sm,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.white,
    marginRight: Spacing.sm,
    ...Shadows.soft,
  },
  filterChipActive: {
    backgroundColor: PsychiColors.azure,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.textSecondary,
  },
  filterTextActive: {
    color: PsychiColors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing['2xl'],
  },
  supporterCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  supporterHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PsychiColors.success,
    borderWidth: 2,
    borderColor: PsychiColors.white,
  },
  supporterInfo: {
    flex: 1,
  },
  supporterName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  supporterEducation: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  sessionsText: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  supporterBio: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  specialtyTag: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  specialtyText: {
    fontSize: 12,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  bookButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
});
