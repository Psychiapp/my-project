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

const TERMS_OF_SERVICE = `
Last Updated: January 2025

AGREEMENT TO TERMS

By accessing or using Psychi ("the App"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the App.

DESCRIPTION OF SERVICE

Psychi is a peer support platform connecting individuals seeking emotional support with trained peer supporters.

IMPORTANT DISCLAIMERS:
- Psychi is NOT a substitute for professional mental health treatment
- Peer supporters are NOT licensed therapists, counselors, or medical professionals
- In case of emergency, call 911 or your local emergency services
- For crisis support, contact the 988 Suicide & Crisis Lifeline

ELIGIBILITY

To use Psychi, you must:
- Be at least 18 years of age
- Be capable of forming a binding contract
- Not be prohibited from using the service under applicable laws
- Provide accurate, current, and complete registration information

USER ACCOUNTS

You are responsible for:
- Maintaining the confidentiality of your account credentials
- All activities that occur under your account
- Notifying us immediately of any unauthorized access

Account Types:
- Clients: Individuals seeking peer support services
- Peer Supporters: Trained individuals providing peer support (subject to verification and approval)
- Administrators: Psychi staff managing the platform

PEER SUPPORTER REQUIREMENTS

Peer supporters must:
- Complete Psychi's training and verification process
- Maintain appropriate boundaries with clients
- Follow all community guidelines and safety protocols
- Not provide medical, legal, or professional advice
- Report safety concerns through proper channels
- Maintain confidentiality of client information

PROHIBITED CONDUCT

You agree NOT to:
- Provide false information or impersonate others
- Harass, abuse, or harm other users
- Share explicit, violent, or illegal content
- Solicit personal relationships outside the platform
- Share session content with third parties
- Attempt to circumvent safety features
- Use the service for commercial purposes without authorization
- Violate any applicable laws or regulations

PAYMENTS AND REFUNDS

Session Payments:
- All payments are processed securely through Stripe
- Prices are displayed before booking confirmation
- Platform fees and supporter compensation are disclosed in the app

Refund Policy:
- Cancellations 24+ hours before session: Full refund
- Cancellations 2-24 hours before session: 50% refund
- Cancellations less than 2 hours before session: No refund
- No-show by supporter: Full refund plus service credit

Subscriptions:
- Subscription terms and pricing are displayed at purchase
- You may cancel subscriptions at any time through your account settings
- Cancellation takes effect at the end of the current billing period

INTELLECTUAL PROPERTY

- Psychi and its content are protected by copyright and trademark laws
- You retain ownership of content you create
- By posting content, you grant Psychi a license to use it for service operation

PRIVACY

Your use of Psychi is subject to our Privacy Policy. By using the App, you consent to our collection and use of data as described therein.

SAFETY AND REPORTING

Emergency Protocol:
If you or someone else is in immediate danger:
1. Call 911 or local emergency services
2. Contact the 988 Suicide & Crisis Lifeline

Reporting Concerns:
- Contact Psychi at psychiapp@outlook.com to report inappropriate behavior
- Reports are reviewed within 24 hours
- False reports may result in account suspension

LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW:
- Psychi provides the service "AS IS" without warranties
- We are not liable for actions of users or peer supporters
- We are not liable for indirect, incidental, or consequential damages
- Our total liability shall not exceed the amount paid for services in the past 12 months

INDEMNIFICATION

You agree to indemnify and hold harmless Psychi and its officers, directors, employees, and agents from any claims arising from your use of the service or violation of these terms.

DISPUTE RESOLUTION

Before filing a claim, you agree to contact us at legal@psychi.app to attempt informal resolution. Any disputes not resolved informally shall be resolved by binding arbitration.

GOVERNING LAW

These terms are governed by the laws of the State of Delaware, without regard to conflict of law principles.

MODIFICATIONS TO SERVICE

We reserve the right to modify or discontinue features at any time, update these terms with notice to users, and suspend accounts that violate these terms.

TERMINATION

We may terminate or suspend your account for violation of these terms, conduct harmful to other users, or suspected fraudulent activity.

CONTACT INFORMATION

For questions about these terms:
- Email: legal@psychi.app
- In-App: Settings > Help & Support > Legal Inquiry

ACKNOWLEDGMENT

BY USING PSYCHI, YOU ACKNOWLEDGE THAT:
- You have read and understood these Terms of Service
- You agree to be bound by these terms
- You understand Psychi is not a substitute for professional mental health care
`;

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Terms of Service' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Terms of Service</Text>
          <Text style={styles.content}>{TERMS_OF_SERVICE}</Text>
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
