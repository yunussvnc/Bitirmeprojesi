/**
 * StoryMediaEditor (v2 — Üretim Sürümü)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * AŞAMA 1: Gesture Düzenleme
 *   • Pinch (focal-point zoom), Rotation, Pan — hepsi aynı anda çalışır
 *   • Tüm hesaplamalar UI thread'de (worklet) → 60 FPS garantisi
 *
 * AŞAMA 2: Görsel İşleme
 *   "Devam Et" basıldığında:
 *   1. Shared Value'lardan mevcut cropData snapshot'ı alır
 *   2. expo-image-manipulator ile görsel gerçekten transform edilir:
 *        resize → crop → rotate (ImageManipulator desteklediği kadar)
 *   3. İşlenmiş URI'yi onConfirm'e iletir; böylece sunucuya HAM değil
 *      kullanıcının gördüğü görsel yüklenir.
 *
 * ───────────────────────────────────────────────────────────────────────
 *
 * Kullanım:
 *   <StoryMediaEditor
 *     uri="file://..."
 *     originalWidth={4032}
 *     originalHeight={3024}
 *     onConfirm={(processedUri, cropData) => goToShare(processedUri)}
 *     onCancel={() => goBack()}
 *   />
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import ViewShot from 'react-native-view-shot';
import { DraggableText } from './DraggableText';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Sabitler ───────────────────────────────────────────────────────────
const MIN_SCALE = 0.5;
const MAX_SCALE = 6.0;

// Dışa aktarılan cropData tipi (backend/upload modülü bunu alır)
export interface StoryTransformData {
  scale: number;
  translateX: number;
  translateY: number;
  rotationRad: number;
  /** Derece cinsinden döndürme (ImageManipulator için) */
  rotationDeg: number;
  /** Kırpma dikdörtgeni (piksel koordinatlarında, orijinal görsel boyutlarına göre) */
  crop?: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

// ── Props ──────────────────────────────────────────────────────────────
export interface StoryMediaEditorProps {
  uri: string;
  /** Orijinal görsel boyutu (ImageManipulator crop hesabı için) */
  originalWidth?: number;
  originalHeight?: number;
  /**
   * Kullanıcı "Devam Et" butonuna bastığında çağrılır.
   * processedUri: ImageManipulator'dan çıkan işlenmiş görsel URI'si
   * cropData: dönüşüm metadata'sı (backend'e isteğe bağlı gönderilebilir)
   */
  onConfirm: (processedUri: string, cropData: StoryTransformData) => void;
  onCancel: () => void;
}

// ── Yardımcı: worklet dışından çalışır ────────────────────────────────
const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

const radToDeg = (rad: number): number => {
  'worklet';
  return rad * (180 / Math.PI);
};

