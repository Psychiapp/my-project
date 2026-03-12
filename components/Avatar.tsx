import React, { useState } from 'react';
import { Image, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors } from '@/constants/theme';

interface AvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: number;
  colors?: [string, string];
}

/**
 * Avatar component that displays a profile image or falls back to an initial letter.
 *
 * @param imageUrl - The URL of the profile image (from profiles.avatar_url)
 * @param name - The name to use for the initial fallback
 * @param size - The size of the avatar in pixels (default: 60)
 * @param colors - Gradient colors for the fallback [start, end]
 */
export function Avatar({
  imageUrl,
  name,
  size = 60,
  colors = [PsychiColors.azure, PsychiColors.deep]
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initial = name?.charAt(0)?.toUpperCase() || '?';
  const fontSize = size * 0.4;

  // Show image if URL exists and hasn't errored
  if (imageUrl && !imageError) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 }
        ]}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to initial letter
  return (
    <LinearGradient
      colors={colors}
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 }
      ]}
    >
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: PsychiColors.glassWhite,
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: PsychiColors.white,
    fontWeight: '600',
  },
});
