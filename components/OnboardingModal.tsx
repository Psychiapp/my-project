/**
 * OnboardingModal - Exact match to web app OnboardingModal.tsx
 * 5-step matching quiz for client preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { CloseIcon, ChevronRightIcon, ChatIcon, PhoneIcon, VideoIcon, CheckIcon } from '@/components/icons';

const { width: screenWidth } = Dimensions.get('window');

// Types
interface UserPreferences {
  mood: number;
  topics: string[];
  communication_style: string;
  preferred_session_types: string[];
  scheduling_preference: string;
  preferred_times: string[];
  personality_preference: string;
  experience_level: string;
  goals: string[];
  urgency: string;
  timezone: string;
}

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: UserPreferences) => void;
}

// Data
const topics = [
  { id: 'anxiety', label: 'Anxiety' },
  { id: 'stress', label: 'Stress' },
  { id: 'depression', label: 'Depression' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'loneliness', label: 'Loneliness' },
  { id: 'work_career', label: 'Work/Career' },
  { id: 'academic', label: 'Academic Pressure' },
  { id: 'self_esteem', label: 'Self-Esteem' },
  { id: 'family', label: 'Family Issues' },
  { id: 'grief', label: 'Grief/Loss' },
  { id: 'transitions', label: 'Life Transitions' },
  { id: 'identity', label: 'Identity/LGBTQ+' },
];

const communicationStyles = [
  { id: 'direct', label: 'Direct & Practical', description: 'I prefer straightforward advice and actionable steps' },
  { id: 'empathetic', label: 'Empathetic & Supportive', description: 'I want to feel heard and validated first' },
  { id: 'balanced', label: 'Balanced Approach', description: 'A mix of emotional support and practical guidance' },
  { id: 'exploratory', label: 'Exploratory & Reflective', description: 'Help me understand myself through questions' },
];

const sessionTypes = [
  { id: 'chat', label: 'Chat Sessions', description: 'Text-based support at your own pace', icon: ChatIcon },
  { id: 'phone', label: 'Phone Calls', description: 'Real-time audio conversation', icon: PhoneIcon },
  { id: 'video', label: 'Video Chat', description: 'Face-to-face connection', icon: VideoIcon },
];

const timezones = [
  { id: 'America/New_York', label: 'Eastern Time (ET)' },
  { id: 'America/Chicago', label: 'Central Time (CT)' },
  { id: 'America/Denver', label: 'Mountain Time (MT)' },
  { id: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { id: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { id: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
];

const schedulingPreferences = [
  { id: 'flexible', label: 'Flexible', description: 'I can adapt to supporter availability' },
  { id: 'structured', label: 'Structured', description: 'I prefer consistent weekly sessions' },
  { id: 'as_needed', label: 'As Needed', description: 'I want support when issues arise' },
];

const preferredTimes = [
  { id: 'early_morning', label: 'Early Morning', description: '6-9 AM' },
  { id: 'morning', label: 'Morning', description: '9 AM-12 PM' },
  { id: 'afternoon', label: 'Afternoon', description: '12-5 PM' },
  { id: 'evening', label: 'Evening', description: '5-9 PM' },
  { id: 'night', label: 'Night', description: '9 PM-12 AM' },
  { id: 'weekends', label: 'Weekends Only', description: 'Sat & Sun' },
];

const personalities = [
  { id: 'warm', label: 'Warm & Nurturing', description: 'Gentle, caring, and comforting presence' },
  { id: 'motivating', label: 'Motivating & Energetic', description: 'Uplifting, encouraging, and action-oriented' },
  { id: 'calm', label: 'Calm & Grounded', description: 'Steady, peaceful, and reassuring' },
  { id: 'analytical', label: 'Analytical & Thoughtful', description: 'Logical, insightful, and methodical' },
];

const experienceLevels = [
  { id: 'no_preference', label: 'No Preference', description: 'Open to all experience levels' },
  { id: 'newer', label: 'Newer Supporters', description: 'Fresh perspectives, often more available' },
  { id: 'experienced', label: 'Experienced Supporters', description: 'More sessions completed, higher ratings' },
];

const goalOptions = [
  { id: 'relief', label: 'Immediate Relief', description: 'Help with current crisis or distress' },
  { id: 'coping', label: 'Build Coping Skills', description: 'Learn techniques to manage challenges' },
  { id: 'understanding', label: 'Self-Understanding', description: 'Explore patterns and gain insight' },
  { id: 'accountability', label: 'Accountability', description: 'Support in making positive changes' },
  { id: 'connection', label: 'Human Connection', description: 'Someone to talk to who understands' },
  { id: 'growth', label: 'Personal Growth', description: 'Become the best version of myself' },
];

const urgencyOptions = [
  { id: 'soon', label: 'Soon', description: 'Within the next few days', color: '#E4C4F0' },
  { id: 'moderate', label: 'Moderate', description: 'Within the next week or two', color: '#87CEEB' },
  { id: 'exploring', label: 'Just Exploring', description: 'Taking my time to find the right fit', color: '#B0E0E6' },
];

const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];

export default function OnboardingModal({
  visible,
  onClose,
  onComplete,
}: OnboardingModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [mood, setMood] = useState<number>(3);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [communicationStyle, setCommunicationStyle] = useState<string>('');
  const [selectedSessionTypes, setSelectedSessionTypes] = useState<string[]>([]);
  const [timezone, setTimezone] = useState<string>('America/New_York');
  const [schedulingPref, setSchedulingPref] = useState<string>('');
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [personalityPref, setPersonalityPref] = useState<string>('');
  const [experienceLevel, setExperienceLevel] = useState<string>('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [urgency, setUrgency] = useState<string>('');

  // Auto-detect timezone
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezones.find(t => t.id === tz)) {
      setTimezone(tz);
    }
  }, []);

  // Toggle selection helper
  const toggleSelection = (
    value: string,
    selected: string[],
    setSelected: (vals: string[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  // Can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 1: return selectedTopics.length > 0;
      case 2: return communicationStyle && selectedSessionTypes.length > 0;
      case 3: return schedulingPref && selectedTimes.length > 0 && timezone;
      case 4: return personalityPref && experienceLevel;
      case 5: return selectedGoals.length > 0 && urgency;
      default: return false;
    }
  };

  // Handle complete
  const handleComplete = async () => {
    setLoading(true);
    try {
      const preferences: UserPreferences = {
        mood,
        topics: selectedTopics,
        communication_style: communicationStyle,
        preferred_session_types: selectedSessionTypes,
        scheduling_preference: schedulingPref,
        preferred_times: selectedTimes,
        personality_preference: personalityPref,
        experience_level: experienceLevel,
        goals: selectedGoals,
        urgency,
        timezone,
      };
      await onComplete(preferences);
      onClose();
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Render progress bar
  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>Step {step} of 5</Text>
      <View style={styles.progressBar}>
        {[1, 2, 3, 4, 5].map((s) => (
          <View
            key={s}
            style={[
              styles.progressSegment,
              s <= step && styles.progressSegmentActive,
            ]}
          />
        ))}
      </View>
    </View>
  );

  // Render Step 1: Mood & Topics
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Mood Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How are you feeling today?</Text>
        <View style={styles.moodContainer}>
          {[1, 2, 3, 4, 5].map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.moodButton,
                mood === m && styles.moodButtonSelected,
              ]}
              onPress={() => setMood(m)}
              activeOpacity={0.7}
            >
              <Text style={styles.moodEmoji}>{moodEmojis[m - 1]}</Text>
              <Text style={styles.moodLabel}>
                {m === 1 ? 'Very Low' : m === 2 ? 'Low' : m === 3 ? 'Okay' : m === 4 ? 'Good' : 'Great'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Topics Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What would you like support with?</Text>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.topicsGrid}>
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicButton,
                selectedTopics.includes(topic.id) && styles.topicButtonSelected,
              ]}
              onPress={() => toggleSelection(topic.id, selectedTopics, setSelectedTopics)}
              activeOpacity={0.7}
            >
              {selectedTopics.includes(topic.id) && (
                <CheckIcon size={14} color={PsychiColors.royalBlue} />
              )}
              <Text style={[
                styles.topicText,
                selectedTopics.includes(topic.id) && styles.topicTextSelected,
              ]}>
                {topic.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Render Step 2: Communication Style & Session Types
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* Communication Style */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How do you prefer to communicate?</Text>
        {communicationStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.optionCard,
              communicationStyle === style.id && styles.optionCardSelected,
            ]}
            onPress={() => setCommunicationStyle(style.id)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {communicationStyle === style.id && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{style.label}</Text>
              <Text style={styles.optionDescription}>{style.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Session Types */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred session types</Text>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.sessionTypesRow}>
          {sessionTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.sessionTypeCard,
                  selectedSessionTypes.includes(type.id) && styles.sessionTypeCardSelected,
                ]}
                onPress={() => toggleSelection(type.id, selectedSessionTypes, setSelectedSessionTypes)}
                activeOpacity={0.7}
              >
                <IconComponent size={28} color={selectedSessionTypes.includes(type.id) ? PsychiColors.royalBlue : PsychiColors.textMuted} />
                <Text style={[
                  styles.sessionTypeLabel,
                  selectedSessionTypes.includes(type.id) && styles.sessionTypeLabelSelected,
                ]}>
                  {type.label}
                </Text>
                <Text style={styles.sessionTypeDescription}>{type.description}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  // Render Step 3: Scheduling & Timezone
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      {/* Timezone */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your timezone</Text>
        <View style={styles.timezoneGrid}>
          {timezones.map((tz) => (
            <TouchableOpacity
              key={tz.id}
              style={[
                styles.timezoneButton,
                timezone === tz.id && styles.timezoneButtonSelected,
              ]}
              onPress={() => setTimezone(tz.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timezoneText,
                timezone === tz.id && styles.timezoneTextSelected,
              ]}>
                {tz.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Scheduling Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scheduling preference</Text>
        <View style={styles.prefGrid}>
          {schedulingPreferences.map((pref) => (
            <TouchableOpacity
              key={pref.id}
              style={[
                styles.prefCard,
                schedulingPref === pref.id && styles.prefCardSelected,
              ]}
              onPress={() => setSchedulingPref(pref.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.prefLabel,
                schedulingPref === pref.id && styles.prefLabelSelected,
              ]}>
                {pref.label}
              </Text>
              <Text style={styles.prefDescription}>{pref.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preferred Times */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferred times</Text>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.timesGrid}>
          {preferredTimes.map((time) => (
            <TouchableOpacity
              key={time.id}
              style={[
                styles.timeButton,
                selectedTimes.includes(time.id) && styles.timeButtonSelected,
              ]}
              onPress={() => toggleSelection(time.id, selectedTimes, setSelectedTimes)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.timeLabel,
                selectedTimes.includes(time.id) && styles.timeLabelSelected,
              ]}>
                {time.label}
              </Text>
              <Text style={styles.timeDescription}>{time.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Render Step 4: Supporter Preferences
  const renderStep4 = () => (
    <View style={styles.stepContent}>
      {/* Personality Preference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supporter personality preference</Text>
        <View style={styles.personalityGrid}>
          {personalities.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.personalityCard,
                personalityPref === p.id && styles.personalityCardSelected,
              ]}
              onPress={() => setPersonalityPref(p.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.personalityLabel,
                personalityPref === p.id && styles.personalityLabelSelected,
              ]}>
                {p.label}
              </Text>
              <Text style={styles.personalityDescription}>{p.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Experience Level */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience level preference</Text>
        {experienceLevels.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.optionCard,
              experienceLevel === level.id && styles.optionCardSelected,
            ]}
            onPress={() => setExperienceLevel(level.id)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {experienceLevel === level.id && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionLabel}>{level.label}</Text>
              <Text style={styles.optionDescription}>{level.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render Step 5: Goals & Urgency
  const renderStep5 = () => (
    <View style={styles.stepContent}>
      {/* Goals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What are your goals?</Text>
        <Text style={styles.sectionSubtitle}>Select all that apply</Text>
        <View style={styles.goalsGrid}>
          {goalOptions.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selectedGoals.includes(goal.id) && styles.goalCardSelected,
              ]}
              onPress={() => toggleSelection(goal.id, selectedGoals, setSelectedGoals)}
              activeOpacity={0.7}
            >
              {selectedGoals.includes(goal.id) && (
                <View style={styles.goalCheck}>
                  <CheckIcon size={12} color={PsychiColors.white} />
                </View>
              )}
              <Text style={[
                styles.goalLabel,
                selectedGoals.includes(goal.id) && styles.goalLabelSelected,
              ]}>
                {goal.label}
              </Text>
              <Text style={styles.goalDescription}>{goal.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How soon do you need support?</Text>
        {urgencyOptions.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[
              styles.urgencyCard,
              { borderColor: opt.color, backgroundColor: urgency === opt.id ? `${opt.color}33` : 'rgba(255,255,255,0.6)' },
              urgency === opt.id && { borderWidth: 2 },
            ]}
            onPress={() => setUrgency(opt.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.urgencyLabel}>{opt.label}</Text>
            <Text style={styles.urgencyDescription}>{opt.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render content based on step
  const renderContent = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  // Render navigation buttons
  const renderNavigation = () => (
    <View style={styles.navigation}>
      {step > 1 && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep(step - 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      )}

      {step < 5 ? (
        <TouchableOpacity
          style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
          onPress={() => canProceed() && setStep(step + 1)}
          disabled={!canProceed()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Gradients.primaryButton}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <ChevronRightIcon size={20} color={PsychiColors.white} />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.nextButton, (!canProceed() || loading) && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={!canProceed() || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={Gradients.primaryButton}
            style={styles.nextButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color={PsychiColors.white} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Find My Matches</Text>
                <ChevronRightIcon size={20} color={PsychiColors.white} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <CloseIcon size={20} color={PsychiColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Matching Quiz</Text>
            <Text style={styles.headerSubtitle}>Help us find your perfect supporter</Text>
          </View>
        </View>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>

        {/* Navigation */}
        {renderNavigation()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: PsychiColors.white,
  },
  progressText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(232, 160, 144, 0.2)',
  },
  progressSegmentActive: {
    backgroundColor: PsychiColors.royalBlue,
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },

  // Step content
  stepContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Section
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },

  // Mood
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  moodButton: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    width: (screenWidth - Spacing.lg * 2 - Spacing.sm * 4) / 5,
  },
  moodButtonSelected: {
    borderColor: PsychiColors.royalBlue,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  moodLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: PsychiColors.textMuted,
    textAlign: 'center',
  },

  // Topics
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  topicButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    gap: Spacing.xs,
  },
  topicButtonSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  topicText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  topicTextSelected: {
    color: PsychiColors.royalBlue,
    fontWeight: '500',
  },

  // Option cards (radio)
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: PsychiColors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PsychiColors.royalBlue,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  optionDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },

  // Session types
  sessionTypesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sessionTypeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  sessionTypeCardSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  sessionTypeLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  sessionTypeLabelSelected: {
    color: PsychiColors.royalBlue,
  },
  sessionTypeDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Timezone
  timezoneGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timezoneButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
  },
  timezoneButtonSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  timezoneText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.textSecondary,
  },
  timezoneTextSelected: {
    color: PsychiColors.royalBlue,
    fontWeight: '600',
  },

  // Scheduling preferences
  prefGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  prefCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  prefCardSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  prefLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
    textAlign: 'center',
  },
  prefLabelSelected: {
    color: PsychiColors.royalBlue,
  },
  prefDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 11,
    color: PsychiColors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Preferred times
  timesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeButton: {
    width: (screenWidth - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  timeButtonSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  timeLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  timeLabelSelected: {
    color: PsychiColors.royalBlue,
  },
  timeDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },

  // Personality
  personalityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  personalityCard: {
    width: (screenWidth - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
  },
  personalityCardSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  personalityLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  personalityLabelSelected: {
    color: PsychiColors.royalBlue,
  },
  personalityDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },

  // Goals
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goalCard: {
    width: (screenWidth - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    position: 'relative',
  },
  goalCardSelected: {
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderColor: PsychiColors.royalBlue,
  },
  goalCheck: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PsychiColors.royalBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  goalLabelSelected: {
    color: PsychiColors.royalBlue,
  },
  goalDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },

  // Urgency
  urgencyCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  urgencyLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  urgencyDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: PsychiColors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.5)',
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
  },
  backButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.royalBlue,
  },
  nextButton: {
    flex: 2,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  nextButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
