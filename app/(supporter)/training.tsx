/**
 * Supporter Training Screen
 * Multi-module training system with quizzes and certification
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { ChevronLeftIcon, CheckIcon, LockIcon } from '@/components/icons';

type Module = 'mindfulness' | 'cbt' | 'validation' | 'crisis' | 'platform';

interface ModuleProgress {
  mindfulness: boolean;
  cbt: boolean;
  validation: boolean;
  crisis: boolean;
  platform: boolean;
}

interface QuizQuestion {
  question: string;
  options: { label: string; value: string }[];
}

// Module metadata
const MODULES = [
  { id: 'mindfulness' as Module, title: 'Mindfulness', icon: '🧘', duration: '15 min' },
  { id: 'cbt' as Module, title: 'Cognitive Behavioral Therapy', icon: '🧠', duration: '20 min' },
  { id: 'validation' as Module, title: 'Validating Language', icon: '💬', duration: '15 min' },
  { id: 'crisis' as Module, title: 'Crisis Recognition', icon: '🚨', duration: '25 min' },
  { id: 'platform' as Module, title: 'Supporting on Psychi', icon: '📱', duration: '20 min' },
];

// Correct answers for each module
const CORRECT_ANSWERS: Record<Module, Record<string, string>> = {
  mindfulness: { q1: 'b', q2: 'c', q3: 'b', q4: 'a', q5: 'b', q6: 'b' },
  cbt: { q1: 'b', q2: 'a', q3: 'c', q4: 'b', q5: 'b', q6: 'c' },
  validation: { q1: 'c', q2: 'b', q3: 'a', q4: 'b', q5: 'b', q6: 'c' },
  crisis: { q1: 'b', q2: 'b', q3: 'c', q4: 'b', q5: 'b', q6: 'b' },
  platform: { q1: 'c', q2: 'b', q3: 'a', q4: 'c', q5: 'b', q6: 'b' },
};

// Quiz questions for each module
const QUIZ_QUESTIONS: Record<Module, QuizQuestion[]> = {
  mindfulness: [
    {
      question: "What is the core practice of mindfulness according to Jon Kabat-Zinn?",
      options: [
        { label: "Eliminating all negative thoughts", value: "a" },
        { label: "Paying attention in the present moment, non-judgmentally", value: "b" },
        { label: "Planning for the future carefully", value: "c" },
        { label: "Analyzing past experiences", value: "d" },
      ],
    },
    {
      question: "Who founded Mindfulness-Based Stress Reduction (MBSR) in 1979?",
      options: [
        { label: "Aaron Beck", value: "a" },
        { label: "Marsha Linehan", value: "b" },
        { label: "Jon Kabat-Zinn", value: "c" },
        { label: "Thich Nhat Hanh", value: "d" },
      ],
    },
    {
      question: "What brain changes are associated with mindfulness practice?",
      options: [
        { label: "Decreased brain activity", value: "a" },
        { label: "Increased gray matter in regions for emotion regulation", value: "b" },
        { label: "Reduced brain size overall", value: "c" },
        { label: "No measurable changes", value: "d" },
      ],
    },
    {
      question: "Which is an example of informal mindfulness practice?",
      options: [
        { label: "Eating mindfully, truly tasting food without distractions", value: "a" },
        { label: "Attending a formal 8-week course", value: "b" },
        { label: "Using a meditation app", value: "c" },
        { label: "Participating in a silent retreat", value: "d" },
      ],
    },
    {
      question: "What is the key difference between mindfulness and relaxation?",
      options: [
        { label: "They are the same thing", value: "a" },
        { label: "Mindfulness aims for awareness, not necessarily relaxation", value: "b" },
        { label: "Relaxation requires more training", value: "c" },
        { label: "Mindfulness only works for stress", value: "d" },
      ],
    },
    {
      question: "In the 5-4-3-2-1 grounding technique, what are you noticing?",
      options: [
        { label: "5 thoughts, 4 feelings, 3 memories, 2 goals, 1 fear", value: "a" },
        { label: "5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste", value: "b" },
        { label: "5 breaths, 4 stretches, 3 affirmations, 2 visualizations, 1 mantra", value: "c" },
        { label: "5 problems, 4 solutions, 3 plans, 2 actions, 1 result", value: "d" },
      ],
    },
  ],
  cbt: [
    {
      question: "What is the core premise of Cognitive Behavioral Therapy?",
      options: [
        { label: "Childhood experiences determine all behavior", value: "a" },
        { label: "Psychological distress is influenced by negative thinking patterns", value: "b" },
        { label: "Unconscious processes control our actions", value: "c" },
        { label: "Behavior cannot be changed through therapy", value: "d" },
      ],
    },
    {
      question: "What is a 'thought record' in CBT?",
      options: [
        { label: "A technique to monitor and analyze thoughts", value: "a" },
        { label: "A diary of dreams", value: "b" },
        { label: "A list of positive affirmations", value: "c" },
        { label: "A record of therapy sessions", value: "d" },
      ],
    },
    {
      question: "Why is homework important in CBT?",
      options: [
        { label: "It keeps clients busy between sessions", value: "a" },
        { label: "It's not actually important", value: "b" },
        { label: "Real progress happens when applying techniques in daily life", value: "c" },
        { label: "It replaces the need for therapy sessions", value: "d" },
      ],
    },
    {
      question: "Which cognitive distortion involves assuming the worst possible outcome?",
      options: [
        { label: "Personalization", value: "a" },
        { label: "Catastrophizing", value: "b" },
        { label: "Mind reading", value: "c" },
        { label: "Emotional reasoning", value: "d" },
      ],
    },
    {
      question: "What is 'behavioral activation' in CBT?",
      options: [
        { label: "Forcing someone to confront fears immediately", value: "a" },
        { label: "Scheduling positive activities to counteract avoidance", value: "b" },
        { label: "A form of deep muscle relaxation", value: "c" },
        { label: "Analyzing brain activity during therapy", value: "d" },
      ],
    },
    {
      question: "Who are considered the founders of CBT?",
      options: [
        { label: "Sigmund Freud and Carl Jung", value: "a" },
        { label: "B.F. Skinner and Ivan Pavlov", value: "b" },
        { label: "Aaron Beck and Albert Ellis", value: "c" },
        { label: "Carl Rogers and Abraham Maslow", value: "d" },
      ],
    },
  ],
  validation: [
    {
      question: "What does validating language do?",
      options: [
        { label: "Agrees with everything someone says", value: "a" },
        { label: "Fixes someone's problems immediately", value: "b" },
        { label: "Acknowledges emotions without judgment", value: "c" },
        { label: "Tells someone their feelings are wrong", value: "d" },
      ],
    },
    {
      question: "Which response is an example of INVALIDATION?",
      options: [
        { label: "That sounds really difficult", value: "a" },
        { label: "You'll be fine! Don't worry about it", value: "b" },
        { label: "It makes sense you'd feel that way", value: "c" },
        { label: "I can see why that would be painful", value: "d" },
      ],
    },
    {
      question: "What is the first component of validating language?",
      options: [
        { label: "Listening fully and being present", value: "a" },
        { label: "Offering solutions", value: "b" },
        { label: "Changing the subject", value: "c" },
        { label: "Sharing your own similar experience", value: "d" },
      ],
    },
    {
      question: "According to DBT, what is Level 1 of validation?",
      options: [
        { label: "Mind reading - guessing what they feel", value: "a" },
        { label: "Being present - paying attention and staying engaged", value: "b" },
        { label: "Radical genuineness - treating them as equals", value: "c" },
        { label: "Normalizing - saying their reaction is common", value: "d" },
      ],
    },
    {
      question: "What is the difference between validation and agreement?",
      options: [
        { label: "They are the same thing", value: "a" },
        { label: "Validation acknowledges emotions; agreement means sharing opinion", value: "b" },
        { label: "Agreement is about feelings; validation is about facts", value: "c" },
        { label: "Validation only works with negative emotions", value: "d" },
      ],
    },
    {
      question: "Which is TRUE about emotional validation?",
      options: [
        { label: "It should always be followed by advice", value: "a" },
        { label: "It only works for mental health diagnoses", value: "b" },
        { label: "Research shows it reduces emotional distress", value: "c" },
        { label: "It means you should never disagree", value: "d" },
      ],
    },
  ],
  crisis: [
    {
      question: "What is the difference between passive and active suicidal ideation?",
      options: [
        { label: "There is no difference", value: "a" },
        { label: "Passive: wishes to not exist; Active: specific thoughts with planning", value: "b" },
        { label: "Passive is more dangerous than active", value: "c" },
        { label: "Active only occurs with depression", value: "d" },
      ],
    },
    {
      question: "Does asking someone directly about suicide increase their risk?",
      options: [
        { label: "Yes, it plants the idea in their head", value: "a" },
        { label: "No, direct questioning is safe and may reduce distress", value: "b" },
        { label: "It depends on their age", value: "c" },
        { label: "Only professionals should ever ask", value: "d" },
      ],
    },
    {
      question: "When someone shows HIGH risk indicators, what should you do FIRST?",
      options: [
        { label: "Wait and see if they calm down", value: "a" },
        { label: "Try to solve their problems yourself", value: "b" },
        { label: "Don't leave them alone; call 988 or 911 immediately", value: "c" },
        { label: "Tell them to think positive thoughts", value: "d" },
      ],
    },
    {
      question: "Why do people engage in self-harm (non-suicidal self-injury)?",
      options: [
        { label: "Only to get attention from others", value: "a" },
        { label: "As a coping mechanism to regulate overwhelming emotions", value: "b" },
        { label: "Because they want to die", value: "c" },
        { label: "They are always psychotic when it happens", value: "d" },
      ],
    },
    {
      question: "What does 'means restriction' refer to in suicide prevention?",
      options: [
        { label: "Restricting ability to talk about suicide", value: "a" },
        { label: "Reducing access to lethal methods like firearms", value: "b" },
        { label: "Limiting how much therapy someone can receive", value: "c" },
        { label: "Preventing people from calling crisis hotlines", value: "d" },
      ],
    },
    {
      question: "What is a peer supporter's role during a mental health crisis?",
      options: [
        { label: "Diagnose the condition and provide treatment", value: "a" },
        { label: "Recognize warning signs and connect to professional resources", value: "b" },
        { label: "Convince the person they are overreacting", value: "c" },
        { label: "Handle the crisis entirely without outside help", value: "d" },
      ],
    },
  ],
  platform: [
    {
      question: "What is a Psychi Supporter's primary role?",
      options: [
        { label: "Diagnosing mental health conditions", value: "a" },
        { label: "Prescribing medication or treatment plans", value: "b" },
        { label: "Providing empathetic peer support using evidence-based techniques", value: "c" },
        { label: "Serving as the client's only mental health resource", value: "d" },
      ],
    },
    {
      question: "A client expresses suicidal thoughts. What should your FIRST response include?",
      options: [
        { label: "Immediately end the session and call 911", value: "a" },
        { label: "Acknowledge their pain and provide crisis resources (988)", value: "b" },
        { label: "Tell them to think positive", value: "c" },
        { label: "Ignore it and redirect to their original concern", value: "d" },
      ],
    },
    {
      question: "During a video call, your client becomes tearful and silent. What is MOST appropriate?",
      options: [
        { label: "Allow silence, maintain warm presence, say 'I'm here with you'", value: "a" },
        { label: "Immediately ask what's wrong and demand explanation", value: "b" },
        { label: "End the session to give them privacy", value: "c" },
        { label: "Talk about something else to distract them", value: "d" },
      ],
    },
    {
      question: "What dress code is required for video sessions?",
      options: [
        { label: "Casual clothing is fine", value: "a" },
        { label: "No specific requirements", value: "b" },
        { label: "Professional dress (business casual minimum)", value: "c" },
        { label: "Formal business attire with suit and tie", value: "d" },
      ],
    },
    {
      question: "A client wants video but you're in a noisy environment. What should you do?",
      options: [
        { label: "Switch to video anyway since client requested it", value: "a" },
        { label: "Explain the situation and offer voice, or schedule for later", value: "b" },
        { label: "Just decline without explanation", value: "c" },
        { label: "Mute your microphone and proceed with video", value: "d" },
      ],
    },
    {
      question: "Is it acceptable to check your phone during a video session if client can't see?",
      options: [
        { label: "True - what they can't see won't affect session", value: "a" },
        { label: "False - full attention is required; clients can sense distraction", value: "b" },
        { label: "True - as long as it's just a quick glance", value: "c" },
        { label: "It depends on session length", value: "d" },
      ],
    },
  ],
};

// Module content (condensed for mobile)
const MODULE_CONTENT: Record<Module, { title: string; content: string }[]> = {
  mindfulness: [
    { title: "What is Mindfulness?", content: "Mindfulness is the practice of paying attention on purpose, in the present moment, non-judgmentally. It was popularized by Jon Kabat-Zinn who founded MBSR in 1979." },
    { title: "The Science", content: "Research shows mindfulness increases gray matter in brain regions related to learning, memory, and emotion regulation. It reduces stress and improves focus." },
    { title: "Core Techniques", content: "Key techniques include: focused breathing, body scans, mindful observation, and the 5-4-3-2-1 grounding technique (5 things you see, 4 hear, 3 touch, 2 smell, 1 taste)." },
    { title: "Informal Practice", content: "Mindfulness can be practiced informally through everyday activities like eating mindfully, walking with awareness, or pausing before responding." },
  ],
  cbt: [
    { title: "Core Premise", content: "CBT is based on the idea that psychological distress is influenced by patterns of negative or distorted thinking. By changing thoughts, we can change feelings and behaviors." },
    { title: "Founders", content: "Aaron Beck and Albert Ellis are considered the founders of CBT. Beck developed cognitive therapy in the 1960s, focusing on identifying and changing distorted thoughts." },
    { title: "Key Techniques", content: "Techniques include thought records (monitoring thoughts), cognitive restructuring (challenging distortions), and behavioral activation (scheduling positive activities)." },
    { title: "Cognitive Distortions", content: "Common distortions: Catastrophizing (assuming worst), All-or-nothing thinking, Mind reading, Personalization, and Emotional reasoning." },
  ],
  validation: [
    { title: "What is Validation?", content: "Validation acknowledges and affirms someone's emotions without judgment. It doesn't mean agreeing with them, but recognizing their feelings are real and understandable." },
    { title: "6 Levels of Validation", content: "From DBT: 1) Being present, 2) Accurate reflection, 3) Reading behavior, 4) Understanding history, 5) Normalizing, 6) Radical genuineness." },
    { title: "Validation vs Agreement", content: "Validation: 'I understand why you feel angry.' Agreement: 'You're right to be angry.' You can validate without agreeing with their perspective." },
    { title: "What to Avoid", content: "Invalidating responses: 'You'll be fine!', 'Don't worry about it', 'Others have it worse', 'You shouldn't feel that way.'" },
  ],
  crisis: [
    { title: "Recognizing Warning Signs", content: "Warning signs include: direct statements about wanting to die, expressions of hopelessness or feeling like a burden, talking about having no reason to live, increased substance use or reckless behavior, withdrawing from activities or relationships, giving away possessions or saying goodbye, and sudden calmness after a period of distress." },
    { title: "Passive vs Active Ideation", content: "Passive: 'I wish I wasn't here' without a plan. Active: Specific thoughts about ending life with possible planning, timeline, or access to means." },
    { title: "Limits of Confidentiality", content: "Confidentiality has limits when safety is at risk. You may need to break confidentiality for: imminent risk of self-harm or suicide, imminent risk of harm to another person, disclosure of abuse involving a minor or vulnerable adult, or legal requirements." },
    { title: "Crisis Response Protocol", content: "When you identify a crisis: 1) Stay calm and listen without judgment, 2) Ask directly about self-harm or suicide, 3) NEVER promise to keep safety concerns secret, 4) Encourage professional help, 5) Provide resources: 988 Lifeline or text HOME to 741741, 6) Escalate to Psychi safety team using the in-app report button, 7) Stay with the client until stabilized or escalated." },
    { title: "What You Must NOT Do", content: "Never promise to keep safety disclosures confidential. Never attempt to handle a crisis alone without escalating to Psychi. Never diagnose, prescribe, or give medical advice. Never meet clients outside the platform or share personal contact information." },
  ],
  platform: [
    { title: "Your Role", content: "As a Psychi Supporter, you provide empathetic peer support using evidence-based techniques. You are NOT a therapist and should never diagnose or prescribe." },
    { title: "Session Conduct", content: "Maintain professional appearance (business casual), ensure private quiet space, give full attention (no phone checking), and be on time." },
    { title: "Handling Difficult Moments", content: "When clients become emotional: allow comfortable silence, maintain warm presence, say 'I'm here with you. Take your time.'" },
    { title: "Crisis Protocol", content: "If client expresses suicidal thoughts: acknowledge their pain, ask clarifying safety questions, provide 988 and Crisis Text Line resources." },
  ],
};

export default function TrainingScreen() {
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress>({
    mindfulness: false,
    cbt: false,
    validation: false,
    crisis: false,
    platform: false,
  });
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);

  const completedCount = Object.values(moduleProgress).filter(Boolean).length;
  const allComplete = completedCount === 5;

  const isModuleUnlocked = (moduleId: Module): boolean => {
    const moduleOrder: Module[] = ['mindfulness', 'cbt', 'validation', 'crisis', 'platform'];
    const index = moduleOrder.indexOf(moduleId);
    if (index === 0) return true;
    return moduleProgress[moduleOrder[index - 1]];
  };

  const handleStartModule = (moduleId: Module) => {
    if (!isModuleUnlocked(moduleId)) {
      Alert.alert('Module Locked', 'Complete the previous module first.');
      return;
    }
    setCurrentModule(moduleId);
    setShowQuiz(false);
    setQuizAnswers({});
    setShowResults(false);
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizAnswers({});
    setShowResults(false);
  };

  const handleQuizAnswer = (questionId: string, answer: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmitQuiz = () => {
    if (!currentModule) return;

    const correct = CORRECT_ANSWERS[currentModule];
    const score = Object.entries(correct).filter(
      ([key, value]) => quizAnswers[key] === value
    ).length;

    setQuizScore(score);
    setShowResults(true);

    // Need 5/6 (83%) to pass
    if (score >= 5) {
      setModuleProgress((prev) => ({ ...prev, [currentModule]: true }));
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setShowResults(false);
  };

  const handleNextModule = () => {
    const moduleOrder: Module[] = ['mindfulness', 'cbt', 'validation', 'crisis', 'platform'];
    const currentIndex = currentModule ? moduleOrder.indexOf(currentModule) : -1;

    if (currentIndex < moduleOrder.length - 1) {
      setCurrentModule(moduleOrder[currentIndex + 1]);
      setShowQuiz(false);
      setQuizAnswers({});
      setShowResults(false);
    } else {
      // All modules complete
      setCurrentModule(null);
      setShowCertificate(true);
    }
  };

  const handleBackToModules = () => {
    setCurrentModule(null);
    setShowQuiz(false);
    setQuizAnswers({});
    setShowResults(false);
  };

  // Certificate Modal
  if (showCertificate) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.certificateContainer}>
          <LinearGradient
            colors={[PsychiColors.azure, PsychiColors.deep] as const}
            style={styles.certificateCard}
          >
            <Text style={styles.certificateEmoji}>🎓</Text>
            <Text style={styles.certificateTitle}>Congratulations!</Text>
            <Text style={styles.certificateSubtitle}>
              You have completed all training modules
            </Text>
            <View style={styles.certificateBadge}>
              <Text style={styles.certificateBadgeText}>Certified Psychi Supporter</Text>
            </View>
            <Text style={styles.certificateDate}>
              Completed on {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </LinearGradient>
          <TouchableOpacity
            style={styles.certificateButton}
            onPress={() => router.back()}
          >
            <Text style={styles.certificateButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Module Content or Quiz View
  if (currentModule) {
    const moduleInfo = MODULES.find((m) => m.id === currentModule)!;
    const content = MODULE_CONTENT[currentModule];
    const questions = QUIZ_QUESTIONS[currentModule];

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToModules}>
            <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{moduleInfo.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!showQuiz ? (
            // Module Content
            <View style={styles.moduleContent}>
              <View style={styles.moduleHeader}>
                <Text style={styles.moduleEmoji}>{moduleInfo.icon}</Text>
                <Text style={styles.moduleDuration}>{moduleInfo.duration} read</Text>
              </View>

              {content.map((section, index) => (
                <View key={index} style={styles.contentSection}>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionContent}>{section.content}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.quizButton}
                onPress={handleStartQuiz}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[PsychiColors.azure, PsychiColors.deep] as const}
                  style={styles.quizButtonGradient}
                >
                  <Text style={styles.quizButtonText}>Take Quiz</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : showResults ? (
            // Quiz Results
            <View style={styles.resultsContainer}>
              <View style={[styles.resultsCard, quizScore >= 5 ? styles.resultsCardPass : styles.resultsCardFail]}>
                <Text style={styles.resultsEmoji}>{quizScore >= 5 ? '🎉' : '📚'}</Text>
                <Text style={styles.resultsTitle}>
                  {quizScore >= 5 ? 'Congratulations!' : 'Keep Learning'}
                </Text>
                <Text style={styles.resultsScore}>
                  You scored {quizScore} out of 6
                </Text>
                <Text style={styles.resultsMessage}>
                  {quizScore >= 5
                    ? 'You passed! You can now proceed to the next module.'
                    : 'You need 5 correct answers to pass. Review the material and try again.'}
                </Text>
              </View>

              {quizScore >= 5 ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNextModule}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[PsychiColors.azure, PsychiColors.deep] as const}
                    style={styles.nextButtonGradient}
                  >
                    <Text style={styles.nextButtonText}>
                      {currentModule === 'platform' ? 'Get Certificate' : 'Next Module'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={handleRetakeQuiz}
                >
                  <Text style={styles.retakeButtonText}>Retake Quiz</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // Quiz Questions
            <View style={styles.quizContainer}>
              <Text style={styles.quizTitle}>Module Quiz</Text>
              <Text style={styles.quizSubtitle}>Answer all 6 questions (need 5 correct to pass)</Text>

              {questions.map((q, qIndex) => (
                <View key={qIndex} style={styles.questionCard}>
                  <Text style={styles.questionNumber}>Question {qIndex + 1}</Text>
                  <Text style={styles.questionText}>{q.question}</Text>
                  <View style={styles.optionsContainer}>
                    {q.options.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          quizAnswers[`q${qIndex + 1}`] === option.value && styles.optionButtonSelected,
                        ]}
                        onPress={() => handleQuizAnswer(`q${qIndex + 1}`, option.value)}
                      >
                        <View style={[
                          styles.optionRadio,
                          quizAnswers[`q${qIndex + 1}`] === option.value && styles.optionRadioSelected,
                        ]}>
                          {quizAnswers[`q${qIndex + 1}`] === option.value && (
                            <View style={styles.optionRadioInner} />
                          )}
                        </View>
                        <Text style={[
                          styles.optionText,
                          quizAnswers[`q${qIndex + 1}`] === option.value && styles.optionTextSelected,
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  Object.keys(quizAnswers).length < 6 && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitQuiz}
                disabled={Object.keys(quizAnswers).length < 6}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    Object.keys(quizAnswers).length >= 6
                      ? [PsychiColors.azure, PsychiColors.deep] as const
                      : ['#ccc', '#aaa'] as const
                  }
                  style={styles.submitButtonGradient}
                >
                  <Text style={styles.submitButtonText}>Submit Answers</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Module List View
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedCount / 5) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount} of 5 modules completed</Text>
        </View>

        {/* Modules List */}
        <View style={styles.modulesList}>
          {MODULES.map((module, index) => {
            const isUnlocked = isModuleUnlocked(module.id);
            const isComplete = moduleProgress[module.id];

            return (
              <TouchableOpacity
                key={module.id}
                style={[styles.moduleCard, !isUnlocked && styles.moduleCardLocked]}
                onPress={() => handleStartModule(module.id)}
                activeOpacity={isUnlocked ? 0.7 : 1}
              >
                <View style={styles.moduleCardLeft}>
                  <View style={[
                    styles.moduleIconContainer,
                    isComplete && styles.moduleIconContainerComplete,
                  ]}>
                    {isComplete ? (
                      <CheckIcon size={24} color={PsychiColors.white} />
                    ) : !isUnlocked ? (
                      <LockIcon size={24} color={PsychiColors.textMuted} />
                    ) : (
                      <Text style={styles.moduleIconEmoji}>{module.icon}</Text>
                    )}
                  </View>
                  <View style={styles.moduleInfo}>
                    <Text style={[styles.moduleTitle, !isUnlocked && styles.moduleTitleLocked]}>
                      {module.title}
                    </Text>
                    <Text style={styles.moduleMeta}>
                      {isComplete ? 'Completed' : isUnlocked ? module.duration : 'Locked'}
                    </Text>
                  </View>
                </View>
                {isUnlocked && !isComplete && (
                  <Text style={styles.moduleArrow}>→</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {allComplete && (
          <TouchableOpacity
            style={styles.viewCertificateButton}
            onPress={() => setShowCertificate(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep] as const}
              style={styles.viewCertificateGradient}
            >
              <Text style={styles.viewCertificateText}>View Certificate</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  progressCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PsychiColors.azure,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  modulesList: {
    gap: Spacing.sm,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  moduleCardLocked: {
    opacity: 0.6,
  },
  moduleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  moduleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  moduleIconContainerComplete: {
    backgroundColor: PsychiColors.success,
  },
  moduleIconEmoji: {
    fontSize: 24,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: 2,
  },
  moduleTitleLocked: {
    color: PsychiColors.textMuted,
  },
  moduleMeta: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  moduleArrow: {
    fontSize: 18,
    color: PsychiColors.azure,
    fontWeight: '600',
  },
  moduleContent: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  moduleEmoji: {
    fontSize: 32,
  },
  moduleDuration: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  contentSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.xs,
  },
  sectionContent: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 22,
  },
  quizButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginTop: Spacing.md,
  },
  quizButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  quizButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  quizContainer: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.soft,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.midnight,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  quizSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  questionCard: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: PsychiColors.azure,
    marginBottom: Spacing.xs,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500',
    color: PsychiColors.midnight,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.cream,
  },
  optionButtonSelected: {
    backgroundColor: 'rgba(74, 144, 226, 0.15)',
  },
  optionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PsychiColors.textMuted,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionRadioSelected: {
    borderColor: PsychiColors.azure,
  },
  optionRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PsychiColors.azure,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  optionTextSelected: {
    color: PsychiColors.midnight,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  resultsCardPass: {
    borderWidth: 2,
    borderColor: PsychiColors.success,
  },
  resultsCardFail: {
    borderWidth: 2,
    borderColor: PsychiColors.error,
  },
  resultsEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.midnight,
    marginBottom: Spacing.xs,
  },
  resultsScore: {
    fontSize: 16,
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  resultsMessage: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
  },
  nextButton: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  retakeButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.cream,
    alignItems: 'center',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  viewCertificateButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  viewCertificateGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  viewCertificateText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  certificateContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  certificateCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  certificateEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  certificateTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.white,
    marginBottom: Spacing.xs,
  },
  certificateSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  certificateBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  certificateBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  certificateDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  certificateButton: {
    backgroundColor: PsychiColors.white,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  certificateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
});
