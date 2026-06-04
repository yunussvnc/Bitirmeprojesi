/**
 * Messages Screen
 *
 * Arkadaşlarla mesajlaşma ve beğenilen mekanlarla ilgili yer paylaşımı.
 * Özgün ASEMOS tasarım dili ile.
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useMessagesStore, Conversation } from "@/src/store/useMessagesStore";
import { Swipeable } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

/** Doğum tarihinden yaş hesapla */
function calculateAge(birthDateStr: string | null | undefined): number | null {
    if (!birthDateStr) return null;
    const bd = new Date(birthDateStr);
    if (isNaN(bd.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) age--;
    return age;
}

export default function MessagesScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const authUser = useAuthStore((s) => s.user);

    const userAge = calculateAge(authUser?.birth_date);
    const isUnder18 = userAge !== null && userAge < 18;

    // Global Store
    const { conversations, archiveConversation, deleteConversation, archiveMultiple, deleteMultiple, markAsRead } = useMessagesStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const searchInputRef = React.useRef<TextInput>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'chats'|'requests'>('chats');
    const { t } = useTranslation();
    const { getMatchConversations } = require("@/src/services/matchService");

    React.useEffect(() => {
        // Ekran her yüklendiğinde (veya authUser değiştiğinde) backend'den konuşma listesini çek
        if (!authUser) return;
        getMatchConversations().then((backendConvs: any[]) => {
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
                        isMatch: !bc.my_profile_revealed || !bc.other_profile_revealed,
                        isRevealed: bc.my_profile_revealed && bc.other_profile_revealed,
                        revealRequestedByMe: bc.my_profile_revealed,
                        revealRequestedByThem: bc.other_profile_revealed,
                        isRequest: bc.is_request ?? false,
                    });
                } else {
                    // Mevcut konuşma — profil alanlarını (avatar, isim) her zaman güncelle,
                    // son mesaj ve okunmamış durumunu da senkronize et
                    store.updateConversationMeta(chatId, {
                        avatar: freshAvatar ?? existing.avatar,
                        name: bc.other_user_display_name || existing.name,
                        targetUserId: bc.other_user_id,
                        isRevealed: bc.my_profile_revealed && bc.other_profile_revealed,
                        revealRequestedByMe: bc.my_profile_revealed,
                        revealRequestedByThem: bc.other_profile_revealed,
                        isMatch: !bc.my_profile_revealed || !bc.other_profile_revealed,
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
        }).catch((e: any) => console.log("Failed to fetch DMs inbox", e));
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



    const renderRightActions = (id: string) => {
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
    };

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
                        router.push(`/chat/${item.id}` as any);
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
                        {item.isMatch && (
                            <View style={[styles.matchFlame, { borderColor: colors.background.primary }]}>
                                <IconSymbol name="flame.fill" size={10} color="#fff" />
                            </View>
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
    }, [colors, router, isEditMode, selectedIds]);

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
                        router.push("/(tabs)/messages/archive" as any);
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
                    {!isEditMode && (
                        <TouchableOpacity
                            style={styles.headerLeftBtn}
                            hitSlop={8}
                            activeOpacity={0.7}
                            onPress={() => {
                                lightImpact();
                                if (isUnder18) {
                                    Alert.alert(
                                        "Yaş Sınırı",
                                        "18 yaşınıza geldiğinizde eşleşme ekranı aktif olacaktır.",
                                        [{ text: "Tamam" }]
                                    );
                                    return;
                                }
                                router.push("/matching" as any);
                            }}
                        >
                            <IconSymbol name="flame.fill" size={26} color={isUnder18 ? colors.text.tertiary : colors.accent.primary} />
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
                        {username}
                    </Text>

                    {!isEditMode && (
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
                />

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "flex-end", // Align items to the bottom
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        position: "relative",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: -0.2,
        textAlign: "center",
        marginBottom: 2, // Slight adjustment for baseline
        flex: 1,
    },
    headerBtn: {
        position: "absolute",
        right: 16,
        bottom: 11, // Match the paddingBottom of header
        padding: 4,
        zIndex: 10,
    },
    headerLeftBtn: {
        position: "absolute",
        left: 16,
        bottom: 7, // Adjust to cleanly align flame horizontally with text
        padding: 4,
        zIndex: 10,
    },

    /* Search */
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    searchRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        height: 38,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },
    newChatBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },

    /* Section Header */
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    requestsLink: {
        fontSize: 14,
        fontWeight: "600",
    },

    /* Conversation Card */
    conversationCard: {
        marginHorizontal: 12,
        marginVertical: 4,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        // 3D shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 6,
        // Subtle border for glass / depth effect
        borderWidth: 0.5,
        borderColor: "rgba(255,255,255,0.06)",
    },
    cardInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 4,
    },

    /* Separator */
    separator: {
        paddingHorizontal: 28,
        height: 1,
        justifyContent: "center",
    },
    separatorLine: {
        height: StyleSheet.hairlineWidth,
    },
    avatarContainer: {
        position: "relative",
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    avatarPlaceholder: {
        backgroundColor: '#2a2a3a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitial: {
        fontSize: 20,
        fontWeight: '700',
        color: '#a0a0c0',
    },
    onlineDot: {
        position: "absolute",
        bottom: 1,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#2ecc71",
        borderWidth: 2.5,
    },
    matchFlame: {
        position: "absolute",
        bottom: -2,
        left: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#1DB954",
        borderWidth: 2.5,
        alignItems: "center",
        justifyContent: "center",
    },
    cardContent: {
        flex: 1,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 3,
    },
    name: {
        fontSize: 15,
        fontWeight: "500",
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 13,
        fontWeight: "400",
    },
    message: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 19,
    },
    boldText: {
        fontWeight: "700",
    },

    /* Place Tag */
    placeTag: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    placeTagText: {
        fontSize: 12,
        fontWeight: "600",
    },

    /* Unread */
    unreadDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginLeft: 10,
    },

    /* Empty State */
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 28,
    },
    startBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    startBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },

    /* Edit Mode Toolbar */
    editToolbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    cancelEditBtn: {
        paddingVertical: 4,
    },
    cancelEditText: {
        fontSize: 15,
        fontWeight: "500",
    },
    editModeTitle: {
        fontSize: 15,
        fontWeight: "600",
    },
    selectAllBtn: {
        paddingVertical: 4,
    },
    selectAllText: {
        fontSize: 15,
        fontWeight: "600",
    },

    /* Checkbox (Edit Mode) */
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        marginRight: 12,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Swipe Actions */
    swipeActionsContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingLeft: 8,
        paddingRight: 12,
        marginVertical: 4,
    },
    swipeActionBtn: {
        width: 56,
        height: '100%' as any,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        gap: 4,
    },
    swipeActionLabel: {
        color: "#FFF",
        fontSize: 11,
        fontWeight: "600",
    },

    /* Floating Actions */
    floatingActions: {
        position: 'absolute',
        right: 20,
        alignItems: 'center',
    },
    fab: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 5,
    }
});
