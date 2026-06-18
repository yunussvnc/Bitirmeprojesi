import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { Screen } from "@/src/components/layout/Screen";
import { Avatar, LoadingState, EmptyState } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/hooks/useTheme";
import { lightImpact } from "@/src/utils/haptics";
import {
  getFollowers,
  getFollowing,
  getFriends,
  toggleFollow,
  type UserSummary,
} from "@/src/services/userService";
import { handleApiError } from "@/src/utils/errorHandler";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { useTranslation } from "react-i18next";
import debounce from "lodash/debounce";

type TabKey = "followers" | "following" | "friends";

const TABS: { key: TabKey; label: string }[] = [
  { key: "following", label: "Takip" },
  { key: "followers", label: "Takipçiler" },
  { key: "friends", label: "Arkadaşlar" },
];

export default function NetworkScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string; type: TabKey }>();
  const authUser = useAuthStore((s) => s.user);

  const initialTab: TabKey =
    params.type === "following" || params.type === "friends" ? params.type : "followers";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [privacyBlocked, setPrivacyBlocked] = useState(false);

  // Tab indicator animation
  const tabIndicatorX = useRef(new Animated.Value(0)).current;

  const userId = Number(params.id);

  const blockedIds = useAppStore((s: any) => s.blockedUserIds || []);
  const visibleUsers = users.filter((u) => !blockedIds.includes(u.id));

  const fetchUsers = useCallback(
    async (tab: TabKey, reset = false) => {
      if (!userId) return;
      try {
        if (reset) {
          setLoading(true);
          setPage(1);
          setPrivacyBlocked(false);
        } else {
          setLoadingMore(true);
        }
        const p = reset ? 1 : page;
        let res;
        if (tab === "followers") res = await getFollowers(userId, p, 20);
        else if (tab === "following") res = await getFollowing(userId, p, 20);
        else res = await getFriends(userId, p, 20);

        const newItems = res.items || [];
        if (reset) setUsers(newItems);
        else setUsers((prev) => [...prev, ...newItems]);
        setHasMore(newItems.length === 20);
      } catch (e: unknown) {
        // 403 → gizli hesap
        const status = (e as { status?: number; code?: string })?.status;
        if (status === 403) {
          setPrivacyBlocked(true);
          setUsers([]);
        } else {
          handleApiError(e);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [userId, page]
  );

  useFocusEffect(
    useCallback(() => {
      fetchUsers(activeTab, true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, userId])
  );

  const switchTab = (tab: TabKey, index: number) => {
    lightImpact();
    setActiveTab(tab);
    Animated.spring(tabIndicatorX, {
      toValue: index,
      useNativeDriver: false,
      friction: 10,
      tension: 80,
    }).start();
  };

  const handleRefresh = () => {
    lightImpact();
    setRefreshing(true);
    fetchUsers(activeTab, true);
  };

  const loadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (page > 1) {
      fetchUsers(activeTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Optimistic follow toggle with debounce
  const handleToggleFollow = useCallback(
    debounce(
      async (targetId: number, index: number) => {
        lightImpact();
        
        // cur referansını dışarı alalım
        const currentUsers = users;
        const curUser = currentUsers[index];
        if (!curUser) return;
        
        // Optimistic update
        setUsers((prev) => {
          const next = [...prev];
          const cur = next[index];
          if (!cur) return prev;
          const willFollow = !cur.is_following && cur.follow_status !== "pending";
          next[index] = {
            ...cur,
            is_following: willFollow && !cur.is_private,
            follow_status: willFollow
              ? cur.is_private
                ? "pending"
                : "accepted"
              : null,
          };
          return next;
        });

        try {
          let res;
          if ((curUser as any).item_type === "place") {
            const { togglePlaceFollow } = require("@/src/services/mekanService");
            res = await togglePlaceFollow(targetId);
            res = { status: res.following ? "accepted" : null };
          } else {
            res = await toggleFollow(targetId);
          }

          setUsers((prev) => {
            const next = [...prev];
            if (!next[index]) return prev;
            next[index] = {
              ...next[index],
              is_following: res.status === "accepted",
              follow_status: res.status as "pending" | "accepted" | null,
            };
            return next;
          });
        } catch (e) {
          // Revert
          setUsers((prev) => {
            const next = [...prev];
            const cur = next[index];
            if (!cur) return prev;
            next[index] = {
              ...cur,
              is_following: !cur.is_following,
              follow_status: cur.is_following ? null : "accepted",
            };
            return next;
          });
          handleApiError(e);
        }
      },
      500,
      { leading: true, trailing: false }
    ),
    []
  );

  const renderFollowBtn = (item: UserSummary, index: number) => {
    const isSelf = authUser?.id === item.id;
    if (isSelf) return null;

    const isPending = item.follow_status === "pending";
    const isFollowing = item.is_following;

    let label: string;
    let btnStyle: object;
    let textStyle: object;

    if (isFollowing) {
      label = "Takipte";
      btnStyle = {
        backgroundColor: colors.surface.elevated,
        borderWidth: 1,
        borderColor: colors.surface.border,
      };
      textStyle = { color: colors.text.primary };
    } else if (isPending) {
      label = "İstek Gönderildi";
      btnStyle = {
        backgroundColor: colors.surface.elevated,
        borderWidth: 1,
        borderColor: colors.surface.border,
      };
      textStyle = { color: colors.text.secondary };
    } else {
      label = "Takip Et";
      btnStyle = { backgroundColor: colors.accent.primary };
      textStyle = { color: "#fff" };
    }

    return (
      <TouchableOpacity
        style={[styles.followBtn, btnStyle]}
        onPress={() => handleToggleFollow(item.id, index)}
        activeOpacity={0.8}
      >
        <Text style={[styles.followBtnText, textStyle]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }: { item: UserSummary & { item_type?: string }; index: number }) => {
    const isSelf = authUser?.id === item.id && item.item_type !== "place";
    const displayName =
      item.first_name ||
      item.username ||
      (item.item_type === "place" ? `Mekan ${item.id}` : `Kullanıcı ${item.id}`);

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.75}
        onPress={() => {
          lightImpact();
          if (item.item_type === "place") {
            router.push(`/place/${item.id}` as never);
          } else if (isSelf) {
            router.push("/(tabs)/profile" as never);
          } else {
            router.push(`/user/${item.id}` as never);
          }
        }}
      >
        <View
          style={[
            styles.avatarRing,
            {
              borderColor: item.is_private
                ? colors.text.tertiary
                : colors.surface.border,
            },
          ]}
        >
          <Avatar
            source={item.avatar_url ? { uri: item.avatar_url } : undefined}
            name={displayName}
            size={52}
          />
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.title, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {item.username || displayName}
            </Text>
            {item.is_private && (
              <IconSymbol
                name="lock.fill"
                size={12}
                color={colors.text.tertiary}
                style={{ marginLeft: 4, marginTop: 2 }}
              />
            )}
          </View>
          {item.first_name && (
            <Text
              style={[styles.subtitle, { color: colors.text.secondary }]}
              numberOfLines={1}
            >
              {item.first_name} {item.last_name || ""}
            </Text>
          )}
        </View>

        {renderFollowBtn(item, index)}
      </TouchableOpacity>
    );
  };

  const renderPrivacyBlocked = () => (
    <View style={styles.privacyWrap}>
      <View style={[styles.privacyIcon, { backgroundColor: colors.surface.elevated }]}>
        <IconSymbol name="lock.fill" size={36} color={colors.text.tertiary} />
      </View>
      <Text style={[styles.privacyTitle, { color: colors.text.primary }]}>
        Bu hesap gizlidir
      </Text>
      <Text style={[styles.privacyDesc, { color: colors.text.secondary }]}>
        Bu kullanıcının takipçi listesini görmek için takip etmeniz gerekiyor.
      </Text>
    </View>
  );

  const tabIndicatorWidth = `${100 / TABS.length}%`;

  return (
    <Screen 
      scrollable={false} 
      contentContainerStyle={{ paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 8 : 16 }]}>
        <TouchableOpacity
          onPress={() => { lightImpact(); router.back(); }}
          hitSlop={12}
          style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          {TABS.find((t) => t.key === activeTab)?.label ?? ""}
        </Text>
        <View style={styles.headerBtn} />
      </View>

      {/* Tab bar */}
      <View style={[styles.tabBar, { borderBottomColor: colors.surface.border }]}>
        {TABS.map((tab, i) => {
          const isActive = tab.key === activeTab;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tabItem}
              onPress={() => switchTab(tab.key, i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? colors.accent.primary : colors.text.tertiary,
                    fontWeight: isActive ? "700" : "500",
                  },
                ]}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View
                  style={[styles.tabUnderline, { backgroundColor: colors.accent.primary }]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {loading && page === 1 ? (
          <LoadingState message="Yükleniyor..." />
        ) : privacyBlocked ? (
          renderPrivacyBlocked()
        ) : (
          <FlatList
            data={visibleUsers}
            keyExtractor={(item) => `${(item as any).item_type || "user"}-${item.id}`}
            renderItem={renderItem as any}
            contentContainerStyle={visibleUsers.length === 0 ? styles.empty : styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent.primary}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              loadingMore ? (
                <View style={{ paddingVertical: 20, alignItems: "center" }}>
                  <LoadingState message="" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                icon={
                  activeTab === "friends"
                    ? "person.2.fill"
                    : activeTab === "followers"
                    ? "person.crop.circle"
                    : "person.badge.plus"
                }
                title={
                  activeTab === "friends"
                    ? "Henüz arkadaşın yok"
                    : activeTab === "followers"
                    ? "Henüz takipçin yok"
                    : "Henüz kimseyi takip etmiyorsun"
                }
                description={
                  activeTab === "friends"
                    ? "Karşılıklı takipleştiğin kişiler burada görünür."
                    : activeTab === "followers"
                    ? "Seni takip eden kişiler burada görünecek."
                    : "Takip ettiğin kişiler burada görünecek."
                }
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
    paddingBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
    paddingTop: 4,
    position: "relative",
  },
  tabLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 2.5,
    borderRadius: 2,
  },
  container: { flex: 1 },
  list: { paddingVertical: 6, paddingHorizontal: 20 },
  empty: { flex: 1, justifyContent: "center" },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 40,
    borderWidth: 1.5,
  },
  userInfo: { flex: 1, marginLeft: 12, marginRight: 8 },
  nameRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 15, fontWeight: "700", letterSpacing: -0.2, flexShrink: 1 },
  subtitle: { fontSize: 13, marginTop: 2 },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  followBtnText: { fontSize: 13, fontWeight: "600" },
  privacyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  privacyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  privacyTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  privacyDesc: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
