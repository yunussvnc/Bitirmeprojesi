/**
 * ShareStorySheet – Hikayeyi DM ile kişilere paylaşmak için bottom sheet.
 * SharePostSheet ile aynı pattern; conversation listesi üzerinden kullanıcı seçme.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/src/components/ui";
import { SearchInput } from "@/src/components/ui/Input";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/hooks/useTheme";
import { lightImpact, mediumImpact, success } from "@/src/utils/haptics";
import { useMessagesStore, type Conversation } from "@/src/store/useMessagesStore";
import { useAppStore } from "@/src/store/useAppStore";
import { shareStoryViaDM, type Story } from "@/src/services/storyService";
import { spacing } from "@/src/constants/design";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);

interface ShareStorySheetProps {
  visible: boolean;
  onClose: () => void;
  story: Story | null;
}

export function ShareStorySheet({ visible, onClose, story }: ShareStorySheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const animHeight = useRef(new Animated.Value(0)).current;
  const closingRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const conversations = useMessagesStore((s) => s.conversations);
  const blockedUserIds = useAppStore((s) => s.blockedUserIds);

  const filteredConversations = useMemo(() => {
    const active = conversations.filter((c) =>
      !c.isArchived &&
      (!c.targetUserId || !blockedUserIds.includes(c.targetUserId))
    );
    if (!query.trim()) return active;
    const q = query.trim().toLowerCase();
    return active.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q)
    );
  }, [conversations, query, blockedUserIds]);

  // ── Animasyon ──────────────────────────────────────────────────────────
  const snapTo = useCallback(
    (target: "open" | "closed") => {
      const toValue = target === "closed" ? 0 : SHEET_HEIGHT;
      Animated.spring(animHeight, {
        toValue,
        useNativeDriver: false,
        bounciness: 4,
      }).start(() => {
        if (target === "closed" && !closingRef.current) {
          closingRef.current = true;
          setModalVisible(false);
          onCloseRef.current();
        }
      });
    },
    [animHeight]
  );

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 5,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) animHeight.setValue(SHEET_HEIGHT - gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > SHEET_HEIGHT * 0.3) {
          snapTo("closed");
        } else {
          snapTo("open");
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      setSentTo(new Set());
      setQuery("");
      setModalVisible(true);
      requestAnimationFrame(() => snapTo("open"));
    } else {
      snapTo("closed");
    }
  }, [visible, snapTo]);

  const handleClose = useCallback(() => {
    snapTo("closed");
  }, [snapTo]);

  // ── DM Paylaşma ────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (conv: Conversation) => {
      if (!story || !conv.targetUserId || sending) return;
      mediumImpact();
      const convId = conv.id;
      setSending(convId);
      try {
        await shareStoryViaDM(story.id, conv.targetUserId);
        success();
        setSentTo((prev) => new Set([...prev, convId]));
      } catch (e: any) {
        // Sessizce fail — story paylaşılamaz (close_friends, private hesap, vb.)
        console.warn('[ShareStorySheet] Share failed:', e?.response?.data?.detail);
      } finally {
        setSending(null);
      }
    },
    [story, sending]
  );

  // ── Render Kişi Satırı ─────────────────────────────────────────────────
  const renderConv = useCallback(
    ({ item: conv }: { item: Conversation }) => {
      const isSent = sentTo.has(conv.id);
      const isSending = sending === conv.id;

      return (
        <View style={styles.row}>
          <Avatar
            source={conv.avatar ? { uri: conv.avatar } : undefined}
            name={conv.name}
            size={44}
          />
          <View style={styles.rowInfo}>
            <Text style={[styles.rowName, { color: colors.text.primary }]} numberOfLines={1}>
              {conv.name}
            </Text>
            <Text style={[styles.rowUsername, { color: colors.text.tertiary }]} numberOfLines={1}>
              @{conv.username}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              {
                backgroundColor: isSent
                  ? colors.accent.primary + "22"
                  : colors.accent.primary,
              },
            ]}
            onPress={() => handleSend(conv)}
            disabled={isSent || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <IconSymbol name="ellipsis" size={14} color="#fff" />
            ) : isSent ? (
              <IconSymbol name="checkmark" size={14} color={colors.accent.primary} />
            ) : (
              <Text style={styles.sendBtnText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>
      );
    },
    [colors, sentTo, sending, handleSend]
  );

  if (!modalVisible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <Animated.View
        style={[
          styles.sheet,
          {
            height: animHeight,
            backgroundColor: isDark ? "#1c1c1e" : "#fff",
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {/* Drag Handle */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
          <Text style={[styles.title, { color: colors.text.primary }]}>Hikayeyi Paylaş</Text>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <SearchInput
            value={query}
            onChangeText={setQuery}
            placeholder="Kişi ara..."
          />
        </View>

        {/* Conversation List */}
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyWrap}>
            <IconSymbol name="person.2.slash" size={32} color={colors.text.tertiary} />
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
              {query ? "Eşleşen kişi bulunamadı" : "Henüz hiç sohbet yok"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredConversations}
            keyExtractor={(c) => c.id}
            renderItem={renderConv}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
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
  dragArea: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  searchWrapper: {
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    gap: 12,
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowUsername: {
    fontSize: 13,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 70,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
