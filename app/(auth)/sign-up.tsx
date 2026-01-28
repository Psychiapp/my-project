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
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { UserRole } from '@/types';
import { ChevronLeftIcon, HeartIcon, BookIcon, EyeIcon, CheckIcon, VideoIcon, MicIcon } from '@/components/icons';
import { saveClientPreferences } from '@/lib/database';
import OnboardingModal from '@/components/OnboardingModal';

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const { role: roleParam } = useLocalSearchParams<{ role?: string }>();

  // Pre-select role and skip to credentials if role is passed via URL
  const initialRole = roleParam === 'client' ? 'client' : roleParam === 'supporter' ? 'supporter' : null;
  const initialStep = initialRole ? 'credentials' : 'role';

  const [step, setStep] = useState<'role' | 'credentials'>(initialStep);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(initialRole);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [newUserId, setNewUserId] = useState<string | null>(null);

  // Agreement checkboxes for clients
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);

  // Agreement checkboxes for supporters
  const [supporterAgreedToTerms, setSupporterAgreedToTerms] = useState(false);
  const [supporterAgreedToPrivacy, setSupporterAgreedToPrivacy] = useState(false);
  const [supporterAgreedToConfidentiality, setSupporterAgreedToConfidentiality] = useState(false);

  // Equipment requirements modal for supporters
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);

  // Check if all required agreements are accepted
  const allAgreementsAccepted = selectedRole === 'client'
    ? agreedToTerms && agreedToPrivacy && agreedToDisclaimer
    : selectedRole === 'supporter'
    ? supporterAgreedToTerms && supporterAgreedToPrivacy && supporterAgreedToConfidentiality
    : true;

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

    // Check agreements
    if (!allAgreementsAccepted) {
      Alert.alert('Agreement Required', 'Please read and agree to all documents before creating your account.');
      return;
    }

    setIsLoading(true);
    const { error, user } = await signUp(email, password, selectedRole);

    if (error) {
      setIsLoading(false);
      Alert.alert('Error', error.message);
      return;
    }

    setIsLoading(false);

    // Show matching quiz for clients after account creation
    if (selectedRole === 'client' && user) {
      setNewUserId(user.id);
      setShowOnboardingModal(true);
    }

    // Show equipment requirements modal for supporters after account creation
    if (selectedRole === 'supporter' && user) {
      setShowEquipmentModal(true);
    }
  };

  // Handle supporter equipment agreement
  const handleEquipmentAgree = () => {
    setShowEquipmentModal(false);
    router.replace('/(supporter)');
  };

  const handleQuizComplete = async (preferences: any) => {
    if (newUserId) {
      try {
        await saveClientPreferences(newUserId, preferences);
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
    }
    setShowOnboardingModal(false);
    // Navigate to client dashboard
    router.replace('/(client)');
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
              style={[
                styles.submitButtonWrapper,
                !allAgreementsAccepted && styles.submitButtonDisabled
              ]}
              onPress={handleSignUp}
              disabled={isLoading || !allAgreementsAccepted}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={!allAgreementsAccepted ? ['#94A3B8', '#94A3B8'] : Gradients.primaryButton}
                style={styles.submitButton}
              >
                {isLoading ? (
                  <ActivityIndicator color={PsychiColors.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Agreement Checkboxes */}
            <View style={styles.agreementsContainer}>
              <Text style={styles.agreementsTitle}>Please review and agree to the following:</Text>

              {selectedRole === 'client' ? (
                <>
                  {/* Client: Terms of Service */}
                  <View style={styles.agreementRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
                      onPress={() => setAgreedToTerms(!agreedToTerms)}
                    >
                      {agreedToTerms && <CheckIcon size={14} color={PsychiColors.white} />}
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I have read and agree to the{' '}
                      <Text style={styles.termsLink} onPress={() => router.push('/legal/terms-of-service')}>
                        Terms of Service
                      </Text>
                    </Text>
                  </View>

                  {/* Client: Privacy Policy */}
                  <View style={styles.agreementRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, agreedToPrivacy && styles.checkboxChecked]}
                      onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
                    >
                      {agreedToPrivacy && <CheckIcon size={14} color={PsychiColors.white} />}
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I have read and agree to the{' '}
                      <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy-policy')}>
                        Privacy Policy
                      </Text>
                    </Text>
                  </View>

                  {/* Client: Disclaimer */}
                  <View style={styles.agreementRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, agreedToDisclaimer && styles.checkboxChecked]}
                      onPress={() => setAgreedToDisclaimer(!agreedToDisclaimer)}
                    >
                      {agreedToDisclaimer && <CheckIcon size={14} color={PsychiColors.white} />}
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I have read and agree to the{' '}
                      <Text style={styles.termsLink} onPress={() => router.push('/legal/client-disclaimer')}>
                        Client Disclaimer
                      </Text>
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Supporter: Terms of Service */}
                  <View style={styles.agreementRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, supporterAgreedToTerms && styles.checkboxChecked]}
                      onPress={() => setSupporterAgreedToTerms(!supporterAgreedToTerms)}
                    >
                      {supporterAgreedToTerms && <CheckIcon size={14} color={PsychiColors.white} />}
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I have read and agree to the{' '}
                      <Text style={styles.termsLink} onPress={() => router.push('/legal/terms-of-service')}>
                        Terms of Service
                      </Text>
                    </Text>
                  </View>

                  {/* Supporter: Privacy Policy */}
                  <View style={styles.agreementRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, supporterAgreedToPrivacy && styles.checkboxChecked]}
                      onPress={() => setSupporterAgreedToPrivacy(!supporterAgreedToPrivacy)}
                    >
                      {supporterAgreedToPrivacy && <CheckIcon size={14} color={PsychiColors.white} />}
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I have read and agree to the{' '}
                      <Text style={styles.termsLink} onPress={() => router.push('/legal/privacy-policy')}>
                        Privacy Policy
                      </Text>
                    </Text>
                  </View>

                  {/* Supporter: Confidentiality Agreement */}
                  <View style={styles.agreementRow}>
                    <TouchableOpacity
                      style={[styles.checkbox, supporterAgreedToConfidentiality && styles.checkboxChecked]}
                      onPress={() => setSupporterAgreedToConfidentiality(!supporterAgreedToConfidentiality)}
                    >
                      {supporterAgreedToConfidentiality && <CheckIcon size={14} color={PsychiColors.white} />}
                    </TouchableOpacity>
                    <Text style={styles.agreementText}>
                      I have read and agree to the{' '}
                      <Text style={styles.termsLink} onPress={() => router.push('/legal/confidentiality-agreement')}>
                        Confidentiality Agreement
                      </Text>
                    </Text>
                  </View>
                </>
              )}
            </View>

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

      {/* Matching Quiz Modal - shown after account creation for clients */}
      <OnboardingModal
        visible={showOnboardingModal}
        onClose={() => {
          setShowOnboardingModal(false);
          router.replace('/(client)');
        }}
        onComplete={handleQuizComplete}
      />

      {/* Equipment Requirements Modal - shown after account creation for supporters */}
      <Modal
        visible={showEquipmentModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.equipmentModal}>
            <View style={styles.equipmentIconRow}>
              <View style={styles.equipmentIconContainer}>
                <VideoIcon size={32} color={PsychiColors.azure} />
              </View>
              <View style={styles.equipmentIconContainer}>
                <MicIcon size={32} color={PsychiColors.azure} />
              </View>
            </View>

            <Text style={styles.equipmentTitle}>Equipment Requirements</Text>

            <Text style={styles.equipmentDescription}>
              To provide peer support services through Psychi, you must have:
            </Text>

            <View style={styles.equipmentList}>
              <View style={styles.equipmentItem}>
                <View style={styles.equipmentBullet} />
                <Text style={styles.equipmentItemText}>
                  A working <Text style={styles.equipmentBold}>video camera</Text> for video sessions
                </Text>
              </View>
              <View style={styles.equipmentItem}>
                <View style={styles.equipmentBullet} />
                <Text style={styles.equipmentItemText}>
                  A working <Text style={styles.equipmentBold}>microphone</Text> for phone and video sessions
                </Text>
              </View>
              <View style={styles.equipmentItem}>
                <View style={styles.equipmentBullet} />
                <Text style={styles.equipmentItemText}>
                  A stable <Text style={styles.equipmentBold}>internet connection</Text>
                </Text>
              </View>
            </View>

            <Text style={styles.equipmentNote}>
              You will not be able to accept sessions without functioning audio and video equipment.
            </Text>

            <TouchableOpacity
              style={styles.equipmentAgreeButton}
              onPress={handleEquipmentAgree}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={Gradients.primaryButton}
                style={styles.equipmentAgreeGradient}
              >
                <Text style={styles.equipmentAgreeText}>I Understand and Agree</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    width: 240,
    height: 90,
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
  // Agreement Checkboxes
  agreementsContainer: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  agreementsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.md,
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: PsychiColors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: PsychiColors.royalBlue,
    borderColor: PsychiColors.royalBlue,
  },
  agreementText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  // Equipment Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  equipmentModal: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  equipmentIconRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  equipmentIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  equipmentTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  equipmentDescription: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  equipmentList: {
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  equipmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  equipmentBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PsychiColors.azure,
    marginTop: 7,
  },
  equipmentItemText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  equipmentBold: {
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  equipmentNote: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  equipmentAgreeButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  equipmentAgreeGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  equipmentAgreeText: {
    fontSize: Typography.fontSize.base,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
