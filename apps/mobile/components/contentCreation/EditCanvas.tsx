/**
 * EditCanvas – Fullscreen düzenleme alanı
 * Metin ekleme, filtre önizleme, haptic feedback
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { createTextStyle, spacing, radius } from '@/constants/design';
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
  filter: FilterPreset;
  textOverlays: TextOverlay[];
  onFilterChange: (f: FilterPreset) => void;
  onTextOverlaysChange: (t: TextOverlay[]) => void;
  onDone: () => void;
  onBack: () => void;
}

export function EditCanvas({
  media,
  filter,
  textOverlays,
  onFilterChange,
  onTextOverlaysChange,
  onDone,
  onBack,
}: EditCanvasProps) {
  const { colors } = useTheme();
  const [showTextModal, setShowTextModal] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [editingColor, setEditingColor] = useState(TEXT_COLORS[0]);

  const filterOverlay = FILTER_OVERLAYS[filter];
  const aspect = 9 / 16;
  const canvasHeight = Math.min(SCREEN_HEIGHT - 140, SCREEN_WIDTH / aspect);
  const canvasWidth = canvasHeight * aspect;

  const addText = useCallback(() => {
    lightImpact();
    setEditingText('');
    setEditingColor(TEXT_COLORS[0]);
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
      x: canvasWidth / 2 - 80,
      y: canvasHeight / 2 - 20,
      width: 160,
      height: 40,
    };
    onTextOverlaysChange([...textOverlays, newOverlay]);
    setShowTextModal(false);
  }, [editingText, editingColor, textOverlays, onTextOverlaysChange, canvasWidth, canvasHeight]);

  const removeText = useCallback(
    (id: string) => {
      lightImpact();
      onTextOverlaysChange(textOverlays.filter((t) => t.id !== id));
    },
    [textOverlays, onTextOverlaysChange]
  );

  const titleStyle = createTextStyle('title', colors.text.primary);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[titleStyle, styles.title]}>Düzenle</Text>
        <TouchableOpacity onPress={onDone} style={styles.headerBtn} hitSlop={12}>
          <Text style={[styles.doneText, { color: colors.accent.primary }]}>Bitti</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.canvasWrap}>
        <View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }]}>
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
            />
          )}
          {textOverlays.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.textOverlay, { left: t.x, top: t.y, width: t.width, height: t.height }]}
              onLongPress={() => removeText(t.id)}
              activeOpacity={1}
            >
              <Text style={[styles.overlayText, { color: t.color }]} numberOfLines={2}>
                {t.text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.toolbar, { backgroundColor: colors.background.secondary, borderTopColor: colors.surface.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarRow}>
          <TouchableOpacity
            style={[styles.toolBtn, { backgroundColor: colors.surface.elevated }]}
            onPress={addText}
          >
            <IconSymbol name="doc.text.fill" size={22} color={colors.accent.primary} />
            <Text style={[styles.toolLabel, { color: colors.text.secondary }]}>Metin</Text>
          </TouchableOpacity>
          {(Object.keys(FILTER_OVERLAYS) as FilterPreset[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.toolBtn,
                { backgroundColor: filter === f ? colors.accent.primary + '25' : colors.surface.elevated },
                filter === f && { borderWidth: 2, borderColor: colors.accent.primary },
              ]}
              onPress={() => {
                lightImpact();
                onFilterChange(f);
              }}
            >
              <Text style={[styles.toolLabel, { color: filter === f ? colors.accent.primary : colors.text.secondary }]}>
                {f === 'none' ? 'Yok' : f === 'warm' ? 'Sıcak' : f === 'cool' ? 'Soğuk' : f === 'vintage' ? 'Vintage' : 'Dramatik'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal visible={showTextModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.textModal, { backgroundColor: colors.background.elevated }]}>
            <TextInput
              style={[styles.textInput, { color: colors.text.primary, borderColor: colors.surface.border }]}
              placeholder="Metin ekle"
              placeholderTextColor={colors.text.tertiary}
              value={editingText}
              onChangeText={setEditingText}
              autoFocus
              maxLength={80}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
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
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowTextModal(false)} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: colors.text.secondary }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveText} style={[styles.modalBtn, { backgroundColor: colors.accent.primary }]}>
                <Text style={[styles.modalBtnText, { color: colors.accent.onPrimary }]}>Ekle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: Platform.OS === 'ios' ? 54 : spacing.md,
  },
  headerBtn: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  doneText: { fontSize: 16, fontWeight: '600' },
  canvasWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  canvas: { borderRadius: radius.lg, overflow: 'hidden' },
  textOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  overlayText: { fontSize: 18, fontWeight: '700', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  toolbar: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingBottom: Platform.OS === 'ios' ? 34 : spacing.md,
  },
  toolbarRow: { flexDirection: 'row', gap: spacing.sm },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    minWidth: 64,
  },
  toolLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  textModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 48,
  },
  colorRow: { maxHeight: 44 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'flex-end' },
  modalBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  modalBtnText: { fontSize: 16, fontWeight: '600' },
});
