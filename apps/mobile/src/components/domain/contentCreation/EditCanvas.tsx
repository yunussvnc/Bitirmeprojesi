/**
 * EditCanvas – Premium Fullscreen düzenleme alanı
 * Sürüklenebilir metinler, şeffaf asılı araç çubukları, gelişmiş deneyim
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTranslation } from "react-i18next";
import { radius } from '@/src/constants/design';
import { LinearGradient } from 'expo-linear-gradient';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';
import type { MediaItem, FilterPreset, TextOverlay } from '@/src/contentCreation/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FILTER_OVERLAYS: Record<FilterPreset, { bg: string; opacity: number } | null> = {
  none: null,
  warm: { bg: '#FF9A56', opacity: 0.15 },
  cool: { bg: '#5B9BD5', opacity: 0.12 },
  vintage: { bg: '#8B4513', opacity: 0.2 },
  dramatic: { bg: '#1A1A2E', opacity: 0.25 },
};

const TEXT_COLORS = ['#FFFFFF', '#000000', '#FF3B30', '#34C759', '#007AFF', '#FF9500', '#AF52DE'];

export interface EditCanvasProps {
  media: MediaItem;
  allMedia?: MediaItem[];
  editIndex?: number;
  onEditIndexChange?: (index: number) => void;
  filter: FilterPreset;
  textOverlays: TextOverlay[];
  onFilterChange: (f: FilterPreset) => void;
  onTextOverlaysChange: (t: TextOverlay[]) => void;
  onDone: () => void;
  onBack: () => void;
}

// Sürüklenebilir Metin Komponenti
function DraggableText({ textData, onRemove }: { textData: TextOverlay; onRemove: () => void }) {
  const pan = useRef(new Animated.ValueXY({ x: textData.x, y: textData.y })).current;
  const scale = useRef(new Animated.Value(1)).current;
  const panValue = useRef({ x: textData.x, y: textData.y });

  React.useEffect(() => {
    const id = pan.addListener((value) => {
      panValue.current = value;
    });
    return () => {
      pan.removeListener(id);
    };
  }, [pan]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: panValue.current.x,
          y: panValue.current.y,
        });
        pan.setValue({ x: 0, y: 0 });
        Animated.spring(scale, { toValue: 1.1, useNativeDriver: false }).start();
        lightImpact();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
        Animated.spring(scale, { toValue: 1, useNativeDriver: false }).start();
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.textOverlayContainer,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }, { scale }],
        },
      ]}
    >
      <TouchableOpacity
        onLongPress={() => {
          mediumImpact();
          onRemove();
        }}
        activeOpacity={0.9}
        delayLongPress={300}
      >
        <Text style={[styles.overlayText, { color: textData.color }]}>
          {textData.text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function EditCanvas({
  media,
  allMedia = [],
  editIndex = 0,
  onEditIndexChange,
  filter,
  textOverlays,
  onFilterChange,
  onTextOverlaysChange,
  onDone,
  onBack,
}: EditCanvasProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [showTextModal, setShowTextModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [editingColor, setEditingColor] = useState(TEXT_COLORS[0]);

  const filterOverlay = FILTER_OVERLAYS[filter];

  const addText = useCallback(() => {
    lightImpact();
    setEditingText('');
    setEditingColor(TEXT_COLORS[0]);
    setShowFilters(false);
    setShowTextModal(true);
  }, []);

  const saveText = useCallback(() => {
    if (!editingText.trim()) {
      setShowTextModal(false);
      return;
    }
    mediumImpact();
    const newOverlay: TextOverlay = {
      id: `t-${Date.now()}`,
      text: editingText.trim(),
      color: editingColor,
      x: SCREEN_WIDTH / 2 - 80,
      y: SCREEN_HEIGHT / 2 - 20,
      width: 160,
      height: 40,
    };
    onTextOverlaysChange([...textOverlays, newOverlay]);
    setShowTextModal(false);
  }, [editingText, editingColor, textOverlays, onTextOverlaysChange]);

  const removeText = useCallback(
    (id: string) => {
      onTextOverlaysChange(textOverlays.filter((t) => t.id !== id));
    },
    [textOverlays, onTextOverlaysChange]
  );

  return (
    <View style={styles.container}>
      {/* 1) Canvas Area (Fullscreen or aspect-controlled) */}
      <View style={styles.canvasWrap}>
        <View style={[styles.canvas]}>
          {media.type === 'video' ? (
            <Video
              source={{ uri: media.uri }}
              style={StyleSheet.absoluteFill}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
          ) : (
            <ExpoImage
              source={{ uri: media.uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          )}

          {filterOverlay && (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: filterOverlay.bg, opacity: filterOverlay.opacity },
              ]}
              pointerEvents="none"
            />
          )}

          {textOverlays.map((t) => (
            <DraggableText key={t.id} textData={t} onRemove={() => removeText(t.id)} />
          ))}

          {/* Top Gradient for readability of icons */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.15)', 'transparent']}
            locations={[0, 0.6, 1]}
            style={[styles.gradientTop, { height: insets.top + 120 }]}
            pointerEvents="none"
          />
        </View>
      </View>

      {/* 2) Floating Top Tools */}
      <View style={[styles.topTools, { top: insets.top + 16 }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconCircle} hitSlop={12}>
          <IconSymbol name="xmark" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.topRightTools}>
          <TouchableOpacity onPress={addText} style={styles.iconCircle} activeOpacity={0.8}>
            <Text style={styles.iconLabel}>Aa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconCircle, showFilters && { backgroundColor: 'rgba(255,255,255,0.4)' }]}
            onPress={() => {
              lightImpact();
              setShowFilters(!showFilters);
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name="sparkles" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle} onPress={() => lightImpact()} activeOpacity={0.8}>
            <IconSymbol name="music.note" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconCircle} onPress={() => lightImpact()} activeOpacity={0.8}>
            <IconSymbol name="smiley" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3) Floating Bottom Filters (Optional) */}
      {showFilters && (
        <View style={[styles.filterDrawer, { paddingBottom: insets.bottom + 80 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {(Object.keys(FILTER_OVERLAYS) as FilterPreset[]).map((f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterBtn,
                  filter === f && styles.filterBtnActive,
                ]}
                onPress={() => {
                  lightImpact();
                  onFilterChange(f);
                }}
              >
                <View style={[styles.filterPreview, filter === f && { borderColor: '#fff', borderWidth: 3 }]}>
                  <ExpoImage source={{ uri: media.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {FILTER_OVERLAYS[f] && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: FILTER_OVERLAYS[f]!.bg, opacity: FILTER_OVERLAYS[f]!.opacity * 2.5 }]} />
                  )}
                </View>
                <Text style={[styles.filterLabel, filter === f && { fontWeight: '800', color: '#fff' }]}>
                  {f === 'none' ? t('filters.normal', 'Normal') : f === 'warm' ? t('filters.warm', 'Sıcak') : f === 'cool' ? t('filters.cool', 'Soğuk') : f === 'vintage' ? t('filters.vintage', 'Retro') : t('filters.cinematic', 'Dizi')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Thumbnail Strip for Multi-Select */}
      {!showFilters && allMedia.length > 1 && (
        <View style={[styles.thumbnailStrip, { bottom: insets.bottom + 80 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailStripContent}>
            {allMedia.map((m, idx) => (
              <TouchableOpacity
                key={`${m.uri}-${idx}`}
                style={[styles.thumbnailWrap, editIndex === idx && styles.thumbnailActive]}
                onPress={() => onEditIndexChange?.(idx)}
                activeOpacity={0.8}
              >
                <ExpoImage source={{ uri: m.uri }} style={styles.thumbnailImage} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 4) Floating Next/Done Button */}
      {!showFilters && (
        <TouchableOpacity
          style={[styles.nextBtn, { bottom: insets.bottom + 20 }]}
          onPress={onDone}
          activeOpacity={0.85}
        >
          <Text style={styles.nextText}>{t("creation.next")}</Text>
          <IconSymbol name="chevron.right" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      {/* 5) Text Editor Modal */}
      <Modal visible={showTextModal} transparent animationType="fade">
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={saveText} />
          
          <View style={styles.textModalInner}>
            <TextInput
              style={[
                styles.fullscreenTextInput,
                { color: editingColor },
              ]}
              placeholder={t('creation.write_placeholder')}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={editingText}
              onChangeText={setEditingText}
              autoFocus
              multiline
              maxLength={100}
              autoCapitalize="sentences"
            />
            <View style={styles.colorPickerWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorRow}>
                {TEXT_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      editingColor === c && styles.colorDotSelected,
                    ]}
                    onPress={() => {
                      lightImpact();
                      setEditingColor(c);
                    }}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={[styles.modalActions, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity onPress={() => setShowTextModal(false)} style={styles.modalBtn}>
                <Text style={styles.modalCancelText}>{t("creation.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveText} style={[styles.modalBtn, styles.modalSaveBtn]}>
                <Text style={styles.modalSaveText}>Bitti</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  canvasWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  canvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
  },
  topTools: {
    position: 'absolute',
    left: 20, right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  topRightTools: {
    gap: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  iconLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'AvenirNext-Bold' : 'sans-serif-condensed',
  },
  textOverlayContainer: {
    position: 'absolute',
    padding: 12, // Extra tap target area
    zIndex: 100,
  },
  overlayText: {
    fontSize: 28,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    textAlign: 'center',
  },
  filterDrawer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingTop: 24,
  },
  filterRow: {
    paddingHorizontal: 20,
    gap: 20,
  },
  filterBtn: {
    alignItems: 'center',
    gap: 8,
  },
  filterBtnActive: {
    borderColor: '#fff',
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  thumbnailStrip: {
    position: 'absolute',
    left: 0, right: 0,
    height: 70,
  },
  thumbnailStripContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  thumbnailWrap: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: '#fff',
    transform: [{ scale: 1.1 }],
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  filterPreview: {
    width: 68, height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
  },
  filterLabel: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '600',
  },
  nextBtn: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1DB954',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  textModalInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  fullscreenTextInput: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    marginBottom: 40,
  },
  colorPickerWrap: {
    position: 'absolute',
    bottom: 120,
    left: 0, right: 0,
  },
  colorRow: {
    paddingHorizontal: 20,
    gap: 16,
    alignItems: 'center',
  },
  colorDot: {
    width: 40, height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  colorDotSelected: {
    borderWidth: 4,
    borderColor: '#fff',
    transform: [{ scale: 1.15 }],
  },
  modalActions: {
    position: 'absolute',
    bottom: 20, left: 20, right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBtn: {
    padding: 12,
  },
  modalSaveBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  modalSaveText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '800',
  },
});
