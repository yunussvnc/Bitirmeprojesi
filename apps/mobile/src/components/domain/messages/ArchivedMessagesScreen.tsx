/**
 * Archived Messages Screen
 *
 * Arşivlenmiş sohbetlerin listelendiği ekran.
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { Swipeable } from "react-native-gesture-handler";
import { useMessagesStore, Conversation } from "@/src/store/useMessagesStore";
import { useTranslation } from "react-i18next";

export default function ArchivedMessagesScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const conversations = useMessagesStore(state => state.conversations).filter(c => c.isArchived);
    const unarchiveConversation = useMessagesStore(state => state.unarchiveConversation);
    const deleteConversation = useMessagesStore(state => state.deleteConversation);
    const unarchiveMultiple = useMessagesStore(state => state.unarchiveMultiple);
    const deleteMultiple = useMessagesStore(state => state.deleteMultiple);

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        setSelectedIds([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleUnarchiveSelected = () => {
        unarchiveMultiple(selectedIds);
        setIsEditMode(false);
        setSelectedIds([]);
    };

    const handleDeleteSelected = () => {
        deleteMultiple(selectedIds);
        setIsEditMode(false);
        setSelectedIds([]);
    };

    const renderRightActions = (id: string) => {
        return (
            <View style={styles.swipeActionsContainer}>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.semantic.info }]}
                    onPress={() => {
                        lightImpact();
                        unarchiveConversation(id);
                    }}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="tray.and.arrow.up" size={20} color="#FFF" />
                    <Text style={styles.swipeActionLabel}>{t("messages.unarchive")}</Text>
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
                            {item.lastMessage}
                        </Text>
                    </View>
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

    const listEmpty = React.useMemo(() => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { borderColor: colors.accent.primary + "40" }]}>
                <IconSymbol name="archivebox" size={32} color={colors.accent.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t("messages.archive_empty")}</Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                {t("messages.archive_empty_desc")}
            </Text>
        </View>
    ), [colors]);

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
                {/* Sol Alan (Geri Butonu) */}
                <View style={{ flex: 1, alignItems: "flex-start" }}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        hitSlop={12}
                        activeOpacity={0.7}
                        onPress={() => {
                            lightImpact();
                            router.push("/(tabs)/messages" as any);
                        }}
                    >
                        <IconSymbol name="chevron.left" size={26} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>

                {/* Orta Alan (Başlık) */}
                <View style={{ flex: 2, alignItems: "center" }}>
                    <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
                        {t("messages.archived_title")}
                    </Text>
                </View>

                {/* Sağ Alan (Düzenle Butonu) */}
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                    {!isEditMode && conversations.length > 0 && (
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
            </View>

            {/* ── Düzenleme Modu Araç Çubuğu ── */}
            {isEditMode && (
                <View style={styles.editToolbar}>
                    <TouchableOpacity
                        style={styles.cancelEditBtn}
                        onPress={toggleEditMode}
                    >
                        <Text style={[styles.cancelEditText, { color: colors.text.secondary }]}>{t("messages.done")}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.editModeTitle, { color: colors.text.primary }]}>
                        {selectedIds.length > 0 ? t("messages.selected_count", {count: selectedIds.length}) : t("messages.select_chat")}
                    </Text>
                    <TouchableOpacity
                        style={[styles.selectAllBtn, { opacity: conversations.length > 0 ? 1 : 0.5 }]}
                        onPress={() => {
                            if (selectedIds.length === conversations.length) {
                                setSelectedIds([]);
                            } else {
                                setSelectedIds(conversations.map(c => c.id));
                            }
                        }}
                        disabled={conversations.length === 0}
                    >
                        <Text style={[styles.selectAllText, { color: colors.accent.primary }]}>
                            {selectedIds.length === conversations.length ? t("messages.deselect_all") : t("messages.select_all")}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── List ── */}
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                ItemSeparatorComponent={renderSeparator}
                ListEmptyComponent={listEmpty}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + (Platform.OS === "ios" ? 100 : 72),
                }}
                showsVerticalScrollIndicator={false}
            />

            {/* ── Floating Selection Actions ── */}
            {isEditMode && selectedIds.length > 0 && (
                <View style={[
                    styles.floatingActions,
                    { bottom: Platform.OS === 'ios' ? 100 : 80 }
                ]}>
                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.semantic.info, borderColor: colors.surface.border, borderWidth: 1 }]}
                        onPress={handleUnarchiveSelected}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="tray.and.arrow.up" size={24} color="#FFF" />
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
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        letterSpacing: -0.3,
        textAlign: "center",
    },
    headerBtn: {
        padding: 4,
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

    /* Separator */
    separator: {
        paddingHorizontal: 28,
        height: 1,
        justifyContent: "center",
    },
    separatorLine: {
        height: StyleSheet.hairlineWidth,
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

    /* Floating Actions */
    floatingActions: {
        position: 'absolute',
        right: 20,
        zIndex: 10,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 6,
    },
});
