/**
 * Supporter Training Screen
 * Multi-module training system with quizzes and certification
 * Content matches web version exactly
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  CheckIcon,
  LockIcon,
  PlayIcon,
  BookIcon,
  HeartIcon,
  BrainIcon,
  ChatIcon,
  ShieldIcon,
  PhoneIcon,
  CertificateIcon,
  StarIcon,
  ExternalLinkIcon,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';

type Module = 'confidentiality' | 'mindfulness' | 'cbt' | 'validation' | 'crisis' | 'platform';

interface ModuleProgress {
  confidentiality: boolean;
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

interface ContentSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

// Clickable link interfaces
interface VideoLink {
  title: string;
  speaker: string;
  description: string;
  url: string;
}

interface ResourceLink {
  title: string;
  author?: string;
  description: string;
  url?: string;
  type: 'book' | 'app' | 'website';
}

interface StudyLink {
  title: string;
  authors: string;
  journal: string;
  finding: string;
  url: string;
}

// Clickable card components
const VideoCard = ({ video }: { video: VideoLink }) => (
  <TouchableOpacity
    style={linkStyles.videoCard}
    onPress={() => Linking.openURL(video.url)}
    activeOpacity={0.7}
  >
    <View style={linkStyles.videoIconContainer}>
      <PlayIcon size={24} color={PsychiColors.white} />
    </View>
    <View style={linkStyles.videoContent}>
      <Text style={linkStyles.videoTitle}>{video.title}</Text>
      <Text style={linkStyles.videoSpeaker}>{video.speaker}</Text>
      <Text style={linkStyles.videoDescription}>{video.description}</Text>
    </View>
    <ExternalLinkIcon size={16} color={PsychiColors.textMuted} />
  </TouchableOpacity>
);

const ResourceCard = ({ resource }: { resource: ResourceLink }) => {
  const content = (
    <>
      <View style={[linkStyles.resourceIconContainer, resource.type === 'app' && linkStyles.resourceIconApp]}>
        <BookIcon size={20} color={resource.type === 'app' ? PsychiColors.coral : PsychiColors.azure} />
      </View>
      <View style={linkStyles.resourceContent}>
        <Text style={linkStyles.resourceTitle}>{resource.title}</Text>
        {resource.author && <Text style={linkStyles.resourceAuthor}>by {resource.author}</Text>}
        <Text style={linkStyles.resourceDescription}>{resource.description}</Text>
      </View>
      {resource.url && <ExternalLinkIcon size={16} color={PsychiColors.textMuted} />}
    </>
  );

  if (resource.url) {
    return (
      <TouchableOpacity
        style={linkStyles.resourceCard}
        onPress={() => Linking.openURL(resource.url!)}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={linkStyles.resourceCard}>{content}</View>;
};

const StudyCard = ({ study }: { study: StudyLink }) => (
  <TouchableOpacity
    style={linkStyles.studyCard}
    onPress={() => Linking.openURL(study.url)}
    activeOpacity={0.7}
  >
    <View style={linkStyles.studyHeader}>
      <Text style={linkStyles.studyTitle}>{study.title}</Text>
      <ExternalLinkIcon size={14} color={PsychiColors.azure} />
    </View>
    <Text style={linkStyles.studyAuthors}>{study.authors}</Text>
    <Text style={linkStyles.studyJournal}>{study.journal}</Text>
    <Text style={linkStyles.studyFinding}>Key finding: {study.finding}</Text>
  </TouchableOpacity>
);

// Module icons mapping
const MODULE_ICONS: Record<Module, React.FC<{ size?: number; color?: string }>> = {
  confidentiality: LockIcon,
  mindfulness: HeartIcon,
  cbt: BrainIcon,
  validation: ChatIcon,
  crisis: ShieldIcon,
  platform: PhoneIcon,
};

// Module metadata
const MODULES = [
  { id: 'confidentiality' as Module, title: 'Confidentiality', duration: '30 min' },
  { id: 'mindfulness' as Module, title: 'Mindfulness', duration: '25 min' },
  { id: 'cbt' as Module, title: 'Cognitive Behavioral Therapy', duration: '30 min' },
  { id: 'validation' as Module, title: 'Validating Language', duration: '25 min' },
  { id: 'crisis' as Module, title: 'Crisis Recognition', duration: '35 min' },
  { id: 'platform' as Module, title: 'Supporting on Psychi', duration: '30 min' },
];

// Correct answers for each module
const CORRECT_ANSWERS: Record<Module, Record<string, string>> = {
  confidentiality: { q1: 'b', q2: 'c', q3: 'b', q4: 'a', q5: 'b', q6: 'c' },
  mindfulness: { q1: 'b', q2: 'c', q3: 'b', q4: 'a', q5: 'b', q6: 'b' },
  cbt: { q1: 'b', q2: 'a', q3: 'c', q4: 'b', q5: 'b', q6: 'c' },
  validation: { q1: 'c', q2: 'b', q3: 'a', q4: 'b', q5: 'b', q6: 'c' },
  crisis: { q1: 'b', q2: 'b', q3: 'c', q4: 'b', q5: 'b', q6: 'b' },
  platform: { q1: 'c', q2: 'b', q3: 'a', q4: 'c', q5: 'b', q6: 'b' },
};

// Quiz questions for each module
const QUIZ_QUESTIONS: Record<Module, QuizQuestion[]> = {
  confidentiality: [
    {
      question: "Your friend knows you're a Psychi supporter and asks, 'What kind of stuff do people talk to you about?' What's the best response?",
      options: [
        { label: "Share general trends without specific details", value: "a" },
        { label: "Say you keep everything confidential and can't share details", value: "b" },
        { label: "Tell them about one interesting case without names", value: "c" },
        { label: "Explain that it's mostly relationship problems", value: "d" },
      ],
    },
    {
      question: "What information is considered confidential?",
      options: [
        { label: "Only deeply personal secrets shared by clients", value: "a" },
        { label: "Only information clients explicitly ask you to keep private", value: "b" },
        { label: "Everything shared during a session, including that they use Psychi", value: "c" },
        { label: "Only information that could identify the client", value: "d" },
      ],
    },
    {
      question: "You had a meaningful session and want to share about it on social media. What should you do?",
      options: [
        { label: "Post about it without using names or identifying details", value: "a" },
        { label: "Don't post anything specific about clients, even without names", value: "b" },
        { label: "Ask the client for permission first", value: "c" },
        { label: "Wait a few weeks and then post about it", value: "d" },
      ],
    },
    {
      question: "Someone contacts you claiming to be a client's worried parent. They ask what you've discussed. What do you do?",
      options: [
        { label: "Don't confirm or discuss anything, and suggest they contact the person directly", value: "a" },
        { label: "Reassure them their child is doing well without specifics", value: "b" },
        { label: "Share general information to ease their worry", value: "c" },
        { label: "Confirm the person is a client but don't share details", value: "d" },
      ],
    },
    {
      question: "A client says, 'I have a plan to end things tonight.' What should you do?",
      options: [
        { label: "Keep it confidential as that's the rule", value: "a" },
        { label: "Stay calm, keep them talking, refer them to 988, and contact Psychi support", value: "b" },
        { label: "Immediately end the session and call 911", value: "c" },
        { label: "Tell them to think positive and things will get better", value: "d" },
      ],
    },
    {
      question: "How long does your confidentiality obligation last?",
      options: [
        { label: "Until the session ends", value: "a" },
        { label: "Until the client stops using Psychi", value: "b" },
        { label: "Forever, even after you leave the platform", value: "c" },
        { label: "For one year after your last session", value: "d" },
      ],
    },
  ],
  mindfulness: [
    {
      question: "What is the core practice of mindfulness according to Jon Kabat-Zinn?",
      options: [
        { label: "Eliminating all negative thoughts from your mind", value: "a" },
        { label: "Paying attention on purpose, in the present moment, non-judgmentally", value: "b" },
        { label: "Planning for the future carefully and strategically", value: "c" },
        { label: "Analyzing past experiences to understand patterns", value: "d" },
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
      question: "According to neuroscience research, what brain changes have been associated with mindfulness practice?",
      options: [
        { label: "Decreased brain activity in all regions", value: "a" },
        { label: "Increased gray matter in regions related to learning, memory, and emotion regulation", value: "b" },
        { label: "Reduced brain size overall", value: "c" },
        { label: "No measurable changes in brain structure", value: "d" },
      ],
    },
    {
      question: "Which of these is an example of informal mindfulness practice?",
      options: [
        { label: "Eating mindfully by truly tasting your food without distractions", value: "a" },
        { label: "Attending a formal 8-week MBSR course", value: "b" },
        { label: "Using a meditation app for a guided session", value: "c" },
        { label: "Participating in a silent meditation retreat", value: "d" },
      ],
    },
    {
      question: "What is the key difference between mindfulness and relaxation?",
      options: [
        { label: "There is no difference; they are the same thing", value: "a" },
        { label: "Mindfulness aims for awareness and acceptance, not necessarily relaxation", value: "b" },
        { label: "Relaxation requires more training than mindfulness", value: "c" },
        { label: "Mindfulness only works for stress, while relaxation works for all conditions", value: "d" },
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
        { label: "Psychological distress is influenced by patterns of negative or distorted thinking", value: "b" },
        { label: "Unconscious processes control our actions", value: "c" },
        { label: "Behavior cannot be changed through therapy", value: "d" },
      ],
    },
    {
      question: "What is a 'thought record' in CBT?",
      options: [
        { label: "A technique to monitor and analyze thoughts in response to situations", value: "a" },
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
        { label: "Real progress happens when individuals apply CBT techniques in daily life", value: "c" },
        { label: "It replaces the need for therapy sessions", value: "d" },
      ],
    },
    {
      question: "Which cognitive distortion involves assuming the worst possible outcome will happen?",
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
        { label: "Forcing someone to confront their fears immediately", value: "a" },
        { label: "Scheduling positive activities to counteract avoidance and increase engagement", value: "b" },
        { label: "A form of deep muscle relaxation", value: "c" },
        { label: "Analyzing brain activity during therapy", value: "d" },
      ],
    },
    {
      question: "Who are considered the founders of Cognitive Behavioral Therapy?",
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
        { label: "Acknowledges and affirms someone's emotions without judgment", value: "c" },
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
        { label: "There is no difference; they are the same thing", value: "a" },
        { label: "Validation acknowledges emotions are real; agreement means you share their opinion", value: "b" },
        { label: "Agreement is about feelings; validation is about facts", value: "c" },
        { label: "Validation only works with negative emotions", value: "d" },
      ],
    },
    {
      question: "Which of the following is TRUE about emotional validation?",
      options: [
        { label: "It should always be followed by advice or solutions", value: "a" },
        { label: "It only works for people with mental health diagnoses", value: "b" },
        { label: "Research shows it reduces emotional arousal and distress", value: "c" },
        { label: "It means you should never disagree with someone", value: "d" },
      ],
    },
  ],
  crisis: [
    {
      question: "What is the difference between passive and active suicidal ideation?",
      options: [
        { label: "There is no difference", value: "a" },
        { label: "Passive ideation involves wishes to not exist without a plan; active ideation involves specific thoughts about ending one's life with possible planning", value: "b" },
        { label: "Passive ideation is more dangerous than active ideation", value: "c" },
        { label: "Active ideation only occurs in people with depression", value: "d" },
      ],
    },
    {
      question: "According to research, does asking someone directly about suicide increase their risk?",
      options: [
        { label: "Yes, it plants the idea in their head", value: "a" },
        { label: "No, direct questioning is safe and may reduce distress", value: "b" },
        { label: "It depends on their age", value: "c" },
        { label: "Only trained professionals should ever ask", value: "d" },
      ],
    },
    {
      question: "What is the appropriate response when someone shows HIGH risk indicators (specific plan, access to means, timeline)?",
      options: [
        { label: "Wait and see if they calm down", value: "a" },
        { label: "Try to solve their problems yourself", value: "b" },
        { label: "Do not leave them alone; call 988, Crisis Text Line, or 911 immediately", value: "c" },
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
        { label: "Restricting someone's ability to talk about suicide", value: "a" },
        { label: "Reducing access to lethal methods like firearms or medications", value: "b" },
        { label: "Limiting how much therapy someone can receive", value: "c" },
        { label: "Preventing people from calling crisis hotlines", value: "d" },
      ],
    },
    {
      question: "What is the role of a peer supporter during a mental health crisis?",
      options: [
        { label: "To diagnose the condition and provide treatment", value: "a" },
        { label: "To recognize warning signs, provide support, and connect to professional resources", value: "b" },
        { label: "To convince the person they are overreacting", value: "c" },
        { label: "To handle the crisis entirely on their own without outside help", value: "d" },
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
      question: "A client sends a long chat message expressing suicidal thoughts. What should your FIRST response include?",
      options: [
        { label: "Immediately end the session and call 911", value: "a" },
        { label: "Acknowledge their pain, ask clarifying questions about safety, and provide crisis resources (988, Crisis Text Line)", value: "b" },
        { label: "Tell them to think positive and that things will get better", value: "c" },
        { label: "Ignore it and redirect to their original concern", value: "d" },
      ],
    },
    {
      question: "During a video call, your client suddenly becomes tearful and silent. What is the MOST appropriate response?",
      options: [
        { label: "Allow comfortable silence, maintain warm presence, and gently say 'I'm here with you. Take your time.'", value: "a" },
        { label: "Immediately ask what's wrong and demand they explain", value: "b" },
        { label: "End the session to give them privacy", value: "c" },
        { label: "Start talking about something else to distract them", value: "d" },
      ],
    },
    {
      question: "What dress code is required for Psychi Supporters during video sessions?",
      options: [
        { label: "Casual clothing is fine since you're working from home", value: "a" },
        { label: "No specific requirements as long as you're visible on camera", value: "b" },
        { label: "Professional dress (business casual minimum, neutral colors recommended)", value: "c" },
        { label: "Formal business attire with suit and tie", value: "d" },
      ],
    },
    {
      question: "A client in chat wants to switch to video but you're in a noisy environment. What should you do?",
      options: [
        { label: "Switch to video anyway since the client requested it", value: "a" },
        { label: "Explain the situation, offer voice as an alternative, or schedule video for when you can ensure privacy", value: "b" },
        { label: "Just decline without explanation", value: "c" },
        { label: "Mute your microphone and proceed with video", value: "d" },
      ],
    },
    {
      question: "True or False: It's acceptable to check your phone during a video session if the client can't see you doing it.",
      options: [
        { label: "True - what they can't see won't affect the session", value: "a" },
        { label: "False - full attention is required regardless of what's visible; clients can sense distraction", value: "b" },
        { label: "True - as long as it's just a quick glance", value: "c" },
        { label: "It depends on how long the session has been going", value: "d" },
      ],
    },
  ],
};

// Learning objectives for each module
const LEARNING_OBJECTIVES: Record<Module, string[]> = {
  confidentiality: [
    "Understand why confidentiality is the foundation of trust in peer support",
    "Identify what information is considered confidential (everything shared in sessions)",
    "Apply the five core confidentiality obligations in practice",
    "Recognize the three exceptions when disclosure is required",
    "Handle real-world confidentiality scenarios appropriately",
  ],
  mindfulness: [
    "Define mindfulness and explain its origins in both contemplative traditions and modern psychology",
    "Describe the neuroscience behind mindfulness and its effects on brain structure and function",
    "Apply core mindfulness skills (observe, describe, participate, non-judgment) in peer support sessions",
    "Guide clients through basic mindfulness exercises including breath awareness and grounding techniques",
    "Differentiate between mindfulness, meditation, and relaxation techniques",
  ],
  cbt: [
    "Explain the cognitive model and how thoughts, feelings, and behaviors interact",
    "Identify common cognitive distortions (all-or-nothing thinking, catastrophizing, etc.)",
    "Use thought records and Socratic questioning to help clients examine their thoughts",
    "Apply behavioral activation techniques for clients experiencing depression or low motivation",
    "Adapt CBT techniques appropriately for peer support (within scope of practice)",
  ],
  validation: [
    "Define validation and distinguish it from agreement, approval, or advice-giving",
    "Identify the six levels of validation according to DBT",
    "Recognize common invalidating responses and their impact on emotional well-being",
    "Apply validation techniques in real-time conversations with clients",
    "Use validation as a foundation for building trust and therapeutic rapport",
  ],
  crisis: [
    "Recognize warning signs and risk factors for suicide and self-harm",
    "Distinguish between passive and active suicidal ideation",
    "Understand the limits of confidentiality in crisis situations",
    "Apply the crisis response protocol for Psychi Supporters",
    "Know when and how to escalate to emergency services or the Psychi safety team",
  ],
  platform: [
    "Understand the scope and limitations of your role as a Psychi Supporter",
    "Apply professional standards for video and voice sessions",
    "Navigate difficult moments including emotional reactions and technical issues",
    "Follow Psychi's crisis protocols and escalation procedures",
    "Maintain ethical boundaries while providing compassionate support",
  ],
};

// Module content sections
const MODULE_CONTENT: Record<Module, ContentSection[]> = {
  confidentiality: [
    {
      id: 'confidentiality-1',
      title: 'Why Confidentiality Matters',
      content: `Confidentiality is the foundation of trust between you and your clients. When someone reaches out for peer support, they're sharing parts of their life they may not share with anyone else. Protecting that trust isn't just a rule — it's a responsibility.

THE HEART OF PEER SUPPORT

When clients come to Psychi, they're often in vulnerable moments. They might be:

• Sharing something for the first time
• Processing difficult emotions
• Working through personal challenges
• Seeking connection without judgment

For many, the decision to open up takes courage. They're trusting you — sometimes more than they trust people in their daily lives — because they believe what they share will stay between you.

Breaking that trust doesn't just harm one person. It can:

• Prevent them from seeking support in the future
• Damage their ability to trust others
• Cause real-world consequences if private information spreads
• Undermine the entire peer support community

YOUR ROLE AS A GUARDIAN

Think of yourself as a guardian of someone's private world. They've handed you something precious — their thoughts, fears, hopes, and struggles. Your job is to hold that carefully and never let it slip into the wrong hands.`,
    },
    {
      id: 'confidentiality-2',
      title: 'What Is Confidential Information?',
      content: `EVERYTHING. REALLY.

If a client shares it during a session, it's confidential. This includes:

Personal Details
• Their name, age, location
• Contact information
• Where they work or go to school
• Family members' names

Life Circumstances
• Relationship situations
• Work or academic challenges
• Financial struggles
• Living situation
• Health concerns

Emotional Content
• How they're feeling
• What they're worried about
• Past experiences they share
• Hopes and fears for the future

Session Details
• That they even use Psychi
• How often they have sessions
• What topics you've discussed
• Progress they've made

THE "COFFEE SHOP TEST"

Here's a simple way to think about it: If you wouldn't say it about a client while sitting in a crowded coffee shop, don't say it anywhere. Even vague references like "I talked to someone today who..." can be identifying in the right context.`,
    },
    {
      id: 'confidentiality-3',
      title: 'Your Core Obligations',
      content: `1. NEVER DISCLOSE

What this means: You don't share client information with anyone — not friends, family, other supporters, or on social media. Ever.

This includes:
• Telling a friend about "this client I talked to"
• Posting vague references on social media
• Discussing clients with other Psychi supporters
• Sharing stories at parties (even without names)

Even "anonymous" sharing is risky. Details add up. "A college student in Chicago dealing with roommate issues" might sound anonymous, but to someone who knows that person, it's identifying.

2. NEVER USE INFORMATION FOR OTHER PURPOSES

What this means: Client information is for supporting that client. Period.

You cannot:
• Use their contact info to reach out personally
• Reference their situation to sell them something
• Use their stories for your own content or social media
• Share details for academic research without proper consent

3. PROTECT INFORMATION ACTIVELY

What this means: Take real steps to keep information safe.

Practical actions:
• Don't leave sessions visible on shared screens
• Log out of Psychi when you're done
• Don't discuss clients where others might overhear
• Be aware of your surroundings during voice/video sessions

4. NEVER RECORD OR CAPTURE

What this means: Don't create any record of sessions outside of Psychi's platform.

This includes:
• Screenshots of conversations
• Photos of your screen
• Voice recordings
• Writing down details in personal notes
• Copying chat text elsewhere

Psychi's platform handles record-keeping securely. You don't need to — and shouldn't — create your own records.

5. CREATE A SECURE ENVIRONMENT

What this means: When you're in a session, make sure you're truly private.

Before each session, check:
• Am I in a private space?
• Can anyone overhear me?
• Is my screen visible to others?
• Am I using headphones for audio/video calls?

If your environment isn't secure, reschedule the session. It's better to delay than to compromise privacy.`,
    },
    {
      id: 'confidentiality-4',
      title: 'Exceptions — When You Must Speak Up',
      content: `Confidentiality is critical, but it's not absolute. There are rare situations where you're required to break confidentiality to protect someone from serious harm.

EXCEPTION 1: IMMINENT RISK OF HARM

When it applies: A client expresses intent to seriously harm themselves or someone else, and the threat appears imminent and credible.

What to do:
1. Stay calm and supportive with the client
2. Refer the client to the 988 Suicide & Crisis Lifeline or local emergency services, and contact Psychi support immediately at psychiapp@outlook.com
3. If the threat is imminent, contact emergency services (911)

Important: This is for imminent, serious threats — not general expressions of sadness or frustration. If you're unsure, contact Psychi support at psychiapp@outlook.com.

EXCEPTION 2: LEGAL REQUIREMENTS

When it applies: You receive a court order or legal demand requiring disclosure.

What to do:
1. Do not respond to the request directly
2. Contact Psychi immediately at psychiapp@outlook.com
3. We will guide you through the proper process
4. Never disclose without confirming with Psychi first

EXCEPTION 3: CHILD ABUSE OR NEGLECT

When it applies: A client discloses that a child is being abused or neglected, or you have reasonable suspicion this is occurring.

What to do:
1. Report to appropriate local authorities (laws vary by location)
2. Notify Psychi at psychiapp@outlook.com
3. Document the disclosure within the platform

Note: "Child" typically means anyone under 18. Reporting requirements vary by jurisdiction — when in doubt, report and let authorities assess.

A NOTE ON THESE EXCEPTIONS

These situations are rare, but they're serious. The goal is always to protect life and prevent harm. If you're ever unsure whether an exception applies, reach out to Psychi's support team. We're here to help you navigate difficult situations.`,
    },
    {
      id: 'confidentiality-5',
      title: 'Real Scenarios',
      content: `Let's walk through some situations you might encounter.

SCENARIO 1: THE CURIOUS FRIEND

Situation: Your friend knows you're a Psychi supporter and asks, "So what kind of stuff do people talk to you about?"

Wrong response: "Oh, you know, relationship stuff mostly. This one person is going through a really messy divorce..."

Right response: "I keep everything confidential, so I can't really share details. But I find it really rewarding to help people work through challenges."

Why: Even general trends or "types" of issues can feel like a breach to clients. Keep it vague and redirect.

SCENARIO 2: THE SOCIAL MEDIA TEMPTATION

Situation: You had a powerful session where you really helped someone. You want to share the experience (without names) on your Instagram.

Wrong response: Posting "Had an amazing session today helping someone realize their worth after years of emotional abuse. This is why I do this work. 💙"

Right response: Don't post it. If you want to share about being a supporter generally, keep it completely abstract: "Grateful for the opportunity to support others through Psychi."

Why: Even without names, clients might recognize themselves. Others who know them might connect dots. The emotional specificity makes it identifiable.

SCENARIO 3: THE SHARED SPACE

Situation: You're about to start a video session, but your roommate is in the next room with the door open.

Wrong response: Starting the session anyway and hoping they won't hear.

Right response: Message your client: "Hey, I need a few minutes to find a private space. Can we start in 10 minutes?" Then find somewhere truly private or use headphones and keep your voice low.

Why: Your client deserves to know their words aren't being overheard. If you can't guarantee privacy, delay.

SCENARIO 4: THE WORRIED FAMILY MEMBER

Situation: Someone contacts you claiming to be a client's parent/partner/friend, saying they're worried about them and asking what you've discussed.

Wrong response: Sharing any information, even to reassure them.

Right response: "I'm not able to confirm or discuss anything about anyone who may or may not use this platform. If you're concerned about someone, I'd encourage you to reach out to them directly or contact appropriate support services."

Why: You can't even confirm someone is a client. The concerned person might not be who they claim, and even if they are, the client's privacy comes first.`,
    },
    {
      id: 'confidentiality-6',
      title: 'Safety Scenario & Lasting Responsibility',
      content: `SCENARIO 5: THE SAFETY CONCERN

Situation: During a session, a client says: "I've been thinking a lot about ending things. I have a plan, and I'm going to do it tonight."

Wrong response: Keeping it confidential because "that's the rule."

Right response:
1. Stay calm: "I'm really glad you told me this. I'm concerned about your safety."
2. Refer them to the 988 Suicide & Crisis Lifeline and contact Psychi support immediately at psychiapp@outlook.com

Why: This is an imminent safety risk. The exception to confidentiality exists specifically for moments like this. Your job is to help keep them safe, even if it means involving others.

LASTING RESPONSIBILITY

CONFIDENTIALITY DOESN'T EXPIRE

Your obligation to protect client information doesn't end when:
• A session ends
• A client stops using Psychi
• You take a break from being a supporter
• You leave the platform entirely

What was shared with you in confidence stays confidential forever. Five years from now, you still can't tell that story at a dinner party.

WHY THIS MATTERS LONG-TERM

People's lives change. Something that seemed minor when shared could become significant later. A client might:
• Enter a new relationship
• Start a new job
• Run for office
• Simply deserve their privacy

You never know how information might affect someone in the future. The safest approach is permanent confidentiality.`,
    },
    {
      id: 'confidentiality-7',
      title: 'Consequences & Quick Reference',
      content: `CONSEQUENCES OF BREACH

We take confidentiality seriously. If you breach this agreement:

Immediate consequences may include:
• Suspension of your supporter account
• Investigation of the incident
• Permanent removal from the platform
• Forfeiture of pending earnings

Additional consequences may include:
• Legal action if the breach causes harm
• Reporting to relevant academic or professional bodies
• Civil liability for damages

But beyond consequences...

Remember why this matters. A breach doesn't just affect your standing with Psychi — it affects a real person who trusted you. The guilt of knowing you betrayed someone's trust is its own consequence.

QUICK REFERENCE GUIDE

ALWAYS DO:
✓ Conduct sessions in private spaces
✓ Use headphones for audio/video
✓ Log out when you're done
✓ Report safety concerns through proper channels
✓ Ask Psychi if you're unsure about a situation

NEVER DO:
✗ Share client information with anyone
✗ Post about clients on social media (even vaguely)
✗ Screenshot or record sessions
✗ Discuss clients with other supporters
✗ Confirm someone is a client to anyone asking

WHEN IN DOUBT:
→ Don't share
→ Contact Psychi support
→ Err on the side of more privacy, not less

You're now ready to hold space for others with the trust and care they deserve.

Welcome to Psychi.`,
    },
  ],
  mindfulness: [
    {
      id: 'mindfulness-1',
      title: 'Definition & Origins of Mindfulness',
      content: `Mindfulness has emerged as one of the most influential concepts in modern mental health treatment, bridging ancient contemplative wisdom with contemporary psychological science. While the practice has roots stretching back over 2,500 years to Buddhist meditation traditions, its integration into Western psychology represents a remarkable synthesis of Eastern philosophy and empirical research.

At its core, mindfulness is the practice of intentionally directing attention to present-moment experience with an attitude of openness, curiosity, and non-judgment. It involves observing thoughts, emotions, bodily sensations, and environmental stimuli as they arise, without attempting to change, suppress, or elaborate upon them.

"Mindfulness is awareness that arises through paying attention, on purpose, in the present moment, non-judgmentally. And then I sometimes add, in the service of self-understanding and wisdom." — Jon Kabat-Zinn, PhD, Founder of MBSR

The modern mindfulness movement began in 1979 when Jon Kabat-Zinn, a molecular biologist trained in Zen Buddhism, established the Stress Reduction Clinic at the University of Massachusetts Medical School. His eight-week Mindfulness-Based Stress Reduction (MBSR) program stripped away the religious and cultural elements of Buddhist meditation, making the practice accessible to secular audiences.

Key Insight for Supporters: Understanding mindfulness's dual heritage—ancient wisdom and modern science—helps you present it credibly to clients. Some may appreciate the philosophical depth; others prefer knowing it's evidence-based. Being able to speak to both dimensions makes you a more effective guide.`,
    },
    {
      id: 'mindfulness-2',
      title: 'How Mindfulness Works',
      content: `Mindfulness works by shifting the way we relate to our thoughts and experiences. Rather than getting caught up in automatic reactions—like rumination, avoidance, or emotional reactivity—mindfulness helps us observe our inner world with clarity and equanimity. It creates a mental space between stimulus and response, allowing us to choose how to act rather than react.

Example: Social Anxiety
Consider the experience of feeling anxious before a social event. Without mindfulness, the mind might spin into "what-if" scenarios: What if I say something awkward? What if no one likes me? These thoughts trigger feelings of panic, and we might avoid the event altogether.

With mindfulness, you notice the anxiety arising, recognize it as a passing mental event, and observe it with compassion instead of judgment. This shift allows you to respond with intention—perhaps by taking a few calming breaths or reminding yourself that it's okay to be nervous.

In short, mindfulness helps us recognize that thoughts are not facts, and feelings don't have to control our behavior.`,
    },
    {
      id: 'mindfulness-3',
      title: 'Mindfulness in Practice',
      content: `Mindfulness can be practiced formally through meditation, or informally in everyday activities. Both forms are valuable and can support one another.

1. Formal Practice: Mindfulness Meditation
Mindfulness meditation typically involves setting aside time to focus your attention on a specific anchor—commonly the breath, body sensations, or sounds. The instructions are simple:
• Sit or lie down comfortably
• Focus your attention on your breath—notice the sensation of air moving in and out
• When your mind wanders (and it will), gently bring it back to the breath
• Do this again and again, with patience and kindness

This practice helps train your attention and build awareness of your mental habits.

2. Informal Practice: Everyday Mindfulness
You don't have to sit on a cushion to be mindful. Some of the most powerful mindfulness happens during daily life:
• Eating mindfully means truly tasting your food, noticing textures, colors, and the act of chewing—without screens or multitasking
• Walking mindfully means feeling your feet touch the ground, sensing the rhythm of your movement
• Listening mindfully means giving someone your full attention, without planning what you'll say next

Any moment can become a moment of mindfulness. The key is to bring your awareness fully into the here and now.`,
    },
    {
      id: 'mindfulness-4',
      title: 'Mindfulness in Therapy and Mental Health',
      content: `Mindfulness has been integrated into several evidence-based therapies:

Mindfulness-Based Stress Reduction (MBSR)
An 8-week program developed by Jon Kabat-Zinn to help people manage chronic stress, pain, and illness.

Mindfulness-Based Cognitive Therapy (MBCT)
Combines mindfulness with cognitive therapy techniques, particularly effective in preventing relapse in depression.

Dialectical Behavior Therapy (DBT)
Uses mindfulness to help individuals regulate emotions and tolerate distress.

Acceptance and Commitment Therapy (ACT)
Encourages mindfulness and acceptance of thoughts and feelings while committing to meaningful values and actions.

These approaches share the belief that being present with your experience—rather than avoiding or controlling it—is key to healing. Mindfulness doesn't eliminate difficult feelings, but it gives you a different way to relate to them.`,
    },
    {
      id: 'mindfulness-5',
      title: 'Getting Started with Mindfulness',
      content: `If you're new to mindfulness, here are some simple ways to begin:
• Try a 5-minute breathing meditation each morning
• Choose one activity a day to do with full attention—like brushing your teeth or making tea
• Notice your senses throughout the day: What can you hear, see, touch, or smell right now?

Remember: Mindfulness isn't about "clearing your mind" or achieving some perfect state. It's about noticing, again and again, what is here—without judgment.

Key Takeaway: Mindfulness is a powerful and practical skill that helps you live with greater presence, clarity, and compassion. By learning to pay attention with care and openness, you don't just manage stress—you change your relationship to it.`,
    },
    {
      id: 'mindfulness-6',
      title: 'Research & Evidence Base',
      content: (
        <View>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 }}>
            The following peer-reviewed studies provide the scientific foundation for mindfulness-based interventions:
          </Text>
          <StudyCard study={{
            title: 'MBSR Meta-Analysis: Effects on Anxiety and Depression',
            authors: 'Hofmann, S. G., et al. (2010)',
            journal: 'Journal of Consulting and Clinical Psychology, 78(2), 169-183',
            finding: 'Meta-analysis of 39 studies found mindfulness-based therapy was moderately effective for improving anxiety and mood symptoms.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/20350028/',
          }} />
          <StudyCard study={{
            title: 'Mindfulness and Brain Structure Changes',
            authors: 'Hölzel, B. K., et al. (2011)',
            journal: 'Psychiatry Research: Neuroimaging, 191(1), 36-43',
            finding: '8-week MBSR participation was associated with increases in gray matter concentration in brain regions involved in learning, memory, and emotion regulation.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/21071182/',
          }} />
          <StudyCard study={{
            title: 'MBCT for Depression Relapse Prevention',
            authors: 'Kuyken, W., et al. (2016)',
            journal: 'JAMA Psychiatry, 73(6), 565-574',
            finding: 'MBCT significantly reduces risk of depressive relapse compared to usual care.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/27119968/',
          }} />
          <StudyCard study={{
            title: 'Mechanisms of Mindfulness',
            authors: 'Hölzel, B. K., et al. (2011)',
            journal: 'Perspectives on Psychological Science, 6(6), 537-559',
            finding: 'Identifies key mechanisms including attention regulation, body awareness, emotion regulation, and change in perspective on the self.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/26168376/',
          }} />
        </View>
      ),
    },
    {
      id: 'mindfulness-8',
      title: 'Resources & Tools',
      content: (
        <View>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 }}>
            Use these resources to deepen your own practice and share with clients:
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginBottom: Spacing.sm }}>Recommended Books:</Text>
          <ResourceCard resource={{
            title: 'Full Catastrophe Living',
            author: 'Jon Kabat-Zinn',
            description: 'The definitive guide to MBSR from its creator',
            type: 'book',
          }} />
          <ResourceCard resource={{
            title: 'Wherever You Go, There You Are',
            author: 'Jon Kabat-Zinn',
            description: 'An accessible introduction to mindfulness in daily life',
            type: 'book',
          }} />
          <ResourceCard resource={{
            title: 'The Miracle of Mindfulness',
            author: 'Thich Nhat Hanh',
            description: 'A classic guide to mindfulness meditation',
            type: 'book',
          }} />
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginTop: Spacing.md, lineHeight: 20, fontStyle: 'italic' }}>
            Reflection Prompt: Before moving on, take a moment to practice what you've learned. Close your eyes, take three deep breaths, and notice what you're experiencing right now—thoughts, feelings, sensations—without trying to change anything. This is mindfulness in action.
          </Text>
        </View>
      ),
    },
  ],
  cbt: [
    {
      id: 'cbt-1',
      title: 'Understanding Cognitive Behavioral Therapy (CBT)',
      content: `Cognitive Behavioral Therapy (CBT) is one of the most widely researched and practiced forms of psychotherapy in the modern world. It is a structured, time-limited, and goal-oriented form of treatment that focuses on the interplay between thoughts, feelings, and behaviors.

Originally developed in the 1960s by Dr. Aaron Beck for the treatment of depression, CBT has since evolved and is now used to treat a wide variety of mental health conditions, including anxiety disorders, PTSD, OCD, eating disorders, and substance use disorders.

Core Premise: Psychological distress is largely influenced by patterns of negative or distorted thinking. These cognitive distortions—such as catastrophizing, black-and-white thinking, or personalization—can lead to maladaptive emotional responses and unhelpful behaviors.

The goal of CBT is to help individuals identify and challenge these distortions, replace them with more balanced thoughts, and develop healthier behavioral responses.

Unlike some traditional psychotherapies that delve deeply into childhood experiences or unconscious processes, CBT is focused on present-day problems and practical strategies.`,
    },
    {
      id: 'cbt-2',
      title: 'How CBT Works in Practice',
      content: `CBT operates on the principle that our thoughts, feelings, and behaviors are interconnected—what we think affects how we feel, and how we feel affects what we do.

The Cognitive Triangle:
• Thoughts influence feelings
• Feelings influence behaviors
• Behaviors influence thoughts (and the cycle continues)

Example: Job Interview Anxiety
Thought: "I'm going to mess this up and embarrass myself."
Feeling: Anxiety, dread, tension
Behavior: Avoid preparing, consider canceling, perform poorly due to nerves

With CBT, you would:
1. Identify the automatic thought ("I'm going to mess this up")
2. Examine the evidence for and against this thought
3. Generate a more balanced alternative ("I've prepared well. Even if I'm nervous, I can still do my best")
4. Notice how the new thought changes feelings and behaviors

Key Techniques:
• Thought Records - Documenting situations, thoughts, and emotions to identify patterns
• Cognitive Restructuring - Challenging and replacing distorted thoughts
• Behavioral Experiments - Testing beliefs through real-world actions
• Behavioral Activation - Scheduling positive activities to combat depression`,
    },
    {
      id: 'cbt-3',
      title: 'Common Cognitive Distortions',
      content: `Cognitive distortions are systematic errors in thinking that can lead to emotional distress. Learning to recognize these patterns is essential:

All-or-Nothing Thinking
Seeing things in black and white categories. "If I don't get an A, I'm a complete failure."

Catastrophizing
Expecting the worst possible outcome. "If I make a mistake at work, I'll definitely get fired."

Mind Reading
Assuming you know what others are thinking. "Everyone at this party thinks I'm boring."

Fortune Telling
Predicting negative outcomes without evidence. "I know this won't work out."

Personalization
Blaming yourself for things outside your control. "The project failed because of me."

Emotional Reasoning
Believing that feelings reflect reality. "I feel stupid, so I must be stupid."

Should Statements
Rigid rules about how things must be. "I should always be productive."

Overgeneralization
Drawing broad conclusions from single events. "I failed once, so I always fail."

Discounting the Positive
Dismissing good things as if they don't count. "Anyone could have done that."

Labeling
Attaching fixed labels instead of describing behavior. "I'm a loser" instead of "I made a mistake."`,
    },
    {
      id: 'cbt-4',
      title: 'CBT Techniques for Peer Support',
      content: `As a peer supporter, you can use CBT-informed techniques while staying within your scope:

1. Socratic Questioning
Ask open-ended questions to help clients examine their thoughts:
• "What evidence supports that thought?"
• "What evidence goes against it?"
• "What would you tell a friend in this situation?"
• "What's another way to look at this?"

2. Behavioral Activation (for low mood)
Help clients schedule pleasant or meaningful activities:
• Start small and achievable
• Focus on activities that align with values
• Track mood before and after activities

3. Thought Challenging (gentle approach)
Guide clients to consider alternatives:
• "I hear that you're thinking X. Have you considered Y?"
• "What's the best case scenario? The worst? The most likely?"

4. Breaking Down Overwhelming Tasks
Help clients approach daunting situations step by step:
• Identify the smallest first step
• Build momentum through small wins

Important Boundaries:
• You are not conducting formal CBT therapy
• Avoid diagnosing or using clinical language
• Refer to licensed professionals for complex cases
• Focus on psychoeducation and support, not treatment`,
    },
    {
      id: 'cbt-5',
      title: 'The Importance of Homework in CBT',
      content: `One of the distinguishing features of CBT is its emphasis on homework—activities clients do between sessions to practice skills and apply insights.

Why Homework Matters:
• Real progress happens when skills are applied in daily life
• Builds self-efficacy and independence
• Provides data for discussion in future sessions
• Reinforces learning through repetition

Types of CBT Homework:
• Thought records: Tracking automatic thoughts and challenging them
• Activity scheduling: Planning positive activities for the week
• Behavioral experiments: Testing out new behaviors or beliefs
• Reading: Learning about CBT concepts and techniques
• Relaxation practice: Applying breathing or grounding exercises

For Supporters:
Encourage clients to practice skills between sessions. You might suggest:
• "What's one small thing you could try this week?"
• "Would you be willing to notice when this thought comes up?"
• "Can you track your mood for a few days and we'll discuss it next time?"

Remember: Homework should feel collaborative, not assigned. Let clients choose what feels manageable.`,
    },
    {
      id: 'cbt-6',
      title: 'Research & Resources',
      content: (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginBottom: Spacing.sm }}>Research Evidence:</Text>
          <StudyCard study={{
            title: 'CBT for Depression',
            authors: 'Butler, A. C., et al. (2006)',
            journal: 'Journal of Consulting and Clinical Psychology',
            finding: 'CBT is highly effective for depression, with effects comparable to medication.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/16551149/',
          }} />
          <StudyCard study={{
            title: 'CBT for Anxiety Disorders',
            authors: 'Hofmann, S. G., & Smits, J. A. (2008)',
            journal: 'Journal of Clinical Psychiatry',
            finding: 'CBT is the gold standard treatment for anxiety disorders.',
            url: 'https://pubmed.ncbi.nlm.nih.gov/18363421/',
          }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.md, marginBottom: Spacing.sm }}>Recommended Books:</Text>
          <ResourceCard resource={{
            title: 'Feeling Good',
            author: 'David Burns',
            description: 'Classic self-help book on CBT for depression',
            type: 'book',
          }} />
          <ResourceCard resource={{
            title: 'Mind Over Mood',
            author: 'Greenberger & Padesky',
            description: 'Practical CBT workbook',
            type: 'book',
          }} />
          <ResourceCard resource={{
            title: 'The Feeling Good Handbook',
            author: 'David Burns',
            description: 'Comprehensive CBT techniques',
            type: 'book',
          }} />
        </View>
      ),
    },
  ],
  validation: [
    {
      id: 'validation-1',
      title: 'Understanding Validation',
      content: `Validation is one of the most powerful tools in a supporter's toolkit. It is the act of acknowledging and affirming another person's internal experience—their thoughts, feelings, and behaviors—as understandable, legitimate, and real.

Validation does NOT mean:
• Agreeing with someone
• Approving of their behavior
• Telling them they're right
• Solving their problem

Validation DOES mean:
• Recognizing their feelings are real
• Communicating understanding
• Showing that their reaction makes sense given their perspective
• Creating a safe space for authentic expression

Why Validation Matters:
Research shows that emotional validation reduces distress, builds trust, and helps people feel understood. When we feel validated, we're more open to exploring our experiences and considering new perspectives.

"Validation communicates to our clients that their feelings, thoughts, and behaviors have causes and are understandable in some way." — Marsha Linehan, PhD, Creator of DBT`,
    },
    {
      id: 'validation-2',
      title: 'The Six Levels of Validation (DBT)',
      content: `Marsha Linehan identified six levels of validation, ranging from basic attentiveness to radical genuineness:

Level 1: Being Present
Pay attention. Put away distractions. Show through your body language that you're listening.
Example: Making eye contact, nodding, turning toward the person.

Level 2: Accurate Reflection
Reflect back what you've heard without adding interpretation.
Example: "So you're saying that when your boss criticized you in the meeting, you felt embarrassed and angry."

Level 3: Reading Behavior
Articulate what the person hasn't said but may be feeling.
Example: "It sounds like you might be feeling overwhelmed right now."

Level 4: Understanding History
Validate based on the person's past experiences.
Example: "Given what happened with your last job, it makes sense you'd be anxious about this."

Level 5: Normalizing
Communicate that the reaction is normal and understandable.
Example: "Anyone in your situation would feel frustrated."

Level 6: Radical Genuineness
Treat the person as an equal, capable of change and growth.
Example: Engaging authentically, being honest, believing in their capacity.`,
    },
    {
      id: 'validation-3',
      title: 'Validation vs. Invalidation',
      content: `Recognizing invalidation is just as important as practicing validation.

Invalidating Responses to Avoid:
• "You'll be fine!" (dismissing)
• "Don't worry about it." (minimizing)
• "Others have it worse." (comparing)
• "You shouldn't feel that way." (judging)
• "Just think positive!" (bypassing)
• "At least..." (silver lining)
• "I know exactly how you feel." (assuming)
• Immediately offering advice (fixing)

Impact of Invalidation:
When people feel invalidated, they may:
• Shut down and stop sharing
• Feel ashamed of their emotions
• Escalate their expression to be heard
• Lose trust in the relationship
• Doubt their own experience

Validating Alternatives:
Instead of "You'll be fine," try:
"This sounds really hard. I'm here with you."

Instead of "Don't worry about it," try:
"It makes sense that you're worried. This matters to you."

Instead of "Just think positive," try:
"I hear how painful this is. What would feel supportive right now?"`,
    },
    {
      id: 'validation-4',
      title: 'Validation in Practice',
      content: `Here's how to apply validation in your sessions:

Step 1: Listen Fully
Before responding, truly hear what the person is saying. Don't plan your response while they're talking.

Step 2: Identify the Emotion
What feeling is being expressed? Sometimes it's stated directly; sometimes you need to read between the lines.

Step 3: Validate the Emotion
Acknowledge the feeling without judgment:
• "That sounds incredibly frustrating."
• "I can see why you'd feel hurt by that."
• "It makes sense that you're anxious about this."

Step 4: Explore if Invited
Only after validating, and only if appropriate, you might:
• Ask what they need
• Offer to explore the situation together
• Gently introduce other perspectives

Common Validation Phrases:
• "That sounds really difficult."
• "I can understand why you'd feel that way."
• "Of course you're upset—this is a big deal."
• "Your feelings make sense given what happened."
• "I hear you. This matters."
• "It's okay to feel [emotion]."

Remember: Validation often needs to happen multiple times before moving forward. Don't rush to solutions.`,
    },
    {
      id: 'validation-5',
      title: 'Validation and Agreement Are Different',
      content: `A common misconception is that validating someone means agreeing with them. This is not true.

Validation = Acknowledging someone's experience is real and understandable
Agreement = Sharing the same opinion or belief

Example:
A client says: "My coworker is so annoying. They always interrupt me in meetings."

Validating Response:
"It sounds really frustrating to be interrupted. I can see why that would bother you."
(You're acknowledging their feelings without saying the coworker is wrong.)

Agreeing Response:
"Yeah, your coworker sounds terrible. They shouldn't do that."
(You're taking their side and making a judgment.)

Why This Matters:
• You can validate someone's anger without validating aggression
• You can validate someone's fear without validating avoidance
• You can validate someone's perception without confirming it as fact

Validation opens the door to exploration. Agreement can sometimes shut it down by ending the conversation prematurely.`,
    },
    {
      id: 'validation-6',
      title: 'The Science of Validation',
      content: (
        <View>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 }}>
            Research supports the powerful effects of emotional validation:
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.sm }}>Reduces Emotional Arousal</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 }}>
            Studies show that validation can reduce physiological stress responses. When people feel heard, their nervous system calms.
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.sm }}>Builds Trust and Rapport</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 }}>
            Validation is foundational to therapeutic alliance—the relationship quality that predicts treatment outcomes.
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.sm }}>Decreases Emotional Suppression</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 }}>
            When emotions are validated, people are less likely to suppress them, leading to healthier processing.
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.sm }}>Improves Communication</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 }}>
            Validated individuals are more open to feedback and alternative perspectives.
          </Text>
        </View>
      ),
    },
    {
      id: 'validation-7',
      title: 'Resources & Practice',
      content: (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginBottom: Spacing.sm }}>Recommended Reading:</Text>
          <ResourceCard resource={{
            title: 'The High-Conflict Couple',
            author: 'Alan Fruzzetti',
            description: 'DBT approach to validation in relationships',
            type: 'book',
          }} />
          <ResourceCard resource={{
            title: 'DBT Skills Training Manual',
            author: 'Marsha Linehan',
            description: 'Comprehensive validation framework',
            type: 'book',
          }} />
          <ResourceCard resource={{
            title: 'Nonviolent Communication',
            author: 'Marshall Rosenberg',
            description: 'Related approach to empathic communication',
            type: 'book',
          }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.md, marginBottom: Spacing.sm }}>Practice Exercise:</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 }}>
            Think of a recent conversation where someone shared something difficult. How might you have responded with validation?
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.sm }}>Scenario 1:</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, lineHeight: 20 }}>
            Friend says: "I'm so stressed about this presentation tomorrow."
          </Text>
          <Text style={{ fontSize: 14, color: PsychiColors.azure, marginBottom: Spacing.sm, lineHeight: 20, fontStyle: 'italic' }}>
            Validating response: "Presentations can be nerve-wracking. It makes sense you're feeling the pressure."
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.sm }}>Scenario 2:</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, lineHeight: 20 }}>
            Client says: "Nobody understands what I'm going through."
          </Text>
          <Text style={{ fontSize: 14, color: PsychiColors.azure, marginBottom: Spacing.sm, lineHeight: 20, fontStyle: 'italic' }}>
            Validating response: "It sounds like you've been feeling really alone in this. That isolation must be painful."
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.md }}>Reflection:</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, lineHeight: 20 }}>
            Notice this week when you're tempted to fix, advise, or minimize. Pause and try validation first. Observe what happens.
          </Text>
        </View>
      ),
    },
  ],
  crisis: [
    {
      id: 'crisis-1',
      title: 'Understanding Crisis and Suicide Risk',
      content: `As a peer supporter, you may encounter clients in crisis, including those experiencing suicidal thoughts. Understanding crisis recognition is essential for providing safe, effective support.

What is a Mental Health Crisis?
A crisis occurs when a person's usual coping mechanisms are overwhelmed by stressors, leading to emotional distress and potential risk to safety.

Key Facts About Suicide:
• Suicide is preventable—most people who consider suicide don't want to die; they want their pain to stop
• Most suicidal crises are temporary—the acute phase often passes if the person can be kept safe
• Asking about suicide does NOT increase risk—research shows it can reduce distress
• Warning signs are often present—learning to recognize them saves lives

Your Role as a Supporter:
• Recognize warning signs
• Ask directly about safety
• Provide crisis resources
• Know when to escalate
• Never promise to keep safety concerns secret`,
    },
    {
      id: 'crisis-2',
      title: 'Warning Signs of Suicide Risk',
      content: `Learn to recognize these warning signs:

Verbal Cues:
• Direct statements: "I want to die," "I wish I wasn't here"
• Indirect statements: "Everyone would be better off without me," "I can't take this anymore"
• Talking about death or dying
• Expressing hopelessness or having no reason to live
• Describing feeling trapped or in unbearable pain

Behavioral Changes:
• Giving away prized possessions
• Saying goodbye to loved ones
• Putting affairs in order (writing a will, etc.)
• Withdrawing from friends and activities
• Increased substance use
• Reckless or risky behavior
• Sleep changes (too much or too little)
• Sudden calmness after a period of distress

Risk Factors:
• Previous suicide attempt (strongest predictor)
• Mental health conditions (depression, bipolar, etc.)
• Access to lethal means (firearms, medications)
• Recent loss or major life stressor
• Chronic pain or illness
• Social isolation
• Family history of suicide`,
    },
    {
      id: 'crisis-3',
      title: 'Passive vs. Active Suicidal Ideation',
      content: `Understanding the spectrum of suicidal thinking helps you assess risk:

Passive Suicidal Ideation:
• Wishes to not exist or not wake up
• "I wouldn't mind if I died"
• No specific plan or intent to act
• May include thoughts of death as relief
• Still concerning and requires attention

Active Suicidal Ideation:
• Specific thoughts about ending one's life
• May include planning (when, where, how)
• May have intent to act
• May have access to means
• May have a timeline
• Higher immediate risk

Questions to Assess:
• "Are you having thoughts of hurting yourself?" (Direct)
• "Are these thoughts about wishing you weren't here, or about actually ending your life?" (Distinguishing)
• "Do you have a plan for how you would do it?" (Plan)
• "Do you have access to [means]?" (Means)
• "When are you thinking of doing this?" (Timeline)

Important: Asking these questions does not plant ideas. Research shows direct questioning is safe and may reduce distress.`,
    },
    {
      id: 'crisis-4',
      title: 'Limits of Confidentiality',
      content: `Confidentiality is essential for trust, but it has limits when safety is at risk.

You May Need to Break Confidentiality When:
• There is imminent risk of self-harm or suicide
• There is imminent risk of harm to another person
• Abuse is disclosed involving a minor or vulnerable adult
• Required by law

How to Communicate This:
At the start of your relationship with a client, be clear:
"Everything we discuss is confidential, with some important exceptions. If I'm concerned about your safety or someone else's safety, I may need to involve others to make sure you get the help you need."

When Breaking Confidentiality:
• Explain why you're doing it
• Involve the client as much as possible
• Be compassionate, not punitive
• Focus on care, not consequences

Remember: Breaking confidentiality to save a life is always the right choice. A client may be upset in the moment, but you are prioritizing their wellbeing.`,
    },
    {
      id: 'crisis-5',
      title: 'Crisis Response Protocol',
      content: `When you identify a crisis, follow these steps:

Step 1: Stay Calm
Your calm presence is stabilizing. Take a breath before responding.

Step 2: Listen Without Judgment
Let them share. Don't interrupt or try to fix immediately.

Step 3: Ask Directly About Safety
"Are you thinking about hurting yourself?"
"Do you have a plan?"
"Do you have access to [means]?"

Step 4: Validate Their Pain
"I'm so sorry you're feeling this way. This sounds incredibly painful."

Step 5: NEVER Promise to Keep It Secret
"I care about you too much to keep this to myself. I want to make sure you're safe."

Step 6: Provide Crisis Resources
• 988 Suicide & Crisis Lifeline (call or text)
• Crisis Text Line (text HOME to 741741)
• 911 for immediate danger

Step 7: Alert Psychi Safety Team at psychiapp@outlook.com

Step 8: Stay With Them
Don't end the session abruptly. Stay until they're stabilized or help arrives.`,
    },
    {
      id: 'crisis-6',
      title: 'What You Must NOT Do',
      content: `Critical Boundaries in Crisis Situations:

NEVER promise to keep safety disclosures confidential.
If someone says "Promise you won't tell anyone," you must explain that safety comes first.

NEVER attempt to handle a crisis alone without escalating.
You are not an emergency responder. Use the resources available.

NEVER diagnose or provide clinical assessments.
You can recognize warning signs, but diagnosis is beyond your scope.

NEVER give medical advice or suggest medication changes.
Refer to licensed professionals for clinical decisions.

NEVER meet clients outside the platform.
Maintain boundaries even in crisis situations.

NEVER share personal contact information.
Keep all communication within Psychi.

NEVER minimize or dismiss suicidal thoughts.
Even passive ideation deserves attention and care.

NEVER use guilt or shame to prevent self-harm.
Statements like "Think about your family" can backfire.

NEVER leave someone alone if they're in immediate danger.
Stay on the call while emergency services are contacted.`,
    },
    {
      id: 'crisis-7',
      title: 'Self-Harm (Non-Suicidal Self-Injury)',
      content: `Self-harm, or non-suicidal self-injury (NSSI), is distinct from suicidal behavior but requires understanding and compassionate response.

What is NSSI?
Intentional self-inflicted harm without intent to die. Common forms include cutting, burning, hitting, or scratching.

Why Do People Self-Harm?
• Emotional regulation: To cope with overwhelming feelings
• Self-punishment: In response to shame or guilt
• Communication: To express pain that feels inexpressible
• Feeling something: To combat numbness or dissociation
• Control: To feel a sense of agency over one's body

How to Respond:
• Don't react with shock or disgust
• Validate the pain underneath: "It sounds like you've been dealing with a lot of difficult emotions"
• Ask about safety without judgment: "Are you currently safe?"
• Explore what's driving the behavior
• Encourage professional support for underlying issues
• Focus on harm reduction if stopping isn't immediately possible

Important: Self-harm is often a coping mechanism. The goal is to understand the function it serves and support development of healthier alternatives.`,
    },
    {
      id: 'crisis-8',
      title: 'Means Restriction',
      content: `Means restriction is one of the most effective suicide prevention strategies.

What is Means Restriction?
Reducing access to methods that could be used for suicide or self-harm. This includes:
• Firearms (securing or removing from home)
• Medications (locking up or limiting quantities)
• Sharp objects
• Other lethal means

Why It Works:
• Many suicidal crises are impulsive
• Putting time and distance between urge and means can save lives
• People rarely substitute methods—if one means is unavailable, the crisis often passes
• Research shows means restriction significantly reduces suicide rates

How to Address It:
"I want to ask about your safety at home. Do you have access to anything that could be used to hurt yourself?"

If yes:
"Would you be willing to have someone hold onto those items for now, or put them somewhere harder to access?"

You're not asking them to give up everything forever—just creating a safety buffer during the crisis period.`,
    },
    {
      id: 'crisis-9',
      title: 'Crisis Resources & Self-Care',
      content: (
        <View>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginBottom: Spacing.sm }}>Essential Crisis Resources:</Text>
          <ResourceCard resource={{
            title: '988 Suicide & Crisis Lifeline',
            description: 'Call or text 988 (US) - 24/7 support for anyone in crisis',
            url: 'https://988lifeline.org/',
            type: 'website',
          }} />
          <ResourceCard resource={{
            title: 'Crisis Text Line',
            description: 'Text HOME to 741741 - Free, 24/7 text-based crisis support',
            url: 'https://www.crisistextline.org/',
            type: 'website',
          }} />
          <ResourceCard resource={{
            title: 'International Association for Suicide Prevention',
            description: 'Directory of crisis centers worldwide',
            url: 'https://www.iasp.info/resources/Crisis_Centres/',
            type: 'website',
          }} />
          <ResourceCard resource={{
            title: 'The Trevor Project (LGBTQ+ Youth)',
            description: '1-866-488-7386 or text START to 678-678',
            url: 'https://www.thetrevorproject.org/',
            type: 'website',
          }} />
          <ResourceCard resource={{
            title: 'Trans Lifeline',
            description: '877-565-8860 - Peer support for trans individuals',
            url: 'https://translifeline.org/',
            type: 'website',
          }} />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#2A2A2A', marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Self-Care After Crisis Work:</Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 }}>
            Supporting someone in crisis is emotionally demanding. Take care of yourself:
          </Text>
          <Text style={{ fontSize: 14, color: PsychiColors.textSecondary, lineHeight: 22 }}>
            {'\u2022'} Debrief with a supervisor or peer{'\n'}
            {'\u2022'} Take breaks between difficult sessions{'\n'}
            {'\u2022'} Practice your own grounding and self-care{'\n'}
            {'\u2022'} Recognize signs of vicarious trauma{'\n'}
            {'\u2022'} Seek support if you're struggling
          </Text>
          <Text style={{ fontSize: 14, color: PsychiColors.azure, marginTop: Spacing.md, lineHeight: 20, fontStyle: 'italic' }}>
            Remember: You cannot pour from an empty cup. Your wellbeing matters too.
          </Text>
        </View>
      ),
    },
  ],
  platform: [
    {
      id: 'platform-1',
      title: 'Your Role as a Psychi Supporter',
      content: `As a Psychi Supporter, you provide empathetic, evidence-based peer support to clients navigating mental health challenges.

What You ARE:
• A trained peer supporter using evidence-based techniques
• A compassionate listener and guide
• A resource connector who can direct clients to professional help
• A safe space for processing emotions and experiences

What You Are NOT:
• A licensed therapist, counselor, or psychologist
• A medical professional who can diagnose or prescribe
• A crisis intervention specialist (though you know how to escalate)
• The client's only support resource

Scope of Practice:
DO:
• Listen actively and validate emotions
• Teach coping skills (mindfulness, CBT-informed techniques)
• Provide psychoeducation about mental health topics
• Encourage professional treatment when appropriate
• Follow crisis protocols when needed

DON'T:
• Diagnose mental health conditions
• Provide medical advice or discuss medications
• Make promises about outcomes
• Share your personal contact information
• Continue sessions beyond scheduled times without boundaries`,
    },
    {
      id: 'platform-2',
      title: 'Session Conduct Standards',
      content: `Professionalism in sessions builds trust and ensures quality support.

Video Session Requirements:
• Professional appearance: Business casual minimum, neutral colors recommended
• Clean, private background: No clutter, no other people visible
• Good lighting: Face clearly visible, avoid backlighting
• Stable internet: Test connection before sessions
• Audio quality: Use headphones to reduce echo

Environment Standards:
• Private space: No one should overhear the conversation
• Quiet location: Minimize background noise
• No interruptions: Silence notifications, inform household members

Time Management:
• Be on time—log in a few minutes early
• Don't exceed scheduled session length without clear reason
• If you need to end early, explain why and reschedule

Technical Issues:
• Have a backup plan (switch to voice, reschedule)
• Communicate clearly if issues arise
• Don't let technical problems derail the session—adapt`,
    },
    {
      id: 'platform-3',
      title: 'Attention and Presence',
      content: `Full attention is non-negotiable in peer support sessions.

What Full Attention Looks Like:
• Eye contact with the camera (not the screen)
• No multitasking—ever
• Phone away and on silent
• No checking other tabs or applications
• Focused body language (leaning in, nodding)

Why It Matters:
Clients can sense distraction even when they can't see it. Divided attention:
• Damages trust
• Makes clients feel unimportant
• Reduces effectiveness of support
• Can lead to missing important cues

Staying Present:
• If your mind wanders, gently bring it back
• Take notes mindfully, not excessively
• Use reflections to stay engaged: "What I'm hearing is..."
• If you're tired or distracted, acknowledge it honestly

True or False: It's acceptable to check your phone during a video session if the client can't see you doing it.

FALSE. Full attention is required regardless of what's visible. Clients can sense distraction, and you may miss critical information.`,
    },
    {
      id: 'platform-4',
      title: 'Handling Difficult Moments',
      content: `You will encounter emotional and challenging moments. Here's how to navigate them:

When a Client Becomes Tearful and Silent:
• Allow comfortable silence—don't rush to fill it
• Maintain warm, open presence
• Gently say: "I'm here with you. Take your time."
• Resume when they're ready, following their lead

When a Client Expresses Strong Emotion:
• Stay calm and grounded
• Validate: "I can see this is bringing up a lot of feelings."
• Don't try to stop or calm the emotion—let it be
• Check in: "What do you need right now?"

When a Client Shares Something Shocking:
• Maintain composure—your reaction matters
• Acknowledge without judgment
• If it's a safety concern, follow crisis protocol
• Process your own reaction after the session

When You Don't Know What to Say:
• It's okay to pause
• You can say: "I want to make sure I respond thoughtfully. Give me a moment."
• Reflection is always appropriate: "That sounds really significant."`,
    },
    {
      id: 'platform-5',
      title: 'Crisis Protocol on Psychi',
      content: `When a client expresses suicidal thoughts or shows high-risk indicators, follow this protocol:

Step 1: Acknowledge and Validate
"Thank you for trusting me with this. I'm glad you told me. What you're feeling sounds incredibly painful."

Step 2: Ask Clarifying Safety Questions
"Are you thinking about hurting yourself right now?"
"Do you have a plan?"
"Do you have access to [means]?"

Step 3: Provide Crisis Resources
"I want to make sure you have support right now. Have you heard of the 988 Suicide & Crisis Lifeline?"
Provide: 988 (call or text) and Crisis Text Line (text HOME to 741741)

Step 4: Escalate to Psychi
Use the in-app report/flag feature to alert Psychi's safety team. They can provide additional support and follow-up.

Step 5: Stay With Them
Don't end the session abruptly. Stay until they've connected with resources or the crisis has de-escalated.

Step 6: Document
After the session, document what happened according to Psychi's protocols.`,
    },
    {
      id: 'platform-6',
      title: 'Maintaining Boundaries',
      content: `Healthy boundaries protect both you and your clients.

Key Boundaries:
• No personal contact information exchange
• No social media connections with clients
• No meetings outside the platform
• No gifts or financial exchanges
• No romantic or sexual interactions—ever

Time Boundaries:
• Sessions start and end on time
• Don't be available 24/7
• Emergencies go to crisis resources, not you personally

Emotional Boundaries:
• Care about your clients without carrying their pain
• Recognize when countertransference is happening
• Seek supervision when you're overinvested

What If a Client Pushes Boundaries?
• Gently but firmly reinforce the boundary
• Explain it's for their benefit and yours
• Don't apologize for having boundaries
• Document if it continues

Example:
Client: "Can I have your phone number in case I need you?"
Response: "I understand wanting support outside sessions. For emergencies, the 988 Lifeline is available 24/7. Within our sessions, I'm fully here for you."`,
    },
    {
      id: 'platform-7',
      title: 'Adapting to Different Communication Modes',
      content: `Psychi supports chat, voice, and video. Each mode requires different skills.

Chat Sessions:
• Be mindful of tone—text can be misread
• Use empathetic language and emojis sparingly
• Don't rush responses—thoughtfulness over speed
• Acknowledge delays: "Taking a moment to respond fully..."
• Check in about understanding: "Does that make sense?"

Voice Sessions:
• Pay attention to vocal tone and pace
• Use verbal acknowledgments: "Mm-hmm," "I hear you"
• Describe what you're doing if there's silence: "I'm thinking about what you said..."
• Pauses are okay—they give space to process

Video Sessions:
• All voice skills apply, plus visual attention
• Make "eye contact" with the camera
• Be aware of your facial expressions
• Use body language intentionally

Switching Modes:
If a client requests video but you can't provide it:
"I'd love to do video, but I'm not in a private space right now. Can we do voice today, or schedule video for another time?"`,
    },
    {
      id: 'platform-8',
      title: 'Self-Care for Supporters',
      content: `Supporting others emotionally is rewarding but draining. Protect your own wellbeing.

Signs You Need Self-Care:
• Feeling emotionally exhausted after sessions
• Thinking about clients outside of work
• Difficulty sleeping or intrusive thoughts
• Decreased empathy or patience
• Physical symptoms (headaches, tension)

Daily Practices:
• Set clear boundaries between work and personal time
• Practice what you teach (mindfulness, grounding)
• Exercise and maintain physical health
• Stay connected with your own support system

After Difficult Sessions:
• Take a break before the next session
• Use grounding techniques
• Debrief with a supervisor or peer
• Don't isolate—talk about your experiences

Ongoing Support:
• Regular supervision or peer consultation
• Professional therapy if needed
• Continuing education to build skills
• Community with other supporters

Remember: You cannot pour from an empty cup. Taking care of yourself is part of taking care of your clients.`,
    },
    {
      id: 'platform-9',
      title: 'Documentation and Follow-Up',
      content: `Proper documentation supports continuity of care and protects everyone.

What to Document:
• Key themes discussed in the session
• Techniques used and client response
• Any safety concerns and actions taken
• Goals for next session
• Follow-up items

How to Document:
• Be factual and objective
• Avoid judgmental language
• Note client's own words when relevant
• Document immediately after sessions when memory is fresh

Confidentiality in Documentation:
• Store notes securely
• Follow Psychi's data protection protocols
• Don't include unnecessary identifying details

Follow-Up Between Sessions:
• Review notes before the next session
• Follow up on homework or goals
• Check in about crisis situations as appropriate
• Coordinate with Psychi team when needed`,
    },
    {
      id: 'platform-10',
      title: 'Continuing Your Growth',
      content: `Becoming an excellent peer supporter is an ongoing journey.

Ways to Grow:
• Seek feedback from supervisors and clients
• Reflect on sessions—what went well, what could improve?
• Continue learning through reading, courses, and training
• Practice the techniques you teach

Areas to Develop:
• Deepening understanding of specific mental health topics
• Expanding your toolkit of techniques
• Improving cultural competence
• Building crisis intervention skills

Self-Reflection Questions:
• What patterns do I notice in my sessions?
• Where do I feel most/least confident?
• What client populations do I connect with best?
• What triggers my own reactions?

Resources for Growth:
• Psychi's ongoing training modules
• Professional development webinars
• Peer support networks
• Relevant books and research

Congratulations on completing this training! You are now equipped with the foundational knowledge and skills to provide compassionate, evidence-based peer support on Psychi. Remember: learning never stops, and every session is an opportunity to grow.`,
    },
  ],
};

export default function TrainingScreen() {
  const { isDemoMode } = useAuth();
  const [moduleProgress, setModuleProgress] = useState<ModuleProgress>({
    confidentiality: false,
    mindfulness: false,
    cbt: false,
    validation: false,
    crisis: false,
    platform: false,
  });
  const [currentModule, setCurrentModule] = useState<Module | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [viewedSections, setViewedSections] = useState<Record<string, boolean>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const completedCount = Object.values(moduleProgress).filter(Boolean).length;
  const allComplete = completedCount === 6;

  const isModuleUnlocked = (moduleId: Module): boolean => {
    // In demo mode, all modules are accessible
    if (isDemoMode) return true;

    const moduleOrder: Module[] = ['confidentiality', 'mindfulness', 'cbt', 'validation', 'crisis', 'platform'];
    const index = moduleOrder.indexOf(moduleId);
    if (index === 0) return true;
    return moduleProgress[moduleOrder[index - 1]];
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
    if (!viewedSections[sectionId]) {
      setViewedSections(prev => ({
        ...prev,
        [sectionId]: true,
      }));
    }
  };

  const allSectionsViewed = (module: Module): boolean => {
    const sections = MODULE_CONTENT[module];
    return sections.every(section => viewedSections[section.id]);
  };

  const getViewedSectionCount = (module: Module): number => {
    const sections = MODULE_CONTENT[module];
    return sections.filter(section => viewedSections[section.id]).length;
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
    if (!currentModule || !allSectionsViewed(currentModule)) {
      Alert.alert('Complete All Sections', 'Please read all sections before taking the quiz.');
      return;
    }
    setShowQuiz(true);
    setQuizAnswers({});
    setShowResults(false);
    // Scroll to top when starting quiz
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 100);
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

    if (score >= 5) {
      setModuleProgress((prev) => ({ ...prev, [currentModule]: true }));
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setShowResults(false);
    // Scroll to top when retaking quiz
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, 100);
  };

  const handleNextModule = () => {
    const moduleOrder: Module[] = ['mindfulness', 'cbt', 'validation', 'crisis', 'platform'];
    const currentIndex = currentModule ? moduleOrder.indexOf(currentModule) : -1;

    if (currentIndex < moduleOrder.length - 1) {
      setCurrentModule(moduleOrder[currentIndex + 1]);
      setShowQuiz(false);
      setQuizAnswers({});
      setShowResults(false);
      setExpandedSections({});
    } else {
      setCurrentModule(null);
      setShowCertificate(true);
    }
  };

  const handleBackToModules = () => {
    setCurrentModule(null);
    setShowQuiz(false);
    setQuizAnswers({});
    setShowResults(false);
    setExpandedSections({});
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
            <View style={styles.certificateIconContainer}>
              <CertificateIcon size={64} color={PsychiColors.white} />
            </View>
            <Text style={styles.certificateTitle}>Congratulations!</Text>
            <Text style={styles.certificateSubtitle}>
              You have completed all training modules
            </Text>
            <View style={styles.certificateBadge}>
              <Text style={styles.certificateBadgeText}>Certified Psychi Supporter</Text>
            </View>
            <View style={styles.certificateModules}>
              <Text style={styles.certificateModulesTitle}>Proficiency Demonstrated In:</Text>
              <Text style={styles.certificateModuleItem}>• Mindfulness Techniques</Text>
              <Text style={styles.certificateModuleItem}>• Cognitive Behavioral Therapy (CBT)</Text>
              <Text style={styles.certificateModuleItem}>• Validating Language Skills</Text>
              <Text style={styles.certificateModuleItem}>• Crisis Recognition & Response</Text>
              <Text style={styles.certificateModuleItem}>• Supporting Clients on Psychi</Text>
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
    const objectives = LEARNING_OBJECTIVES[currentModule];
    const viewedCount = getViewedSectionCount(currentModule);
    const totalSections = content.length;

    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackToModules}>
            <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{moduleInfo.title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView ref={scrollViewRef} style={styles.content} contentContainerStyle={styles.contentContainer}>
          {!showQuiz ? (
            // Module Content
            <View style={styles.moduleContent}>
              {/* Progress indicator */}
              <View style={styles.moduleProgressCard}>
                <Text style={styles.moduleProgressText}>
                  {viewedCount} of {totalSections} sections completed
                </Text>
                <View style={styles.moduleProgressBar}>
                  <View style={[styles.moduleProgressFill, { width: `${(viewedCount / totalSections) * 100}%` }]} />
                </View>
              </View>

              {/* Learning Objectives */}
              <View style={styles.objectivesCard}>
                <View style={styles.objectivesHeader}>
                  <View style={styles.objectivesIcon}>
                    <CheckIcon size={20} color={PsychiColors.violet} />
                  </View>
                  <Text style={styles.objectivesTitle}>Learning Objectives</Text>
                </View>
                <Text style={styles.objectivesSubtitle}>After completing this module, you will be able to:</Text>
                {objectives.map((objective, index) => (
                  <View key={index} style={styles.objectiveItem}>
                    <CheckIcon size={16} color={PsychiColors.success} />
                    <Text style={styles.objectiveText}>{objective}</Text>
                  </View>
                ))}
              </View>

              {/* Content Sections */}
              {content.map((section, index) => (
                <View key={section.id} style={styles.sectionCard}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => toggleSection(section.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sectionHeaderLeft}>
                      <View style={[
                        styles.sectionNumber,
                        viewedSections[section.id] && styles.sectionNumberViewed
                      ]}>
                        {viewedSections[section.id] ? (
                          <CheckIcon size={14} color={PsychiColors.white} />
                        ) : (
                          <Text style={styles.sectionNumberText}>{index + 1}</Text>
                        )}
                      </View>
                      <Text style={styles.sectionTitle}>{section.title}</Text>
                    </View>
                    <View style={expandedSections[section.id] ? { transform: [{ rotate: '180deg' }] } : undefined}>
                      <ChevronDownIcon size={20} color={PsychiColors.azure} />
                    </View>
                  </TouchableOpacity>
                  {expandedSections[section.id] && (
                    <View style={styles.sectionContent}>
                      {typeof section.content === 'string' ? (
                        <Text style={styles.sectionText}>{section.content}</Text>
                      ) : (
                        section.content
                      )}
                    </View>
                  )}
                </View>
              ))}

              {/* Take Quiz Button */}
              <TouchableOpacity
                style={[
                  styles.quizButton,
                  !allSectionsViewed(currentModule) && styles.quizButtonDisabled
                ]}
                onPress={handleStartQuiz}
                activeOpacity={0.8}
                disabled={!allSectionsViewed(currentModule)}
              >
                <Text style={styles.quizButtonText}>
                  {allSectionsViewed(currentModule)
                    ? 'Take Quiz'
                    : `Complete all ${totalSections} sections to unlock quiz`}
                </Text>
              </TouchableOpacity>
            </View>
          ) : showResults ? (
            // Quiz Results
            <View style={styles.resultsContainer}>
              <View style={[styles.resultsCard, quizScore >= 5 ? styles.resultsCardPass : styles.resultsCardFail]}>
                <View style={styles.resultsIconContainer}>
                  {quizScore >= 5 ? (
                    <StarIcon size={48} color={PsychiColors.success} />
                  ) : (
                    <BookIcon size={48} color={PsychiColors.coral} />
                  )}
                </View>
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
                  <Text style={styles.nextButtonText}>
                    {currentModule === 'platform' ? 'Get Certificate' : 'Next Module'}
                  </Text>
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
                <Text style={styles.submitButtonText}>Submit Answers</Text>
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
            <View style={[styles.progressFill, { width: `${(completedCount / 6) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{completedCount} of 6 modules completed</Text>
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
                    {(() => {
                      const IconComponent = MODULE_ICONS[module.id];
                      if (isComplete) {
                        return <CheckIcon size={24} color={PsychiColors.white} />;
                      } else if (!isUnlocked) {
                        return <LockIcon size={24} color={PsychiColors.textMuted} />;
                      } else {
                        return <IconComponent size={24} color={PsychiColors.azure} />;
                      }
                    })()}
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
    flex: 1,
    textAlign: 'center',
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
    gap: Spacing.md,
  },
  moduleProgressCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  moduleProgressText: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.xs,
  },
  moduleProgressBar: {
    height: 6,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  moduleProgressFill: {
    height: '100%',
    backgroundColor: PsychiColors.azure,
    borderRadius: 3,
  },
  objectivesCard: {
    backgroundColor: 'rgba(139, 107, 150, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(139, 107, 150, 0.3)',
  },
  objectivesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  objectivesIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(139, 107, 150, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  objectivesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.violet,
  },
  objectivesSubtitle: {
    fontSize: 13,
    color: PsychiColors.azure,
    marginBottom: Spacing.sm,
  },
  objectiveItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  objectiveCheckIcon: {
    marginRight: Spacing.xs,
    marginTop: 2,
  },
  objectiveText: {
    fontSize: 14,
    color: PsychiColors.azure,
    flex: 1,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(139, 107, 150, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  sectionNumberViewed: {
    backgroundColor: PsychiColors.success,
  },
  sectionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.violet,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.midnight,
    flex: 1,
  },
  sectionContent: {
    padding: Spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  sectionText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 22,
  },
  quizButton: {
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  quizButtonDisabled: {
    backgroundColor: '#ccc',
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
    alignItems: 'flex-start',
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
    marginTop: 2,
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
    lineHeight: 20,
  },
  optionTextSelected: {
    color: PsychiColors.midnight,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
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
  resultsIconContainer: {
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
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
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
  certificateIconContainer: {
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
  certificateModules: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  certificateModulesTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.sm,
  },
  certificateModuleItem: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
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

// Styles for clickable link components
const linkStyles = StyleSheet.create({
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  videoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: PsychiColors.coral,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  videoContent: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  videoSpeaker: {
    fontSize: 12,
    color: PsychiColors.azure,
    marginBottom: 4,
  },
  videoDescription: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    lineHeight: 16,
  },
  resourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  resourceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  resourceIconApp: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  resourceContent: {
    flex: 1,
  },
  resourceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 2,
  },
  resourceAuthor: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  resourceDescription: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    lineHeight: 16,
  },
  studyCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: PsychiColors.azure,
    ...Shadows.soft,
  },
  studyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  studyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    flex: 1,
    marginRight: Spacing.sm,
  },
  studyAuthors: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  studyJournal: {
    fontSize: 12,
    color: PsychiColors.azure,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  studyFinding: {
    fontSize: 12,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
});
