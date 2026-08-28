/**
 * OfflineBanner — Çevrimdışı Durum Göstergesi
 *
 * İnternet bağlantısı kesildiğinde ekranın üstünde kırmızı animasyonlu banner gösterir.
 * Bağlantı geri geldiğinde yeşile dönüp otomatik kaybolur.
 *
 * @module components/ui/OfflineBanner
 */

import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNetworkStatus } from "@/src/hooks/useNetworkStatus";

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-80);
  const wasOfflineRef = useRef(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerText, setBannerText] = useState("İnternet bağlantısı yok");
  const [bannerColor, setBannerColor] = useState("#EF4444");
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isConnected) {
      // Offline oldu
      wasOfflineRef.current = true;
      setShowBanner(true);
      setBannerText("İnternet bağlantısı yok");
      setBannerColor("#EF4444");
      translateY.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });

      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      if (completionTimeoutRef.current) {
        clearTimeout(completionTimeoutRef.current);
        completionTimeoutRef.current = null;
      }
    } else if (wasOfflineRef.current) {
      // Online'a geri döndü
      setBannerText("Bağlantı sağlandı ✓");
      setBannerColor("#22C55E");

      hideTimeoutRef.current = setTimeout(() => {
        translateY.value = withTiming(-80, { duration: 300, easing: Easing.in(Easing.cubic) });
        completionTimeoutRef.current = setTimeout(() => {
          setShowBanner(false);
          wasOfflineRef.current = false;
          completionTimeoutRef.current = null;
        }, 350);
      }, 2000);
    }

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      if (completionTimeoutRef.current) clearTimeout(completionTimeoutRef.current);
    };
  }, [isConnected, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!showBanner) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 4, backgroundColor: bannerColor },
        animatedStyle,
      ]}
    >
      <Text style={styles.text}>{bannerText}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
