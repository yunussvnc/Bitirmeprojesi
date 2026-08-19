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
  ScrollView,
  Alert,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Image } from 'expo-image';
import Video from 'react-native-video';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Avatar } from '@/src/components/ui/Avatar';
import { lightImpact, success } from '@/src/utils/haptics';
import type { Story } from '@/src/services/storyService';
import {
  replyToStory,
  reactToStory,
  updateStoryViewAnalytics,
  recordStoryView,
  getStoryViewers,
  deleteStory,
  reportStory,
  STORY_EMOJIS,
  type StoryEmoji,
  type StoryViewerItem,
  type StoryReportReason,
} from '@/src/services/storyService';
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
  }, [index, story?.id, isImage, visible, startProgress, progressAnim]);

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
            } catch (e) {
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

  // ── Paylaş (basit — ileride kullanıcı seçim ekranı eklenebilir) ──
  const handleSharePress = useCallback(() => {
    if (!story) return;
    lightImpact();
    // Basit bir prompt ile user ID sor (ileride tam arayüz eklenecek)
    Alert.prompt?.(
      'Hikayeyi Paylaş',
      'Göndermek istediğiniz kişinin kullanıcı ID\'sini girin:',
      async (text) => {
        const uid = parseInt(text, 10);
        if (!uid || isNaN(uid)) return;
        try {
          const { shareStoryViaDM } = await import('@/src/services/storyService');
          await shareStoryViaDM(story.id, uid);
          success();
          Alert.alert('Başarılı', 'Hikaye DM olarak gönderildi.');
        } catch (e: any) {
          const detail = e?.response?.data?.detail || 'Gönderilemedi.';
          Alert.alert('Hata', detail);
        }
      },
      'plain-text'
    );
  }, [story]);

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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.viewerName}>{v.user.first_name || v.user.username || 'U'}</Text>
                        {v.reaction === '❤️' && <IconSymbol name="heart.fill" size={14} color="#ef4444" />}
                      </View>
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

      {/* ── Kendi Hikayem — 3-Nokta Menü ── */}
      <Modal
        visible={showOwnMenu}
        transparent
        animationType="fade"
        onRequestClose={closeOwnMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeOwnMenu}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteStory}>
              <IconSymbol name="trash" size={20} color="#ef4444" />
              <Text style={[styles.menuItemText, { color: '#ef4444' }]}>Hikayeyi Sil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={closeOwnMenu}>
              <IconSymbol name="xmark" size={20} color="#fff" />
              <Text style={styles.menuItemText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Başkasının Hikayesi — 3-Nokta Menü ── */}
      <Modal
        visible={showOtherMenu}
        transparent
        animationType="fade"
        onRequestClose={closeOtherMenu}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeOtherMenu}>
          <View style={styles.menuContent}>
            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowOtherMenu(false);
              setShowReportMenu(true);
            }}>
              <IconSymbol name="exclamationmark.triangle" size={20} color="#f59e0b" />
              <Text style={styles.menuItemText}>Şikayet Et</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={closeOtherMenu}>
              <IconSymbol name="xmark" size={20} color="#fff" />
              <Text style={styles.menuItemText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Şikayet Nedeni Seçimi ── */}
      <Modal
        visible={showReportMenu}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowReportMenu(false);
          isPausedRef.current = false;
          setVideoPaused(false);
          if (isImage) startProgress(progressValueRef.current);
        }}
      >
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => {
          setShowReportMenu(false);
          isPausedRef.current = false;
          setVideoPaused(false);
          if (isImage) startProgress(progressValueRef.current);
        }}>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Şikayet Nedeni</Text>
            {[
              { key: 'spam' as StoryReportReason, label: 'Spam', icon: 'envelope.badge' },
              { key: 'inappropriate' as StoryReportReason, label: 'Uygunsuz İçerik', icon: 'eye.slash' },
              { key: 'violence' as StoryReportReason, label: 'Şiddet', icon: 'exclamationmark.shield' },
              { key: 'harassment' as StoryReportReason, label: 'Taciz', icon: 'person.crop.circle.badge.exclamationmark' },
              { key: 'other' as StoryReportReason, label: 'Diğer', icon: 'questionmark.circle' },
            ].map((r) => (
              <TouchableOpacity key={r.key} style={styles.menuItem} onPress={() => handleReport(r.key)}>
                <IconSymbol name={r.icon as any} size={18} color="#fff" />
                <Text style={styles.menuItemText}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
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
  closeFriendsBadge: {
    fontSize: 12,
    color: '#4ade80',
    fontWeight: '700',
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
  likeBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
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
  // ── Menü Modal Styles ──
  menuOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  menuContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
