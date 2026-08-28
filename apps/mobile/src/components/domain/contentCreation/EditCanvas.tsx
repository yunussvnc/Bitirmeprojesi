/**
 * EditCanvas – Premium Feed Post düzenleme alanı
 * Standart gönderi mantığına uygun: Sabit önizleme, alt tarafta filtreler
 */

import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import Video from 'react-native-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from "react-i18next";
import { radius } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';
import { useTheme } from '@/src/hooks/useTheme';
import type { MediaItem, FilterPreset, TextOverlay } from '@/src/contentCreation/types';
import { ImageCropper, ImageCropperRef } from './ImageCropper';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FILTER_OVERLAYS: Record<FilterPreset, { bg: string; opacity: number } | null> = {
  none: null,
  warm: { bg: '#FF9A56', opacity: 0.15 },
  cool: { bg: '#5B9BD5', opacity: 0.12 },
  vintage: { bg: '#8B4513', opacity: 0.2 },
  dramatic: { bg: '#1A1A2E', opacity: 0.25 },
};

export interface EditCanvasProps {
  media: MediaItem;
  allMedia?: MediaItem[];
  editIndex?: number;
  onEditIndexChange?: (index: number) => void;
  textOverlays: TextOverlay[]; // Korunuyor, ancak Feed postlarında metin yazılmaz.
  onTextOverlaysChange: (t: TextOverlay[]) => void;
  onDone: (croppedUri?: string, filter?: FilterPreset, cropState?: { scale: number; translateX: number; translateY: number }) => void;
  onBack: () => void;
}

export function EditCanvas({
  media,
  allMedia = [],
  editIndex = 0,
  onEditIndexChange,
  textOverlays,
  onTextOverlaysChange,
  onDone,
  onBack,
}: EditCanvasProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cropperRef = useRef<ImageCropperRef>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<FilterPreset>(media.filter || 'none');

  const filterOverlay = FILTER_OVERLAYS[filter];
  const baseUri = media.originalUri || media.uri;

  const handleDone = async () => {
    if (media.type === 'video') {
      onDone(undefined, filter, media.cropState); // Videolarda kırpma şimdilik yok
      return;
    }
    setIsProcessing(true);
    if (cropperRef.current) {
      const uri = await cropperRef.current.cropImage();
      const cropState = cropperRef.current.getCropState();
      setIsProcessing(false);
      onDone(uri || undefined, filter, cropState);
    } else {
      setIsProcessing(false);
      onDone(undefined, filter, media.cropState);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary, paddingTop: insets.top }]}>
      
      {/* 1) Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={12} activeOpacity={0.7}>
          <Text style={[styles.nextText, { color: colors.text.primary, fontWeight: '500' }]}>{t('create.cancel', 'Vazgeç')}</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>{t('create.edit_post', 'Düzenle')}</Text>
        <TouchableOpacity onPress={handleDone} style={styles.headerBtnRight} hitSlop={12} activeOpacity={0.7} disabled={isProcessing}>
          {isProcessing ? (
            <ActivityIndicator size="small" color={colors.accent.primary} />
          ) : (
            <Text style={[styles.nextText, { color: colors.accent.primary }]}>{t('create.done', 'Bitti')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 2) 1:1 Image Preview Area */}
        <View style={[styles.canvasWrap, { backgroundColor: colors.surface.border }]}>
          {media.type === 'video' ? (
            <View style={StyleSheet.absoluteFill}>
              <Video
                source={{ uri: baseUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                paused={false}
                repeat={true}
              />
              {filterOverlay && (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: filterOverlay.bg, opacity: filterOverlay.opacity },
                  ]}
                  pointerEvents="none"
                />
              )}
            </View>
          ) : (
            <ImageCropper
              ref={cropperRef}
              imageUri={baseUri}
              imageWidth={media.width || 1080}
              imageHeight={media.height || 1080}
              containerHeight={SCREEN_WIDTH}
              filterOverlay={filterOverlay}
              initialCropState={media.cropState}
            />
          )}
        </View>

        {/* 3) Thumbnail Strip for Multi-Select */}
        {allMedia.length > 1 && (
          <View style={styles.thumbnailStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStripContent}>
              {allMedia.map((m, idx) => (
                <TouchableOpacity
                  key={`${m.uri}-${idx}`}
                  style={[
                    styles.thumbnailWrap,
                    editIndex === idx && { borderColor: colors.accent.primary, borderWidth: 2 }
                  ]}
                  onPress={() => {
                    lightImpact();
                    onEditIndexChange?.(idx);
                  }}
                  activeOpacity={0.8}
                >
                  <ExpoImage source={{ uri: m.uri }} style={styles.thumbnailImage} contentFit="cover" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4) Filters Section */}
        <View style={styles.filtersSection}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t('filters.title', 'Filtreler')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {(Object.keys(FILTER_OVERLAYS) as FilterPreset[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterBtn,
                  filter === f && { backgroundColor: colors.surface.border },
                ]}
                onPress={() => {
                  lightImpact();
                  setFilter(f);
                }}
              >
                <View style={[styles.filterPreview, filter === f && { borderColor: colors.accent.primary, borderWidth: 3 }]}>
                  <ExpoImage source={{ uri: baseUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {FILTER_OVERLAYS[f] && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: FILTER_OVERLAYS[f]!.bg, opacity: FILTER_OVERLAYS[f]!.opacity * 2.5 }]} />
                  )}
                </View>
                <Text style={[styles.filterLabel, { color: colors.text.primary }, filter === f && { fontWeight: '700' }]}>
                  {f === 'none' ? t('filters.normal', 'Normal') : f === 'warm' ? t('filters.warm', 'Sıcak') : f === 'cool' ? t('filters.cool', 'Soğuk') : f === 'vintage' ? t('filters.vintage', 'Retro') : t('filters.cinematic', 'Dizi')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  headerBtn: {
    minWidth: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerBtnRight: {
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF', // Standard iOS blue for action
  },
  scrollContent: {
    paddingBottom: 40,
  },
  canvasWrap: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH, // 1:1 Aspect Ratio
    overflow: 'hidden',
  },
  thumbnailStrip: {
    marginTop: 16,
  },
  thumbnailStripContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  thumbnailWrap: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderColor: 'transparent',
    borderWidth: 2,
  },
  thumbnailImage: {
    flex: 1,
  },
  filtersSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  filterBtn: {
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.md,
    padding: 6,
  },
  filterPreview: {
    width: 70,
    height: 70,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderColor: 'transparent',
    borderWidth: 3,
  },
  filterLabel: {
    fontSize: 12,
  },
});
