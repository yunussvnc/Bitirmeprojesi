import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Animated, Easing } from "react-native";
import { FlashListRef } from "@shopify/flash-list";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { createTextStyle } from "@/src/constants/design";
import { getFeed, getPost, toggleLike, type Post, type FeedFilter } from "@/src/services/feedService";
import { getUnreadCount } from "@/src/services/notificationService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";
import { toggleFollow } from "@/src/services/userService";
import { useAppStore } from "@/src/store/useAppStore";
import { createReport } from "@/src/services/moderationService";
import { useTranslation } from "react-i18next";
import { useUploadPipelineStore } from "@/src/store/useUploadPipelineStore";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import type { CreateType } from "./components/CreateTypeSheet";

const PAGE_SIZE = 12;

export function useFeedScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
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
  const flatListRef = useRef<FlashListRef<Post>>(null);
  // Ref olarak nextCursor — loadFeed'in dependency loop'unu önler
  const nextCursorRef = useRef<string | null>(null);
  // Eş zamanlı birden fazla isteği engeller
  const isLoadingRef = useRef(false);
  const { hide: hideTabBar, show: showTabBar, fadeOut, fadeIn } = useTabBarVisibility();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const toggleSavePost = useAppStore((s) => s.toggleSavePost);
  const savedPostIds = useAppStore((s) => s.savedPostIds);
  const deletedPostIds = useAppStore((s) => s.deletedPostIds);
  const [viewableIds, setViewableIds] = useState<Set<number>>(new Set());

  const visiblePosts = React.useMemo(() => posts.filter((p) => !deletedPostIds.includes(p.id)), [posts, deletedPostIds]);

  /** FlashList viewability callback — sadece görünen kartlardaki videolar oynatılır */
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { item: Post }[] }) => {
    setViewableIds(new Set(viewableItems.map((v) => v.item.id)));
  }).current;
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 50 }), []);

  const handleCreateSelect = useCallback((type: CreateType) => {
    if (type === "post") {
      router.push("/create-post" as any);
    } else if (type === "story") {
      router.push("/create-story" as any);
    }
  }, []);

  /** Aynı id'ye sahip postları kaldırır — ilk görülen kazanır */
  const dedupeById = useCallback((items: Post[]): Post[] => {
    const seen = new Set<number>();
    return items.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, []);

  const loadFeed = useCallback(
    async (refresh = false) => {
      // Eş zamanlı çift istek engeli
      if (isLoadingRef.current) return;
      isLoadingRef.current = true;

      // refresh=true ise cursor'u sıfırla
      const activeCursor = refresh ? null : nextCursorRef.current;
      try {
        if (refresh) {
          setLoading(true);
          nextCursorRef.current = null;

          if (filter === "all") {
            try {
              const cachedStr = await AsyncStorage.getItem("feed_cache_all");
              if (cachedStr && posts.length === 0) {
                const cachedPosts = JSON.parse(cachedStr);
                if (Array.isArray(cachedPosts) && cachedPosts.length > 0) {
                  setPosts(cachedPosts);
                  setLoading(false); // Cache verisi varsa skeleton'ı kapat
                }
              }
            } catch (e) {
              console.log("Feed cache read error:", e);
            }
          }
        } else {
          setLoadingMore(true);
        }

        const res = await getFeed(activeCursor, PAGE_SIZE, filter);

        // Cursor ref üzerinden tutulur; böylece pagination callback'i yeniden oluşturulmaz.
        nextCursorRef.current = res.next_cursor;
        setHasMore(res.has_more);

        if (refresh) {
          const newPosts = dedupeById(res.items);
          setPosts(newPosts);

          if (filter === "all") {
            try {
              // Cache limit (max 15 posts)
              await AsyncStorage.setItem("feed_cache_all", JSON.stringify(newPosts.slice(0, 15)));
            } catch (e) {
              console.log("Feed cache write error:", e);
            }
          }
        } else {
          setPosts((prev) => {
            const next = dedupeById([...prev, ...res.items]);
            // Bellek şişmesini önle — max 60 post tut (kullanıcı çok aşağı inerse eski postları kaldır)
            return next.length > 60 ? next.slice(-60) : next;
          });
        }
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        isLoadingRef.current = false;
      }
    },
    // nextCursor'u ref'ten okuyoruz — artık dependency'e gerek yok
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, dedupeById]
  );

  useEffect(() => {
    // Filtre değişince baştan başla
    setHasMore(true);
    loadFeed(true);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    lastScrollY.current = 0;
    lastToggleY.current = 0;
    lastDirection.current = null;
    animateHeader(false);
    animateStory(false);
    animateMiniBar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filtre değişince sıfırla
  }, [filter]);

  // Upload tamamlandığında otomatik yenile
  const uploadJobs = useUploadPipelineStore((s) => s.jobs);
  const processedUploads = useRef(new Set<string>());

  useEffect(() => {
    const newlyCompleted = uploadJobs.filter((j) => j.stage === 'done' && !processedUploads.current.has(j.id));
    if (newlyCompleted.length > 0) {
      newlyCompleted.forEach((j) => processedUploads.current.add(j.id));
      loadFeed(true);
    }
  }, [uploadJobs, loadFeed]);

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

      const pendingSharedPostId = useAppStore.getState().pendingSharedPostId;
      if (pendingSharedPostId) {
        getPost(pendingSharedPostId).then(sharedPost => {
          useAppStore.getState().clearPendingSharedPostId();
          setPosts(prev => {
            const exists = prev.some(p => p.id === sharedPost.id);
            if (exists) return prev;
            return [sharedPost, ...prev];
          });
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }).catch(() => {
          useAppStore.getState().clearPendingSharedPostId();
        });
      }
    }, [refreshUnread])
  );

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    setHasMore(true);
    loadFeed(true);
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || isLoadingRef.current) return;
    loadFeed(false);
  }, [loadingMore, hasMore, loadFeed]);
  const pendingLikesRef = useRef<Set<number>>(new Set());

  const handleLike = useCallback(async (post: Post) => {
    if (pendingLikesRef.current.has(post.id)) return;
    pendingLikesRef.current.add(post.id);

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
    } finally {
      pendingLikesRef.current.delete(post.id);
    }
  }, []);

  const handleCommentAdded = useCallback((postId: number) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)));
  }, []);

  const handleHidePost = useCallback((postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    useAppStore.getState().addDeletedPostId(postId);
  }, []);

  const handleSharePost = useCallback((post: Post) => {
    setSharePost(post);
  }, []);

  const submitReport = useCallback(async (postId: number, reason: "spam" | "inappropriate" | "harassment" | "other") => {
    try {
      await createReport({ target_type: "post", target_id: postId, reason });
      Alert.alert(t("feed.reported"), t("feed.reported_desc"));
    } catch {
      Alert.alert(t("feed.report_title"), t("feed.reported_desc"));
    }
  }, [t]);

  const handleReportPost = useCallback(() => {
    if (!optionsPost) return;
    const postId = optionsPost.id;
    Alert.alert(t("feed.report_title"), t("feed.report_reason"), [
      { text: t("feed.cancel"), style: "cancel" },
      { text: t("feed.spam"), onPress: () => submitReport(postId, "spam") },
      { text: t("feed.inappropriate"), onPress: () => submitReport(postId, "inappropriate") },
      { text: t("feed.harassment"), onPress: () => submitReport(postId, "harassment") },
    ]);
  }, [optionsPost, submitReport, t]);

  const handleMuteAuthor = useCallback(() => {
    if (!optionsPost) return;
    const authorId = optionsPost.user_id;
    setPosts((prev) => {
      const toHide = prev.filter((p) => p.user_id === authorId);
      toHide.forEach((p) => useAppStore.getState().addDeletedPostId(p.id));
      return prev.filter((p) => p.user_id !== authorId);
    });
    Alert.alert(t("feed.muted_title"), t("feed.muted_desc"));
  }, [optionsPost, t]);

  const handleSavePost = useCallback(
    (post: Post) => {
      lightImpact();
      toggleSavePost(post);
    },
    [toggleSavePost]
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
        fadeOut();
        if (!chromeHiddenRef.current && y - lastToggleY.current >= headerThreshold && y > headerHeight * 0.6) {
          animateHeader(true);
          animateStory(true);
          animateMiniBar(false);
          lastToggleY.current = y;
        }
      } else {
        fadeIn();
        if (chromeHiddenRef.current && lastToggleY.current - y >= miniThreshold) {
          animateMiniBar(true);
          lastToggleY.current = y;
        }
      }
    },
    [animateHeader, animateMiniBar, animateStory, fadeIn, fadeOut, headerHeight, storyHeight]
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

  return {
    t, colors, insets,
    posts, loading, refreshing, hasMore, loadingMore,
    filter, setFilter,
    commentPostId, setCommentPostId,
    optionsPost, setOptionsPost,
    unreadCount,
    createSheetOpen, setCreateSheetOpen,
    filterDropdownOpen, setFilterDropdownOpen,
    isCardZooming, setIsCardZooming,
    sharePost, setSharePost,
    headerHeight, setHeaderHeight,
    storyHeight, setStoryHeight,
    chromeHidden, storyHidden, miniBarVisible,
    flatListRef,
    savedPostIds, viewableIds, visiblePosts,
    onViewableItemsChanged, viewabilityConfig,
    handleCreateSelect, handleRefresh, handleLoadMore,
    handleLike, handleCommentAdded, handleSavePost, handleSharePost,
    handleHidePost, handleReportPost, handleToggleFollow, handleMuteAuthor,
    handleOptionSelect, handleScroll, refreshUnread,
    fadeIn,
    headerAnim, storyAnim, miniBarAnim,
    headerOpacity, storyOpacity, miniBarOpacity, miniBarTranslateY,
    titleStyle,
  };
}
