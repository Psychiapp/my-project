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

const CODE_OF_CONDUCT = `
PSYCHI SUPPORTER CODE OF CONDUCT

As a Psychi Supporter, you represent our community's values of compassion, integrity, and respect. This Code of Conduct outlines the professional and ethical standards expected of all supporters.

CORE VALUES

Compassion: Approach every interaction with empathy and understanding.

Integrity: Be honest, trustworthy, and transparent in all your actions.

Respect: Honor the dignity and autonomy of every client.

Confidentiality: Protect the privacy of those who trust you with their stories.

Growth: Commit to continuous learning and self-improvement.

PROFESSIONAL CONDUCT

Appropriate Behavior:
- Maintain a professional demeanor at all times
- Be punctual for scheduled sessions
- Dress appropriately for video sessions
- Use respectful and inclusive language
- Listen actively and without judgment

Prohibited Behavior:
- Discrimination based on race, gender, sexuality, religion, disability, or any other characteristic
- Sexual harassment or inappropriate comments
- Sharing explicit content of any kind
- Using offensive, abusive, or threatening language
- Intoxication during sessions
- Soliciting personal relationships with clients

CONFIDENTIALITY

What is Confidential:
- Everything shared during sessions
- Client personal information
- Session content and topics discussed
- Client identity

Exceptions to Confidentiality:
- Imminent risk of harm to self or others
- Suspected abuse of a child or vulnerable adult
- Court order (extremely rare)

Your Responsibilities:
- Never discuss clients outside of Psychi
- Do not share session details on social media
- Do not store client information outside the platform
- Report breaches immediately

BOUNDARIES

Maintain These Boundaries:
- Keep relationships strictly professional
- Do not share personal contact information
- Do not meet clients outside the platform
- Do not accept gifts, tips, or payments outside the app
- Do not engage in dual relationships

Recognize Boundary Violations:
- Requests to meet in person
- Sharing of personal phone numbers or social media
- Romantic or flirtatious behavior
- Requests for special treatment

How to Respond:
- Gently redirect the conversation
- Remind clients of platform guidelines
- Report persistent violations

SCOPE OF PRACTICE

Within Your Scope:
- Active listening and emotional support
- Asking open-ended questions
- Validating feelings and experiences
- Sharing coping strategies and resources
- Encouraging professional help when needed

Outside Your Scope:
- Diagnosing mental health conditions
- Prescribing or recommending medications
- Providing therapy or clinical treatment
- Giving legal, medical, or financial advice
- Crisis intervention (direct to 988)

SELF-CARE

Your Wellbeing Matters:
- Set realistic availability limits
- Take breaks between sessions
- Process difficult sessions with peers
- Recognize signs of burnout
- Seek support when needed

Signs of Burnout:
- Emotional exhaustion
- Reduced empathy
- Dreading sessions
- Difficulty sleeping
- Feeling ineffective

ACCOUNTABILITY

Reporting Concerns:
- Report violations to psychiapp@outlook.com
- Reports are handled confidentially
- No retaliation for good-faith reports

Consequences of Violations:
- Warning for minor infractions
- Suspension for serious violations
- Permanent removal for severe or repeated violations

Appeals:
- You may appeal disciplinary actions
- Contact psychiapp@outlook.com within 14 days

AGREEMENT

By serving as a Psychi Supporter, you agree to:
- Uphold this Code of Conduct
- Complete required training
- Maintain confidentiality
- Seek help when facing challenges
- Report violations you witness
- Prioritize client wellbeing

Thank you for your commitment to supporting others with integrity and compassion.

Questions? Contact psychiapp@outlook.com
`;

export default function CodeOfConductScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Code of Conduct' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Code of Conduct</Text>
          <Text style={styles.content}>{CODE_OF_CONDUCT}</Text>
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
