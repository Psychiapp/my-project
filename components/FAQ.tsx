/**
 * FAQ Section - Exact match to web app FAQ.tsx
 * Frequently Asked Questions with expandable accordion
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { ChevronDownIcon, ChevronUpIcon } from '@/components/icons';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: screenWidth } = Dimensions.get('window');

const faqItems = [
  {
    question: 'What is Psychi?',
    answer: "Psychi is a peer support platform that connects you with trained psychology students and graduates. We're not therapy—we offer genuine human connection and support for life's everyday challenges.",
  },
  {
    question: 'Who are the supporters?',
    answer: 'Our supporters are psychology students and psychology graduates who have completed our comprehensive training program. They understand mental wellness concepts and are trained in active listening, empathy, and supportive communication.',
  },
  {
    question: 'Is this therapy or counseling?',
    answer: "No, Psychi is not therapy, counseling, or a replacement for professional mental health care. We're a peer support service for people who want someone to talk to about life's challenges. If you need professional help, we encourage you to seek licensed mental health services.",
  },
  {
    question: 'How does the matching work?',
    answer: "After you complete our brief matching quiz, we'll match you with a supporter who aligns with your preferences—communication style, areas of focus, and availability. Your matched supporter is carefully selected to be the best fit for you.",
  },
  {
    question: 'What types of sessions are available?',
    answer: 'We offer three formats: Chat sessions for text-based support, Phone calls for voice conversations, and Video chats for face-to-face connection. You can mix and match based on your comfort level.',
  },
  {
    question: 'Is my information private?',
    answer: 'Absolutely. All conversations are confidential and protected with end-to-end encryption. We never share your personal information with third parties, and supporters are bound by strict confidentiality agreements.',
  },
  {
    question: 'What if I need immediate crisis support?',
    answer: 'If you\'re experiencing a mental health crisis, please contact emergency services or call 988 (Suicide & Crisis Lifeline). Psychi is not equipped to handle emergencies. Text HOME to 741741 to reach the Crisis Text Line.',
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <View style={[styles.faqItem, isOpen && styles.faqItemOpen]}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={styles.question}>{question}</Text>
        <View style={styles.iconWrapper}>
          {isOpen ? (
            <ChevronUpIcon size={20} color={PsychiColors.royalBlue} />
          ) : (
            <ChevronDownIcon size={20} color={PsychiColors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>FAQ</Text>
        <Text style={styles.title}>
          Common{' '}
          <Text style={styles.titleAccent}>questions</Text>
        </Text>
        <Text style={styles.subtitle}>
          Everything you need to know about Psychi
        </Text>
      </View>

      {/* FAQ Items */}
      <View style={styles.faqContainer}>
        {faqItems.map((item, index) => (
          <FAQItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </View>

      {/* Contact Note */}
      <View style={styles.contactContainer}>
        <Text style={styles.contactText}>
          Have more questions?{' '}
          <Text style={styles.contactLink}>Contact us</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    backgroundColor: PsychiColors.pureWhite,
  },

  // Header styles
  header: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  sectionLabel: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    color: PsychiColors.royalBlue,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 28 : 32,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  titleAccent: {
    color: PsychiColors.royalBlue,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
  },

  // FAQ container
  faqContainer: {
    gap: Spacing.md,
  },

  // FAQ Item styles
  faqItem: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    ...Shadows.soft,
  },
  faqItemOpen: {
    borderColor: PsychiColors.royalBlue,
    borderWidth: 1,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  question: {
    flex: 1,
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: PsychiColors.textPrimary,
    paddingRight: Spacing.md,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: 0,
  },
  answer: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
    lineHeight: 24,
  },

  // Contact section
  contactContainer: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  contactText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textSecondary,
  },
  contactLink: {
    color: PsychiColors.royalBlue,
    fontWeight: '600',
  },
});
