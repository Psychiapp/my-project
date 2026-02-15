import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const PRIVACY_POLICY = `
Last Updated: January 2025

INTRODUCTION

Psychi ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.

INFORMATION WE COLLECT

Personal Information You Provide:
- Account Information: Name, email address, phone number, and password when you create an account
- Profile Information: Profile photo, bio, and preferences you choose to share
- Payment Information: Payment method details processed securely through Stripe (we do not store full card numbers)
- Communication Data: Messages exchanged during peer support sessions
- Verification Documents: For peer supporters, identity verification documents including government-issued ID

Information Collected Automatically:
- Device Information: Device type, operating system, unique device identifiers
- Usage Data: App features used, session duration, interaction patterns
- Log Data: IP address, access times, app crashes, and system activity

HOW WE USE YOUR INFORMATION

We use the information we collect to:
- Provide, maintain, and improve our peer support services
- Process payments and prevent fraud
- Match clients with appropriate peer supporters
- Send service-related notifications and reminders
- Ensure platform safety and enforce community guidelines
- Comply with legal obligations
- Respond to user inquiries and support requests

DATA SECURITY

We implement industry-standard security measures including:
- End-to-end encryption for session communications
- Secure data transmission using TLS/SSL
- Regular security audits and vulnerability assessments
- Access controls limiting data access to authorized personnel
- Secure cloud infrastructure with Supabase

DATA RETENTION

- Session Messages: Chat transcripts are retained for quality assurance and safety purposes for 90 days, then permanently deleted
- Account Data: Retained while your account is active and for 30 days after deletion request
- Payment Records: Retained as required by financial regulations (typically 7 years)
- Verification Documents: Retained for the duration of supporter status plus 1 year

YOUR RIGHTS AND CHOICES

You have the right to:
- Access: Request a copy of your personal data
- Correction: Update or correct inaccurate information
- Deletion: Request deletion of your account and associated data
- Export: Download your data in a portable format
- Opt-out: Disable analytics and optional notifications

To exercise these rights, visit Settings > Privacy in the app or contact us at psychiapp@outlook.com.

THIRD-PARTY SERVICES

We use the following third-party services:
- Supabase: Database and authentication
- Stripe: Payment processing
- Daily.co: Video call infrastructure
- Expo: App infrastructure

CHILDREN'S PRIVACY

Psychi is not intended for users under 18 years of age. We do not knowingly collect personal information from children under 18.

CALIFORNIA RESIDENTS (CCPA)

California residents have additional rights under the CCPA including the right to know what personal information is collected, right to deletion, and right to opt-out of sale. We do not sell personal information to third parties.

INTERNATIONAL USERS

If you access Psychi from outside the United States, your data may be transferred to and processed in the United States.

CHANGES TO THIS POLICY

We may update this Privacy Policy periodically. We will notify you of material changes through the app or via email.

EMERGENCY SITUATIONS

In cases where there is an imminent risk of harm to yourself or others, we may share limited information with emergency services to ensure safety.

CONTACT US

For privacy-related questions or concerns:
- Email: psychiapp@outlook.com
- In-App: Settings > Help & Support > Privacy Inquiry
`;

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Privacy Policy</Text>
          <Text style={styles.content}>{PRIVACY_POLICY}</Text>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
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
  contentContainer: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    color: PsychiColors.textSecondary,
  },
});
