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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { EyeIcon, WarningIcon, CheckCircleIcon, LockIcon, CheckIcon, DotIcon } from '@/components/icons';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      if (!supabase) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session - the reset link may have expired
        setError('This password reset link has expired. Please request a new one.');
      }
    };

    checkSession();
  }, []);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleResetPassword = async () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        // Demo mode
        setResetComplete(true);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setResetComplete(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Error state - expired link
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <WarningIcon size={64} color={PsychiColors.warning} />
          </View>
          <Text style={styles.title}>Link Expired</Text>
          <Text style={styles.description}>{error}</Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/forgot-password')}
          >
            <Text style={styles.primaryButtonText}>Request New Link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={styles.textButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Success state
  if (resetComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <CheckCircleIcon size={72} color={PsychiColors.success} />
          </View>
          <Text style={styles.title}>Password Reset!</Text>
          <Text style={styles.description}>
            Your password has been successfully reset. You can now sign in with your new password.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>
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
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <LockIcon size={64} color={PsychiColors.azure} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.description}>
            Enter your new password below. Make sure it's at least 8 characters and includes uppercase, lowercase, and numbers.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* New Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={PsychiColors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <EyeIcon size={20} color={PsychiColors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={PsychiColors.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <EyeIcon size={20} color={PsychiColors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <View style={styles.requirementRow}>
                {password.length >= 8 ? (
                  <CheckIcon size={14} color={PsychiColors.success} />
                ) : (
                  <DotIcon size={14} color={PsychiColors.textMuted} />
                )}
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirementRow}>
                {/[A-Z]/.test(password) ? (
                  <CheckIcon size={14} color={PsychiColors.success} />
                ) : (
                  <DotIcon size={14} color={PsychiColors.textMuted} />
                )}
                <Text style={styles.requirementText}>One uppercase letter</Text>
              </View>
              <View style={styles.requirementRow}>
                {/[a-z]/.test(password) ? (
                  <CheckIcon size={14} color={PsychiColors.success} />
                ) : (
                  <DotIcon size={14} color={PsychiColors.textMuted} />
                )}
                <Text style={styles.requirementText}>One lowercase letter</Text>
              </View>
              <View style={styles.requirementRow}>
                {/[0-9]/.test(password) ? (
                  <CheckIcon size={14} color={PsychiColors.success} />
                ) : (
                  <DotIcon size={14} color={PsychiColors.textMuted} />
                )}
                <Text style={styles.requirementText}>One number</Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={PsychiColors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Help text */}
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => router.replace('/(auth)/sign-in')}
          >
            <Text style={styles.textButtonText}>Cancel and return to Sign In</Text>
          </TouchableOpacity>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 16,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  form: {
    gap: Spacing.md,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.soft,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: '#2A2A2A',
  },
  eyeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  requirementsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  requirementsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementIconContainer: {
    marginRight: Spacing.sm,
    width: 16,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 13,
    color: PsychiColors.textSecondary,
  },
  primaryButton: {
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.soft,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: PsychiColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  textButton: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  textButtonText: {
    color: PsychiColors.azure,
    fontSize: 15,
    fontWeight: '500',
  },
});
