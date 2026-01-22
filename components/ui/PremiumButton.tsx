/**
 * PremiumButton Component
 * Elegant, minimal buttons with refined styling
 * Tactile but subtle design
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  PsychiColors,
  BorderRadius,
  Spacing,
  Typography,
  Shadows,
} from '@/constants/theme';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Size configurations
const sizeConfig = {
  sm: {
    paddingVertical: Spacing['2'],
    paddingHorizontal: Spacing['4'],
    fontSize: Typography.fontSize.sm,
    iconSpacing: Spacing['1.5'],
  },
  md: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['5'],
    fontSize: Typography.fontSize.base,
    iconSpacing: Spacing['2'],
  },
  lg: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['6'],
    fontSize: Typography.fontSize.lg,
    iconSpacing: Spacing['2.5'],
  },
};

// Variant configurations
const variantConfig = {
  primary: {
    backgroundColor: PsychiColors.royalBlue,
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: PsychiColors.white,
    fontWeight: Typography.fontWeight.medium,
    shadow: Shadows.button,
    loadingColor: PsychiColors.white,
  },
  secondary: {
    backgroundColor: PsychiColors.frost,
    borderColor: PsychiColors.borderLight,
    borderWidth: 1,
    textColor: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    shadow: Shadows.sm,
    loadingColor: PsychiColors.textPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: PsychiColors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
    shadow: Shadows.none,
    loadingColor: PsychiColors.textSecondary,
  },
  accent: {
    backgroundColor: PsychiColors.coral,
    borderColor: 'transparent',
    borderWidth: 0,
    textColor: PsychiColors.white,
    fontWeight: Typography.fontWeight.medium,
    shadow: Shadows.glow,
    loadingColor: PsychiColors.white,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: PsychiColors.borderMedium,
    borderWidth: 1,
    textColor: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.medium,
    shadow: Shadows.none,
    loadingColor: PsychiColors.textPrimary,
  },
};

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const sizeStyles = sizeConfig[size];
  const variantStyles = variantConfig[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          borderWidth: variantStyles.borderWidth,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
        variantStyles.shadow,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.loadingColor}
          size="small"
        />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={{ marginRight: sizeStyles.iconSpacing }}>{icon}</View>
          )}
          <Text
            style={[
              styles.text,
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
                fontWeight: variantStyles.fontWeight,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <View style={{ marginLeft: sizeStyles.iconSpacing }}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Circular icon button
interface CircularButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  size?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const CircularButton: React.FC<CircularButtonProps> = ({
  onPress,
  icon,
  size = 48,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}) => {
  const variantStyles = {
    primary: {
      backgroundColor: PsychiColors.royalBlue,
      shadow: Shadows.button,
    },
    secondary: {
      backgroundColor: PsychiColors.frost,
      shadow: Shadows.sm,
    },
    ghost: {
      backgroundColor: 'transparent',
      shadow: Shadows.none,
    },
  };

  const config = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.circularContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: config.backgroundColor,
        },
        config.shadow,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? PsychiColors.white : PsychiColors.textPrimary}
          size="small"
        />
      ) : (
        icon
      )}
    </TouchableOpacity>
  );
};

// Text link button
interface TextButtonProps {
  title: string;
  onPress: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  underline?: boolean;
  disabled?: boolean;
  style?: TextStyle;
}

export const TextButton: React.FC<TextButtonProps> = ({
  title,
  onPress,
  color = PsychiColors.royalBlue,
  size = 'md',
  underline = false,
  disabled = false,
  style,
}) => {
  const fontSizeMap = {
    sm: Typography.fontSize.sm,
    md: Typography.fontSize.base,
    lg: Typography.fontSize.lg,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Text
        style={[
          {
            color: disabled ? PsychiColors.textDisabled : color,
            fontSize: fontSizeMap[size],
            fontWeight: Typography.fontWeight.medium,
            textDecorationLine: underline ? 'underline' : 'none',
            letterSpacing: Typography.letterSpacing.wide,
          },
          style,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Icon button (no text, minimal padding)
interface IconButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'tinted';
  disabled?: boolean;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  onPress,
  icon,
  size = 'md',
  variant = 'default',
  disabled = false,
  style,
}) => {
  const sizeMap = {
    sm: { padding: Spacing['1.5'], hitSlop: 8 },
    md: { padding: Spacing['2'], hitSlop: 6 },
    lg: { padding: Spacing['3'], hitSlop: 4 },
  };

  const variantMap = {
    default: {
      backgroundColor: 'transparent',
    },
    filled: {
      backgroundColor: PsychiColors.frost,
    },
    tinted: {
      backgroundColor: `${PsychiColors.royalBlue}15`,
    },
  };

  const sizeStyles = sizeMap[size];
  const variantStyles = variantMap[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      hitSlop={{
        top: sizeStyles.hitSlop,
        bottom: sizeStyles.hitSlop,
        left: sizeStyles.hitSlop,
        right: sizeStyles.hitSlop,
      }}
      style={[
        {
          padding: sizeStyles.padding,
          borderRadius: BorderRadius.md,
          backgroundColor: variantStyles.backgroundColor,
        },
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
  },
  circularContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default PremiumButton;
