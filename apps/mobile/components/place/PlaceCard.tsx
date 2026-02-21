/**
 * Place Card Component
 * 
 * Large place card for listings and recommendations.
 * Spotify-inspired design with image, title, subtitle, and tags.
 * 
 * @module components/place/PlaceCard
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  type TextStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Chip } from '@/components/ui/Chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createTextStyle, spacing as designSpacing, radius, PLACE_CARD_ASPECT, PLACE_CARD_IMAGE_MAX_HEIGHT } from '@/constants/design';
import { mediumImpact } from '@/src/utils/haptics';

export interface PlaceCardProps {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  tags?: string[];
  imagePlaceholder?: boolean;
  location?: string;
  explanation?: string;
  distance_m?: number;
  isRecommended?: boolean;
  onPress: () => void;
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
  imagePlaceholder = false,
  location,
  explanation,
  distance_m,
  isRecommended = false,
  onPress,
  testID,
}: PlaceCardProps) {
  const { colors, isDark } = useTheme();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const subtitleColor = colors.text.primary + 'CC'; // %80 opacity
  const handlePress = () => {
    mediumImpact();
    onPress();
  };

  // 3D depth colors derived from theme
  const depthEdgeColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.12)';
  const depthHighlightColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)';

  return (
    <View style={styles.animatedWrapper}>
      {/* 3D depth layer — sits behind the card to simulate thickness */}
      <View style={[styles.depthLayer]} />
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.95}
        style={[styles.card]}
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
            <Image source={image as any} style={styles.image} contentFit="cover" cachePolicy="memory-disk" />
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
        {isRecommended && (
          <View style={[styles.recommendedBadge, { backgroundColor: colors.accent.primary + '18' }]}>
            <IconSymbol name="sparkles" size={11} color={colors.accent.primary} />
            <Text style={[styles.recommendedText, { color: colors.accent.primary }]}>Senin için önerildi</Text>
          </View>
        )}
        <View style={styles.titleRow}>
          <Text style={[titleStyle as TextStyle, styles.title]} numberOfLines={2}>
            {title}
          </Text>
          {distance_m != null && (
            <Text style={[styles.distanceText, { color: colors.text.tertiary }]}>
              {distance_m < 1000 ? `${distance_m}m` : `${(distance_m / 1000).toFixed(1)}km`}
            </Text>
          )}
        </View>
        {explanation && (
          <Text style={[styles.explanation, { color: colors.text.secondary }]} numberOfLines={3}>
            {explanation}
          </Text>
        )}
        {!explanation && subtitle && (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
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
    </View>
  );
};

export const PlaceCard = React.memo(PlaceCardComponent);

const styles = StyleSheet.create({
  animatedWrapper: {
    // 3D multi-layer shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  depthLayer: {
    // Fake 3D thickness layer behind the card
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: -4,
    height: 8,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    // Subtle border for 3D edge
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topHighlight: {
    // Top edge light reflection for 3D feel
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    zIndex: 10,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  bottomEdge: {
    // Bottom dark edge for 3D thickness illusion
    height: 3,
    marginTop: -1,
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
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanation: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
    fontStyle: 'italic',
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
    justifyContent: 'flex-end',
  },
});
