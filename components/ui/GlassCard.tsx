/**
 * GlassCard Component
 * Premium glassmorphism card with subtle frosted glass effect
 * Refined, minimal, and sophisticated design
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import {
  BorderRadius,
  Spacing,
  Shadows,
  PsychiColors,
} from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'subtle' | 'solid' | 'outlined';
  padding?: keyof typeof Spacing | number;
  borderRadius?: keyof typeof BorderRadius | number;
  noBorder?: boolean;
  noShadow?: boolean;
}

// Variant configurations for different card styles
const variantConfig = {
  default: {
    backgroundColor: PsychiColors.glassFrosted,
    borderColor: PsychiColors.borderUltraLight,
    shadow: Shadows.soft,
  },
  elevated: {
    backgroundColor: PsychiColors.cloud,
    borderColor: 'transparent',
    shadow: Shadows.medium,
  },
  subtle: {
    backgroundColor: PsychiColors.glassSubtle,
    borderColor: PsychiColors.borderUltraLight,
    shadow: Shadows.ambient,
  },
  solid: {
    backgroundColor: PsychiColors.cloud,
    borderColor: PsychiColors.borderLight,
    shadow: Shadows.sm,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: PsychiColors.borderMedium,
    shadow: Shadows.none,
  },
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'xl',
  noBorder = false,
  noShadow = false,
}) => {
  // Get padding value
  const paddingValue = typeof padding === 'number'
    ? padding
    : Spacing[padding as keyof typeof Spacing] || Spacing.lg;

  // Get border radius value
  const borderRadiusValue = typeof borderRadius === 'number'
    ? borderRadius
    : BorderRadius[borderRadius as keyof typeof BorderRadius] || BorderRadius.xl;

  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderRadius: borderRadiusValue,
          borderWidth: noBorder ? 0 : 1,
          borderColor: config.borderColor,
          padding: paddingValue,
        },
        !noShadow && config.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Simple glass card without any bells and whistles - for lists etc.
export const GlassCardSimple: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'xl',
  noBorder = false,
  noShadow = false,
}) => {
  const paddingValue = typeof padding === 'number'
    ? padding
    : Spacing[padding as keyof typeof Spacing] || Spacing.lg;

  const borderRadiusValue = typeof borderRadius === 'number'
    ? borderRadius
    : BorderRadius[borderRadius as keyof typeof BorderRadius] || BorderRadius.xl;

  const config = variantConfig[variant];

  return (
    <View
      style={[
        {
          backgroundColor: config.backgroundColor,
          borderRadius: borderRadiusValue,
          borderWidth: noBorder ? 0 : 1,
          borderColor: config.borderColor,
          padding: paddingValue,
        },
        !noShadow && config.shadow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Compact card for list items
interface CompactCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  active?: boolean;
}

export const CompactCard: React.FC<CompactCardProps> = ({
  children,
  style,
  active = false,
}) => {
  return (
    <View
      style={[
        styles.compactCard,
        active && styles.compactCardActive,
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Section card for grouping content
interface SectionCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  title?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  style,
}) => {
  return (
    <View style={[styles.sectionCard, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  compactCard: {
    backgroundColor: PsychiColors.cloud,
    borderRadius: BorderRadius.lg,
    padding: Spacing['4'],
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
    ...Shadows.sm,
  },
  compactCardActive: {
    borderColor: PsychiColors.coral,
    borderWidth: 2,
  },
  sectionCard: {
    backgroundColor: PsychiColors.frost,
    borderRadius: BorderRadius.xl,
    padding: Spacing['5'],
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },
});

export default GlassCard;
