import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export interface DotLoaderProps {
  color?: string;
  size?: number;
}

export function DotLoader({ color, size = 12 }: DotLoaderProps) {
  // Default to a green shade if not provided, or use primary accent
  const dotColor = color || '#34C759'; // iOS green, or we can use colors.accent.primary

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (anim: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true })
      ]);
    };

    const animate = () => {
      Animated.stagger(150, [
        createAnimation(anim1),
        createAnimation(anim2),
        createAnimation(anim3),
      ]).start(() => animate());
    };

    animate();
  }, [anim1, anim2, anim3]);

  const dotStyle = (anim: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: dotColor,
    opacity: anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, dotStyle(anim1)]} />
      <Animated.View style={[styles.dot, dotStyle(anim2)]} />
      <Animated.View style={[styles.dot, dotStyle(anim3)]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
  },
});
