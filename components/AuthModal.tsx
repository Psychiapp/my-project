/**
 * AuthModal - Exact match to web app AuthModal.tsx
 * Multi-step authentication flow with role selection, safety checks, and account creation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { HeartIcon, UsersIcon, ChevronRightIcon, AlertIcon, CheckIcon, CloseIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

// Types
type AuthMode = 'signin' | 'signup' | 'reset';
type SignupStep = 'role' | 'safety-check' | 'crisis-resources' | 'age-verification' | 'supporter-disclosure' | 'details';
type UserType = 'client' | 'supporter';

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
  onClientSignUpSuccess?: () => void;
}

export default function AuthModal({
  visible,
  onClose,
  initialMode = 'signin',
  onClientSignUpSuccess,
}: AuthModalProps) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();

  // State
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [signupStep, setSignupStep] = useState<SignupStep>('role');
  const [userType, setUserType] = useState<UserType | null>(null);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Checkboxes
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToDisclaimer, setAgreedToDisclaimer] = useState(false);
  const [agreedToSupporterDisclosure, setAgreedToSupporterDisclosure] = useState(false);

  // Reset form
  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setUserType(null);
    setSignupStep('role');
    setAgreedToTerms(false);
    setAgreedToDisclaimer(false);
    setAgreedToSupporterDisclosure(false);
    setError(null);
    setSuccess(null);
  }, []);

  // Handle mode change
  const handleModeChange = (newMode: AuthMode) => {
    resetForm();
    setMode(newMode);
  };

  // Handle close
  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Role selection handler
  const handleRoleSelect = (type: UserType) => {
    setUserType(type);
    if (type === 'client') {
      setSignupStep('safety-check');
    } else {
      setSignupStep('supporter-disclosure');
    }
  };

  // Safety check handler
  const handleSafetyCheckResponse = (hasCrisisThoughts: boolean) => {
    if (hasCrisisThoughts) {
      setSignupStep('crisis-resources');
    } else {
      setSignupStep('age-verification');
    }
  };

  // Age verification handler
  const handleAgeVerification = (isOver18: boolean) => {
    if (isOver18) {
      setSignupStep('details');
    } else {
      setError('Psychi is designed for adults 18 and older. Please come back when you meet our age requirement.');
    }
  };

  // Supporter disclosure accept
  const handleSupporterDisclosureAccept = () => {
    setAgreedToSupporterDisclosure(true);
    setSignupStep('details');
  };

  // Back to role select
  const handleBackToRoleSelect = () => {
    setUserType(null);
    setSignupStep('role');
    setError(null);
    setAgreedToSupporterDisclosure(false);
  };

  // Sign in handler
  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  // Sign up handler
  const handleSignUp = async () => {
    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (userType === 'client' && !agreedToDisclaimer) {
      setError('Please acknowledge the client disclaimer');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signUp(email, password, userType!);
      setSuccess('Account created successfully!');
      if (userType === 'client' && onClientSignUpSuccess) {
        setTimeout(() => {
          handleClose();
          onClientSignUpSuccess();
        }, 1500);
      } else {
        setTimeout(() => handleClose(), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Password reset handler
  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // TODO: Implement password reset
      setSuccess('Password reset link sent to your email');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  // Crisis resource handlers
  const handleCrisisCall = () => {
    Linking.openURL('tel:988');
  };

  const handleCrisisText = () => {
    Linking.openURL('sms:741741?body=HOME');
  };

  const handleEmergencyCall = () => {
    Linking.openURL('tel:911');
  };

  // Render header
  const renderHeader = () => (
    <LinearGradient
      colors={['#60A5FA', '#3B82F6', '#FB923C']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      {/* Close button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={handleClose}
        activeOpacity={0.7}
      >
        <CloseIcon size={20} color={PsychiColors.textPrimary} />
      </TouchableOpacity>

      {/* Logo */}
      <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Title */}
      <Text style={styles.headerTitle}>
        {mode === 'signin' ? 'Welcome Back' : mode === 'reset' ? 'Reset Password' : 'Join Psychi'}
      </Text>
      <Text style={styles.headerSubtitle}>
        {mode === 'signin'
          ? 'Sign in to continue your journey'
          : mode === 'reset'
          ? 'Enter your email to reset your password'
          : 'Create your account to get started'}
      </Text>
    </LinearGradient>
  );

  // Render error/success messages
  const renderMessages = () => (
    <>
      {error && (
        <View style={styles.errorContainer}>
          <AlertIcon size={18} color={PsychiColors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {success && (
        <View style={styles.successContainer}>
          <CheckIcon size={18} color={PsychiColors.success} />
          <Text style={styles.successText}>{success}</Text>
        </View>
      )}
    </>
  );

  // Render sign in form
  const renderSignIn = () => (
    <View style={styles.formContent}>
      {renderMessages()}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={PsychiColors.textSoft}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Enter your password"
          placeholderTextColor={PsychiColors.textSoft}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={styles.forgotPassword}
        onPress={() => handleModeChange('reset')}
      >
        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.primaryButton}
          style={styles.primaryButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color={PsychiColors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Sign In</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render role selection
  const renderRoleSelect = () => (
    <View style={styles.formContent}>
      {renderMessages()}

      <TouchableOpacity
        style={styles.roleCard}
        onPress={() => handleRoleSelect('client')}
        activeOpacity={0.8}
      >
        <View style={styles.roleIconContainer}>
          <HeartIcon size={24} color={PsychiColors.textPrimary} />
        </View>
        <View style={styles.roleContent}>
          <Text style={styles.roleTitle}>I'm Looking for Support</Text>
          <Text style={styles.roleDescription}>
            Connect with trained peer supporters who understand what you're going through
          </Text>
        </View>
        <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.roleCard, styles.roleCardSupporter]}
        onPress={() => handleRoleSelect('supporter')}
        activeOpacity={0.8}
      >
        <View style={[styles.roleIconContainer, styles.roleIconSupporter]}>
          <UsersIcon size={24} color={PsychiColors.textPrimary} />
        </View>
        <View style={styles.roleContent}>
          <Text style={styles.roleTitle}>I Want to Be a Supporter</Text>
          <Text style={styles.roleDescription}>
            Use your experiences to help others and earn while making a difference
          </Text>
        </View>
        <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
      </TouchableOpacity>

      <View style={styles.roleFooter}>
        <Text style={styles.roleFooterText}>
          {userType === 'client'
            ? 'You can browse supporters and book sessions after creating your account.'
            : userType === 'supporter'
            ? 'You\'ll need to complete training before accepting sessions.'
            : 'Select how you\'d like to use Psychi'}
        </Text>
      </View>
    </View>
  );

  // Render safety check
  const renderSafetyCheck = () => (
    <View style={styles.formContent}>
      {renderMessages()}

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          Before we continue, we want to make sure you get the right support.
        </Text>
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>
          Are you currently experiencing thoughts of suicide or self-harm?
        </Text>
      </View>

      <TouchableOpacity
        style={styles.responseButton}
        onPress={() => handleSafetyCheckResponse(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.responseButtonText}>Yes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.responseButton}
        onPress={() => handleSafetyCheckResponse(false)}
        activeOpacity={0.8}
      >
        <Text style={styles.responseButtonText}>No</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackToRoleSelect}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render crisis resources
  const renderCrisisResources = () => (
    <View style={styles.formContent}>
      <View style={styles.crisisWarning}>
        <HeartIcon size={24} color={PsychiColors.lavender} />
        <Text style={styles.crisisWarningText}>
          We're glad you're reaching out. Your life matters, and there are people who want to help you right now.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.crisisButton}
        onPress={handleCrisisCall}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.primaryButton}
          style={styles.crisisButtonGradient}
        >
          <Text style={styles.crisisNumber}>988</Text>
          <Text style={styles.crisisLabel}>Suicide & Crisis Lifeline</Text>
          <Text style={styles.crisisSubtext}>Call or Text 24/7</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.crisisSecondaryButton}
        onPress={handleCrisisText}
        activeOpacity={0.8}
      >
        <Text style={styles.crisisSecondaryNumber}>Text HOME to 741741</Text>
        <Text style={styles.crisisSecondaryLabel}>Crisis Text Line</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.crisisSecondaryButton, styles.crisisEmergencyButton]}
        onPress={handleEmergencyCall}
        activeOpacity={0.8}
      >
        <Text style={[styles.crisisSecondaryNumber, styles.crisisEmergencyText]}>911</Text>
        <Text style={styles.crisisSecondaryLabel}>Emergency Services</Text>
      </TouchableOpacity>

      <View style={styles.crisisDisclaimer}>
        <Text style={styles.crisisDisclaimerText}>
          Psychi is a peer support service and is not equipped to handle mental health emergencies. Please reach out to these resources for immediate help.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackToRoleSelect}
      >
        <Text style={styles.backButtonText}>Back to Sign Up</Text>
      </TouchableOpacity>
    </View>
  );

  // Render age verification
  const renderAgeVerification = () => (
    <View style={styles.formContent}>
      {renderMessages()}

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxText}>
          Psychi is designed for adults seeking peer support. Please confirm that you meet our age requirement.
        </Text>
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionText}>
          Are you 18 years of age or older?
        </Text>
      </View>

      <TouchableOpacity
        style={styles.responseButton}
        onPress={() => handleAgeVerification(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.responseButtonText}>Yes, I am 18 or older</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.responseButton}
        onPress={() => handleAgeVerification(false)}
        activeOpacity={0.8}
      >
        <Text style={styles.responseButtonText}>No, I am under 18</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setSignupStep('safety-check')}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render supporter disclosure
  const renderSupporterDisclosure = () => (
    <View style={styles.formContent}>
      <View style={styles.supporterGreeting}>
        <Text style={styles.supporterGreetingText}>
          Thank you for your interest in becoming a Psychi Supporter! Before you continue, please review the following important information.
        </Text>
      </View>

      <View style={styles.disclosureBox}>
        <Text style={styles.disclosureTitle}>Platform Launch Date</Text>
        <Text style={styles.disclosureText}>
          Psychi is scheduled to launch on <Text style={styles.disclosureBold}>April 1st, 2026</Text>. You will not be assigned clients until this date.
        </Text>
      </View>

      <View style={styles.disclosureBox}>
        <Text style={styles.disclosureTitle}>Training Requirement</Text>
        <Text style={styles.disclosureText}>
          All supporters must complete our comprehensive training program and obtain the Psychi Supporter Certificate before being matched with clients.
        </Text>
      </View>

      <View style={styles.requirementsList}>
        <Text style={styles.requirementsTitle}>By continuing, you acknowledge that you will:</Text>
        <Text style={styles.requirementItem}>• Wait until 4/1/26 for client assignment</Text>
        <Text style={styles.requirementItem}>• Complete all required training modules</Text>
        <Text style={styles.requirementItem}>• Obtain Psychi Supporter Certificate</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSupporterDisclosureAccept}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#E4C4F0', '#D4B0E8']}
          style={styles.primaryButtonGradient}
        >
          <Text style={[styles.primaryButtonText, { color: PsychiColors.textPrimary }]}>
            I Understand & Agree
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackToRoleSelect}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );

  // Render account details form
  const renderDetails = () => (
    <View style={styles.formContent}>
      {renderMessages()}

      {/* Role badge */}
      <View style={styles.roleBadge}>
        <View style={styles.roleBadgeLeft}>
          {userType === 'client' ? (
            <HeartIcon size={16} color={PsychiColors.azure} />
          ) : (
            <UsersIcon size={16} color="#E4C4F0" />
          )}
          <Text style={styles.roleBadgeText}>
            {userType === 'client' ? 'Client' : 'Supporter'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleBackToRoleSelect}>
          <Text style={styles.roleBadgeChange}>Change</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>
          {userType === 'client' ? 'Display Name' : 'Your Name'}
        </Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={userType === 'client' ? 'How should we address you?' : 'Enter your full name'}
          placeholderTextColor={PsychiColors.textSoft}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={PsychiColors.textSoft}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Create a password (min. 6 characters)"
          placeholderTextColor={PsychiColors.textSoft}
          secureTextEntry
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          placeholderTextColor={PsychiColors.textSoft}
          secureTextEntry
        />
      </View>

      {/* Terms checkbox */}
      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms && <CheckIcon size={14} color={PsychiColors.white} />}
        </View>
        <Text style={styles.checkboxText}>
          I agree to the <Text style={styles.checkboxLink}>Terms of Service</Text> and{' '}
          <Text style={styles.checkboxLink}>Privacy Policy</Text>
        </Text>
      </TouchableOpacity>

      {/* Client disclaimer */}
      {userType === 'client' && (
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreedToDisclaimer(!agreedToDisclaimer)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, agreedToDisclaimer && styles.checkboxChecked]}>
            {agreedToDisclaimer && <CheckIcon size={14} color={PsychiColors.white} />}
          </View>
          <Text style={styles.checkboxText}>
            I understand that Psychi provides peer support, not professional therapy or counseling
          </Text>
        </TouchableOpacity>
      )}

      {/* Supporter verification notice */}
      {userType === 'supporter' && (
        <View style={styles.supporterNotice}>
          <Text style={styles.supporterNoticeTitle}>Supporter Verification Required</Text>
          <Text style={styles.supporterNoticeText}>
            After signing up, you'll need to complete our verification process and training program before being matched with clients.
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={userType === 'supporter' ? ['#E4C4F0', '#D4B0E8'] : Gradients.primaryButton}
          style={styles.primaryButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color={userType === 'supporter' ? PsychiColors.textPrimary : PsychiColors.white} />
          ) : (
            <Text style={[styles.primaryButtonText, userType === 'supporter' && { color: PsychiColors.textPrimary }]}>
              Create Account
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render password reset form
  const renderReset = () => (
    <View style={styles.formContent}>
      {renderMessages()}

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Enter your email"
          placeholderTextColor={PsychiColors.textSoft}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={Gradients.primaryButton}
          style={styles.primaryButtonGradient}
        >
          {loading ? (
            <ActivityIndicator color={PsychiColors.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Send Reset Link</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Render content based on mode and step
  const renderContent = () => {
    if (mode === 'signin') {
      return renderSignIn();
    }
    if (mode === 'reset') {
      return renderReset();
    }
    // Signup mode
    switch (signupStep) {
      case 'role':
        return renderRoleSelect();
      case 'safety-check':
        return renderSafetyCheck();
      case 'crisis-resources':
        return renderCrisisResources();
      case 'age-verification':
        return renderAgeVerification();
      case 'supporter-disclosure':
        return renderSupporterDisclosure();
      case 'details':
        return renderDetails();
      default:
        return renderRoleSelect();
    }
  };

  // Render mode switcher footer
  const renderFooter = () => (
    <View style={styles.footer}>
      {mode === 'signin' && (
        <Text style={styles.footerText}>
          Don't have an account?{' '}
          <Text style={styles.footerLink} onPress={() => handleModeChange('signup')}>
            Sign up
          </Text>
        </Text>
      )}
      {mode === 'signup' && signupStep === 'role' && (
        <Text style={styles.footerText}>
          Already have an account?{' '}
          <Text style={styles.footerLink} onPress={() => handleModeChange('signin')}>
            Sign in
          </Text>
        </Text>
      )}
      {mode === 'reset' && (
        <Text style={styles.footerText}>
          Remember your password?{' '}
          <Text style={styles.footerLink} onPress={() => handleModeChange('signin')}>
            Sign in
          </Text>
        </Text>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderHeader()}
          {renderContent()}
          {renderFooter()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
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
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
    tintColor: PsychiColors.white,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 24,
    fontWeight: '600',
    color: PsychiColors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // Form content
  formContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  // Messages
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 184, 166, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 166, 0.4)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.error,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(135, 206, 235, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(135, 206, 235, 0.4)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  successText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.success,
  },

  // Input styles
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    color: PsychiColors.textPrimary,
    ...Shadows.soft,
  },

  // Forgot password
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.royalBlue,
  },

  // Primary button
  primaryButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadows.medium,
  },
  primaryButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  // Role cards
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.3)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  roleCardSupporter: {
    borderColor: 'rgba(228, 196, 240, 0.3)',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roleIconSupporter: {
    backgroundColor: 'rgba(228, 196, 240, 0.2)',
  },
  roleContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  roleTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: 4,
  },
  roleDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
  roleFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(176, 224, 230, 0.3)',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  roleFooterText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: PsychiColors.royalBlue,
    textAlign: 'center',
  },

  // Info/Question boxes
  infoBox: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoBoxText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  questionBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  questionText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    textAlign: 'center',
  },

  // Response buttons
  responseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.3)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadows.soft,
  },
  responseButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
  },

  // Back button
  backButton: {
    alignItems: 'center',
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  backButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '500',
    color: PsychiColors.royalBlue,
  },

  // Crisis resources
  crisisWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 132, 122, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  crisisWarningText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  crisisButton: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  crisisButtonGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  crisisNumber: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 32,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  crisisLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
    marginTop: Spacing.xs,
  },
  crisisSubtext: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  crisisSecondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  crisisSecondaryNumber: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 18,
    fontWeight: '700',
    color: PsychiColors.royalBlue,
  },
  crisisSecondaryLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    marginTop: 4,
  },
  crisisEmergencyButton: {
    borderColor: 'rgba(212, 132, 122, 0.3)',
  },
  crisisEmergencyText: {
    color: PsychiColors.error,
  },
  crisisDisclaimer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(176, 224, 230, 0.3)',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  crisisDisclaimerText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 12,
    color: PsychiColors.royalBlue,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Supporter disclosure
  supporterGreeting: {
    backgroundColor: 'rgba(228, 196, 240, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  supporterGreetingText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  disclosureBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  disclosureTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  disclosureText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  disclosureBold: {
    fontWeight: '600',
    color: PsychiColors.textPrimary,
  },
  requirementsList: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  requirementsTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  requirementItem: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 22,
  },

  // Role badge
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  roleBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleBadgeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
  },
  roleBadgeChange: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.royalBlue,
    fontWeight: '500',
  },

  // Checkbox
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PsychiColors.royalBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: PsychiColors.royalBlue,
  },
  checkboxText: {
    flex: 1,
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  checkboxLink: {
    color: PsychiColors.royalBlue,
    textDecorationLine: 'underline',
  },

  // Supporter notice
  supporterNotice: {
    backgroundColor: 'rgba(255, 184, 166, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 166, 0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  supporterNoticeTitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  supporterNoticeText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },

  // Footer
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  footerLink: {
    color: PsychiColors.royalBlue,
    fontWeight: '600',
  },
});
