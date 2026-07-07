/**
 * Place Card Skeleton Component
 * 
 * Loading skeleton for place cards.
 * Matches the shape of PlaceCard for smooth loading experience.
 * 
 * @module components/ui/PlaceCardSkeleton
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';
import { spacing } from '@/src/constants/design';
import { Skeleton } from "./Skeleton";

export interface PlaceCardSkeletonProps {
  /**
   * Number of skeletons to show
   * @default 3
   */
  count?: number;
}

/**
 * Place Card Skeleton Component
 * 
 * Animated skeleton loader that matches PlaceCard layout.
 */
export function PlaceCardSkeleton({ count = 3 }: PlaceCardSkeletonProps) {
  const { colors } = useTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: colors.surface.elevated,
              borderColor: colors.surface.border,
            },
          ]}
        >
          {/* Image skeleton */}
          <Skeleton 
            style={styles.imageSkeleton} 
            borderRadius={12} 
          />
          
          <View style={styles.contentContainer}>
            {/* Header skeleton */}
            <View style={styles.headerRow}>
              <Skeleton width={120} height={24} borderRadius={4} />
              <Skeleton width={48} height={24} borderRadius={12} />
            </View>

            {/* Subtitle skeleton */}
            <Skeleton width="60%" height={16} borderRadius={4} style={{ marginTop: 8 }} />

            {/* Tags skeleton */}
            <View style={styles.tagsSkeleton}>
              <Skeleton width={80} height={24} borderRadius={12} />
              <Skeleton width={60} height={24} borderRadius={12} />
              <Skeleton width={100} height={24} borderRadius={12} />
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.base,
    borderWidth: 1,
  },
  imageSkeleton: {
    width: "100%",
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  contentContainer: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsSkeleton: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
});
