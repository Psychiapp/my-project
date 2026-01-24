import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { UserRole } from '@/types';
import { ChevronLeftIcon, HeartIcon, BookIcon, EyeIcon, CheckCircleIcon } from '@/components/icons';
import { saveClientPreferences } from '@/lib/database';
import { PENDING_QUIZ_PREFERENCES_KEY } from './welcome';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [step, setStep] = useState<'role' | 'credentials'>('role');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingPreferences, setPendingPreferences] = useState<any>(null);
  const [hasCompletedQuiz, setHasCompletedQuiz] = useState(false);

  // Check for pending quiz preferences on mount
  useEffect(() => {
    const checkPendingPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(PENDING_QUIZ_PREFERENCES_KEY);
        if (stored) {
          const preferences = JSON.parse(stored);
          setPendingPreferences(preferences);
          setHasCompletedQuiz(true);
          // Auto-select client role since they completed the quiz
          setSelectedRole('client');
          // Skip role selection if quiz was completed
          setStep('credentials');
        }
      } catch (error) {
        console.error('Error checking pending preferences:', error);
      }
    };
    checkPendingPreferences();
  }, []);

  const handleRoleContinue = () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }
    setStep('credentials');
  };

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setIsLoading(true);
    const { error, user } = await signUp(email, password, selectedRole);

    if (error) {
      setIsLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    // If user completed quiz before signup, save their preferences
    if (pendingPreferences && user && selectedRole === 'client') {
      try {
        await saveClientPreferences(user.id, pendingPreferences);
        // Clear the pending preferences from storage
        await AsyncStorage.removeItem(PENDING_QUIZ_PREFERENCES_KEY);
      } catch (prefError) {
        console.error('Error saving preferences:', prefError);
        // Don't block signup if preferences fail to save
      }
    }

    setIsLoading(false);
  };

  // Role Selection Screen (Step 1)
  if (step === 'role') {
    return (
      <View style={styles.container}>
        {/* Header Gradient */}
        <LinearGradient
          colors={Gradients.hero}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.headerGradient, { paddingTop: insets.top + Spacing.md }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonContent}>
              <ChevronLeftIcon size={20} color={PsychiColors.white} />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.logoSection}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>Join Psychi</Text>
            <Text style={styles.headerSubtitle}>How will you use Psychi?</Text>
          </View>
        </LinearGradient>

        {/* Role Selection Card */}
        <View style={[styles.formCard, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Client Role Option */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'client' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('client')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.client}
                style={styles.roleIconBg}
              >
                <HeartIcon size={24} color={PsychiColors.white} />
              </LinearGradient>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>I'm looking for support</Text>
                <Text style={styles.roleDescription}>
                  Connect with trained peer supporters for chat, phone, or video sessions
                </Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedRole === 'client' && styles.radioOuterSelected
              ]}>
                {selectedRole === 'client' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Supporter Role Option */}
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === 'supporter' && styles.roleCardSelected,
              ]}
              onPress={() => setSelectedRole('supporter')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.supporter}
                style={styles.roleIconBg}
              >
                <BookIcon size={24} color={PsychiColors.white} />
              </LinearGradient>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>I want to be a supporter</Text>
                <Text style={styles.roleDescription}>
                  Use your psychology education to help others while earning money
                </Text>
              </View>
              <View style={[
                styles.radioOuter,
                selectedRole === 'supporter' && styles.radioOuterSelected
              ]}>
                {selectedRole === 'supporter' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Continue Button */}
            <TouchableOpacity
              style={[styles.submitButtonWrapper, !selectedRole && styles.submitButtonDisabled]}
              onPress={handleRoleContinue}
              disabled={!selectedRole}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={selectedRole ? Gradients.primaryButton : ['#94A3B8', '#94A3B8']}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // Credentials Entry Screen (Step 2)
  return (
    <View style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + Spacing.md }]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setStep('role')}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonContent}>
            <ChevronLeftIcon size={20} color={PsychiColors.white} />
            <Text style={styles.backButtonText}>Back</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Create your account</Text>
          <Text style={styles.headerSubtitle}>
            {selectedRole === 'supporter' ? 'Join as a Supporter' : 'Join as a Client'}
          </Text>
        </View>
      </LinearGradient>

      {/* Form Card */}
      <KeyboardAvoidingView
        style={styles.formCardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.formCard, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Quiz Completed Banner */}
            {hasCompletedQuiz && selectedRole === 'client' && (
              <View style={styles.quizCompletedBanner}>
                <CheckCircleIcon size={20} color={PsychiColors.success} />
                <Text style={styles.quizCompletedText}>
                  Matching quiz completed! Your preferences will be saved.
                </Text>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
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
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={PsychiColors.textMuted}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <EyeIcon size={20} color={PsychiColors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={PsychiColors.textMuted}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButtonWrapper}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={Gradients.primaryButton}
                style={styles.submitButton}
              >
                {isLoading ? (
                  <ActivityIndicator color={PsychiColors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <Text style={styles.termsText}>
              By creating an account, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')}>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  headerGradient: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  backButton: {
    marginBottom: Spacing.lg,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  backButtonText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.white,
    fontWeight: '500',
  },
  logoSection: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 44,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '700',
    color: PsychiColors.white,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.3,
  },
  formCardContainer: {
    flex: 1,
    marginTop: -Spacing.xl,
  },
  formCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  submitButtonWrapper: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginTop: Spacing.md,
    ...Shadows.button,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButton: {
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
  },
  submitButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    letterSpacing: 0.3,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  socialIcon: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: '#4285F4',
    marginRight: Spacing.sm,
  },
  socialButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  footerLink: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.royalBlue,
    fontWeight: '600',
  },
  // Role Selection Styles
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 20,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  roleCardSelected: {
    borderColor: PsychiColors.royalBlue,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  roleIconBg: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamily.serif,
    letterSpacing: 0.3,
  },
  roleDescription: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: PsychiColors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: PsychiColors.royalBlue,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: PsychiColors.royalBlue,
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: 20,
  },
  termsLink: {
    color: PsychiColors.royalBlue,
    fontWeight: '500',
  },
  quizCompletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${PsychiColors.success}15`,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: `${PsychiColors.success}30`,
  },
  quizCompletedText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.success,
    fontWeight: '500',
  },
});
