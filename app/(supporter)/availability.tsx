import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  enabled: boolean;
  slots: TimeSlot[];
}

export default function AvailabilityScreen() {
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({
    Monday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Tuesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Wednesday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Thursday: { enabled: true, slots: [{ start: '09:00', end: '17:00' }] },
    Friday: { enabled: true, slots: [{ start: '09:00', end: '12:00' }] },
    Saturday: { enabled: false, slots: [] },
    Sunday: { enabled: false, slots: [] },
  });

  const toggleDay = (day: string) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
        slots: !prev[day].enabled ? [{ start: '09:00', end: '17:00' }] : [],
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Availability</Text>
          <Text style={styles.headerSubtitle}>Set your weekly schedule</Text>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
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
                      {availability[day].slots
                        .map((slot) => `${formatTime(slot.start)} - ${formatTime(slot.end)}`)
                        .join(', ')}
                    </Text>
                  )}
                </View>
                <Switch
                  value={availability[day]?.enabled || false}
                  onValueChange={() => toggleDay(day)}
                  trackColor={{ false: 'rgba(0,0,0,0.1)', true: 'rgba(74, 144, 226, 0.3)' }}
                  thumbColor={availability[day]?.enabled ? PsychiColors.azure : PsychiColors.textSoft}
                />
              </View>

              {availability[day]?.enabled && (
                <View style={styles.slotsContainer}>
                  {availability[day].slots.map((slot, index) => (
                    <View key={index} style={styles.slotRow}>
                      <TouchableOpacity style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>{formatTime(slot.start)}</Text>
                      </TouchableOpacity>
                      <Text style={styles.toText}>to</Text>
                      <TouchableOpacity style={styles.timeButton}>
                        <Text style={styles.timeButtonText}>{formatTime(slot.end)}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addSlotButton}>
                    <Text style={styles.addSlotText}>+ Add time slot</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Save Button */}
        <View style={styles.saveContainer}>
          <TouchableOpacity style={styles.saveButton} activeOpacity={0.8}>
            <LinearGradient
              colors={[PsychiColors.azure, PsychiColors.deep]}
              style={styles.saveGradient}
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  headerSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: 4,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
  },
  section: {
    paddingHorizontal: Spacing.lg,
  },
  dayCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  dayHours: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  slotsContainer: {
    backgroundColor: PsychiColors.cream,
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  timeButton: {
    backgroundColor: PsychiColors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  toText: {
    marginHorizontal: Spacing.sm,
    fontSize: 14,
    color: PsychiColors.textMuted,
  },
  removeButton: {
    marginLeft: 'auto',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: PsychiColors.error,
    fontWeight: '600',
  },
  addSlotButton: {
    paddingVertical: Spacing.sm,
  },
  addSlotText: {
    fontSize: 14,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  saveContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  saveButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  saveGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
