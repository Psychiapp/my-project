/**
 * DemoCallUI
 * Renders a functional phone or video call UI for demo mode.
 * No Daily.co connection — shows controls + timer + layout only.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors } from '@/constants/theme';

interface DemoCallUIProps {
  callType: 'phone' | 'video';
  supporterName: string;
  onEndCall: () => void;
}

export default function DemoCallUI({ callType, supporterName, onEndCall }: DemoCallUIProps) {
  const [elapsed, setElapsed] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const initials = supporterName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Remote area — gradient background for video, solid for phone */}
      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.remoteArea}
      >
        {/* Supporter placeholder (always shown — no real remote video in demo) */}
        <View style={styles.supporterCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.supporterName}>{supporterName}</Text>
          <Text style={styles.statusLabel}>Connected</Text>
        </View>

        {/* Local camera placeholder for video (bottom-right corner) */}
        {callType === 'video' && !isCameraOff && (
          <View style={styles.localCamera}>
            <LinearGradient
              colors={['#2A2A4A', '#1A1A2E']}
              style={styles.localCameraGradient}
            >
              <Text style={styles.localCameraLabel}>You</Text>
            </LinearGradient>
          </View>
        )}
      </LinearGradient>

      {/* Bottom controls */}
      <SafeAreaView style={styles.controlsContainer}>
        {/* Timer */}
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>

        <View style={styles.controls}>
          {/* Mute */}
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={() => setIsMuted(m => !m)}
            accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
          >
            <Text style={styles.controlIcon}>{isMuted ? 'mic off' : 'mic'}</Text>
            <Text style={styles.controlLabel}>{isMuted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          {/* Speaker (phone) or Camera toggle (video) */}
          {callType === 'phone' ? (
            <TouchableOpacity
              style={[styles.controlBtn, isSpeakerOn && styles.controlBtnActive]}
              onPress={() => setIsSpeakerOn(s => !s)}
              accessibilityLabel="Speaker"
            >
              <Text style={styles.controlIcon}>speaker</Text>
              <Text style={styles.controlLabel}>Speaker</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
              onPress={() => setIsCameraOff(c => !c)}
              accessibilityLabel={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
            >
              <Text style={styles.controlIcon}>{isCameraOff ? 'cam off' : 'cam'}</Text>
              <Text style={styles.controlLabel}>{isCameraOff ? 'Cam Off' : 'Cam On'}</Text>
            </TouchableOpacity>
          )}

          {/* End call */}
          <TouchableOpacity
            style={styles.endBtn}
            onPress={onEndCall}
            accessibilityLabel="End call"
          >
            <Text style={styles.endIcon}>End</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  remoteArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supporterCard: {
    alignItems: 'center',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: PsychiColors.royalBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
  },
  supporterName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  localCamera: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 90,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localCameraGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  localCameraLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  controlsContainer: {
    backgroundColor: '#0F0F1E',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  timer: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 8,
  },
  controlBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  controlIcon: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  controlLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    marginTop: 2,
  },
  endBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E53E3E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  endIcon: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
});
