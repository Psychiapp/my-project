/**
 * PremiumInput Component
 * Elegant, minimal input fields with refined styling
 * Subtle borders, clean typography, gentle focus states
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import {
  PsychiColors,
  BorderRadius,
  Spacing,
  Typography,
  Shadows,
} from '@/constants/theme';
import { EyeIcon, EyeOffIcon } from '@/components/icons';

interface PremiumInputProps extends TextInputProps {
  label?: string;
  variant?: 'default' | 'filled' | 'outlined';
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
}

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  variant = 'default',
  error,
  hint,
  containerStyle,
  showPasswordToggle = false,
  secureTextEntry,
  value,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  const hasValue = value && value.length > 0;

  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: isFocused || hasValue ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [isFocused, hasValue, labelAnimation]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  // Label animation values
  const labelTop = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [14, -8],
  });

  const labelFontSize = labelAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [Typography.fontSize.base, Typography.fontSize.xs],
  });

  // Dynamic colors based on state
  const getLabelColor = () => {
    if (error) return PsychiColors.error;
    if (isFocused) return PsychiColors.royalBlue;
    return PsychiColors.textMuted;
  };

  const getBorderColor = () => {
    if (error) return PsychiColors.error;
    if (isFocused) return PsychiColors.royalBlue;
    return PsychiColors.borderLight;
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'filled':
        return isFocused ? PsychiColors.cloud : PsychiColors.frost;
      case 'outlined':
        return 'transparent';
      default:
        return PsychiColors.cloud;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Floating label */}
      {label && (
        <Animated.Text
          style={[
            styles.label,
            {
              top: labelTop,
              fontSize: labelFontSize,
              color: getLabelColor(),
              backgroundColor: (isFocused || hasValue) ? PsychiColors.cloud : 'transparent',
            },
          ]}
        >
          {label}
        </Animated.Text>
      )}

      {/* Input container */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: variant === 'outlined' || isFocused || error ? 1 : 1,
          },
          isFocused && styles.inputContainerFocused,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            showPasswordToggle && styles.inputWithIcon,
          ]}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={PsychiColors.textSoft}
          selectionColor={PsychiColors.royalBlue}
          secureTextEntry={showPasswordToggle ? !isPasswordVisible : secureTextEntry}
          accessibilityLabel={label}
          accessibilityHint={hint}
          {...props}
        />

        {/* Password toggle */}
        {showPasswordToggle && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isPasswordVisible ? 'Hide password' : 'Show password'}
            accessibilityHint="Toggles password visibility"
          >
            {isPasswordVisible ? (
              <EyeOffIcon size={20} color={PsychiColors.textMuted} />
            ) : (
              <EyeIcon size={20} color={PsychiColors.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Helper text / Error */}
      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

// Simple inline input (no floating label)
interface SimpleInputProps extends TextInputProps {
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabelText?: string;
}

export const SimpleInput: React.FC<SimpleInputProps> = ({
  error,
  hint,
  containerStyle,
  leftIcon,
  rightIcon,
  accessibilityLabelText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.simpleContainer, containerStyle]}>
      <View
        style={[
          styles.simpleInputContainer,
          isFocused && styles.simpleInputFocused,
          error && styles.simpleInputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.simpleInput,
            leftIcon ? styles.simpleInputWithLeftIcon : undefined,
            rightIcon ? styles.simpleInputWithRightIcon : undefined,
          ]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={PsychiColors.textSoft}
          selectionColor={PsychiColors.royalBlue}
          accessibilityLabel={accessibilityLabelText || props.placeholder}
          accessibilityHint={hint}
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

// Inline labeled input (label on the left)
interface InlineInputProps extends TextInputProps {
  label: string;
  containerStyle?: ViewStyle;
  accessibilityHintText?: string;
}

export const InlineInput: React.FC<InlineInputProps> = ({
  label,
  containerStyle,
  accessibilityHintText,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.inlineContainer,
        isFocused && styles.inlineContainerFocused,
        containerStyle,
      ]}
    >
      <Text style={styles.inlineLabel}>{label}</Text>
      <TextInput
        style={styles.inlineInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholderTextColor={PsychiColors.textSoft}
        selectionColor={PsychiColors.royalBlue}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHintText}
        {...props}
      />
    </View>
  );
};

// Textarea for multiline input
interface TextareaProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  minHeight?: number;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  hint,
  containerStyle,
  minHeight = 100,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[styles.textareaLabel, error && { color: PsychiColors.error }]}
          accessibilityRole="text"
        >
          {label}
        </Text>
      )}

      <View
        style={[
          styles.textareaContainer,
          { minHeight },
          isFocused && styles.textareaFocused,
          error && styles.textareaError,
        ]}
      >
        <TextInput
          style={[styles.textarea, { minHeight: minHeight - 24 }]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={PsychiColors.textSoft}
          selectionColor={PsychiColors.royalBlue}
          multiline
          textAlignVertical="top"
          accessibilityLabel={label}
          accessibilityHint={hint}
          {...props}
        />
      </View>

      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Main container styles
  container: {
    marginBottom: Spacing['4'],
  },

  // Floating label styles
  label: {
    position: 'absolute',
    left: Spacing['4'],
    zIndex: 1,
    paddingHorizontal: Spacing['1'],
    fontWeight: Typography.fontWeight.medium,
    letterSpacing: Typography.letterSpacing.wide,
  },

  // Input container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  inputContainerFocused: {
    ...Shadows.soft,
  },

  // Input field
  input: {
    flex: 1,
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['4'],
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    fontWeight: Typography.fontWeight.normal,
  },
  inputWithIcon: {
    paddingRight: Spacing['12'],
  },

  // Password toggle
  passwordToggle: {
    position: 'absolute',
    right: Spacing['4'],
    padding: Spacing['2'],
  },

  // Helper text
  helperText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    marginTop: Spacing['1.5'],
    marginLeft: Spacing['1'],
  },
  errorText: {
    color: PsychiColors.error,
  },

  // Simple input styles
  simpleContainer: {
    marginBottom: Spacing['4'],
  },
  simpleInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PsychiColors.frost,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
  },
  simpleInputFocused: {
    borderColor: PsychiColors.royalBlue,
    backgroundColor: PsychiColors.cloud,
    ...Shadows.sm,
  },
  simpleInputError: {
    borderColor: PsychiColors.error,
  },
  simpleInput: {
    flex: 1,
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  simpleInputWithLeftIcon: {
    paddingLeft: Spacing['2'],
  },
  simpleInputWithRightIcon: {
    paddingRight: Spacing['2'],
  },
  leftIcon: {
    paddingLeft: Spacing['4'],
  },
  rightIcon: {
    paddingRight: Spacing['4'],
  },

  // Inline input styles
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.borderLight,
    paddingVertical: Spacing['3'],
    marginBottom: Spacing['3'],
  },
  inlineContainerFocused: {
    borderBottomColor: PsychiColors.royalBlue,
  },
  inlineLabel: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    width: 100,
    letterSpacing: Typography.letterSpacing.wide,
  },
  inlineInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    paddingVertical: Spacing['1'],
  },

  // Textarea styles
  textareaLabel: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing['2'],
    letterSpacing: Typography.letterSpacing.wide,
  },
  textareaContainer: {
    backgroundColor: PsychiColors.frost,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
    padding: Spacing['3'],
  },
  textareaFocused: {
    borderColor: PsychiColors.royalBlue,
    backgroundColor: PsychiColors.cloud,
    ...Shadows.sm,
  },
  textareaError: {
    borderColor: PsychiColors.error,
  },
  textarea: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
  },
});

export default PremiumInput;
