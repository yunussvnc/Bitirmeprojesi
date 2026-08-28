import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Animated, Keyboard, PanResponder, Platform, Alert } from 'react-native';
import { lightImpact, success } from '@/src/utils/haptics';
import {
  replyToStory,
  reactToStory,
  updateStoryViewAnalytics,
  recordStoryView,
  getStoryViewers,
  deleteStory,
  reportStory,
  type Story,
  type StoryEmoji,
  type StoryViewerItem,
  type StoryReportReason,
} from '@/src/services/storyService';

const STORY_DURATION_MS = 5000;
const LONG_PRESS_DELAY = 200;

export interface UseStoryViewerControllerParams {
  stories: Story[];
  initialIndex?: number;
  visible?: boolean;
  onClose: () => void;
  onStoryViewed?: (storyId: number) => void;
  onAuthorNavigate?: (route: string, currentIndex: number) => void;
  onPlaceNavigate?: (route: string, currentIndex: number) => void;
  currentUserId?: number;
  onStoryDeleted?: (storyId: number) => void;
  screenHeight: number;
}

export function useStoryViewerController({
  stories,
  initialIndex = 0,
  visible = true,
  onClose,
  onStoryViewed,
  onAuthorNavigate,
  onPlaceNavigate,
  currentUserId,
  onStoryDeleted,
  screenHeight,
}: UseStoryViewerControllerParams) {
  const [index, setIndex] = useState(initialIndex);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [showEmojiTray, setShowEmojiTray] = useState(false);
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionSending, setReactionSending] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);

  const openedAtRef = useRef<number>(Date.now());
  const isPausedRef = useRef(false);
  const isPinchedRef = useRef(false);
  const progressValueRef = useRef(0);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keyboardVisibleRef = useRef(false);
  const startProgressFromCurrentRef = useRef<() => void>(() => {});
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [viewers, setViewers] = useState<StoryViewerItem[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);

  const [showOwnMenu, setShowOwnMenu] = useState(false);
  const [showOtherMenu, setShowOtherMenu] = useState(false);
  const [showReportMenu, setShowReportMenu] = useState(false);

  useEffect(() => {
    setIndex(initialIndex);
    openedAtRef.current = Date.now();
  }, [initialIndex, stories]);

  const story = stories[index];
  const isImage = story?.media_type !== 'video';
  const isImageRef = useRef(isImage);
  isImageRef.current = isImage;

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
        startProgressFromCurrentRef.current();
      }
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [animKeyboard, progressAnim]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, (story as Story | undefined)?.id]);

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
  startProgressFromCurrentRef.current = startProgressFromCurrent;

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
    if (isPausedRef.current && !isPinchedRef.current) {
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
      toValue: screenHeight,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      dragY.setValue(0);
      onClose();
    });
  }, [dragY, onClose, sendAnalytics, screenHeight]);

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

  const storyPlaceId = story?.place_id ?? story?.place?.id;
  const handlePlacePress = useCallback(() => {
    if (!storyPlaceId) return;
    lightImpact();
    sendAnalytics({ visitedPlace: true });
    onPlaceNavigate?.(`/place/${storyPlaceId}`, index);
  }, [storyPlaceId, index, onPlaceNavigate, sendAnalytics]);

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
      if ((res as any).action === 'removed') {
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
    if (!(story as Story | undefined)?.link_type || !(story as Story | undefined)?.link_id) return;
    lightImpact();
    sendAnalytics({ visitedPlace: (story as Story).link_type === 'place' });
    if ((story as Story).link_type === 'place') {
      onPlaceNavigate?.(`/place/${(story as Story).link_id}`, index);
    } else if ((story as Story).link_type === 'profile') {
      onAuthorNavigate?.(`/user/${(story as Story).link_id}`, index);
    }
  }, [story, index, onPlaceNavigate, onAuthorNavigate, sendAnalytics]);

  const isOwnStory = (story as Story | undefined)?.user_id != null && currentUserId != null && (story as Story).user_id === currentUserId;

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
        const aHasReaction = !!a.reaction;
        const bHasReaction = !!b.reaction;
        if (aHasReaction && !bHasReaction) return -1;
        if (!aHasReaction && bHasReaction) return 1;
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

  return {
    index,
    story,
    isImage,
    progressAnim,
    dragY,
    panHandlers: (panResponder as any).panHandlers,
    uiVisible,
    videoPaused,
    isPinchedRef,
    goPrev,
    goNext,
    handlePressIn,
    handlePressOut,
    handleVideoProgress,
    handleVideoEnd,

    handleAuthorPress,
    handlePlacePress,
    handleLinkSticker,

    replyText,
    setReplyText,
    replySending,
    handleSendReply,
    showEmojiTray,
    setShowEmojiTray,
    myReaction,
    reactionSending,
    handleReaction,

    viewersModalVisible,
    viewers,
    viewersLoading,
    openViewersList,
    closeViewersList,

    showOwnMenu,
    openOwnMenu,
    closeOwnMenu,
    handleDeleteStory,

    showOtherMenu,
    openOtherMenu,
    closeOtherMenu,
    openReportMenu,
    showReportMenu,
    closeReportMenu,
    handleReport,

    shareSheetVisible,
    handleSharePress,
    handleShareSheetClose,

    animKeyboard,
    isOwnStory,
  } as const;
}
