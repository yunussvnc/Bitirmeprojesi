import React, { useEffect } from 'react';
import { View, StyleSheet, LayoutChangeEvent, ViewStyle, StyleProp } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const [layoutWidth, setLayoutWidth] = React.useState<number>(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1, // infinite
      false // do not reverse
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Translate the gradient from -100% to +100%
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-layoutWidth || -300, layoutWidth || 300]
    );

    return {
      transform: [{ translateX }],
    };
  });

  const onLayout = (event: LayoutChangeEvent) => {
    setLayoutWidth(event.nativeEvent.layout.width);
  };

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.container,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: colors.surface.border,
        },
        style,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'transparent',
            colors.surface.elevated,
            'transparent',
          ]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
