/**
 * Book Session Screen
 * Multi-step booking flow for scheduling sessions with supporters
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { Config } from '@/constants/config';
import { ChatIcon, PhoneIcon, VideoIcon, CalendarIcon, ClockIcon, ChevronLeftIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams } from 'expo-router';
import {
  sendNewBookingNotification,
  sendBookingConfirmedNotification,
  scheduleAllSessionReminders,
} from '@/lib/notifications';
import { createSession, getSupporterDetail, getSupporterAvailability, saveClientPreferences, getClientCurrentAssignment, matchAndAssignSupporter } from '@/lib/database';
import { processSessionPayment, stripeAvailable } from '@/lib/stripe';
import OnboardingModal from '@/components/OnboardingModal';
import { Avatar } from '@/components/Avatar';
import { useSessionUsage } from '@/hooks/useSessionUsage';
import { PAYG_PRICES } from '@/types/liveSupport';

type SessionType = 'chat' | 'phone' | 'video';
type BookingStep = 'type' | 'date' | 'time' | 'confirm';

interface TimeSlot {
  startTime: string;
  endTime: string;
  display: string;
}

const sessionTypes = [
  {
    id: 'chat' as SessionType,
    name: 'Chat Session',
    duration: `${Config.sessionDurations.chat} minutes`,
    price: Config.pricing.chat.display,
    description: 'Text-based conversation at your own pace',
    Icon: ChatIcon,
  },
  {
    id: 'phone' as SessionType,
    name: 'Phone Call',
    duration: `${Config.sessionDurations.phone} minutes`,
    price: Config.pricing.phone.display,
    description: 'Voice conversation for deeper connection',
    Icon: PhoneIcon,
  },
  {
    id: 'video' as SessionType,
    name: 'Video Call',
    duration: `${Config.sessionDurations.video} minutes`,
    price: Config.pricing.video.display,
    description: 'Face-to-face virtual session',
    Icon: VideoIcon,
  },
];

// Generate dates for the next 14 days based on supporter availability
const generateDates = (availability: Record<string, string[]>) => {
  const dates = [];
  const today = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayName = dayNames[date.getDay()];

    // Only include dates where supporter has availability
    const hasAvailability = Object.keys(availability).length === 0 ||
      (availability[dayName] && availability[dayName].length > 0);

    if (hasAvailability) {
      dates.push(date);
    }
  }
  return dates;
};

// Generate time slots based on supporter availability for that day
const generateTimeSlots = (date: Date, duration: number, availability: Record<string, string[]>): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[date.getDay()];

  // Get available hours for this day from supporter's schedule
  const dayAvailability = availability[dayName] || [];

  // If no specific availability set, use default 9 AM - 6 PM
  const startHour = dayAvailability.length > 0 ? parseInt(dayAvailability[0].split(':')[0]) : 9;
  const endHour = dayAvailability.length > 0
    ? parseInt(dayAvailability[dayAvailability.length - 1].split(':')[0]) + 1
    : 18;

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (isToday && (hour < now.getHours() || (hour === now.getHours() && minute <= now.getMinutes()))) {
        continue;
      }

      const endMinute = minute + duration;
      const slotEndHour = hour + Math.floor(endMinute / 60);
      const actualEndMinute = endMinute % 60;

      if (slotEndHour <= endHour) {
        const displayHour = hour % 12 || 12;
        const ampm = hour >= 12 ? 'PM' : 'AM';

        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
          endTime: `${slotEndHour.toString().padStart(2, '0')}:${actualEndMinute.toString().padStart(2, '0')}`,
          display: `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`,
        });
      }
    }
  }
  return slots;
};

export default function BookSessionScreen() {
  const { user, profile } = useAuth();
  const params = useLocalSearchParams<{ supporterId?: string; supporterName?: string }>();
  const [step, setStep] = useState<BookingStep>('type');
  const [selectedType, setSelectedType] = useState<SessionType | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [supporterAvailability, setSupporterAvailability] = useState<Record<string, string[]>>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(true);
  const [isLoadingAssignment, setIsLoadingAssignment] = useState(!params.supporterId);
  const [assignedSupporter, setAssignedSupporter] = useState<{ id: string; name: string; specialty: string; stripe_connect_id: string | null; avatarUrl: string | null } | null>(null);
  const [paramSupporter, setParamSupporter] = useState<{ id: string; name: string; specialty: string; stripe_connect_id: string | null; avatarUrl: string | null } | null>(null);

  // Session usage tracking for quota enforcement
  const { usage, checkAllowance, recordUsage, refreshUsage } = useSessionUsage(user?.id || null);

  // Fetch supporter details (for stripe_connect_id) when supporterId is in params
  React.useEffect(() => {
    const fetchParamSupporter = async () => {
      if (!params.supporterId) return;

      try {
        const supporterDetail = await getSupporterDetail(params.supporterId);
        setParamSupporter({
          id: params.supporterId,
          name: supporterDetail?.full_name || params.supporterName || 'Your Supporter',
          specialty: 'Peer Support',
          stripe_connect_id: supporterDetail?.stripe_connect_id || null,
          avatarUrl: supporterDetail?.avatar_url || null,
        });
      } catch (error) {
        console.error('Error fetching supporter details:', error);
        // Fallback without stripe_connect_id
        setParamSupporter({
          id: params.supporterId,
          name: params.supporterName || 'Your Supporter',
          specialty: 'Peer Support',
          stripe_connect_id: null,
          avatarUrl: null,
        });
      }
    };

    fetchParamSupporter();
  }, [params.supporterId, params.supporterName]);

  // Fetch assigned supporter if no supporterId in params
  React.useEffect(() => {
    const fetchAssignedSupporter = async () => {
      if (params.supporterId || !user?.id) {
        setIsLoadingAssignment(false);
        return;
      }

      try {
        const assignment = await getClientCurrentAssignment(user.id);
        if (assignment?.supporter_id) {
          // Get supporter details including stripe_connect_id for payment split
          const supporterDetail = await getSupporterDetail(assignment.supporter_id);
          if (supporterDetail) {
            setAssignedSupporter({
              id: assignment.supporter_id,
              name: supporterDetail.full_name || 'Your Supporter',
              specialty: 'Peer Support',
              stripe_connect_id: supporterDetail.stripe_connect_id || null,
              avatarUrl: supporterDetail.avatar_url || null,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching assigned supporter:', error);
      } finally {
        setIsLoadingAssignment(false);
      }
    };

    fetchAssignedSupporter();
  }, [user?.id, params.supporterId]);

  // Get supporter from route params or fetched assignment
  const supporter = params.supporterId ? paramSupporter : assignedSupporter;

  // Helper function to navigate back safely
  const navigateBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(client)/sessions');
    }
  };

  // Handle onboarding completion - save preferences, match supporter, and proceed to booking
  const handleOnboardingComplete = async (preferences: any) => {
    if (!user?.id) {
      setShowOnboardingModal(false);
      navigateBack();
      return;
    }

    try {
      // Save preferences
      await saveClientPreferences(user.id, preferences);

      // Match and assign a supporter based on preferences
      const result = await matchAndAssignSupporter(user.id, preferences);

      if (result.success && result.supporter) {
        // Supporter assigned successfully - fetch their full details and continue to booking
        const supporterDetail = await getSupporterDetail(result.supporter.id);

        setAssignedSupporter({
          id: result.supporter.id,
          name: result.supporter.name,
          specialty: result.supporter.specialty,
          stripe_connect_id: supporterDetail?.stripe_connect_id || null,
          avatarUrl: supporterDetail?.avatar_url || null,
        });

        // Close modal and show booking flow
        setShowOnboardingModal(false);

        Alert.alert(
          'Matched!',
          `You've been matched with ${result.supporter.name}. Let's book your first session!`,
          [{ text: 'Continue' }]
        );
      } else {
        // No supporters available - notify user FIRST, then navigate when they dismiss
        // Keep modal visible until user acknowledges
        Alert.alert(
          'No Supporters Available',
          result.error || 'No supporters are currently available. We\'ll notify you when one becomes available.',
          [{
            text: 'OK',
            onPress: () => {
              setShowOnboardingModal(false);
              navigateBack();
            }
          }]
        );
      }
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      // Show error alert FIRST, then navigate when user dismisses
      Alert.alert(
        'Error',
        'Something went wrong. Please try again.',
        [{
          text: 'OK',
          onPress: () => {
            setShowOnboardingModal(false);
            navigateBack();
          }
        }]
      );
    }
  };

  // Fetch supporter availability when supporter is available
  React.useEffect(() => {
    const fetchAvailability = async () => {
      const supporterId = params.supporterId || assignedSupporter?.id;
      if (supporterId) {
        try {
          const data = await getSupporterAvailability(supporterId);
          if (data?.availability) {
            setSupporterAvailability(data.availability);
          }
        } catch (error) {
          console.error('Error fetching supporter availability:', error);
          // Continue with empty availability - user can still see supporter info
        }
      }
      setIsLoadingAvailability(false);
    };
    fetchAvailability();
  }, [params.supporterId, assignedSupporter?.id]);

  // Get client name for notifications
  const clientName = profile?.firstName
    ? `${profile.firstName}${profile.lastName ? ' ' + profile.lastName : ''}`
    : 'Client';

  const availableDates = generateDates(supporterAvailability);
  const timeSlots = selectedDate
    ? generateTimeSlots(selectedDate, selectedType === 'chat' ? 30 : 45, supporterAvailability)
    : [];

  const handleSelectType = (type: SessionType) => {
    setSelectedType(type);
    setStep('date');
  };

  // Get allowance info for selected session type
  const allowanceInfo = selectedType ? checkAllowance(selectedType) : null;

  // Calculate effective price based on subscription allowance
  const getEffectivePrice = (type: SessionType) => {
    const allowance = checkAllowance(type);
    if (allowance.hasAllowance) {
      return 'Included'; // Covered by subscription
    }
    return `$${(allowance.paygPrice / 100).toFixed(0)}`; // PAYG price
  };

  // Get remaining sessions display for a session type
  const getRemainingDisplay = (type: SessionType) => {
    const allowance = checkAllowance(type);
    if (!usage || usage.subscriptionTier === 0) {
      return null; // No subscription, show PAYG pricing
    }
    if (type === 'chat') {
      if (usage.chatAllowed >= 999) return 'Unlimited';
      return `${Math.max(0, usage.chatAllowed - usage.chatUsed)} left`;
    } else {
      return `${Math.max(0, usage.voiceVideoAllowed - usage.voiceVideoUsed)} left`;
    }
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('time');
  };

  const handleSelectTime = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleBack = () => {
    switch (step) {
      case 'date':
        setStep('type');
        break;
      case 'time':
        setStep('date');
        break;
      case 'confirm':
        setStep('time');
        break;
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDate || !selectedSlot || !selectedType || !user?.id || !supporter) return;

    setIsBooking(true);

    try {
      // Check session allowance
      const allowance = checkAllowance(selectedType);
      const requiresPayment = allowance.paygRequired;

      // Create scheduled session time
      const [hours, minutes] = selectedSlot.startTime.split(':').map(Number);
      const scheduledTime = new Date(selectedDate);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Format date for payment metadata
      const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });

      // Process payment first (if PAYG required and Stripe is available)
      // Payment is split 75% to supporter, 25% platform fee (if supporter has Stripe Connect)
      let paymentIntentId: string | undefined;

      if (requiresPayment && stripeAvailable) {
        const paymentResult = await processSessionPayment(
          selectedType,
          supporter.id,
          scheduledTime.toISOString(),
          supporter.stripe_connect_id || undefined
        );

        if (!paymentResult.success) {
          // Payment failed or was cancelled - don't create session
          setIsBooking(false);
          return;
        }

        paymentIntentId = paymentResult.paymentIntentId;
      } else if (requiresPayment && !stripeAvailable) {
        // In development/Expo Go, show notice but allow booking for testing
        Alert.alert(
          'Development Mode',
          'Payment processing is not available in Expo Go. Session will be created without payment for testing purposes.',
          [{ text: 'Continue' }]
        );
      }
      // If !requiresPayment, session is covered by subscription - no payment needed

      // Payment succeeded (or dev mode) - now create the session with payment intent ID
      const session = await createSession(
        user.id,
        supporter.id,
        selectedType,
        scheduledTime.toISOString(),
        selectedType === 'chat' ? 30 : 45,
        paymentIntentId
      );

      if (!session) {
        // Payment succeeded but session creation failed - needs manual refund
        Alert.alert(
          'Booking Error',
          'Your payment was processed but we couldn\'t create your session. Please contact support for a refund.',
          [{ text: 'OK' }]
        );
        setIsBooking(false);
        return;
      }

      const sessionId = session.id;
      const sessionTypeName = sessionTypes.find((t) => t.id === selectedType)?.name || selectedType;

      // Send notification to supporter about new booking
      await sendNewBookingNotification({
        sessionId,
        clientId: user?.id || 'client',
        clientName,
        sessionType: selectedType,
        date: dateStr,
        time: selectedSlot.display,
      });

      // Send booking confirmation notification to client (local)
      await sendBookingConfirmedNotification({
        sessionId,
        supporterId: supporter.id,
        supporterName: supporter.name,
        sessionType: selectedType,
        date: dateStr,
        time: selectedSlot.display,
      });

      // Schedule session reminders (15 min, 1 hour, 1 day before)
      await scheduleAllSessionReminders({
        sessionId,
        sessionType: selectedType,
        otherPartyName: supporter.name,
        scheduledTime,
      });

      // Record session usage for quota tracking
      // This records whether it was PAYG or covered by subscription
      await recordUsage(
        selectedType,
        sessionId,
        requiresPayment, // chargedAsPayg
        paymentIntentId
      );

      // Refresh usage data to update UI
      await refreshUsage();

      setIsBooking(false);

      Alert.alert(
        'Session Booked!',
        `Your ${sessionTypeName} with ${supporter.name} has been scheduled. You'll receive reminders before the session.`,
        [
          {
            text: 'View Sessions',
            onPress: () => router.replace('/(client)/sessions'),
          },
        ]
      );
    } catch (error) {
      console.error('Error booking session:', error);
      setIsBooking(false);

      Alert.alert(
        'Booking Error',
        'There was an issue booking your session. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stepIndex = ['type', 'date', 'time', 'confirm'].indexOf(step);

  // Show loading while fetching assigned supporter
  if (isLoadingAssignment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show matching quiz if no supporter assigned
  if (!supporter) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Show loading state when modal is closed but still navigating */}
        {!showOnboardingModal && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PsychiColors.azure} />
            <Text style={styles.loadingText}>Returning to dashboard...</Text>
          </View>
        )}
        <OnboardingModal
          visible={showOnboardingModal}
          onClose={() => {
            // Hide modal and show loading state while navigating
            setShowOnboardingModal(false);
            // Use router.back() to return to previous screen (sessions/dashboard)
            // This is more reliable than replace and goes back to where user came from
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(client)/sessions');
            }
          }}
          onComplete={handleOnboardingComplete}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {step !== 'type' && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back" accessibilityHint="Returns to the previous step">
            <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle} accessibilityRole="header">Book a Session</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map((idx) => (
          <React.Fragment key={idx}>
            <View
              style={[
                styles.progressDot,
                stepIndex >= idx && styles.progressDotActive,
                stepIndex === idx && styles.progressDotCurrent,
              ]}
            >
              <Text style={[styles.progressNumber, stepIndex >= idx && styles.progressNumberActive]}>
                {idx + 1}
              </Text>
            </View>
            {idx < 3 && (
              <View style={[styles.progressLine, stepIndex > idx && styles.progressLineActive]} />
            )}
          </React.Fragment>
        ))}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Step 1: Session Type */}
        {step === 'type' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Choose your session type</Text>
            <Text style={styles.stepSubtitle}>with {supporter.name}</Text>

            <View style={styles.typesList}>
              {sessionTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.typeCard}
                  onPress={() => handleSelectType(type.id)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`${type.name}, ${type.duration}, ${type.price}`}
                  accessibilityHint={type.description}
                >
                  <LinearGradient
                    colors={[PsychiColors.azure, PsychiColors.deep] as const}
                    style={styles.typeIcon}
                  >
                    <type.Icon size={24} color={PsychiColors.white} />
                  </LinearGradient>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeName}>{type.name}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                    <View style={styles.typeFooter}>
                      <Text style={styles.typeDuration}>{type.duration}</Text>
                      <View style={styles.typePriceContainer}>
                        {getRemainingDisplay(type.id) && (
                          <Text style={styles.typeRemaining}>{getRemainingDisplay(type.id)}</Text>
                        )}
                        <Text style={[
                          styles.typePrice,
                          checkAllowance(type.id).hasAllowance && styles.typePriceIncluded
                        ]}>
                          {getEffectivePrice(type.id)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: Date Selection */}
        {step === 'date' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select a date</Text>
            <Text style={styles.stepSubtitle}>
              {sessionTypes.find((t) => t.id === selectedType)?.name}
            </Text>

            <View style={styles.dateGrid}>
              {availableDates.map((date, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dateCard,
                    selectedDate?.toDateString() === date.toDateString() && styles.dateCardSelected,
                  ]}
                  onPress={() => handleSelectDate(date)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  accessibilityState={{ selected: selectedDate?.toDateString() === date.toDateString() }}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      selectedDate?.toDateString() === date.toDateString() && styles.dateDaySelected,
                    ]}
                  >
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </Text>
                  <Text
                    style={[
                      styles.dateNum,
                      selectedDate?.toDateString() === date.toDateString() && styles.dateNumSelected,
                    ]}
                  >
                    {date.getDate()}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      selectedDate?.toDateString() === date.toDateString() && styles.dateMonthSelected,
                    ]}
                  >
                    {date.toLocaleDateString('en-US', { month: 'short' })}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Time Selection */}
        {step === 'time' && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Select a time</Text>
            <Text style={styles.stepSubtitle}>{selectedDate && formatDate(selectedDate)}</Text>

            {timeSlots.length === 0 ? (
              <View style={styles.noSlotsContainer}>
                <ClockIcon size={48} color={PsychiColors.textMuted} />
                <Text style={styles.noSlotsText}>No available times for this date</Text>
                <Text style={styles.noSlotsSubtext}>Please select a different date</Text>
              </View>
            ) : (
              <>
                {/* Morning */}
                {timeSlots.filter((s) => parseInt(s.startTime.split(':')[0]) < 12).length > 0 && (
                  <View style={styles.timeSection}>
                    <Text style={styles.timeSectionTitle}>Morning</Text>
                    <View style={styles.timeGrid}>
                      {timeSlots
                        .filter((s) => parseInt(s.startTime.split(':')[0]) < 12)
                        .map((slot, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.timeSlot,
                              selectedSlot?.startTime === slot.startTime && styles.timeSlotSelected,
                            ]}
                            onPress={() => handleSelectTime(slot)}
                            accessibilityRole="button"
                            accessibilityLabel={slot.display}
                            accessibilityState={{ selected: selectedSlot?.startTime === slot.startTime }}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                selectedSlot?.startTime === slot.startTime && styles.timeSlotTextSelected,
                              ]}
                            >
                              {slot.display}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}

                {/* Afternoon */}
                {timeSlots.filter((s) => {
                  const hour = parseInt(s.startTime.split(':')[0]);
                  return hour >= 12 && hour < 17;
                }).length > 0 && (
                  <View style={styles.timeSection}>
                    <Text style={styles.timeSectionTitle}>Afternoon</Text>
                    <View style={styles.timeGrid}>
                      {timeSlots
                        .filter((s) => {
                          const hour = parseInt(s.startTime.split(':')[0]);
                          return hour >= 12 && hour < 17;
                        })
                        .map((slot, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.timeSlot,
                              selectedSlot?.startTime === slot.startTime && styles.timeSlotSelected,
                            ]}
                            onPress={() => handleSelectTime(slot)}
                            accessibilityRole="button"
                            accessibilityLabel={slot.display}
                            accessibilityState={{ selected: selectedSlot?.startTime === slot.startTime }}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                selectedSlot?.startTime === slot.startTime && styles.timeSlotTextSelected,
                              ]}
                            >
                              {slot.display}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}

                {/* Evening */}
                {timeSlots.filter((s) => parseInt(s.startTime.split(':')[0]) >= 17).length > 0 && (
                  <View style={styles.timeSection}>
                    <Text style={styles.timeSectionTitle}>Evening</Text>
                    <View style={styles.timeGrid}>
                      {timeSlots
                        .filter((s) => parseInt(s.startTime.split(':')[0]) >= 17)
                        .map((slot, idx) => (
                          <TouchableOpacity
                            key={idx}
                            style={[
                              styles.timeSlot,
                              selectedSlot?.startTime === slot.startTime && styles.timeSlotSelected,
                            ]}
                            onPress={() => handleSelectTime(slot)}
                            accessibilityRole="button"
                            accessibilityLabel={slot.display}
                            accessibilityState={{ selected: selectedSlot?.startTime === slot.startTime }}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                selectedSlot?.startTime === slot.startTime && styles.timeSlotTextSelected,
                              ]}
                            >
                              {slot.display}
                            </Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirm' && selectedDate && selectedSlot && selectedType && (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirm your booking</Text>

            <View style={styles.confirmCard}>
              <View style={styles.confirmHeader}>
                <Avatar
                  imageUrl={supporter.avatarUrl}
                  name={supporter.name}
                  size={56}
                  colors={[PsychiColors.azure, PsychiColors.deep]}
                />
                <View style={styles.confirmHeaderInfo}>
                  <Text style={styles.confirmSupporterName}>{supporter.name}</Text>
                  <Text style={styles.confirmSessionType}>
                    {sessionTypes.find((t) => t.id === selectedType)?.name}
                  </Text>
                </View>
              </View>

              <View style={styles.confirmDetails}>
                <View style={styles.confirmRow}>
                  <CalendarIcon size={20} color={PsychiColors.azure} />
                  <Text style={styles.confirmRowText}>{formatFullDate(selectedDate)}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <ClockIcon size={20} color={PsychiColors.azure} />
                  <Text style={styles.confirmRowText}>{selectedSlot.display}</Text>
                </View>
                <View style={styles.confirmRow}>
                  <ClockIcon size={20} color={PsychiColors.azure} />
                  <Text style={styles.confirmRowText}>
                    {sessionTypes.find((t) => t.id === selectedType)?.duration}
                  </Text>
                </View>
              </View>

              <View style={styles.confirmPriceRow}>
                <View>
                  <Text style={styles.confirmPriceLabel}>Session Total</Text>
                  {allowanceInfo?.hasAllowance && (
                    <Text style={styles.confirmCoveredText}>Covered by subscription</Text>
                  )}
                  {allowanceInfo?.paygRequired && (
                    <Text style={styles.confirmPaygText}>Pay-as-you-go</Text>
                  )}
                </View>
                <Text style={[
                  styles.confirmPrice,
                  allowanceInfo?.hasAllowance && styles.confirmPriceIncluded
                ]}>
                  {allowanceInfo?.hasAllowance ? '$0' : getEffectivePrice(selectedType)}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, isBooking && styles.confirmButtonDisabled]}
              onPress={handleConfirmBooking}
              disabled={isBooking}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={allowanceInfo?.hasAllowance ? "Confirm Booking" : "Confirm and Pay"}
              accessibilityHint="Confirms your booking and proceeds to payment"
              accessibilityState={{ disabled: isBooking }}
            >
              {isBooking ? (
                <ActivityIndicator color={PsychiColors.white} />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {allowanceInfo?.hasAllowance ? 'Confirm Booking' : 'Confirm & Pay'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
    color: PsychiColors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(176, 224, 230, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: PsychiColors.deep,
  },
  progressDotCurrent: {
    backgroundColor: PsychiColors.azure,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  progressNumberActive: {
    color: PsychiColors.white,
  },
  progressLine: {
    width: 40,
    height: 3,
    backgroundColor: 'rgba(176, 224, 230, 0.3)',
    borderRadius: 2,
    marginHorizontal: Spacing.xs,
  },
  progressLineActive: {
    backgroundColor: PsychiColors.deep,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  stepContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  stepSubtitle: {
    fontSize: 14,
    color: PsychiColors.azure,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  typesList: {
    gap: Spacing.md,
  },
  typeCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
    padding: Spacing.md + 2,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeInfo: {
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  typeDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.sm,
  },
  typeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeDuration: {
    fontSize: 12,
    color: PsychiColors.azure,
  },
  typePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: PsychiColors.deep,
  },
  typePriceIncluded: {
    color: PsychiColors.success,
  },
  typePriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  typeRemaining: {
    fontSize: 11,
    color: PsychiColors.success,
    fontWeight: '500',
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  dateCard: {
    width: 72,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  dateCardSelected: {
    backgroundColor: PsychiColors.azure,
    borderColor: PsychiColors.azure,
  },
  dateDay: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.midnight,
    marginBottom: 2,
  },
  dateNumSelected: {
    color: PsychiColors.white,
  },
  dateMonth: {
    fontSize: 12,
    color: PsychiColors.textMuted,
  },
  dateMonthSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  noSlotsContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  noSlotsText: {
    fontSize: 16,
    color: PsychiColors.textMuted,
    marginTop: Spacing.md,
  },
  noSlotsSubtext: {
    fontSize: 14,
    color: PsychiColors.textSoft,
    marginTop: Spacing.xs,
  },
  timeSection: {
    marginBottom: Spacing.lg,
  },
  timeSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.sm,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeSlot: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  timeSlotSelected: {
    backgroundColor: PsychiColors.azure,
    borderColor: PsychiColors.azure,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '500',
    color: PsychiColors.midnight,
  },
  timeSlotTextSelected: {
    color: PsychiColors.white,
  },
  confirmCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(37, 99, 235, 0.1)',
  },
  confirmAvatar: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  confirmHeaderInfo: {
    flex: 1,
  },
  confirmSupporterName: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    letterSpacing: 0.3,
  },
  confirmSessionType: {
    fontSize: 14,
    color: PsychiColors.azure,
  },
  confirmDetails: {
    gap: Spacing.sm,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  confirmRowText: {
    fontSize: 15,
    color: PsychiColors.midnight,
  },
  confirmPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(37, 99, 235, 0.1)',
  },
  confirmPriceLabel: {
    fontSize: 15,
    color: PsychiColors.textMuted,
  },
  confirmPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.deep,
  },
  confirmPriceIncluded: {
    color: PsychiColors.success,
  },
  confirmCoveredText: {
    fontSize: 12,
    color: PsychiColors.success,
    fontWeight: '500',
    marginTop: 2,
  },
  confirmPaygText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  confirmButton: {
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
