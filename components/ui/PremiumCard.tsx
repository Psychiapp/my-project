/**
 * PremiumCard - Luxurious glassmorphism card component
 * Editorial-quality design with soft gradients and refined shadows
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { PsychiColors, Shadows, Spacing, Gradients } from '@/constants/theme';

interface PremiumCardProps {
  children: React.ReactNode;
  variant?: 'glass' | 'elevated' | 'editorial' | 'subtle';
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  noBorder?: boolean;
}

export function PremiumCard({
  children,
  variant = 'elevated',
  style,
  padding = 'lg',
  noBorder = false,
}: PremiumCardProps) {
  const paddingValue = {
    none: 0,
    sm: Spacing['3'],
    md: Spacing['4'],
    lg: Spacing['6'],
    xl: Spacing['8'],
  }[padding];

  if (variant === 'glass') {
    return (
      <View style={[styles.glassContainer, style]}>
        <LinearGradient
          colors={Gradients.glassCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.glassCard,
            { padding: paddingValue },
            !noBorder && styles.glassBorder,
          ]}
        >
          {children}
        </LinearGradient>
      </View>
    );
  }

  if (variant === 'editorial') {
    return (
      <View
        style={[
          styles.editorialCard,
          { padding: paddingValue },
          !noBorder && styles.editorialBorder,
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  if (variant === 'subtle') {
    return (
      <View
        style={[
          styles.subtleCard,
          { padding: paddingValue },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  // Default: elevated
  return (
    <View
      style={[
        styles.elevatedCard,
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// Stat card for displaying metrics elegantly
interface StatCardProps {
  value: string | number;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
}

export function StatCard({
  value,
  label,
  sublabel,
  icon,
  accentColor,
  style,
}: StatCardProps) {
  return (
    <PremiumCard variant="elevated" padding="md" style={StyleSheet.flatten([styles.statCard, style])}>
      {icon && (
        <View
          style={[
            styles.statIconContainer,
            accentColor && { backgroundColor: `${accentColor}12` },
          ]}
        >
          {icon}
        </View>
      )}
      <View style={styles.statValueContainer}>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{value}</Text>
          {sublabel && <Text style={styles.statSublabel}>{sublabel}</Text>}
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </PremiumCard>
  );
}

// Section header for editorial layouts
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {action}
    </View>
  );
}

// Divider component
interface DividerProps {
  style?: ViewStyle;
}

export function Divider({ style }: DividerProps) {
  return <View style={[styles.divider, style]} />;
}

// Import Text for the components
import { Text } from 'react-native';

const styles = StyleSheet.create({
  // Glass card
  glassContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    ...Shadows.glass,
  },
  glassCard: {
    borderRadius: 20,
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: PsychiColors.borderGlass,
  },

  // Elevated card
  elevatedCard: {
    backgroundColor: PsychiColors.cloud,
    borderRadius: 20,
    ...Shadows.premium,
  },

  // Editorial card
  editorialCard: {
    backgroundColor: PsychiColors.cloud,
    borderRadius: 20,
  },
  editorialBorder: {
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },

  // Subtle card
  subtleCard: {
    backgroundColor: PsychiColors.frost,
    borderRadius: 16,
  },

  // Stat card
  statCard: {
    alignItems: 'flex-start',
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: PsychiColors.frost,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing['3'],
  },
  statValueContainer: {
    alignItems: 'flex-start',
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing['1'],
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
    letterSpacing: -0.5,
  },
  statSublabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.textMuted,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: PsychiColors.textMuted,
    marginTop: Spacing['0.5'],
    letterSpacing: 0.3,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing['4'],
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: PsychiColors.textPrimary,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: Spacing['0.5'],
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
    marginVertical: Spacing['5'],
  },
});
