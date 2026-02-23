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

export default function MessagesScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const authUser = useAuthStore((s) => s.user);

    // Global Store
    const { conversations, archiveConversation, deleteConversation, archiveMultiple, deleteMultiple, markAsRead } = useMessagesStore();

    const [searchQuery, setSearchQuery] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);
    const searchInputRef = React.useRef<TextInput>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

    const activeConversations = conversations.filter(c => !c.isArchived && !c.isDeleted);

    const filteredConversations = activeConversations.filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            c.username.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q)
        );
    });



    const renderRightActions = (id: string) => {
        return (
            <View style={styles.swipeActionsContainer}>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.accent.primary }]}
                    onPress={() => {
                        lightImpact();
                        archiveConversation(id);
                    }}
                >
                    <IconSymbol name="archivebox" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.semantic.error }]}
                    onPress={() => {
                        lightImpact();
                        deleteConversation(id);
                    }}
                >
                    <IconSymbol name="trash" size={24} color="#FFF" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderConversation = React.useCallback(({ item }: { item: Conversation }) => {
        const isSelected = selectedIds.includes(item.id);

        const content = (
            <TouchableOpacity
                style={[styles.conversationCard, { backgroundColor: colors.background.primary }]}
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
                        <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
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
                            {item.lastMessage}
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
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Sohbetler</Text>
            {!isEditMode && (
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => {
                        lightImpact();
                        router.push("/(tabs)/messages/archive" as any);
                    }}
                >
                    <Text style={[styles.requestsLink, { color: colors.accent.primary }]}>Arşiv</Text>
                </TouchableOpacity>
            )}
        </View>
    ), [colors, isEditMode, router]);

    const listEmpty = React.useMemo(() => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { borderColor: colors.accent.primary + "40" }]}>
                <IconSymbol name="paperplane" size={32} color={colors.accent.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Henüz sohbet yok</Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                Arkadaşlarınla beğendiğin mekanları paylaş, birlikte keşfet.
            </Text>
            <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.accent.primary }]}
                activeOpacity={0.8}
                onPress={() => lightImpact()}
            >
                <Text style={styles.startBtnText}>Sohbet Başlat</Text>
            </TouchableOpacity>
        </View>
    ), [colors]);

    return (
        <TouchableWithoutFeedback
            onPress={() => {
                Keyboard.dismiss();
                setSearchFocused(false);
            }}
            accessible={false}
        >
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
                                router.push("/matching" as any);
                            }}
                        >
                            <Text style={{ fontSize: 20 }}>💘</Text>
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
                                Düzenle
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
                            <Text style={[styles.cancelEditText, { color: colors.text.secondary }]}>Bitti</Text>
                        </TouchableOpacity>
                        <Text style={[styles.editModeTitle, { color: colors.text.primary }]}>
                            {selectedIds.length > 0 ? `${selectedIds.length} Seçili` : "Sohbet Seçin"}
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
                                {selectedIds.length === activeConversations.length ? "Tümünü Kaldır" : "Tümünü Seç"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.searchSection}>
                        <View style={[styles.searchBar, { backgroundColor: colors.surface.elevated, borderColor: searchFocused ? colors.accent.primary : colors.surface.border }]}>
                            <IconSymbol name="magnifyingglass" size={18} color={colors.text.tertiary} />
                            <TextInput
                                ref={searchInputRef}
                                style={[styles.searchInput, { color: colors.text.primary }]}
                                placeholder="Kişi veya mekan ara..."
                                placeholderTextColor={colors.text.tertiary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoCapitalize="none"
                                cursorColor={colors.accent.primary}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                            />
                        </View>
                    </View>
                )}



                {/* ── List ── */}
                <FlatList
                    data={filteredConversations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
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
        </TouchableWithoutFeedback>
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
    },
    headerBtn: {
        position: "absolute",
        right: 16,
        bottom: 11, // Match the paddingBottom of header
        padding: 4,
    },
    headerLeftBtn: {
        position: "absolute",
        left: 16,
        bottom: 8, // Match the paddingBottom of header, slightly adjusted for emoji size
        padding: 4,
    },

    /* Search */
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
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
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    cardInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
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
        width: 130, // 2 buttons * 65 width
    },
    swipeActionBtn: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
