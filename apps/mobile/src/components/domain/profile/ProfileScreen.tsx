/**
 * Profile Screen
 *
 * User profile, settings, and preferences screen.
 * Professional design with comprehensive settings.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Screen, type ScreenRef } from "@/src/components/layout/Screen";
import { Section } from "@/src/components/layout/Section";
import { Avatar, SettingsRow } from "@/src/components/ui";
import { Button } from "@/src/components/ui/Button";
import { ProfileGrid } from "@/src/components/domain/profile/ProfileGrid";
import { useTheme } from "@/src/hooks/useTheme";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { getUserProfile, getUserStats, getUserPosts, type UserProfile, type UserStats } from "@/src/services/userService";
import { handleApiError } from "@/src/utils/errorHandler";

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const screenRef = useRef<ScreenRef>(null);
  const authUser = useAuthStore((s) => s.user);
  const savedIds = useAppStore((s) => s.savedIds);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<{ id: number; place_id?: number; thumbnail?: string; media_type?: string }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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
      screenRef.current?.scrollToTop();
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
      <Screen ref={screenRef} withTabBar>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profil</Text>
        </View>
        <View style={[styles.profileCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <Text style={[styles.profileEmail, { color: colors.text.secondary, marginBottom: spacing.lg }]}>
            Görüntülemek için giriş yapın
          </Text>
          <Button variant="primary" onPress={() => router.push("/login" as any)}>
            Giriş Yap
          </Button>
        </View>
      </Screen>
    );
  }

  return (
    <Screen ref={screenRef} withTabBar onRefresh={handleRefresh} refreshing={refreshing}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Profil</Text>
      </View>

      {/* Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
        <Avatar source={user?.avatar ? { uri: user.avatar } : undefined} name={user?.name ?? "Kullanıcı"} size={72} />
        <Text style={[styles.profileName, { color: colors.text.primary }]}>{user?.name}</Text>
        <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>{user?.email}</Text>

        <View style={[styles.statsRow, { borderTopColor: colors.surface.border }]}>
          <TouchableOpacity style={styles.statItem} onPress={() => router.push("/(tabs)/saved")} activeOpacity={0.7}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.savedPlaces}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Kayıtlı</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.posts}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Post</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.followers}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Takipçi</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{displayStats.following}</Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Takip</Text>
          </View>
        </View>

        <Button
          variant="secondary"
          size="medium"
          onPress={() => {
            lightImpact();
            router.push("/edit-profile" as any);
          }}
          style={styles.editBtn}
        >
          Profili Düzenle
        </Button>
      </View>

      {stats && (stats.favorite_category || stats.favorite_region || stats.visits_this_month > 0) && (
        <Section title="İstatistikler" style={styles.section}>
          <View style={[styles.statsBox, { backgroundColor: colors.surface.elevated }]}>
            {stats.favorite_category && (
              <Text style={[styles.statText, { color: colors.text.secondary }]}>En çok: {stats.favorite_category}</Text>
            )}
            {stats.favorite_region && (
              <Text style={[styles.statText, { color: colors.text.secondary }]}>Favori bölge: {stats.favorite_region}</Text>
            )}
            {stats.visits_this_month > 0 && (
              <Text style={[styles.statText, { color: colors.text.secondary }]}>
                Bu ay: {stats.visits_this_month} ziyaret
              </Text>
            )}
          </View>
        </Section>
      )}

      {posts.length > 0 && (
        <Section title="Gönderilerim" style={styles.section}>
          <ProfileGrid
            items={posts}
            onItemPress={(item) => {
              if (item.place_id) router.push(`/place/${item.place_id}` as any);
            }}
          />
        </Section>
      )}

      {/* Ayarlar */}
      <Section title="Ayarlar" style={styles.section}>
        <SettingsRow
          label="Ayarlar ve hareketler"
          onPress={() => {
            lightImpact();
            router.push("/settings" as any);
          }}
          showArrow
          icon="gear"
        />
      </Section>

      {/* Sign Out Button */}
      <View style={styles.signOutContainer}>
        <Button variant="secondary" size="large" onPress={handleSignOut} style={styles.signOutButton}>
          Çıkış Yap
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "700",
    textAlign: "center",
  },
  profileCard: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  editBtn: {
    marginTop: spacing.lg,
  },
  statsBox: {
    padding: spacing.md,
    borderRadius: 12,
    gap: 4,
  },
  statText: {
    fontSize: 14,
  },
  section: {
    marginBottom: spacing.base,
  },
  signOutContainer: {
    marginTop: spacing.base,
    marginBottom: spacing.base,
  },
  signOutButton: {
    // Button styles applied via component
  },
});
