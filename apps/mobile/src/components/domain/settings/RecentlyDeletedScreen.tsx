/**
 * Recently Deleted Messages Screen
 *
 * Provides a UI to view and restore softly deleted messages before their 2-day expiration.
 * Tasarım olarak normal mesajlar ekranıyla aynı kart stilini kullanır.
 */

import React, { useState, useEffect } from "react";
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
import { EmptyState } from "@/src/components/ui/EmptyState";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { Swipeable } from "react-native-gesture-handler";
import { useMessagesStore, Conversation } from "@/src/store/useMessagesStore";

export default function RecentlyDeletedScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();

    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const conversations = useMessagesStore(state => state.conversations).filter(c => c.isDeleted);
    const restoreDeleted = useMessagesStore(state => state.restoreDeleted);
    const permanentlyDelete = useMessagesStore(state => state.permanentlyDelete);
    const restoreDeletedMultiple = useMessagesStore(state => state.restoreDeletedMultiple);
    const permanentlyDeleteMultiple = useMessagesStore(state => state.permanentlyDeleteMultiple);
    const purgeExpiredMessages = useMessagesStore(state => state.purgeExpiredMessages);

    // Temizleme işlemini ekran açıldığında tetikle
    useEffect(() => {
        purgeExpiredMessages();
    }, [purgeExpiredMessages]);

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
        setSelectedIds([]);
    };

    const toggleSelection = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleRestoreSelected = () => {
        restoreDeletedMultiple(selectedIds);
        setIsEditMode(false);
        setSelectedIds([]);
    };

    const handlePermanentlyDeleteSelected = () => {
        permanentlyDeleteMultiple(selectedIds);
        setIsEditMode(false);
        setSelectedIds([]);
    };

    const getDaysRemaining = (deletedAt?: number) => {
        if (!deletedAt) return 0;
        const now = Date.now();
        const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
        const remaining = TWO_DAYS - (now - deletedAt);
        const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
        return Math.max(0, days);
    };

    const renderRightActions = (id: string) => {
        return (
            <View style={styles.swipeActionsContainer}>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.semantic.info }]}
                    onPress={() => {
                        lightImpact();
                        restoreDeleted(id);
                    }}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="arrow.uturn.backward" size={20} color="#FFF" />
                    <Text style={styles.swipeActionLabel}>{t("common.restore")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.swipeActionBtn, { backgroundColor: colors.semantic.error }]}
                    onPress={() => {
                        lightImpact();
                        permanentlyDelete(id);
                    }}
                    activeOpacity={0.8}
                >
                    <IconSymbol name="trash" size={20} color="#FFF" />
                    <Text style={styles.swipeActionLabel}>{t("common.delete")}</Text>
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
        const daysLeft = getDaysRemaining(item.deletedAt);

        const content = (
            <TouchableOpacity
                style={[styles.conversationCard, { backgroundColor: colors.surface.elevated }]}
                activeOpacity={0.7}
                onPress={() => {
                    if (isEditMode) {
                        lightImpact();
                        toggleSelection(item.id);
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
                                style={[styles.name, { color: colors.text.primary }]}
                                numberOfLines={1}
                            >
                                {item.name}
                            </Text>
                            <View style={[styles.timeBadge, { backgroundColor: colors.surface.elevated }]}>
                                <Text style={[styles.time, { color: colors.semantic.error }]}>{t("trash.days_left", { days: daysLeft })}</Text>
                            </View>
                        </View>

                        <Text
                            style={[
                                styles.message,
                                { color: colors.text.secondary },
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
            <View style={[styles.emptyIcon, { borderColor: colors.semantic.error + "40" }]}>
                <IconSymbol name="trash" size={32} color={colors.semantic.error} />
            </View>
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t("trash.empty")}</Text>
            </View>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                {t("trash.empty_desc")}
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
                <TouchableOpacity
                    style={styles.backBtn}
                    hitSlop={12}
                    activeOpacity={0.7}
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                >
                    <IconSymbol name="chevron.left" size={26} color={colors.text.primary} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
                    {t("messages.recently_deleted")}
                </Text>

                {/* Boş görünüm için veya Düzenle butonu */}
                {!isEditMode && conversations.length > 0 ? (
                    <TouchableOpacity
                        style={styles.headerBtn}
                        hitSlop={8}
                        activeOpacity={0.7}
                        onPress={toggleEditMode}
                    >
                        <Text style={{ color: colors.accent.primary, fontSize: 14, fontWeight: "600" }}>
                            {t("trash.edit")}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </View>

            {/* ── Düzenleme Modu Araç Çubuğu ── */}
            {isEditMode && (
                <View style={styles.editToolbar}>
                    <TouchableOpacity
                        style={styles.cancelEditBtn}
                        onPress={toggleEditMode}
                    >
                        <Text style={[styles.cancelEditText, { color: colors.text.secondary }]}>{t("common.done")}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.editModeTitle, { color: colors.text.primary }]}>
                        {selectedIds.length > 0 ? t("trash.selected_count", { count: selectedIds.length }) : t("trash.select_chat")}
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
                            {selectedIds.length === conversations.length ? t("common.deselect_all") : t("common.select_all")}
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
                        onPress={handleRestoreSelected}
                        activeOpacity={0.8}
                    >
                        <IconSymbol name="arrow.uturn.backward" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.fab, { backgroundColor: colors.semantic.error, marginTop: 12 }]}
                        onPress={handlePermanentlyDeleteSelected}
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
        flex: 1,
    },
    headerBtn: {
        padding: 4,
    },

    /* Conversation Card – 3D elevated style (MessagesScreen ile aynı) */
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

    /* Swipe Actions – rounded buttons with labels (MessagesScreen ile aynı) */
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
        alignItems: 'center',
        zIndex: 10,
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
    },
});
