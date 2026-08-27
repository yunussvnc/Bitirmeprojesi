/**
 * Messages Screen
 *
 * Arkadaşlarla mesajlaşma ve beğenilen mekanlarla ilgili yer paylaşımı.
 * Özgün ASEMOS tasarım dili ile.
 */

import React, { useState, useRef } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useMessagesStore, Conversation } from "@/src/store/useMessagesStore";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { MessageListSkeleton } from "./components/MessageListSkeleton";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";
import { getConversations } from "@/src/services/messageService";
import styles from "./messagesScreenStyles";



export default function MessagesScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const authUser = useAuthStore((s) => s.user);
    const { fadeOut, fadeIn } = useTabBarVisibility();
    const lastScrollY = useRef(0);



    // Global Store
    const { conversations, archiveConversation, deleteConversation, archiveMultiple, deleteMultiple, markAsRead } = useMessagesStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const searchInputRef = React.useRef<TextInput>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'chats'|'requests'>('chats');
    const [loading, setLoading] = useState(true);
    const { t } = useTranslation();

    React.useEffect(() => {
        // Ekran her yüklendiğinde (veya authUser değiştiğinde) backend'den konuşma listesini çek
        if (!authUser) return;
        setLoading(true);
        getConversations().then((backendConvs: any[]) => {
            const store = useMessagesStore.getState();
            backendConvs.forEach((bc) => {
                const chatId = String(bc.id);
                const existing = store.conversations.find(c => c.id === chatId);
                const lastMsg = bc.last_message_text || '';
                const senderId = bc.last_message_sender_id;
                const senderType = senderId === authUser.id ? 'me' : bc.other_user_display_name;
                const freshAvatar = bc.other_user_photo || null;

                if (!existing) {
                    // Yeni konuşma — tamamen ekle
                    store.addConversation({
                        id: chatId,
                        name: bc.other_user_display_name,
                        username: '',
                        avatar: freshAvatar ?? '',
                        lastMessage: lastMsg,
                        lastMessageSender: senderType as any,
                        timestamp: bc.last_message_at ? new Date(bc.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                        unread: bc.unread_count > 0,
                        isOnline: false,
                        targetUserId: bc.other_user_id,
                        lastMessageAt: bc.last_message_at ? new Date(bc.last_message_at).getTime() : new Date(bc.created_at).getTime(),
                        isRequest: bc.is_request ?? false,
                    });
                } else {
                    // Mevcut konuşma — profil alanlarını (avatar, isim) her zaman güncelle,
                    // son mesaj ve okunmamış durumunu da senkronize et
                    store.updateConversationMeta(chatId, {
                        avatar: bc.other_user_photo !== undefined ? (bc.other_user_photo || '') : existing.avatar,
                        name: bc.other_user_display_name || existing.name,
                        targetUserId: bc.other_user_id,
                    });

                    if (bc.last_message_at) {
                        const bcTime = new Date(bc.last_message_at).getTime();
                        if (bcTime > (existing.lastMessageAt || 0)) {
                            store.updateLastMessageAt(
                                chatId,
                                lastMsg,
                                new Date(bc.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                senderType as any,
                                bc.unread_count > 0,
                                bcTime
                            );
                        } else if (bc.unread_count > 0 && !existing.unread) {
                            store.updateLastMessageAt(chatId, existing.lastMessage, existing.timestamp, existing.lastMessageSender, true, existing.lastMessageAt);
                        }
                    }
                }
            });
        }).catch((e: any) => console.log("Failed to fetch DMs inbox", e))
          .finally(() => setLoading(false));
    }, [authUser]);

    const username = authUser?.username || authUser?.email || "Kullanıcı";

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        setSelectedIds([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleDeleteSelected = () => {
        deleteMultiple(selectedIds);
        setIsEditMode(false);
        setSelectedIds([]);
    };

    const handleArchiveSelected = () => {
        archiveMultiple(selectedIds);
        setIsEditMode(false);
        setSelectedIds([]);
    };

    const activeConversations = conversations.filter(c => !c.isArchived);
    const displayedConversations = activeConversations.filter(c => viewMode === 'requests' ? c.isRequest : !c.isRequest);

    const filteredConversations = displayedConversations
        .filter((c) => {
            if (!searchQuery) return true;
            const q = searchQuery.toLowerCase();
            return (
                c.name.toLowerCase().includes(q) ||
                c.username.toLowerCase().includes(q) ||
                c.lastMessage.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));



    const renderRightActions = React.useCallback((id: string) => {
        return (
            <View style={styles.swipeActionsContainer}>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.accent.primary }]}
                    onPress={() => {
                        lightImpact();
                        archiveConversation(id);
                    }}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="archivebox" size={20} color="#FFF" />
                    <Text style={styles.swipeActionLabel}>{t("messages.archive")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.semantic.error }]}
                    onPress={() => {
                        lightImpact();
                        deleteConversation(id);
                    }}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="trash" size={20} color="#FFF" />
                    <Text style={styles.swipeActionLabel}>{t("messages.delete")}</Text>
                </TouchableOpacity>
            </View>
        );
    }, [archiveConversation, colors.accent.primary, colors.semantic.error, deleteConversation, t]);

    const renderSeparator = React.useCallback(() => (
        <View style={styles.separator}>
            <View style={[styles.separatorLine, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        </View>
    ), []);

    const renderConversation = React.useCallback(({ item }: { item: Conversation }) => {
        const isSelected = selectedIds.includes(item.id);

        const content = (
            <TouchableOpacity
                style={[styles.conversationCard, { backgroundColor: colors.surface.elevated }]}
                activeOpacity={0.7}
                onPress={() => {
                    lightImpact();
                    if (isEditMode) {
                        toggleSelection(item.id);
                    } else {
                        markAsRead(item.id);
                        router.push(`/chat/${item.id}?name=${encodeURIComponent(item.name)}&avatar=${encodeURIComponent(item.avatar)}&targetUserId=${item.targetUserId}` as any);
                    }
                }}
            >
                <View style={styles.cardInner}>
                    {isEditMode && (
                        <View style={[
                            styles.checkbox,
                            { borderColor: colors.surface.border },
                            isSelected && { backgroundColor: colors.accent.primary, borderColor: colors.accent.primary }
                        ]}>
                            {isSelected && <IconSymbol name="checkmark" size={14} color="#FFF" />}
                        </View>
                    )}
                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {item.avatar ? (
                            <Image
                                source={{ uri: item.avatar }}
                                style={styles.avatar}
                                contentFit="cover"
                            />
                        ) : (
                            // Avatar URL yoksa baş harf placeholder göster
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarInitial}>
                                    {(item.name || '?').charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        {item.isOnline && (
                            <View style={[styles.onlineDot, { borderColor: colors.background.primary }]} />
                        )}

                    </View>

                    {/* İçerik */}
                    <View style={styles.cardContent}>
                        <View style={styles.cardTopRow}>
                            <Text
                                style={[styles.name, { color: colors.text.primary }, item.unread && styles.boldText]}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                            <Text style={[styles.time, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
                        </View>

                        <Text
                            style={[
                                styles.message,
                                { color: item.unread ? colors.text.primary : colors.text.secondary },
                                item.unread && styles.boldText,
                            ]}
                            numberOfLines={1}
                        >
                            {item.lastMessageSender === "me" ? (
                                <><Text style={{ color: colors.text.tertiary }}>{t("messages.you")} </Text>{item.lastMessage}</>
                            ) : item.lastMessageSender ? (
                                <><Text style={{ color: colors.text.tertiary }}>{item.lastMessageSender.split(" ")[0]}: </Text>{item.lastMessage}</>
                            ) : (
                                item.lastMessage
                            )}
                        </Text>

                        {/* Paylaşılan mekan etiketi */}
                        {item.sharedPlace && (
                            <View style={[styles.placeTag, { backgroundColor: colors.accent.primary + "18" }]}>
                                <IconSymbol name="mappin.and.ellipse" size={12} color={colors.accent.primary} />
                                <Text style={[styles.placeTagText, { color: colors.accent.primary }]} numberOfLines={1}>
                                    {item.sharedPlace}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Sağ taraf */}
                    {item.unread && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.accent.primary }]} />
                    )}
                </View>
            </TouchableOpacity>
        );

        if (isEditMode) {
            return content;
        }

        return (
            <Swipeable
                renderRightActions={() => renderRightActions(item.id)}
                overshootRight={false}
            >
                {content}
            </Swipeable>
        );
    }, [colors, isEditMode, markAsRead, renderRightActions, router, selectedIds, t]);

    const listHeader = React.useMemo(() => (
        <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <TouchableOpacity onPress={() => setViewMode('chats')}>
                    <Text style={[styles.sectionTitle, { color: viewMode === 'chats' ? colors.text.primary : colors.text.tertiary }]}>
                        {t("messages.title")}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setViewMode('requests')}>
                    <Text style={[styles.sectionTitle, { color: viewMode === 'requests' ? colors.text.primary : colors.text.tertiary }]}>
                        İstekler
                    </Text>
                </TouchableOpacity>
            </View>
            {!isEditMode && (
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                        lightImpact();
                        router.push("/messages-archive" as any);
                    }}
                >
                    <Text style={[styles.requestsLink, { color: colors.accent.primary }]}>{t("messages.archive")}</Text>
                </TouchableOpacity>
            )}
        </View>
    ), [colors, viewMode, isEditMode, router, t]);

    const listEmpty = React.useMemo(() => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { borderColor: colors.accent.primary + "40" }]}>
                <IconSymbol name={viewMode === 'requests' ? "tray" : "paperplane"} size={32} color={colors.accent.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
                {viewMode === 'requests' ? t("messages.empty_requests_title", "Mesaj İsteği Yok") : t("messages.empty")}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                {viewMode === 'requests' ? t("messages.empty_requests_desc", "Bekleyen bir mesaj isteğiniz bulunmuyor.") : t("messages.empty_desc")}
            </Text>
            {viewMode === 'chats' && (
                <TouchableOpacity
                    style={[styles.startBtn, { backgroundColor: colors.accent.primary }]}
                    activeOpacity={0.8}
                    onPress={() => {
                        lightImpact();
                        router.push({
                            pathname: "/search-users",
                            params: { mode: "chat" }
                        } as any);
                    }}
                >
                    <Text style={styles.startBtnText}>{t("messages.start_chat")}</Text>
                </TouchableOpacity>
            )}
        </View>
    ), [colors, viewMode, router, t]);

    return (
            <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                {/* ── Header ── */}
                <View
                    style={[
                        styles.header,
                        {
                            paddingTop: insets.top + 8,
                            borderBottomColor: colors.surface.border,
                            backgroundColor: colors.background.primary,
                        },
                    ]}
                >


                    <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
                        {username}
                    </Text>

                    {!isEditMode && filteredConversations.length > 0 && (
                        <TouchableOpacity
                            style={styles.headerBtn}
                            hitSlop={8}
                            activeOpacity={0.7}
                            onPress={toggleEditMode}
                        >
                            <Text style={{ color: colors.accent.primary, fontSize: 14, fontWeight: "600" }}>
                                {t("messages.edit")}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Düzenleme Modu Araç Çubuğu (Search Alternatifi) ── */}
                {isEditMode ? (
                    <View style={styles.editToolbar}>
                        <TouchableOpacity
                            style={styles.cancelEditBtn}
                            onPress={toggleEditMode}
                        >
                            <Text style={[styles.cancelEditText, { color: colors.text.secondary }]}>{t("messages.done")}</Text>
                        </TouchableOpacity>
                        <Text style={[styles.editModeTitle, { color: colors.text.primary }]}>
                            {selectedIds.length > 0 ? `${selectedIds.length} ${t("messages.selected")}` : t("messages.select_chat")}
                        </Text>
                        <TouchableOpacity
                            style={[styles.selectAllBtn, { opacity: activeConversations.length > 0 ? 1 : 0.5 }]}
                            onPress={() => {
                                if (selectedIds.length === activeConversations.length) {
                                    setSelectedIds([]);
                                } else {
                                    setSelectedIds(activeConversations.map(c => c.id));
                                }
                            }}
                            disabled={activeConversations.length === 0}
                        >
                            <Text style={[styles.selectAllText, { color: colors.accent.primary }]}>
                                {selectedIds.length === activeConversations.length ? t("messages.deselect_all") : t("messages.select_all")}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.searchSection}>
                        <View style={styles.searchRow}>
                            <View style={[styles.searchBar, { flex: 1, backgroundColor: colors.surface.elevated, borderColor: searchFocused ? colors.accent.primary : colors.surface.border }]}>
                                <IconSymbol name="magnifyingglass" size={18} color={colors.text.tertiary} />
                                <TextInput
                                    ref={searchInputRef}
                                    style={[styles.searchInput, { color: colors.text.primary }]}
                                    placeholder={t("messages.search_ph")}
                                    placeholderTextColor={colors.text.tertiary}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCapitalize="none"
                                    cursorColor={colors.accent.primary}
                                    onFocus={() => setSearchFocused(true)}
                                    onBlur={() => setSearchFocused(false)}
                                />
                            </View>
                            <TouchableOpacity
                                style={[styles.newChatBtn, { backgroundColor: colors.accent.primary }]}
                                activeOpacity={0.8}
                                onPress={() => {
                                    lightImpact();
                                    router.push({ pathname: "/search-users", params: { mode: "chat" } } as any);
                                }}
                            >
                                <IconSymbol name="plus" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}



                {/* ── List ── */}
                {loading ? (
                    <MessageListSkeleton count={6} />
                ) : (
                    <FlatList
                        data={filteredConversations}
                        keyExtractor={(item) => item.id}
                        renderItem={renderConversation}
                        ItemSeparatorComponent={renderSeparator}
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={listEmpty}
                        contentContainerStyle={{
                            paddingBottom: insets.bottom + (Platform.OS === "ios" ? 100 : 72),
                        }}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        onScroll={(e) => {
                            const y = e.nativeEvent.contentOffset.y;
                            const dy = y - lastScrollY.current;
                            lastScrollY.current = y;
                            if (dy > 0 && y > 10) fadeOut();
                            else if (dy < 0) fadeIn();
                        }}
                        onScrollBeginDrag={() => fadeIn()}
                        scrollEventThrottle={16}
                    />
                )}

                {/* ── Floating Selection Actions ── */}
                {isEditMode && selectedIds.length > 0 && (
                    <View style={[
                        styles.floatingActions,
                        { bottom: Platform.OS === 'ios' ? 100 : 80 }
                    ]}>
                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, borderWidth: 1 }]}
                            onPress={handleArchiveSelected}
                            activeOpacity={0.8}
                        >
                            <IconSymbol name="archivebox" size={24} color={colors.accent.primary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.fab, { backgroundColor: colors.semantic.error, marginTop: 12 }]}
                            onPress={handleDeleteSelected}
                            activeOpacity={0.8}
                        >
                            <IconSymbol name="trash" size={24} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
    );
}
