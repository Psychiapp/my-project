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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { MailIcon, ChevronLeftIcon, LockIcon } from '@/components/icons';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabase) {
        // Demo mode - just show success
        setEmailSent(true);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'psychi://reset-password',
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (error: any) {
      // Don't reveal if email exists or not for security
      setEmailSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.successIcon}>
            <MailIcon size={72} color={PsychiColors.azure} />
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.description}>
            If an account exists for {email}, you'll receive a password reset link shortly.
          </Text>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryButtonText}>Back to Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.textButton}
            onPress={() => setEmailSent(false)}
          >
            <Text style={styles.textButtonText}>Try a different email</Text>
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
          {/* Header */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeftIcon size={24} color={PsychiColors.azure} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <LockIcon size={64} color={PsychiColors.azure} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.description}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={PsychiColors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Remember your password?{' '}
              <Text style={styles.helpLink} onPress={() => router.back()}>
                Sign in
              </Text>
            </Text>
          </View>
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
    paddingTop: Spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backText: {
    fontSize: 16,
    color: PsychiColors.azure,
    fontWeight: '500',
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
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
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
  primaryButton: {
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
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
    paddingVertical: Spacing.md,
  },
  textButtonText: {
    color: PsychiColors.azure,
    fontSize: 15,
    fontWeight: '500',
  },
  helpContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  helpText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  helpLink: {
    color: PsychiColors.azure,
    fontWeight: '600',
  },
});
