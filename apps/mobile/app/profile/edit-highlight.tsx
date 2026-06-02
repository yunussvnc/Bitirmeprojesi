import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions, StatusBar, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { createTextStyle } from "@/src/constants/design";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getUserPosts } from "@/src/services/userService";
import type { Post } from "@/src/services/feedService";
import { useTranslation } from "react-i18next";

const GRID_GAP = 1;
const GRID_COLS = 3;

interface ArchiveStory {
    id: string;
    image: string;
    durationStr: string;
}

function postToArchiveItem(post: Post): ArchiveStory | null {
    const url = post.media?.[0]?.media_url;
    if (!url) return null;
    return {
        id: String(post.id),
        image: url,
        durationStr: post.post_type === "reel" ? "Reel" : "",
    };
}

export default function EditHighlightRoute() {
    const { colors } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cellSize = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
    const userId = useAuthStore((s) => s.user?.id);
    const { selected } = useLocalSearchParams<{ selected?: string }>();

    const initialSelected = useMemo(() => {
        if (!selected || typeof selected !== "string") return new Set<string>();
        return new Set(selected.split(",").filter(Boolean));
    }, [selected]);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(initialSelected);
    const [allItems, setAllItems] = useState<ArchiveStory[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightName, setHighlightName] = useState("");
    const [activeTab, setActiveTab] = useState<"selected" | "stories">("selected");

    useEffect(() => {
        setSelectedIds(initialSelected);
    }, [initialSelected]);

    const loadPosts = useCallback(async () => {
        if (!userId) {
            setAllItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await getUserPosts(userId, 1, 60);
            const items = (res.items ?? [])
                .map(postToArchiveItem)
                .filter((x): x is ArchiveStory => x != null);
            setAllItems(items);
        } catch {
            setAllItems([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const coverUri = useMemo(() => {
        const firstId = Array.from(selectedIds)[0];
        const item = allItems.find((i) => i.id === firstId);
        return item?.image ?? null;
    }, [selectedIds, allItems]);

    const dataToRender = useMemo(() => {
        if (activeTab === "selected") {
            return allItems.filter((i) => selectedIds.has(i.id));
        }
        return allItems;
    }, [activeTab, allItems, selectedIds]);

    const toggleSelect = (id: string) => {
        lightImpact();
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const renderItem = ({ item }: { item: ArchiveStory }) => {
        const isSelected = selectedIds.has(item.id);

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => toggleSelect(item.id)}
                style={{
                    width: cellSize,
                    height: cellSize * 1.8,
                    marginBottom: GRID_GAP,
                    marginRight: GRID_GAP,
                    position: "relative",
                    backgroundColor: colors.surface.elevated,
                }}
            >
                <Image
                    source={{ uri: item.image }}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                />

                <View style={styles.topRightIcon}>
                    <IconSymbol name="heart" size={16} color="#fff" />
                </View>

                <View style={styles.bottomRightIcon}>
                    {isSelected ? (
                        <View style={[styles.circleInner, { backgroundColor: colors.accent.primary, borderColor: '#fff', borderWidth: 1 }]}>
                            <IconSymbol name="checkmark" size={12} color="#fff" />
                        </View>
                    ) : (
                        <View style={[styles.circleInnerEmpty, { borderColor: "#fff" }]} />
                    )}
                </View>

                {item.durationStr ? (
                    <Text style={styles.durationText}>{item.durationStr}</Text>
                ) : null}

                {!isSelected && <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(255,255,255,0.4)', zIndex: 0 }]} />}
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar barStyle="light-content" />

            <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: '#000' }]}>
                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                    hitSlop={12}
                    style={styles.headerBtnLeft}
                >
                    <Text style={[styles.headerActionText, { color: colors.accent.primary }]}>
                        {t("common.cancel", "İptal")}
                    </Text>
                </TouchableOpacity>

                <Text style={[createTextStyle("title", "#fff"), styles.headerTitle]} numberOfLines={1}>
                    {t("highlights.edit_title", "Öne Çıkarmayı Düzenle")}
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        router.replace("/(tabs)/profile" as any);
                    }}
                    hitSlop={12}
                    style={styles.headerBtnRight}
                >
                    <Text style={[styles.headerActionText, { color: colors.accent.primary, fontWeight: '600' }]}>
                        {t("common.done", "Bitti")}
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={loading ? [] : dataToRender}
                keyExtractor={(item) => item.id}
                numColumns={GRID_COLS}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <View>
                        <View style={styles.coverSection}>
                            <View style={styles.coverCircle}>
                                {coverUri ? (
                                    <Image source={{ uri: coverUri }} style={styles.coverImageFill} contentFit="cover" />
                                ) : (
                                    <View style={[styles.coverImageFill, { backgroundColor: '#222' }]} />
                                )}
                                <View style={styles.coverDarkOverlay} />
                            </View>
                            <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 12 }}>
                                <Text style={{ color: colors.accent.primary, fontSize: 13, fontWeight: '600' }}>
                                    {t("highlights.edit_cover", "Kapağı Düzenle")}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.nameRow}>
                            <Text style={styles.nameLabel}>{t("highlights.name_label", "Ad")}</Text>
                            <TextInput
                                style={styles.nameInput}
                                value={highlightName}
                                onChangeText={setHighlightName}
                                placeholder={t("highlights.name_placeholder", "Öne Çıkanlar")}
                                placeholderTextColor="#666"
                                selectionColor={colors.accent.primary}
                                autoCapitalize="none"
                                cursorColor={colors.accent.primary}
                            />
                        </View>

                        <View style={styles.separator} />

                        <View style={styles.tabsContainer}>
                            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("selected")} activeOpacity={0.8}>
                                <Text style={[styles.tabText, activeTab === "selected" && styles.tabTextActive]}>
                                    {t("highlights.tab_selected", "Seçilenler")}
                                </Text>
                                {activeTab === "selected" && <View style={styles.activeTabIndicator} />}
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab("stories")} activeOpacity={0.8}>
                                <Text style={[styles.tabText, activeTab === "stories" && styles.tabTextActive]}>
                                    {t("highlights.tab_all_posts", "Gönderiler")}
                                </Text>
                                {activeTab === "stories" && <View style={styles.activeTabIndicator} />}
                            </TouchableOpacity>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    loading ? (
                        <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                            <ActivityIndicator color={colors.accent.primary} />
                        </View>
                    ) : (
                        <View style={{ padding: 24, alignItems: 'center' }}>
                            <Text style={{ color: '#888', fontSize: 14 }}>
                                {t("highlights.no_selection", "Seçili gönderi yok")}
                            </Text>
                        </View>
                    )
                }
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
        borderBottomColor: '#222',
    },
    headerBtnLeft: {
        width: 60,
        alignItems: "flex-start",
        justifyContent: "center",
    },
    headerBtnRight: {
        width: 60,
        alignItems: "flex-end",
        justifyContent: "center",
    },
    headerActionText: {
        fontSize: 16,
        fontWeight: "400",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        flex: 1,
        textAlign: 'center',
    },
    coverSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    coverCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 1.5,
        borderColor: '#fff',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    coverImageFill: {
        width: '100%',
        height: '100%',
    },
    coverDarkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#222',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    nameLabel: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '400',
        width: 60,
    },
    nameInput: {
        flex: 1,
        color: '#fff',
        fontSize: 15,
        paddingVertical: 0,
    },
    tabsContainer: {
        flexDirection: 'row',
        height: 48,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#222',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    tabText: {
        color: '#888',
        fontSize: 15,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#fff',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: -StyleSheet.hairlineWidth,
        left: 20,
        right: 20,
        height: 2,
        backgroundColor: '#fff',
    },
    topRightIcon: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 1,
    },
    bottomRightIcon: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        zIndex: 2,
    },
    circleInner: {
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInnerEmpty: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1.5,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    durationText: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        zIndex: 1,
    },
});