// ── Ana Bileşen ────────────────────────────────────────────────────────
export function StoryMediaEditor({
  uri,
  originalWidth,
  originalHeight,
  onConfirm,
  onCancel,
}: StoryMediaEditorProps) {
  const insets = useSafeAreaInsets();
  const [processing, setProcessing] = useState(false);

  // ── Shared Values (UI thread) ────────────────────────────────────────
  const scale         = useSharedValue(1);
  const savedScale    = useSharedValue(1);
  const rotation      = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const translateX    = useSharedValue(0);
  const savedTransX   = useSharedValue(0);
  const translateY    = useSharedValue(0);
  const savedTransY   = useSharedValue(0);
  const focalOffsetX  = useSharedValue(0);
  const focalOffsetY  = useSharedValue(0);

  // ── Metin Eklentileri (Text Overlays) ─────────────────────────────────
  const [texts, setTexts] = useState<string[]>([]);
  const viewShotRef = useRef<ViewShot>(null);

  // ── Snapshot için ref (JS thread'den okumak için) ────────────────────
  const transformRef = useRef<StoryTransformData>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotationRad: 0,
    rotationDeg: 0,
  });

  /** UI thread'den JS thread'e transform verisini senkronize eder */
  const syncTransformToRef = useCallback(
    (s: number, tx: number, ty: number, rot: number) => {
      transformRef.current = {
        scale: s,
        translateX: tx,
        translateY: ty,
        rotationRad: rot,
        rotationDeg: rot * (180 / Math.PI),
      };
    },
    []
  );

  // ── GESTURE TANIMLARI ─────────────────────────────────────────────────

  /** PINCH: focal-point zoom */
  const pinchGesture = Gesture.Pinch()
    .onStart((e) => {
      focalOffsetX.value = e.focalX - SW / 2;
      focalOffsetY.value = e.focalY - SH / 2;
    })
    .onUpdate((e) => {
      const newScale = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
      const scaleDiff = newScale - savedScale.value;
      translateX.value = savedTransX.value - focalOffsetX.value * scaleDiff;
      translateY.value = savedTransY.value - focalOffsetY.value * scaleDiff;
      scale.value = newScale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      savedTransX.value = translateX.value;
      savedTransY.value = translateY.value;
      if (scale.value < 1) {
        scale.value = withSpring(1, { damping: 15, stiffness: 120 });
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTransX.value = 0;
        savedTransY.value = 0;
      }
      // Snapshot'ı JS'e aktar
      runOnJS(syncTransformToRef)(
        scale.value, translateX.value, translateY.value, rotation.value
      );
    });

  /** ROTATION: iki parmakla döndür */
  const rotationGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
      runOnJS(syncTransformToRef)(
        scale.value, translateX.value, translateY.value, rotation.value
      );
    });

  /** PAN: serbest kaydır */
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onUpdate((e) => {
      translateX.value = savedTransX.value + e.translationX;
      translateY.value = savedTransY.value + e.translationY;
    })
    .onEnd(() => {
      savedTransX.value = translateX.value;
      savedTransY.value = translateY.value;
      runOnJS(syncTransformToRef)(
        scale.value, translateX.value, translateY.value, rotation.value
      );
    });

  /** Simultaneous: tümü aynı anda */
  const composedGesture = Gesture.Simultaneous(
    panGesture,
    Gesture.Simultaneous(pinchGesture, rotationGesture)
  );

  // ── Animasyonlu stil ──────────────────────────────────────────────────
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotation.value}rad` },
    ],
  }));

  // ── Sıfırla ───────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    lightImpact();
    scale.value         = withSpring(1, { damping: 14 });
    savedScale.value    = 1;
    rotation.value      = withSpring(0, { damping: 14 });
    savedRotation.value = 0;
    translateX.value    = withSpring(0, { damping: 14 });
    savedTransX.value   = 0;
    translateY.value    = withSpring(0, { damping: 14 });
    savedTransY.value   = 0;
    transformRef.current = { scale: 1, translateX: 0, translateY: 0, rotationRad: 0, rotationDeg: 0 };
  }, []);

  // ── AŞAMA 2: Görsel İşleme ────────────────────────────────────────────
  const handleConfirm = useCallback(async () => {
    mediumImpact();
    setProcessing(true);

    try {
      // Eğer ekranda yazı varsa ImageManipulator yerine ViewShot kullanarak tamamını kaydediyoruz
      if (texts.length > 0 && viewShotRef.current?.capture) {
        const snapshotUri = await viewShotRef.current.capture();
        onConfirm(snapshotUri, transformRef.current);
        setProcessing(false);
        return;
      }

      const td = transformRef.current;
      const actions: ImageManipulator.Action[] = [];

      /**
       * Döndürme: ImageManipulator sadece 90° katlarını destekler.
       * Küçük açılar (<10°) için döndürme yapmıyoruz (görsel bütünlüğü korur).
       * Tam 90/180/270 yapılmışsa uyguluyoruz.
       */
      const degAbs = Math.abs(td.rotationDeg % 360);
      if (degAbs >= 85 && degAbs <= 95) {
        actions.push({ rotate: td.rotationDeg > 0 ? 90 : -90 });
      } else if (degAbs >= 175 && degAbs <= 185) {
        actions.push({ rotate: 180 });
      } else if (degAbs >= 265 && degAbs <= 275) {
        actions.push({ rotate: td.rotationDeg > 0 ? 270 : -270 });
      }

      /**
       * Kırpma + ölçekleme:
       * Ekranın 9:16 oranı baz alınarak görünür alan hesaplanır.
       * translateX/Y: görsel merkezinin kaydırma miktarı (piksel)
       * scale: zoom katsayısı
       *
       * origW/origH bilinmiyorsa sadece resize yapıyoruz.
       */
      if (originalWidth && originalHeight) {
        // Ekranda görünen görüntünün gerçek piksel ölçeği
        const displayRatio = SW / originalWidth;
        const scaledOrigW = originalWidth * td.scale;
        const scaledOrigH = originalHeight * td.scale;

        // Kırpma merkezi (orijinal piksel koordinatında)
        const centerX = originalWidth / 2 - (td.translateX / displayRatio / td.scale);
        const centerY = originalHeight / 2 - (td.translateY / displayRatio / td.scale);

        // Görünür alan (9:16 oranında story canvas)
        const visibleW = Math.min(SW / displayRatio / td.scale, originalWidth);
        const visibleH = Math.min((SW * 16 / 9) / displayRatio / td.scale, originalHeight);

        const cropOriginX = Math.max(0, centerX - visibleW / 2);
        const cropOriginY = Math.max(0, centerY - visibleH / 2);
        const cropWidth   = Math.min(visibleW, originalWidth - cropOriginX);
        const cropHeight  = Math.min(visibleH, originalHeight - cropOriginY);

        if (cropWidth > 10 && cropHeight > 10) {
          actions.push({
            crop: {
              originX: Math.round(cropOriginX),
              originY: Math.round(cropOriginY),
              width: Math.round(cropWidth),
              height: Math.round(cropHeight),
            },
          });
          // Backend'e gönderilecek metadata
          td.crop = {
            originX: Math.round(cropOriginX),
            originY: Math.round(cropOriginY),
            width: Math.round(cropWidth),
            height: Math.round(cropHeight),
          };
        }
      }

      // Son çözünürlük: 1080×1920 (Instagram story standardı)
      actions.push({ resize: { width: 1080 } });

      let processedUri = uri;
      if (actions.length > 0) {
        const result = await ImageManipulator.manipulateAsync(uri, actions, {
          compress: 0.88,
          format: ImageManipulator.SaveFormat.JPEG,
        });
        processedUri = result.uri;
      }

      onConfirm(processedUri, transformRef.current);
    } catch (err) {
      console.warn('[StoryMediaEditor] ImageManipulator hatası:', err);
      Alert.alert('İşlem Hatası', 'Görsel işlenirken bir sorun oluştu. Lütfen tekrar deneyin.');
      // Hata durumunda ham URI ile devam et
      onConfirm(uri, transformRef.current);
    } finally {
      setProcessing(false);
    }
  }, [uri, originalWidth, originalHeight, onConfirm]);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Siyah tuval - ViewShot ile sarmalanmış */}
      <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.canvas}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.mediaWrapper, animatedStyle]}>
            <Image source={{ uri }} style={styles.media} contentFit="contain" />
          </Animated.View>
        </GestureDetector>
        
        {/* Metinler */}
        {texts.map((t, i) => (
          <DraggableText key={i} text={t} />
        ))}

        {/* 3×3 kompozisyon kılavuz çizgileri */}
        <View style={styles.grid} pointerEvents="none">
          {[1, 2].map((i) => (
            <View key={`h${i}`} style={[styles.gridLine, styles.gridLineH, { top: `${(i / 3) * 100}%` as any }]} />
          ))}
          {[1, 2].map((i) => (
            <View key={`v${i}`} style={[styles.gridLine, styles.gridLineV, { left: `${(i / 3) * 100}%` as any }]} />
          ))}
        </View>
      </ViewShot>

      {/* ── Üst bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.topBtn}
          onPress={onCancel}
          disabled={processing}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="xmark" size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>Düzenle</Text>

        {/* Metin Ekle Butonu */}
        <TouchableOpacity
          style={styles.topBtn}
          onPress={() => {
            lightImpact();
            setTexts([...texts, 'Yeni Yazı']);
          }}
          disabled={processing}
          activeOpacity={0.75}
        >
          <IconSymbol name="textformat" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.topBtn}
          onPress={handleReset}
          disabled={processing}
          activeOpacity={0.75}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="arrow.counterclockwise" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Alt bar ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]} pointerEvents="box-none">
        <Text style={styles.hint}>İki parmakla büyüt, döndür veya kaydır</Text>

        <TouchableOpacity
          style={[styles.confirmBtn, processing && styles.confirmBtnDisabled]}
          onPress={handleConfirm}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.confirmText}>İşleniyor...</Text>
            </>
          ) : (
            <>
              <Text style={styles.confirmText}>Devam Et</Text>
              <IconSymbol name="chevron.right" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

// ── Stiller ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvas: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mediaWrapper: {
    width: SW,
    height: SH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: {
    width: SW,
    height: SH,
  },
  // ── Grid ──
  grid: { ...StyleSheet.absoluteFillObject },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  gridLineH: { left: 0, right: 0, height: StyleSheet.hairlineWidth },
  gridLineV: { top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  // ── Top Bar ──
  topBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  topBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.3,
  },
  // ── Bottom Bar ──
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.38)',
    zIndex: 10,
  },
  hint: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#4ade80',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  confirmBtnDisabled: {
    backgroundColor: '#6b7280',
    shadowOpacity: 0.1,
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
