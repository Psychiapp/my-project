/**
 * Psychi Mobile App Types
 * Shared with web app where possible
 */

// User roles
export type UserRole = 'client' | 'supporter' | 'admin';

// User profile
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  onboardingCompleted: boolean;
}

// Client-specific profile
export interface ClientProfile extends UserProfile {
  role: 'client';
  preferences: ClientPreferences;
  subscriptionTier?: 'basic' | 'standard' | 'premium' | null;
  subscriptionStatus?: 'active' | 'canceled' | 'past_due' | null;
}

export interface ClientPreferences {
  supportTypes: SupportType[];
  communicationStyle: CommunicationStyle[];
  focusAreas: string[];
  genderPreference: 'male' | 'female' | 'non-binary' | 'no-preference';
  ageRange: 'similar' | 'older' | 'no-preference';
}

// Supporter-specific profile
export interface SupporterProfile extends UserProfile {
  role: 'supporter';
  bio: string;
  specialties: string[];
  education: string;
  experience: string;
  communicationStyles: CommunicationStyle[];
  supportTypes: SupportType[];
  hourlyRate: number;
  totalSessions: number;
  isAvailable: boolean;
  applicationStatus: ApplicationStatus;
}

// Support types
export type SupportType = 'chat' | 'phone' | 'video';

// Communication styles
export type CommunicationStyle =
  | 'active-listening'
  | 'advice-giving'
  | 'motivational'
  | 'empathetic'
  | 'analytical'
  | 'humor';

// Application status
export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'incomplete';

// Supporter application
export interface SupporterApplication {
  id: string;
  userId: string;
  status: ApplicationStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  education: EducationInfo;
  experience: ExperienceInfo;
  documents: DocumentInfo;
  banking: BankingInfo;
  w9: W9Info;
  createdAt: string;
  updatedAt: string;
}

export interface EducationInfo {
  institution: string;
  degree: string;
  major: string;
  graduationYear: string;
  enrollmentStatus: 'enrolled' | 'graduated';
}

export interface ExperienceInfo {
  hasExperience: boolean;
  description: string;
  motivation: string;
}

export interface DocumentInfo {
  transcriptUrl?: string;
  idUrl?: string;
}

export interface BankingInfo {
  accountHolderName: string;
  routingNumber: string;
  accountNumber: string;
  accountType: 'checking' | 'savings';
}

export interface W9Info {
  legalName: string;
  businessName?: string;
  taxClassification: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ssnLast4: string;
}

// Sessions
export interface Session {
  id: string;
  clientId: string;
  supporterId: string;
  type: SupportType;
  status: SessionStatus;
  scheduledAt: string;
  duration: number; // in minutes
  price: number; // in cents
  notes?: string;
  createdAt: string;
}

export type SessionStatus =
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'canceled'
  | 'no_show';

// Availability
export interface Availability {
  id: string;
  supporterId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isRecurring: boolean;
}

// Time slot for booking
export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Booking
export interface Booking {
  supporterId: string;
  date: string;
  timeSlot: TimeSlot;
  type: SupportType;
}

// Message for chat
export interface Message {
  id: string;
  sessionId: string;
  senderId: string;
  content: string;
  encrypted: boolean;
  createdAt: string;
  readAt?: string;
}

// Earnings
export interface Earnings {
  totalEarnings: number;
  pendingPayout: number;
  lastPayout: number;
  lastPayoutDate?: string;
}

// Payout
export interface Payout {
  id: string;
  supporterId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'direct_deposit';
  createdAt: string;
  processedAt?: string;
}

// Navigation params
export type RootStackParamList = {
  '(tabs)': undefined;
  '(auth)': undefined;
  'modal': undefined;
  'session': { sessionId: string };
  'supporter-profile': { supporterId: string };
  'booking': { supporterId: string };
};

export type AuthStackParamList = {
  'sign-in': undefined;
  'sign-up': undefined;
  'forgot-password': undefined;
};

export type ClientTabParamList = {
  'index': undefined;
  'sessions': undefined;
  'book': undefined;
  'profile': undefined;
};

export type SupporterTabParamList = {
  'index': undefined;
  'availability': undefined;
  'sessions': undefined;
  'earnings': undefined;
  'profile': undefined;
};
