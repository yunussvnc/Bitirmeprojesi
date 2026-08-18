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
  Platform,
  Animated,
  PanResponder,
  TextInput,
  ActivityIndicator,
  Keyboard,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import Video from 'react-native-video';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Avatar } from '@/src/components/ui/Avatar';
import { lightImpact, success } from '@/src/utils/haptics';
import type { Story } from '@/src/services/storyService';
import { replyToStory, reactToStory, updateStoryViewAnalytics, recordStoryView, getStoryViewers, STORY_EMOJIS, type StoryEmoji, type StoryViewerItem } from '@/src/services/storyService';
import { router } from 'expo-router';

const STORY_DURATION_MS = 5000;
const LONG_PRESS_DELAY = 200;
const TOP_INSET = Platform.OS === 'ios' ? 54 : 40;

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
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionSending, setReactionSending] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false); // Fix #2: ayrı state for Video pause
  const isPausedRef = useRef(false);
  const progressValueRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardVisibleRef = useRef(false);
  const openedAtRef = useRef<number>(Date.now());
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { t } = useTranslation();

  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [viewers, setViewers] = useState<StoryViewerItem[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);

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

  const dragY = useRef(new Animated.Value(0)).current;
  const animKeyboard = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progressAnim.addListener(({ value }) => {
      progressValueRef.current = value;
    });
    return () => progressAnim.removeAllListeners();
  }, [progressAnim]);

  // Fix #4: Keyboard açılınca hikaye progress durdur
  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      keyboardVisibleRef.current = true;
      Animated.timing(animKeyboard, { toValue: e.endCoordinates.height, duration: 250, useNativeDriver: false }).start();
      // Keyboard açılınca progress durdur
      isPausedRef.current = true;
      setVideoPaused(true);
      if (isImageRef.current) {
        progressAnim.stopAnimation();
      }
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      Animated.timing(animKeyboard, { toValue: 0, duration: 250, useNativeDriver: false }).start();
      // Keyboard kapanınca progress devam
      isPausedRef.current = false;
      setVideoPaused(false);
      if (isImageRef.current) {
        startProgressFromCurrent();
      }
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [animKeyboard, progressAnim]); // eslint-disable-line react-hooks/exhaustive-deps

  const story = stories[index];
  const isImage = story?.media_type !== 'video';
  const isImageRef = useRef(isImage);
  isImageRef.current = isImage;

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
    if (story) {
      onStoryViewed?.(story.id);
      // Backend'e görüntüleme kaydı gönder
      recordStoryView(story.id, 'feed').catch(() => {});
    }
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

  // İmage progress: zamana dayalı animasyon
  const startProgress = useCallback((fromValue = 0) => {
    if (!isImage) return;
    const remainingDuration = STORY_DURATION_MS * (1 - fromValue);
    progressAnim.setValue(fromValue);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && visible && !isPausedRef.current) {
        goNext();
      }
    });
  }, [isImage, progressAnim, visible, goNext]);

  // Resume helper (keyboard hide'dan erişilebilmeli)
  const startProgressFromCurrent = useCallback(() => {
    startProgress(progressValueRef.current);
  }, [startProgress]);

  const resumeProgress = useCallback(() => {
    if (!story || viewersModalVisible) return;
    const remaining = Math.max(0, STORY_DURATION_MS - progressValueRef.current);
    Animated.timing(progressAnim, {
      toValue: STORY_DURATION_MS,
      duration: remaining,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });
  }, [story, progressAnim, goNext, viewersModalVisible]);

  // Image hikaye: progress başlat
  useEffect(() => {
    if (!story || !isImage || !visible) return;
    progressValueRef.current = 0;
    startProgress(0);
    return () => {
      progressAnim.stopAnimation();
    };
  }, [index, story?.id, isImage, visible, startProgress, progressAnim]);

  // Video hikaye: progress sıfırla (onProgress callback ile dolacak)
  useEffect(() => {
    if (!isImage) {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
      progressValueRef.current = 0;
    }
  }, [index, isImage, progressAnim]);

  useEffect(() => {
    if (!visible) dragY.setValue(0);
  }, [visible, dragY]);

  // Fix #1: Video progress — react-native-video onProgress callback
  const handleVideoProgress = useCallback(({ currentTime, seekableDuration }: { currentTime: number; seekableDuration: number }) => {
    if (seekableDuration > 0) {
      const fraction = currentTime / seekableDuration;
      progressAnim.setValue(fraction);
      progressValueRef.current = fraction;
    }
  }, [progressAnim]);

  const handleVideoEnd = useCallback(() => {
    if (!isPausedRef.current) {
      goNext();
    }
  }, [goNext]);

  const handlePressIn = useCallback(() => {
    if (viewersModalVisible) return;
    longPressTimerRef.current = setTimeout(() => {
      setUiVisible(false);
      setVideoPaused(true);
      isPausedRef.current = true;
      progressAnim.stopAnimation();
    }, LONG_PRESS_DELAY);
  }, [progressAnim, viewersModalVisible]);

  const handlePressOut = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setVideoPaused(false); // Fix #2
      setUiVisible(true);
      if (isImage) {
        startProgress(progressValueRef.current);
      }
    }
  }, [isImage, startProgress]);

  // Fix #3: animateClose artık analitik gönderiyor
  const animateClose = useCallback(() => {
    sendAnalytics();
    Animated.timing(dragY, {
      toValue: SCREEN_HEIGHT,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      onClose();
    });
  }, [dragY, onClose, sendAnalytics, SCREEN_HEIGHT]);

  // Fix #7: Swipe-down sırasında arka plan şeffaflaşması
  const overlayOpacity = dragY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.4],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

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
    [dragY, animateClose]
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

  const openViewersList = useCallback(async () => {
    if (!story) return;
    setVideoPaused(true);
    isPausedRef.current = true;
    progressAnim.stopAnimation();
    setViewersModalVisible(true);
    setViewersLoading(true);
    try {
      const res = await getStoryViewers(story.id);
      setViewers(res.items || []);
    } catch (e) {
      console.warn('Failed to load viewers', e);
    } finally {
      setViewersLoading(false);
    }
  }, [story, progressAnim]);

  const closeViewersList = useCallback(() => {
    setViewersModalVisible(false);
    setVideoPaused(false);
    isPausedRef.current = false;
    resumeProgress();
  }, [resumeProgress]);

  if (!story) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Fix #7: Swipe-down sırasında arka planın şeffaflaşması */}
      <Animated.View style={[{ flex: 1, backgroundColor: '#000' }, { opacity: overlayOpacity }]} />
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            transform: [{ translateY: dragY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {story.media_type === 'video' ? (
          <Video
            source={{ uri: story.media_url }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            resizeMode="contain"
            paused={!visible || videoPaused}
            repeat={false}
            onProgress={handleVideoProgress}
            onEnd={handleVideoEnd}
          />
        ) : (
          <Image
            source={{ uri: story.media_url }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            contentFit="contain"
          />
        )}

        <View style={styles.tapZones} pointerEvents="box-none">
          <Pressable style={styles.tapLeft} onPress={goPrev} onPressIn={handlePressIn} onPressOut={handlePressOut} />
          <Pressable style={styles.tapRight} onPress={goNext} onPressIn={handlePressIn} onPressOut={handlePressOut} />
        </View>

        {/* ── Progress Bar (her zaman en üstte) ── */}
        {uiVisible && (
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

        {/* Fix #5: Author bar üstte (Instagram tarzı) — progress bar'ın hemen altında */}
        {uiVisible && (
          <View style={styles.authorBar}>
            {onAuthorNavigate ? (
              <TouchableOpacity onPress={handleAuthorPress} activeOpacity={0.7}>
                <Avatar source={story.author?.avatar_url ? { uri: story.author.avatar_url } : undefined} name={story.author?.first_name || story.author?.username || t('profile.user')} size={36} />
              </TouchableOpacity>
            ) : (
              <Avatar source={story.author?.avatar_url ? { uri: story.author.avatar_url } : undefined} name={story.author?.first_name || story.author?.username || t('profile.user')} size={36} />
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

            {/* Fix #6: Close butonu — author bar'ın sağ tarafında */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Link Sticker (varsa) ── */}
        {story.link_type && story.link_id && uiVisible && (
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
        {showReplyBar && uiVisible && (
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

        {/* ── İzleyenler Butonu (Sadece Kendi Hikayesinde) ── */}
        {isOwnStory && uiVisible && (
          <Animated.View style={[styles.viewersBtnWrap, { bottom: Animated.add(Platform.OS === 'ios' ? 36 : 20, animKeyboard) }]} pointerEvents="box-none">
            <TouchableOpacity style={styles.viewersBtn} onPress={openViewersList} activeOpacity={0.8}>
              <IconSymbol name="eye" size={16} color="#fff" />
              <Text style={styles.viewersBtnText}>
                {t('story.viewers', { defaultValue: 'İzleyenleri Gör' })}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* ── Viewers List Modal ── */}
      <Modal
        visible={viewersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeViewersList}
      >
        <TouchableOpacity style={styles.viewersModalOverlay} activeOpacity={1} onPress={closeViewersList}>
          <TouchableOpacity style={styles.viewersModalContent} activeOpacity={1}>
            <View style={styles.viewersHeader}>
              <Text style={styles.viewersTitle}>{t('story.viewers_title', { defaultValue: 'Görüntüleyenler' })}</Text>
              <TouchableOpacity onPress={closeViewersList} style={styles.viewersCloseBtn}>
                <IconSymbol name="xmark" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            {viewersLoading ? (
              <View style={styles.viewersLoading}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : viewers.length > 0 ? (
              <ScrollView style={styles.viewersList} contentContainerStyle={{ paddingBottom: 40 }}>
                {viewers.map((v, i) => (
                  <View key={i} style={styles.viewerItem}>
                    <Avatar source={v.user.avatar_url ? { uri: v.user.avatar_url } : undefined} name={v.user.first_name || v.user.username || 'U'} size={40} />
                    <View style={styles.viewerInfo}>
                      <Text style={styles.viewerName}>{v.user.first_name || v.user.username || 'U'}</Text>
                      <Text style={styles.viewerTime}>{timeAgo(v.viewed_at)}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.viewersEmpty}>
                <Text style={styles.viewersEmptyText}>{t('story.no_viewers', { defaultValue: 'Henüz görüntüleyen yok' })}</Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  // Fix #5: Author bar artık üstte, progress bar'ın hemen altında
  authorBar: {
    position: 'absolute',
    top: TOP_INSET + 14,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 10,
    zIndex: 10,
  },
  // Fix #6: Close butonu — author bar sağ kenarında
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorText: { flex: 1 },
  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
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
    marginTop: 2,
  },
  placeName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  progressRow: {
    position: 'absolute',
    top: TOP_INSET,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 3,
    zIndex: 15,
  },
  progressSegment: {
    height: 2.5,
    borderRadius: 1.5,
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
  // Viewers Modal Styles
  viewersBtnWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 3,
  },
  viewersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  viewersBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewersModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  viewersModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '60%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  viewersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  viewersTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  viewersCloseBtn: {
    padding: 4,
  },
  viewersLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewersList: {
    flex: 1,
    paddingTop: 12,
  },
  viewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  viewerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  viewerName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  viewerTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  viewersEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewersEmptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
