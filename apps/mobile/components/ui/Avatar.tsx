/**
 * Avatar Component
 * 
 * Displays user profile pictures with fallback to initials.
 * 
 * Usage:
 * ```tsx
 * <Avatar source={{ uri: 'https://...' }} size={64} />
 * <Avatar name="John Doe" size={64} />
 * ```
 */

import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle, TextStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export interface AvatarProps {
  /**
   * Image source (URI or require)
   */
  source?: { uri: string } | number;
  
  /**
   * User's full name (for initials fallback)
   */
  name?: string;
  
  /**
   * Avatar size in pixels
   * @default 48
   */
  size?: number;
  
  /**
   * Custom style
   */
  style?: ViewStyle;
}

/**
 * Avatar component with image or initials fallback
 */
export function Avatar({ source, name, size = 48, style }: AvatarProps) {
  const { colors } = useTheme();
  
  const getInitials = (fullName?: string): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const avatarStyle = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.surface.elevated,
    },
    style,
  ];

  const textStyle = [
    styles.initials,
    {
      fontSize: size * 0.4,
      color: colors.text.primary,
    },
  ];

  return (
    <View style={avatarStyle}>
      {source ? (
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
            },
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text style={textStyle}>{getInitials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontWeight: '600',
  },
});
