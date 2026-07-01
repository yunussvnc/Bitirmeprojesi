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
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import Video from 'react-native-video';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, success } from '@/src/utils/haptics';
import type { Story } from '@/src/services/storyService';
import { replyToStory, reactToStory, updateStoryViewAnalytics, STORY_EMOJIS, type StoryEmoji } from '@/src/services/storyService';
import { router } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION_MS = 5000;

import { timeAgo } from '@/src/utils/timeAgo';
import { useTranslation } from 'react-i18next';

export interface StoryViewerModalProps {
  stories: Story[];
  initialIndex?: number;
  visible?: boolean;
  onClose: () => void;
  onStoryViewed?: (storyId: number) => void;
  onAuthorNavigate?: (route: string, currentIndex: number) => void;
  onPlaceNavigate?: (route: string, currentIndex: number) => void;
  /** Aktif kullanıcının ID'si — kendi hikayelerinde yanıt kutusu gizlenir */
  currentUserId?: number;
}

export function StoryViewerModal({
  stories,
  initialIndex = 0,
  visible = true,
  onClose,
  onStoryViewed,
  onAuthorNavigate,
  onPlaceNavigate,
  currentUserId,
}: StoryViewerModalProps) {
  const [index, setIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionSending, setReactionSending] = useState(false);
  const openedAtRef = useRef<number>(Date.now());
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  // initialIndex veya stories değiştiğinde index'i sıfırla
  useEffect(() => {
    setIndex(initialIndex);
    openedAtRef.current = Date.now();
  }, [initialIndex, stories]);

  // Hikaye değişince reaction'u güncelle
  useEffect(() => {
    const s = stories[index];
    setMyReaction(s?.my_reaction ?? null);
    openedAtRef.current = Date.now();
  }, [index, stories]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragY = useRef(new Animated.Value(0)).current;
  const animKeyboard = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      Animated.timing(animKeyboard, { toValue: e.endCoordinates.height, duration: 250, useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      Animated.timing(animKeyboard, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [animKeyboard]);

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

  // Analitik: hikayeyi kapat veya bir sonrakine geçerken izleme süresini gönder
  const sendAnalytics = useCallback((opts?: { visitedProfile?: boolean; visitedPlace?: boolean }) => {
    const s = stories[index];
    if (!s) return;
    const duration = Math.round((Date.now() - openedAtRef.current) / 1000);
    updateStoryViewAnalytics(s.id, {
      watch_duration_seconds: duration,
      did_visit_profile: opts?.visitedProfile ?? false,
      did_visit_place: opts?.visitedPlace ?? false,
    }).catch(() => {});
  }, [stories, index]);

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
    sendAnalytics();
    dragY.setValue(0);
    onClose();
  }, [dragY, onClose, sendAnalytics]);

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
    sendAnalytics({ visitedProfile: true });
    onAuthorNavigate?.(`/user/${story.user_id}`, index);
  }, [story?.user_id, index, onAuthorNavigate, sendAnalytics]);

  const handlePlacePress = useCallback(() => {
    const pid = story?.place_id ?? story?.place?.id;
    if (!pid) return;
    lightImpact();
    sendAnalytics({ visitedPlace: true });
    onPlaceNavigate?.(`/place/${pid}`, index);
  }, [story?.place_id, story?.place?.id, index, onPlaceNavigate, sendAnalytics]);

  const handleSendReply = useCallback(async () => {
    if (!replyText.trim() || !story || replySending) return;
    setReplySending(true);
    try {
      await replyToStory(story.id, replyText.trim());
      success();
      setReplyText('');
      setShowEmojiTray(false);
    } catch (e) {
      console.warn('[StoryViewer] Reply failed:', e);
    } finally {
      setReplySending(false);
    }
  }, [replyText, story, replySending]);

  const handleReaction = useCallback(async (emoji: StoryEmoji) => {
    if (!story || reactionSending) return;
    setReactionSending(true);
    lightImpact();
    try {
      const res = await reactToStory(story.id, emoji);
      if (res.action === 'removed') {
        setMyReaction(null);
      } else {
        setMyReaction(emoji);
      }
      setShowEmojiTray(false);
    } catch (e) {
      console.warn('[StoryViewer] Reaction failed:', e);
    } finally {
      setReactionSending(false);
    }
  }, [story, reactionSending]);

  const handleLinkSticker = useCallback(() => {
    if (!story?.link_type || !story?.link_id) return;
    lightImpact();
    sendAnalytics({ visitedPlace: story.link_type === 'place' });
    if (story.link_type === 'place') {
      onPlaceNavigate?.(`/place/${story.link_id}`, index);
    } else if (story.link_type === 'profile') {
      onAuthorNavigate?.(`/user/${story.link_id}`, index);
    }
  }, [story, index, onPlaceNavigate, onAuthorNavigate, sendAnalytics]);

  // Başkasının hikayesinde mi?
  const isOwnStory = story?.user_id != null && currentUserId != null && story.user_id === currentUserId;
  const showReplyBar = !isOwnStory;

  if (!story) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
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
            resizeMode="contain"
            paused={!visible}
            repeat={false}
            onEnd={handleVideoEnd}
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
                    {story.author?.first_name || story.author?.username || t('profile.user')}
                  </Text>
                  <Text style={styles.timeAgo}>{timeAgo(story.created_at)}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.authorNameRow}>
                <Text style={styles.authorName}>
                  {story.author?.first_name || story.author?.username || t('profile.user')}
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

        {/* ── Link Sticker (varsa) ── */}
        {story.link_type && story.link_id && (
          <TouchableOpacity
            style={styles.linkSticker}
            onPress={handleLinkSticker}
            activeOpacity={0.85}
          >
            <IconSymbol name="link" size={14} color="#000" />
            <Text style={styles.linkStickerText} numberOfLines={1}>
              {story.link_label || (story.link_type === 'place' ? 'Bu mekanı incele' : 'Profile git')}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── Yanıt Kutusu + Emoji Tray (sadece başkasının hikayesinde) ── */}
        {showReplyBar && (
          <Animated.View style={[styles.replyBar, { bottom: Animated.add(Platform.OS === 'ios' ? 36 : 20, animKeyboard) }]} pointerEvents="box-none">
            {/* Emoji Tepki Tray */}
            {showEmojiTray && (
              <View style={styles.emojiTray}>
                {STORY_EMOJIS.map((emoji) => (
                  <TouchableOpacity
                    key={emoji}
                    style={[
                      styles.emojiBtn,
                      myReaction === emoji && styles.emojiBtnActive,
                    ]}
                    onPress={() => handleReaction(emoji)}
                    disabled={reactionSending}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.emojiText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.replyInputRow}>
              {/* Emoji toggle butonu */}
              <TouchableOpacity
                style={styles.emojiToggleBtn}
                onPress={() => setShowEmojiTray((v) => !v)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiToggleText}>
                  {myReaction ?? '😀'}
                </Text>
              </TouchableOpacity>

              <TextInput
                style={styles.replyInput}
                placeholder={t('story.reply_placeholder', { defaultValue: 'Yanıt gönder...' })}
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={replyText}
                onChangeText={(v) => { setReplyText(v); setShowEmojiTray(false); }}
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSendReply}
                editable={!replySending}
              />
              <TouchableOpacity
                style={[
                  styles.replySendBtn,
                  replyText.trim() ? styles.replySendBtnActive : null,
                ]}
                onPress={handleSendReply}
                disabled={!replyText.trim() || replySending}
                activeOpacity={0.75}
              >
                {replySending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <IconSymbol name="paperplane.fill" size={18} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </Animated.View>
      </View>
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
  // ── Reply Bar ──
  replyBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  replyInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    paddingVertical: 6,
    minHeight: 36,
  },
  replySendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replySendBtnActive: {
    backgroundColor: '#4ade80',
  },
  // ── Emoji Reaction Tray ──
  emojiTray: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 32,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  emojiBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emojiBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    transform: [{ scale: 1.15 }],
  },
  emojiText: {
    fontSize: 22,
  },
  emojiToggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  emojiToggleText: {
    fontSize: 18,
  },
  // ── Link Sticker ──
  linkSticker: {
    position: 'absolute',
    bottom: 190,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 15,
  },
  linkStickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    maxWidth: 200,
  },
});
