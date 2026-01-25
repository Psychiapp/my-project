import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChevronLeftIcon, HeartIcon, ChatIcon, PhoneIcon, VideoIcon } from '@/components/icons';
import { Config } from '@/constants/config';
import { getSupporterDetail, getSupporterAvailability } from '@/lib/database';

interface SupporterData {
  id: string;
  name: string;
  education: string;
  specialties: string[];
  sessions: number;
  bio: string;
  available: boolean;
  languages: string[];
  experience: string;
  approach: string;
  availability: string[];
  feedback: { author: string; text: string; date: string }[];
}

export default function SupporterProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isFavorite, setIsFavorite] = useState(false);
  const [supporter, setSupporter] = useState<SupporterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSupporter = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const detail = await getSupporterDetail(id);
        const availabilityData = await getSupporterAvailability(id);

        if (detail) {
          // Format availability from database format
          const availabilityStrings: string[] = [];
          if (availabilityData?.availability) {
            const avail = availabilityData.availability;
            Object.entries(avail).forEach(([day, hours]) => {
              if (Array.isArray(hours) && hours.length > 0) {
                availabilityStrings.push(`${day.charAt(0).toUpperCase() + day.slice(1)}`);
              }
            });
          }

          setSupporter({
            id: detail.id,
            name: detail.full_name,
            education: detail.education || '',
            specialties: detail.specialties || [],
            sessions: detail.total_sessions || 0,
            bio: detail.bio || 'This supporter has not added a bio yet.',
            available: detail.accepting_clients || false,
            languages: detail.languages || ['English'],
            experience: detail.years_experience ? `${detail.years_experience}+ years` : '',
            approach: detail.approach || '',
            availability: availabilityStrings.length > 0 ? availabilityStrings : ['Contact for availability'],
            feedback: [], // Would need a separate reviews/feedback table
          });
        }
      } catch (error) {
        console.error('Error fetching supporter:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupporter();
  }, [id]);

  const handleBook = (sessionType: 'chat' | 'phone' | 'video') => {
    if (!supporter) return;
    router.push({
      pathname: '/(client)/book',
      params: { supporterId: supporter.id, supporterName: supporter.name, sessionType },
    });
  };

  const handleToggleFavorite = () => {
    if (!supporter) return;
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      isFavorite
        ? `${supporter.name} has been removed from your favorites.`
        : `${supporter.name} has been added to your favorites.`
    );
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

  if (!supporter) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={PsychiColors.azure} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Supporter not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.errorButton}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={PsychiColors.azure} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
            <HeartIcon size={24} color={isFavorite ? PsychiColors.coral : PsychiColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{supporter.name.charAt(0)}</Text>
            </LinearGradient>
            {supporter.available && <View style={styles.onlineDot} />}
          </View>
          <Text style={styles.name}>{supporter.name}</Text>
          <Text style={styles.education}>{supporter.education}</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{supporter.sessions}</Text>
              <Text style={styles.statLabel}>Sessions</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{supporter.experience}</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
          </View>
        </View>

        {/* Availability Badge */}
        <View style={styles.availabilityBadgeContainer}>
          <View style={[styles.availabilityBadge, supporter.available && styles.availableBadge]}>
            <View style={[styles.availabilityDot, supporter.available && styles.availableDot]} />
            <Text style={[styles.availabilityText, supporter.available && styles.availableText]}>
              {supporter.available ? 'Available Now' : 'Currently Unavailable'}
            </Text>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesContainer}>
            {supporter.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <View style={styles.infoCard}>
            <Text style={styles.bioText}>{supporter.bio}</Text>
          </View>
        </View>

        {/* Approach - only show if supporter has added one */}
        {supporter.approach ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Approach</Text>
            <View style={styles.infoCard}>
              <Text style={styles.bioText}>{supporter.approach}</Text>
            </View>
          </View>
        ) : null}

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Languages</Text>
              <Text style={styles.detailValue}>{supporter.languages.join(', ')}</Text>
            </View>
            <View style={styles.detailDivider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Availability</Text>
              <Text style={styles.detailValue}>{supporter.availability.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* Feedback - only show if there are reviews */}
        {supporter.feedback.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Feedback</Text>
            {supporter.feedback.map((item, index) => (
              <View key={index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{item.author}</Text>
                </View>
                <Text style={styles.reviewText}>{item.text}</Text>
                <Text style={styles.reviewDate}>{item.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Book Session */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Book a Session</Text>
          <View style={styles.sessionOptions}>
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => handleBook('chat')}
              disabled={!supporter.available}
            >
              <ChatIcon size={28} color={PsychiColors.azure} />
              <Text style={styles.sessionType}>Chat</Text>
              <Text style={styles.sessionPrice}>{Config.pricing.chat.display}</Text>
              <Text style={styles.sessionDuration}>{Config.sessionDurations.chat} min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => handleBook('phone')}
              disabled={!supporter.available}
            >
              <PhoneIcon size={28} color={PsychiColors.azure} />
              <Text style={styles.sessionType}>Phone</Text>
              <Text style={styles.sessionPrice}>{Config.pricing.phone.display}</Text>
              <Text style={styles.sessionDuration}>{Config.sessionDurations.phone} min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => handleBook('video')}
              disabled={!supporter.available}
            >
              <VideoIcon size={28} color={PsychiColors.azure} />
              <Text style={styles.sessionType}>Video</Text>
              <Text style={styles.sessionPrice}>{Config.pricing.video.display}</Text>
              <Text style={styles.sessionDuration}>{Config.sessionDurations.video} min</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    fontSize: 18,
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.md,
  },
  errorButton: {
    backgroundColor: PsychiColors.azure,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorButtonText: {
    color: PsychiColors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: PsychiColors.textSecondary,
    marginTop: -4,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteIcon: {
    fontSize: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PsychiColors.success,
    borderWidth: 3,
    borderColor: PsychiColors.cream,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  education: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Shadows.soft,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A2A2A',
  },
  statLabel: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  availabilityBadgeContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  availableBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PsychiColors.textMuted,
    marginRight: Spacing.sm,
  },
  availableDot: {
    backgroundColor: PsychiColors.success,
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  availableText: {
    color: PsychiColors.success,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
    fontFamily: 'Georgia',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  specialtyTag: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  specialtyText: {
    fontSize: 14,
    color: PsychiColors.azure,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  bioText: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
    lineHeight: 22,
  },
  detailsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 1,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  reviewCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  reviewAuthor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  reviewText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  reviewDate: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  sessionOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sessionCard: {
    flex: 1,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  sessionIcon: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  sessionPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: PsychiColors.azure,
    marginTop: 4,
  },
  sessionDuration: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
});
