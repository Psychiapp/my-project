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

const SUPPORTER_HANDBOOK = `
WELCOME TO PSYCHI

Thank you for joining Psychi as a peer supporter. This handbook provides essential guidance for providing compassionate, effective peer support while maintaining appropriate boundaries.

YOUR ROLE AS A PEER SUPPORTER

As a Psychi supporter, you are:
- A trained peer who provides emotional support and active listening
- A compassionate presence during difficult moments
- A guide to help clients explore their thoughts and feelings

You are NOT:
- A licensed therapist, counselor, or medical professional
- Able to diagnose conditions or prescribe treatments
- A crisis intervention specialist (redirect to 988 for emergencies)

SESSION PROTOCOLS

Before Each Session:
- Find a quiet, private space
- Test your audio/video if applicable
- Review any notes from previous sessions with the client
- Center yourself and prepare to be fully present

During the Session:
- Greet the client warmly
- Ask open-ended questions
- Practice active listening
- Reflect back what you hear
- Validate their emotions
- Avoid giving direct advice unless asked

After the Session:
- Allow a few minutes for self-care
- Note any follow-up items (without recording personal details)
- Debrief with a peer if the session was challenging

COMMUNICATION TECHNIQUES

Active Listening:
- Give your full attention
- Use verbal acknowledgments ("I hear you", "That makes sense")
- Avoid interrupting
- Ask clarifying questions

Reflective Responses:
- "It sounds like you're feeling..."
- "What I'm hearing is..."
- "That must be really difficult"

Open-Ended Questions:
- "How did that make you feel?"
- "What do you think would help?"
- "Can you tell me more about that?"

PROFESSIONAL BOUNDARIES

Maintain Clear Boundaries:
- Keep the relationship professional
- Do not share personal contact information
- Do not meet clients outside the platform
- Do not accept gifts or payments outside the app
- Do not engage in romantic or sexual conversations

Confidentiality:
- Everything shared in sessions is confidential
- Only break confidentiality if there's imminent danger
- Do not discuss clients with anyone outside Psychi
- Do not share session details on social media

Self-Care:
- Set limits on your availability
- Take breaks between sessions
- Seek support when sessions are emotionally challenging
- Recognize signs of burnout

HANDLING DIFFICULT SITUATIONS

If a Client is Upset:
- Remain calm and present
- Validate their feelings
- Give them space to express themselves
- Do not take their emotions personally

If a Client Mentions Self-Harm or Suicide:
- Take it seriously
- Ask directly: "Are you thinking of hurting yourself?"
- If in immediate danger, direct them to call 988 or 911
- Alert Psychi Safety Team at psychiapp@outlook.com

If You Feel Unsafe:
- You may end the session at any time
- Report concerns to psychiapp@outlook.com
- Block users who violate community guidelines

GETTING SUPPORT

You are not alone. Reach out for help when needed:
- Email: psychiapp@outlook.com
- Regular peer consultation with other supporters
- Training refreshers available anytime

THANK YOU

Your dedication to helping others makes a real difference. Remember to take care of yourself as you care for others.

With gratitude,
The Psychi Team
`;

export default function SupporterHandbookScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Supporter Handbook' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Supporter Handbook</Text>
          <Text style={styles.content}>{SUPPORTER_HANDBOOK}</Text>
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
