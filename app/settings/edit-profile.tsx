import React, { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChevronLeftIcon } from '@/components/icons';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile } = useAuth();

  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required Fields', 'Please fill in your first and last name.');
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert('Success', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={PsychiColors.azure} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {firstName.charAt(0) || profile?.email?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter first name"
                placeholderTextColor={PsychiColors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter last name"
                placeholderTextColor={PsychiColors.textMuted}
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                placeholder="Enter email"
                placeholderTextColor={PsychiColors.textMuted}
                value={email}
                editable={false}
                keyboardType="email-address"
              />
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter phone number (optional)"
                placeholderTextColor={PsychiColors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Tell us about yourself (optional)"
                placeholderTextColor={PsychiColors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
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
            >
              <LinearGradient
                colors={[PsychiColors.azure, PsychiColors.deep]}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
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
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '600',
    color: PsychiColors.white,
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
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
