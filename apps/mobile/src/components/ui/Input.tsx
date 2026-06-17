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
import { IconSymbol, type IconSymbolName } from './icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';

/**
 * Input variant types
 */
export type InputVariant = 'default' | 'search' | 'onDark';

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
  leftIcon?: IconSymbolName;
  
  /**
   * Right icon name
   */
  rightIcon?: IconSymbolName;
  
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
  const isOnDark = variant === 'onDark';

  const labelColor = isOnDark ? 'rgba(255,255,255,0.92)' : colors.text.secondary;
  const inputBg = isOnDark ? 'rgba(255,255,255,0.12)' : colors.surface.default;
  const inputBorder = error ? colors.semantic.error : (isOnDark ? 'rgba(255,255,255,0.22)' : colors.surface.border);
  const inputColor = isOnDark ? '#ffffff' : colors.text.primary;
  const placeholderColor = isOnDark ? 'rgba(255,255,255,0.6)' : colors.text.secondary;
  const iconColor = isOnDark ? 'rgba(255,255,255,0.7)' : colors.text.secondary;

  return (
    <View style={[styles.container, containerStyle]} testID={testID}>
      {label && !isSearch && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              styles.label,
              {
                color: labelColor,
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
            backgroundColor: inputBg,
            borderColor: inputBorder,
            paddingHorizontal: spacing.base,
            paddingVertical: isSearch ? spacing.sm : spacing.base,
          },
          isSearch && styles.searchContainer,
        ]}
      >
        {leftIcon && (
          <IconSymbol
            name={leftIcon}
            size={20}
            color={iconColor}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: inputColor,
              fontSize: typography.scale.body.fontSize,
              flex: 1,
            },
            inputStyle,
          ]}
          placeholderTextColor={placeholderColor}
          {...textInputProps}
        />


        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIcon}
            accessibilityRole="button"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <IconSymbol
              name={rightIcon}
              size={22}
              color={iconColor}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text
          style={[
            styles.error,
            {
              color: isOnDark ? '#ff8a80' : colors.semantic.error,
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
  input: {
    flex: 1,
    paddingVertical: 0,
  },
  leftIcon: {
    marginRight: 10,
  },
  rightIcon: {
    marginLeft: 10,
    padding: 8,
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
