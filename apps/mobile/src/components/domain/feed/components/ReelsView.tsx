/**
 * ReelsView – TikTok-style vertical video feed
 * Full-screen reels with viewability-based auto-play.
 */

import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ViewToken,
  Platform,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import { router } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { spacing } from "@/src/constants/design";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";
import type { Post } from "@/src/services/feedService";
import { EmptyState } from "@/src/components/ui";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export interface ReelsViewProps {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onLoadMore: () => void;
  onLike: (post: Post) => void;
  onComment: (post: Post) => void;
  total: number;
}

function ReelCell({
  post,
  isActive,
  onLike,
  onComment,
}: {
  post: Post;
  isActive: boolean;
  onLike: () => void;
  onComment: () => void;
}) {
  const { colors } = useTheme();
  const videoRef = useRef<Video>(null);
  const firstMedia = post.media[0];
  const videoUrl = firstMedia?.media_type === "video" ? firstMedia?.media_url : null;

  React.useEffect(() => {
    if (isActive && videoUrl) {
      videoRef.current?.playAsync().catch(() => {});
    } else {
      videoRef.current?.pauseAsync().catch(() => {});
    }
  }, [isActive, videoUrl]);

  const username = post.author?.username || post.author?.first_name || `user_${post.user_id}`;

  return (
    <View style={[styles.cell, { height: SCREEN_HEIGHT }]}>
      {videoUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={false}
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surface.elevated }]}>
          <IconSymbol name="play.circle.fill" size={64} color={colors.text.tertiary} />
        </View>
      )}

      {/* Bottom overlay */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.push(`/user/${post.user_id}` as any);
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.username, { color: colors.text.primary }]}>@{username}</Text>
        </TouchableOpacity>
        {post.place && (
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              post.place_id && router.push(`/place/${post.place_id}` as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.placeText, { color: colors.text.secondary }]}>📍 {post.place.name}</Text>
          </TouchableOpacity>
        )}
        {post.caption ? (
          <Text style={[styles.caption, { color: colors.text.secondary }]} numberOfLines={2}>
            {post.caption}
          </Text>
        ) : null}
      </View>

      {/* Right action column */}
      <View style={styles.actionsColumn}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => {
            mediumImpact();
            onLike();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={post.is_liked ? "heart.fill" : "heart"}
            size={32}
            color={post.is_liked ? "#ff375f" : colors.semantic.onDarkBackground}
          />
          <Text style={[styles.actionLabel, { color: colors.semantic.onDarkBackground }]}>{post.like_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => {
            lightImpact();
            onComment();
          }}
          activeOpacity={0.7}
        >
          <IconSymbol name="bubble.right" size={28} color={colors.semantic.onDarkBackground} />
          <Text style={[styles.actionLabel, { color: colors.semantic.onDarkBackground }]}>{post.comment_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => lightImpact()} activeOpacity={0.7}>
          <IconSymbol name="paperplane" size={26} color={colors.semantic.onDarkBackground} />
        </TouchableOpacity>
        {post.place_id && (
          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => {
              lightImpact();
              router.push(`/place/${post.place_id}` as any);
            }}
            activeOpacity={0.7}
          >
            <IconSymbol name="mappin.circle.fill" size={28} color={colors.semantic.onDarkBackground} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function ReelsView({ posts, loading, refreshing, onRefresh, onLoadMore, onLike, onComment, total }: ReelsViewProps) {
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <ReelCell post={item} isActive={index === activeIndex} onLike={() => onLike(item)} onComment={() => onComment(item)} />
    ),
    [activeIndex, onLike, onComment]
  );

  if (!loading && posts.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState
          variant="reels"
          title="Henüz reel yok"
          description="İlk videoyu sen paylaş!"
          actionLabel="Reel Paylaş"
          onAction={() => router.push("/create-post" as any)}
        />
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      initialNumToRender={2}
      maxToRenderPerBatch={2}
      windowSize={3}
      removeClippedSubviews={Platform.OS === "android"}
      pagingEnabled
      snapToInterval={SCREEN_HEIGHT}
      snapToAlignment="start"
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.semantic.onDarkBackground} />}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  cell: {
    width: SCREEN_WIDTH,
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 100,
    left: spacing.lg,
    right: 80,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  placeText: {
    fontSize: 14,
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsColumn: {
    position: "absolute",
    right: spacing.md,
    bottom: 120,
    alignItems: "center",
    gap: 20,
  },
  actionItem: {
    alignItems: "center",
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
  },
});
