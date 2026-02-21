/**
 * CommentBottomSheet – Gönderi yorumları bottom sheet
 * Yorumları listele, yeni yorum ekle.
 */

import React, { useState, useEffect, useCallback } from "react";
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/constants/design";
import { getComments, addComment, type PostComment } from "@/src/services/feedService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";
import { timeAgo } from "@/src/utils/timeAgo";

export interface CommentBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: number;
  postCaption?: string;
  onCommentAdded?: () => void;
}

export function CommentBottomSheet({
  visible,
  onClose,
  postId,
  onCommentAdded,
}: CommentBottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const loadComments = useCallback(async () => {
    if (!visible || !postId) return;
    setLoading(true);
    try {
      const res = await getComments(postId, 1, 50);
      setComments(res.items);
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

  const renderItem = ({ item }: { item: PostComment }) => (
    <View style={[styles.commentRow, { borderBottomColor: colors.surface.border }]}>
      <Text style={[styles.commentAuthor, { color: colors.text.primary }]}>
        @{item.author_username || `user_${item.user_id}`}
      </Text>
      <Text style={[styles.commentText, { color: colors.text.secondary }]}>{item.text}</Text>
      <Text style={[styles.commentTime, { color: colors.text.tertiary }]}>
        {timeAgo(item.created_at)}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay.medium }]} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: insets.bottom,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.keyboardView}
            keyboardVerticalOffset={0}
          >
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
            </View>

            <View style={styles.header}>
              <Text style={[titleStyle, styles.title]}>Yorumlar</Text>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.accent.primary} />
                <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>
                  Yorumlar yükleniyor...
                </Text>
              </View>
            ) : (
              <FlatList
                data={comments}
                keyExtractor={(item) => String(item.id)}
                initialNumToRender={10}
                windowSize={5}
                removeClippedSubviews={Platform.OS === "android"}
                renderItem={renderItem}
                contentContainerStyle={[
                  styles.listContent,
                  comments.length === 0 && styles.listEmpty,
                ]}
                ListEmptyComponent={
                  <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                    Henüz yorum yok. İlk yorumu sen yap!
                  </Text>
                }
              />
            )}

            <View style={[styles.inputRow, { backgroundColor: colors.background.secondary }]}>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text.primary,
                    backgroundColor: colors.surface.elevated,
                    borderColor: colors.surface.border,
                  },
                ]}
                placeholder="Yorum yaz..."
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
                  <ActivityIndicator size="small" color={text.trim() && !sending ? colors.accent.onPrimary : colors.text.tertiary} />
                ) : (
                  <IconSymbol name="paperplane.fill" size={20} color={text.trim() && !sending ? colors.accent.onPrimary : colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "75%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  keyboardView: {
    maxHeight: "100%",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
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
    padding: 4,
  },
  loadingWrap: {
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    maxHeight: 280,
  },
  listEmpty: {
    flexGrow: 1,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  commentRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    padding: spacing.md,
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
