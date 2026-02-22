/**
 * Profile Screen
 *
 * User profile, settings, and preferences screen.
 * Professional design with comprehensive settings.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, useWindowDimensions, ScrollView, RefreshControl } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Screen } from "@/src/components/layout/Screen";
import { Section } from "@/src/components/layout/Section";
import { Avatar, LoadingState, SettingsRow, ErrorState } from "@/src/components/ui";
import { Button } from "@/src/components/ui/Button";
import { useTheme } from "@/src/hooks/useTheme";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { getUserProfile, getUserStats, getUserPosts, type UserProfile, type UserStats } from "@/src/services/userService";
import { handleApiError } from "@/src/utils/errorHandler";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Image } from "expo-image";
import { CreateBottomSheet } from "./components/CreateBottomSheet";

const GRID_GAP = 2;
const GRID_COLS = 3;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);
  const authUser = useAuthStore((s) => s.user);
  const savedIds = useAppStore((s) => s.savedIds);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<{ id: number; place_id?: number; thumbnail?: string; media_type?: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");
  const { width: screenWidth } = useWindowDimensions();
  const cellSize = (screenWidth - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

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
        postsRes.items.map((post) => ({
          id: post.id,
          place_id: post.place_id,
          thumbnail: post.media?.[0]?.thumbnail_url || post.media?.[0]?.media_url,
          media_type: post.media?.[0]?.media_type,
        }))
      );
    } catch (e) {
      handleApiError(e);
    }
    // authUser?.id is intentional; full authUser would cause unnecessary reloads
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress" as any, (e: any) => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    loadProfile().finally(() => setRefreshing(false));
  }, [loadProfile]);

  const user = authUser
    ? {
      name: authUser.first_name || authUser.username || authUser.email,
      email: authUser.email,
      avatar: authUser.avatar_url,
    }
    : null;

  const displayStats = {
    savedPlaces: savedIds.length,
    followers: profile?.followers_count ?? 0,
    following: profile?.following_count ?? 0,
    posts: stats?.post_count ?? 0,
  };

  const handleSignOut = () => {
    lightImpact();
    Alert.alert("Çıkış Yap", "Çıkış yapmak istediğinize emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Çıkış Yap",
        style: "destructive",
        onPress: async () => {
          useAuthStore.getState().logout();
          router.replace("/login");
        },
      },
    ]);
  };

  if (!authUser) {
    return (
      <Screen withTabBar>
        <LoadingState message="Profil yükleniyor..." />
      </Screen>
    );
  }

  const displayName = authUser.first_name || authUser.username || authUser.email || "Kullanıcı";
  const username = authUser.username || authUser.email || "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { borderBottomColor: colors.surface.border }]}>
        <TouchableOpacity
          style={styles.headerBtnLeft}
          hitSlop={8}
          activeOpacity={0.7}
          onPress={() => { lightImpact(); setCreateSheetVisible(true); }}
        >
          <IconSymbol name="plus" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerCenter} activeOpacity={0.7} onPress={() => { lightImpact(); }}>
          <IconSymbol name="lock" size={14} color={colors.text.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.headerUsername, { color: colors.text.primary }]} numberOfLines={1}>
            {username}
          </Text>
          <IconSymbol name="chevron.down" size={14} color={colors.text.primary} style={{ marginLeft: 6 }} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            hitSlop={8}
            activeOpacity={0.7}
            onPress={() => router.push("/settings" as any)}
          >
            <IconSymbol name="line.3.horizontal" size={26} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* ── Profile Info Row (Avatar + Stats) ── */}
        <View style={styles.profileRow}>
          <Avatar
            source={authUser.avatar_url ? { uri: authUser.avatar_url } : undefined}
            name={displayName}
            size={86}
          />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {displayStats.posts}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.primary }]}>
                gönderi
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {displayStats.followers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.primary }]}>
                takipçi
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>
                {displayStats.following}
              </Text>
              <Text style={[styles.statLabel, { color: colors.text.primary }]}>
                arkadaş
              </Text>
            </View>
          </View>
        </View>

        {/* ── Name & Bio ── */}
        <View style={styles.bioSection}>
          <Text style={[styles.displayName, { color: colors.text.primary }]}>
            {displayName}
          </Text>
          {profile?.bio ? (
            <Text style={[styles.bioText, { color: colors.text.primary }]}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        {/* ── Action Buttons ── */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              lightImpact();
              router.push("/edit-profile" as any);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: colors.text.primary }]}>
              Profili Düzenle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              lightImpact();
              // Profil paylaşım action
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: colors.text.primary }]}>
              Profili Paylaş
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionIconBtn,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => {
              lightImpact();
            }}
            activeOpacity={0.8}
          >
            <IconSymbol name="person.badge.plus" size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Story Highlights (Öne Çıkanlar) ── */}
        <View style={styles.highlightsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.highlightsScroll}>
            <TouchableOpacity style={styles.highlightItem} activeOpacity={0.7} onPress={() => lightImpact()}>
              <View style={[styles.highlightCirclePlaceholder, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]} />
              <Text style={[styles.highlightText, { color: colors.text.primary }]} numberOfLines={1}>Gezi</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightItem} activeOpacity={0.7} onPress={() => lightImpact()}>
              <View style={[styles.highlightCirclePlaceholder, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]} />
              <Text style={[styles.highlightText, { color: colors.text.primary }]} numberOfLines={1}>Yemek</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightItem} activeOpacity={0.7} onPress={() => lightImpact()}>
              <View style={[styles.highlightCirclePlaceholder, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]} />
              <Text style={[styles.highlightText, { color: colors.text.primary }]} numberOfLines={1}>Anılar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.highlightItem} activeOpacity={0.7} onPress={() => { lightImpact(); router.push("/profile/create-highlight" as any); }}>
              <View style={[styles.highlightCircle, { borderColor: colors.surface.border }]}>
                <IconSymbol name="plus" size={24} color={colors.text.primary} />
              </View>
              <Text style={[styles.highlightText, { color: colors.text.primary }]} numberOfLines={1}>Yeni</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── Grid Tab Bar ── */}
        <View style={[styles.gridTabBar, { borderBottomColor: colors.surface.border }]}>
          <TouchableOpacity
            style={[
              styles.gridTab,
              activeTab !== "posts" && { opacity: 0.4 }
            ]}
            onPress={() => setActiveTab("posts")}
            activeOpacity={0.7}
          >
            <IconSymbol name="square.grid.3x3" size={22} color={colors.text.primary} />
            {activeTab === "posts" && (
              <View style={[styles.activeIndicator, { backgroundColor: colors.text.primary }]} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.gridTab,
              activeTab !== "tagged" && { opacity: 0.4 }
            ]}
            onPress={() => setActiveTab("tagged")}
            activeOpacity={0.7}
          >
            <IconSymbol name="person.crop.square" size={24} color={colors.text.primary} />
            {activeTab === "tagged" && (
              <View style={[styles.activeIndicator, { backgroundColor: colors.text.primary }]} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── Post Grid ── */}
        {
          activeTab === "posts" && (
            posts.length > 0 ? (
              <View style={styles.grid}>
                {posts.map((item, idx) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.gridCell,
                      {
                        width: cellSize,
                        height: cellSize,
                        marginRight: (idx + 1) % GRID_COLS !== 0 ? GRID_GAP : 0,
                        marginBottom: GRID_GAP,
                      },
                    ]}
                    onPress={() => {
                      lightImpact();
                      if (item.place_id) router.push(`/place/${item.place_id}` as any);
                    }}
                    activeOpacity={0.9}
                  >
                    {item.thumbnail ? (
                      <Image
                        source={{ uri: item.thumbnail }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.gridPlaceholder, { backgroundColor: colors.surface.elevated }]}>
                        <IconSymbol
                          name={item.media_type === "video" ? "play.fill" : "photo"}
                          size={24}
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
              <View style={styles.emptyGrid}>
                <IconSymbol name="camera" size={44} color={colors.text.tertiary} />
                <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                  Henüz gönderi yok
                </Text>
              </View>
            )
          )
        }

        {
          activeTab === "tagged" && (
            <View style={styles.emptyGrid}>
              <View style={styles.emptyGridIconContainer}>
                <IconSymbol name="person.crop.square" size={44} color={colors.text.primary} />
              </View>
              <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
                Etiketlendiğin veya bulunduğun gönderiler burada listelenir.
              </Text>
            </View>
          )
        }

        <View style={{ height: 120 }} />
      </ScrollView >

      <CreateBottomSheet visible={createSheetVisible} onClose={() => setCreateSheetVisible(false)} />
    </View >
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
    paddingTop: Platform.OS === "ios" ? 56 : 40,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtnLeft: {
    width: 36,
    height: 36,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerUsername: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  /* Profile Info Row */
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsRow: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginLeft: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "400",
    marginTop: 2,
  },
  /* Bio */
  bioSection: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 12,
  },
  displayName: {
    fontSize: 14,
    fontWeight: "600",
  },
  bioText: {
    fontSize: 14,
    fontWeight: "400",
    marginTop: 2,
    lineHeight: 19,
  },
  /* Action Buttons */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 6,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 36,
    borderRadius: 8,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  /* Story Highlights */
  highlightsContainer: {
    paddingBottom: 16,
  },
  highlightsScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  highlightItem: {
    alignItems: "center",
    width: 64,
  },
  highlightCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  highlightCirclePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    marginBottom: 6,
  },
  highlightText: {
    fontSize: 12,
    fontWeight: "400",
  },
  /* Grid Tab Bar */
  gridTabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  gridTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
  },
  activeIndicator: {
    position: "absolute",
    bottom: -StyleSheet.hairlineWidth,
    width: "40%",
    height: 1.5,
  },
  /* Grid */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    overflow: "hidden",
  },
  gridPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  /* Empty Grid */
  emptyGrid: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyGridIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: "rgba(100,100,100,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    paddingHorizontal: 40,
    lineHeight: 18,
  },
});
