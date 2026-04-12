/**
 * Enhanced Review Item Component - Google Reviews Style
 * 
 * Displays a comprehensive review with:
 * - User info and verification badge
 * - Multiple photos/videos
 * - Detailed ratings breakdown
 * - Visit information
 * - Spending and wait time
 * - Helpful button
 * - Owner response
 * 
 * @module components/ui/EnhancedReviewItem
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { RatingStars } from '@/src/components/ui/RatingStars';
import { createTextStyle, spacing } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';
import { useTranslation } from "react-i18next";

export interface EnhancedReviewItemProps {
  // Temel bilgiler
  userId: number;
  userName?: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  
  // Detaylı puanlar
  foodRating?: number;
  serviceRating?: number;
  atmosphereRating?: number;
  valueRating?: number;
  cleanlinessRating?: number;
  
  // Ziyaret bilgileri
  visitType?: string;
  visitDate?: string;
  spentAmount?: number;
  spentCurrency?: string;
  waitTimeMinutes?: number;
  orderedItems?: string;
  
  // Medya
  photos?: string[];
  videos?: string[];
  
  // Etkileşim
  helpfulCount?: number;
  onHelpfulPress?: () => void;
  isHelpful?: boolean;
  
  // İşletme yanıtı
  ownerResponse?: string;
  ownerResponseAt?: string;
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  solo: 'solo',
  friends: 'friends',
  family: 'family',
  business: 'business',
  couple: 'couple',
};

const RATING_LABELS: Record<string, string> = {
  food: 'food',
  service: 'service',
  atmosphere: 'atmosphere',
  value: 'value',
  cleanliness: 'cleanliness',
};

export function EnhancedReviewItem({
  userId,
  userName = 'User',
  userAvatar,
  rating,
  comment,
  createdAt,
  isVerified,
  foodRating,
  serviceRating,
  atmosphereRating,
  valueRating,
  cleanlinessRating,
  visitType,
  visitDate,
  spentAmount,
  spentCurrency = 'TRY',
  waitTimeMinutes,
  orderedItems,
  photos = [],
  videos = [],
  helpfulCount = 0,
  onHelpfulPress,
  isHelpful = false,
  ownerResponse,
  ownerResponseAt,
}: EnhancedReviewItemProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showDetailedRatings, setShowDetailedRatings] = useState(false);

  const bodyStyle = createTextStyle('body', colors.text.primary);
  const bodySmallStyle = createTextStyle('bodySmall', colors.text.secondary);
  const captionStyle = createTextStyle('caption', colors.text.tertiary);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('date.today');
    if (diffDays === 1) return t('date.yesterday');
    if (diffDays < 7) return t('date.days_ago', { count: diffDays });
    if (diffDays < 30) return t('date.weeks_ago', { count: Math.floor(diffDays / 7) });
    if (diffDays < 365) return t('date.months_ago', { count: Math.floor(diffDays / 30) });
    return t('date.years_ago', { count: Math.floor(diffDays / 365) });
  };

  const hasDetailedRatings =
    foodRating || serviceRating || atmosphereRating || valueRating || cleanlinessRating;

  const displayPhotos = showAllPhotos ? photos : photos.slice(0, 4);

  return (
    <View style={[styles.container, { borderBottomColor: colors.surface.border }]}>
      {/* Header: Kullanıcı Bilgisi */}
      <View style={styles.header}>
        {/* Avatar */}
        <View
          style={[styles.avatar, { backgroundColor: colors.surface.elevated }]}
        >
          {userAvatar ? (
            <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
          ) : (
            <Text style={[bodyStyle, { fontSize: 18, fontWeight: '600' }]}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[bodyStyle, { fontWeight: '600' }]}>{userName}</Text>
            {isVerified && (
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    borderColor: colors.accent.primary,
                    backgroundColor: colors.accent.primary + '22',
                  },
                ]}
              >
                <IconSymbol
                  name="checkmark.seal.fill"
                  size={12}
                  color={colors.accent.primary}
                />
                <Text style={[styles.verifiedText, { color: colors.accent.primary }]}>
                  {t('review.verified')}
                </Text>
              </View>
            )}
          </View>
          <Text style={[captionStyle]}>{formatDate(createdAt)}</Text>
        </View>
      </View>

      {/* Ana Puan */}
      <View style={styles.ratingContainer}>
        <RatingStars value={rating} onChange={() => {}} size={18} />
        <Text style={[bodySmallStyle, { marginLeft: spacing.xs }]}>
          {rating}.0
        </Text>
      </View>

      {/* Ziyaret Bilgileri */}
      {(visitType || spentAmount || waitTimeMinutes) && (
        <View style={styles.visitInfo}>
          {visitType && (
            <View style={styles.infoTag}>
              <IconSymbol name="person.2.fill" size={14} color={colors.text.tertiary} />
              <Text style={[captionStyle, { marginLeft: 4 }]}>
                {t(`review.visit_types.${VISIT_TYPE_LABELS[visitType]}`)}
              </Text>
            </View>
          )}
          {spentAmount && (
            <View style={styles.infoTag}>
              <IconSymbol name="dollarsign.circle" size={14} color={colors.text.tertiary} />
              <Text style={[captionStyle, { marginLeft: 4 }]}>
                ~{spentAmount} {spentCurrency}
              </Text>
            </View>
          )}
          {waitTimeMinutes && (
            <View style={styles.infoTag}>
              <IconSymbol name="clock" size={14} color={colors.text.tertiary} />
              <Text style={[captionStyle, { marginLeft: 4 }]}>
                {t('review.wait_time', { minutes: waitTimeMinutes })}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Fotoğraflar */}
      {photos.length > 0 && (
        <View style={styles.photosContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {displayPhotos.map((photo, index) => (
              <Image
                key={index}
                source={{ uri: photo }}
                style={styles.reviewPhoto}
              />
            ))}
            {photos.length > 4 && !showAllPhotos && (
              <TouchableOpacity
                onPress={() => setShowAllPhotos(true)}
                style={[
                  styles.morePhotosButton,
                  { backgroundColor: colors.surface.elevated },
                ]}
              >
                <Text style={[bodySmallStyle, { fontWeight: '600' }]}>
                  +{photos.length - 4}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {/* Yorum Metni */}
      {comment && (
        <Text style={[bodyStyle, styles.comment, { lineHeight: 22 }]}>
          {comment}
        </Text>
      )}

      {/* Sipariş Edilen Ürünler */}
      {orderedItems && (
        <View style={styles.orderedItems}>
          <IconSymbol name="fork.knife" size={14} color={colors.text.secondary} />
          <Text style={[bodySmallStyle, { marginLeft: 6, fontStyle: 'italic' }]}>
            {orderedItems}
          </Text>
        </View>
      )}

      {/* Detaylı Puanlar */}
      {hasDetailedRatings && (
        <View style={styles.detailedRatings}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setShowDetailedRatings(!showDetailedRatings);
            }}
            style={styles.detailedRatingsHeader}
          >
            <Text style={[bodySmallStyle]}>{t("review.detailed_scores")}</Text>
            <IconSymbol
              name={showDetailedRatings ? 'chevron.up' : 'chevron.down'}
              size={14}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {showDetailedRatings && (
            <View style={styles.ratingsGrid}>
              {foodRating && (
                <View style={styles.ratingItem}>
                  <Text style={[captionStyle]}>{RATING_LABELS.food}</Text>
                  <View style={styles.ratingValue}>
                    <IconSymbol name="star.fill" size={12} color={colors.accent.primary} />
                    <Text style={[bodySmallStyle, { marginLeft: 2 }]}>
                      {foodRating}
                    </Text>
                  </View>
                </View>
              )}
              {serviceRating && (
                <View style={styles.ratingItem}>
                  <Text style={[captionStyle]}>{RATING_LABELS.service}</Text>
                  <View style={styles.ratingValue}>
                    <IconSymbol name="star.fill" size={12} color={colors.accent.primary} />
                    <Text style={[bodySmallStyle, { marginLeft: 2 }]}>
                      {serviceRating}
                    </Text>
                  </View>
                </View>
              )}
              {atmosphereRating && (
                <View style={styles.ratingItem}>
                  <Text style={[captionStyle]}>{RATING_LABELS.atmosphere}</Text>
                  <View style={styles.ratingValue}>
                    <IconSymbol name="star.fill" size={12} color={colors.accent.primary} />
                    <Text style={[bodySmallStyle, { marginLeft: 2 }]}>
                      {atmosphereRating}
                    </Text>
                  </View>
                </View>
              )}
              {valueRating && (
                <View style={styles.ratingItem}>
                  <Text style={[captionStyle]}>{RATING_LABELS.value}</Text>
                  <View style={styles.ratingValue}>
                    <IconSymbol name="star.fill" size={12} color={colors.accent.primary} />
                    <Text style={[bodySmallStyle, { marginLeft: 2 }]}>
                      {valueRating}
                    </Text>
                  </View>
                </View>
              )}
              {cleanlinessRating && (
                <View style={styles.ratingItem}>
                  <Text style={[captionStyle]}>{RATING_LABELS.cleanliness}</Text>
                  <View style={styles.ratingValue}>
                    <IconSymbol name="star.fill" size={12} color={colors.accent.primary} />
                    <Text style={[bodySmallStyle, { marginLeft: 2 }]}>
                      {cleanlinessRating}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Helpful Button */}
      {onHelpfulPress && (
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            onHelpfulPress();
          }}
          style={[
            styles.helpfulButton,
            {
              backgroundColor: isHelpful
                ? colors.accent.primary + '20'
                : colors.surface.elevated,
            },
          ]}
        >
          <IconSymbol
            name={isHelpful ? 'hand.thumbsup.fill' : 'hand.thumbsup'}
            size={16}
            color={isHelpful ? colors.accent.primary : colors.text.secondary}
          />
          <Text
            style={[
              bodySmallStyle,
              {
                marginLeft: 6,
                color: isHelpful ? colors.accent.primary : colors.text.secondary,
              },
            ]}
          >
            Yardımcı oldu ({helpfulCount})
          </Text>
        </TouchableOpacity>
      )}

      {/* Owner Response */}
      {ownerResponse && (
        <View
          style={[
            styles.ownerResponse,
            {
              backgroundColor: colors.surface.elevated,
              borderLeftColor: colors.accent.primary,
            },
          ]}
        >
          <View style={styles.ownerHeader}>
            <IconSymbol name="building.2" size={14} color={colors.accent.primary} />
            <Text
              style={[
                bodySmallStyle,
                { marginLeft: 6, fontWeight: '600', color: colors.accent.primary },
              ]}
            >
              İşletme Yanıtı
            </Text>
            {ownerResponseAt && (
              <Text style={[captionStyle, { marginLeft: 'auto' }]}>
                {formatDate(ownerResponseAt)}
              </Text>
            )}
          </View>
          <Text style={[bodySmallStyle, { marginTop: 6, lineHeight: 20 }]}>
            {ownerResponse}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.base,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: spacing.xs,
    gap: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  visitInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photosContainer: {
    marginBottom: spacing.base,
  },
  reviewPhoto: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  morePhotosButton: {
    width: 120,
    height: 120,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comment: {
    marginBottom: spacing.sm,
  },
  orderedItems: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  detailedRatings: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  detailedRatingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ratingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.base,
    marginTop: spacing.sm,
  },
  ratingItem: {
    width: '48%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    marginTop: spacing.sm,
  },
  ownerResponse: {
    padding: spacing.base,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: spacing.base,
  },
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
