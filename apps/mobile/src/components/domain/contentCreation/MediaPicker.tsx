/**
 * MediaPicker – Premium Content Creation Hub
 *
 * POST MODU  → Split-view: Üst yarı ImageCropper, alt yarı CustomGalleryGrid
 * STORY/REELS → Full-screen: EmbeddedCamera (varsayılan) + galeri alt seçenek
 *
 * Instagram/TikTok seviyesinde Premium deneyim, kendi tasarım dilimiz.
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { Image as ExpoImage } from 'expo-image';
import Video from 'react-native-video';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { spacing } from '@/src/constants/design';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';
import type { MediaItem, ContentType } from '@/src/contentCreation/types';
import { MAX_MEDIA_COUNT } from '@/src/contentCreation/config';
import { CustomGalleryGrid } from './CustomGalleryGrid';
import { EmbeddedCamera } from './EmbeddedCamera';
import { ImageCropper, ImageCropperRef } from './ImageCropper';
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Resizable split heights
const MIN_PREVIEW_HEIGHT = 180;
const MAX_PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.55;
const DEFAULT_PREVIEW_HEIGHT = SCREEN_HEIGHT * 0.42;

export interface MediaPickerProps {
  contentType: ContentType;
  selected: MediaItem[];
  onSelect: (items: MediaItem[]) => void;
  onNext: (items?: MediaItem[]) => void;
  onClose: () => void;
  quality?: number;
}

type PickerMode = 'gallery' | 'camera';

export function MediaPicker({
  contentType,
  selected,
  onSelect,
  onNext,
  onClose,
  quality = 0.9,
}: MediaPickerProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const isPostMode = contentType === 'post';
  const isStoryOrReels = contentType === 'story' || contentType === 'reels';
  const maxCount = MAX_MEDIA_COUNT[contentType];

  const [mode, setMode] = useState<PickerMode>(isStoryOrReels ? 'camera' : 'gallery');
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(() => {
    return selected.length > 0 ? selected[selected.length - 1] : null;
  });
  const [lastPhotoUri, setLastPhotoUri] = useState<string | null>(null);
  const [isMultiSelect, setIsMultiSelect] = useState(() => selected.length > 1);

  // 1:1 kare olması için genişliği baz alıyoruz
  const dynamicPreviewHeight = SCREEN_WIDTH;

  const cropperRef = useRef<ImageCropperRef>(null);

  // (split-view gesture removed — height is now derived from image aspect ratio)

  // Sync state when navigating back from share screen
  useEffect(() => {
    if (selected.length > 0 && previewItem === null) {
      setPreviewItem(selected[selected.length - 1]);
    }
    if (selected.length > 1 && !isMultiSelect) {
      setIsMultiSelect(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Load last photo for camera gallery shortcut
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const result = await MediaLibrary.getAssetsAsync({ first: 1, sortBy: [MediaLibrary.SortBy.creationTime] });
        if (result.assets.length > 0) {
          setLastPhotoUri(result.assets[0].uri);
        }
      }
    })();
  }, []);

  const handlePreviewChange = useCallback((item: MediaItem | null) => {
    setPreviewItem(item);
  }, []);

  const handleCameraCapture = useCallback((item: MediaItem) => {
    onSelect([item]);
    onNext([item]);
  }, [onSelect, onNext]);

  const handleSingleSelect = useCallback((item: MediaItem) => {
    onSelect([item]);
    // Story/Reels modunda seçilen medyayı doğrudan onNext'e aktar
    setTimeout(() => onNext([item]), 150);
  }, [onSelect, onNext]);

  const handleNext = useCallback(async () => {
    if (selected.length === 0) return;
    mediumImpact();

    if (isPostMode && cropperRef.current) {
      const croppedUri = await cropperRef.current.cropImage();
      if (croppedUri) {
        const newSelected = [...selected];
        const previewIndex = newSelected.findIndex(s => s.uri === previewItem?.uri);
        if (previewIndex !== -1) {
          newSelected[previewIndex] = { ...newSelected[previewIndex], uri: croppedUri };
        } else {
          newSelected[0] = { ...newSelected[0], uri: croppedUri };
        }
        
        onSelect(newSelected);
        setTimeout(() => onNext(), 150);
        return;
      }
    }

    onNext();
  }, [selected, onNext, previewItem, isPostMode, onSelect]);

  // ─────────────────────────────────────────────────────────
  // POST MODE — Split-View: Cropper + Gallery Grid
  // ─────────────────────────────────────────────────────────
  if (isPostMode) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View style={[styles.postHeader, { borderBottomColor: colors.surface.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.headerBtnPost, { backgroundColor: colors.surface.elevated }]} hitSlop={12}>
            <IconSymbol name="xmark" size={18} color={colors.text.primary} />
          </TouchableOpacity>

          <Text style={[styles.postTitle, { color: colors.text.primary }]}>{t("content_creation.new_post")}</Text>

          <View style={styles.headerRightGroup}>
            {/* Multi-select indicator */}
            {selected.length > 1 && (
              <View style={[styles.countBadge, { backgroundColor: colors.accent.primary }]}>
                <Text style={styles.countText}>{selected.length}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.nextBtnPost,
                { backgroundColor: selected.length > 0 ? colors.accent.primary : colors.surface.border + '60' },
              ]}
              onPress={handleNext}
              disabled={selected.length === 0}
              activeOpacity={0.8}
            >
              <Text style={[styles.nextBtnText, { color: selected.length > 0 ? '#000' : colors.text.tertiary }]}>
                {t("content_creation.next")}
              </Text>
              <IconSymbol name="chevron.right" size={13} color={selected.length > 0 ? '#000' : colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Preview — Sadece Görselleme */}
        <View style={[styles.previewSection, { height: dynamicPreviewHeight, backgroundColor: 'transparent' }]}>
          {previewItem ? (
            previewItem.type === 'video' ? (
              <Video
                source={{ uri: previewItem.uri }}
                style={{ width: SCREEN_WIDTH, height: dynamicPreviewHeight }}
                resizeMode="cover"
                paused={false}
                repeat={true}
                muted={true}
              />
            ) : (
              <ExpoImage
                source={{ uri: previewItem.uri }}
                style={{ width: SCREEN_WIDTH, height: dynamicPreviewHeight }}
                contentFit="cover"
              />
            )
          ) : (
            <View style={styles.emptyPreview}>
              <IconSymbol name="photo.on.rectangle.angled" size={44} color="rgba(255,255,255,0.25)" />
              <Text style={styles.emptyPreviewText}>{t("content_creation.select_media")}</Text>
            </View>
          )}
        </View>

        {/* Separator */}
        <View style={[styles.dragHandle, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.dragPill, { backgroundColor: colors.text.tertiary + '30' }]} />
        </View>

        {/* Mode Toggle Bar */}
        <View style={[styles.modeBar, { backgroundColor: colors.background.primary }]}>
          <TouchableOpacity
            style={[styles.modeTab]}
            onPress={() => { lightImpact(); setMode('gallery'); }}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="photo.on.rectangle"
              size={18}
              color={mode === 'gallery' ? colors.accent.primary : colors.text.tertiary}
            />
            <Text style={[
              styles.modeLabel,
              { color: mode === 'gallery' ? colors.accent.primary : colors.text.tertiary },
            ]}>
              {t("content_creation.gallery")}
            </Text>
            {/* Active indicator line */}
            {mode === 'gallery' && <View style={[styles.activeIndicator, { backgroundColor: colors.accent.primary }]} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab]}
            onPress={() => { lightImpact(); setMode('camera'); }}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="camera.fill"
              size={18}
              color={mode === 'camera' ? colors.accent.primary : colors.text.tertiary}
            />
            <Text style={[
              styles.modeLabel,
              { color: mode === 'camera' ? colors.accent.primary : colors.text.tertiary },
            ]}>
              {t("content_creation.camera")}
            </Text>
            {mode === 'camera' && <View style={[styles.activeIndicator, { backgroundColor: colors.accent.primary }]} />}
          </TouchableOpacity>

          <View style={{ flex: 1 }} />
          {mode === 'gallery' && (
            <TouchableOpacity
              style={[
                styles.multiSelectBtn,
                isMultiSelect ? { backgroundColor: colors.accent.primary } : { backgroundColor: colors.surface.elevated }
              ]}
              onPress={() => {
                lightImpact();
                if (isMultiSelect) {
                  // Going from Multi to Single: keep only previewItem
                  if (previewItem) {
                    onSelect([previewItem]);
                  } else if (selected.length > 0) {
                    onSelect([selected[0]]);
                    handlePreviewChange(selected[0]);
                  }
                }
                setIsMultiSelect(!isMultiSelect);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="square.on.square.squareshape.controlhandles" size={16} color={isMultiSelect ? '#000' : colors.text.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom half: Gallery or Camera */}
        <View style={styles.bottomSection}>
          {mode === 'gallery' ? (
            <CustomGalleryGrid
              contentType={contentType}
              selected={selected}
              onSelect={onSelect}
              onPreviewChange={handlePreviewChange}
              multiSelectMode={isMultiSelect}
            />
          ) : (
            <EmbeddedCamera
              contentType={contentType}
              onCapture={(item) => {
                onSelect([...selected, item].slice(0, maxCount));
                handlePreviewChange(item);
                setMode('gallery');
              }}
              onGalleryPress={() => { lightImpact(); setMode('gallery'); }}
              lastPhotoUri={lastPhotoUri}
            />
          )}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────
  // STORY / REELS MODE — Full-Screen Camera (default) / Gallery
  // ─────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      <StatusBar barStyle="light-content" />

      {/* Close button (floating) */}
      <View style={[styles.storyTopBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.floatingCloseBtn}
          onPress={onClose}
          hitSlop={12}
        >
          <IconSymbol name="xmark" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.storyTopRight}>
          {mode === 'camera' && (
            <TouchableOpacity
              style={styles.floatingIconBtn}
              onPress={() => { lightImpact(); Alert.alert('Yakında', 'Efekt ve filtre özelliği yakında aktif olacaktır.'); }}
              activeOpacity={0.7}
            >
              <IconSymbol name="sparkles" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      {mode === 'camera' ? (
        <EmbeddedCamera
          contentType={contentType}
          onCapture={handleCameraCapture}
          onGalleryPress={() => { lightImpact(); setMode('gallery'); }}
          lastPhotoUri={lastPhotoUri}
        />
      ) : (
        <View style={styles.storyGalleryWrap}>
          {/* Gallery Header */}
          <View style={[styles.storyGalleryHeader, { paddingTop: insets.top + 56 }]}>
            <Text style={styles.storyGalleryTitle}>{t("content_creation.gallery")}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Native galeri butonu */}
              <TouchableOpacity
                style={[styles.cameraSwitchBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
                onPress={async () => {
                  lightImpact();
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ['images', 'videos'],
                      quality: quality,
                      allowsEditing: false,
                    });
                    if (!result.canceled && result.assets.length > 0) {
                      const asset = result.assets[0];
                      const item: MediaItem = {
                        uri: asset.uri,
                        type: asset.type === 'video' ? 'video' : 'image',
                        width: asset.width ?? undefined,
                        height: asset.height ?? undefined,
                        duration: asset.duration ? asset.duration * 1000 : undefined,
                      };
                      onSelect([item]);
                      onNext([item]);
                    }
                  } catch (e) {
                    console.warn('Native picker error:', e);
                  }
                }}
                activeOpacity={0.8}
              >
                <IconSymbol name="photo.on.rectangle.angled" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cameraSwitchBtn, { backgroundColor: colors.accent.primary }]}
                onPress={() => { lightImpact(); setMode('camera'); }}
                activeOpacity={0.8}
              >
                <IconSymbol name="camera.fill" size={16} color="#000" />
                <Text style={styles.cameraSwitchText}>{t("content_creation.camera")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <CustomGalleryGrid
            contentType={contentType}
            selected={selected}
            onSelect={onSelect}
            onSingleSelect={handleSingleSelect}
          />
        </View>
      )}

      {/* Bottom mode label for Story/Reels */}
      {mode === 'camera' && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.storyBottomOverlay, { paddingBottom: insets.bottom + 8 }]}
        >
          <View style={styles.storyModeTabs}>
            <View style={styles.modePill}>
              <Text style={[styles.storyModeLabel, { color: colors.accent.primary }]}>
                {contentType === 'reels' ? 'REELS' : 'HİKAYE'}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── POST MODE ──
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtnPost: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  nextBtnPost: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 3,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  previewSection: {
    width: SCREEN_WIDTH,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPreview: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyPreviewText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
    fontWeight: '600',
  },
  dragHandle: {
    width: '100%',
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragPill: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modeBar: {
    flexDirection: 'row',
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2.5,
    borderRadius: 1.5,
  },
  multiSelectBtn: {
    padding: 8,
    borderRadius: 20,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomSection: {
    flex: 1,
  },

  // ── STORY / REELS MODE ──
  storyTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 20,
  },
  storyTopRight: {
    flexDirection: 'row',
    gap: 12,
  },
  floatingCloseBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  floatingIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  storyGalleryWrap: {
    flex: 1,
  },
  storyGalleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  storyGalleryTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  cameraSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cameraSwitchText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  storyBottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  storyModeTabs: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  modePill: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  storyModeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
