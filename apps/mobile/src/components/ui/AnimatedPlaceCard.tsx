/**
 * Animated Place Card Component
 * 
 * PlaceCard with Reanimated entering animation.
 * Used in lists for smooth appearance.
 * 
 * @module components/ui/AnimatedPlaceCard
 */

import React from 'react';
import Animated, { 
  FadeInDown, 
  useAnimatedSensor, 
  SensorType, 
  useAnimatedStyle,
  interpolate
} from 'react-native-reanimated';
import { PlaceCard, PlaceCardProps } from '@/src/components/domain/place/PlaceCard';

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
  
  // 3D Parallax Tilt Effect via Device Rotation
  const rotationSensor = useAnimatedSensor(SensorType.ROTATION);

  const parallaxStyle = useAnimatedStyle(() => {
    if (!rotationSensor.sensor.value) return {};

    const pitch = rotationSensor.sensor.value.pitch;
    const roll = rotationSensor.sensor.value.roll;
    
    // Subtle 3D tilt. Max 8 degrees to prevent distortion.
    // Invert X to make it feel natural (tilting phone down tilts card up)
    const rotateX = interpolate(pitch, [-1.5, 1.5], [8, -8], 'clamp');
    // Normal Y (tilting phone right tilts card right)
    const rotateY = interpolate(roll, [-1.5, 1.5], [-8, 8], 'clamp');

    return {
      transform: [
        { perspective: 1000 },
        { rotateX: `${rotateX}deg` },
        { rotateY: `${rotateY}deg` },
      ]
    };
  });

  return (
    <Animated.View entering={entering} style={parallaxStyle}>
      <PlaceCard {...cardProps} />
    </Animated.View>
  );
}

export const AnimatedPlaceCard = React.memo(AnimatedPlaceCardInner);
