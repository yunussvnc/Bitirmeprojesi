/**
 * MediaPicker – Kamera + galeri, çoklu seçim, doğrulama
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { spacing, radius } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';
import type { MediaItem, ContentType } from '@/src/contentCreation/types';
import {
  MAX_MEDIA_COUNT,
  MAX_VIDEO_DURATION_SEC,
  MAX_FILE_SIZE_MB,
  STORY_ASPECT,
  REELS_ASPECT,
} from '@/src/contentCreation/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SIZE = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * 3) / 4;

export interface MediaPickerProps {
  contentType: ContentType;
  selected: MediaItem[];
  onSelect: (items: MediaItem[]) => void;
  quality?: number;
}

export function MediaPicker({
  contentType,
  selected,
  onSelect,
  quality = 0.9,
}: MediaPickerProps) {
  const { colors } = useTheme();
  const maxCount = MAX_MEDIA_COUNT[contentType];
  const maxVideoSec = MAX_VIDEO_DURATION_SEC[contentType];
  const aspect = contentType === 'reels' ? REELS_ASPECT : STORY_ASPECT;
  const isStoryOrReels = contentType === 'story' || contentType === 'reels';
  const singleOnly = isStoryOrReels;

  const validateAsset = useCallback(
    (asset: ImagePicker.ImagePickerAsset): string | null => {
      const isVideo = asset.type === 'video';
      if (isVideo && asset.duration != null) {
        const durSec = asset.duration / 1000;
        if (durSec > maxVideoSec) {
          return `Video en fazla ${maxVideoSec} saniye olabilir.`;
        }
      }
      if (asset.fileSize != null && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
        return `Dosya boyutu ${MAX_FILE_SIZE_MB}MB'dan küçük olmalıdır.`;
      }
      return null;
    },
    [maxVideoSec]
  );

  const pickFromGallery = useCallback(async () => {
    lightImpact();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Medya seçmek için galeri erişimine izin verin.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: !singleOnly,
      selectionLimit: singleOnly ? 1 : maxCount - selected.length,
      allowsEditing: singleOnly,
      aspect: singleOnly ? aspect : undefined,
      quality,
    });
    if (result.canceled || !result.assets?.length) return;

    const newItems: MediaItem[] = result.assets
      .map((a) => {
        const err = validateAsset(a);
        if (err) {
          Alert.alert('Uygun değil', err);
          return null;
        }
        return {
          uri: a.uri,
          type: a.type === 'video' ? 'video' : 'image',
          width: a.width,
          height: a.height,
          duration: a.duration ?? undefined,
          fileSize: a.fileSize,
        };
      })
      .filter((x) => x !== null) as MediaItem[];

    if (newItems.length > 0) {
      onSelect(singleOnly ? newItems : [...selected, ...newItems].slice(0, maxCount));
    }
  }, [singleOnly, maxCount, selected, aspect, quality, validateAsset, onSelect]);

  const pickFromCamera = useCallback(async () => {
    lightImpact();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin gerekli', 'Fotoğraf/video çekmek için kamera erişimine izin verin.');
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: true,
        aspect,
        quality,
        videoMaxDuration: maxVideoSec,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const a = result.assets[0];
      const err = validateAsset(a);
      if (err) {
        Alert.alert('Uygun değil', err);
        return;
      }
      onSelect([
        {
          uri: a.uri,
          type: a.type === 'video' ? 'video' : 'image',
          width: a.width,
          height: a.height,
          duration: a.duration ?? undefined,
          fileSize: a.fileSize,
        },
      ]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const isSimulator = /simulator|not available/i.test(msg);
      Alert.alert(
        'Kamera kullanılamıyor',
        isSimulator
          ? 'Simülatörde kamera desteklenmez. Lütfen galeriden seçin veya gerçek cihazda deneyin.'
          : 'Kamera başlatılamadı. Lütfen izinleri kontrol edin veya galeriden seçin.',
        [{ text: 'Tamam' }, { text: 'Galeriden seç', onPress: pickFromGallery }]
      );
    }
  }, [aspect, quality, maxVideoSec, validateAsset, onSelect, pickFromGallery]);

  const removeAt = useCallback(
    (index: number) => {
      lightImpact();
      onSelect(selected.filter((_, i) => i !== index));
    },
    [selected, onSelect]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.sourceBtn, { backgroundColor: colors.surface.elevated }]}
          onPress={pickFromCamera}
          activeOpacity={0.8}
        >
          <IconSymbol name="camera.fill" size={28} color={colors.accent.primary} />
          <Text style={[styles.sourceLabel, { color: colors.text.secondary }]}>Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sourceBtn, { backgroundColor: colors.surface.elevated }]}
          onPress={pickFromGallery}
          activeOpacity={0.8}
        >
          <IconSymbol name="photo" size={28} color={colors.accent.primary} />
          <Text style={[styles.sourceLabel, { color: colors.text.secondary }]}>Galeri</Text>
        </TouchableOpacity>
      </View>

      {selected.length > 0 && (
        <View style={styles.previewSection}>
          <Text style={[styles.previewLabel, { color: colors.text.secondary }]}>
            Seçilen medya ({selected.length}/{maxCount})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.previewRow}
          >
            {selected.map((item, idx) => (
              <View key={`${item.uri}-${idx}`} style={styles.previewItem}>
                {item.type === 'video' ? (
                  <ExpoImage
                    source={{ uri: item.uri }}
                    style={[styles.previewImg, { width: PREVIEW_SIZE, height: PREVIEW_SIZE * (aspect[1] / aspect[0]) }]}
                    contentFit="cover"
                  />
                ) : (
                  <ExpoImage
                    source={{ uri: item.uri }}
                    style={[styles.previewImg, { width: PREVIEW_SIZE, height: PREVIEW_SIZE * (aspect[1] / aspect[0]) }]}
                    contentFit="cover"
                  />
                )}
                {item.type === 'video' && (
                  <View style={styles.videoBadge}>
                    <IconSymbol name="play.fill" size={12} color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.removeBtn, { backgroundColor: colors.semantic.error }]}
                  onPress={() => removeAt(idx)}
                >
                  <IconSymbol name="xmark" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
            {selected.length < maxCount && (
              <TouchableOpacity
                style={[
                  styles.addMore,
                  {
                    width: PREVIEW_SIZE,
                    height: PREVIEW_SIZE * (aspect[1] / aspect[0]),
                    borderColor: colors.surface.border,
                    backgroundColor: colors.surface.elevated,
                  },
                ]}
                onPress={pickFromGallery}
              >
                <IconSymbol name="plus" size={24} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {selected.length === 0 && (
        <TouchableOpacity
          style={[styles.placeholder, { backgroundColor: colors.surface.elevated }]}
          onPress={pickFromGallery}
          activeOpacity={0.8}
        >
          <IconSymbol name="photo" size={56} color={colors.text.tertiary} />
          <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>
            Fotoğraf veya video seç
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.base, marginBottom: spacing.lg },
  sourceBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  sourceLabel: { fontSize: 14, fontWeight: '600' },
  previewSection: { marginBottom: spacing.lg },
  previewLabel: { fontSize: 13, marginBottom: spacing.sm, fontWeight: '500' },
  previewRow: { flexDirection: 'row', gap: spacing.sm },
  previewItem: { position: 'relative' },
  previewImg: { borderRadius: 12, overflow: 'hidden' },
  videoBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMore: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    aspectRatio: 9 / 16,
    maxHeight: 320,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  placeholderText: { fontSize: 16, fontWeight: '600' },
});
