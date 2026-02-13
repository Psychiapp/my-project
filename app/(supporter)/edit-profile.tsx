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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChevronLeftIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { getSupporterDetail, uploadAvatar } from '@/lib/database';

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

export default function SupporterEditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Profile fields - start empty, load from database
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  // Load supporter profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        // Get supporter details from database
        const details = await getSupporterDetail(user.id);

        if (details) {
          setDisplayName(details.full_name || '');
          setBio(details.bio || '');
          setSelectedSpecialties(details.specialties || []);
          setAvatarUrl(details.avatar_url || null);

          // Convert availability object to day abbreviations
          if (details.availability) {
            const days: string[] = [];
            const dayMap: Record<string, string> = {
              'monday': 'Mon', 'tuesday': 'Tue', 'wednesday': 'Wed',
              'thursday': 'Thu', 'friday': 'Fri', 'saturday': 'Sat', 'sunday': 'Sun'
            };
            Object.keys(details.availability).forEach(day => {
              const abbrev = dayMap[day.toLowerCase()];
              if (abbrev && details.availability[day]?.length > 0) {
                days.push(abbrev);
              }
            });
            setAvailableDays(days);
          }
        } else if (profile) {
          // Fall back to basic profile info
          setDisplayName(`${profile.firstName} ${profile.lastName}`.trim());
          setAvatarUrl(profile.avatarUrl || null);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [user?.id, profile]);

  const handleChangePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Change Profile Photo',
      'Choose a photo from your library or take a new one',
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
      Alert.alert('Permission Required', 'Please allow camera access.', [{ text: 'OK' }]);
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
    setAvatarUrl(uri); // Show preview immediately

    try {
      const uploadedUrl = await uploadAvatar(user.id, uri);
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        await refreshProfile();
        Alert.alert('Success', 'Profile photo updated successfully.');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
      setAvatarUrl(profile?.avatarUrl || null);
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

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Error', 'Please enter a display name');
      return;
    }

    if (!bio.trim() || bio.length < 50) {
      Alert.alert('Error', 'Please write a bio of at least 50 characters');
      return;
    }

    if (selectedSpecialties.length < 1) {
      Alert.alert('Error', 'Please select at least one specialty');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    setIsLoading(true);

    try {
      // Convert day abbreviations back to availability object
      const dayMap: Record<string, string> = {
        'Mon': 'monday', 'Tue': 'tuesday', 'Wed': 'wednesday',
        'Thu': 'thursday', 'Fri': 'friday', 'Sat': 'saturday', 'Sun': 'sunday'
      };
      const availability: Record<string, string[]> = {};
      availableDays.forEach(abbrev => {
        const fullDay = dayMap[abbrev];
        if (fullDay) {
          availability[fullDay] = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
        }
      });

      if (supabase) {
        // Update profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name: displayName })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Update supporter_details table
        const { error: detailsError } = await supabase
          .from('supporter_details')
          .upsert({
            supporter_id: user.id,
            bio,
            specialties: selectedSpecialties,
            availability,
          });

        if (detailsError) throw detailsError;
      }

      Alert.alert('Success', 'Your profile has been updated', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingProfile) {
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={PsychiColors.azure} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              style={styles.saveButton}
            >
              <Text style={[styles.saveText, isLoading && styles.saveTextDisabled]}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Profile Photo */}
          <View style={styles.section}>
            <View style={styles.photoSection}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.changePhotoButton}
                onPress={handleChangePhoto}
                disabled={isUploadingPhoto}
              >
                <Text style={styles.changePhotoText}>
                  {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Display Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="How clients will see your name"
              placeholderTextColor={PsychiColors.textMuted}
            />
            <Text style={styles.hint}>
              Use your first name and last initial for privacy
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell potential clients about yourself, your experience, and approach..."
              placeholderTextColor={PsychiColors.textMuted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={styles.hint}>{bio.length}/500 characters (minimum 50)</Text>
          </View>

          {/* Specialties */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <Text style={styles.sectionSubtitle}>
              Select up to 6 areas you can help with
            </Text>
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

          {/* Availability */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>General Availability</Text>
            <Text style={styles.sectionSubtitle}>
              Days you're typically available
            </Text>
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
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  saveTextDisabled: {
    opacity: 0.5,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: Spacing.md,
  },
  avatarPlaceholder: {
    backgroundColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  changePhotoButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  changePhotoText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  input: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: '#2A2A2A',
    ...Shadows.soft,
  },
  textArea: {
    height: 140,
    paddingTop: Spacing.md,
  },
  hint: {
    fontSize: 13,
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
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  tagTextSelected: {
    color: PsychiColors.white,
    fontWeight: '600',
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
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  dayTextActive: {
    color: PsychiColors.white,
  },
});
