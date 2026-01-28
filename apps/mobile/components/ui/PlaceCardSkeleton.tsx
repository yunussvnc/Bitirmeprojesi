/**
 * Place Card Skeleton Component
 * 
 * Loading skeleton for place cards.
 * Matches the shape of PlaceCard for smooth loading experience.
 * 
 * @module components/ui/PlaceCardSkeleton
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { spacing } from '@/constants/design';

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
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

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
          <Animated.View
            style={[
              styles.imageSkeleton,
              {
                backgroundColor: colors.surface.default,
                opacity,
              },
            ]}
          />

          {/* Content skeleton */}
          <View style={styles.content}>
            {/* Title skeleton */}
            <Animated.View
              style={[
                styles.titleSkeleton,
                {
                  backgroundColor: colors.surface.default,
                  opacity,
                },
              ]}
            />

            {/* Subtitle skeleton */}
            <Animated.View
              style={[
                styles.subtitleSkeleton,
                {
                  backgroundColor: colors.surface.default,
                  opacity,
                },
              ]}
            />

            {/* Tags skeleton */}
            <View style={styles.tagsSkeleton}>
              {[1, 2, 3].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.tagSkeleton,
                    {
                      backgroundColor: colors.surface.default,
                      opacity,
                    },
                  ]}
                />
              ))}
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
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  content: {
    padding: spacing.cardPadding,
  },
  titleSkeleton: {
    height: 20,
    width: '70%',
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  subtitleSkeleton: {
    height: 16,
    width: '90%',
    borderRadius: 4,
    marginBottom: spacing.sm,
  },
  tagsSkeleton: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tagSkeleton: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
});
