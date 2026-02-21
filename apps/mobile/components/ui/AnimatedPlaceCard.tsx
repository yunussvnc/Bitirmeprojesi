/**
 * Animated Place Card Component
 * 
 * PlaceCard with Reanimated entering animation.
 * Used in lists for smooth appearance.
 * 
 * @module components/ui/AnimatedPlaceCard
 */

import React from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PlaceCard, PlaceCardProps } from '@/components/place/PlaceCard';

export interface AnimatedPlaceCardProps extends PlaceCardProps {
  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;
  
  /**
   * Animation index (for staggered animations)
   * @default 0
   */
  index?: number;
}

/**
 * Animated Place Card Component
 * 
 * Wrapper for PlaceCard with subtle entering animation.
 * Memoized to prevent unnecessary re-renders.
 */
function AnimatedPlaceCardInner({
  delay = 0,
  index = 0,
  ...cardProps
}: AnimatedPlaceCardProps) {
  const entering = FadeInDown.duration(280).delay(Math.min(index * 35, 150));
  return (
    <Animated.View entering={entering}>
      <PlaceCard {...cardProps} />
    </Animated.View>
  );
}

export const AnimatedPlaceCard = React.memo(AnimatedPlaceCardInner);
