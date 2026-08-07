import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Pressable,
  ScrollView,
  Animated as RNAnimated,
  PanResponder,
} from 'react-native';
import { IconSymbol } from '@/src/components/ui/icon-symbol';

/** Swipe-down-to-close fullscreen image viewer */
export function HeroImageViewer({
  heroSource,
  insetTop,
  onClose,
  screenWidth,
  screenHeight,
  t,
}: {
  heroSource: any;
  insetTop: number;
  onClose: () => void;
  screenWidth: number;
  screenHeight: number;
  t: (key: string) => string;
}) {
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          opacity.setValue(Math.max(0.3, 1 - g.dy / 300));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          // Threshold aşıldı — kapat
          RNAnimated.parallel([
            RNAnimated.timing(translateY, { toValue: screenHeight, duration: 220, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => onClose());
        } else {
          // Geri döndür
          RNAnimated.parallel([
            RNAnimated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            RNAnimated.spring(opacity, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <RNAnimated.View
      style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", opacity }}
      {...panResponder.panHandlers}
    >
      {/* Kapat butonu */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", position: "absolute", top: insetTop, width: "100%", paddingHorizontal: 20, zIndex: 10 }}>
        <TouchableOpacity onPress={onClose} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
          <IconSymbol name="xmark" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{t('explore.close')}</Text>
        </TouchableOpacity>
      </View>

      {/* Görsel + sürükleme geri bildirimi */}
      <RNAnimated.View style={{ transform: [{ translateY }] }}>
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          bouncesZoom
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
          style={{ width: screenWidth, height: screenHeight }}
        >
          <Pressable>
            <Image source={heroSource} style={{ width: screenWidth, height: screenHeight * 0.8 }} resizeMode="contain" />
          </Pressable>
        </ScrollView>
      </RNAnimated.View>

      {/* Swipe ipucu */}
      <View style={{ position: "absolute", bottom: 40, alignItems: "center", gap: 4 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" }} />
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Kapatmak için aşağı kaydırın</Text>
      </View>
    </RNAnimated.View>
  );
}
