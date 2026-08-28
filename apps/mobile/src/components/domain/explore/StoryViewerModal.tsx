/**
 * StoryViewerModal – Hikaye fullscreen izleyici
 * Instagram tarzı: otomatik geçiş, animasyonlu progress bar, tap ile önceki/sonraki
 * Share, Delete, Report, Close Friends indicator dahil.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  TextInput,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SnapbackZoom } from "react-native-zoom-toolkit";
import { Image } from 'expo-image';
import Video from 'react-native-video';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { Avatar } from '@/src/components/ui/Avatar';
import { styles } from './story-viewer/styles';
import { StoryViewerOverlays } from './story-viewer/StoryViewerOverlays';
import { STORY_EMOJIS, type Story } from '@/src/services/storyService';
import { timeAgo } from '@/src/utils/timeAgo';
import { useTranslation } from 'react-i18next';
import { useStoryViewerController } from './story-viewer/useStoryViewerController';
import { getProgressFillColor, isStoryCloseFriends } from './story-viewer/storyViewerUtils';

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
  const { t } = useTranslation();

  const {
    index,
    story,
    progressAnim,
    dragY,
    panHandlers,
    uiVisible,
    videoPaused,
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
    isPinchedRef,
  } = useStoryViewerController({
    stories,
    initialIndex,
    visible,
    onClose,
    onStoryViewed,
    onAuthorNavigate,
    onPlaceNavigate,
    currentUserId,
    onStoryDeleted,
    screenHeight: SCREEN_HEIGHT,
  });

  if (!story) return null;

  const isCloseFriends = isStoryCloseFriends(story);
  const isOwnStory = story?.user_id != null && currentUserId != null && story.user_id === currentUserId;
  const showReplyBar = !isOwnStory;
  const canShare = !isCloseFriends;

  const overlayOpacity = dragY.interpolate({
    inputRange: [0, SCREEN_HEIGHT * 0.4],
    outputRange: [1, 0.3],
    extrapolate: 'clamp',
  });

  const progressFillColor = getProgressFillColor(isCloseFriends);

  const singleTap = useMemo(() => {
    return Gesture.Tap().onEnd((e) => {
      if (viewersModalVisible || showOwnMenu || showOtherMenu || showReportMenu) return;
      if (e.x < SCREEN_WIDTH * 0.3) {
        runOnJS(goPrev)();
      } else {
        runOnJS(goNext)();
      }
    });
  }, [goPrev, goNext, viewersModalVisible, showOwnMenu, showOtherMenu, showReportMenu, SCREEN_WIDTH]);

  const longPress = useMemo(() => {
    return Gesture.LongPress()
      .minDuration(250)
      .onStart(() => {
        runOnJS(handlePressIn)();
      })
      .onEnd(() => {
        runOnJS(handlePressOut)();
      })
      .onTouchesCancelled(() => {
        runOnJS(handlePressOut)();
      });
  }, [handlePressIn, handlePressOut]);

  const composedGestures = useMemo(() => {
    return Gesture.Exclusive(longPress, singleTap);
  }, [longPress, singleTap]);

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
        {...panHandlers}
      >
        <GestureDetector gesture={composedGestures}>
          <View style={StyleSheet.absoluteFillObject} pointerEvents="auto">
            <SnapbackZoom
              timingConfig={{ duration: 200 }}
              onPinchStart={() => {
                isPinchedRef.current = true;
                runOnJS(handlePressIn)();
              }}
              onGestureEnd={() => {
                isPinchedRef.current = false;
                runOnJS(handlePressOut)();
              }}
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
            </SnapbackZoom>
          </View>
        </GestureDetector>

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

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={isOwnStory ? openOwnMenu : openOtherMenu}
              activeOpacity={0.7}
            >
              <IconSymbol name="ellipsis" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <IconSymbol name="xmark" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

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

        {showReplyBar && uiVisible && (
          <Animated.View style={[styles.replyBar, { bottom: Animated.add(Platform.OS === 'ios' ? 36 : 20, animKeyboard) }]} pointerEvents="box-none">
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
