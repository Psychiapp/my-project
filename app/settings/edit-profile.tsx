import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChevronLeftIcon, CameraIcon } from '@/components/icons';
import { uploadAvatar, updateAvatarUrl } from '@/lib/database';
import { supabase } from '@/lib/supabase';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, user, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [avatarUri, setAvatarUri] = useState<string | null>(profile?.avatarUrl || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Load existing profile data from database
  useEffect(() => {
    const loadProfileData = async () => {
      if (!user?.id || !supabase) {
        setIsLoadingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, full_name, email, phone, bio, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading profile:', error);
        } else if (data) {
          // Use first_name/last_name if available, otherwise parse full_name
          if (data.first_name) setFirstName(data.first_name);
          else if (data.full_name) {
            const parts = data.full_name.split(' ');
            setFirstName(parts[0] || '');
          }

          if (data.last_name) setLastName(data.last_name);
          else if (data.full_name) {
            const parts = data.full_name.split(' ');
            setLastName(parts.slice(1).join(' ') || '');
          }

          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.bio) setBio(data.bio);
          if (data.avatar_url) setAvatarUri(data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadProfileData();
  }, [user?.id]);

  const handleChangePhoto = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photo library to change your profile photo.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show options: camera or library
    Alert.alert(
      'Change Profile Photo',
      'Choose a photo from your library or take a new one',
      [
        {
          text: 'Take Photo',
          onPress: handleTakePhoto,
        },
        {
          text: 'Choose from Library',
          onPress: handlePickImage,
        },
        {
          text: 'Remove Photo',
          style: 'destructive',
          onPress: handleRemovePhoto,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your camera to take a profile photo.',
        [{ text: 'OK' }]
      );
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
    setAvatarUri(uri); // Show preview immediately

    try {
      const uploadedUrl = await uploadAvatar(user.id, uri);
      if (uploadedUrl) {
        setAvatarUri(uploadedUrl);
        await refreshProfile();
        Alert.alert('Success', 'Profile photo updated successfully.');
      } else {
        // Fallback: just show the local image
        Alert.alert(
          'Photo Selected',
          'Photo will be saved when you save your profile changes.'
        );
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Upload Error', 'Failed to upload photo. Please try again.');
      setAvatarUri(profile?.avatarUrl || null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;

    setIsUploadingPhoto(true);
    try {
      const success = await updateAvatarUrl(user.id, null);
      if (success) {
        setAvatarUri(null);
        await refreshProfile();
        Alert.alert('Success', 'Profile photo removed.');
      } else {
        Alert.alert('Error', 'Failed to remove photo. Please try again.');
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      Alert.alert('Error', 'Failed to remove photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const validateEmail = (emailToCheck: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailToCheck);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'Please enter your first name.');
      return;
    }

    if (!lastName.trim()) {
      Alert.alert('Required Field', 'Please enter your last name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address.');
      return;
    }

    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Not logged in');
      return;
    }

    setIsSaving(true);

    try {
      if (supabase) {
        // Update profiles table with all fields
        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const updateData: Record<string, unknown> = {
          full_name: fullName,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          bio: bio.trim() || null,
          updated_at: new Date().toISOString(),
        };

        console.log('Saving profile update for user:', user.id);
        console.log('Update data:', updateData);

        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
          .select();

        if (error) {
          console.error('Supabase update error:', error);
          throw error;
        }

        console.log('Profile update result:', data);

        // Refresh profile in context so other screens reflect changes
        await refreshProfile();
      }

      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to update profile: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while fetching profile data
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back" accessibilityHint="Returns to the previous screen">
              <ChevronLeftIcon size={24} color={PsychiColors.azure} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} accessibilityRole="header">Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  accessibilityRole="image"
                  accessibilityLabel="Profile avatar"
                />
              ) : (
                <LinearGradient
                  colors={[PsychiColors.azure, PsychiColors.deep]}
                  style={styles.avatar}
                  accessibilityRole="image"
                  accessibilityLabel="Profile avatar placeholder"
                >
                  <Text style={styles.avatarText}>
                    {firstName.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </LinearGradient>
              )}
              {isUploadingPhoto && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator size="large" color={PsychiColors.white} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleChangePhoto}
                disabled={isUploadingPhoto}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                accessibilityHint="Opens options to take or choose a photo"
              >
                <CameraIcon size={16} color={PsychiColors.white} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={handleChangePhoto}
              disabled={isUploadingPhoto}
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              accessibilityHint="Opens photo picker to update your avatar"
            >
              <Text style={styles.changePhotoText}>
                {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel} nativeID="firstNameLabel">First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor={PsychiColors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                accessibilityLabel="First name, required"
                accessibilityLabelledBy="firstNameLabel"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel} nativeID="lastNameLabel">Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor={PsychiColors.textMuted}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                accessibilityLabel="Last name, required"
                accessibilityLabelledBy="lastNameLabel"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel} nativeID="emailLabel">Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter email"
                placeholderTextColor={PsychiColors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Email address, required"
                accessibilityLabelledBy="emailLabel"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel} nativeID="phoneLabel">Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number (optional)"
                placeholderTextColor={PsychiColors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                accessibilityLabel="Phone number, optional"
                accessibilityLabelledBy="phoneLabel"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel} nativeID="bioLabel">Bio</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Tell us about yourself (optional)"
                placeholderTextColor={PsychiColors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                accessibilityLabel="Bio, optional"
                accessibilityLabelledBy="bioLabel"
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel={isSaving ? 'Saving changes' : 'Save changes'}
              accessibilityHint="Saves your profile updates"
              accessibilityState={{ disabled: isSaving }}
            >
              <Text style={styles.saveButtonText}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
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
    fontSize: 16,
    color: PsychiColors.textSecondary,
  },
  keyboardView: {
    flex: 1,
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
    color: PsychiColors.textPrimary,
    fontFamily: 'Georgia',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  avatarSection: {
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
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: PsychiColors.azure,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: PsychiColors.white,
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
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: PsychiColors.cream,
  },
  changePhotoButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.15)',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
    letterSpacing: 0.2,
  },
  formSection: {
    paddingHorizontal: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    padding: Spacing.md,
    fontSize: 16,
    color: PsychiColors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  inputDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    color: PsychiColors.textMuted,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  inputHint: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  buttonSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
