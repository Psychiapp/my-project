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
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  PsychiColors,
  Spacing,
  BorderRadius,
  Shadows,
  Typography,
} from '@/constants/theme';
import {
  ChevronLeftIcon,
  GlobeIcon,
  UsersIcon,
  ChatIcon,
  PhoneIcon,
  VideoIcon,
  RefreshIcon,
  CheckIcon,
  ChevronRightIcon,
} from '@/components/icons';
import OnboardingModal from '@/components/OnboardingModal';

// Timezone options
const timezones = [
  { id: 'America/New_York', label: 'Eastern Time (ET)' },
  { id: 'America/Chicago', label: 'Central Time (CT)' },
  { id: 'America/Denver', label: 'Mountain Time (MT)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { id: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { id: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

// Session type options
const sessionTypes = [
  { id: 'chat', label: 'Chat', icon: ChatIcon, description: 'Text-based support' },
  { id: 'phone', label: 'Phone', icon: PhoneIcon, description: 'Voice calls' },
  { id: 'video', label: 'Video', icon: VideoIcon, description: 'Face-to-face' },
];

export default function PreferencesScreen() {
  const { profile } = useAuth();
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>(['chat', 'phone', 'video']);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-detect timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const matchingTz = timezones.find(t => t.id === tz);
    if (matchingTz) {
      setSelectedTimezone(tz);
    }
  }, []);

  const toggleSessionType = (typeId: string) => {
    setSelectedSessionTypes(prev => {
      if (prev.includes(typeId)) {
        // Don't allow deselecting all types
        if (prev.length === 1) {
          Alert.alert('Required', 'You must have at least one session type selected.');
          return prev;
        }
        return prev.filter(t => t !== typeId);
      }
      return [...prev, typeId];
    });
  };

  const handleTimezoneChange = async (tzId: string) => {
    setSelectedTimezone(tzId);
    // In production, save to database
  };

  const handleRequestNewSupporter = () => {
    Alert.alert(
      'Request New Supporter',
      'Would you like to be matched with a different supporter? Your current supporter will be notified, and we\'ll find you a new match based on your preferences.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request New Match',
          onPress: () => {
            // In production, trigger re-matching process
            Alert.alert(
              'Request Sent',
              'We\'ve received your request. You\'ll be notified when your new supporter match is ready.',
              [{ text: 'OK' }]
            );
          },
        },
      ]
    );
  };

  const handleRetakeQuiz = () => {
    Alert.alert(
      'Retake Matching Quiz',
      'Taking the quiz again will update your preferences and may result in a new supporter match. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => setShowQuizModal(true),
        },
      ]
    );
  };

  const handleQuizComplete = async (preferences: {
    mood: number;
    topics: string[];
    communication_style: string;
    preferred_session_types: string[];
    scheduling_preference: string;
    preferred_times: string[];
    personality_preference: string;
    goals: string[];
    urgency: string;
    timezone: string;
  }) => {
    setIsSaving(true);
    try {
      // In production, save preferences to database
      console.log('New preferences:', preferences);
      setShowQuizModal(false);
      Alert.alert(
        'Preferences Updated',
        'Your preferences have been saved. We\'ll use these to improve your supporter match.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeftIcon size={24} color={PsychiColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Timezone Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: `${PsychiColors.royalBlue}12` }]}>
              <GlobeIcon size={20} color={PsychiColors.royalBlue} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Timezone</Text>
              <Text style={styles.sectionSubtitle}>For scheduling sessions</Text>
            </View>
          </View>
          <View style={styles.timezoneGrid}>
            {timezones.map((tz) => (
              <TouchableOpacity
                key={tz.id}
                style={[
                  styles.timezoneButton,
                  selectedTimezone === tz.id && styles.timezoneButtonSelected,
                ]}
                onPress={() => handleTimezoneChange(tz.id)}
                activeOpacity={0.7}
              >
                {selectedTimezone === tz.id && (
                  <CheckIcon size={14} color={PsychiColors.royalBlue} />
                )}
                <Text style={[
                  styles.timezoneText,
                  selectedTimezone === tz.id && styles.timezoneTextSelected,
                ]}>
                  {tz.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Session Types Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: `${PsychiColors.violet}12` }]}>
              <VideoIcon size={20} color={PsychiColors.violet} />
            </View>
            <View style={styles.sectionInfo}>
              <Text style={styles.sectionTitle}>Preferred Session Types</Text>
              <Text style={styles.sectionSubtitle}>Select all that work for you</Text>
            </View>
          </View>
          <View style={styles.sessionTypesRow}>
            {sessionTypes.map((type) => {
              const IconComponent = type.icon;
              const isSelected = selectedSessionTypes.includes(type.id);
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.sessionTypeCard,
                    isSelected && styles.sessionTypeCardSelected,
                  ]}
                  onPress={() => toggleSessionType(type.id)}
                  activeOpacity={0.7}
                >
                  {isSelected && (
                    <View style={styles.sessionTypeCheck}>
                      <CheckIcon size={12} color={PsychiColors.white} />
                    </View>
                  )}
                  <IconComponent
                    size={28}
                    color={isSelected ? PsychiColors.royalBlue : PsychiColors.textMuted}
                  />
                  <Text style={[
                    styles.sessionTypeLabel,
                    isSelected && styles.sessionTypeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={styles.sessionTypeDescription}>{type.description}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Change Supporter Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleRequestNewSupporter}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${PsychiColors.coral}12` }]}>
              <UsersIcon size={20} color={PsychiColors.coral} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Change Supporter</Text>
              <Text style={styles.actionSubtitle}>
                Request a new supporter match
              </Text>
            </View>
            <ChevronRightIcon size={20} color={PsychiColors.textSoft} />
          </TouchableOpacity>
        </View>

        {/* Retake Quiz Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={handleRetakeQuiz}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: `${PsychiColors.success}12` }]}>
              <RefreshIcon size={20} color={PsychiColors.success} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Retake Matching Quiz</Text>
              <Text style={styles.actionSubtitle}>
                Update your preferences and get better matches
              </Text>
            </View>
            <ChevronRightIcon size={20} color={PsychiColors.textSoft} />
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Text style={styles.infoNoteText}>
            Changes to your preferences help us provide better supporter matches tailored to your needs.
          </Text>
        </View>
      </ScrollView>

      {/* Onboarding/Quiz Modal */}
      <OnboardingModal
        visible={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onComplete={handleQuizComplete}
      />

      {/* Loading overlay */}
      {isSaving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    backgroundColor: PsychiColors.cream,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.borderUltraLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cloud,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing['5'],
  },
  section: {
    paddingHorizontal: Spacing['5'],
    marginBottom: Spacing['6'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing['4'],
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing['3'],
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: Spacing['0.5'],
  },
  timezoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing['2'],
  },
  timezoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['3'],
    paddingVertical: Spacing['2.5'],
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cloud,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
    gap: Spacing['1.5'],
  },
  timezoneButtonSelected: {
    backgroundColor: `${PsychiColors.royalBlue}10`,
    borderColor: PsychiColors.royalBlue,
  },
  timezoneText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
  },
  timezoneTextSelected: {
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
  },
  sessionTypesRow: {
    flexDirection: 'row',
    gap: Spacing['3'],
  },
  sessionTypeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: PsychiColors.cloud,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    position: 'relative',
    ...Shadows.sm,
  },
  sessionTypeCardSelected: {
    backgroundColor: `${PsychiColors.royalBlue}08`,
    borderColor: PsychiColors.royalBlue,
  },
  sessionTypeCheck: {
    position: 'absolute',
    top: Spacing['2'],
    right: Spacing['2'],
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PsychiColors.royalBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionTypeLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textSecondary,
    marginTop: Spacing['2'],
  },
  sessionTypeLabelSelected: {
    color: PsychiColors.royalBlue,
  },
  sessionTypeDescription: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: Spacing['1'],
    textAlign: 'center',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    padding: Spacing['4'],
    ...Shadows.soft,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing['4'],
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: Spacing['0.5'],
  },
  infoNote: {
    paddingHorizontal: Spacing['5'],
    marginTop: Spacing['2'],
  },
  infoNoteText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSoft,
    textAlign: 'center',
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
