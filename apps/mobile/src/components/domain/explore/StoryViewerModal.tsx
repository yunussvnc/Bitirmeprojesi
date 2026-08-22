/**
 * StoryViewerModal – Hikaye fullscreen izleyici
 * Instagram tarzı: otomatik geçiş, animasyonlu progress bar, tap ile önceki/sonraki
 * Share, Delete, Report, Close Friends indicator dahil.
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
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import Video from 'react-native-video';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Avatar } from '@/src/components/ui/Avatar';
import { lightImpact, success } from '@/src/utils/haptics';
import {
  replyToStory,
  reactToStory,
  updateStoryViewAnalytics,
  recordStoryView,
  getStoryViewers,
  deleteStory,
  reportStory,
  STORY_EMOJIS,
  type Story,
  type StoryEmoji,
  type StoryViewerItem,
  type StoryReportReason,
} from '@/src/services/storyService';
import { timeAgo } from '@/src/utils/timeAgo';
import { useTranslation } from 'react-i18next';
import { styles } from './story-viewer/styles';
import { StoryViewerOverlays } from './story-viewer/StoryViewerOverlays';

const STORY_DURATION_MS = 5000;
const LONG_PRESS_DELAY = 200;

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
  /** Hikaye silindikten sonra parent'a bilgi vermek için */
  onStoryDeleted?: (storyId: number) => void;
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
  onStoryDeleted,
}: StoryViewerModalProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const [index, setIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionSending, setReactionSending] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
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
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  // Menü state'leri
  const [showOwnMenu, setShowOwnMenu] = useState(false);
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);

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
      isPausedRef.current = true;
      setVideoPaused(true);
      if (isImageRef.current) {
        progressAnim.stopAnimation();
      }
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardVisibleRef.current = false;
      Animated.timing(animKeyboard, { toValue: 0, duration: 250, useNativeDriver: false }).start();
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
  const isCloseFriends = story?.privacy_type === 'close_friends' || story?.is_close_friends;

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
      recordStoryView(story.id, 'feed').catch(() => {});
    }
  }, [index, story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analitik
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

  // İmage progress
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

  useEffect(() => {
    if (!story || !isImage || !visible) return;
    progressValueRef.current = 0;
    startProgress(0);
    return () => {
      progressAnim.stopAnimation();
    };
  }, [story, isImage, visible, startProgress, progressAnim]);

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
    if (viewersModalVisible || showOwnMenu || showOtherMenu || showReportMenu) return;
    longPressTimerRef.current = setTimeout(() => {
      setUiVisible(false);
      setVideoPaused(true);
      isPausedRef.current = true;
      progressAnim.stopAnimation();
    }, LONG_PRESS_DELAY);
  }, [progressAnim, viewersModalVisible, showOwnMenu, showOtherMenu, showReportMenu]);

  const handlePressOut = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (isPausedRef.current) {
      isPausedRef.current = false;
      setVideoPaused(false);
      setUiVisible(true);
      if (isImage) {
        startProgress(progressValueRef.current);
      }
    }
  }, [isImage, startProgress]);

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
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || 'Yanıt gönderilemedi.';
      Alert.alert('Hata', detail);
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
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || 'Tepki gönderilemedi.';
      Alert.alert('Hata', detail);
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
  const canShare = !isCloseFriends;

  // ── Silme ──
  const handleDeleteStory = useCallback(async () => {
    if (!story) return;
    setShowOwnMenu(false);
    Alert.alert(
      'Hikayeyi Sil',
      'Bu hikaye kalıcı olarak silinecek. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel', onPress: () => {
          isPausedRef.current = false;
          setVideoPaused(false);
          if (isImage) startProgress(progressValueRef.current);
        }},
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStory(story.id);
              success();
              onStoryDeleted?.(story.id);
              goNext();
            } catch {
              Alert.alert('Hata', 'Hikaye silinemedi.');
              isPausedRef.current = false;
              setVideoPaused(false);
              if (isImage) startProgress(progressValueRef.current);
            }
          },
        },
      ]
    );
  }, [story, goNext, onStoryDeleted, isImage, startProgress]);

  // ── Şikayet ──
  const handleReport = useCallback(async (reason: StoryReportReason) => {
    if (!story) return;
    setShowReportMenu(false);
    try {
      await reportStory(story.id, reason);
      success();
      Alert.alert('Teşekkürler', 'Şikayetiniz incelenmek üzere alındı.');
    } catch (e: any) {
      const detail = e?.response?.data?.detail || 'Şikayet gönderilemedi.';
      Alert.alert('Hata', detail);
    } finally {
      isPausedRef.current = false;
      setVideoPaused(false);
      if (isImage) startProgress(progressValueRef.current);
    }
  }, [story, isImage, startProgress]);

  // ── Paylaş — ShareStorySheet aç ──
  const handleSharePress = useCallback(() => {
    if (!story) return;
    lightImpact();
    isPausedRef.current = true;
    setVideoPaused(true);
    progressAnim.stopAnimation();
    setShareSheetVisible(true);
  }, [story, progressAnim]);

  const handleShareSheetClose = useCallback(() => {
    setShareSheetVisible(false);
    isPausedRef.current = false;
    setVideoPaused(false);
    if (isImage) startProgress(progressValueRef.current);
  }, [isImage, startProgress]);

  // ── Menü Açma/Kapama ──
  const openOwnMenu = useCallback(() => {
    isPausedRef.current = true;
    setVideoPaused(true);
    progressAnim.stopAnimation();
    setShowOwnMenu(true);
  }, [progressAnim]);

  const closeOwnMenu = useCallback(() => {
    setShowOwnMenu(false);
    isPausedRef.current = false;
    setVideoPaused(false);
    if (isImage) startProgress(progressValueRef.current);
  }, [isImage, startProgress]);

  const openOtherMenu = useCallback(() => {
    isPausedRef.current = true;
    setVideoPaused(true);
    progressAnim.stopAnimation();
    setShowOtherMenu(true);
  }, [progressAnim]);

  const closeOtherMenu = useCallback(() => {
    setShowOtherMenu(false);
    isPausedRef.current = false;
    setVideoPaused(false);
    if (isImage) startProgress(progressValueRef.current);
  }, [isImage, startProgress]);

  const openReportMenu = useCallback(() => {
    setShowOtherMenu(false);
    setShowReportMenu(true);
  }, []);

  const closeReportMenu = useCallback(() => {
    setShowReportMenu(false);
    isPausedRef.current = false;
    setVideoPaused(false);
    if (isImage) startProgress(progressValueRef.current);
  }, [isImage, startProgress]);

  const openViewersList = useCallback(async () => {
    if (!story) return;
    setVideoPaused(true);
    isPausedRef.current = true;
    progressAnim.stopAnimation();
    setViewersModalVisible(true);
    setViewersLoading(true);
    try {
      const res = await getStoryViewers(story.id);
      const sorted = (res.items || []).sort((a, b) => {
        const aHasHeart = a.reaction === '❤️';
        const bHasHeart = b.reaction === '❤️';
        if (aHasHeart && !bHasHeart) return -1;
        if (!aHasHeart && bHasHeart) return 1;
        const aTime = new Date(a.viewed_at).getTime();
        const bTime = new Date(b.viewed_at).getTime();
        return bTime - aTime;
      });
      setViewers(sorted);
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

  // Progress bar renkleri
  const progressFillColor = isCloseFriends ? 'rgba(74,222,128,0.9)' : 'rgba(255,255,255,0.9)';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
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
            resizeMode="cover"
            paused={!visible || videoPaused}
            repeat={false}
            onProgress={handleVideoProgress}
            onEnd={handleVideoEnd}
          />
        ) : (
          <Image
            source={{ uri: story.media_url }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
            contentFit="cover"
          />
        )}

        <View style={styles.tapZones} pointerEvents="box-none">
          <Pressable style={styles.tapLeft} onPress={goPrev} onPressIn={handlePressIn} onPressOut={handlePressOut} />
          <Pressable style={styles.tapRight} onPress={goNext} onPressIn={handlePressIn} onPressOut={handlePressOut} />
        </View>

        {/* ── Progress Bar ── */}
        {uiVisible && (
          <View style={styles.progressRow}>
            {stories.map((_, i) => {
              const isCompleted = i < index;
              const isActive = i === index;
              return (
                <View key={i} style={[styles.progressSegment, { flex: 1 }]}>
                  <View style={styles.progressBg} />
                  {isCompleted && <View style={[styles.progressFillCompleted, { backgroundColor: progressFillColor }]} />}
                  {isActive && (
                    <View style={styles.progressActiveWrap}>
                      <Animated.View
                        style={[styles.progressFillActive, { flex: progressAnim, backgroundColor: progressFillColor }]}
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

        {/* ── Author Bar ── */}
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
                    {isCloseFriends && <Text style={styles.closeFriendsBadge}>★</Text>}
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.authorNameRow}>
                  <Text style={styles.authorName}>
                    {story.author?.first_name || story.author?.username || t('profile.user')}
                  </Text>
                  <Text style={styles.timeAgo}>{timeAgo(story.created_at)}</Text>
                  {isCloseFriends && <Text style={styles.closeFriendsBadge}>★</Text>}
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

            {/* 3-Nokta Menü Butonu */}
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={isOwnStory ? openOwnMenu : openOtherMenu}
              activeOpacity={0.7}
            >
              <IconSymbol name="ellipsis" size={20} color="#fff" />
            </TouchableOpacity>

            {/* Close butonu */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Link Sticker ── */}
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

        {/* ── Yanıt Kutusu + Emoji Tray + Share (başkasının hikayesinde) ── */}
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
              
              {!replyText.trim() ? (
                <>
                  <TouchableOpacity
                    style={styles.likeBtn}
                    onPress={() => handleReaction('❤️')}
                    disabled={reactionSending}
                  >
                    <IconSymbol name={myReaction === '❤️' ? "heart.fill" : "heart"} size={26} color={myReaction === '❤️' ? "#ef4444" : "#fff"} />
                  </TouchableOpacity>
                  {/* Paylaş butonu */}
                  {canShare && (
                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={handleSharePress}
                      activeOpacity={0.7}
                    >
                      <IconSymbol name="paperplane" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
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
              )}
            </View>
          </Animated.View>
        )}

        {/* ── İzleyenler Butonu (Kendi Hikayesinde) — Sayı ile birlikte ── */}
        {isOwnStory && uiVisible && (
          <Animated.View style={[styles.viewersBtnWrap, { bottom: Animated.add(Platform.OS === 'ios' ? 36 : 20, animKeyboard) }]} pointerEvents="box-none">
            <TouchableOpacity style={styles.viewersBtn} onPress={openViewersList} activeOpacity={0.8}>
              <IconSymbol name="eye" size={16} color="#fff" />
              <Text style={styles.viewersBtnText}>
                {story.view_count != null && story.view_count > 0
                  ? `${story.view_count} Görüntülenme`
                  : t('story.viewers', { defaultValue: 'İzleyenleri Gör' })}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      <StoryViewerOverlays
        story={story}
        viewersModalVisible={viewersModalVisible}
        viewers={viewers}
        viewersLoading={viewersLoading}
        onCloseViewers={closeViewersList}
        showOwnMenu={showOwnMenu}
        onCloseOwnMenu={closeOwnMenu}
        onDeleteStory={handleDeleteStory}
        showOtherMenu={showOtherMenu}
        onCloseOtherMenu={closeOtherMenu}
        onOpenReportMenu={openReportMenu}
        showReportMenu={showReportMenu}
        onCloseReportMenu={closeReportMenu}
        onReport={handleReport}
        shareSheetVisible={shareSheetVisible}
        onCloseShareSheet={handleShareSheetClose}
      />
    </Modal>
  );
}
