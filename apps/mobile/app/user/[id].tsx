/**
 * Kullanıcı profil ekranı (başka kullanıcı)
 * Takip et/etme butonu, followers/following sayıları.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "@/components/layout";
import { Avatar , LoadingState, ErrorState } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/hooks/useTheme";
import { createTextStyle, spacing } from "@/constants/design";
import { ProfileGrid } from "@/components/profile/ProfileGrid";
import { Section } from "@/components/layout/Section";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { getUserProfile, getUserPosts, getUserStats, toggleFollow, type UserProfile } from "@/src/services/userService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const currentUser = useAuthStore((s) => s.user);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [posts, setPosts] = useState<{ id: number; place_id?: number; thumbnail?: string; media_type?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const userId = id ? parseInt(id, 10) : NaN;
  const isOwnProfile = currentUser && currentUser.id === userId;

  const load = useCallback(async (refresh = false) => {
    if (isNaN(userId)) return;
    try {
      if (!refresh) setLoading(true);
      const [p, statsRes, postsRes] = await Promise.all([
        getUserProfile(userId),
        getUserStats(userId),
        getUserPosts(userId, 1, 30),
      ]);
      setProfile(p);
      setPostCount(statsRes.post_count);
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    load(true);
  }, [load]);

  const handleFollow = useCallback(async () => {
    if (!profile || followLoading || !currentUser) return;
    lightImpact();
    setFollowLoading(true);
    const prev = profile.is_following;
    setProfile((p) => (p ? { ...p, is_following: !p.is_following, followers_count: p.followers_count + (prev ? -1 : 1) } : p));
    try {
      const res = await toggleFollow(profile.id);
      setProfile((p) => (p ? { ...p, is_following: res.following } : p));
    } catch (e) {
      setProfile((p) => (p ? { ...p, is_following: prev } : p));
      handleApiError(e);
    } finally {
      setFollowLoading(false);
    }
  }, [profile, followLoading, currentUser]);

  const displayName = profile?.first_name || profile?.username || profile?.email || "Kullanıcı";
  const titleStyle = createTextStyle("heading", colors.text.primary);

  if (loading && !profile) {
    return (
      <Screen withTabBar>
        <LoadingState message="Profil yükleniyor..." />
      </Screen>
    );
  }

  if (!profile || isNaN(userId)) {
    return (
      <Screen withTabBar>
        <ErrorState
          title="Profil bulunamadı"
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen scrollable withTabBar>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              router.back();
            }}
            style={[styles.backBtn, { backgroundColor: colors.surface.elevated }]}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <Avatar
            source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
            name={displayName}
            size={88}
          />
          <Text style={[titleStyle, styles.name]}>{displayName}</Text>
          {profile.username && (
            <Text style={[styles.username, { color: colors.text.secondary }]}>@{profile.username}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{postCount}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Post</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.followers_count}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Takipçi</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.following_count}</Text>
              <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Takip</Text>
            </View>
          </View>

          {!isOwnProfile && currentUser && (
            <Button
              variant={profile.is_following ? "secondary" : "primary"}
              size="medium"
              onPress={handleFollow}
              style={styles.followBtn}
              disabled={followLoading}
            >
              {profile.is_following ? "Takipten Çık" : "Takip Et"}
            </Button>
          )}
        </View>

        {posts.length > 0 && (
          <Section title="Gönderiler" style={styles.section}>
            <ProfileGrid
              items={posts}
              onItemPress={(item) => {
                if (item.place_id) router.push(`/place/${item.place_id}` as any);
              }}
            />
          </Section>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xl * 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
    marginHorizontal: spacing.sm,
  },
  card: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  name: { marginTop: spacing.md, fontSize: 22 },
  username: { fontSize: 14, marginTop: 4 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingTop: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { width: 1, height: 32 },
  statNumber: { fontSize: 18, fontWeight: "700", marginBottom: 2 },
  statLabel: { fontSize: 12, fontWeight: "500" },
  followBtn: { marginTop: spacing.lg, minWidth: 160 },
  section: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
});
