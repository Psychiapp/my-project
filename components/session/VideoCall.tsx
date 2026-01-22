/**
 * VideoCall Component
 * Handles video and voice calls using Daily.co React Native SDK
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Spacing, BorderRadius } from '@/constants/theme';
import { LockIcon, MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, VolumeHighIcon, VolumeLowIcon, PhoneIcon } from '@/components/icons';
import EmergencyButton from './EmergencyButton';

// Conditionally import Daily.co to avoid crash in Expo Go
let Daily: any = null;
let DailyMediaView: any = null;
type DailyCall = any;
type DailyParticipant = any;

try {
  const dailyModule = require('@daily-co/react-native-daily-js');
  Daily = dailyModule.default;
  DailyMediaView = dailyModule.DailyMediaView;
} catch (e) {
  console.log('Daily.co native module not available (running in Expo Go)');
}

const { width } = Dimensions.get('window');

interface VideoCallProps {
  roomUrl: string;
  participantName: string;
  otherParticipant: {
    id: string;
    name: string;
  };
  isVideoEnabled?: boolean;
  onEndCall: () => void;
  onError?: (error: string) => void;
}

export default function VideoCall({
  roomUrl,
  participantName,
  otherParticipant,
  isVideoEnabled = true,
  onEndCall,
  onError,
}: VideoCallProps) {
  // Check if Daily.co is available (not in Expo Go)
  if (!Daily) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Video Calls Unavailable</Text>
          <Text style={styles.errorMessage}>
            Video and voice calls require a development build. They are not available in Expo Go.
          </Text>
          <TouchableOpacity style={styles.errorButton} onPress={onEndCall}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [callObject, setCallObject] = useState<DailyCall | null>(null);
  const [participants, setParticipants] = useState<Record<string, DailyParticipant>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(isVideoEnabled);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Daily.co call
  useEffect(() => {
    const initCall = async () => {
      try {
        const call = Daily.createCallObject({
          videoSource: isVideoEnabled,
          audioSource: true,
        });

        // Event handlers
        call.on('joined-meeting', () => {
          setIsConnecting(false);
          setParticipants(call.participants());
        });

        call.on('left-meeting', () => {
          onEndCall();
        });

        call.on('participant-joined', () => {
          setParticipants({ ...call.participants() });
        });

        call.on('participant-updated', () => {
          setParticipants({ ...call.participants() });
        });

        call.on('participant-left', () => {
          setParticipants({ ...call.participants() });
        });

        call.on('error', (event) => {
          console.error('Daily.co error:', event);
          const errorMsg = (event as any)?.errorMsg || 'Connection error';
          setError(errorMsg);
          onError?.(errorMsg);
        });

        setCallObject(call);

        // Join the room
        await call.join({
          url: roomUrl,
          userName: participantName,
        });
      } catch (err) {
        console.error('Failed to join call:', err);
        setError('Failed to connect to the call');
        onError?.('Failed to connect to the call');
      }
    };

    initCall();

    return () => {
      if (callObject) {
        callObject.leave();
        callObject.destroy();
      }
    };
  }, [roomUrl, participantName, isVideoEnabled]);

  // Call duration timer
  useEffect(() => {
    if (isConnecting) return;

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnecting]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle audio
  const toggleMute = useCallback(() => {
    if (callObject) {
      callObject.setLocalAudio(isMuted);
      setIsMuted(!isMuted);
    }
  }, [callObject, isMuted]);

  // Toggle video
  const toggleCamera = useCallback(() => {
    if (callObject && isVideoEnabled) {
      callObject.setLocalVideo(!isCameraOn);
      setIsCameraOn(!isCameraOn);
    }
  }, [callObject, isCameraOn, isVideoEnabled]);

  // End call
  const handleEndCall = useCallback(() => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: () => {
            if (callObject) {
              callObject.leave();
            }
            onEndCall();
          },
        },
      ]
    );
  }, [callObject, onEndCall]);

  // Get participants
  const localParticipant = participants.local;
  const remoteParticipant = Object.values(participants).find((p) => !p.local);

  const ControlButton = ({
    iconComponent,
    label,
    isActive,
    onPress,
  }: {
    iconComponent: React.ReactNode;
    label: string;
    isActive?: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.controlButton} onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.controlIconContainer,
          isActive && styles.controlIconActive,
        ]}
      >
        {iconComponent}
      </View>
      <Text style={styles.controlLabel}>{label}</Text>
    </TouchableOpacity>
  );

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.errorButton} onPress={onEndCall}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Remote Video / Avatar */}
      <View style={styles.remoteVideoContainer}>
        {remoteParticipant?.videoTrack && isVideoEnabled ? (
          <DailyMediaView
            videoTrack={remoteParticipant.videoTrack}
            audioTrack={remoteParticipant.audioTrack}
            objectFit="cover"
            style={styles.remoteVideo}
          />
        ) : (
          <LinearGradient
            colors={[PsychiColors.midnight, PsychiColors.sapphire] as const}
            style={styles.audioOnlyContainer}
          >
            <View style={styles.audioOnlyAvatar}>
              <LinearGradient
                colors={[PsychiColors.azure, PsychiColors.deep] as const}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarLargeText}>
                  {remoteParticipant?.user_name?.charAt(0) || otherParticipant.name.charAt(0)}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.audioOnlyName}>
              {remoteParticipant?.user_name || otherParticipant.name}
            </Text>
            {isConnecting ? (
              <View style={styles.connectingIndicator}>
                <ActivityIndicator color={PsychiColors.azure} size="small" />
                <Text style={styles.connectingText}>Connecting...</Text>
              </View>
            ) : (
              <Text style={styles.callDurationText}>{formatDuration(callDuration)}</Text>
            )}
          </LinearGradient>
        )}
      </View>

      {/* Local Video (self-view) */}
      {isVideoEnabled && isCameraOn && localParticipant?.videoTrack && (
        <View style={styles.localVideoContainer}>
          <DailyMediaView
            videoTrack={localParticipant.videoTrack}
            audioTrack={null}
            mirror={true}
            objectFit="cover"
            style={styles.localVideo}
          />
        </View>
      )}

      {/* Top Bar */}
      <SafeAreaView style={styles.topBar}>
        <View style={styles.topBarContent}>
          <View style={styles.callInfo}>
            <Text style={styles.callTitle}>
              {isVideoEnabled ? 'Video Call' : 'Voice Call'}
            </Text>
            {!isConnecting && (
              <View style={styles.durationBadge}>
                <View style={styles.recordingDot} />
                <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
              </View>
            )}
          </View>
          <View style={styles.topBarRight}>
            <EmergencyButton
              sessionId={roomUrl}
              sessionType={isVideoEnabled ? 'video' : 'phone'}
              participantName={otherParticipant.name}
              currentUserName={participantName}
            />
            <View style={styles.encryptionBadge}>
              <LockIcon size={12} color={PsychiColors.success} />
              <Text style={styles.encryptionText}>Encrypted</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Connecting Overlay */}
      {isConnecting && (
        <View style={styles.connectingOverlay}>
          <View style={styles.connectingCard}>
            <ActivityIndicator size="large" color={PsychiColors.azure} />
            <Text style={styles.connectingTitle}>Connecting to {otherParticipant.name}</Text>
            <Text style={styles.connectingSubtitle}>
              {isVideoEnabled ? 'Video call starting...' : 'Voice call starting...'}
            </Text>
          </View>
        </View>
      )}

      {/* Controls */}
      <SafeAreaView style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <ControlButton
            iconComponent={isMuted ? <MicOffIcon size={24} color={PsychiColors.white} /> : <MicIcon size={24} color={PsychiColors.white} />}
            label={isMuted ? 'Unmute' : 'Mute'}
            isActive={isMuted}
            onPress={toggleMute}
          />

          {isVideoEnabled && (
            <ControlButton
              iconComponent={isCameraOn ? <VideoIcon size={24} color={PsychiColors.white} /> : <VideoOffIcon size={24} color={PsychiColors.white} />}
              label={isCameraOn ? 'Camera Off' : 'Camera On'}
              isActive={!isCameraOn}
              onPress={toggleCamera}
            />
          )}

          <ControlButton
            iconComponent={isSpeakerOn ? <VolumeHighIcon size={24} color={PsychiColors.white} /> : <VolumeLowIcon size={24} color={PsychiColors.white} />}
            label={isSpeakerOn ? 'Speaker' : 'Earpiece'}
            isActive={!isSpeakerOn}
            onPress={() => setIsSpeakerOn(!isSpeakerOn)}
          />
        </View>

        {/* End Call Button */}
        <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall} activeOpacity={0.8}>
          <LinearGradient
            colors={[PsychiColors.error, '#C53030'] as const}
            style={styles.endCallGradient}
          >
            <View style={styles.endCallIconContainer}>
              <PhoneIcon size={20} color={PsychiColors.white} />
            </View>
            <Text style={styles.endCallText}>End Call</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.midnight,
  },
  remoteVideoContainer: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
  },
  audioOnlyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioOnlyAvatar: {
    marginBottom: Spacing.lg,
  },
  avatarGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLargeText: {
    fontSize: 56,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  audioOnlyName: {
    fontSize: 28,
    fontWeight: '600',
    color: PsychiColors.white,
    marginBottom: Spacing.sm,
  },
  connectingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  connectingText: {
    fontSize: 16,
    color: PsychiColors.textSoft,
  },
  callDurationText: {
    fontSize: 18,
    color: PsychiColors.textSoft,
    fontWeight: '500',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: Spacing.md,
    width: 120,
    height: 160,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  localVideo: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  callTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PsychiColors.error,
  },
  durationText: {
    fontSize: 13,
    color: PsychiColors.white,
    fontWeight: '500',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  encryptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  encryptionText: {
    fontSize: 11,
    color: PsychiColors.success,
    fontWeight: '600',
  },
  connectingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  connectingCard: {
    backgroundColor: PsychiColors.sapphire,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    width: width * 0.8,
  },
  connectingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.white,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  connectingSubtitle: {
    fontSize: 14,
    color: PsychiColors.textSoft,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.lg,
  },
  controlButton: {
    alignItems: 'center',
  },
  controlIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  controlIconActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
  },
  controlLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  endCallButton: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  endCallGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  endCallIconContainer: {
    transform: [{ rotate: '135deg' }],
  },
  endCallText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  errorIconText: {
    fontSize: 32,
    color: PsychiColors.error,
    fontWeight: 'bold',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: PsychiColors.white,
    marginBottom: Spacing.sm,
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  errorButton: {
    backgroundColor: PsychiColors.azure,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  errorButtonText: {
    color: PsychiColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
