/**
 * Feed Card Component
 *
 * Post kartı — carousel (çoklu görsel) desteği ile.
 * Tek görsel → pinch zoom (SnapbackZoom)
 * Çoklu görsel → yatay kaydırmalı carousel + dot indicator
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import Video from 'react-native-video';
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { SnapbackZoom } from "react-native-zoom-toolkit";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { Avatar } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { spacing, radius } from "@/src/constants/design";
import { lightImpact, mediumImpact, heavyImpact } from "@/src/utils/haptics";
import { timeAgo } from "@/src/utils/timeAgo";
import type { Post } from "@/src/services/feedService";
import { useTranslation } from "react-i18next";
import { useStoreReview } from "@/src/hooks/useStoreReview";

export interface FeedCardProps {
  post: Post;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onPlacePress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  /** Video kartları sadece ekranda görünürken oynatılır (performans) */
  isViewable?: boolean;
  onOptionsPress?: () => void;
  onZoomChange?: (zooming: boolean) => void;
}

const FeedCardComponent = ({
  post,
  onPress,
  onAuthorPress,
  onPlacePress,
  onLike,
  onComment,
  onShare,
  onSave,
  isSaved = false,
  isViewable = true,
  onOptionsPress,
  onZoomChange,
}: FeedCardProps) => {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useTranslation();
  const { triggerReviewAction } = useStoreReview();
  const [expanded, setExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const likeScale = useSharedValue(1);
  const zoomScale = useSharedValue(1);

  // Double-tap kalp animasyonu Gesture.Tap tarafından tanınır.
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const [heartPos, setHeartPos] = useState({ x: 0, y: 0 });

  const triggerHeartBurst = useCallback(
    (x: number, y: number) => {
      setHeartPos({ x, y });
      heartScale.value = 0;
      heartOpacity.value = 0;
      heartScale.value = withSequence(
        withSpring(1.4, { damping: 10, stiffness: 200 }),
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 350 })
      );
      heartOpacity.value = withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(1, { duration: 380 }),
        withTiming(0, { duration: 250 })
      );
    },
    [heartScale, heartOpacity]
  );

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(250)
    .onStart((e) => {
      runOnJS(triggerHeartBurst)(e.x, e.y);
      runOnJS(heavyImpact)();
      runOnJS(triggerReviewAction)();
      if (onLike && !post.is_liked) {
        runOnJS(onLike)();
      }
    });

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const mediaList = [...(post.media ?? [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  const isCarousel = mediaList.length > 1;

  // Her medya için ayrı yükseklik hesapla (kırpma olmasın)
  const firstMedia = mediaList[0];
  const displayUrl = firstMedia?.media_url;
  const isVideo = firstMedia?.media_type === "video";

  const imageWidth = screenWidth;

  // Tüm fotoğraflar (tekil veya carousel) sabit 1:1 (Kare) olarak gösterilecek.
  const imageHeight = imageWidth;

  const handleLike = useCallback(() => {
    mediumImpact();
    likeScale.value = withSpring(1.35, { damping: 12 }, () => {
      likeScale.value = withSpring(1);
    });
    triggerReviewAction(); // Store review tetikleyici
    onLike?.();
  }, [onLike, likeScale, triggerReviewAction]);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const wrapperAnimStyle = useAnimatedStyle(() => ({
    zIndex: zoomScale.value > 1.01 ? 999 : 0,
    elevation: zoomScale.value > 1.01 ? 999 : 8,
  }));

  const imageContainerAnimStyle = useAnimatedStyle(() => ({
    zIndex: zoomScale.value > 1.01 ? 100 : 2,
    elevation: zoomScale.value > 1.01 ? 100 : 2,
    overflow: zoomScale.value > 1.01 ? "visible" : "hidden",
  }));

  const notifyZoom = useCallback(
    (val: boolean) => {
      onZoomChange?.(val);
    },
    [onZoomChange]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / imageWidth);
      setCurrentIndex(idx);
    },
    [imageWidth]
  );

  const username = post.author?.username || post.author?.first_name || `user_${post.user_id}`;

  return (
    <Animated.View style={[styles.wrapper, wrapperAnimStyle]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.secondary, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" },
        ]}
      >
        {/* Yazar satırı */}
        <TouchableOpacity style={[styles.authorRow, { backgroundColor: colors.background.secondary }]} onPress={onAuthorPress} activeOpacity={0.8}>
          <Avatar source={post.author?.avatar_url ? { uri: post.author.avatar_url } : undefined} name={post.author?.first_name || username} size={36} />
          <View style={styles.authorText}>
            <Text style={[styles.username, { color: colors.text.primary }]}>{username}</Text>
            {post.place ? (
              <TouchableOpacity onPress={onPlacePress} activeOpacity={0.7}>
                <Text style={[styles.placeLine, { color: colors.text.tertiary }]} numberOfLines={1}>
                  {post.place.name}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.placeLine, { color: colors.text.tertiary }]}>{timeAgo(post.created_at)}</Text>
            )}
          </View>
          {onOptionsPress && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                lightImpact();
                onOptionsPress();
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="ellipsis" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Görsel alanı — çift tıkla beğen */}
        <Animated.View style={[styles.imageContainer, { height: imageHeight }, imageContainerAnimStyle]}>
          <GestureDetector gesture={doubleTapGesture}>
            <View style={{ width: "100%", height: imageHeight, backgroundColor: colors.background.secondary }}>
          {isCarousel ? (
            // ── Carousel mode ──────────────────────────────────────────
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={{ width: imageWidth, height: imageHeight }}
              >
                {mediaList.map((media, idx) => {
                  const isVid = media.media_type === "video";
                  return (
                    <View key={idx} style={{ width: imageWidth, height: imageHeight, alignItems: "center", justifyContent: "center" }}>
                      {isVid ? (
                        <Video
                          source={{ uri: media.media_url }}
                          style={{ width: imageWidth, height: imageHeight }}
                          resizeMode="cover"
                          repeat={true}
                          muted={isMuted}
                          paused={!isViewable}
                        />
                      ) : (
                        <Image
                          source={{ uri: media.media_url }}
                          style={{ width: imageWidth, height: imageHeight }}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* Carousel count badge (Instagram-style top-right) */}
              <View style={styles.carouselBadge}>
                <Text style={styles.carouselBadgeText}>{currentIndex + 1}/{mediaList.length}</Text>
              </View>

              {/* Dot pagination */}
              {mediaList.length <= 10 && (
                <View style={styles.dotsRow}>
                  {mediaList.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === currentIndex
                          ? { backgroundColor: colors.accent.primary, width: 16 }
                          : { backgroundColor: "rgba(255,255,255,0.5)", width: 6 },
                      ]}
                    />
                  ))}
                </View>
              )}
            </>
          ) : (
            // ── Single image mode with pinch zoom ──────────────────────
            <>
              <SnapbackZoom
                timingConfig={{ duration: 200 }}
                onPinchStart={() => notifyZoom(true)}
                onGestureEnd={() => notifyZoom(false)}
                onUpdate={(e) => {
                  "worklet";
                  zoomScale.value = e.scale;
                }}
              >
                {displayUrl ? (
                  isVideo ? (
                    <Video
                      source={{ uri: displayUrl }}
                      style={{ width: imageWidth, height: imageHeight }}
                      resizeMode="cover"
                      repeat={true}
                      muted={isMuted}
                      paused={!isViewable}
                    />
                  ) : (
                    <Image source={{ uri: displayUrl }} style={{ width: imageWidth, height: imageHeight }} contentFit="cover" cachePolicy="memory-disk" />
                  )
                ) : (
                  <View style={[{ width: imageWidth, height: imageHeight }, styles.imagePlaceholder, { backgroundColor: colors.surface.elevated }]}>
                    <IconSymbol name="photo" size={40} color={colors.text.tertiary} />
                  </View>
                )}
              </SnapbackZoom>
            </>
          )}
            </View>
          </GestureDetector>

          {/* Animasyonlu Kalp İkonu (üst üste binecek) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartBurst,
              { left: heartPos.x - 40, top: heartPos.y - 40 },
              heartAnimStyle,
            ]}
          >
            <IconSymbol name="heart.fill" size={72} color="#ff375f" />
          </Animated.View>

          {/* Video mute/unmute butonu */}
          {(isVideo || mediaList.some(m => m.media_type === 'video')) && isViewable && (
            <TouchableOpacity
              style={styles.muteBtn}
              onPress={() => {
                lightImpact();
                setIsMuted(prev => !prev);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name={isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill"} size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* İçerik alanı */}
        <View style={[styles.content, { backgroundColor: colors.background.secondary }]}>
          <View style={styles.actions}>
            <View style={styles.actionsLeft}>
              <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
                <Animated.View style={[styles.actionInner, likeAnimatedStyle]}>
                  <IconSymbol name={post.is_liked ? "heart.fill" : "heart"} size={24} color={post.is_liked ? "#ff375f" : colors.text.secondary} />
                  <Text style={[styles.actionCount, { color: colors.text.secondary }]}>{post.like_count}</Text>
                </Animated.View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  lightImpact();
                  onComment?.();
                }}
                activeOpacity={0.7}
              >
                <IconSymbol name="bubble.right" size={22} color={colors.text.secondary} />
                <Text style={[styles.actionCount, { color: colors.text.secondary }]}>{post.comment_count}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  lightImpact();
                  onShare?.();
                }}
                activeOpacity={0.7}
              >
                <IconSymbol name="paperplane" size={22} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Kaydet (Bookmark) Butonu */}
            <TouchableOpacity
              style={styles.actionBtnSave}
              onPress={() => {
                lightImpact();
                onSave?.();
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name={isSaved ? "bookmark.fill" : "bookmark"} size={22} color={isSaved ? colors.text.primary : colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {post.caption ? (
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                setExpanded((e) => !e);
              }}
              activeOpacity={0.8}
              style={styles.captionWrap}
            >
              <Text style={[styles.caption, { color: colors.text.primary }]} numberOfLines={expanded ? undefined : 2}>
                {post.caption}
              </Text>
              {post.caption.length > 80 && !expanded && <Text style={[styles.more, { color: colors.text.tertiary }]}>{t('feed.more')}</Text>}
              <Text style={[styles.captionTime, { color: colors.text.tertiary }]}>{timeAgo(post.created_at)}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.captionTime, { color: colors.text.tertiary }]}>{timeAgo(post.created_at)}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: "#000",
    elevation: 8,
  },
  card: {
    borderRadius: radius.lg,
    overflow: "visible",
    borderWidth: StyleSheet.hairlineWidth,
  },
  imageContainer: {
    width: "100%",
    overflow: "hidden",
    zIndex: 2,
    position: "relative",
  },
  heartBurst: {
    position: "absolute",
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  heartEmoji: {
    fontSize: 72,
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    overflow: "hidden",
  },
  authorText: { flex: 1 },
  moreBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  username: {
    fontSize: 14,
    fontWeight: "700",
  },
  placeLine: {
    fontSize: 12,
    marginTop: 3,
  },
  videoBadge: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
  },
  muteBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  // ── Carousel ──
  carouselBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  carouselBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  // ── Content ──
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    overflow: "hidden",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  actionsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  actionBtnSave: {
    padding: 4,
  },
  actionInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  captionWrap: {
    marginTop: 0,
  },
  caption: {
    fontSize: 14,
    lineHeight: 22,
  },
  captionTime: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
  },
  more: {
    fontSize: 13,
    marginTop: 4,
  },
});

export const FeedCard = React.memo(
  FeedCardComponent,
  (prevProps, nextProps) => 
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.is_liked === nextProps.post.is_liked &&
    prevProps.post.like_count === nextProps.post.like_count &&
    prevProps.post.comment_count === nextProps.post.comment_count &&
    prevProps.isSaved === nextProps.isSaved &&
    prevProps.isViewable === nextProps.isViewable
);
