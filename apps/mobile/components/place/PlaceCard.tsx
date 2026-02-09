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
  type TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Chip } from '@/components/ui';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createTextStyle, shadows, spacing as designSpacing, radius, PLACE_CARD_ASPECT, PLACE_CARD_IMAGE_MAX_HEIGHT } from '@/constants/design';
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
   * true ise görsel yerine "Görsel eklenmedi" placeholder gösterilir (API'de photo_url yok).
   */
  imagePlaceholder?: boolean;
  
  /**
   * Konum adı (görsel üzerinde badge olarak gösterilir, örn. "Beşiktaş").
   */
  location?: string;
  
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
const PlaceCardComponent = function PlaceCard({
  image,
  title,
  subtitle,
  tags,
  rank,
  imagePlaceholder = false,
  location,
  onPress,
  testID,
}: PlaceCardProps) {
  const { colors, spacing } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lastPressTime = useRef(0);
  const PRESS_THROTTLE_MS = 600;

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
    const now = Date.now();
    if (now - lastPressTime.current < PRESS_THROTTLE_MS) return;
    lastPressTime.current = now;
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
        {imagePlaceholder ? (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface.elevated }]}>
            <IconSymbol name="mappin.and.ellipse" size={32} color={colors.text.tertiary} />
            <Text style={[styles.placeholderLabel, { color: colors.text.tertiary }]} numberOfLines={1}>
              Görsel eklenmedi
            </Text>
          </View>
        ) : (
          <>
            <Image source={image} style={styles.image} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)']}
              locations={[0.2, 0.55, 1]}
              style={styles.gradient}
            />
          </>
        )}
        {location ? (
          <View
            style={[
              styles.locationBadge,
              {
                backgroundColor: 'rgba(0,0,0,0.4)',
              },
            ]}
          >
            <IconSymbol name="mappin.circle.fill" size={11} color="rgba(255,255,255,0.95)" />
            <Text style={styles.locationBadgeText} numberOfLines={1}>{location}</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.content, { 
        backgroundColor: colors.background.secondary,
      }]}>
        <Text style={[titleStyle as TextStyle, styles.title]} numberOfLines={2}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[subtitleStyle as TextStyle, styles.subtitle]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {tags && tags.length > 0 && (
          <View style={styles.tags}>
            {tags.slice(0, 3).map((tag, index) => (
              <Chip key={index} label={tag} size="small" />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
    </Animated.View>
  );
};

export const PlaceCard = React.memo(PlaceCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: PLACE_CARD_ASPECT,
    maxHeight: PLACE_CARD_IMAGE_MAX_HEIGHT,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: designSpacing.sm,
  },
  placeholderLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  locationBadge: {
    position: 'absolute',
    bottom: designSpacing.sm,
    left: designSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 120,
  },
  content: {
    paddingVertical: designSpacing.base,
    paddingHorizontal: designSpacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
});
