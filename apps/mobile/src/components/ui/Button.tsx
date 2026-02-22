/**
 * Button Component
 * 
 * Professional, reusable button component with multiple variants.
 * Follows design system principles with proper TypeScript types.
 * 
 * @module components/ui/Button
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';
import { radius } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'text';

/**
 * Button size types
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button component props
 */
export interface ButtonProps {
  /**
   * Button content (text or custom element)
   */
  children: React.ReactNode;
  
  /**
   * Press handler
   */
  onPress: () => void;
  
  /**
   * Button variant
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * Button size
   * @default 'medium'
   */
  size?: ButtonSize;
  
  /**
   * Show loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Disable button
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
  
  /**
   * Custom text style
   */
  textStyle?: TextStyle;
  
  /**
   * Accessibility label
   */
  accessibilityLabel?: string;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Button Component
 * 
 * Professional button with three variants:
 * - Primary: Accent color background, for main actions
 * - Secondary: Subtle background with border, for secondary actions
 * - Text: No background, for subtle actions
 * 
 * @example
 * ```tsx
 * <Button onPress={handlePress} variant="primary">
 *   Get Started
 * </Button>
 * 
 * <Button onPress={handleCancel} variant="secondary">
 *   Cancel
 * </Button>
 * 
 * <Button onPress={handleLink} variant="text">
 *   Learn More
 * </Button>
 * ```
 */
export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (!isDisabled) {
      lightImpact();
      onPress?.();
    }
  };

  // Primary button with gradient
  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          styles[size],
          style,
          isDisabled && styles.disabled,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        testID={testID}
      >
        <LinearGradient
          colors={
            isDisabled
              ? [colors.surface.default, colors.surface.default]
              : [colors.accent.primary, colors.accent.primaryHover]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            {
              paddingHorizontal:
                size === 'small' ? 16 : size === 'large' ? 32 : 24,
              paddingVertical: size === 'small' ? 8 : size === 'large' ? 20 : 16,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.text.inverse} size="small" />
          ) : (
            <Text
              style={[
                styles.text,
                styles.primaryText,
                { color: colors.text.inverse },
                textStyle,
              ]}
            >
              {children}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Secondary button
  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          styles.secondary,
          styles[size],
          {
            backgroundColor: colors.surface.default,
            borderColor: colors.surface.border,
          },
          style,
          isDisabled && styles.disabled,
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.primary} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              styles.secondaryText,
              { color: colors.text.primary },
              textStyle,
            ]}
          >
            {children}
          </Text>
        )}
      </TouchableOpacity>
    );
  }

  // Text button
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.6}
      style={[styles.textButton, style, isDisabled && styles.disabled]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      testID={testID}
    >
      <Text
        style={[
          styles.text,
          styles.textButtonText,
          { color: colors.accent.primary },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  small: {
    minHeight: 44,
  },
  medium: {
    minHeight: 48,
  },
  large: {
    minHeight: 56,
  },
  gradient: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: {
    borderWidth: 1,
  },
  textButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 44, // Touch target
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  primaryText: {
    // Color applied dynamically
  },
  secondaryText: {
    // Color applied dynamically
  },
  textButtonText: {
    // Color applied dynamically
  },
  disabled: {
    opacity: 0.5,
  },
});

/**
 * Primary Button - Convenience export
 * 
 * @example
 * ```tsx
 * <PrimaryButton onPress={handlePress}>Get Started</PrimaryButton>
 * ```
 */
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="primary" />;
}

/**
 * Secondary Button - Convenience export
 * 
 * @example
 * ```tsx
 * <SecondaryButton onPress={handleCancel}>Cancel</SecondaryButton>
 * ```
 */
export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="secondary" />;
}

/**
 * Text Button - Convenience export
 * 
 * @example
 * ```tsx
 * <TextButton onPress={handleLink}>Learn More</TextButton>
 * ```
 */
export function TextButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button {...props} variant="text" />;
}
