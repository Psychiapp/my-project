/**
 * Welcome/Landing Screen - Exact match to web app landing page
 * Full scrollable landing page with all sections
 */

import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PsychiColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';

// Import all section components
import Hero from '@/components/Hero';
import SupportTypes from '@/components/SupportTypes';
import PricingSection from '@/components/PricingSection';
import TrustSection from '@/components/TrustSection';
import AboutSection from '@/components/AboutSection';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import OnboardingModal from '@/components/OnboardingModal';

// Key for storing quiz preferences before account creation
export const PENDING_QUIZ_PREFERENCES_KEY = 'pending_quiz_preferences';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const { isAuthenticated, profile } = useAuth();
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Track section positions for scrolling
  const sectionPositions = useRef<{ [key: string]: number }>({});

  // Navigate to dashboard based on user role
  const goToDashboard = () => {
    if (profile?.role === 'supporter') {
      router.push('/(supporter)');
    } else {
      router.push('/(client)');
    }
  };

  const handleTakeQuiz = () => {
    if (isAuthenticated) {
      goToDashboard();
    } else {
      // Show the onboarding modal for unauthenticated users
      setShowOnboardingModal(true);
    }
  };

  const handleQuizComplete = async (preferences: any) => {
    // Save preferences to AsyncStorage for retrieval after sign-up
    await AsyncStorage.setItem(PENDING_QUIZ_PREFERENCES_KEY, JSON.stringify(preferences));
    setShowOnboardingModal(false);
    // Navigate to sign-up page - preferences will be applied after account creation
    router.push('/(auth)/sign-up');
  };

  const handleLearnMore = () => {
    // Scroll to FAQ section
    handleScrollToSection('faq');
  };

  const handleSignIn = () => {
    if (isAuthenticated) {
      goToDashboard();
    } else {
      router.push('/(auth)/sign-in');
    }
  };

  const handleSignUp = () => {
    if (isAuthenticated) {
      goToDashboard();
    } else {
      router.push('/(auth)/sign-up');
    }
  };

  const handleSelectSupportType = (type: 'chat' | 'phone' | 'video') => {
    console.log('Selected support type:', type);
    if (isAuthenticated) {
      goToDashboard();
    } else {
      router.push('/(auth)/sign-up');
    }
  };

  const handleSelectPlan = (planId: string) => {
    console.log('Selected plan:', planId);
    if (isAuthenticated) {
      goToDashboard();
    } else {
      router.push('/(auth)/sign-up');
    }
  };

  const handleFooterNavigate = (screen: string) => {
    console.log('Navigate to:', screen);
    // Handle navigation based on screen name
    if (screen === 'about') {
      // For now, scroll to top as a placeholder
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleScrollToSection = (section: string) => {
    const position = sectionPositions.current[section];
    if (position !== undefined) {
      scrollViewRef.current?.scrollTo({ y: position, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* Hero Section */}
        <Hero
          onTakeQuiz={handleTakeQuiz}
          onLearnMore={handleLearnMore}
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
        />

        {/* Support Types Section - "How It Works" */}
        <View
          onLayout={(e) => {
            sectionPositions.current['how-it-works'] = e.nativeEvent.layout.y;
          }}
        >
          <SupportTypes
            onSelectType={handleSelectSupportType}
          />
        </View>

        {/* Pricing Section */}
        <View
          onLayout={(e) => {
            sectionPositions.current['pricing'] = e.nativeEvent.layout.y;
          }}
        >
          <PricingSection
            onSelectPlan={handleSelectPlan}
          />
        </View>

        {/* Trust Section */}
        <TrustSection />

        {/* About Section */}
        <View
          onLayout={(e) => {
            sectionPositions.current['about'] = e.nativeEvent.layout.y;
          }}
        >
          <AboutSection onGetStarted={handleSignUp} />
        </View>

        {/* FAQ Section */}
        <View
          onLayout={(e) => {
            sectionPositions.current['faq'] = e.nativeEvent.layout.y;
          }}
        >
          <FAQ />
        </View>

        {/* Footer */}
        <Footer
          onNavigate={handleFooterNavigate}
          onScrollToSection={handleScrollToSection}
        />
      </ScrollView>

      {/* Onboarding Modal for unauthenticated users */}
      <OnboardingModal
        visible={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
        onComplete={handleQuizComplete}
      />
    </View>
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
});
