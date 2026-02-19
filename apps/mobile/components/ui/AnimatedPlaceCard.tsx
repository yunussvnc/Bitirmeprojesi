/**
 * Animated Place Card Component
 * 
 * PlaceCard with fade-in and slide-up animation.
 * Used in lists for smooth appearance.
 * 
 * @module components/ui/AnimatedPlaceCard
 */

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { PlaceCard, PlaceCardProps } from '@/components/place/PlaceCard';
import { animationTiming, easing } from '@/constants/design';

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
 * Optimized wrapper for PlaceCard - animations removed for better scroll performance.
 * Memoized to prevent unnecessary re-renders.
 */
function AnimatedPlaceCardInner({
  delay = 0,
  index = 0,
  ...cardProps
}: AnimatedPlaceCardProps) {
  // No animations - direct render for smooth scrolling
  return <PlaceCard {...cardProps} />;
}

export const AnimatedPlaceCard = React.memo(AnimatedPlaceCardInner);
