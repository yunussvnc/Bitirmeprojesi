/**
 * Review card — tüm yorumlar (Google + uygulama içi) için ortak kart.
 */

import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { RatingStars } from '@/src/components/ui';
import { createTextStyle, spacing } from '@/src/constants/design';

export type ReviewItemType = {
  author_name: string;
  rating: number;
  text: string;
  relative_time?: string | null;
  avatar_url?: string | null;
};



type Props = {
  review: ReviewItemType;
  borderColor: string;
};

export function ReviewCard({ review, borderColor }: Props) {
  const { colors } = useTheme();
  const bodyStyle = createTextStyle('body', colors.text.primary);
  const bodySmallStyle = createTextStyle('bodySmall', colors.text.secondary);
  const initial = (review.author_name?.trim()?.[0] || '?').toUpperCase();

  return (
    <View style={[styles.reviewItem, { borderBottomColor: borderColor }]}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewHeaderLeft}>
          {review.avatar_url ? (
            <Image source={{ uri: review.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.surface.elevated }]}>
              <Text style={[bodyStyle, { fontWeight: '700', fontSize: 14 }]}>{initial}</Text>
            </View>
          )}
          <View style={styles.nameBlock}>
            <Text style={[bodyStyle, { fontWeight: '600' }]} numberOfLines={1}>
              {review.author_name}
            </Text>
            {!!review.relative_time && (
              <Text style={[bodySmallStyle, { marginTop: 2, color: colors.text.tertiary }]}>
                {review.relative_time}
              </Text>
            )}
          </View>
        </View>
        <RatingStars value={review.rating} disabled size={16} />
      </View>
      <Text style={[bodySmallStyle, { marginTop: spacing.sm, lineHeight: 22 }]}>{review.text}</Text>
    </View>
  );
}



const styles = StyleSheet.create({
  reviewItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nameBlock: { flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
