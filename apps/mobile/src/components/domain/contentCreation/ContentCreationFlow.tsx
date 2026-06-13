/**
 * ContentCreationFlow – Premium akış orkestratörü
 * MediaPicker → EditCanvas → Share  (animasyonlu geçişler)
 *
 * react-native-reanimated ile FadeInRight/FadeOutLeft geçiş efektleri.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  FadeInRight,
  FadeOutLeft,
  FadeInLeft,
  FadeOutRight,
  SlideInRight,
  SlideOutLeft,
  SlideInLeft,
  SlideOutRight,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { MediaPicker } from './MediaPicker';
import { EditCanvas } from './EditCanvas';
import { StoryMediaEditor } from './StoryMediaEditor';
import type { MediaItem, ContentType, FilterPreset, TextOverlay } from '@/src/contentCreation/types';

export type FlowStep = 'pick' | 'gesture-editor' | 'edit' | 'share';

const TRANSITION_DURATION = 280;

export interface ContentCreationFlowProps {
  contentType: ContentType;
  initialPlaceId?: number;
  initialPlaceName?: string;
  quality?: number;
  onShare: (params: {
    mediaUri: string;
    isVideo: boolean;
    placeId?: number;
    placeName?: string;
    [key: string]: any;
  }) => Promise<void>;
  onClose: () => void;
  renderShareStep: (params: {
    mediaUri: string;
    isVideo: boolean;
    mediaItems?: MediaItem[];
    onShare: (payload?: any) => Promise<void>;
    onBack: () => void;
    onEditMedia?: (index: number) => void;
  }) => React.ReactNode;
}

export function ContentCreationFlow({
  contentType,
  initialPlaceId,
  initialPlaceName,
  quality = 0.9,
  onShare,
  onClose,
  renderShareStep,
}: ContentCreationFlowProps) {
  const [step, setStep] = useState<FlowStep>('pick');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [editIndex, setEditIndex] = useState(0);
  // Yalnızca tek bir "textOverlays" state'i var, story mantığından kaldı. 
  // Gönderi için artık kullanılmıyor olabilir ama kırılmaması için tutuyoruz.
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  const currentMedia = useMemo(() => selected[editIndex] ?? null, [selected, editIndex]);

  const handleSelect = useCallback((items: MediaItem[]) => {
    setSelected(items);
  }, []);

  const handleNextFromPicker = useCallback((items: MediaItem[]) => {
    if (items.length > 0 || selected.length > 0) {
      const finalItems = items.length > 0 ? items : selected;
      setSelected(finalItems);
      setEditIndex(0);
      setTextOverlays([]);
      setDirection('forward');
      if (contentType === 'story') {
        // Hikaye için önce gesture editörü
        setStep('gesture-editor');
      } else {
        setStep('share');
      }
    }
  }, [selected, contentType]);

  const handleEditorConfirm = useCallback((editedUri: string) => {
    // Editleden gelen URI'yi mevcut media'ya yaz
    setSelected((prev) => prev.map((m, i) => i === editIndex ? { ...m, uri: editedUri } : m));
    setDirection('forward');
    setStep('edit');
  }, [editIndex]);

  const handleEditorCancel = useCallback(() => {
    setDirection('backward');
    setStep('pick');
  }, []);

  const handleEditBack = useCallback(() => {
    setDirection('backward');
    if (contentType === 'story') {
      setStep('gesture-editor');
    } else {
      setStep('pick');
    }
  }, [contentType]);

  const handleEditDone = useCallback((editedUri?: string, appliedFilter?: FilterPreset, cropState?: { scale: number; translateX: number; translateY: number }) => {
    if (editedUri) {
      setSelected((prev) => prev.map((m, i) => {
        if (i === editIndex) {
          // İlk düzenlemede originalUri'yi sakla
          const originalUri = m.originalUri || m.uri;
          return { ...m, uri: editedUri, originalUri, width: 1080, height: 1080, filter: appliedFilter, cropState };
        }
        return m;
      }));
    }
    setDirection('forward');
    setStep('share');
  }, [editIndex]);

  const handleShareBack = useCallback(() => {
    setDirection('backward');
    setStep('pick');
  }, []);

  const handleShare = useCallback(
    async (payload?: any) => {
      if (!currentMedia) return;

      const defaultPlaceId = typeof payload?.placeId === 'number' ? payload.placeId : (payload?.placeId || initialPlaceId);
      const defaultPlaceName = typeof payload?.placeName === 'string' ? payload.placeName : (payload?.placeName || initialPlaceName);

      await onShare({
        mediaUri: currentMedia.uri,
        isVideo: currentMedia.type === 'video',
        placeId: defaultPlaceId,
        placeName: defaultPlaceName,
        mediaItems: selected, // Pass all selected media for carousel support
        ...(typeof payload === 'object' ? payload : {}),
      });
    },
    [currentMedia, selected, onShare, initialPlaceId, initialPlaceName]
  );

  const entering = direction === 'forward'
    ? SlideInRight.duration(TRANSITION_DURATION)
    : SlideInLeft.duration(TRANSITION_DURATION);
  const exiting = direction === 'forward'
    ? SlideOutLeft.duration(TRANSITION_DURATION)
    : SlideOutRight.duration(TRANSITION_DURATION);

  if (step === 'pick') {
    return (
      <Animated.View
        key="pick"
        entering={direction === 'backward' ? SlideInLeft.duration(TRANSITION_DURATION) : undefined}
        style={styles.container}
      >
        <MediaPicker
          contentType={contentType}
          selected={selected}
          onSelect={handleSelect}
          onNext={(items?: MediaItem[]) => handleNextFromPicker(items ?? selected)}
          onClose={onClose}
          quality={quality}
        />
      </Animated.View>
    );
  }

  // ── Gesture Editörü (sadece story) ──
  if (step === 'gesture-editor' && currentMedia) {
    return (
      <Animated.View
        key="gesture-editor"
        entering={direction === 'forward'
          ? SlideInRight.duration(TRANSITION_DURATION)
          : SlideInLeft.duration(TRANSITION_DURATION)}
        exiting={direction === 'forward'
          ? SlideOutLeft.duration(TRANSITION_DURATION)
          : SlideOutRight.duration(TRANSITION_DURATION)}
        style={styles.container}
      >
        <StoryMediaEditor
          uri={currentMedia.uri}
          onConfirm={handleEditorConfirm}
          onCancel={handleEditorCancel}
        />
      </Animated.View>
    );
  }

  if (step === 'edit' && currentMedia) {
    return (
      <Animated.View
        key="edit"
        entering={SlideInDown.duration(TRANSITION_DURATION)}
        exiting={SlideOutDown.duration(TRANSITION_DURATION)}
        style={styles.container}
      >
        <EditCanvas
          media={currentMedia}
          allMedia={selected}
          editIndex={editIndex}
          onEditIndexChange={setEditIndex}
          textOverlays={textOverlays}
          onTextOverlaysChange={setTextOverlays}
          onDone={handleEditDone}
          onBack={handleEditBack}
        />
      </Animated.View>
    );
  }

  if (step === 'share' && currentMedia) {
    return (
      <Animated.View
        key="share"
        entering={SlideInRight.duration(TRANSITION_DURATION)}
        exiting={SlideOutRight.duration(TRANSITION_DURATION)}
        style={styles.container}
      >
        {renderShareStep({
          mediaUri: currentMedia.uri,
          isVideo: currentMedia.type === 'video',
          mediaItems: selected,
          onShare: handleShare,
          onBack: handleShareBack,
          onEditMedia: (index: number) => {
            setEditIndex(index);
            setDirection('backward');
            setStep('edit');
          }
        })}
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
