/**
 * CustomGalleryGrid – Premium in-app gallery grid
 *
 * expo-media-library ile cihazdaki medyayı kendi UI'ımızda listeler.
 * Çoklu seçim, albüm filtresi, video badge, lazy loading.
 */

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { spacing } from '@/src/constants/design';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';
import type { MediaItem, ContentType } from '@/src/contentCreation/types';
import {
  GALLERY_COLUMNS,
  GALLERY_PAGE_SIZE,
  MAX_MEDIA_COUNT,
  MAX_VIDEO_DURATION_SEC,
} from '@/src/contentCreation/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_GAP = 1.5;
const CELL_SIZE = (SCREEN_WIDTH - CELL_GAP * (GALLERY_COLUMNS - 1)) / GALLERY_COLUMNS;

export interface CustomGalleryGridProps {
  contentType: ContentType;
  selected: MediaItem[];
  onSelect: (items: MediaItem[]) => void;
  /** Called when user taps a single item in single-select mode (story/reels) */
  onSingleSelect?: (item: MediaItem) => void;
  /** Highlight the first selected item for preview */
  onPreviewChange?: (item: MediaItem | null) => void;
  /** Explicitly toggle multi selection mechanics */
  multiSelectMode?: boolean;
}

/** Individual grid cell — memoised for performance */
const GalleryCell = memo(function GalleryCell({
  asset,
  isSelected,
  selectionIndex,
  multiSelect,
  onPress,
  accentColor,
}: {
  asset: MediaLibrary.Asset;
  isSelected: boolean;
  selectionIndex: number;
  multiSelect: boolean;
  onPress: () => void;
  accentColor: string;
}) {
  const isVideo = asset.mediaType === 'video';
  const duration = asset.duration ?? 0;
  const mins = Math.floor(duration / 60);
  const secs = Math.floor(duration % 60);
  const durationLabel = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
    >
      <ExpoImage
        source={{ uri: asset.uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        recyclingKey={asset.id}
        cachePolicy="memory-disk"
      />

      {/* Selection dim */}
      {isSelected && <View style={styles.selectedDim} />}

      {/* Video duration badge */}
      {isVideo && (
        <View style={styles.videoBadge}>
          <IconSymbol name="play.fill" size={7} color="#fff" />
          <Text style={styles.videoDuration}>{durationLabel}</Text>
        </View>
      )}

      {/* Selection overlay */}
      {isSelected && (
        <View style={[styles.selectedOverlay, { borderColor: accentColor }]}>
          {multiSelect ? (
            <View style={[styles.selectionBadge, { backgroundColor: accentColor }]}>
              <Text style={styles.selectionIndex}>{selectionIndex}</Text>
            </View>
          ) : (
            <View style={[styles.checkCircle, { backgroundColor: accentColor }]}>
              <IconSymbol name="checkmark" size={12} color="#fff" />
            </View>
          )}
        </View>
      )}

      {/* Unselected faded circle */}
      {!isSelected && multiSelect && (
        <View style={styles.unselectedCircle}>
          <View style={styles.unselectedCircleInner} />
        </View>
      )}
    </TouchableOpacity>
  );
});

export function CustomGalleryGrid({
  contentType,
  selected,
  onSelect,
  onSingleSelect,
  onPreviewChange,
  multiSelectMode = false,
}: CustomGalleryGridProps) {
  const { colors } = useTheme();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<MediaLibrary.Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<MediaLibrary.Album | null>(null);
  const [showAlbumPicker, setShowAlbumPicker] = useState(false);
  const endCursorRef = useRef<string | undefined>(undefined);
  const loadingMoreRef = useRef(false);
  const initialLoadDone = useRef(false);
  const maxCount = MAX_MEDIA_COUNT[contentType];
  const isSingle = contentType === 'story' || contentType === 'reels' || !multiSelectMode;
  const maxVideoSec = MAX_VIDEO_DURATION_SEC[contentType];

  // Request permissions & initial load
  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Galeriye erişim için lütfen izin verin.');
        setLoading(false);
        return;
      }
      // Load albums
      const albumList = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
      setAlbums(albumList);
      await loadAssets(true);
      initialLoadDone.current = true;
    })();
  }, []);

  // Reload when album changes (but not on initial mount)
  useEffect(() => {
    if (initialLoadDone.current) {
      loadAssets(true);
    }
  }, [selectedAlbum]);

  const loadAssets = useCallback(async (reset = false) => {
    if (loadingMoreRef.current && !reset) return;
    loadingMoreRef.current = true;
    if (reset) {
      setLoading(true);
      endCursorRef.current = undefined;
    }

    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: GALLERY_PAGE_SIZE,
        after: reset ? undefined : endCursorRef.current,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
        album: selectedAlbum ?? undefined,
      });

      endCursorRef.current = result.endCursor;
      setHasMore(result.hasNextPage);

      if (reset) {
        setAssets(result.assets);
        // Auto-preview first asset
        if (result.assets.length > 0 && onPreviewChange) {
          const first = result.assets[0];
          const firstItem: MediaItem = {
            uri: first.uri,
            type: first.mediaType === 'video' ? 'video' : 'image',
            width: first.width,
            height: first.height,
            duration: first.duration ? first.duration * 1000 : undefined,
          };
          onPreviewChange(firstItem);
          // Also auto-select the first one for preview
          if (selected.length === 0) {
            onSelect([firstItem]);
          }
        }
      } else {
        setAssets((prev) => [...prev, ...result.assets]);
      }
    } catch (e) {
      console.warn('Gallery load error:', e);
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  }, [selectedAlbum, onPreviewChange, selected.length, onSelect]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !loadingMoreRef.current) {
      loadAssets(false);
    }
  }, [hasMore, loadAssets]);

  const validateAsset = useCallback(
    (asset: MediaLibrary.Asset): string | null => {
      if (asset.mediaType === 'video' && asset.duration != null) {
        if (asset.duration > maxVideoSec) {
          return `Video en fazla ${maxVideoSec} saniye olabilir.`;
        }
      }
      return null;
    },
    [maxVideoSec]
  );

  const handleCellPress = useCallback(
    (asset: MediaLibrary.Asset) => {
      lightImpact();

      const err = validateAsset(asset);
      if (err) {
        Alert.alert('Uygun değil', err);
        return;
      }

      const item: MediaItem = {
        uri: asset.uri,
        type: asset.mediaType === 'video' ? 'video' : 'image',
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? asset.duration * 1000 : undefined,
      };

      if (isSingle) {
        onSelect([item]);
        if (onPreviewChange) onPreviewChange(item);
        if (onSingleSelect) onSingleSelect(item);
        return;
      }

      // Multi-select toggle
      const existingIndex = selected.findIndex((s) => s.uri === asset.uri);
      if (existingIndex >= 0) {
        const newSelected = selected.filter((_, i) => i !== existingIndex);
        onSelect(newSelected);
        if (onPreviewChange) {
          onPreviewChange(newSelected.length > 0 ? newSelected[newSelected.length - 1] : null);
        }
      } else {
        if (selected.length >= maxCount) {
          Alert.alert('Limit', `En fazla ${maxCount} medya seçebilirsiniz.`);
          return;
        }
        mediumImpact();
        const newSelected = [...selected, item];
        onSelect(newSelected);
        if (onPreviewChange) {
          onPreviewChange(item);
        }
      }
    },
    [selected, isSingle, maxCount, onSelect, onSingleSelect, onPreviewChange, validateAsset]
  );

  const renderItem = useCallback(
    ({ item: asset }: { item: MediaLibrary.Asset }) => {
      const selIdx = selected.findIndex((s) => s.uri === asset.uri);
      return (
        <GalleryCell
          asset={asset}
          isSelected={selIdx >= 0}
          selectionIndex={selIdx + 1}
          multiSelect={!isSingle}
          onPress={() => handleCellPress(asset)}
          accentColor={colors.accent.primary}
        />
      );
    },
    [selected, isSingle, handleCellPress, colors.accent.primary]
  );

  const keyExtractor = useCallback((item: MediaLibrary.Asset) => item.id, []);

  if (loading && assets.length === 0) {
    return (
      <View style={[styles.loadingWrap, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator size="large" color={colors.accent.primary} />
        <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Galeri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Album Picker Bar */}
      <TouchableOpacity
        style={[styles.albumBar, { borderBottomColor: colors.surface.border }]}
        onPress={() => {
          lightImpact();
          setShowAlbumPicker(!showAlbumPicker);
        }}
        activeOpacity={0.7}
      >
        <Text style={[styles.albumLabel, { color: colors.text.primary }]}>
          {selectedAlbum?.title ?? 'Son Eklenenler'}
        </Text>
        <IconSymbol
          name={showAlbumPicker ? 'chevron.up' : 'chevron.down'}
          size={12}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Album Dropdown */}
      {showAlbumPicker && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          style={[styles.albumDropdown, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            <TouchableOpacity
              style={[styles.albumItem, !selectedAlbum && { backgroundColor: colors.accent.primary + '18' }]}
              onPress={() => {
                lightImpact();
                setSelectedAlbum(null);
                setShowAlbumPicker(false);
              }}
            >
              <Text style={[styles.albumItemText, { color: !selectedAlbum ? colors.accent.primary : colors.text.primary }]}>
                Son Eklenenler
              </Text>
              {!selectedAlbum && <IconSymbol name="checkmark" size={16} color={colors.accent.primary} />}
            </TouchableOpacity>
            {albums.filter((a) => (a.assetCount ?? 0) > 0).slice(0, 20).map((album) => (
              <TouchableOpacity
                key={album.id}
                style={[styles.albumItem, selectedAlbum?.id === album.id && { backgroundColor: colors.accent.primary + '18' }]}
                onPress={() => {
                  lightImpact();
                  setSelectedAlbum(album);
                  setShowAlbumPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.albumItemText,
                    { color: selectedAlbum?.id === album.id ? colors.accent.primary : colors.text.primary },
                  ]}
                  numberOfLines={1}
                >
                  {album.title}
                </Text>
                <Text style={[styles.albumCount, { color: colors.text.tertiary }]}>
                  {album.assetCount}
                </Text>
                {selectedAlbum?.id === album.id && (
                  <IconSymbol name="checkmark" size={16} color={colors.accent.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Grid */}
      <FlatList
        data={assets}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={GALLERY_COLUMNS}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={GALLERY_PAGE_SIZE}
        maxToRenderPerBatch={24}
        windowSize={7}
        removeClippedSubviews={Platform.OS !== 'web'}
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <IconSymbol name="photo.on.rectangle" size={40} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
              Bu albümde fotoğraf bulunamadı.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  albumBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  albumLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  albumDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 100,
    maxHeight: 320,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  albumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    gap: 8,
  },
  albumItemText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  albumCount: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 4,
  },
  row: {
    gap: CELL_GAP,
    marginBottom: CELL_GAP,
  },
  cell: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  selectedDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.18)',
    zIndex: 1,
  },
  videoBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 2,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2.5,
    zIndex: 3,
  },
  selectionBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 6,
  },
  selectionIndex: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  checkCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  unselectedCircle: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  unselectedCircleInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
