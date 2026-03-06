import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { CameraIcon, CheckIcon, ChevronRightIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadAvatar, saveSupporterSchedule, checkClientProfileCompletion, checkSupporterProfileCompletion } from '@/lib/database';
import { logDiagnostic, sendDiagnosticReport, captureErrorWithDiagnostics } from '@/lib/diagnosticLogger';

// Key to track when profile setup was just completed (prevents redirect loop)
export const PROFILE_SETUP_COMPLETED_KEY = '@psychi_profile_setup_completed';

const FOCUS_AREAS = [
  'Stress & Worry',
  'Low Mood',
  'Everyday Stress',
  'Relationships',
  'Loss & Grief',
  'Difficult Experiences',
  'Self-Confidence',
  'Life Transitions',
  'Work/Career',
  'Family Dynamics',
  'Habit Change',
  'LGBTQ+',
];

const AVAILABILITY_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { role, missing } = useLocalSearchParams<{ role: string; missing: string }>();
  const { user, refreshProfile } = useAuth();

  const isSupporter = role === 'supporter';
  const missingFields = missing ? missing.split(',') : [];

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Determine which fields are missing
  // If "Profile not found", show all required fields as a fallback
  const profileNotFound = missingFields.includes('Profile not found');
  const needsFirstName = profileNotFound || missingFields.includes('First Name');
  const needsLastName = profileNotFound || missingFields.includes('Last Name');
  const needsEmail = profileNotFound || missingFields.includes('Email');
  const needsBio = isSupporter && (profileNotFound || missingFields.includes('Bio'));
  // Profile photo is optional during initial setup - can be added later from profile settings
  const needsPhoto = isSupporter && missingFields.includes('Profile Photo');
  const needsSpecialties = isSupporter && (profileNotFound || missingFields.includes('Specialties'));
  const needsAvailability = isSupporter && (profileNotFound || missingFields.includes('Availability'));

  // Load existing profile data to pre-fill form
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user?.id) {
        setIsLoadingData(false);
        return;
      }

      try {
        // Pre-fill email from auth user
        if (user.email) {
          setEmail(user.email);
        }

        // Fetch existing profile data
        if (isSupporter) {
          const completion = await checkSupporterProfileCompletion(user.id);
          if (completion.firstName) setFirstName(completion.firstName);
          if (completion.lastName) setLastName(completion.lastName);
          if (completion.email) setEmail(completion.email);
          if (completion.bio) setBio(completion.bio);
          if (completion.avatarUrl) setAvatarUri(completion.avatarUrl);
          if (completion.specialties && completion.specialties.length > 0) {
            setSelectedSpecialties(completion.specialties);
          }
        } else {
          const completion = await checkClientProfileCompletion(user.id);
          if (completion.firstName) setFirstName(completion.firstName);
          if (completion.lastName) setLastName(completion.lastName);
          if (completion.email) setEmail(completion.email);
        }
      } catch (error) {
        console.error('Error loading existing profile data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [user?.id, isSupporter]);

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    Alert.alert(
      'Profile Photo',
      'Choose a photo',
      [
        { text: 'Take Photo', onPress: handleTakePhoto },
        { text: 'Choose from Library', onPress: handlePickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await processSelectedImage(result.assets[0].uri);
    }
  };

  const processSelectedImage = async (uri: string) => {
    if (!user?.id) return;

    setIsUploadingPhoto(true);
    setAvatarUri(uri);

    try {
      const uploadedUrl = await uploadAvatar(user.id, uri);
      if (uploadedUrl) {
        setAvatarUri(uploadedUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Error', 'Failed to upload photo.');
      setAvatarUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : prev.length < 6
        ? [...prev, specialty]
        : prev
    );
  };

  const toggleDay = (day: string) => {
    setAvailableDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const validateEmail = (emailToValidate: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToValidate);
  };

  const validateForm = (): boolean => {
    if (needsFirstName && !firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name.');
      return false;
    }
    if (needsLastName && !lastName.trim()) {
      Alert.alert('Required', 'Please enter your last name.');
      return false;
    }
    if (needsEmail && !email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return false;
    }
    if (needsEmail && !validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (isSupporter) {
      if (needsBio && (!bio.trim() || bio.length < 50)) {
        Alert.alert('Required', 'Please write a bio of at least 50 characters.');
        return false;
      }
      // Profile photo is optional - can be added later
      if (needsSpecialties && selectedSpecialties.length === 0) {
        Alert.alert('Required', 'Please select at least one specialty.');
        return false;
      }
      if (needsAvailability && availableDays.length === 0) {
        Alert.alert('Required', 'Please select at least one available day.');
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!user?.id) {
      Alert.alert('Error', 'Not logged in.');
      return;
    }

    setIsSaving(true);

    try {
      if (supabase) {
        // Capture supabase in a local const so TypeScript knows it's non-null in the helper
        const db = supabase;

        // Log profile save attempt
        logDiagnostic('PROFILE_SAVE', 'Starting profile save', { userId: user.id, email: user.email });

        // Ensure session is valid before attempting database operations
        // This handles edge cases where session might not be fully established after signup
        const { data: sessionData, error: sessionError } = await db.auth.getSession();
        if (!sessionData?.session) {
          // Try to refresh the session
          logDiagnostic('PROFILE_SAVE', 'No session found, attempting refresh');
          const { error: refreshError } = await db.auth.refreshSession();
          if (refreshError) {
            logDiagnostic('PROFILE_SAVE', 'Session refresh failed', { error: refreshError.message });
            // If we can't get a session, the user needs to sign in again
            Alert.alert(
              'Session Expired',
              'Your session has expired. Please sign in again.',
              [{ text: 'OK', onPress: () => router.replace('/(auth)/sign-in') }]
            );
            return;
          }
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const now = new Date().toISOString();
        const userRole = role || (isSupporter ? 'supporter' : 'client');

        // Log the exact payload - include avatar_url if we have one
        const insertPayload: Record<string, unknown> = {
          id: user.id,
          full_name: fullName || null,
          email: email.trim().toLowerCase(),
          role: userRole,
          created_at: now,
          updated_at: now,
        };

        const updatePayload: Record<string, unknown> = {
          full_name: fullName || null,
          email: email.trim().toLowerCase(),
          updated_at: now,
        };

        // Include avatar_url if photo was uploaded (avatarUri will be the public URL after upload)
        if (avatarUri && avatarUri.startsWith('http')) {
          insertPayload.avatar_url = avatarUri;
          updatePayload.avatar_url = avatarUri;
        }

        logDiagnostic('PROFILE_SAVE', 'Prepared payloads', {
          insertPayload,
          updatePayload,
        });

        // First check if profile exists
        logDiagnostic('PROFILE_SAVE', 'Step 1: Checking if profile exists');
        const { data: existingProfile, error: checkError } = await db
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();

        logDiagnostic('PROFILE_SAVE', 'Profile check result', {
          existingProfile,
          checkError: checkError ? {
            message: checkError.message,
            code: checkError.code,
            details: checkError.details,
            hint: checkError.hint,
          } : null,
        });

        let saveResult;
        let saveError;
        let operationType: string;

        if (existingProfile) {
          operationType = 'UPDATE';
          logDiagnostic('PROFILE_SAVE', 'Step 2: Profile exists, attempting UPDATE');
          const result = await db
            .from('profiles')
            .update(updatePayload)
            .eq('id', user.id)
            .select();
          saveResult = result.data;
          saveError = result.error;
        } else {
          operationType = 'INSERT';
          logDiagnostic('PROFILE_SAVE', 'Step 2: Profile does not exist, attempting INSERT');
          const result = await db
            .from('profiles')
            .insert(insertPayload)
            .select();
          saveResult = result.data;
          saveError = result.error;
        }

        // Log result
        logDiagnostic('PROFILE_SAVE', 'Save attempt completed', {
          operationType,
          hasResult: !!saveResult,
          resultCount: saveResult?.length || 0,
          error: saveError ? saveError.message : null,
        });

        if (saveError) {
          logDiagnostic('PROFILE_SAVE', 'Save failed with error', {
            message: saveError.message,
            code: saveError.code,
            details: saveError.details,
            hint: saveError.hint,
            operationType,
          });

          if (saveError.message?.includes('row-level security')) {
            throw new Error('RLS_ERROR: ' + saveError.message);
          }
          throw new Error('DB_ERROR: ' + saveError.message + ' | Code: ' + saveError.code + ' | Details: ' + saveError.details);
        }

        if (!saveResult || saveResult.length === 0) {
          logDiagnostic('PROFILE_SAVE', 'Empty result from database', { operationType });
          throw new Error('EMPTY_RESULT: Database returned no data');
        }

        logDiagnostic('PROFILE_SAVE', 'Profile saved successfully', { saveResult });

        // Update local profile state immediately (no need to refetch from DB)
        // This prevents the long wait for refreshProfile()
        const savedProfile = saveResult[0];
        if (savedProfile) {
          // The profile is already saved - we can navigate immediately
          // refreshProfile will happen in background or on next mount
        }

        // For supporters, update supporter_details
        if (isSupporter) {
          const supporterUpdates: Record<string, unknown> = {};

          if (bio.trim()) {
            supporterUpdates.bio = bio.trim();
          }
          if (selectedSpecialties.length > 0) {
            supporterUpdates.specialties = selectedSpecialties;
          }

          if (Object.keys(supporterUpdates).length > 0) {
            // Check if row exists
            const { data: existing } = await supabase
              .from('supporter_details')
              .select('id')
              .eq('supporter_id', user.id)
              .single();

            if (existing) {
              const { error } = await supabase
                .from('supporter_details')
                .update(supporterUpdates)
                .eq('supporter_id', user.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('supporter_details')
                .insert({ supporter_id: user.id, ...supporterUpdates });
              if (error) throw error;
            }
          }

          // Save availability if provided
          if (availableDays.length > 0) {
            const dayMap: Record<string, string> = {
              'Mon': 'monday', 'Tue': 'tuesday', 'Wed': 'wednesday',
              'Thu': 'thursday', 'Fri': 'friday', 'Sat': 'saturday', 'Sun': 'sunday'
            };
            const schedule: Record<string, string[]> = {};
            availableDays.forEach(abbrev => {
              const fullDay = dayMap[abbrev];
              if (fullDay) {
                schedule[fullDay] = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
              }
            });
            await saveSupporterSchedule(user.id, schedule);
          }
        }

        // Don't await refreshProfile - navigate immediately
        // The profile state will update in the background
        refreshProfile();

        // Set flag to prevent redirect loop - layout will skip profile check briefly
        await AsyncStorage.setItem(PROFILE_SETUP_COMPLETED_KEY, Date.now().toString());

        // Navigate to appropriate dashboard
        if (isSupporter) {
          router.replace('/(supporter)' as any);
        } else {
          router.replace('/(client)' as any);
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.details || 'Unknown error';

      // Capture error with full context to Sentry
      captureErrorWithDiagnostics(error instanceof Error ? error : new Error(errorMessage), {
        userId: user?.id,
        userEmail: user?.email,
        role: role || (isSupporter ? 'supporter' : 'client'),
        firstName,
        lastName,
        email,
        profileNotFound,
        errorMessage,
      });

      Alert.alert('Error', `Failed to save profile: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while fetching existing data
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {profileNotFound ? 'Welcome to Psychi' : 'Complete Your Profile'}
            </Text>
            <Text style={styles.subtitle}>
              {profileNotFound
                ? "Let's set up your account to get started."
                : isSupporter
                  ? 'Please complete your profile before you can start supporting clients.'
                  : 'Please complete your profile to continue.'}
            </Text>
          </View>

          {/* Missing fields indicator */}
          <View style={styles.missingFieldsCard}>
            <Text style={styles.missingFieldsTitle}>
              {profileNotFound ? 'Create Account' : 'Required Information'}
            </Text>
            {profileNotFound ? (
              <Text style={styles.missingFieldText}>
                Please fill in your details to get started.
              </Text>
            ) : (
              missingFields.map((field) => (
                <View key={field} style={styles.missingFieldRow}>
                  <View style={styles.missingFieldDot} />
                  <Text style={styles.missingFieldText}>{field}</Text>
                </View>
              ))
            )}
          </View>

          {/* Profile Photo (Supporters only) */}
          {isSupporter && needsPhoto && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile Photo *</Text>
              <View style={styles.photoSection}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={handleChangePhoto}
                  disabled={isUploadingPhoto}
                >
                  {avatarUri ? (
                    <Image source={{ uri: avatarUri }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <CameraIcon size={32} color={PsychiColors.textMuted} />
                    </View>
                  )}
                  {isUploadingPhoto && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color={PsychiColors.white} />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={handleChangePhoto}
                  disabled={isUploadingPhoto}
                >
                  <Text style={styles.changePhotoText}>
                    {isUploadingPhoto ? 'Uploading...' : avatarUri ? 'Change Photo' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Name Fields */}
          {(needsFirstName || needsLastName) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Name *</Text>
              <View style={styles.nameRow}>
                {needsFirstName && (
                  <View style={styles.nameInput}>
                    <TextInput
                      style={styles.input}
                      value={firstName}
                      onChangeText={setFirstName}
                      placeholder="First Name"
                      placeholderTextColor={PsychiColors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                )}
                {needsLastName && (
                  <View style={styles.nameInput}>
                    <TextInput
                      style={styles.input}
                      value={lastName}
                      onChangeText={setLastName}
                      placeholder="Last Name"
                      placeholderTextColor={PsychiColors.textMuted}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Email Field */}
          {needsEmail && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Email Address *</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={PsychiColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {/* Bio (Supporters only) */}
          {isSupporter && needsBio && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bio *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell clients about yourself, your experience, and your approach..."
                placeholderTextColor={PsychiColors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.hint}>{bio.length}/500 characters (minimum 50)</Text>
            </View>
          )}

          {/* Areas of Focus (Supporters only) */}
          {isSupporter && needsSpecialties && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Areas of Focus *</Text>
              <Text style={styles.sectionSubtitle}>Select up to 6 areas you can help with</Text>
              <View style={styles.tagsContainer}>
                {FOCUS_AREAS.map((specialty) => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.tag,
                      selectedSpecialties.includes(specialty) && styles.tagSelected,
                    ]}
                    onPress={() => toggleSpecialty(specialty)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedSpecialties.includes(specialty) && styles.tagTextSelected,
                      ]}
                    >
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Availability (Supporters only) */}
          {isSupporter && needsAvailability && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>General Availability *</Text>
              <Text style={styles.sectionSubtitle}>Days you're typically available</Text>
              <View style={styles.daysContainer}>
                {AVAILABILITY_DAYS.map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      availableDays.includes(day) && styles.dayButtonActive,
                    ]}
                    onPress={() => toggleDay(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        availableDays.includes(day) && styles.dayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Save Button */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={PsychiColors.white} />
              ) : (
                <>
                  <Text style={styles.saveButtonText}>Complete Profile</Text>
                  <ChevronRightIcon size={18} color={PsychiColors.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.textPrimary,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    lineHeight: 22,
  },
  missingFieldsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  missingFieldsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.error,
    marginBottom: Spacing.sm,
  },
  missingFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  missingFieldDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PsychiColors.error,
    marginRight: Spacing.sm,
  },
  missingFieldText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: PsychiColors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: PsychiColors.borderLight,
    borderStyle: 'dashed',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: BorderRadius.full,
  },
  changePhotoText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: PsychiColors.azure,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nameInput: {
    flex: 1,
  },
  input: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    ...Shadows.soft,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.md,
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginTop: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.white,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  tagSelected: {
    backgroundColor: PsychiColors.azure,
    borderColor: PsychiColors.azure,
  },
  tagText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
  },
  tagTextSelected: {
    color: PsychiColors.white,
    fontWeight: Typography.fontWeight.semibold,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PsychiColors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.soft,
  },
  dayButtonActive: {
    backgroundColor: PsychiColors.azure,
  },
  dayText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textSecondary,
  },
  dayTextActive: {
    color: PsychiColors.white,
  },
  buttonSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.royalBlue,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
});
