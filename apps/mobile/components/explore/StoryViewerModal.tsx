/**
 * StoryViewerModal – Hikaye fullscreen izleyici
 * Instagram tarzı: otomatik geçiş, animasyonlu progress bar, tap ile önceki/sonraki
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import type { Story } from '@/src/services/storyService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION_MS = 5000;

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Az önce';
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  return `${Math.floor(hours / 24)} gün önce`;
}

export interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  visible?: boolean;
  onClose: () => void;
  onStoryViewed?: (storyId: number) => void;
  onAuthorNavigate?: (route: string, currentIndex: number) => void;
  onPlaceNavigate?: (route: string, currentIndex: number) => void;
}

export function StoryViewerModal({
  stories,
  initialIndex = 0,
  visible = true,
  onClose,
  onStoryViewed,
  onAuthorNavigate,
  onPlaceNavigate,
}: StoryViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (story) onStoryViewed?.(story.id);
  }, [index, story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!story || !isImage || !visible) return;
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
  }, [index, story?.id, isImage, visible, goNext, progressAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isImage) progressAnim.setValue(0);
  }, [index, isImage, progressAnim]);

  useEffect(() => {
    if (!visible) dragY.setValue(0);
  }, [visible, dragY]);

  const handleVideoEnd = useCallback(() => {
    goNext();
  }, [goNext]);

  const closeWithReset = useCallback(() => {
    dragY.setValue(0);
    onClose();
  }, [dragY, onClose]);

  const animateClose = useCallback(() => {
    Animated.timing(dragY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  }, [dragY, onClose]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 12 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) dragY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 90 || g.vy > 0.8) {
            animateClose();
            return;
          }
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            friction: 7,
            tension: 80,
          }).start();
        },
      }),
    [dragY, closeWithReset]
  );

  const handleAuthorPress = useCallback(() => {
    if (!story?.user_id) return;
    lightImpact();
    onAuthorNavigate?.(`/user/${story.user_id}`, index);
  }, [story?.user_id, index, onAuthorNavigate]);

  const handlePlacePress = useCallback(() => {
    const pid = story?.place_id ?? story?.place?.id;
    if (!pid) return;
    lightImpact();
    onPlaceNavigate?.(`/place/${pid}`, index);
  }, [story?.place_id, story?.place?.id, index, onPlaceNavigate]);

  if (!story) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            transform: [{ translateY: dragY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {story.media_type === 'video' ? (
          <Video
            source={{ uri: story.media_url }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={visible}
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

        <View style={styles.tapZones} pointerEvents="box-none">
          <Pressable style={styles.tapLeft} onPress={goPrev} />
          <Pressable style={styles.tapRight} onPress={goNext} />
        </View>

        <TouchableOpacity
          style={[styles.closeBtn, { backgroundColor: 'rgba(0,0,0,0.4)' }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <IconSymbol name="xmark" size={22} color="#fff" />
        </TouchableOpacity>

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

        <View style={[styles.authorBar, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
          {onAuthorNavigate ? (
            <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.7}>
              <IconSymbol name="person.circle.fill" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <IconSymbol name="person.circle.fill" size={20} color="#fff" />
          )}
          <View style={styles.authorText}>
            {onAuthorNavigate ? (
              <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.7}>
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>
                    {story.author?.first_name || story.author?.username || 'Kullanıcı'}
                  </Text>
                  <Text style={styles.timeAgo}>{timeAgo(story.created_at)}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>
                  {story.author?.first_name || story.author?.username || 'Kullanıcı'}
                </Text>
                <Text style={styles.timeAgo}>{timeAgo(story.created_at)}</Text>
              </View>
            )}
            {story.place && (
              onPlaceNavigate ? (
                <TouchableOpacity onPress={handlePlacePress} activeOpacity={0.7}>
                  <View style={styles.placeRow}>
                    <IconSymbol name="mappin" size={11} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.placeName}>{story.place.name}</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.placeRow}>
                  <IconSymbol name="mappin" size={11} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.placeName}>{story.place.name}</Text>
                </View>
              )
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 1,
  },
  tapLeft: {
    flex: 1,
  },
  tapRight: {
    flex: 1,
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
    zIndex: 10,
  },
  authorText: { flex: 1 },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  timeAgo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  placeName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
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
