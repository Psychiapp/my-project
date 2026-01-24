/**
 * Hero Section - Exact match to web app Hero.tsx
 * "Mental support that's accessible for everyone"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaskedView from '@react-native-masked-view/masked-view';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';

const { width: screenWidth } = Dimensions.get('window');

// Import the logo
const logoImage = require('@/assets/images/logo.png');

interface HeroProps {
  onTakeQuiz: () => void;
  onLearnMore: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  hasCompletedOnboarding?: boolean;
}

export default function Hero({ onTakeQuiz, onLearnMore, onSignIn, onSignUp, hasCompletedOnboarding = false }: HeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Background - cream base */}
      <View style={styles.backgroundGradient}>
        {/* Atmospheric background effect */}
        <View style={styles.atmosphericBg} />
      </View>

      {/* Header Bar - Logo left, Auth buttons right */}
      <View style={styles.headerBar}>
        {/* Logo */}
        <Image
          source={logoImage}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        {/* Auth Buttons */}
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={onSignIn}
            activeOpacity={0.7}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpButton}
            onPress={onSignUp}
            activeOpacity={0.7}
          >
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Content */}
      <View style={styles.content}>
        {/* Main Headline */}
        <View style={styles.headlineContainer}>
          {/* Line 1: "Mental support" - italic */}
          <Text style={styles.headlineItalic}>Mental support</Text>

          {/* Line 2: "that's accessible for everyone" with gradient on "accessible" */}
          <View style={styles.headlineRow}>
            <Text style={styles.headlineLight}>that's </Text>
            {/* Gradient text for "accessible" */}
            <MaskedView
              maskElement={
                <Text style={styles.headlineGradientText}>accessible</Text>
              }
            >
              <LinearGradient
                colors={Gradients.heroText}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientTextBg}
              >
                <Text style={[styles.headlineGradientText, { opacity: 0 }]}>accessible</Text>
              </LinearGradient>
            </MaskedView>
          </View>

          {/* Line 3: "for everyone" */}
          <Text style={styles.headlineBold}>for everyone</Text>
        </View>

        {/* Subheadline */}
        <Text style={styles.subheadline}>
          Connect with our trained supporters through messaging, calls, or video chat. Not therapy—just genuine human connection when you need it most.
        </Text>

        {/* CTA Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Primary Button - Take Matching Quiz */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onTakeQuiz}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>
              {hasCompletedOnboarding ? 'Get matched with supporter' : 'Take Matching Quiz'}
            </Text>
          </TouchableOpacity>

          {/* Secondary Button - Learn How It Works */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onLearnMore}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Learn How It Works</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: Dimensions.get('window').height * 0.85,
    backgroundColor: PsychiColors.cream,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['3xl'],
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  atmosphericBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PsychiColors.cream,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLogo: {
    width: 100,
    height: 100,
  },
  authButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  signInButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  signInText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  signUpButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
  },
  signUpText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },

  // Headline styles - matching web Crimson Pro font
  headlineContainer: {
    marginBottom: Spacing.lg,
  },
  headlineItalic: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 36 : 44,
    fontWeight: '500',
    fontStyle: 'italic',
    color: PsychiColors.midnight,
    lineHeight: screenWidth < 380 ? 42 : 50,
    letterSpacing: -1,
  },
  headlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
  },
  headlineLight: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 36 : 44,
    fontWeight: '300',
    color: PsychiColors.midnight,
    lineHeight: screenWidth < 380 ? 42 : 50,
    letterSpacing: -1,
  },
  headlineGradientText: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 36 : 44,
    fontWeight: '500',
    lineHeight: screenWidth < 380 ? 42 : 50,
    letterSpacing: -1,
  },
  gradientTextBg: {
    // Container for the gradient behind masked text
  },
  headlineBold: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 36 : 44,
    fontWeight: '500',
    color: PsychiColors.midnight,
    lineHeight: screenWidth < 380 ? 42 : 50,
    letterSpacing: -1,
  },

  // Subheadline - matching web Inter font
  subheadline: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.lg,
    lineHeight: 28,
    color: PsychiColors.textBody,
    marginBottom: Spacing['2xl'],
  },

  // Buttons container
  buttonsContainer: {
    gap: Spacing.md,
  },

  // Primary button - matching .btn-premium from web
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: PsychiColors.royalBlue,
    backgroundColor: 'transparent',
    alignItems: 'center',
    ...Shadows.button,
  },
  primaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.royalBlue,
    letterSpacing: 0.3,
  },

  // Secondary button - matching .btn-glass from web
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: PsychiColors.royalBlue,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.royalBlue,
    letterSpacing: 0.3,
  },
});
