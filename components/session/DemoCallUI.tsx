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

// Use 8000 Hz / 1 s to keep the buffer small (~16 KB) and Hermes-safe
function buildSineWaveWAV(
  frequency = 440,
  durationSec = 1,
  sampleRate = 8000,
  amplitude = 0.5
): string {
  const numSamples = Math.floor(sampleRate * durationSec);
  const dataBytes  = numSamples * 2;

  const buffer = new ArrayBuffer(44 + dataBytes);
  const v      = new DataView(buffer);

  const str = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) v.setUint8(offset + i, text.charCodeAt(i));
  };

  str(0, 'RIFF');
  v.setUint32(4,  36 + dataBytes,      true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16,                  true);
  v.setUint16(20, 1,                   true); // PCM
  v.setUint16(22, 1,                   true); // mono
  v.setUint32(24, sampleRate,          true);
  v.setUint32(28, sampleRate * 2,      true); // byte rate
  v.setUint16(32, 2,                   true); // block align
  v.setUint16(34, 16,                  true); // bits per sample
  str(36, 'data');
  v.setUint32(40, dataBytes,           true);

  for (let i = 0; i < numSamples; i++) {
    const s = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * amplitude * 32767;
    v.setInt16(44 + i * 2, Math.round(s), true);
  }

  // Hermes-safe base64: iterate byte-by-byte (no spread on TypedArrays)
  const bytes  = new Uint8Array(buffer);
  const chars  = new Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) chars[i] = String.fromCharCode(bytes[i]);
  return btoa(chars.join(''));
}

// ---------------------------------------------------------------------------

export default function DemoCallUI({ callType, supporterName, onEndCall }: DemoCallUIProps) {
  const [elapsed,      setElapsed]      = useState(0);
  const [isMuted,      setIsMuted]      = useState(false);
  const [isSpeakerOn,  setIsSpeakerOn]  = useState(true);
  const [isCameraOff,  setIsCameraOff]  = useState(false);
  const [audioStatus,  setAudioStatus]  = useState('initializing...');

  const soundRef = useRef<Audio.Sound | null>(null);

  // ------------------------------------------------------------------
  // Audio session + tone
  // ------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    const setupAudio = async () => {
      console.log('[DemoAudio] ── setup start ──────────────────────');
      try {
        // Step 1: configure AVAudioSession
        setAudioStatus('step 1: audio session...');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS:         false,
          playsInSilentModeIOS:       true,
          staysActiveInBackground:    true,
          interruptionModeIOS:        2,
          shouldDuckAndroid:          false,
          interruptionModeAndroid:    1,
          playThroughEarpieceAndroid: false,
        });
        console.log('[DemoAudio] 1. setAudioModeAsync OK');
        setAudioStatus('step 2: generating WAV...');

        // Step 2: generate WAV
        const wavB64 = buildSineWaveWAV(440, 1, 8000, 0.5);
        const expectedLen = Math.round((44 + 8000 * 2) * 4 / 3);
        console.log('[DemoAudio] 2. WAV b64 length:', wavB64.length, 'expected ~', expectedLen);
        setAudioStatus(`step 2: WAV ${wavB64.length}b (exp ~${expectedLen}b)`);

        // Step 3: write to cache
        const path = (FileSystem.cacheDirectory ?? '') + 'demo-call-tone.wav';
        setAudioStatus('step 3: writing file...');
        await FileSystem.writeAsStringAsync(path, wavB64, {
          encoding: 'base64' as any,
        });
        const info = await FileSystem.getInfoAsync(path);
        const fileSize = (info as any).size ?? 'n/a';
        console.log('[DemoAudio] 3. file written — exists:', info.exists, 'size:', fileSize);
        setAudioStatus(`step 3: file ${info.exists ? 'OK' : 'MISSING'} ${fileSize}b`);

        if (cancelled) { setAudioStatus('cancelled'); return; }

        // Step 4: load and play sound
        setAudioStatus('step 4: loading sound...');
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: path },
          { isLooping: true, volume: 1.0, shouldPlay: true }
        );
        const isLoaded = (status as any).isLoaded;
        const isPlaying = (status as any).isPlaying;
        console.log('[DemoAudio] 4. created — isLoaded:', isLoaded, 'isPlaying:', isPlaying);
        setAudioStatus(`step 4: loaded=${isLoaded} playing=${isPlaying}`);

        if (cancelled) { await sound.unloadAsync(); setAudioStatus('cancelled'); return; }

        // Step 5: confirm status
        const ps = await sound.getStatusAsync();
        const playing = (ps as any).isPlaying;
        const looping = (ps as any).isLooping;
        const vol     = (ps as any).volume;
        console.log('[DemoAudio] 5. status — playing:', playing, 'looping:', looping, 'vol:', vol);
        setAudioStatus(`playing=${playing} loop=${looping} vol=${vol}`);

        soundRef.current = sound;
        console.log('[DemoAudio] ── setup complete ─────────────────');
      } catch (err: any) {
        const msg = err?.message ?? String(err);
        console.error('[DemoAudio] ERROR:', msg);
        setAudioStatus(`ERROR: ${msg}`);
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

      {/* Debug overlay — remove before final submission */}
      <View style={styles.debugOverlay} pointerEvents="none">
        <Text style={styles.debugText}>DEMO AUDIO: {audioStatus}</Text>
      </View>

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
  debugOverlay: {
    position: 'absolute',
    top: 52,
    left: 8,
    right: 8,
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  debugText: {
    color: '#00FF88',
    fontSize: 11,
    fontFamily: 'Courier',
    textAlign: 'center',
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
