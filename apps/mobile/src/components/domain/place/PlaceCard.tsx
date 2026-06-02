/**
 * Place Card Component
 * 
 * Large place card for listings and recommendations.
 * Spotify-inspired design with image, title, subtitle, and tags.
 * 
 * @module components/place/PlaceCard
 */

import React from 'react';
import { getTranslatedCategory } from '@/src/utils/categories';
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
import { useTheme } from '@/src/hooks/useTheme';
import { Chip } from '@/src/components/ui/Chip';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { createTextStyle, spacing as designSpacing, radius, PLACE_CARD_ASPECT, PLACE_CARD_IMAGE_MAX_HEIGHT } from '@/src/constants/design';
import { mediumImpact } from '@/src/utils/haptics';
import { useTranslation } from 'react-i18next';
import { getPlaceStatusLocalized } from '@/src/utils/placeCardHelpers';

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
  hasMenu?: boolean;
  menuComingSoon?: boolean;
  openingTime?: string;
  closingTime?: string;
  rating?: number;
  reviewCount?: number;
  priceLabel?: string;
  category?: string;
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
  hasMenu = false,
  menuComingSoon = false,
  openingTime,
  closingTime,
  rating,
  reviewCount,
  priceLabel,
  category,
  onPress,
  testID,
}: PlaceCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const subtitleColor = colors.text.primary + 'CC';
  const hoursStatus = getPlaceStatusLocalized(openingTime, closingTime, t);
  const showHours = !!(openingTime && closingTime);
  const translatedCategory = category ? getTranslatedCategory(category, t) : undefined;
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
                {t('explore.no_image')}
              </Text>
            </View>
          ) : (
            <>
              <Image source={image as any} style={[styles.image, { backgroundColor: colors.surface.elevated }]} contentFit="contain" cachePolicy="memory-disk" />
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
          {rating != null && rating > 0 ? (
            <View style={styles.ratingBadge}>
              <IconSymbol name="star.fill" size={11} color="#FBBF24" />
              <Text style={styles.ratingBadgeText}>{rating.toFixed(1)}</Text>
              {reviewCount != null && reviewCount > 0 ? (
                <Text style={styles.ratingCountText}>({reviewCount})</Text>
              ) : null}
            </View>
          ) : null}
        </View>
        <View style={[styles.content, {
          backgroundColor: colors.background.secondary,
        }]}>
          {isRecommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: colors.accent.primary + '18' }]}>
              <IconSymbol name="sparkles" size={11} color={colors.accent.primary} />
              <Text style={[styles.recommendedText, { color: colors.accent.primary }]}>{t('explore.recommended')}</Text>
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
          <View style={styles.metaRow}>
            {showHours ? (
              <View style={styles.hoursRow}>
                <View style={[styles.statusDot, { backgroundColor: hoursStatus.color }]} />
                <Text style={[styles.hoursText, { color: colors.text.secondary }]} numberOfLines={1}>
                  {hoursStatus.hoursText}
                </Text>
              </View>
            ) : (
              <Text style={[styles.hoursFallback, { color: colors.text.tertiary }]} numberOfLines={1}>
                {t('place_detail.hours_unavailable')}
              </Text>
            )}
            {priceLabel ? (
              <Text style={[styles.priceText, { color: colors.text.secondary }]}>{priceLabel}</Text>
            ) : null}
          </View>
          <View style={styles.tags}>
            {hasMenu ? (
              <View style={styles.menuBadge}>
                <IconSymbol name="list.bullet.clipboard.fill" size={10} color="#10b981" />
                <Text style={styles.menuBadgeText}>{t('explore.menu')}</Text>
              </View>
            ) : menuComingSoon ? (
              <View style={[styles.menuBadge, styles.menuComingSoonBadge]}>
                <IconSymbol name="clock.fill" size={10} color={colors.text.tertiary} />
                <Text style={[styles.menuComingSoonText, { color: colors.text.tertiary }]}>
                  {t('explore.menu_coming_soon')}
                </Text>
              </View>
            ) : null}
            {translatedCategory ? (
              <Chip label={translatedCategory} size="small" />
            ) : null}
            {tags?.slice(0, 2).map((tag, index) => (
              <Chip key={index} label={tag} size="small" />
            ))}
          </View>
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
  ratingBadge: {
    position: 'absolute',
    top: designSpacing.sm,
    right: designSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ratingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  ratingCountText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  hoursFallback: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  menuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  menuComingSoonBadge: {
    backgroundColor: 'rgba(158, 158, 158, 0.12)',
    borderColor: 'rgba(158, 158, 158, 0.2)',
  },
  menuComingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
