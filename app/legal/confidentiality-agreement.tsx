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

const CONFIDENTIALITY_AGREEMENT = `
PSYCHI
Supporter Confidentiality Agreement

1. Introduction

This Confidentiality Agreement ("Agreement") is entered into by and between Psychi ("Company," "we," "us," or "our") and you, the undersigned Supporter ("Supporter," "you," or "your"). By creating a Supporter account on the Psychi platform, you acknowledge that you have read, understood, and agree to be bound by the terms of this Agreement.

2. Definitions

"Confidential Information" means any and all information disclosed by Clients during sessions, including but not limited to:

• Personal details (name, age, location, contact information)
• Life circumstances, experiences, and personal history
• Emotional states, thoughts, feelings, and concerns shared during sessions
• Relationship details and family information
• Work, academic, or financial situations
• Any other information shared in the context of peer support sessions

"Client" means any individual who uses the Psychi platform to receive peer support services from Supporters.

"Session" means any interaction between a Supporter and Client through the Psychi platform, including chat, voice, and video communications.

3. Confidentiality Obligations

As a Supporter on the Psychi platform, you agree to the following obligations:

3.1 Non-Disclosure: You shall not disclose, publish, or otherwise reveal any Confidential Information to any third party during or after your time as a Supporter, except as expressly permitted by this Agreement or required by law.

3.2 Non-Use: You shall not use any Confidential Information for any purpose other than providing peer support services to Clients through the Psychi platform.

3.3 Protection: You shall take all reasonable measures to protect the secrecy and avoid unauthorized disclosure or use of Confidential Information.

3.4 No Recording: You shall not record, screenshot, photograph, or otherwise capture any Session content or Client information outside of the Psychi platform's built-in features.

3.5 Secure Environment: You shall ensure that Sessions are conducted in a private setting where conversations cannot be overheard by others.

4. Exceptions to Confidentiality

Notwithstanding the foregoing, Confidential Information may be disclosed in the following circumstances:

4.1 Imminent Harm: If you have reasonable belief that a Client poses an imminent risk of serious harm to themselves or others, you must immediately report this to Psychi through the platform's emergency reporting feature.

4.2 Legal Requirements: If disclosure is required by law, court order, or governmental authority, provided that you notify Psychi immediately upon becoming aware of such requirement (unless prohibited by law from doing so).

4.3 Child Abuse or Neglect: If you become aware of or reasonably suspect child abuse or neglect, you must report this to the appropriate authorities as required by applicable law and notify Psychi.

5. Duration

Your obligations under this Agreement shall remain in effect indefinitely, surviving the termination of your Supporter account or your relationship with Psychi for any reason. Confidential Information must be kept confidential permanently.

6. Consequences of Breach

Any breach of this Agreement may result in:

• Immediate termination of your Supporter account
• Forfeiture of any pending earnings
• Permanent ban from the Psychi platform
• Legal action for damages caused by the breach
• Reporting to relevant professional bodies (if applicable)

7. Acknowledgments

By agreeing to this document, you acknowledge and agree that:

a) You are not a licensed mental health professional providing therapy or clinical treatment through Psychi;

b) You are providing peer support services only and will not represent yourself as providing professional mental health services;

c) You understand the serious nature of Client confidentiality and the trust placed in you;

d) You have read, understood, and agree to comply with all terms of this Agreement;

e) Violation of this Agreement may cause irreparable harm to Clients and to Psychi.

This Agreement is effective as of the date of your account creation.

© Psychi. All rights reserved.
`;

export default function ConfidentialityAgreementScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Confidentiality Agreement' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Confidentiality Agreement</Text>
          <Text style={styles.subtitle}>For Psychi Supporters</Text>
          <Text style={styles.content}>{CONFIDENTIALITY_AGREEMENT}</Text>
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
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  content: {
    fontSize: 14,
    lineHeight: 22,
    color: PsychiColors.textSecondary,
  },
});
