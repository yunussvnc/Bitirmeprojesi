import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions, StatusBar, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
    dateStr: string;
    durationStr: string;
}

function postToArchiveItem(post: Post): ArchiveStory | null {
    const url = post.media?.[0]?.media_url;
    if (!url) return null;
    const d = new Date(post.created_at);
    const dateStr = Number.isNaN(d.getTime()) ? "" : String(d.getDate()).padStart(2, "0");
    return {
        id: String(post.id),
        image: url,
        dateStr,
        durationStr: post.post_type === "reel" ? "Reel" : "",
    };
}

export default function CreateHighlightRoute() {
    const { colors, isDark } = useTheme();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { width } = useWindowDimensions();
    const cellSize = (width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
    const userId = useAuthStore((s) => s.user?.id);

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [archiveItems, setArchiveItems] = useState<ArchiveStory[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = useCallback(async () => {
        if (!userId) {
            setArchiveItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await getUserPosts(userId, 1, 60);
            const items = (res.items ?? [])
                .map(postToArchiveItem)
                .filter((x): x is ArchiveStory => x != null);
            setArchiveItems(items);
        } catch {
            setArchiveItems([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

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
                {item.dateStr ? (
                    <View style={styles.dateBadge}>
                        <Text style={styles.dateText}>{item.dateStr}</Text>
                    </View>
                ) : null}

                <View style={styles.circleContainer}>
                    <View style={[styles.circleWrap, isSelected && styles.circleWrapSelected]}>
                        {isSelected ? (
                            <View style={[styles.circleInner, { backgroundColor: colors.accent.primary }]}>
                                <IconSymbol name="checkmark" size={14} color="#fff" />
                            </View>
                        ) : (
                            <View style={[styles.circleInnerEmpty, { borderColor: "#fff" }]} />
                        )}
                    </View>
                </View>

                {item.durationStr ? (
                    <Text style={styles.durationText}>{item.durationStr}</Text>
                ) : null}

                {isSelected && <View style={[StyleSheet.absoluteFillObject, styles.selectedOverlay]} />}
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
                    {t("highlights.add_title", "Öne çıkanlara ekle")}
                </Text>

                <TouchableOpacity
                    onPress={() => {
                        if (selectedIds.size > 0) {
                            lightImpact();
                            router.push({
                                pathname: "/profile/edit-highlight",
                                params: { selected: Array.from(selectedIds).join(",") },
                            } as any);
                        }
                    }}
                    hitSlop={12}
                    style={styles.headerBtnRight}
                    disabled={selectedIds.size === 0}
                >
                    <Text style={[styles.headerActionText, { color: selectedIds.size > 0 ? colors.accent.primary : '#555', fontWeight: '700' }]}>
                        {t("common.next", "İleri")}
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.emptyWrap}>
                    <ActivityIndicator color={colors.accent.primary} />
                </View>
            ) : (
                <FlatList
                    data={archiveItems}
                    keyExtractor={(item) => item.id}
                    numColumns={GRID_COLS}
                    renderItem={renderItem}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <Text style={[styles.emptyTitle, { color: '#fff' }]}>
                                {t("highlights.empty_posts_title", "Gönderi bulunamadı")}
                            </Text>
                            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                                {t("highlights.empty_posts_desc", "Öne çıkan oluşturmak için paylaştığınız fotoğraf veya reel gönderileri burada listelenir.")}
                            </Text>
                        </View>
                    }
                />
            )}
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
        borderBottomColor: '#333',
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
    dateBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 32,
        alignItems: 'center',
    },
    dateText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
        lineHeight: 14,
    },
    circleContainer: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    circleWrap: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleWrapSelected: {},
    circleInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleInnerEmpty: {
        width: 24,
        height: 24,
        borderRadius: 12,
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
    },
    selectedOverlay: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        zIndex: -1,
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        paddingTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyDesc: {
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
});
