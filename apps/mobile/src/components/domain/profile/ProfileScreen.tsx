import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, useWindowDimensions, ScrollView, RefreshControl, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useNavigation, useFocusEffect } from "expo-router";
import { API_BASE_URL } from "@/src/constants/api";
import { Screen } from "@/src/components/layout/Screen";
import { Avatar, LoadingState } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { getUserProfile, getUserStats, getUserPosts, type UserProfile, type UserStats } from "@/src/services/userService";
import { handleApiError } from "@/src/utils/errorHandler";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

const GRID_GAP = 14;
const GRID_COLS = 2;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);
  const savedIds = useAppStore((s) => s.savedIds);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<{ id: number; place_id?: number; thumbnail?: string; media_type?: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");
  const deletedPostIds = useAppStore((s) => s.deletedPostIds);
  const visiblePosts = React.useMemo(() => posts.filter((p) => !deletedPostIds.includes(p.id)), [posts, deletedPostIds]);

  const [initialLoading, setInitialLoading] = useState(true);

  const { width: screenWidth } = useWindowDimensions();
  const cellSize = (screenWidth - 32 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

  const loadProfile = useCallback(async () => {
    if (!authUser) return;
    try {
      const [p, s, postsRes] = await Promise.all([
        getUserProfile(authUser.id),
        getUserStats(authUser.id),
        getUserPosts(authUser.id, 1, 30),
      ]);
      setProfile(p);
      setStats(s);
      setPosts(
        postsRes.items.map((post) => {
          const sortedMedia = [...(post.media || [])].sort(
            (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
          );
          const firstMedia = sortedMedia[0];
          return {
            id: post.id,
            place_id: post.place_id,
            thumbnail: firstMedia?.thumbnail_url || firstMedia?.media_url,
            media_type: firstMedia?.media_type,
          };
        })
      );
    } catch (e) {
      handleApiError(e);
    } finally {
      setInitialLoading(false);
    }
  }, [authUser?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress" as any, (e: any) => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  }, [loadProfile]);

  const displayStats = {
    followers: profile?.followers_count ?? 0,
    following: profile?.following_count ?? 0,
    posts: stats?.post_count ?? 0,
  };

  if (!authUser || initialLoading) {
    return (
      <Screen withTabBar>
        <LoadingState message={t('profile.loading')} />
      </Screen>
    );
  }

  const fullName = [profile?.first_name || authUser.first_name, profile?.last_name || (authUser as any).last_name].filter(Boolean).join(" ");
  const displayName = fullName || authUser.username || authUser.email || t('profile.user');
  const username = authUser.username || authUser.email || "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* ── Moden Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        {/* Ortadaki Username (Absolute) */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10, zIndex: 0 }]}>
          <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: "600" }}>{username}</Text>
        </View>

        <Text style={[styles.headerTitle, { color: colors.text.primary, zIndex: 1 }]}>{t('profile.title', 'Profil')}</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
            activeOpacity={0.7}
            onPress={() => { lightImpact(); router.push("/search-users" as any); }}
          >
            <IconSymbol name="magnifyingglass" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
            activeOpacity={0.7}
            onPress={() => router.push("/settings" as any)}
          >
            <IconSymbol name="line.3.horizontal" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
        }
      >
        {/* ── Hero Section (Avatar, Name, Bio) ── */}
        <View style={styles.heroSection}>
          <View style={[styles.avatarRing, { borderColor: colors.surface.border }]}>
            <Avatar
              source={authUser.avatar_url ? { uri: authUser.avatar_url } : undefined}
              name={displayName}
              size={86}
            />
          </View>

          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.text.primary }]}>{displayName}</Text>
            {profile?.bio ? (
              <Text style={[styles.bioText, { color: colors.text.secondary }]}>{profile.bio}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Premium Action Buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.accent.primary }]}
            onPress={() => { lightImpact(); router.push("/edit-profile" as any); }}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryBtnText}>{t('profile.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryBtn, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
            onPress={async () => {
              lightImpact();
              try {
                await Share.share({
                  message: t('profile.share_text', { username }),
                });
              } catch (e) {
                console.error(e);
              }
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name="square.and.arrow.up" size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Stats Card ── */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface.elevated, shadowColor: colors.text.primary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.posts}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{t('profile.posts')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => {
              lightImpact();
              router.push(`/network?id=${authUser.id}&type=followers` as any);
            }}
          >
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.followers}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{t('profile.followers')}</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => {
              lightImpact();
              router.push(`/network?id=${authUser.id}&type=following` as any);
            }}
          >
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.following}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{t('profile.following')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Modern Tabs ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "posts"
                ? { backgroundColor: colors.text.primary, borderColor: colors.text.primary }
                : { backgroundColor: "transparent", borderColor: colors.surface.border }
            ]}
            onPress={() => setActiveTab("posts")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === "posts" ? colors.background.primary : colors.text.secondary }]}>
              {t('profile.tab_posts')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "tagged"
                ? { backgroundColor: colors.text.primary, borderColor: colors.text.primary }
                : { backgroundColor: "transparent", borderColor: colors.surface.border }
            ]}
            onPress={() => setActiveTab("tagged")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === "tagged" ? colors.background.primary : colors.text.secondary }]}>
              {t('profile.tab_tagged')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Content Grid ── */}
        {activeTab === "posts" && (
          visiblePosts.length > 0 ? (
            <View style={styles.grid}>
              {visiblePosts.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridCell,
                    {
                      width: cellSize,
                      height: cellSize * 1.25, // Give it a slight portrait ratio for better aesthetics
                      marginRight: (idx + 1) % GRID_COLS !== 0 ? GRID_GAP : 0,
                      marginBottom: GRID_GAP,
                      backgroundColor: colors.surface.elevated
                    },
                  ]}
                  onPress={() => {
                    lightImpact();
                    router.push(`/p/post/${item.id}` as any);
                  }}
                  activeOpacity={0.9}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail.startsWith('/') ? `${API_BASE_URL}${item.thumbnail}` : item.thumbnail }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.gridPlaceholder}>
                      <IconSymbol
                        name={item.media_type === "video" ? "play.fill" : "photo.fill"}
                        size={28}
                        color={colors.text.tertiary}
                      />
                    </View>
                  )}
                  {item.media_type === "video" && item.thumbnail && (
                    <View style={styles.videoBadge}>
                      <IconSymbol name="play.fill" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.surface.elevated }]}>
                <IconSymbol name="camera.fill" size={32} color={colors.text.tertiary} />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t('profile.no_posts')}</Text>
                <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                  {t('profile.no_posts_desc')}
                </Text>
              </View>
            </View>
          )
        )}

        {activeTab === "tagged" && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="person.crop.square.fill" size={32} color={colors.text.tertiary} />
            </View>
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t('profile.no_tagged')}</Text>
              <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                {t('profile.no_tagged_desc')}
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    paddingBottom: 100,
  },
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  heroInfo: {
    flex: 1,
    alignItems: "flex-start",
    paddingLeft: 18,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
  },
  heroName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  usernamePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 8,
  },
  heroUsername: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  bioText: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "left",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 24,
    paddingVertical: 18,
    marginBottom: 26,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  statDivider: {
    width: 1,
    height: "100%",
    opacity: 0.5,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 28,
  },
  primaryBtn: {
    paddingHorizontal: 24,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    flex: 1,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
  },
  gridCell: {
    borderRadius: 20, // Modern large radius
    overflow: "hidden",
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
  },
});
