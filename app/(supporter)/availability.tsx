import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { CloseIcon, PlusIcon, ClockIcon, InfoIcon, CheckIcon, PlayIcon, PauseIcon } from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { getSupporterAvailability, updateAcceptingClients } from '@/lib/database';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Available time options (every 30 minutes)
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hour = h.toString().padStart(2, '0');
    const minute = m.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${hour}:${minute}`);
  }
}

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export default function AvailabilityScreen() {
  const { user, isDemoMode } = useAuth();

  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({
    Monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Friday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }] },
    Saturday: { enabled: false, slots: [] },
    Sunday: { enabled: false, slots: [] },
  });

  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [editingDay, setEditingDay] = useState<string | null>(null);
  const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<'start' | 'end'>('start');
  const [selectedTime, setSelectedTime] = useState('09:00');

  // Accepting new clients toggle state
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [isLoadingToggle, setIsLoadingToggle] = useState(true);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState(false);

  // Fetch initial accepting clients status
  useEffect(() => {
    const fetchAcceptingStatus = async () => {
      if (!user?.id) {
        setIsLoadingToggle(false);
        return;
      }

      // In demo mode, just use default state (no database)
      if (isDemoMode) {
        setIsLoadingToggle(false);
        return;
      }

      const availabilityData = await getSupporterAvailability(user.id);
      if (availabilityData) {
        setAcceptingClients(availabilityData.acceptingClients);
      }
      setIsLoadingToggle(false);
    };

    fetchAcceptingStatus();
  }, [user?.id, isDemoMode]);

  // Handle accepting clients toggle change
  const handleAcceptingClientsToggle = async (value: boolean) => {
    if (!user?.id || isUpdatingToggle) return;

    setAcceptingClients(value);

    // In demo mode, just update local state (no database)
    if (isDemoMode) {
      return;
    }

    setIsUpdatingToggle(true);

    const success = await updateAcceptingClients(user.id, value);

    if (!success) {
      setAcceptingClients(!value);
    }

    setIsUpdatingToggle(false);
  };

  const toggleDay = (day: string) => {
    const currentEnabled = availability[day]?.enabled || false;

    // Check if this is the last enabled day
    if (currentEnabled) {
      const enabledDays = Object.entries(availability).filter(([_, v]) => v.enabled);
      if (enabledDays.length === 1 && enabledDays[0][0] === day) {
        Alert.alert(
          'Cannot Disable',
          'You must have at least one day available for sessions.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !currentEnabled,
        slots: !currentEnabled ? [{ start: '09:00', end: '17:00' }] : [],
      },
    }));
  };

  const openTimePicker = (day: string, slotIndex: number, field: 'start' | 'end') => {
    setEditingDay(day);
    setEditingSlotIndex(slotIndex);
    setEditingField(field);
    setSelectedTime(availability[day].slots[slotIndex][field]);
    setTimePickerVisible(true);
  };

  const confirmTimeSelection = () => {
    if (editingDay === null || editingSlotIndex === null) return;

    const slot = availability[editingDay].slots[editingSlotIndex];
    const newSlot = { ...slot, [editingField]: selectedTime };

    // Validate that end time is after start time
    if (editingField === 'end' && selectedTime <= newSlot.start) {
      Alert.alert('Invalid Time', 'End time must be after start time.');
      return;
    }
    if (editingField === 'start' && selectedTime >= newSlot.end) {
      Alert.alert('Invalid Time', 'Start time must be before end time.');
      return;
    }

    setAvailability((prev) => ({
      ...prev,
      [editingDay]: {
        ...prev[editingDay],
        slots: prev[editingDay].slots.map((s, i) =>
          i === editingSlotIndex ? newSlot : s
        ),
      },
    }));

    setTimePickerVisible(false);
  };

  const addTimeSlot = (day: string) => {
    const lastSlot = availability[day].slots[availability[day].slots.length - 1];
    let newStart = '09:00';
    let newEnd = '17:00';

    if (lastSlot) {
      // Try to set new slot after the last one
      const lastEndIndex = TIME_OPTIONS.indexOf(lastSlot.end);
      if (lastEndIndex < TIME_OPTIONS.length - 2) {
        newStart = TIME_OPTIONS[lastEndIndex + 1];
        newEnd = TIME_OPTIONS[Math.min(lastEndIndex + 5, TIME_OPTIONS.length - 1)];
      }
    }

    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { start: newStart, end: newEnd }],
      },
    }));
  };

  const removeTimeSlot = (day: string, slotIndex: number) => {
    const daySlots = availability[day].slots;

    // Check if this is the last slot on the last enabled day
    if (daySlots.length === 1) {
      const enabledDays = Object.entries(availability).filter(([_, v]) => v.enabled && v.slots.length > 0);
      if (enabledDays.length === 1 && enabledDays[0][0] === day) {
        Alert.alert(
          'Cannot Remove',
          'You must have at least one time slot available for sessions.',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== slotIndex),
        enabled: prev[day].slots.length > 1, // Disable day if no slots left
      },
    }));
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleSave = () => {
    // Validate at least one day with one slot
    const hasAvailability = Object.values(availability).some(
      (day) => day.enabled && day.slots.length > 0
    );

    if (!hasAvailability) {
      Alert.alert(
        'No Availability',
        'Please set at least one day and time slot when you are available.',
        [{ text: 'OK' }]
      );
      return;
    }

    // TODO: Save to database
    Alert.alert('Saved', 'Your availability has been updated.', [{ text: 'OK' }]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Availability</Text>
          <Text style={styles.headerSubtitle}>Set your weekly schedule</Text>
        </View>

        {/* Accepting Clients Toggle */}
        <View style={styles.acceptingCard}>
          <View style={styles.acceptingContent}>
            {isLoadingToggle ? (
              <ActivityIndicator size="small" color={PsychiColors.royalBlue} />
            ) : acceptingClients ? (
              <PlayIcon size={22} color={PsychiColors.success} />
            ) : (
              <PauseIcon size={22} color={PsychiColors.error} />
            )}
            <View style={styles.acceptingInfo}>
              <Text style={styles.acceptingTitle}>
                {isLoadingToggle ? 'Loading...' : acceptingClients ? 'Accepting New Clients' : 'Paused'}
              </Text>
              <Text style={styles.acceptingSubtitle}>
                {acceptingClients ? 'New clients can match with you' : 'Existing clients can still book'}
              </Text>
            </View>
            {!isLoadingToggle && (
              <Switch
                value={acceptingClients}
                onValueChange={handleAcceptingClientsToggle}
                disabled={isUpdatingToggle}
                trackColor={{ false: PsychiColors.frost, true: PsychiColors.successMuted }}
                thumbColor={acceptingClients ? PsychiColors.success : PsychiColors.textMuted}
                ios_backgroundColor={PsychiColors.frost}
              />
            )}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <InfoIcon size={18} color={PsychiColors.royalBlue} />
          <Text style={styles.infoText}>
            Clients can only book sessions during your available times. Keep your schedule updated for accurate bookings.
          </Text>
        </View>

        {/* Days */}
        <View style={styles.section}>
          {DAYS.map((day) => (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{day}</Text>
                  {availability[day]?.enabled && availability[day]?.slots.length > 0 && (
                    <Text style={styles.dayHours}>
                      {availability[day].slots.length} time slot{availability[day].slots.length !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <Switch
                  value={availability[day]?.enabled || false}
                  onValueChange={() => toggleDay(day)}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: 'rgba(74, 123, 199, 0.3)' }}
                  thumbColor={availability[day]?.enabled ? PsychiColors.royalBlue : PsychiColors.textSoft}
                />
              </View>

              {availability[day]?.enabled && (
                <View style={styles.slotsContainer}>
                  {availability[day].slots.map((slot, index) => (
                    <View key={index} style={styles.slotRow}>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => openTimePicker(day, index, 'start')}
                      >
                        <ClockIcon size={14} color={PsychiColors.textMuted} />
                        <Text style={styles.timeButtonText}>{formatTime(slot.start)}</Text>
                      </TouchableOpacity>
                      <Text style={styles.toText}>to</Text>
                      <TouchableOpacity
                        style={styles.timeButton}
                        onPress={() => openTimePicker(day, index, 'end')}
                      >
                        <ClockIcon size={14} color={PsychiColors.textMuted} />
                        <Text style={styles.timeButtonText}>{formatTime(slot.end)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeTimeSlot(day, index)}
                      >
                        <CloseIcon size={14} color={PsychiColors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.addSlotButton}
                    onPress={() => addTimeSlot(day)}
                  >
                    <PlusIcon size={16} color={PsychiColors.royalBlue} />
                    <Text style={styles.addSlotText}>Add time slot</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.8} onPress={handleSave}>
            <LinearGradient
              colors={[PsychiColors.royalBlue, '#5A8BD4']}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Time Picker Modal */}
      <Modal
        visible={timePickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setTimePickerVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setTimePickerVisible(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              Select {editingField === 'start' ? 'Start' : 'End'} Time
            </Text>
            <TouchableOpacity onPress={confirmTimeSelection}>
              <Text style={styles.modalDone}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.timeList} showsVerticalScrollIndicator={false}>
            {TIME_OPTIONS.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeOption,
                  selectedTime === time && styles.timeOptionSelected,
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    selectedTime === time && styles.timeOptionTextSelected,
                  ]}
                >
                  {formatTime(time)}
                </Text>
                {selectedTime === time && (
                  <View style={styles.checkmark}>
                    <CheckIcon size={14} color={PsychiColors.white} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    fontFamily: Typography.fontFamily.serif,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  acceptingCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    ...Shadows.soft,
  },
  acceptingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  acceptingInfo: {
    flex: 1,
  },
  acceptingTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
    marginBottom: 2,
  },
  acceptingSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${PsychiColors.royalBlue}10`,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  dayCard: {
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    ...Shadows.soft,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  dayHours: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  slotsContainer: {
    backgroundColor: PsychiColors.frost,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: PsychiColors.borderUltraLight,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.cloud,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
    gap: Spacing.xs,
  },
  timeButtonText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
  },
  toText: {
    marginHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
  },
  removeButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${PsychiColors.error}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSlotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  addSlotText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
  },
  saveContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.button,
  },
  saveGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.borderLight,
    backgroundColor: PsychiColors.cloud,
  },
  modalCancel: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textMuted,
  },
  modalTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.textPrimary,
  },
  modalDone: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.royalBlue,
  },
  timeList: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.borderUltraLight,
  },
  timeOptionSelected: {
    backgroundColor: `${PsychiColors.royalBlue}10`,
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  timeOptionText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  timeOptionTextSelected: {
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.semibold,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: PsychiColors.royalBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: PsychiColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
