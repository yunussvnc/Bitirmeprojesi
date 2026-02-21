/**
 * StoryViewerModal – Hikaye fullscreen izleyici
 * Instagram tarzı: otomatik geçiş, animasyonlu progress bar, tap ile önceki/sonraki
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Story } from '@/src/services/storyService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION_MS = 5000; // Görsel hikayeler 5 saniye

export interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  onClose: () => void;
}

export function StoryViewerModal({
  stories,
  initialIndex = 0,
  onClose,
}: StoryViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const story = stories[index];
  const isImage = story?.media_type !== 'video';

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
    } else {
      onClose();
    }
  }, [index, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (index > 0) {
      setIndex((i) => i - 1);
    } else {
      onClose();
    }
  }, [index, onClose]);

  // Görsel hikayeler için otomatik geçiş timer'ı
  useEffect(() => {
    if (!story || !isImage) return;
    progressAnim.setValue(0);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION_MS,
      useNativeDriver: false,
    });
    anim.start();
    timerRef.current = setTimeout(goNext, STORY_DURATION_MS);
    return () => {
      anim.stop();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [index, story?.id, isImage, goNext, progressAnim]); // eslint-disable-line react-hooks/exhaustive-deps -- story from stories[index]

  // Index değişince progress sıfırla
  useEffect(() => {
    if (!isImage) progressAnim.setValue(0);
  }, [index, isImage, progressAnim]);

  const handleVideoEnd = useCallback(() => {
    goNext();
  }, [goNext]);

  const handlePress = (ev: { nativeEvent: { locationX: number } }) => {
    const x = ev.nativeEvent.locationX;
    if (x < SCREEN_WIDTH / 2) {
      goPrev();
    } else {
      goNext();
    }
  };

  if (!story) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handlePress}>
        <Pressable
          style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          onPress={onClose}
        >
          <IconSymbol name="xmark" size={22} color="#fff" />
        </Pressable>

        {story.media_type === 'video' ? (
          <Video
            source={{ uri: story.media_url }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={(status: { isLoaded?: boolean; didJustFinish?: boolean }) => {
              if (status?.isLoaded && status?.didJustFinish) {
                handleVideoEnd();
              }
            }}
          />
        ) : (
          <Image
            source={{ uri: story.media_url }}
            style={styles.media}
            contentFit="contain"
          />
        )}

        {story.author && (
          <View style={[styles.authorBar, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
            <IconSymbol name="person.circle.fill" size={20} color="#fff" />
            <View style={styles.authorText}>
              <Text style={styles.authorName}>
                {story.author.first_name || story.author.username || `Kullanıcı`}
              </Text>
              {story.place && (
                <Text style={styles.placeName}>{story.place.name}</Text>
              )}
            </View>
          </View>
        )}

        {stories.length > 1 && (
          <View style={styles.progressRow}>
            {stories.map((_, i) => {
              const isCompleted = i < index;
              const isActive = i === index;
              return (
                <View key={i} style={[styles.progressSegment, { flex: 1 }]}>
                  <View style={styles.progressBg} />
                  {isCompleted && <View style={styles.progressFillCompleted} />}
                  {isActive && (
                    <View style={styles.progressActiveWrap}>
                      <Animated.View
                        style={[styles.progressFillActive, { flex: progressAnim }]}
                      />
                      <Animated.View
                        style={{
                          flex: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 0],
                          }),
                        }}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  media: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  authorBar: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  authorText: { flex: 1 },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  placeName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  progressRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 5,
  },
  progressSegment: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFillCompleted: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  progressFillActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  progressActiveWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
  },
});
