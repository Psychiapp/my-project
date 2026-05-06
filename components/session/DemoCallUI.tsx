/**
 * DemoCallUI
 * Renders a functional phone or video call UI for demo mode.
 * No Daily.co connection, but configures AVAudioSession and plays a soft
 * looping tone so Apple's reviewer can verify background audio works.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors } from '@/constants/theme';

interface DemoCallUIProps {
  callType: 'phone' | 'video';
  supporterName: string;
  onEndCall: () => void;
}

// ---------------------------------------------------------------------------
// WAV generation
// Generate a gentle 440 Hz sine-wave tone (2 s, 22 050 Hz, mono, 16-bit PCM).
// The file is written once to the cache directory and played on loop.
// ---------------------------------------------------------------------------

function buildSineWaveWAV(
  frequency = 440,
  durationSec = 2,
  sampleRate = 22050,
  amplitude = 0.25   // 25% volume — audible but not harsh
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataBytes  = numSamples * 2; // 16-bit = 2 bytes per sample

  // Build a DataView over an ArrayBuffer large enough for the WAV
  const buffer = new ArrayBuffer(44 + dataBytes);
  const v      = new DataView(buffer);

  // Helper: write an ASCII string at byte offset
  const str = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      v.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  // --- RIFF header ---
  str(0, 'RIFF');
  v.setUint32(4,  36 + dataBytes, true); // file size - 8
  str(8, 'WAVE');

  // --- fmt  chunk ---
  str(12, 'fmt ');
  v.setUint32(16, 16,          true); // chunk size
  v.setUint16(20, 1,           true); // PCM
  v.setUint16(22, 1,           true); // mono
  v.setUint32(24, sampleRate,  true);
  v.setUint32(28, sampleRate * 2, true); // byte rate
  v.setUint16(32, 2,           true); // block align
  v.setUint16(34, 16,          true); // bits per sample

  // --- data chunk ---
  str(36, 'data');
  v.setUint32(40, dataBytes, true);

  // --- PCM samples ---
  for (let i = 0; i < numSamples; i++) {
    // Sine wave sample, scaled to 16-bit signed range
    const sample = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * amplitude * 32767;
    v.setInt16(44 + i * 2, Math.round(sample), true);
  }

  // Convert ArrayBuffer → base64 string
  const bytes  = new Uint8Array(buffer);
  let   binary = '';
  // Process in chunks to avoid stack overflow on large arrays
  const chunk  = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------

export default function DemoCallUI({ callType, supporterName, onEndCall }: DemoCallUIProps) {
  const [elapsed,     setElapsed]     = useState(0);
  const [isMuted,     setIsMuted]     = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);

  // ------------------------------------------------------------------
  // Audio session + tone
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const setupAudio = async () => {
      try {
        // Configure AVAudioSession identically to the real VideoCall component
        await Audio.setAudioModeAsync({
          allowsRecordingIOS:       false,
          playsInSilentModeIOS:     true,
          staysActiveInBackground:  true,   // keeps audio alive when app is backgrounded
          interruptionModeIOS:      2,       // DoNotMix — prioritise this app's audio
          shouldDuckAndroid:        false,
          interruptionModeAndroid:  1,       // DoNotMix
          playThroughEarpieceAndroid: false,
        });

        // Write the generated WAV to the cache directory
        const path     = FileSystem.cacheDirectory + 'demo-call-tone.wav';
        const wavB64   = buildSineWaveWAV(440, 2, 22050, 0.25);
        await FileSystem.writeAsStringAsync(path, wavB64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (cancelled) return;

        // Load and play on loop
        const { sound } = await Audio.Sound.createAsync(
          { uri: path },
          {
            isLooping:  true,
            volume:     1.0,
            shouldPlay: true,
          }
        );

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
      } catch (err) {
        // Non-fatal — call UI still works even if audio setup fails
        console.warn('[DemoCallUI] Audio setup error:', err);
      }
    };

    setupAudio();

    return () => {
      cancelled = true;
      const teardown = async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
          // Reset audio session
          await Audio.setAudioModeAsync({
            allowsRecordingIOS:      false,
            playsInSilentModeIOS:    false,
            staysActiveInBackground: false,
            interruptionModeIOS:     1, // DoNotMix default
            shouldDuckAndroid:       true,
            interruptionModeAndroid: 1,
          });
        } catch {
          // Ignore cleanup errors
        }
      };
      teardown();
    };
  }, []);

  // ------------------------------------------------------------------
  // Speaker toggle — route audio to earpiece or main speaker
  // ------------------------------------------------------------------
  const handleSpeakerToggle = async () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS:       false,
        playsInSilentModeIOS:     true,
        staysActiveInBackground:  true,
        interruptionModeIOS:      2,
        shouldDuckAndroid:        false,
        interruptionModeAndroid:  1,
        playThroughEarpieceAndroid: !next,
      });
    } catch {
      // Non-fatal
    }
  };

  // ------------------------------------------------------------------
  // End call — stop audio then invoke parent callback
  // ------------------------------------------------------------------
  const handleEnd = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {
      // Ignore
    }
    onEndCall();
  };

  // ------------------------------------------------------------------
  // Timer
  // ------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m   = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const initials = supporterName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={['#1A1A2E', '#16213E', '#0F3460']}
        style={styles.remoteArea}
      >
        <View style={styles.supporterCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.supporterName}>{supporterName}</Text>
          <Text style={styles.statusLabel}>Connected</Text>
        </View>

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

      <SafeAreaView style={styles.controlsContainer}>
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
              onPress={handleSpeakerToggle}
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
            onPress={handleEnd}
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
