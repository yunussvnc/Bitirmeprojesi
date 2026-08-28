/**
 * SharePostSheet – Gönderiyi kişilere paylaşmak için bottom sheet.
 *
 * CommentBottomSheet ile aynı modal-pattern kullanır.
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
    PanResponder,
    Dimensions,
    Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "@/src/components/ui";
import { SearchInput } from "@/src/components/ui/Input";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/hooks/useTheme";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";
import { useMessagesStore, type Conversation } from "@/src/store/useMessagesStore";
import { useChatMessagesStore } from "@/src/store/useChatMessagesStore";
import { useAppStore } from "@/src/store/useAppStore";
import { sendMessage } from "@/src/services/messageService";
import type { Post } from "@/src/services/feedService";
import { spacing } from "@/src/constants/design";
import { useTranslation } from "react-i18next";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const SHEET_HEIGHT = Math.round(SCREEN_HEIGHT * 0.55);

interface SharePostSheetProps {
    visible: boolean;
    onClose: () => void;
    post: Post | null;
}

export function SharePostSheet({ visible, onClose, post }: SharePostSheetProps) {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState("");
    const [sentTo, setSentTo] = useState<Set<string>>(new Set());
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const { t } = useTranslation();

    const animHeight = useRef(new Animated.Value(0)).current;
    const closingRef = useRef(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    const conversations = useMessagesStore((s) => s.conversations);
    const blockedUserIds = useAppStore((s) => s.blockedUserIds);
    const updateLastMessageAt = useMessagesStore((s) => s.updateLastMessageAt);
    const addMessage = useChatMessagesStore((s) => s.addMessage);

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
    }, [blockedUserIds, conversations, query]);

    // --- Animasyonlar ---
    const snapTo = useCallback(
        (target: "open" | "closed") => {
            const toValue = target === "closed" ? 0 : SHEET_HEIGHT;

            if (target === "closed") closingRef.current = true;

            Animated.spring(animHeight, {
                toValue,
                useNativeDriver: false,
                damping: 24,
                stiffness: 220,
                mass: 0.8,
                overshootClamping: true,
            }).start(({ finished }) => {
                if (finished && target === "closed") {
                    setModalVisible(false);
                    onCloseRef.current();
                }
            });
        },
        [animHeight]
    );

    const snapToRef = useRef(snapTo);
    snapToRef.current = snapTo;

    useEffect(() => {
        if (!visible) {
            closingRef.current = false;
            setQuery("");
            setSentTo(new Set());
            setSelectedIds(new Set());
        }
    }, [visible]);

    useEffect(() => {
        if (visible && !closingRef.current) {
            setModalVisible(true);
            animHeight.setValue(0);
            snapToRef.current("open");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    // PanResponder
    const startHeightRef = useRef(SHEET_HEIGHT);
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
            onPanResponderGrant: () => {
                startHeightRef.current = SHEET_HEIGHT;
            },
            onPanResponderMove: (_, g) => {
                const next = startHeightRef.current - g.dy;
                const clamped = Math.max(SHEET_HEIGHT * 0.3, Math.min(SHEET_HEIGHT + 30, next));
                animHeight.setValue(clamped);
            },
            onPanResponderRelease: (_, g) => {
                if (g.dy > 80 || g.vy > 0.5) {
                    snapToRef.current("closed");
                } else {
                    snapToRef.current("open");
                }
            },
        })
    ).current;

    // --- Mesaj Gönder ---
    const handleSend = useCallback(
        (conversation: Conversation) => {
            if (!post) return;
            mediumImpact();

            const authorName =
                post.author?.username || post.author?.first_name || `user_${post.user_id}`;
            const placeName = post.place?.name || "";
            const mediaUrl = post.media[0]?.media_url || "";
            const caption = post.caption || "";

            const messageText = `${t('feed.post_shared')}\n${authorName}${placeName ? ` • ${placeName}` : ""}${caption ? `\n"${caption.slice(0, 80)}${caption.length > 80 ? "..." : ""}"` : ""}`;

            const msgId = `share-${post.id}-${Date.now()}`;
            addMessage(conversation.id, {
                id: msgId,
                text: messageText,
                isMine: true,
                timestamp: new Date().toISOString(),
                imageUri: mediaUrl || undefined,
                status: "sent",
                sharedPostId: post.id,
            });

            updateLastMessageAt(
                conversation.id,
                t('feed.post_shared'),
                new Date().toISOString(),
                "me",
                true // unhide = true
            );

            // Backend API call
            sendMessage(parseInt(conversation.id, 10), {
                content: messageText,
                message_type: "shared_post",
                media_url: mediaUrl || undefined,
                shared_post_id: post.id,
            }).catch(e => console.log("Post share error:", e));

            setSentTo((prev) => new Set(prev).add(conversation.id));
        },
        [post, addMessage, updateLastMessageAt, t]
    );

    // Link ile paylaş (native Share API)
    const handleShareLink = useCallback(async () => {
        if (!post) return;
        lightImpact();
        const authorName =
            post.author?.username || post.author?.first_name || `user_${post.user_id}`;
        const placeName = post.place?.name || "";
        const caption = post.caption || "";
        const postLink = `asemos://p/post/${post.id}`;
        const shareText = `📸 ${authorName}${placeName ? ` • ${placeName}` : ""}${caption ? `\n"${caption.slice(0, 120)}${caption.length > 120 ? "..." : ""}"` : ""}\n\nBu gönderiyi AsEmOs'ta keşfet! 🔗 ${postLink}`;
        try {
            await Share.share({ message: shareText, url: postLink });
        } catch {
            // kullanıcı iptal etti
        }
    }, [post]);

    const renderItem = useCallback(
        ({ item }: { item: Conversation }) => {
            const isSent = sentTo.has(item.id);
            const isSelected = selectedIds.has(item.id);
            return (
                <TouchableOpacity
                    style={styles.personRow}
                    onPress={() => {
                        if (!isSent) {
                            lightImpact();
                            setSelectedIds(prev => {
                                const next = new Set(prev);
                                if (next.has(item.id)) next.delete(item.id);
                                else next.add(item.id);
                                return next;
                            });
                        }
                    }}
                    activeOpacity={isSent ? 1 : 0.7}
                >
                    <Avatar
                        source={item.avatar ? { uri: item.avatar } : undefined}
                        name={item.name}
                        size={44}
                    />
                    <View style={styles.personInfo}>
                        <Text
                            style={[styles.personName, { color: colors.text.primary }]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                        <Text
                            style={[styles.personUsername, { color: colors.text.tertiary }]}
                            numberOfLines={1}
                        >
                            @{item.username}
                        </Text>
                    </View>
                    {isSent ? (
                        <View style={[styles.sentBadge, { backgroundColor: "#4CAF5020" }]}>
                            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
                            <Text style={[styles.sentText, { color: "#4CAF50" }]}>{t('feed.sent_badge')}</Text>
                        </View>
                    ) : (
                        <View style={{ paddingLeft: 16 }}>
                            <IconSymbol
                                name={isSelected ? "checkmark.circle.fill" : "circle"}
                                size={26}
                                color={isSelected ? colors.accent.primary : colors.text.tertiary}
                            />
                        </View>
                    )}
                </TouchableOpacity>
            );
        },
        [colors, sentTo, selectedIds, handleSend]
    );

    return (
        <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            onRequestClose={() => snapTo("closed")}
            statusBarTranslucent
        >
            <Pressable
                style={[styles.backdrop, { backgroundColor: "rgba(0,0,0,0.45)" }]}
                onPress={() => snapTo("closed")}
            />

            <Animated.View
                style={[
                    styles.sheet,
                    { height: animHeight, backgroundColor: colors.background.primary },
                ]}
            >
                {/* Handle */}
                <View style={styles.handleRow} {...panResponder.panHandlers}>
                    <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
                </View>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text.primary }]}>{t('feed.share_title')}</Text>
                    <TouchableOpacity
                        onPress={() => {
                            lightImpact();
                            snapTo("closed");
                        }}
                        style={styles.closeBtn}
                        activeOpacity={0.7}
                    >
                        <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
                    </TouchableOpacity>
                </View>

                {/* Link ile Paylaş */}
                <TouchableOpacity
                    style={[styles.linkShareRow, { backgroundColor: colors.surface.elevated }]}
                    onPress={handleShareLink}
                    activeOpacity={0.7}
                >
                    <View style={[styles.linkShareIcon, { backgroundColor: colors.accent.primary + '20' }]}>
                        <IconSymbol name="link" size={20} color={colors.accent.primary} />
                    </View>
                    <Text style={[styles.linkShareText, { color: colors.text.primary }]}>{t('feed.share_link')}</Text>
                    <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
                </TouchableOpacity>

                {/* Arama */}
                <View style={styles.searchWrap}>
                    <SearchInput
                        placeholder={t('feed.search_placeholder')}
                        value={query}
                        onChangeText={setQuery}
                        autoCorrect={false}
                        autoCapitalize="none"
                        containerStyle={styles.searchContainer}
                    />
                </View>

                {/* Kişi Listesi */}
                <FlatList
                    data={filteredConversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                            {t('feed.user_not_found')}
                        </Text>
                    }
                />

                {/* Alt Kısım: Toplu Gönder Butonu */}
                {selectedIds.size > 0 && (
                    <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.background.primary, borderTopColor: colors.surface.border }]}>
                        <TouchableOpacity
                            style={[styles.mainSendBtn, { backgroundColor: colors.accent.primary }]}
                            activeOpacity={0.8}
                            onPress={() => {
                                Array.from(selectedIds).forEach(id => {
                                    const conv = conversations.find(c => c.id === id);
                                    if (conv) handleSend(conv);
                                });
                                setSelectedIds(new Set());
                                setTimeout(() => snapTo("closed"), 800);
                            }}
                        >
                            <Text style={styles.mainSendBtnText}>
                                {t('feed.send_btn', 'Gönder')} ({selectedIds.size})
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
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
        paddingTop: 14,
        paddingBottom: 10,
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
        paddingBottom: spacing.sm,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
    },
    closeBtn: {
        padding: 4,
    },
    searchWrap: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
    },
    searchContainer: {
        marginBottom: 0,
    },
    linkShareRow: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: spacing.lg,
        marginBottom: 12,
        padding: 12,
        borderRadius: 14,
        gap: 12,
    },
    linkShareIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    linkShareText: {
        flex: 1,
        fontSize: 15,
        fontWeight: "600",
    },
    listContent: {
        paddingHorizontal: spacing.lg,
    },
    personRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
    },
    personInfo: {
        flex: 1,
    },
    personName: {
        fontSize: 15,
        fontWeight: "600",
    },
    personUsername: {
        fontSize: 13,
        marginTop: 1,
    },
    sendBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    sendBtnText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "700",
    },
    sentBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sentText: {
        fontSize: 13,
        fontWeight: "600",
    },
    emptyText: {
        textAlign: "center",
        paddingVertical: 24,
        fontSize: 14,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.lg,
        paddingTop: 16,
        borderTopWidth: 1,
    },
    mainSendBtn: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainSendBtnText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
