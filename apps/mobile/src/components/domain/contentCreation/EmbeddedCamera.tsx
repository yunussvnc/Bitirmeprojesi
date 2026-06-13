/**
 * EmbeddedCamera – Premium embedded full-screen camera
 *
 * expo-camera ile uygulamanın içinde gömülü kamera.
 * Fotoğraf çekme, video kayıt, ön/arka geçiş, flaş kontrolü.
 * Story & Reels modlarında tam ekran (9:16).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions, FlashMode } from 'expo-camera';
import { useTranslation } from 'react-i18next';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';
import type { MediaItem, ContentType } from '@/src/contentCreation/types';
import { MAX_VIDEO_DURATION_SEC } from '@/src/contentCreation/config';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface EmbeddedCameraProps {
  contentType: ContentType;
  onCapture: (item: MediaItem) => void;
  onGalleryPress: () => void;
  /** Latest gallery thumbnail URI */
  lastPhotoUri?: string | null;
}

export function EmbeddedCamera({
  contentType,
  onCapture,
  onGalleryPress,
  lastPhotoUri,
}: EmbeddedCameraProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [capturing, setCapturing] = useState(false);
  // Kamera hazır olana kadar deklanşör devre dışı
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRecordingRef = useRef(false);
  const maxVideoSec = MAX_VIDEO_DURATION_SEC[contentType];

  // Animations
  const shutterScale = useSharedValue(1);
  const flipRotation = useSharedValue(0);
  const recordPulse = useSharedValue(1);
  const shutterRingProgress = useSharedValue(0);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
    if (contentType === 'story' && !micPermission?.granted) {
      requestMicPermission();
    }
  }, [permission, micPermission, contentType]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  // Recording pulse animation
  useEffect(() => {
    if (isRecording) {
      recordPulse.value = withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) });
      const interval = setInterval(() => {
        recordPulse.value = withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 })
        );
      }, 1200);
      return () => clearInterval(interval);
    } else {
      recordPulse.value = withTiming(1, { duration: 200 });
    }
  }, [isRecording]);

  const handleFlipCamera = useCallback(() => {
    lightImpact();
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
    flipRotation.value = withSpring(flipRotation.value + 180, { damping: 15, stiffness: 150 });
  }, []);

  const handleFlashToggle = useCallback(() => {
    lightImpact();
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }, []);

  const takePhoto = useCallback(async () => {
    if (!cameraRef.current || capturing || !isCameraReady) return;
    setCapturing(true);
    mediumImpact();
    shutterScale.value = withSequence(
      withSpring(0.85, { damping: 15 }),
      withSpring(1, { damping: 12 })
    );

    try {
      // skipProcessing:false → iOS'ta EXIF rotasyonu otomatik düzeltilir
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.92,
        skipProcessing: false,
      });
      if (photo) {
        onCapture({
          uri: photo.uri,
          type: 'image',
          width: photo.width,
          height: photo.height,
        });
      }
    } catch (e) {
      console.warn('Photo capture error:', e);
      Alert.alert(t('home.error_title'), t('creation.capture_failed'));
    } finally {
      setCapturing(false);
    }
  }, [capturing, isCameraReady, onCapture]);

  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    isRecordingRef.current = false;
    setIsRecording(false);
    shutterRingProgress.value = withTiming(0, { duration: 200 });
    try {
      cameraRef.current?.stopRecording();
    } catch {
      // Camera may already have stopped
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!cameraRef.current || isRecordingRef.current) return;
    isRecordingRef.current = true;
    setIsRecording(true);
    mediumImpact();
    setRecordDuration(0);

    shutterRingProgress.value = withTiming(1, {
      duration: maxVideoSec * 1000,
      easing: Easing.linear,
    });

    recordTimerRef.current = setInterval(() => {
      setRecordDuration((prev) => {
        if (prev >= maxVideoSec - 1) {
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    try {
      const video = await cameraRef.current.recordAsync({
        maxDuration: maxVideoSec,
      });
      if (video) {
        onCapture({
          uri: video.uri,
          type: 'video',
          duration: recordDuration * 1000,
        });
      }
    } catch (e) {
      console.warn('Video record error:', e);
    } finally {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
  }, [maxVideoSec, onCapture, stopRecording]);

  // onPressIn → anlık fotoğraf çekimi (onPress'e kıyasla ~300ms daha hızlı)
  const handleShutterPressIn = useCallback(() => {
    if (!isRecordingRef.current) {
      takePhoto();
    }
  }, [takePhoto]);

  const handleShutterLongPress = useCallback(() => {
    if (contentType !== 'post') {
      startRecording();
    }
  }, [contentType, startRecording]);

  const handleShutterRelease = useCallback(() => {
    if (isRecordingRef.current) {
      stopRecording();
    }
  }, [stopRecording]);

  // Animated styles
  const shutterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shutterScale.value }],
  }));

  const flipAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${flipRotation.value}deg` }],
  }));

  const recordPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordPulse.value }],
  }));

  const flashIconName = flash === 'off' ? 'bolt.slash.fill' : flash === 'on' ? 'bolt.fill' : 'bolt.badge.automatic.fill';

  // Format duration
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Permission not yet checked
  if (!permission || (contentType === 'story' && !micPermission)) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: '#000' }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </View>
    );
  }

  // Permission denied
  const isMicDenied = contentType === 'story' && (!micPermission || !micPermission.granted);
  if (!permission.granted || isMicDenied) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: '#000' }]}>
        <View style={styles.permissionCard}>
          <IconSymbol name="camera.circle.fill" size={64} color="#667eea" />
          <Text style={styles.permissionTitle}>
            {isMicDenied && !permission.granted 
              ? "Kamera ve Mikrofon Erişimi" 
              : isMicDenied 
                ? "Mikrofon Erişimi" 
                : t("creation.cam_permission_title")}
          </Text>
          <Text style={styles.permissionText}>
            {contentType === 'story'
              ? "Hikaye oluşturmak için kamera ve mikrofon izinleri gereklidir. Lütfen ayarlardan izin verin."
              : t("creation.cam_permission_desc")}
          </Text>
          <TouchableOpacity
            style={[styles.permissionBtn, { backgroundColor: colors.accent.primary }]}
            onPress={async () => {
              await requestPermission();
              if (contentType === 'story') {
                await requestMicPermission();
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.permissionBtnText}>{t("creation.allow")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* Camera Preview */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash as FlashMode}
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Kamera hazırlanıyor overlay */}
      {!isCameraReady && (
        <View style={styles.cameraLoadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      {/* Top gradient for controls readability */}
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {/* Bottom gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Recording Duration Indicator */}
      {isRecording && (
        <Animated.View style={[styles.recordingBadge, recordPulseStyle]}>
          <View style={styles.recordDot} />
          <Text style={styles.recordTime}>{formatDuration(recordDuration)}</Text>
        </Animated.View>
      )}

      {/* Top Controls */}
      <View style={styles.topControls}>
        {/* Flash */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={handleFlashToggle}
          activeOpacity={0.7}
        >
          <IconSymbol name={flashIconName} size={20} color="#fff" />
        </TouchableOpacity>

        {/* Timer (future feature) */}
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => lightImpact()}
          activeOpacity={0.7}
        >
          <IconSymbol name="timer" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {/* Gallery Shortcut */}
        <TouchableOpacity
          style={styles.galleryThumb}
          onPress={() => {
            lightImpact();
            onGalleryPress();
          }}
          activeOpacity={0.8}
        >
          {lastPhotoUri ? (
            <ExpoImage source={{ uri: lastPhotoUri }} style={styles.galleryThumbImg} contentFit="cover" />
          ) : (
            <View style={[styles.galleryThumbPlaceholder, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <IconSymbol name="photo.on.rectangle" size={20} color="rgba(255,255,255,0.6)" />
            </View>
          )}
        </TouchableOpacity>

        {/* Shutter Button */}
        <Animated.View style={shutterAnimStyle}>
          <TouchableOpacity
            style={[
              styles.shutterOuter,
              isRecording && { borderColor: '#FF3B30' },
            ]}
            onPressIn={handleShutterPressIn}
            onLongPress={handleShutterLongPress}
            onPressOut={handleShutterRelease}
            delayLongPress={400}
            activeOpacity={0.9}
          >
            <View
              style={[
                styles.shutterInner,
                isRecording && styles.shutterRecording,
              ]}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Flip Camera */}
        <Animated.View style={flipAnimStyle}>
          <TouchableOpacity
            style={styles.controlBtnLarge}
            onPress={handleFlipCamera}
            activeOpacity={0.7}
          >
            <IconSymbol name="camera.rotate.fill" size={22} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Capture mode hint */}
      {!isRecording && !isCameraReady && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Kamera hazırlanıyor...</Text>
        </View>
      )}
      {!isRecording && isCameraReady && contentType !== 'post' && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Fotoğraf için dokun, video için basılı tut</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  camera: {
    flex: 1,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 16,
    right: 16,
    gap: 12,
    zIndex: 10,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
  },
  controlBtnLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  shutterInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
  },
  shutterRecording: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
  },
  galleryThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.45)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  galleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  galleryThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingBadge: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,59,48,0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    zIndex: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  recordTime: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  hintBar: {
    position: 'absolute',
    bottom: 130,
    alignSelf: 'center',
    zIndex: 10,
  },
  hintText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  permissionCard: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  permissionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 26,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
