import React, { useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { UserRole } from '@/types';
import { ChevronLeftIcon, HeartIcon, BookIcon, EyeIcon } from '@/components/icons';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const [step, setStep] = useState<'credentials' | 'role'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleContinue = () => {
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

    setStep('role');
  };

  const handleSignUp = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(email, password, selectedRole);
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  // Role Selection Screen
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
            onPress={() => setStep('credentials')}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonContent}>
              <ChevronLeftIcon size={20} color={PsychiColors.white} />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.logoSection}>
            <Text style={styles.headerTitle}>How will you use Psychi?</Text>
            <Text style={styles.headerSubtitle}>Select your role to continue</Text>
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

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButtonWrapper, !selectedRole && styles.submitButtonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading || !selectedRole}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={selectedRole ? Gradients.primaryButton : ['#94A3B8', '#94A3B8']}
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
          </ScrollView>
        </View>
      </View>
    );
  }

  // Credentials Entry Screen
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
          <Text style={styles.headerTitle}>Create your account</Text>
          <Text style={styles.headerSubtitle}>Join Psychi today</Text>
        </View>
      </LinearGradient>

      {/* Form Card */}
      <KeyboardAvoidingView
        style={styles.formCardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.formCard, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
              onPress={handleContinue}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={Gradients.primaryButton}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Continue</Text>
              </LinearGradient>
            </TouchableOpacity>

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
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  formCardContainer: {
    flex: 1,
    marginTop: -Spacing.xl,
  },
  formCard: {
    flex: 1,
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderTopLeftRadius: BorderRadius['3xl'],
    borderTopRightRadius: BorderRadius['3xl'],
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    ...Shadows.modal,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
    ...Shadows.soft,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
    ...Shadows.soft,
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
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: PsychiColors.borderMedium,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
    marginBottom: Spacing.md,
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
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.card,
  },
  roleCardSelected: {
    borderColor: PsychiColors.royalBlue,
    backgroundColor: 'rgba(37, 99, 235, 0.05)',
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
  },
  roleDescription: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
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
});
