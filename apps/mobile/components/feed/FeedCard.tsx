/**
 * Feed Card Component
 *
 * Post kartı — PlaceCard ile aynı tasarım diline sahip:
 * yuvarlak köşeler, derinlik gölgesi, görsel üzerinde gradient overlay.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Image } from "expo-image";
import { useTheme } from "@/hooks/useTheme";
import { Avatar } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { spacing, radius } from "@/constants/design";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";
import { timeAgo } from "@/src/utils/timeAgo";
import type { Post } from "@/src/services/feedService";

export interface FeedCardProps {
  post: Post;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onPlacePress?: () => void;
  onLike?: () => void;
  onComment?: () => void;
}

export function FeedCard({
  post,
  onPress,
  onAuthorPress,
  onPlacePress,
  onLike,
  onComment,
}: FeedCardProps) {
  const { colors, isDark } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const likeScale = useSharedValue(1);

  const handleLike = useCallback(() => {
    mediumImpact();
    likeScale.value = withSpring(1.35, { damping: 12 }, () => {
      likeScale.value = withSpring(1);
    });
    onLike?.();
  }, [onLike, likeScale]);

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const firstMedia = post.media[0];
  const displayUrl = firstMedia?.media_url;
  const isVideo = firstMedia?.media_type === "video";
  const username = post.author?.username || post.author?.first_name || `user_${post.user_id}`;

  const depthEdgeColor = isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.10)";
  const depthHighlightColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.8)";

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { backgroundColor: colors.background.secondary, borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
        {/* Yazar satırı — fotoğrafın üstünde */}
        <TouchableOpacity
          style={[styles.authorRow, { backgroundColor: colors.background.secondary }]}
          onPress={onAuthorPress}
          activeOpacity={0.8}
        >
          <Avatar
            source={post.author?.avatar_url ? { uri: post.author.avatar_url } : undefined}
            name={post.author?.first_name || username}
            size={36}
          />
          <View style={styles.authorText}>
            <Text style={[styles.username, { color: colors.text.primary }]}>@{username}</Text>
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
          <Text style={[styles.time, { color: colors.text.tertiary }]}>{timeAgo(post.created_at)}</Text>
        </TouchableOpacity>

        {/* Görsel */}
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={onPress}
          onLongPress={handleLike}
          activeOpacity={0.96}
        >
          {displayUrl ? (
            <Image
              source={{ uri: displayUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="photo" size={40} color={colors.text.tertiary} />
            </View>
          )}
          {isVideo && (
            <View style={styles.videoBadge}>
              <IconSymbol name="play.circle.fill" size={30} color="rgba(255,255,255,0.9)" />
            </View>
          )}
        </TouchableOpacity>

        {/* İçerik alanı */}
        <View style={[styles.content, { backgroundColor: colors.background.secondary }]}>
          {/* Aksiyon satırı */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike} activeOpacity={0.7}>
              <Animated.View style={[styles.actionInner, likeAnimatedStyle]}>
                <IconSymbol
                  name={post.is_liked ? "heart.fill" : "heart"}
                  size={22}
                  color={post.is_liked ? "#ff375f" : colors.text.secondary}
                />
                <Text style={[styles.actionCount, { color: colors.text.secondary }]}>
                  {post.like_count}
                </Text>
              </Animated.View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => { lightImpact(); onComment?.(); }}
              activeOpacity={0.7}
            >
              <IconSymbol name="bubble.right" size={20} color={colors.text.secondary} />
              <Text style={[styles.actionCount, { color: colors.text.secondary }]}>
                {post.comment_count}
              </Text>
            </TouchableOpacity>
          </View>


          {/* Caption */}
          {post.caption ? (
            <TouchableOpacity
              onPress={() => { lightImpact(); setExpanded((e) => !e); }}
              activeOpacity={0.8}
              style={styles.captionWrap}
            >
              <Text
                style={[styles.caption, { color: colors.text.primary }]}
                numberOfLines={expanded ? undefined : 2}
              >
                {post.caption}
              </Text>
              {post.caption.length > 80 && !expanded && (
                <Text style={[styles.more, { color: colors.text.tertiary }]}>daha fazla</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  depthLayer: {
    position: "absolute",
    left: 2,
    right: 2,
    bottom: -4,
    height: 8,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  topHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    zIndex: 10,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 4 / 3,
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
  },
  authorText: { flex: 1 },
  username: {
    fontSize: 14,
    fontWeight: "700",
  },
  time: {
    fontSize: 12,
    marginTop: 3,
  },
  videoBadge: {
    position: "absolute",
    bottom: spacing.md,
    right: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
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
  placeLine: {
    fontSize: 12,
    marginTop: 3,
  },
  captionWrap: {
    marginTop: 0,
  },
  caption: {
    fontSize: 14,
    lineHeight: 22,
  },
  captionUser: {
    fontWeight: "700",
  },
  more: {
    fontSize: 13,
    marginTop: 4,
  },
  bottomEdge: {
    height: 3,
    marginTop: -1,
  },
});
