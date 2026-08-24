/**
 * PostDetailScreen – Tek gönderi detay sayfası / Kullanıcı akışı
 * Profil grid'den tıklandığında açılır.
 * Tıklanan gönderiyi odaklayarak kullanıcının o ana kadarki gönderilerini kaydırılabilir bir akış olarak sunar.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from "react-native";
import { FlatList } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { FeedCard } from "./components/FeedCard";
import { CommentBottomSheet } from "./components/CommentBottomSheet";
import { PostOptionsSheet } from "./components/PostOptionsSheet";
import { SharePostSheet } from "./components/SharePostSheet";
import { getPost, deletePost, toggleLike, type Post } from "@/src/services/feedService";
import { getUserPosts } from "@/src/services/userService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact, success } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

export default function PostDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { postId, source } = useLocalSearchParams<{ postId: string; source?: string }>();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentOpen, setCommentOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [optionsPost, setOptionsPost] = useState<Post | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [listReady, setListReady] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const deletedPostIds = useAppStore((s) => s.deletedPostIds);
  const toggleSavePost = useAppStore((s) => s.toggleSavePost);
  const savedPostIds = useAppStore((s) => s.savedPostIds);
  const visiblePosts = React.useMemo(() => posts.filter((p) => !deletedPostIds.includes(p.id)), [posts, deletedPostIds]);

  const initialIndex = React.useMemo(() => {
    if (!postId) return 0;
    const idx = visiblePosts.findIndex((p) => p.id.toString() === postId);
    return idx >= 0 ? idx : 0;
  }, [visiblePosts, postId]);

  const loadPosts = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      if (source === "saved") {
        const savedPostsObj = useAppStore.getState().savedPostsById;
        const savedArray = Object.values(savedPostsObj) as Post[];
        // Kaydedilenleri ters çeviriyoruz ki en son kaydedilen en üstte görünsün
        setPosts(savedArray.reverse());
        return;
      }

      const currentPost = await getPost(parseInt(postId, 10));
      // Tıklanan postun sahibinin son 50 gönderisini getir (akış şeklinde görebilmesi için)
      const userPostsData = await getUserPosts(currentPost.user_id, 1, 50);
      setPosts(userPostsData.items);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  }, [postId, source]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);
  const pendingLikesRef = useRef<Set<number>>(new Set());

  const handleLike = useCallback(async (likedPost: Post) => {
    if (pendingLikesRef.current.has(likedPost.id)) return;
    pendingLikesRef.current.add(likedPost.id);
    
    lightImpact();
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === likedPost.id
          ? { ...p, is_liked: !p.is_liked, like_count: p.like_count + (p.is_liked ? -1 : 1) }
          : p
      )
    );
    try {
      const res = await toggleLike(likedPost.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === likedPost.id
            ? { ...p, is_liked: res.liked, like_count: res.like_count }
            : p
        )
      );
    } catch {
      // Revert
      setPosts((prev) =>
        prev.map((p) =>
          p.id === likedPost.id
            ? { ...p, is_liked: likedPost.is_liked, like_count: likedPost.like_count }
            : p
        )
      );
    } finally {
      pendingLikesRef.current.delete(likedPost.id);
    }
  }, []);

  const handleDelete = useCallback((deletedPost: Post) => {
    Alert.alert(
      t("post_detail.delete_title", "Gönderiyi Sil"),
      t("post_detail.delete_confirm", "Bu gönderi kalıcı olarak silinecek. Emin misiniz?"),
      [
        { text: t("post_detail.cancel", "İptal"), style: "cancel" },
        {
          text: t("post_detail.delete", "Sil"),
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost(deletedPost.id);
              useAppStore.getState().addDeletedPostId(deletedPost.id);
              success();
              setPosts((prev) => prev.filter((p) => p.id !== deletedPost.id));
              if (visiblePosts.length <= 1) router.back();
            } catch (e) {
              handleApiError(e);
            }
          },
        },
      ]
    );
  }, [t, visiblePosts.length]);

  const handleOptionsSelect = useCallback(
    (key: string) => {
      if (key === "delete" && optionsPost) {
        handleDelete(optionsPost);
      }
    },
    [handleDelete, optionsPost]
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t("post_detail.title", "Gönderi")}
          </Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      </View>
    );
  }

  if (visiblePosts.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            {t("post_detail.title", "Gönderi")}
          </Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={{ color: colors.text.tertiary }}>{t("post_detail.not_found", "Gönderi bulunamadı")}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.surface.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {t("post_detail.title", "Gönderiler")}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        ref={flatListRef}
        data={visiblePosts}
        extraData={[savedPostIds]}
        keyExtractor={(item) => item.id.toString()}
        // initialScrollIndex kaldırıldı, çünkü dinamik yüksekliklerde hatalı scroll'a neden oluyor.
        // Bunun yerine manuel scroll yapıyoruz (viewPosition: 0 = en tepeye hizala)
        style={{ opacity: listReady ? 1 : 0 }}
        onLayout={() => {
          if (!listReady) {
            if (initialIndex > 0 && visiblePosts.length > 0) {
              setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                  index: initialIndex,
                  animated: false,
                  viewPosition: 0,
                });
                setListReady(true);
              }, 150); // Liste çizildikten hemen sonra hizala ve görünür yap
            } else {
              setListReady(true);
            }
          }
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20, paddingTop: 8 }}
        renderItem={({ item }) => {
          const isOwnPost = item.user_id === authUser?.id;
          return (
            <View style={{ marginBottom: 48 }}>
              <FeedCard
                post={item}
                isSaved={savedPostIds.includes(String(item.id))}
                onSave={() => {
                  toggleSavePost(item);
                  lightImpact();
                }}
                onLike={() => handleLike(item)}
                onComment={() => {
                  setCommentPostId(item.id);
                  setCommentOpen(true);
                }}
                onShare={() => setSharePost(item)}
                onOptionsPress={() => {
                  if (isOwnPost) {
                    handleDelete(item);
                  } else {
                    setOptionsPost(item);
                    setOptionsOpen(true);
                  }
                }}
                onAuthorPress={() => {
                  if (item.author) {
                    router.push(`/user/${item.author.id}` as any);
                  }
                }}
                onPlacePress={() => {
                  if (item.place_id) {
                    router.push(`/place/${item.place_id}` as any);
                  }
                }}
              />
            </View>
          );
        }}
      />

      <CommentBottomSheet
        visible={commentOpen}
        onClose={() => setCommentOpen(false)}
        postId={commentPostId || 0}
        onCommentAdded={() => {
          if (commentPostId) {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === commentPostId ? { ...p, comment_count: p.comment_count + 1 } : p
              )
            );
          }
        }}
      />

      <PostOptionsSheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onSelect={handleOptionsSelect as any}
      />

      <SharePostSheet
        visible={!!sharePost}
        onClose={() => setSharePost(null)}
        post={sharePost}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  backBtn: {
    width: 40,
    alignItems: "center",
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
