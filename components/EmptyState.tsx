import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PsychiColors, Spacing, BorderRadius } from '@/constants/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

/**
 * Reusable empty state component for list screens with no data.
 *
 * @param icon - Optional icon to display above the title
 * @param title - Main title text
 * @param description - Optional description text below the title
 * @param actionLabel - Optional button label
 * @param onAction - Optional button action handler
 * @param compact - Use smaller spacing for inline empty states
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {description && (
        <Text style={[styles.description, compact && styles.descriptionCompact]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, compact && styles.buttonCompact]}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    paddingVertical: Spacing.xl * 2,
  },
  containerCompact: {
    padding: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.md,
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  titleCompact: {
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  descriptionCompact: {
    fontSize: 13,
    maxWidth: 240,
  },
  button: {
    marginTop: Spacing.lg,
    backgroundColor: PsychiColors.azure,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  buttonCompact: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  buttonText: {
    color: PsychiColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EmptyState;
