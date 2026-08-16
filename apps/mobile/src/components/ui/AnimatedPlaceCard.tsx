/**
 * Animated Place Card Component
 * 
 * Thin wrapper around PlaceCard. Memoized to prevent unnecessary re-renders
 * in FlashList. No entering animation — Reanimated entering animations
 * conflict with FlashList cell recycling and cause black screen flashes.
 * 
 * @module components/ui/AnimatedPlaceCard
 */

import React from 'react';
import { PlaceCard, PlaceCardProps } from '@/src/components/domain/place/PlaceCard';

export interface AnimatedPlaceCardProps extends PlaceCardProps {
  /**
   * @deprecated No longer used — kept for API compatibility
   */
  delay?: number;
  
  /**
   * @deprecated No longer used — kept for API compatibility
   */
  index?: number;
}

/**
 * Memoized Place Card — no animation wrapper to avoid FlashList recycling conflicts.
 */
function AnimatedPlaceCardInner({
  delay = 0,
  index = 0,
  ...cardProps
}: AnimatedPlaceCardProps) {
  return <PlaceCard {...cardProps} />;
}

export const AnimatedPlaceCard = React.memo(AnimatedPlaceCardInner);
