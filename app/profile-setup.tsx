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
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { CameraIcon, CheckIcon, ChevronRightIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { uploadAvatar, saveSupporterSchedule } from '@/lib/database';

const SPECIALTIES = [
  'Anxiety',
  'Depression',
  'Stress',
  'Relationships',
  'Grief',
  'Trauma',
  'Self-Esteem',
  'Life Transitions',
  'Work/Career',
  'Family Issues',
  'Addiction',
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
  const [bio, setBio] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  // Loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Determine which fields are missing
  const needsFirstName = missingFields.includes('First Name');
  const needsLastName = missingFields.includes('Last Name');
  const needsBio = missingFields.includes('Bio');
  const needsPhoto = missingFields.includes('Profile Photo');
  const needsSpecialties = missingFields.includes('Specialties');
  const needsAvailability = missingFields.includes('Availability');

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

  const validateForm = (): boolean => {
    if (needsFirstName && !firstName.trim()) {
      Alert.alert('Required', 'Please enter your first name.');
      return false;
    }
    if (needsLastName && !lastName.trim()) {
      Alert.alert('Required', 'Please enter your last name.');
      return false;
    }
    if (isSupporter) {
      if (needsBio && (!bio.trim() || bio.length < 50)) {
        Alert.alert('Required', 'Please write a bio of at least 50 characters.');
        return false;
      }
      if (needsPhoto && !avatarUri) {
        Alert.alert('Required', 'Please add a profile photo.');
        return false;
      }
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
        // Update profiles table
        const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const profileUpdates: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };

        if (firstName.trim()) {
          profileUpdates.first_name = firstName.trim();
        }
        if (lastName.trim()) {
          profileUpdates.last_name = lastName.trim();
        }
        if (fullName) {
          profileUpdates.full_name = fullName;
        }

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profileError) throw profileError;

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

        await refreshProfile();

        // Navigate to appropriate dashboard
        if (isSupporter) {
          router.replace('/(supporter)' as any);
        } else {
          router.replace('/(client)' as any);
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              {isSupporter
                ? 'Please complete your profile before you can start supporting clients.'
                : 'Please complete your profile to continue.'}
            </Text>
          </View>

          {/* Missing fields indicator */}
          <View style={styles.missingFieldsCard}>
            <Text style={styles.missingFieldsTitle}>Required Information</Text>
            {missingFields.map((field) => (
              <View key={field} style={styles.missingFieldRow}>
                <View style={styles.missingFieldDot} />
                <Text style={styles.missingFieldText}>{field}</Text>
              </View>
            ))}
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

          {/* Specialties (Supporters only) */}
          {isSupporter && needsSpecialties && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Specialties *</Text>
              <Text style={styles.sectionSubtitle}>Select up to 6 areas you can help with</Text>
              <View style={styles.tagsContainer}>
                {SPECIALTIES.map((specialty) => (
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
