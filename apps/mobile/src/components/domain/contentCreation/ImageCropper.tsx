/**
 * ImageCropper – Premium gesture-based image cropper
 *
 * Pinch-to-zoom + Pan-to-move ile seçilen fotoğrafı kırpma.
 * 1:1, 4:5 ve Orijinal (serbest) aspect ratio desteği.
 * Kırpma dışı bölge karartılır (scrim overlay).
 * Üçte bir kuralı grid çizgileri.
 */

import React, { useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import ViewShot from 'react-native-view-shot';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';
import type { AspectRatioOption } from '@/src/contentCreation/types';
import { POST_ASPECT_RATIOS } from '@/src/contentCreation/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SPRING_CONFIG = {
  damping: 22,
  stiffness: 220,
  mass: 0.7,
};

export interface ImageCropperProps {
  /** Image URI to crop */
  imageUri: string;
  /** Original image dimensions */
  imageWidth?: number;
  imageHeight?: number;
  /** Container height for the cropper view */
  containerHeight: number;
  /** Optional filter overlay to apply */
  filterOverlay?: { bg: string; opacity: number } | null;
  /** Initial crop state to restore non-destructive edits */
  initialCropState?: { scale: number; translateX: number; translateY: number };
}

export interface ImageCropperRef {
  cropImage: () => Promise<string | null>;
  getCropState: () => { scale: number; translateX: number; translateY: number };
}

// Sabit 1:1 (Kare) oranı zorunlu kılıyoruz
const FIXED_ASPECT_RATIO = { label: '1:1', value: [1, 1] } as AspectRatioOption;

