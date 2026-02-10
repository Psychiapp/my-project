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

const DIVERSION_ADVICE = `
CRISIS DIVERSION GUIDE

This guide helps you recognize when a client needs professional help and how to safely redirect them to appropriate resources.

KNOW YOUR LIMITS

As a peer supporter, you provide emotional support - not crisis intervention. When a situation escalates beyond peer support, your role is to:
- Recognize the signs
- Stay calm
- Connect them with professional resources
- Follow up with Psychi support

CRISIS WARNING SIGNS

Immediate Danger (Call 911):
- Active suicide attempt in progress
- Stating they have a plan and means to harm themselves
- Threatening violence toward others
- Medical emergency

High Risk (Direct to 988):
- Expressing suicidal thoughts
- Talking about wanting to die or not wanting to live
- Feeling hopeless or having no reason to live
- Feeling trapped or in unbearable pain
- Talking about being a burden to others
- Increasing use of alcohol or drugs
- Withdrawing from activities
- Giving away prized possessions

Elevated Concern:
- Significant mood changes
- Expressing feelings of isolation
- Recent major loss or trauma
- History of previous attempts

HOW TO RESPOND

Step 1: Stay Calm
- Your calm presence is stabilizing
- Take a breath before responding
- Speak slowly and clearly

Step 2: Listen and Validate
- "I hear how much pain you're in"
- "Thank you for trusting me with this"
- "Your feelings are valid"

Step 3: Ask Directly
- "Are you thinking about hurting yourself?"
- "Are you having thoughts of suicide?"
- Asking directly does NOT plant ideas

Step 4: Assess Safety
- Do they have a plan?
- Do they have access to means?
- Have they attempted before?
- Are they alone?

Step 5: Connect to Resources
- For immediate danger: "Please call 911 right now"
- For suicidal thoughts: "Please call or text 988"
- Stay on the line while they connect

Step 6: Alert Psychi
- Email psychiapp@outlook.com with your concerns
- Do this even if the client says they're okay

CRISIS RESOURCES

Emergency: 911

988 Suicide & Crisis Lifeline:
- Call or text 988
- Available 24/7
- Free and confidential

Crisis Text Line:
- Text HOME to 741741
- Available 24/7

International Association for Suicide Prevention:
- https://www.iasp.info/resources/Crisis_Centres/

WHAT NOT TO DO

- Do not promise to keep suicidal thoughts secret
- Do not leave them alone if in immediate danger
- Do not argue whether suicide is right or wrong
- Do not act shocked or judgmental
- Do not try to be their therapist
- Do not take responsibility for their choices

AFTER A CRISIS CONVERSATION

Take Care of Yourself:
- These conversations are emotionally heavy
- Take a break before your next session
- Reach out to a peer for debriefing
- Contact psychiapp@outlook.com if you need support

Follow Up:
- Alert Psychi Safety Team
- Document the interaction (without personal details)
- Check in with the client in a future session if appropriate

REMEMBER

You are not responsible for saving anyone. Your role is to:
- Be present
- Show compassion
- Connect them with professional help
- Take care of yourself

Crisis situations are handled by trained professionals. By recognizing the signs and directing clients to appropriate resources, you are doing exactly what you should do.

If you ever feel overwhelmed, reach out to psychiapp@outlook.com. You don't have to handle difficult situations alone.
`;

export default function DiversionAdviceScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Diversion Advice' }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Diversion Advice</Text>
          <Text style={styles.subtitle}>Crisis Recognition & Response Guide</Text>
          <Text style={styles.content}>{DIVERSION_ADVICE}</Text>
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
