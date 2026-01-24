/**
 * PremiumButton - Editorial-quality button with arrow affordance
 * Pill-shaped with subtle animations
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PsychiColors, Shadows, Spacing, Typography, Gradients, BorderRadius } from '@/constants/theme';
import { ArrowRightIcon, ChevronRightIcon } from '@/components/icons';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  showArrow?: boolean;
  arrowType?: 'arrow' | 'chevron';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function PremiumButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  showArrow = true,
  arrowType = 'arrow',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
}: PremiumButtonProps) {
  const sizeStyles = {
    sm: {
      paddingVertical: Spacing['2.5'],
      paddingHorizontal: Spacing['4'],
      fontSize: Typography.fontSize.sm,
      iconSize: 14,
    },
    md: {
      paddingVertical: 14,
      paddingHorizontal: Spacing['6'],
      fontSize: Typography.fontSize.base,
      iconSize: 16,
    },
    lg: {
      paddingVertical: Spacing['4'],
      paddingHorizontal: Spacing['8'],
      fontSize: Typography.fontSize.lg,
      iconSize: 18,
    },
  };

  const currentSize = sizeStyles[size];
  const ArrowComponent = arrowType === 'chevron' ? ChevronRightIcon : ArrowRightIcon;

  const renderContent = () => (
    <>
      {icon && <>{icon}</>}
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'accent' ? PsychiColors.white : PsychiColors.textPrimary}
          size="small"
        />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              { fontSize: currentSize.fontSize },
              variant === 'primary' && styles.textPrimary,
              variant === 'accent' && styles.textAccent,
              variant === 'secondary' && styles.textSecondary,
              variant === 'ghost' && styles.textGhost,
              variant === 'outline' && styles.textOutline,
              disabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {showArrow && !loading && (
            <ArrowComponent
              size={currentSize.iconSize}
              color={
                variant === 'primary' || variant === 'accent'
                  ? PsychiColors.white
                  : disabled
                  ? PsychiColors.textDisabled
                  : PsychiColors.textPrimary
              }
            />
          )}
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={disabled ? [PsychiColors.textDisabled, PsychiColors.textDisabled] : Gradients.primaryButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            styles.buttonPrimary,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            !disabled && Shadows.button,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'accent') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={disabled ? [PsychiColors.textDisabled, PsychiColors.textDisabled] : Gradients.accentButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            styles.buttonAccent,
            {
              paddingVertical: currentSize.paddingVertical,
              paddingHorizontal: currentSize.paddingHorizontal,
            },
            !disabled && Shadows.glow,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        variant === 'secondary' && styles.buttonSecondary,
        variant === 'ghost' && styles.buttonGhost,
        variant === 'outline' && styles.buttonOutline,
        {
          paddingVertical: currentSize.paddingVertical,
          paddingHorizontal: currentSize.paddingHorizontal,
        },
        disabled && styles.buttonDisabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

// Text link button for inline actions
interface TextButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
  style?: ViewStyle;
}

export function TextButton({
  title,
  onPress,
  color = PsychiColors.royalBlue,
  showArrow = false,
  style,
}: TextButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.textButton, style]}
    >
      <Text style={[styles.textButtonLabel, { color }]}>{title}</Text>
      {showArrow && <ArrowRightIcon size={14} color={color} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    gap: Spacing['2'],
  },
  buttonPrimary: {
    backgroundColor: PsychiColors.royalBlue,
  },
  buttonAccent: {
    backgroundColor: PsychiColors.coral,
  },
  buttonSecondary: {
    backgroundColor: PsychiColors.frost,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: PsychiColors.borderMedium,
  },
  buttonDisabled: {
    backgroundColor: PsychiColors.frost,
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textPrimary: {
    color: PsychiColors.white,
  },
  textAccent: {
    color: PsychiColors.white,
  },
  textSecondary: {
    color: PsychiColors.textPrimary,
  },
  textGhost: {
    color: PsychiColors.textPrimary,
  },
  textOutline: {
    color: PsychiColors.textPrimary,
  },
  textDisabled: {
    color: PsychiColors.textDisabled,
  },
  textButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['1'],
  },
  textButtonLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: '500',
  },
});
