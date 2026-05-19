/**
 * PostDetailScreen – Tek gönderi detay sayfası
 * Profil grid'den tıklandığında açılır.
 * Kendi gönderisi ise "Sil" seçeneği gösterir.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { FeedCard } from "./components/FeedCard";
import { CommentBottomSheet } from "./components/CommentBottomSheet";
import { PostOptionsSheet } from "./components/PostOptionsSheet";
import { getPost, deletePost, toggleLike, type Post } from "@/src/services/feedService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact, success } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";

export default function PostDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { t } = useTranslation();
  const authUser = useAuthStore((s) => s.user);

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentOpen, setCommentOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const isOwnPost = post?.user_id === authUser?.id;

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const data = await getPost(parseInt(postId, 10));
      setPost(data);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const handleLike = useCallback(async () => {
    if (!post) return;
    lightImpact();
    // Optimistic update
    setPost((prev) =>
      prev
        ? {
            ...prev,
            is_liked: !prev.is_liked,
            like_count: prev.like_count + (prev.is_liked ? -1 : 1),
          }
        : prev
    );
    try {
      await toggleLike(post.id);
    } catch {
      // Revert
      setPost((prev) =>
        prev
          ? {
              ...prev,
              is_liked: !prev.is_liked,
              like_count: prev.like_count + (prev.is_liked ? -1 : 1),
            }
          : prev
      );
    }
  }, [post]);

  const handleDelete = useCallback(() => {
    if (!post) return;
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
              await deletePost(post.id);
              useAppStore.getState().addDeletedPostId(post.id);
              success();
              router.back();
            } catch (e) {
              handleApiError(e);
            }
          },
        },
      ]
    );
  }, [post, t]);

  const handleOptionsSelect = useCallback(
    (key: string) => {
      if (key === "delete") {
        handleDelete();
      }
    },
    [handleDelete]
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

  if (!post) {
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
          {t("post_detail.title", "Gönderi")}
        </Text>
        {isOwnPost ? (
          <TouchableOpacity onPress={handleDelete} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="trash" size={20} color={colors.semantic.error} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setOptionsOpen(true)} hitSlop={12} style={styles.backBtn}>
            <IconSymbol name="ellipsis" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <FeedCard
          post={post}
          onLike={handleLike}
          onComment={() => setCommentOpen(true)}
          onOptionsPress={() => isOwnPost ? handleDelete() : setOptionsOpen(true)}
          onAuthorPress={() => {
            if (post.author) {
              router.push(`/user/${post.author.id}` as any);
            }
          }}
          onPlacePress={() => {
            if (post.place_id) {
              router.push(`/place/${post.place_id}` as any);
            }
          }}
        />
      </ScrollView>

      <CommentBottomSheet
        visible={commentOpen}
        onClose={() => setCommentOpen(false)}
        postId={post.id}
        onCommentAdded={() => {
          setPost((prev) => prev ? { ...prev, comment_count: prev.comment_count + 1 } : prev);
        }}
      />

      <PostOptionsSheet
        visible={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        onSelect={handleOptionsSelect as any}
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
  scrollContent: {
    paddingTop: 8,
  },
});
