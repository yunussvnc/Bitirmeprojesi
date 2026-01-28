/**
 * Input Component
 * 
 * Professional text input component with search variant.
 * Follows design system principles with proper styling.
 * 
 * @module components/ui/Input
 */

import React from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { IconSymbol } from './icon-symbol';
import { useTheme } from '@/hooks/useTheme';

/**
 * Input variant types
 */
export type InputVariant = 'default' | 'search';

/**
 * Input component props
 */
export interface InputProps extends Omit<TextInputProps, 'style'> {
  /**
   * Input variant
   * @default 'default'
   */
  variant?: InputVariant;
  
  /**
   * Label text (shown above input)
   */
  label?: string;
  
  /**
   * Error message (shown below input)
   */
  error?: string;
  
  /**
   * Left icon name (for search variant)
   */
  leftIcon?: string;
  
  /**
   * Right icon name
   */
  rightIcon?: string;
  
  /**
   * Right icon press handler
   */
  onRightIconPress?: () => void;
  
  /**
   * Container style
   */
  containerStyle?: ViewStyle;
  
  /**
   * Input style
   */
  inputStyle?: TextStyle;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Input Component
 * 
 * Professional input component with two variants:
 * - Default: Standard text input with optional label
 * - Search: Search input with icon
 * 
 * @example
 * ```tsx
 * // Default input
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 * 
 * // Search input
 * <Input
 *   variant="search"
 *   placeholder="Search places..."
 *   value={query}
 *   onChangeText={setQuery}
 * />
 * ```
 */
export function Input({
  variant = 'default',
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  testID,
  ...textInputProps
}: InputProps) {
  const { colors, spacing, typography } = useTheme();

  const isSearch = variant === 'search';

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && !isSearch && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text.secondary,
                fontSize: typography.scale.caption.fontSize,
              },
            ]}
          >
            {label.toUpperCase()}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface.default,
            borderColor: error ? colors.semantic.error : colors.surface.border,
            paddingHorizontal: spacing.base,
            paddingVertical: isSearch ? spacing.md : spacing.base,
          },
          isSearch && styles.searchContainer,
        ]}
      >
        {leftIcon && (
          <IconSymbol
            name={leftIcon}
            size={20}
            color={colors.text.tertiary}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: colors.text.primary,
              fontSize: typography.scale.body.fontSize,
              flex: 1,
            },
            inputStyle,
          ]}
          placeholderTextColor={colors.text.tertiary}
          {...textInputProps}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            accessibilityRole="button"
          >
            <IconSymbol
              name={rightIcon}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.error,
            {
              color: colors.semantic.error,
              fontSize: typography.scale.caption.fontSize,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  searchContainer: {
    // Search-specific styling
  },
  input: {
    // Styling applied dynamically
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
    padding: 4,
  },
  error: {
    marginTop: 4,
  },
});

/**
 * SearchInput - Convenience export
 * 
 * @example
 * ```tsx
 * <SearchInput
 *   placeholder="Search places..."
 *   value={query}
 *   onChangeText={setQuery}
 * />
 * ```
 */
export function SearchInput(props: Omit<InputProps, 'variant' | 'leftIcon'>) {
  return <Input {...props} variant="search" leftIcon="magnifyingglass" />;
}
