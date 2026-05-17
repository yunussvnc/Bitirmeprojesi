/**
 * Akış (Feed) Screen
 *
 * Sosyal akış - mekan deneyimi paylaşımları.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
  Share,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Screen } from "@/src/components/layout";
import { FeedCard } from "./components/FeedCard";
import { CommentBottomSheet } from "./components/CommentBottomSheet";
import { SharePostSheet } from "./components/SharePostSheet";
import { EmptyState, LoadingState } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { CreateTypeSheet, type CreateType } from "./components/CreateTypeSheet";
import { FeedStoriesRow } from "./components/FeedStoriesRow";
import { PostOptionsSheet } from "./components/PostOptionsSheet";
import { FeedMiniBar } from "./components/FeedMiniBar";
import { createTextStyle, spacing } from "@/src/constants/design";
import { getFeed, getPost, toggleLike, type Post, type FeedFilter } from "@/src/services/feedService";
import { getUnreadCount } from "@/src/services/notificationService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";
import { toggleFollow } from "@/src/services/userService";
import { useAppStore } from "@/src/store/useAppStore";
import { createReport } from "@/src/services/moderationService";
import { useTranslation } from "react-i18next";

export default function FeedScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [optionsPost, setOptionsPost] = useState<Post | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [isCardZooming, setIsCardZooming] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [storyHeight, setStoryHeight] = useState(0);
  const [chromeHidden, setChromeHidden] = useState(false);
  const [storyHidden, setStoryHidden] = useState(false);
  const [miniBarVisible, setMiniBarVisible] = useState(false);
  const headerAnim = useRef(new Animated.Value(1)).current;
  const storyAnim = useRef(new Animated.Value(1)).current;
  const miniBarAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const lastToggleY = useRef(0);
  const lastDirection = useRef<"up" | "down" | null>(null);
  const chromeHiddenRef = useRef(false);
  const storyHiddenRef = useRef(false);
  const miniBarVisibleRef = useRef(false);
  const flatListRef = useRef<FlatList>(null);
  const { hide: hideTabBar, show: showTabBar } = useTabBarVisibility();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const pageSize = 15;
  const toggleSavePost = useAppStore((s) => s.toggleSavePost);
  const isPostSaved = useAppStore((s) => s.isPostSaved);

  const handleCreateSelect = useCallback((type: CreateType) => {
    if (type === "post") {
      router.push("/create-post" as any);
    } else if (type === "reels") {
      router.push({ pathname: "/create-post", params: { preSelect: "reels" } } as any);
    } else if (type === "story") {
      router.push("/create-story" as any);
    }
  }, []);

  const loadFeed = useCallback(
    async (refresh = false) => {
      const p = refresh ? 1 : page;
      try {
        if (p === 1) setLoading(true);
        else setLoadingMore(true);
        const res = await getFeed(p, pageSize, filter);
        const pendingSharedPostId = useAppStore.getState().pendingSharedPostId;

        if (refresh && pendingSharedPostId) {
          try {
            const sharedPost = await getPost(pendingSharedPostId);
            useAppStore.getState().clearPendingSharedPostId();
            res.items = [sharedPost, ...res.items.filter(post => post.id !== pendingSharedPostId)];
          } catch (e) {
            console.log("Paylaşılan gönderi bulunamadı veya hata:", e);
          }
        }

        if (refresh) {
          const MOCK_SUPER_POST: Post = {
            id: 999999,
            user_id: 1,
            place_id: 1,
            caption: "Bu inanılmaz bir deneyimdi! 🎉 Mekanın atmosferine bayıldım. Yorumlarda düşüncelerinizi bekliyorum! #MockPost #Deneyim #Harika",
            post_type: "review",
            comments_disabled: false,
            likes_hidden: false,
            like_count: 1542,
            comment_count: 89,
            created_at: new Date().toISOString(),
            is_liked: true,
            author: {
              id: 1,
              username: "ulascan_demo",
              first_name: "Ulaş Can",
              avatar_url: "https://ui-avatars.com/api/?name=Ulaş+Can",
              is_following: false,
            },
            place: {
              id: 1,
              name: "Fakülte Teras",
              category: "Cafe & Bar",
            },
            media: [
              {
                id: 1,
                post_id: 999999,
                media_type: "image",
                media_url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
                order_index: 0,
              },
              {
                id: 2,
                post_id: 999999,
                media_type: "image",
                media_url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
                order_index: 1,
              }
            ],
            tagged_users: [
              {
                id: 2,
                username: "beratsanli",
                first_name: "Berat",
              }
            ]
          };

          setPosts([MOCK_SUPER_POST, ...res.items.filter(p => p.id !== 999999)]);
          setPage(1);
        } else {
          setPosts((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
        }
        setTotal(res.total);
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [page, filter]
  );

  useEffect(() => {
    loadFeed(true);
    // Scroll'u başa döndür ve animasyonları sıfırla
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    lastScrollY.current = 0;
    lastToggleY.current = 0;
    lastDirection.current = null;
    animateHeader(false);
    animateStory(false);
    animateMiniBar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on filter change only
  }, [filter]);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.count);
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread])
  );

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    loadFeed(true);
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || posts.length >= total) return;
    setPage((p) => p + 1);
  }, [loadingMore, posts.length, total]);

  useEffect(() => {
    if (page > 1) loadFeed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load on page change only
  }, [page]);

  const handleLike = useCallback(async (post: Post) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
            ...p,
            is_liked: !p.is_liked,
            like_count: p.like_count + (p.is_liked ? -1 : 1),
          }
          : p
      )
    );
    try {
      const res = await toggleLike(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_liked: res.liked, like_count: res.like_count } : p))
      );
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_liked: post.is_liked, like_count: post.like_count } : p))
      );
    }
  }, []);

  const handleCommentAdded = useCallback((postId: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)));
  }, []);

  const handleHidePost = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const handleSharePost = useCallback(async (post: Post) => {
    try {
      const label = post.place?.name || post.author?.username || post.author?.first_name || "gönderi";
      await Share.share({ message: `${label} paylaşımına göz at!` });
    } catch {
      // ignore
    }
  }, []);

  const handleReportPost = useCallback(() => {
    if (!optionsPost) return;
    const postId = optionsPost.id;
    Alert.alert(t("feed.report_title"), t("feed.report_reason"), [
      { text: t("feed.cancel"), style: "cancel" },
      { text: t("feed.spam"), onPress: () => submitReport(postId, "spam") },
      { text: t("feed.inappropriate"), onPress: () => submitReport(postId, "inappropriate") },
      { text: t("feed.harassment"), onPress: () => submitReport(postId, "harassment") },
    ]);
  }, [optionsPost, t]);

  const submitReport = useCallback(async (postId: number, reason: "spam" | "inappropriate" | "harassment" | "other") => {
    try {
      await createReport({ target_type: "post", target_id: postId, reason });
      Alert.alert(t("feed.reported"), t("feed.reported_desc"));
    } catch {
      Alert.alert(t("feed.report_title"), t("feed.reported_desc"));
    }
  }, [t]);

  const handleMuteAuthor = useCallback(() => {
    Alert.alert(t("feed.muted_title"), t("feed.muted_desc"));
  }, [t]);

  const handleSavePost = useCallback(
    (post: Post) => {
      const wasSaved = isPostSaved(post.id);
      toggleSavePost(post);
      Alert.alert(
        wasSaved ? t("feed.saved_false") : t("feed.saved_true"),
        wasSaved ? t("feed.saved_false_desc") : t("feed.saved_true_desc")
      );
    },
    [isPostSaved, toggleSavePost, t]
  );

  const handleToggleFollow = useCallback(async (post: Post) => {
    if (!post.author?.id) return;
    try {
      const res = await toggleFollow(post.author.id);
      const newFollowing = res.status === "accepted";
      setPosts((prev) =>
        prev.map((p) =>
          p.user_id === post.user_id ? (p.author ? { ...p, author: { ...p.author, is_following: newFollowing } } : p) : p
        )
      );
    } catch {
      // ignore
    }
  }, []);

  const handleOptionSelect = useCallback(
    (key: "save" | "share" | "hide" | "report" | "unfollow" | "mute") => {
      if (!optionsPost) return;
      if (key === "save") handleSavePost(optionsPost);
      if (key === "share") handleSharePost(optionsPost);
      if (key === "hide") handleHidePost(optionsPost.id);
      if (key === "report") handleReportPost();
      if (key === "unfollow") handleToggleFollow(optionsPost);
      if (key === "mute") handleMuteAuthor();
    },
    [optionsPost, handleSavePost, handleSharePost, handleHidePost, handleReportPost, handleToggleFollow, handleMuteAuthor]
  );

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <FeedCard
        post={item}
        onPress={() => item.place_id && router.push(`/place/${item.place_id}` as any)}
        onAuthorPress={() => router.push(`/user/${item.user_id}` as any)}
        onPlacePress={() => item.place_id && router.push(`/place/${item.place_id}` as any)}
        onLike={() => handleLike(item)}
        onComment={() => setCommentPostId(item.id)}
        onShare={() => setSharePost(item)}
        onOptionsPress={() => setOptionsPost(item)}
        onZoomChange={setIsCardZooming}
      />
    ),
    [handleLike]
  );

  const listEmpty = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <LoadingState message={t("feed.loading")} />
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <EmptyState
          variant="feed"
          title={t("feed.empty_title")}
          description={t("feed.empty_desc")}
          actionLabel={t("feed.empty_action")}
          onAction={() => setCreateSheetOpen(true)}
        />
      </View>
    );
  };

  const animateHeader = useCallback(
    (hidden: boolean) => {
      if (chromeHiddenRef.current === hidden) return;
      chromeHiddenRef.current = hidden;
      setChromeHidden(hidden);
      Animated.timing(headerAnim, {
        toValue: hidden ? 0 : 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      if (hidden) hideTabBar();
      else showTabBar();
    },
    [headerAnim, hideTabBar, showTabBar]
  );

  const animateStory = useCallback(
    (hidden: boolean) => {
      if (storyHiddenRef.current === hidden) return;
      storyHiddenRef.current = hidden;
      setStoryHidden(hidden);
      Animated.timing(storyAnim, {
        toValue: hidden ? 0 : 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [storyAnim]
  );

  const animateMiniBar = useCallback(
    (visible: boolean) => {
      if (miniBarVisibleRef.current === visible) return;
      miniBarVisibleRef.current = visible;
      setMiniBarVisible(visible);
      Animated.timing(miniBarAnim, {
        toValue: visible ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [miniBarAnim]
  );

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("tabPress", () => {
      if (navigation.isFocused()) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        lastScrollY.current = 0;
        lastToggleY.current = 0;
        lastDirection.current = null;
        animateHeader(false);
        animateStory(false);
        animateMiniBar(false);
      }
    });
    return unsubscribe;
  }, [navigation, animateHeader, animateStory, animateMiniBar]);

  const handleScroll = useCallback(
    (rawY: number) => {
      const y = Math.max(rawY, 0);
      const dy = y - lastScrollY.current;
      lastScrollY.current = y;

      if (y <= 0) {
        animateHeader(false);
        animateStory(false);
        animateMiniBar(false);
        lastToggleY.current = 0;
        lastDirection.current = null;
        return;
      }

      if (dy === 0) {
        return;
      }

      const direction: "up" | "down" = dy > 0 ? "down" : "up";
      if (direction !== lastDirection.current) {
        lastDirection.current = direction;
        lastToggleY.current = y;
      }

      const headerThreshold = Math.max(12, headerHeight * 0.3);
      const miniThreshold = Math.max(8, headerHeight * 0.2);
      const storyRevealY = Math.max(1, headerHeight + storyHeight);

      if (y <= storyRevealY) {
        animateMiniBar(false);
        animateHeader(false);
        animateStory(false);
        return;
      }

      if (direction === "down") {
        if (miniBarVisibleRef.current) {
          animateMiniBar(false);
        }
        if (!chromeHiddenRef.current && y - lastToggleY.current >= headerThreshold && y > headerHeight * 0.6) {
          animateHeader(true);
          animateStory(true);
          animateMiniBar(false);
          lastToggleY.current = y;
        }
      } else {
        if (chromeHiddenRef.current && lastToggleY.current - y >= miniThreshold) {
          animateMiniBar(true);
          lastToggleY.current = y;
        }
      }
    },
    [animateHeader, animateMiniBar, animateStory, headerHeight, storyHeight]
  );

  const titleStyle = createTextStyle("title", colors.text.primary);
  const headerOpacity = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const storyOpacity = storyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const miniBarOpacity = miniBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const miniBarTranslateY = miniBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-48, 0],
  });

  const listHeader = (
    <View style={{ zIndex: 20 }}>
      <Animated.View
        style={[
          styles.headerWrap,
          {
            opacity: headerOpacity,
          },
        ]}
        pointerEvents={chromeHidden ? "none" : "auto"}
      >
        <View
          style={styles.header}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h !== headerHeight) setHeaderHeight(h);
          }}
        >
          <Text style={[titleStyle, styles.title]}>{t("feed.title")}</Text>

          {/* Dropdown filter — header ortası */}
          <View style={styles.dropdownWrap}>
            <TouchableOpacity
              style={[styles.dropdownTrigger]}
              onPress={() => {
                lightImpact();
                setFilterDropdownOpen((o) => !o);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownLabel, { color: colors.text.primary }]}>
                {filter === "all" ? t("feed.filter_all") : t("feed.filter_following")}
              </Text>
              <IconSymbol name={filterDropdownOpen ? "chevron.up" : "chevron.down"} size={12} color={colors.text.secondary} />
            </TouchableOpacity>
            {filterDropdownOpen && (
              <View style={[styles.dropdownMenu, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
                {(["all", "following"] as const).map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.dropdownItem, filter === opt && { backgroundColor: colors.accent.primary + "18" }]}
                    onPress={() => {
                      lightImpact();
                      setFilter(opt);
                      setFilterDropdownOpen(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {filter === opt && <IconSymbol name="checkmark" size={13} color={colors.accent.primary} />}
                    <Text style={[styles.dropdownItemText, { color: filter === opt ? colors.accent.primary : colors.text.primary }]}>
                      {opt === "all" ? t("feed.filter_all") : t("feed.filter_following")}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface.elevated }]}
              onPress={() => {
                lightImpact();
                router.push("/notifications" as any);
                refreshUnread();
              }}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.text.primary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.semantic.error }]}>
                  <Text style={[styles.badgeText, { color: colors.accent.onPrimary }]}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.accent.primary }]}
              onPress={() => {
                lightImpact();
                setCreateSheetOpen(true);
              }}
            >
              <IconSymbol name="plus" size={20} color={colors.accent.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {filter === "all" && (
        <Animated.View
          style={[
            styles.topWrap,
            {
              opacity: storyOpacity,
            },
          ]}
          pointerEvents={storyHidden ? "none" : "auto"}
        >
          <View
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h !== storyHeight) setStoryHeight(h);
            }}
          >
            <FeedStoriesRow filter={filter} />
          </View>
        </Animated.View>
      )}
    </View>
  );

  return (
    <Screen scrollable={false} withTabBar contentContainerStyle={{ paddingHorizontal: 0 }}>
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          style={styles.list}
          data={posts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ListEmptyComponent={listEmpty}
          ListHeaderComponent={listHeader}
          contentContainerStyle={posts.length === 0 ? styles.listEmpty : styles.listContent}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true}
          scrollEnabled={!isCardZooming}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
          }
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
        />
        <FeedMiniBar
          visible={miniBarVisible}
          opacity={miniBarOpacity}
          translateY={miniBarTranslateY}
          unreadCount={unreadCount}
          onCreatePress={() => setCreateSheetOpen(true)}
          onNotificationsPress={() => {
            router.push("/notifications" as any);
            refreshUnread();
          }}
        />

        <CommentBottomSheet
          visible={!!commentPostId}
          onClose={() => setCommentPostId(null)}
          postId={commentPostId ?? 0}
          onCommentAdded={() => commentPostId && handleCommentAdded(commentPostId)}
        />

        <PostOptionsSheet
          visible={!!optionsPost}
          onClose={() => setOptionsPost(null)}
          showFollowActions={!!optionsPost?.author?.is_following}
          onSelect={handleOptionSelect}
        />

        <CreateTypeSheet
          visible={createSheetOpen}
          onClose={() => setCreateSheetOpen(false)}
          onSelect={handleCreateSelect}
        />

        <SharePostSheet
          visible={!!sharePost}
          onClose={() => setSharePost(null)}
          post={sharePost}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
  },
  list: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
    overflow: "visible",
    position: "relative",
    paddingHorizontal: spacing.md,
  },
  title: { fontSize: 26, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerWrap: {
    overflow: "visible",
    zIndex: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  dropdownWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
    pointerEvents: "box-none",
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 140,
  },
  dropdownLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  dropdownMenu: {
    position: "absolute",
    top: 44,
    left: "50%",
    transform: [{ translateX: -90 }],
    width: 180,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
  },
  topWrap: {
    overflow: "hidden",
  },
  createBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  listContent: {
    gap: spacing.xl,
  },
  listEmpty: { flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", minHeight: 300 },

});
