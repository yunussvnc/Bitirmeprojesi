import React from 'react';
import { Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface DraggableTextProps {
  text: string;
  color?: string;
  fontSize?: number;
}

const { width: SW, height: SH } = Dimensions.get('window');

export function DraggableText({ text, color = '#FFFFFF', fontSize = 32 }: DraggableTextProps) {
  const isPressed = useSharedValue(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTransX = useSharedValue(0);
  const savedTransY = useSharedValue(0);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  // Pan (Sürükleme)
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isPressed.value = true;
    })
    .onUpdate((e) => {
      translateX.value = savedTransX.value + e.translationX;
      translateY.value = savedTransY.value + e.translationY;
    })
    .onEnd(() => {
      savedTransX.value = translateX.value;
      savedTransY.value = translateY.value;
      isPressed.value = false;
    });

  // Pinch (Büyütme)
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const composed = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: isPressed.value ? withSpring(scale.value * 1.05) : withSpring(scale.value) },
      ],
      position: 'absolute',
      alignSelf: 'center',
      top: SH / 2 - 50,
      zIndex: 100,
    };
  });

  return (
    <GestureDetector gesture={composed}>
      <Animated.Text
        style={[
          animatedStyle,
          {
            color,
            fontSize,
            fontWeight: 'bold',
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: -1, height: 1 },
            textShadowRadius: 10,
            padding: 10,
          },
        ]}
      >
        {text}
      </Animated.Text>
    </GestureDetector>
  );
}
