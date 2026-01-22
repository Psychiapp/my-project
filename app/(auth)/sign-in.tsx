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
import { ChevronLeftIcon, EyeIcon } from '@/components/icons';
import { DEMO_CREDENTIALS } from '@/constants/demo';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDemoLogin = (role: 'client' | 'supporter' | 'admin') => {
    const demoEmail =
      role === 'supporter' ? DEMO_CREDENTIALS.supporterEmail :
      role === 'admin' ? DEMO_CREDENTIALS.adminEmail :
      DEMO_CREDENTIALS.email;

    setEmail(demoEmail);
    setPassword(DEMO_CREDENTIALS.password);
  };

  return (
    <View style={styles.container}>
      {/* Header Gradient */}
      <LinearGradient
        colors={Gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + Spacing.md }]}
      >
        {/* Back Button */}
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

        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Welcome back</Text>
          <Text style={styles.headerSubtitle}>Sign in to continue to Psychi</Text>
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
                  placeholder="Enter your password"
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

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButtonWrapper}
              onPress={handleSignIn}
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
                  <Text style={styles.submitButtonText}>Sign In</Text>
                )}
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

            {/* Demo Mode Section */}
            <View style={styles.demoSection}>
              <Text style={styles.demoTitle}>App Store Review</Text>
              <Text style={styles.demoSubtitle}>Try the app with demo accounts:</Text>
              <View style={styles.demoButtons}>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleDemoLogin('client')}
                >
                  <Text style={styles.demoButtonText}>Client</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.demoButton}
                  onPress={() => handleDemoLogin('supporter')}
                >
                  <Text style={styles.demoButtonText}>Supporter</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
                <Text style={styles.footerLink}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.royalBlue,
    fontWeight: '500',
  },
  submitButtonWrapper: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    ...Shadows.button,
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
  demoSection: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.15)',
  },
  demoTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  demoSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.md,
    letterSpacing: 0.2,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  demoButtonText: {
    color: PsychiColors.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
