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
} from 'react-native-reanimated';
import { MediaPicker } from './MediaPicker';
import { EditCanvas } from './EditCanvas';
import type { MediaItem, ContentType, FilterPreset, TextOverlay } from '@/src/contentCreation/types';

export type FlowStep = 'pick' | 'edit' | 'share';

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
    onShare: (payload?: any) => Promise<void>;
    onBack: () => void;
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
  const [filter, setFilter] = useState<FilterPreset>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  const currentMedia = useMemo(() => selected[editIndex] ?? null, [selected, editIndex]);

  const handleSelect = useCallback((items: MediaItem[]) => {
    setSelected(items);
  }, []);

  const handleNextFromPicker = useCallback(() => {
    if (selected.length > 0) {
      setEditIndex(0);
      setFilter('none');
      setTextOverlays([]);
      setDirection('forward');
      if (contentType === 'story') {
        setStep('edit');
      } else {
        setStep('share');
      }
    }
  }, [selected, contentType]);

  const handleEditBack = useCallback(() => {
    setDirection('backward');
    setStep('pick');
  }, []);

  const handleEditDone = useCallback(() => {
    setDirection('forward');
    setStep('share');
  }, []);

  const handleShareBack = useCallback(() => {
    setDirection('backward');
    if (contentType === 'story') {
      setStep('edit');
    } else {
      setStep('pick');
    }
  }, [contentType]);

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
          onNext={handleNextFromPicker}
          onClose={onClose}
          quality={quality}
        />
      </Animated.View>
    );
  }

  if (step === 'edit' && currentMedia) {
    return (
      <Animated.View
        key="edit"
        entering={entering}
        exiting={exiting}
        style={styles.container}
      >
        <EditCanvas
          media={currentMedia}
          filter={filter}
          textOverlays={textOverlays}
          onFilterChange={setFilter}
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
          onShare: handleShare,
          onBack: handleShareBack,
        })}
      </Animated.View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
