/**
 * SupportTypes Section - Exact match to web app SupportTypes.tsx
 * "Connect in a way that feels right"
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Gradients, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import { ChatIcon, PhoneIcon, VideoIcon } from '@/components/icons';

const { width: screenWidth } = Dimensions.get('window');

interface SupportTypesProps {
  onSelectType?: (type: 'chat' | 'phone' | 'video') => void;
}

const supportTypes = [
  {
    id: 'chat',
    title: 'Chat Session',
    description: 'Text-based support at your own pace',
    price: '$7',
    duration: 'per 25 min',
    accentColor: PsychiColors.chatAccent,
    gradient: Gradients.chatCard,
    icon: ChatIcon,
  },
  {
    id: 'phone',
    title: 'Phone Call',
    description: 'Voice conversations for deeper connection',
    price: '$15',
    duration: 'per 45 min',
    accentColor: PsychiColors.phoneAccent,
    gradient: Gradients.phoneCard,
    icon: PhoneIcon,
  },
  {
    id: 'video',
    title: 'Video Chat',
    description: 'Face-to-face support from anywhere',
    price: '$20',
    duration: 'per 45 min',
    accentColor: PsychiColors.videoAccent,
    gradient: Gradients.videoCard,
    icon: VideoIcon,
  },
];

export default function SupportTypes({ onSelectType }: SupportTypesProps) {
  return (
    <LinearGradient
      colors={Gradients.supportTypes}
      style={styles.container}
    >
      {/* Section Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Connect in a way that{' '}
          <Text style={styles.titleItalic}>feels right</Text>
        </Text>
        <Text style={styles.subtitle}>
          Choose the support format that works best for you
        </Text>
      </View>

      {/* Support Type Cards */}
      <View style={styles.cardsContainer}>
        {supportTypes.map((type) => {
          const IconComponent = type.icon;
          return (
            <TouchableOpacity
              key={type.id}
              style={styles.card}
              onPress={() => onSelectType?.(type.id as 'chat' | 'phone' | 'video')}
              activeOpacity={0.8}
            >
              {/* Icon - simple black icon at top (matches web) */}
              <View style={styles.iconContainer}>
                <IconComponent size={32} color={PsychiColors.midnight} />
              </View>

              {/* Title */}
              <Text style={styles.cardTitle}>{type.title}</Text>

              {/* Description */}
              <Text style={styles.cardDescription}>{type.description}</Text>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{type.price}</Text>
                <Text style={styles.duration}> {type.duration}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Note */}
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          All sessions include secure, encrypted communication
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },

  // Header styles
  header: {
    marginBottom: Spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: screenWidth < 380 ? 28 : 32,
    fontWeight: '400',
    color: PsychiColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  titleItalic: {
    fontStyle: 'italic',
  },
  subtitle: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.warmBrown,
    textAlign: 'center',
  },

  // Cards container
  cardsContainer: {
    gap: Spacing.md,
  },

  // Individual card styles - vertical layout matching web
  card: {
    backgroundColor: PsychiColors.glassWhiteStrong,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },

  iconContainer: {
    marginBottom: Spacing.sm,
  },

  cardTitle: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize.lg,
    fontWeight: '500',
    color: PsychiColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.warmBrown,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontFamily: Typography.fontFamily.serif,
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '500',
    color: PsychiColors.textPrimary,
  },
  duration: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
  },

  // Note section
  noteContainer: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  noteText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    textAlign: 'center',
  },
});
