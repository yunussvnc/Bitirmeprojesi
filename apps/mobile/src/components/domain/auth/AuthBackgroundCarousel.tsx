/**
 * Auth screens — rotating venue background images with crossfade.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, View } from 'react-native';
import { getAllPlaces } from '@/src/services/mekanService';

const { width, height } = Dimensions.get('window');

export const FALLBACK_PLACE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200',
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200',
  'https://images.unsplash.com/photo-1521017430209-a6cb9156a64b?w=1200',
];

const CAROUSEL_INTERVAL_MS = 4500;
const FADE_MS = 800;

type Props = {
  intervalMs?: number;
};

export function AuthBackgroundCarousel({ intervalMs = CAROUSEL_INTERVAL_MS }: Props) {
  const [images, setImages] = useState<string[]>(FALLBACK_PLACE_IMAGES);
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    getAllPlaces()
      .then((places) => {
        if (!mountedRef.current) return;
        const urls = (places ?? [])
          .map((p) => p.photo_url)
          .filter((url): url is string => Boolean(url && url.trim()));
        const unique = Array.from(new Set(urls));
        if (unique.length >= 2) {
          setImages(unique.slice(0, 12));
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (images.length <= 1) return undefined;
    const timer = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: FADE_MS,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setIndex((prev) => (prev + 1) % images.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: FADE_MS,
          useNativeDriver: true,
        }).start();
      });
    }, intervalMs);
    return () => clearInterval(timer);
  }, [fade, images.length, intervalMs]);

  const uri = images[index] ?? FALLBACK_PLACE_IMAGES[0];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={{ uri }} style={styles.backgroundImage} resizeMode="cover" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    width,
    height,
  },
});
