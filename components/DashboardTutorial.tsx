import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import {
  HomeIcon,
  ChartIcon,
  CalendarIcon,
  VideoIcon,
  ChatIcon,
  ProfileIcon,
  CheckCircleIcon,
  HeartIcon,
  UsersIcon,
  DollarIcon,
  BankIcon,
  BookIcon,
  ClipboardIcon,
  LightbulbIcon,
  ChevronRightIcon,
} from '@/components/icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type IconName = 'home' | 'chart' | 'calendar' | 'video' | 'chat' | 'profile' | 'check' | 'heart' | 'users' | 'dollar' | 'bank' | 'book' | 'clipboard';

const IconMap: Record<IconName, React.FC<{ size?: number; color?: string }>> = {
  home: HomeIcon,
  chart: ChartIcon,
  calendar: CalendarIcon,
  video: VideoIcon,
  chat: ChatIcon,
  profile: ProfileIcon,
  check: CheckCircleIcon,
  heart: HeartIcon,
  users: UsersIcon,
  dollar: DollarIcon,
  bank: BankIcon,
  book: BookIcon,
  clipboard: ClipboardIcon,
};

interface TutorialStep {
  title: string;
  description: string;
  icon: IconName;
  tip?: string;
}

interface DashboardTutorialProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  userType: 'client' | 'supporter';
  userName?: string;
}

const clientSteps: TutorialStep[] = [
  {
    title: 'Welcome to Your Dashboard',
    description: 'This is your personal space to manage your mental wellness journey. From here, you can book sessions, track your progress, and connect with supporters.',
    icon: 'home',
    tip: 'You can always return to this tutorial from your profile settings.',
  },
  {
    title: 'Overview Tab',
    description: 'Your dashboard overview shows a snapshot of your upcoming sessions, recent activity, and quick actions. Check here daily to stay on top of your wellness journey.',
    icon: 'chart',
    tip: 'The overview updates in real-time with your latest session information.',
  },
  {
    title: 'Book a Session',
    description: 'Ready to connect? Schedule chat, phone, or video sessions with your matched supporter at times that work for you.',
    icon: 'calendar',
    tip: 'Your supporter is matched to you based on your preferences and needs.',
  },
  {
    title: 'Your Sessions',
    description: 'The Sessions tab shows all your upcoming and past sessions. You can join sessions, reschedule if needed, and view session history to track your progress.',
    icon: 'video',
    tip: 'Cancel 24+ hours before for full refund, 2-24 hours for 50% refund, or less than 2 hours with no refund.',
  },
  {
    title: 'Session Types',
    description: 'We offer three types of sessions to fit your comfort level: Chat for text-based support, Phone for voice calls, and Video for face-to-face connection.',
    icon: 'chat',
  },
  {
    title: 'Your Profile',
    description: 'Keep your profile updated in the Profile tab. This helps supporters understand your needs better and provide more personalized support.',
    icon: 'profile',
    tip: 'Your preferences help us match you with the right supporters.',
  },
  {
    title: "You're All Set!",
    description: "You're ready to start your wellness journey! Remember, our peer supporters are here to listen, support, and help you navigate life's challenges.",
    icon: 'check',
    tip: 'Questions? Email us at psychiapp@outlook.com',
  },
];

