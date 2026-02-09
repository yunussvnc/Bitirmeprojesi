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
 * Wraps PlaceCard with fade-in and slide-up animation.
 * Perfect for lists where items appear one by one.
 */
function AnimatedPlaceCardInner({
  delay = 0,
  index = 0,
  ...cardProps
}: AnimatedPlaceCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animationDelay = delay + (index * 50); // Stagger by 50ms per item

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: animationTiming.normal,
        delay: animationDelay,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: animationTiming.normal,
        delay: animationDelay,
        easing: easing.easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay, index]);

  return (
    <Animated.View
      style={{
        width: '100%',
        alignSelf: 'stretch',
        opacity,
        transform: [{ translateY }],
      }}
    >
      <PlaceCard {...cardProps} />
    </Animated.View>
  );
}

export const AnimatedPlaceCard = React.memo(AnimatedPlaceCardInner);
