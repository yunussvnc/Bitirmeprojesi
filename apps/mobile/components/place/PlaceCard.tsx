/**
 * Place Card Component
 * 
 * Large place card for listings and recommendations.
 * Spotify-inspired design with image, title, subtitle, and tags.
 * 
 * @module components/place/PlaceCard
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Image,
  ImageSourcePropType,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Chip } from '@/components/ui';
import { createTextStyle } from '@/constants/design';
import { shadows } from '@/constants/design';
import { mediumImpact } from '@/src/utils/haptics';

export interface PlaceCardProps {
  /**
   * Place image source
   */
  image: ImageSourcePropType;
  
  /**
   * Place name
   */
  title: string;
  
  /**
   * Place subtitle/description
   */
  subtitle?: string;
  
  /**
   * Place tags/categories
   */
  tags?: string[];
  
  /**
   * Rank number (for recommendations)
   */
  rank?: number;
  
  /**
   * Press handler
   */
  onPress: () => void;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Place Card Component
 * 
 * Large card component for displaying places.
 * Features image with gradient overlay, title, subtitle, and tags.
 * 
 * @example
 * ```tsx
 * <PlaceCard
 *   image={require('@/assets/places/place-1.jpg')}
 *   title="Café Luna"
 *   subtitle="Sessiz, çalışmalık"
 *   tags={['quiet', 'work', 'cafe']}
 *   rank={1}
 *   onPress={() => navigateToPlace(placeId)}
 * />
 * ```
 */
export function PlaceCard({
  image,
  title,
  subtitle,
  tags,
  rank,
  onPress,
  testID,
}: PlaceCardProps) {
  const { colors, spacing } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();
  };

  const handlePress = () => {
    mediumImpact();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={[styles.card, shadows.small]}
        testID={testID}
      >
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradient}
        />
        {rank !== undefined && (
          <View
            style={[
              styles.rankBadge,
              {
                backgroundColor: colors.surface.default,
                borderColor: colors.surface.border,
              },
            ]}
          >
            <Text style={[styles.rankText, { color: colors.text.primary }]}>
              #{rank}
            </Text>
          </View>
        )}
      </View>
      <View style={[styles.content, { padding: spacing.cardPadding }]}>
        <Text style={[titleStyle, styles.title]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[subtitleStyle, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {tags && tags.length > 0 && (
          <View style={styles.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} label={tag} />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    backgroundColor: 'transparent',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
});
