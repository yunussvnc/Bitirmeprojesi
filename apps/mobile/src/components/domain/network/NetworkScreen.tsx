import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Screen } from "@/src/components/layout/Screen";
import { Avatar, LoadingState, EmptyState } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/hooks/useTheme";
import { lightImpact } from "@/src/utils/haptics";
import { getFollowers, getFollowing, toggleFollow } from "@/src/services/userService";
import type { UserProfile } from "@/src/services/userService";
import { handleApiError } from "@/src/utils/errorHandler";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useTranslation } from "react-i18next";

export default function NetworkScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { t } = useTranslation();
    const { id, type } = useLocalSearchParams<{ id: string; type: "followers" | "following" }>();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const authUser = useAuthStore((s) => s.user);

    const fetchUsers = useCallback(async (reset = false) => {
        if (!id || !type) return;
        try {
            if (reset) {
                setLoading(true);
                setPage(1);
            } else {
                setLoadingMore(true);
            }

            const p = reset ? 1 : page;
            const res = type === "followers"
                ? await getFollowers(Number(id), p, 20)
                : await getFollowing(Number(id), p, 20);

            let newItems = res.items || [];

            if (reset) {
                setUsers(newItems);
            } else {
                setUsers(prev => [...prev, ...newItems]);
            }
            setHasMore(newItems.length === 20);
        } catch (e) {
            handleApiError(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [id, type, page]);

    useEffect(() => {
        fetchUsers(true);
    }, [id, type]); // Only run when params change

    const handleRefresh = () => {
        lightImpact();
        setRefreshing(true);
        fetchUsers(true);
    };

    const loadMore = () => {
        if (!loading && !loadingMore && hasMore) {
            setPage(p => p + 1);
        }
    };

    useEffect(() => {
        if (page > 1) {
            fetchUsers();
        }
    }, [page, fetchUsers]);

    const handleToggleFollow = async (userId: number, currentIndex: number) => {
        lightImpact();
        // Optimistic update
        setUsers(prev => {
            const next = [...prev];
            next[currentIndex].is_following = !next[currentIndex].is_following;
            return next;
        });

        try {
            const res = await toggleFollow(userId);
            setUsers(prev => {
                const next = [...prev];
                next[currentIndex].is_following = res.following;
                return next;
            });
        } catch (e) {
            // Revert on error
            setUsers(prev => {
                const next = [...prev];
                next[currentIndex].is_following = !next[currentIndex].is_following;
                return next;
            });
            handleApiError(e);
        }
    };

    const renderItem = ({ item, index }: { item: UserProfile; index: number }) => {
        const isSelf = authUser?.id === item.id;
        const displayName = item.first_name || item.username || t("network.user_fallback");

        return (
            <TouchableOpacity
                style={styles.userRow}
                onPress={() => {
                    lightImpact();
                    if (isSelf) {
                        router.push("/(tabs)/profile" as any);
                    } else {
                        router.push(`/user/${item.id}` as any);
                    }
                }}
            >
                <View style={[styles.avatarRing, { borderColor: colors.surface.border }]}>
                    <Avatar
                        source={item.avatar_url ? { uri: item.avatar_url } : undefined}
                        name={displayName}
                        size={56}
                    />
                </View>

                <View style={styles.userInfo}>
                    <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
                        {item.username || `${t("network.user_fallback")} ${item.id}`}
                    </Text>
                    {item.first_name && (
                        <Text style={[styles.subtitle, { color: colors.text.secondary }]} numberOfLines={1}>
                            {item.first_name} {item.last_name || ""}
                        </Text>
                    )}
                </View>

                {!isSelf && (
                    <TouchableOpacity
                        style={[
                            styles.followBtn,
                            item.is_following
                                ? { backgroundColor: colors.surface.elevated, borderWidth: 1, borderColor: colors.surface.border }
                                : { backgroundColor: colors.text.primary, borderWidth: 1, borderColor: colors.text.primary }
                        ]}
                        onPress={() => handleToggleFollow(item.id, index)}
                        activeOpacity={0.8}
                    >
                        <Text
                            style={[
                                styles.followBtnText,
                                { color: item.is_following ? colors.text.primary : colors.background.primary }
                            ]}
                        >
                            {item.is_following ? t("network.following_btn") : t("network.follow")}
                        </Text>
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <Screen scrollable={false} style={{ paddingHorizontal: 0 }}>
            {/* Modern Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                    hitSlop={12}
                    style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
                >
                    <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
                </TouchableOpacity>

                <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
                    {type === "followers" ? t("network.followers") : t("network.following")}
                </Text>

                <View style={styles.headerBtn} />
            </View>

            <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
                {loading && page === 1 ? (
                    <LoadingState message={t("network.loading")} />
                ) : (
                    <FlatList
                        data={users}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderItem}
                        contentContainerStyle={users.length === 0 ? styles.empty : styles.list}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.5}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <EmptyState
                                icon="person.2"
                                title={type === "followers" ? t("network.empty_followers") : t("network.empty_following")}
                                description={type === "followers" ? t("network.empty_followers_desc") : t("network.empty_following_desc")}
                            />
                        }
                    />
                )}
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        letterSpacing: -0.5,
    },
    container: {
        flex: 1,
    },
    list: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    empty: {
        flex: 1,
        justifyContent: "center",
    },
    userRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    avatarRing: {
        padding: 2,
        borderRadius: 40,
        borderWidth: 1.5,
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
        marginRight: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: -0.2,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
        fontWeight: "400",
    },
    followBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 110,
    },
    followBtnText: {
        fontSize: 14,
        fontWeight: "600",
    },
});