export const ImageCropper = React.forwardRef<ImageCropperRef, ImageCropperProps>(({
  imageUri,
  imageWidth = 1080,
  imageHeight = 1080,
  containerHeight,
  filterOverlay,
  initialCropState,
}, ref) => {
  const { colors } = useTheme();

  const aspectRatio = FIXED_ASPECT_RATIO;

  // Gesture values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const viewShotRef = React.useRef<any>(null);

  React.useImperativeHandle(ref, () => ({
    cropImage: async () => {
      try {
        if (viewShotRef.current && viewShotRef.current.capture) {
          const uri = await viewShotRef.current.capture();
          return uri;
        }
      } catch (err) {
        console.error("ViewShot capture failed:", err);
      }
      return null;
    },
    getCropState: () => {
      return {
        scale: scale.value,
        translateX: translateX.value,
        translateY: translateY.value,
      };
    }
  }));

  // Calculate crop frame dimensions
  const cropFrame = useMemo(() => {
    const containerWidth = SCREEN_WIDTH;
    if (!aspectRatio.value) {
      // Original — fit the image into container
      const imgRatio = imageWidth / imageHeight;
      if (imgRatio > containerWidth / containerHeight) {
        return { width: containerWidth, height: containerWidth / imgRatio };
      }
      return { width: containerHeight * imgRatio, height: containerHeight };
    }
    const [aw, ah] = aspectRatio.value;
    const ratio = aw / ah;
    let frameW = containerWidth;
    let frameH = containerWidth / ratio;
    if (frameH > containerHeight) {
      frameH = containerHeight;
      frameW = containerHeight * ratio;
    }
    return { width: frameW, height: frameH };
  }, [aspectRatio, imageWidth, imageHeight, containerHeight]);

  // Reset transforms when aspect ratio or image changes
  useEffect(() => {
    'worklet';
    if (initialCropState) {
      scale.value = initialCropState.scale;
      savedScale.value = initialCropState.scale;
      translateX.value = initialCropState.translateX;
      translateY.value = initialCropState.translateY;
      savedTranslateX.value = initialCropState.translateX;
      savedTranslateY.value = initialCropState.translateY;
    } else {
      scale.value = withSpring(1, SPRING_CONFIG);
      savedScale.value = 1;
      translateX.value = withSpring(0, SPRING_CONFIG);
      translateY.value = withSpring(0, SPRING_CONFIG);
      savedTranslateX.value = 0;
      savedTranslateY.value = 0;
    }
  }, [aspectRatio, imageUri, initialCropState]);

  // Image display dimensions (computed once for reuse)
  const imageDisplayStyle = useMemo(() => {
    const imgRatio = imageWidth / imageHeight;
    if (imgRatio > cropFrame.width / cropFrame.height) {
      // Image wider → height fills, width overflows
      return {
        width: cropFrame.height * imgRatio,
        height: cropFrame.height,
      };
    }
    // Image taller → width fills, height overflows
    return {
      width: cropFrame.width,
      height: cropFrame.width / imgRatio,
    };
  }, [cropFrame, imageWidth, imageHeight]);

  // Boundary clamping for worklet (inlined values to avoid closure issues)
  const cfW = cropFrame.width;
  const cfH = cropFrame.height;
  const imgW = imageWidth;
  const imgH = imageHeight;

  // Pinch gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      'worklet';
      const newScale = Math.max(1, Math.min(5, savedScale.value * e.scale));
      scale.value = newScale;
      // Re-clamp position
      const imgRatio = imgW / imgH;
      let dW: number, dH: number;
      if (imgRatio > cfW / cfH) { dH = cfH * newScale; dW = dH * imgRatio; }
      else { dW = cfW * newScale; dH = dW / imgRatio; }
      const maxX = Math.max(0, (dW - cfW) / 2);
      const maxY = Math.max(0, (dH - cfH) / 2);
      translateX.value = Math.min(maxX, Math.max(-maxX, translateX.value));
      translateY.value = Math.min(maxY, Math.max(-maxY, translateY.value));
    })
    .onEnd(() => {
      'worklet';
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING_CONFIG);
        savedScale.value = 1;
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  // Pan gesture
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .onUpdate((e) => {
      'worklet';
      const newX = savedTranslateX.value + e.translationX;
      const newY = savedTranslateY.value + e.translationY;
      const imgRatio = imgW / imgH;
      let dW: number, dH: number;
      if (imgRatio > cfW / cfH) { dH = cfH * scale.value; dW = dH * imgRatio; }
      else { dW = cfW * scale.value; dH = dW / imgRatio; }
      const maxX = Math.max(0, (dW - cfW) / 2);
      const maxY = Math.max(0, (dH - cfH) / 2);
      translateX.value = Math.min(maxX, Math.max(-maxX, newX));
      translateY.value = Math.min(maxY, Math.max(-maxY, newY));
    })
    .onEnd(() => {
      'worklet';
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  // Combine gestures
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Image animated styles
  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const scrimTopH = Math.max(0, (containerHeight - cropFrame.height) / 2);
  const scrimSideW = Math.max(0, (SCREEN_WIDTH - cropFrame.width) / 2);

  return (
    <View style={[styles.container, { height: containerHeight, backgroundColor: '#000' }]}>
      {/* Crop viewport */}
      <View style={styles.viewportWrap}>
        <ViewShot
          ref={viewShotRef}
          options={{ format: "jpg", quality: 0.9 }}
          style={[
            styles.cropViewport,
            { width: cropFrame.width, height: cropFrame.height },
          ]}
        >
          <GestureDetector gesture={composedGesture}>
            <Animated.View
              style={[
                styles.imageContainer,
                { width: cropFrame.width, height: cropFrame.height },
              ]}
            >
              <Animated.View style={[imageAnimatedStyle, imageDisplayStyle]}>
                <ExpoImage
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {/* Grid overlay lines (Rule of thirds) */}
          <View style={styles.gridOverlay} pointerEvents="none">
            <View style={[styles.gridLineH, { top: '33.33%' }]} />
            <View style={[styles.gridLineH, { top: '66.66%' }]} />
            <View style={[styles.gridLineV, { left: '33.33%' }]} />
            <View style={[styles.gridLineV, { left: '66.66%' }]} />
          </View>

          {/* Filter overlay */}
          {filterOverlay && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: filterOverlay.bg, opacity: filterOverlay.opacity },
              ]}
              pointerEvents="none"
            />
          )}
        </ViewShot>

        {/* Scrim overlays — darkened areas outside crop */}
        <View style={[styles.scrimTop, { height: scrimTopH }]} />
        <View style={[styles.scrimBottom, { height: scrimTopH }]} />
        <View style={[styles.scrimLeft, { top: scrimTopH, height: cropFrame.height, width: scrimSideW }]} />
        <View style={[styles.scrimRight, { top: scrimTopH, height: cropFrame.height, width: scrimSideW }]} />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    position: 'relative',
    overflow: 'hidden',
  },
  viewportWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropViewport: {
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrimLeft: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  scrimRight: {
    position: 'absolute',
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  ratioBar: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  ratioPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
  },
  ratioLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
