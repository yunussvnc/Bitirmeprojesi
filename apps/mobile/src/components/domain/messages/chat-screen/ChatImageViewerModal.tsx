import { useCallback, useEffect, useRef } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { styles } from './styles';

interface ChatImageViewerModalProps {
  imageUri: string | null;
  onDismiss: () => void;
}

export function ChatImageViewerModal({ imageUri, onDismiss }: ChatImageViewerModalProps) {
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imgScale = useSharedValue(1);
  const imgTranslateX = useSharedValue(0);
  const imgTranslateY = useSharedValue(0);
  const savedScale = useSharedValue(1);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (!imageUri) return;

    imgScale.value = 1;
    imgTranslateX.value = 0;
    imgTranslateY.value = 0;
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
    overlayOpacity.value = withTiming(1, { duration: 150 });
  }, [imageUri, imgScale, imgTranslateX, imgTranslateY, overlayOpacity, savedScale, savedTranslateX, savedTranslateY]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const closeImageViewer = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: 150 });
    imgScale.value = withTiming(0.9, { duration: 150 });

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(onDismiss, 150);
  }, [imgScale, onDismiss, overlayOpacity]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      imgScale.value = Math.max(0.5, Math.min(savedScale.value * event.scale, 6));
    })
    .onEnd(() => {
      if (imgScale.value < 1) {
        imgScale.value = withSpring(1);
        imgTranslateX.value = withSpring(0);
        imgTranslateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        savedScale.value = imgScale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (savedScale.value > 1) {
        imgTranslateX.value = savedTranslateX.value + event.translationX;
        imgTranslateY.value = savedTranslateY.value + event.translationY;
      } else {
        imgTranslateY.value = event.translationY;
        overlayOpacity.value = Math.max(0, 1 - Math.abs(event.translationY) / 400);
      }
    })
    .onEnd((event) => {
      if (savedScale.value <= 1 && Math.abs(event.translationY) > 80) {
        imgTranslateY.value = withTiming(
          event.translationY + Math.sign(event.translationY) * 500,
          { duration: 150 },
        );
        runOnJS(closeImageViewer)();
      } else if (savedScale.value <= 1) {
        imgTranslateY.value = withSpring(0);
        overlayOpacity.value = withTiming(1);
      } else {
        savedTranslateX.value = imgTranslateX.value;
        savedTranslateY.value = imgTranslateY.value;
      }
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (imgScale.value > 1) {
        imgScale.value = withSpring(1);
        imgTranslateX.value = withSpring(0);
        imgTranslateY.value = withSpring(0);
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        imgScale.value = withSpring(2.5);
        savedScale.value = 2.5;
      }
    });

  const allGestures = Gesture.Race(
    doubleTapGesture,
    Gesture.Simultaneous(pinchGesture, panGesture),
  );

  const animatedImageStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: imgScale.value },
      { translateX: imgTranslateX.value },
      { translateY: imgTranslateY.value },
    ],
  }));

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  return (
    <Modal
      visible={!!imageUri}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeImageViewer}
    >
      <Animated.View style={[styles.imageViewerOverlay, animatedOverlayStyle]}>
        <TouchableOpacity
          style={styles.imageViewerCloseBtn}
          onPress={closeImageViewer}
          activeOpacity={0.7}
          hitSlop={16}
        >
          <View style={styles.imageViewerCloseBtnInner}>
            <Text style={styles.imageViewerCloseX}>✕</Text>
          </View>
        </TouchableOpacity>

        <GestureDetector gesture={allGestures}>
          <Animated.View style={[styles.imageViewerContainer, animatedImageStyle]}>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.imageViewerImage} contentFit="contain" />
            )}
          </Animated.View>
        </GestureDetector>

        <View style={styles.imageViewerHint}>
          <Text style={styles.imageViewerHintText}>
            Aşağı kaydır: kapat  ·  Kıstır: yakınlaştır  ·  Çift dokun: 2.5×
          </Text>
        </View>
      </Animated.View>
    </Modal>
  );
}
