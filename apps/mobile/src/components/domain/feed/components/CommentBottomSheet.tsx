/**
 * CommentBottomSheet – Gönderi yorumları bottom sheet
 * Yükseklik animasyonu: kısmi (2 yorum) ↔ tam açık
 * Input her zaman altta görünür.
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  PanResponder,
  Dimensions,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { getComments, addComment, toggleCommentLike, type PostComment } from "@/src/services/feedService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact, success } from "@/src/utils/haptics";
import { timeAgo } from "@/src/utils/timeAgo";
import { deleteComment } from "@/src/services/moderationService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useTranslation } from "react-i18next";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

const SCREEN_HEIGHT = Dimensions.get("window").height;
// Kısmi açık yükseklik: handle + başlık + input + ~2 yorum satırı
const COLLAPSED_HEIGHT = 320;
// Tam açık yükseklik
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.75);

export interface CommentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: number;
  postCaption?: string;
  onCommentAdded?: () => void;
  embedded?: boolean;
}

export function CommentBottomSheet({ visible, onClose, postId, onCommentAdded }: CommentBottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [text, setText] = useState("");
  const { t } = useTranslation();

  // Height animasyonu (native driver kapalı — height animate edilemez native'de)
  const animHeight = useRef(new Animated.Value(0)).current;
  const animKeyboard = useRef(new Animated.Value(0)).current;
  const snapRef = useRef<"collapsed" | "expanded">("collapsed");
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(animKeyboard, { toValue: e.endCoordinates.height, duration: 250, useNativeDriver: false }).start();
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardHeight(0);
      Animated.timing(animKeyboard, { toValue: 0, duration: 250, useNativeDriver: false }).start();
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, [animKeyboard]);

  const snapTo = useCallback(
    (target: "collapsed" | "expanded" | "closed") => {
      const toValue = target === "closed" ? 0 : target === "collapsed" ? COLLAPSED_HEIGHT : EXPANDED_HEIGHT;

      if (target === "closed") {
        closingRef.current = true;
      } else {
        snapRef.current = target;
      }

      Animated.spring(animHeight, {
        toValue,
        useNativeDriver: false,
        damping: 24,
        stiffness: 220,
        mass: 0.8,
        overshootClamping: true, // Animasyonun 0'ın altına inip zıplamasını (flash) engeller
      }).start(({ finished }) => {
        if (finished && target === "closed") {
          // Modal'ı gizle ve parent'a bildir
          // closingRef.current burada SIFIRLANMAZ — visible false olana kadar true kalır
          setModalVisible(false);
          onCloseRef.current();
        }
      });
    },
    [animHeight]
  );

  const snapToRef = useRef(snapTo);
  snapToRef.current = snapTo;

  // visible false olunca closingRef'i sıfırla
  useEffect(() => {
    if (!visible) {
      closingRef.current = false;
    }
  }, [visible]);

  // Açılış: visible true olunca Modal'ı göster ve animasyonu başlat
  // snapTo bağımlılığı kasıtlı olarak kaldırıldı — sadece visible değiştiğinde çalışmalı
  useEffect(() => {
    if (visible && !closingRef.current) {
      setModalVisible(true);
      animHeight.setValue(0);
      snapRef.current = "collapsed";
      snapToRef.current("collapsed");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // PanResponder: handle çubuğuna bağlı, liste scroll'una dokunmaz
  const startHeightRef = useRef(COLLAPSED_HEIGHT);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startHeightRef.current = snapRef.current === "expanded" ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT;
      },
      onPanResponderMove: (_, g) => {
        // yukarı çekme: dy negatif → yükseklik artar
        const next = startHeightRef.current - g.dy;
        const clamped = Math.max(COLLAPSED_HEIGHT * 0.5, Math.min(EXPANDED_HEIGHT + 30, next));
        animHeight.setValue(clamped);
      },
      onPanResponderRelease: (_, g) => {
        const isExpanded = snapRef.current === "expanded";

        if (isExpanded) {
          if (g.dy > 80 || g.vy > 0.5) {
            if (g.dy > 220 || g.vy > 1.2) {
              snapToRef.current("closed");
            } else {
              snapToRef.current("collapsed");
            }
          } else {
            snapToRef.current("expanded");
          }
        } else {
          if (g.dy < -60 || g.vy < -0.4) {
            snapToRef.current("expanded");
          } else if (g.dy > 60 || g.vy > 0.4) {
            snapToRef.current("closed");
          } else {
            snapToRef.current("collapsed");
          }
        }
      },
    })
  ).current;


  const loadComments = useCallback(async () => {
    if (!visible || !postId) return;
    setLoading(true);
    try {
      const res = await getComments(postId, 1, 50);
      
      // Handle different API paginated response structures securely.
      const itemsList = Array.isArray(res) ? res : (Array.isArray(res?.items) ? res.items : []);
      
      const hideOffensiveWords = useSettingsStore.getState().hideOffensiveWords;
      const filtered = hideOffensiveWords 
        ? itemsList.filter((c: PostComment) => !c.is_flagged)
        : itemsList;
      setComments(filtered);
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  }, [visible, postId]);

  useEffect(() => {
    if (visible) {
      loadComments();
      setText("");
    }
  }, [visible, loadComments]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    lightImpact();
    setSending(true);
    try {
      const newComment = await addComment(postId, trimmed);
      setComments((prev) => [newComment, ...prev]);
      setText("");
      onCommentAdded?.();
    } catch (e) {
      handleApiError(e);
    } finally {
      setSending(false);
    }
  };

  const titleStyle = createTextStyle("heading", colors.text.primary);

  const currentUser = useAuthStore((s) => s.user);

  const handleDeleteComment = useCallback(async (comment: PostComment) => {
    lightImpact();
    Alert.alert(t("feed_comments.delete_comment"), t("feed_comments.delete_comment_confirm"), [
      { text: t("feed_comments.cancel"), style: "cancel" },
      {
        text: t("feed_comments.delete"), style: "destructive", onPress: async () => {
          try {
            await deleteComment(postId, comment.id);
            success();
            setComments((prev) => prev.filter((c) => c.id !== comment.id));
          } catch {
            Alert.alert(t("feed_comments.error"), t("feed_comments.delete_failed"));
          }
        },
      },
    ]);
  }, [postId, t]);

  const handleLikeComment = useCallback(async (comment: PostComment) => {
    lightImpact();
    // Optimistic update
    setComments((prev) => prev.map((c) =>
      c.id === comment.id
        ? { ...c, is_liked: !c.is_liked, like_count: (c.like_count || 0) + (c.is_liked ? -1 : 1) }
        : c
    ));
    try {
      await toggleCommentLike(postId, comment.id);
    } catch {
      // Revert on error
      setComments((prev) => prev.map((c) =>
        c.id === comment.id
          ? { ...c, is_liked: comment.is_liked, like_count: comment.like_count }
          : c
      ));
    }
  }, [postId]);

  const renderItem = ({ item }: { item: PostComment }) => {
    const isOwn = currentUser?.id === item.user_id;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onLongPress={isOwn ? () => handleDeleteComment(item) : undefined}
        delayLongPress={400}
      >
        <View style={[styles.commentRow, { borderBottomColor: colors.surface.border }]}>
          <TouchableOpacity
            style={styles.commentContent}
            activeOpacity={0.7}
            onPress={() => {
              Keyboard.dismiss();
              onClose();
              router.push(`/user/${item.user_id}` as any);
            }}
          >
            <Text style={[styles.commentAuthor, { color: colors.text.primary }]}>@{item.author_username || `user_${item.user_id}`}</Text>
            <Text style={[styles.commentText, { color: colors.text.secondary }]}>{item.text}</Text>
            <Text style={[styles.commentTime, { color: colors.text.tertiary }]}>{timeAgo(item.created_at)}</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            {isOwn && (
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteComment(item)}>
                <IconSymbol name="ellipsis" size={20} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
            
            {/* Beğeni Butonu */}
            <TouchableOpacity 
              style={{ alignItems: "center", justifyContent: "center", minWidth: 40, height: 40 }} 
              onPress={() => handleLikeComment(item)}
            >
              <IconSymbol 
                name={item.is_liked ? "heart.fill" : "heart"} 
                size={18} 
                color={item.is_liked ? colors.semantic.error : colors.text.tertiary} 
              />
              {!!item.like_count && item.like_count > 0 && (
                <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>{item.like_count}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={() => snapTo("closed")} statusBarTranslucent>
      {/* Backdrop */}
      <Pressable style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.45)" }]} onPress={() => { Keyboard.dismiss(); snapTo("closed"); }} />

      {/* Sheet — bottom animKeyboard ile yükselir */}
      <Animated.View style={[styles.sheet, { height: animHeight, bottom: animKeyboard, backgroundColor: colors.background.primary }]}>
        <View style={{ flex: 1 }}>
          {/* Handle — sürükleme alanı */}
          <View style={styles.handleRow} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
          </View>

          {/* Başlık */}
          <View style={styles.header}>
            <Text style={[titleStyle, styles.title]}>{t("feed_comments.comments")}</Text>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                snapTo("closed");
              }}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Yorumlar listesi — ortada, flex ile büyür */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
              <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>{t("feed_comments.loading")}</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              initialNumToRender={10}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
              renderItem={renderItem}
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{t("feed_comments.empty")}</Text>}
            />
          )}

          {/* Input — her zaman altta */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: colors.background.secondary,
                paddingBottom: Math.max(insets.bottom, spacing.md),
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text.primary,
                  backgroundColor: colors.surface.elevated,
                  borderColor: colors.surface.border,
                },
              ]}
              placeholder={t("feed_comments.write_comment")}
              placeholderTextColor={colors.text.tertiary}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sending}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: text.trim() && !sending ? colors.accent.primary : colors.surface.border,
                },
              ]}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator
                  size="small"
                  color={text.trim() && !sending ? colors.accent.onPrimary : colors.text.tertiary}
                />
              ) : (
                <IconSymbol
                  name="paperplane.fill"
                  size={20}
                  color={text.trim() && !sending ? colors.accent.onPrimary : colors.text.tertiary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: spacing.xl,
  },
  commentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  commentContent: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentTime: {
    fontSize: 11,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