const supporterSteps: TutorialStep[] = [
  {
    title: 'Welcome to Your Supporter Dashboard',
    description: 'Congratulations on becoming a Psychi supporter! This dashboard is your command center for managing sessions, tracking earnings, and supporting clients.',
    icon: 'heart',
    tip: 'Check your dashboard daily to stay on top of new session requests.',
  },
  {
    title: 'Overview Tab',
    description: "Your dashboard overview shows today's sessions, recent earnings, client activity, and key metrics at a glance. Check here regularly to stay organized.",
    icon: 'chart',
    tip: 'The overview refreshes automatically to show your latest activity.',
  },
  {
    title: 'Set Your Availability',
    description: 'Use the Schedule tab to set when you\'re available for sessions. Clients can only book during your available time slots.',
    icon: 'calendar',
    tip: "Set realistic availability - it's better to be consistently available than to cancel sessions.",
  },
  {
    title: 'Manage Sessions',
    description: 'The Sessions tab shows all your upcoming and completed sessions. View session details, start sessions when it\'s time, and add private notes.',
    icon: 'video',
    tip: 'Session notes are private and only visible to you - use them to track client progress.',
  },
  {
    title: 'Your Clients',
    description: "Track all clients you've worked with. View session history, notes, and maintain continuity of care across multiple sessions.",
    icon: 'users',
    tip: 'Building rapport with repeat clients leads to better outcomes and higher ratings.',
  },
  {
    title: 'Track Earnings',
    description: 'The Earnings tab shows your income breakdown. You earn 75% of every session payment. View daily, weekly, and monthly earnings.',
    icon: 'dollar',
    tip: 'Chat: $5.25 | Phone: $11.25 | Video: $15.00 per session (your 75% share).',
  },
  {
    title: 'Payouts',
    description: 'Set up your bank account in Payout Settings to receive earnings. Choose weekly or monthly automatic payouts.',
    icon: 'bank',
    tip: 'Connect your bank account through Stripe for secure, fast payouts.',
  },
  {
    title: 'Complete Training',
    description: 'The Training tab contains essential modules on peer support skills. Complete all modules to enhance your effectiveness.',
    icon: 'book',
    tip: 'Training covers mindfulness, CBT basics, crisis recognition, and more.',
  },
  {
    title: 'Resources',
    description: 'The Resources section provides quick access to supporter guidelines, crisis protocols, and helpful materials.',
    icon: 'clipboard',
    tip: 'Bookmark the crisis protocol - knowing when to escalate is crucial.',
  },
  {
    title: "You're Ready to Support!",
    description: "You have everything you need to make a real difference in people's lives. Remember: listen with empathy, maintain boundaries, and take care of yourself too.",
    icon: 'check',
    tip: 'Questions? Email us at psychiapp@outlook.com',
  },
];

export default function DashboardTutorial({
  visible,
  onClose,
  onComplete,
  userType,
  userName,
}: DashboardTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = userType === 'client' ? clientSteps : supporterSteps;
  const totalSteps = steps.length;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setCurrentStep(0);
    onComplete();
  };

  const handleSkip = () => {
    setCurrentStep(0);
    onClose();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;
  const isFirstStep = currentStep === 0;

  const gradientColors = userType === 'client'
    ? [PsychiColors.sky, PsychiColors.royalBlue, PsychiColors.sapphire] as const
    : [PsychiColors.peach, PsychiColors.lavender, PsychiColors.violet] as const;

  const accentColor = userType === 'client' ? PsychiColors.royalBlue : PsychiColors.violet;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with gradient */}
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Skip button */}
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip Tutorial</Text>
            </TouchableOpacity>

            {/* Progress dots */}
            <View style={styles.progressDots}>
              {steps.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setCurrentStep(index)}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                    index < currentStep && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Step counter */}
            <Text style={styles.stepCounter}>
              Step {currentStep + 1} of {totalSteps}
            </Text>

            {/* Icon */}
            <View style={styles.iconContainer}>
              {(() => {
                const IconComponent = IconMap[step.icon];
                return <IconComponent size={32} color="#fff" />;
              })()}
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Welcome message for first step */}
            {isFirstStep && userName && (
              <Text style={[styles.welcomeText, { color: accentColor }]}>
                Hi {userName}!
              </Text>
            )}

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>

            {/* Tip box */}
            {step.tip && (
              <View style={[
                styles.tipBox,
                { backgroundColor: userType === 'client' ? 'rgba(135, 206, 235, 0.15)' : 'rgba(228, 196, 240, 0.2)' }
              ]}>
                <View style={styles.tipIconContainer}>
                  <LightbulbIcon size={16} color={userType === 'client' ? PsychiColors.sapphire : PsychiColors.violet} />
                </View>
                <Text style={[styles.tipText, { color: userType === 'client' ? PsychiColors.sapphire : PsychiColors.violet }]}>
                  <Text style={styles.tipLabel}>Tip: </Text>
                  {step.tip}
                </Text>
              </View>
            )}

            {/* Navigation buttons */}
            <View style={styles.buttons}>
              {!isFirstStep && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextButton, isFirstStep && { flex: 1 }]}
                onPress={handleNext}
              >
                <LinearGradient
                  colors={userType === 'client' ? [PsychiColors.royalBlue, PsychiColors.sapphire] : [PsychiColors.lavender, PsychiColors.violet]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <View style={styles.nextButtonContent}>
                    {isLastStep ? (
                      <>
                        <CheckCircleIcon size={18} color="#fff" />
                        <Text style={styles.nextButtonText}>Get Started</Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.nextButtonText}>Continue</Text>
                        <ChevronRightIcon size={18} color="#fff" />
                      </>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 60, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl + 20,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '500',
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: '#fff',
    transform: [{ scale: 1.3 }],
  },
  dotCompleted: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  stepCounter: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  welcomeText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.midnight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipIconContainer: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  tipLabel: {
    fontWeight: '600',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'rgba(176, 224, 230, 0.3)',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.sapphire,
  },
  nextButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
