import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  MailIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AlertIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@/components/icons';
import { ExternalUrls, Config } from '@/constants/config';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: 'How do sessions work?',
      answer: 'Sessions connect you with trained peer supporters for chat, phone, or video conversations. Each session is private and end-to-end encrypted for your safety.',
    },
    {
      question: 'Are supporters licensed therapists?',
      answer: 'No, our supporters are trained peers, not licensed therapists. They provide empathetic listening and support, but cannot diagnose or treat mental health conditions. For clinical care, please consult a licensed professional.',
    },
    {
      question: 'How is my privacy protected?',
      answer: 'All sessions use end-to-end encryption. Your conversations are never stored on our servers and cannot be accessed by anyone except you and your supporter during the session.',
    },
    {
      question: 'How am I matched with a supporter?',
      answer: 'After completing our matching quiz, we pair you with a supporter who aligns with your preferences, communication style, and areas of focus. Your matched supporter is carefully selected to be the best fit for your needs.',
    },
    {
      question: 'What if I need to cancel a session?',
      answer: 'You can cancel sessions up to 4 hours before the scheduled time for a full refund. Cancellations within 4 hours may be subject to fees.',
    },
    {
      question: 'How do subscription plans work?',
      answer: 'Subscription plans give you a set number of sessions per month at a discounted rate. Unused sessions do not roll over. You can cancel or change your plan at any time.',
    },
  ];


  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={PsychiColors.azure} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Emergency Notice */}
        <View style={styles.section}>
          <View style={styles.emergencyCard}>
            <AlertIcon size={24} color={PsychiColors.error} />
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>In Crisis?</Text>
              <Text style={styles.emergencyText}>
                If you're in immediate danger or having thoughts of self-harm, please contact emergency services or a crisis hotline.
              </Text>
              <TouchableOpacity
                style={styles.crisisButton}
                onPress={() => Linking.openURL('tel:988')}
              >
                <Text style={styles.crisisButtonText}>Call 988 (Suicide & Crisis Lifeline)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity
            style={styles.emailCard}
            onPress={() => Linking.openURL(`mailto:${ExternalUrls.supportEmail}`)}
            activeOpacity={0.7}
          >
            <MailIcon size={24} color={PsychiColors.azure} />
            <View style={styles.emailContent}>
              <Text style={styles.emailTitle}>Email Support</Text>
              <Text style={styles.emailDescription}>{ExternalUrls.supportEmail}</Text>
            </View>
            <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqContainer}>
            {faqItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.faqCard,
                  index < faqItems.length - 1 && styles.faqCardBorder,
                ]}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{item.question}</Text>
                  {expandedFaq === index ? (
                    <ChevronUpIcon size={20} color={PsychiColors.azure} />
                  ) : (
                    <ChevronDownIcon size={20} color={PsychiColors.azure} />
                  )}
                </View>
                {expandedFaq === index && (
                  <Text style={styles.faqAnswer}>{item.answer}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* App Info */}
        <View style={styles.section}>
          <View style={styles.appInfoCard}>
            <Text style={styles.appName}>{Config.appName}</Text>
            <Text style={styles.appVersion}>Version 1.0.0</Text>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={() => Linking.openURL(ExternalUrls.instagram)}
            >
              <Text style={styles.socialButtonText}>Follow us on Instagram</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: PsychiColors.textSecondary,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
    fontFamily: 'Georgia',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  emergencyIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PsychiColors.error,
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  crisisButton: {
    backgroundColor: PsychiColors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignSelf: 'flex-start',
  },
  crisisButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  emailContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  emailTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  emailDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  faqContainer: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.soft,
  },
  faqCard: {
    padding: Spacing.md,
  },
  faqCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginRight: Spacing.sm,
  },
  faqToggle: {
    fontSize: 24,
    color: PsychiColors.azure,
    fontWeight: '300',
  },
  faqAnswer: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 21,
    marginTop: Spacing.sm,
  },
  appInfoCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.soft,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  appVersion: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  socialButton: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
});
