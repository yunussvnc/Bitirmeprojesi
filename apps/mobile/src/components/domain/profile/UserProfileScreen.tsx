/**
 * Kullanıcı profil ekranı (başka kullanıcı)
 * Instagram tarzı profil sayfası tasarımı.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  useWindowDimensions,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/src/components/layout";
import { Avatar, LoadingState, ErrorState } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import { spacing } from "@/src/constants/design";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { FeedCard, CommentBottomSheet } from "@/src/components/domain/feed";
import { getPost, toggleLike, type Post } from "@/src/services/feedService";
import {
  getUserProfile,
  getUserPosts,
  getUserStats,
  toggleFollow,
  type UserProfile,
  type UserStats,
} from "@/src/services/userService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";

const GRID_GAP = 2;
const GRID_COLS = 3;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const currentUser = useAuthStore((s) => s.user);
  const { width: screenWidth } = useWindowDimensions();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<
    { id: number; place_id?: number; thumbnail?: string; media_type?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [postLoading, setPostLoading] = useState(false);

  const userId = id ? parseInt(id, 10) : NaN;
  const isOwnProfile = currentUser && currentUser.id === userId;

  const cellSize = (screenWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

  const load = useCallback(
    async (refresh = false) => {
      if (isNaN(userId)) return;
      try {
        if (!refresh) setLoading(true);
        const [p, statsRes, postsRes] = await Promise.all([
          getUserProfile(userId),
          getUserStats(userId),
          getUserPosts(userId, 1, 30),
        ]);
        setProfile(p);
        setStats(statsRes);
        setPosts(
          postsRes.items.map((post) => ({
            id: post.id,
            place_id: post.place_id,
            thumbnail:
              post.media?.[0]?.thumbnail_url || post.media?.[0]?.media_url,
            media_type: post.media?.[0]?.media_type,
          }))
        );
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    load(true);
  }, [load]);

  const handleFollow = useCallback(async () => {
    if (!profile || followLoading || !currentUser) return;
    lightImpact();
    setFollowLoading(true);
    const prev = profile.is_following;
    setProfile((p) =>
      p
        ? {
          ...p,
          is_following: !p.is_following,
          followers_count: p.followers_count + (prev ? -1 : 1),
        }
        : p
    );
    try {
      const res = await toggleFollow(profile.id);
      setProfile((p) => (p ? { ...p, is_following: res.following } : p));
    } catch (e) {
      setProfile((p) => (p ? { ...p, is_following: prev } : p));
      handleApiError(e);
    } finally {
      setFollowLoading(false);
    }
  }, [profile, followLoading, currentUser]);

  const handlePostTap = useCallback(async (postId: number) => {
    lightImpact();
    setPostLoading(true);
    try {
      const fullPost = await getPost(postId);
      setSelectedPost(fullPost);
    } catch (e) {
      handleApiError(e);
    } finally {
      setPostLoading(false);
    }
  }, []);

  const handleLike = useCallback(async () => {
    if (!selectedPost) return;
    const prev = selectedPost;
    setSelectedPost(p =>
      p ? { ...p, is_liked: !p.is_liked, like_count: p.like_count + (p.is_liked ? -1 : 1) } : p
    );
    try {
      const res = await toggleLike(selectedPost.id);
      setSelectedPost(p =>
        p ? { ...p, is_liked: res.liked, like_count: res.like_count } : p
      );
    } catch (e) {
      setSelectedPost(prev);
      handleApiError(e);
    }
  }, [selectedPost]);

  const handleCommentAdded = useCallback(() => {
    setSelectedPost(p =>
      p ? { ...p, comment_count: p.comment_count + 1 } : p
    );
  }, []);

  const closePostModal = useCallback(() => {
    setSelectedPost(null);
    setCommentPostId(null);
  }, []);

  const displayName =
    profile?.first_name || profile?.username || profile?.email || "Kullanıcı";
  const username = profile?.username || profile?.email || "";
  const postCount = stats?.post_count ?? 0;

  if (loading && !profile) {
    return (
      <Screen withTabBar>
        <LoadingState message="Profil yükleniyor..." />
      </Screen>
    );
  }

  if (!profile || isNaN(userId)) {
    return (
      <Screen withTabBar>
        <ErrorState title="Profil bulunamadı" onRetry={() => router.back()} />
      </Screen>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.surface.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          style={styles.headerBtn}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <Text
          style={[styles.headerUsername, { color: colors.text.primary }]}
          numberOfLines={1}
        >
          {username}
        </Text>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} hitSlop={8} activeOpacity={0.7}>
            <IconSymbol
              name="bell"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} hitSlop={8} activeOpacity={0.7}>
            <IconSymbol
              name="ellipsis"
              size={22}
              color={colors.text.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* ── Profile Info Row (Avatar + Stats) ── */}
        <View style={styles.profileRow}>
          <Avatar
            source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
            name={displayName}
            size={86}
          />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {postCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.primary }]}>
                gönderi
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {profile.followers_count}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.primary }]}>
                takipçi
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {profile.following_count}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.primary }]}>
                arkadaş
              </Text>
            </View>
          </View>
        </View>

        {/* ── Name & Bio ── */}
        <View style={styles.bioSection}>
          <Text style={[styles.displayName, { color: colors.text.primary }]}>
            {displayName}
          </Text>
          {profile.bio ? (
            <Text style={[styles.bioText, { color: colors.text.primary }]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* ── Action Buttons ── */}
        {!isOwnProfile && currentUser && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                profile.is_following
                  ? {
                    borderColor: colors.accent.primary,
                    borderWidth: 1.5,
                    backgroundColor: "transparent",
                  }
                  : { backgroundColor: colors.accent.primary },
              ]}
              onPress={handleFollow}
              activeOpacity={0.8}
              disabled={followLoading}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: profile.is_following
                      ? colors.accent.primary
                      : "#fff",
                  },
                ]}
              >
                {profile.is_following ? "Takip" : "Takip Et"}
              </Text>
              {profile.is_following && (
                <IconSymbol
                  name="chevron.down"
                  size={12}
                  color={colors.accent.primary}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: colors.surface.elevated,
                  borderColor: colors.surface.border,
                  borderWidth: 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.actionBtnText, { color: colors.text.primary }]}
              >
                Mesaj
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionIconBtn,
                {
                  backgroundColor: colors.surface.elevated,
                  borderColor: colors.surface.border,
                  borderWidth: 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <IconSymbol
                name="person.badge.plus"
                size={18}
                color={colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* ── Grid Tab Bar ── */}
        <View
          style={[
            styles.gridTabBar,
            { borderBottomColor: colors.surface.border },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.gridTab,
              styles.gridTabActive,
              { borderBottomColor: colors.text.primary },
            ]}
            activeOpacity={0.7}
          >
            <IconSymbol name="square.grid.3x3" size={22} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.gridTab} activeOpacity={0.7}>
            <IconSymbol
              name="person.crop.rectangle"
              size={22}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>

        {/* ── Post Grid ── */}
        {posts.length > 0 ? (
          <View style={styles.grid}>
            {posts.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.gridCell,
                  {
                    width: cellSize,
                    height: cellSize,
                    marginRight: (idx + 1) % GRID_COLS !== 0 ? GRID_GAP : 0,
                    marginBottom: GRID_GAP,
                  },
                ]}
                onPress={() => handlePostTap(item.id)}
                activeOpacity={0.9}
              >
                {item.thumbnail ? (
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View
                    style={[
                      styles.gridPlaceholder,
                      { backgroundColor: colors.surface.elevated },
                    ]}
                  >
                    <IconSymbol
                      name={
                        item.media_type === "video" ? "play.fill" : "photo"
                      }
                      size={24}
                      color={colors.text.tertiary}
                    />
                  </View>
                )}
                {item.media_type === "video" && item.thumbnail && (
                  <View style={styles.videoBadge}>
                    <IconSymbol name="play.fill" size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : !loading ? (
          <View style={styles.emptyGrid}>
            <IconSymbol
              name="camera"
              size={44}
              color={colors.text.tertiary}
            />
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
              Henüz gönderi yok
            </Text>
          </View>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Post Loading Overlay ── */}
      {postLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      )}

      {/* ── Post Detail Modal ── */}
      {selectedPost && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={closePostModal}
          statusBarTranslucent
        >
          <Pressable
            style={[styles.postModalOverlay, { backgroundColor: colors.overlay?.dark || 'rgba(0,0,0,0.6)' }]}
            onPress={closePostModal}
          >
            <Pressable
              style={[styles.postModalContent, { backgroundColor: colors.background.primary }]}
              onPress={(e) => e.stopPropagation()}
            >
              <TouchableOpacity
                style={styles.postModalClose}
                onPress={() => {
                  lightImpact();
                  closePostModal();
                }}
                activeOpacity={0.8}
                hitSlop={8}
              >
                <View style={[styles.postModalCloseBg, { backgroundColor: colors.surface.elevated }]}>
                  <IconSymbol name="xmark" size={16} color={colors.text.primary} />
                </View>
              </TouchableOpacity>
              <FeedCard
                post={selectedPost}
                onAuthorPress={() => { }}
                onPlacePress={() => {
                  closePostModal();
                  if (selectedPost.place_id)
                    router.push(`/place/${selectedPost.place_id}` as any);
                }}
                onLike={handleLike}
                onComment={() => setCommentPostId(selectedPost.id)}
              />
            </Pressable>
            <CommentBottomSheet
              visible={commentPostId != null}
              postId={commentPostId ?? 0}
              onClose={() => setCommentPostId(null)}
              onCommentAdded={() => handleCommentAdded()}
            />
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerUsername: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  /* Profile Info Row */
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },

  /* Bio */
  bioSection: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  displayName: {
    fontSize: 14,
    fontWeight: "600",
  },
  bioText: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 19,
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Grid Tab Bar */
  gridTabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  gridTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  gridTabActive: {
    borderBottomWidth: 1.5,
  },

  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    overflow: "hidden",
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Empty Grid */
  emptyGrid: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },

  /* Post Modal */
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  postModalOverlay: {
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  postModalContent: {
    borderRadius: 18,
    overflow: "hidden",
  },
  postModalClose: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 20,
  },
  postModalCloseBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
