/**
 * Welcome/Landing Screen - Exact match to web app landing page
 * Full scrollable landing page with all sections
 */

import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PsychiColors } from '@/constants/theme';

// Import all section components
import Hero from '@/components/Hero';
import SupportTypes from '@/components/SupportTypes';
import PricingSection from '@/components/PricingSection';
import TrustSection from '@/components/TrustSection';
import AboutSection from '@/components/AboutSection';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Track section positions for scrolling
  const sectionPositions = useRef<{ [key: string]: number }>({});

  const handleTakeQuiz = () => {
    // Navigate to sign up / onboarding
    router.push('/(auth)/sign-up');
  };

  const handleLearnMore = () => {
    // Scroll to FAQ section
    handleScrollToSection('faq');
  };

  const handleSignIn = () => {
    router.push('/(auth)/sign-in');
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  const handleSelectSupportType = (type: 'chat' | 'phone' | 'video') => {
    console.log('Selected support type:', type);
    router.push('/(auth)/sign-up');
  };

  const handleSelectPlan = (planId: string) => {
    console.log('Selected plan:', planId);
    router.push('/(auth)/sign-up');
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
