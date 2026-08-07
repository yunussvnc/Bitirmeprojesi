/**
 * Place Card Component
 * 
 * Large place card for listings and recommendations.
 * Design matches the screenshot: full-bleed image, location badge bottom-right,
 * title + short description below, category chip bottom-right of content.
 */

import React from 'react';
import { getTranslatedCategory } from '@/src/utils/categories';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { mediumImpact, heavyImpact } from '@/src/utils/haptics';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { usePreviewStore } from '@/src/store/usePreviewStore';

export interface PlaceCardProps {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  tags?: string[];
  imagePlaceholder?: boolean;
  location?: string;
  explanation?: string;
  address?: string;
  city?: string;
  distance_m?: number;
  isRecommended?: boolean;
  hasMenu?: boolean;
  category?: string;
  onPress: () => void;
  testID?: string;
  placeId?: string | number;
}

const PlaceCardComponent = function PlaceCard({
  image,
  title,
  subtitle,
  tags,
  imagePlaceholder = false,
  location,
  explanation,
  address,
  city,
  distance_m,
  isRecommended = false,
  hasMenu = false,
  category,
  onPress,
  testID,
  placeId,
}: PlaceCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const setPreview = usePreviewStore(s => s.setPreview);
  const clearPreview = usePreviewStore(s => s.clearPreview);

  const handlePress = () => {
    mediumImpact();
    onPress();
  };

  const handleLongPress = () => {
    heavyImpact();
    setPreview({
      image, title, subtitle, tags, imagePlaceholder, location, explanation,
      address, city, distance_m, isRecommended, hasMenu, category, onPress, testID, placeId
    });
  };

  const handlePressOut = () => {
    clearPreview();
  };

  // Category to display: prefer explicit prop, fall back to first tag
  const categoryLabel = category
    ? getTranslatedCategory(category, t)
    : tags && tags.length > 0
    ? tags[0]
    : null;

  // Short description: use explanation (AI mode) or subtitle.
  // Guard: skip subtitle only when it clearly matches address/location text
  // or is so short it can only be a district name (≤ 12 chars).
  const isLocationLike = (s?: string): boolean => {
    if (!s) return false;
    const trimmed = s.trim();
    if (trimmed.length === 0) return true;
    // Same as explicit address or location badge
    if (address && trimmed.toLowerCase() === address.trim().toLowerCase()) return true;
    if (location && trimmed.toLowerCase() === location.trim().toLowerCase()) return true;
    
    // Explicit district names to prevent showing them as description
    const ISTANBUL_DISTRICTS = [
      "kadikoy", "kadıköy", "besiktas", "beşiktaş", "beyoglu", "beyoğlu",
      "sisli", "şişli", "fatih", "uskudar", "üsküdar", "bakirkoy", "bakırköy",
      "maltepe", "kartal", "pendik", "umraniye", "ümraniye", "sariyer", "sarıyer",
      "kagithane", "kağıthane", "eyup", "eyüp", "atasehir", "ataşehir",
      "karakoy", "karaköy", "taksim", "galata", "ortakoy", "ortaköy", "bebek",
      "etiler", "nisantasi", "nişantaşı", "cihangir", "balat", "fener", "moda",
      "kuzguncuk", "eminonu", "eminönü", "sultanahmet"
    ];
    if (ISTANBUL_DISTRICTS.includes(trimmed.toLowerCase())) return true;
    
    // Starts with a number followed by space and letter -> likely a street address
    if (/^\d+\s+[a-zA-ZğüşıöçĞÜŞİÖÇ]/.test(trimmed)) return true;
    return false;
  };
  const cleanSubtitle = isLocationLike(subtitle) ? undefined : subtitle;
  const description = explanation || cleanSubtitle;

  return (
    <TouchableOpacity
      testID={testID}
      style={[styles.card, { backgroundColor: colors.surface.elevated }]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      onPressOut={handlePressOut}
      delayLongPress={350}
      activeOpacity={0.9}
    >
      {/* ── Image section ── */}
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
            {placeId ? (
              <Animated.Image
                key={`anim-img-${placeId}`}
                source={image as any}
                style={styles.image}
                resizeMode="cover"
                // @ts-ignore: Reanimated v3 types might not include sharedTransitionTag on all components
                sharedTransitionTag={`place-image-${placeId}`}
              />
            ) : (
              <Image
                key={typeof image === 'object' && 'uri' in (image as any) ? (image as any).uri : 'static-img'}
                source={image as any}
                style={styles.image}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            )}
            {/* Bottom gradient so location badge is readable */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              locations={[0.5, 1]}
              style={styles.gradient}
            />
          </>
        )}

        {/* Location badge — bottom right of image */}
        {location && (
          <View style={styles.locationBadge}>
            <IconSymbol name="mappin.circle.fill" size={11} color="rgba(255,255,255,0.9)" />
            <Text style={styles.locationBadgeText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {/* AI recommended badge — top left */}
        {isRecommended && (
          <View style={[styles.aiBadge, { backgroundColor: colors.accent.primary }]}>
            <IconSymbol name="sparkles" size={10} color="#fff" />
            <Text style={styles.aiBadgeText}>{t('explore.recommended')}</Text>
          </View>
        )}
      </View>

      {/* ── Content section ── */}
      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
            {title}
          </Text>
          {distance_m != null && (
            <Text style={[styles.distance, { color: colors.text.tertiary }]}>
              {distance_m < 1000
                ? `${Math.round(distance_m)}m`
                : `${(distance_m / 1000).toFixed(1)}km`}
            </Text>
          )}
        </View>

        {/* Description — short, max 2 lines */}
        {description ? (
          <Text
            style={[styles.description, { color: colors.text.secondary }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        ) : null}

        {/* Bottom row: category chip right-aligned */}
        <View style={styles.bottomRow}>
          <View style={styles.leftBadges}>
            {hasMenu && (
              <View style={[styles.menuBadge]}>
                <IconSymbol name="list.bullet.clipboard.fill" size={10} color="#10b981" />
                <Text style={styles.menuBadgeText}>{t('explore.menu')}</Text>
              </View>
            )}
            {city ? (
              <View style={[styles.categoryChip, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, alignSelf: 'center' }]}>
                <Text style={[styles.categoryChipText, { color: colors.text.secondary }]}>
                  {city}
                </Text>
              </View>
            ) : null}
          </View>

          {categoryLabel ? (
            <View style={[styles.categoryChip, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
              <Text style={[styles.categoryChipText, { color: colors.text.secondary }]}>
                {categoryLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const PlaceCard = React.memo(PlaceCardComponent);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
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
    gap: 8,
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
    height: '50%',
  },
  // Location badge — bottom RIGHT of image (matching screenshot)
  locationBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 130,
  },
  aiBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  aiBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
    lineHeight: 22,
  },
  distance: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  leftBadges: {
    flexDirection: 'row',
    gap: 6,
    flex: 1,
  },
  menuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignSelf: 'flex-start',
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  // Category chip — bottom RIGHT of content (matching screenshot)
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
