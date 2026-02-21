/**
 * ContentCreationFlow – Akış orkestratörü
 * MediaPicker → EditCanvas → Share (caption, location)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { MediaPicker } from './MediaPicker';
import { EditCanvas } from './EditCanvas';
import type { MediaItem, ContentType, FilterPreset, TextOverlay } from '@/src/contentCreation/types';

export type FlowStep = 'pick' | 'edit' | 'share';

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
  }) => Promise<void>;
  onClose: () => void;
  renderShareStep: (params: {
    mediaUri: string;
    isVideo: boolean;
    onShare: (placeId?: number, placeName?: string) => Promise<void>;
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
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [editIndex, setEditIndex] = useState(0);
  const [filter, setFilter] = useState<FilterPreset>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);

  const currentMedia = useMemo(() => selected[editIndex] ?? null, [selected, editIndex]);

  const handleSelect = useCallback((items: MediaItem[]) => {
    setSelected(items);
    if (items.length > 0) {
      setEditIndex(0);
      setFilter('none');
      setTextOverlays([]);
      setStep('edit');
    }
  }, []);

  const handleEditBack = useCallback(() => {
    setStep('pick');
    setSelected([]);
  }, []);

  const handleEditDone = useCallback(() => {
    setStep('share');
  }, []);

  const handleShareBack = useCallback(() => {
    setStep('edit');
  }, []);

  const handleShare = useCallback(
    async (placeId?: number, placeName?: string) => {
      if (!currentMedia) return;
      await onShare({
        mediaUri: currentMedia.uri,
        isVideo: currentMedia.type === 'video',
        placeId: placeId ?? initialPlaceId,
        placeName: placeName ?? initialPlaceName,
      });
    },
    [currentMedia, onShare, initialPlaceId, initialPlaceName]
  );

  if (step === 'pick') {
    return (
      <View style={styles.container}>
        <MediaPicker
          contentType={contentType}
          selected={selected}
          onSelect={handleSelect}
          quality={quality}
        />
      </View>
    );
  }

  if (step === 'edit' && currentMedia) {
    return (
      <EditCanvas
        media={currentMedia}
        filter={filter}
        textOverlays={textOverlays}
        onFilterChange={setFilter}
        onTextOverlaysChange={setTextOverlays}
        onDone={handleEditDone}
        onBack={handleEditBack}
      />
    );
  }

  if (step === 'share' && currentMedia) {
    return (
      <View style={styles.container}>
        {renderShareStep({
          mediaUri: currentMedia.uri,
          isVideo: currentMedia.type === 'video',
          onShare: handleShare,
          onBack: handleShareBack,
        })}
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
