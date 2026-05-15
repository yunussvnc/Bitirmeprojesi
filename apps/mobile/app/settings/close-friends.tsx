/**
 * Yakın Arkadaşlar — Takipçi listesinden seçerek yakın arkadaş listesini yönet
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { apiGet } from "@/src/utils/apiClient";
import { useTranslation } from "react-i18next";

type FollowUser = {
  id: number;
  username?: string;
  first_name?: string;
  avatar_url?: string;
};

export default function CloseFriendsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const closeFriendIds = useSettingsStore((s) => s.closeFriendIds);
  const toggleCloseFriend = useSettingsStore((s) => s.toggleCloseFriend);

  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadFollowers = useCallback(async () => {
    try {
      const data = await apiGet<{ items: FollowUser[] }>("/users/me/following?page=1&page_size=200");
      setFollowers(data.items || []);
    } catch {
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFollowers(); }, [loadFollowers]);

  const filtered = search.trim()
    ? followers.filter(u =>
        (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.first_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : followers;

  const renderUser = ({ item }: { item: FollowUser }) => {
    const isClose = closeFriendIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.row, { borderBottomColor: colors.surface.border }]}
        onPress={() => { lightImpact(); toggleCloseFriend(item.id); success(); }}
        activeOpacity={0.6}
      >
        <Image
          source={item.avatar_url ? { uri: item.avatar_url } : require("@/assets/images/icon.png")}
          style={styles.avatar}
        />
        <View style={styles.rowInfo}>
          <Text style={[styles.username, { color: colors.text.primary }]}>
            {item.username || item.first_name || `${t("settings_close_friends.user", "Kullanıcı")} #${item.id}`}
          </Text>
          {item.first_name && item.username && (
            <Text style={[styles.fullName, { color: colors.text.tertiary }]}>{item.first_name}</Text>
          )}
        </View>
        <View style={[
          styles.starBtn,
          isClose && { backgroundColor: "#4ECE8D" },
          !isClose && { borderColor: colors.surface.border, borderWidth: 1.5 },
        ]}>
          <IconSymbol
            name={isClose ? "star.fill" : "star"}
            size={16}
            color={isClose ? "#fff" : colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.headerTitle]}>{t("settings_close_friends.title", "Yakın Arkadaşlar")}</Text>
        <View style={styles.backBtn}>
          <Text style={[styles.countBadge, { color: colors.accent.primary }]}>{closeFriendIds.length}</Text>
        </View>
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: isDark ? "rgba(78,206,141,0.08)" : "rgba(78,206,141,0.06)" }]}>
        <View style={[styles.starIndicator, { backgroundColor: "#4ECE8D" }]}>
          <IconSymbol name="star.fill" size={14} color="#fff" />
        </View>
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          {t("settings_close_friends.info", "Yakın arkadaşlarına özel hikaye paylaşabilirsin. Listeye eklediğin kişiler bilgilendirilmez.")}
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.text.tertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder={t("settings_close_friends.search", "Ara...")}
          placeholderTextColor={colors.text.tertiary}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="person.2" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            {search ? t("settings_close_friends.empty", "Sonuç bulunamadı") : t("settings_close_friends.no_following", "Henüz birini takip etmiyorsunuz")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderUser}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  countBadge: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  infoBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 16,
    marginTop: 12, padding: 12, borderRadius: 10, gap: 10,
  },
  starIndicator: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 16,
    marginTop: 12, marginBottom: 8, paddingHorizontal: 12,
    height: 40, borderRadius: 10, borderWidth: 1,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12, backgroundColor: "#333" },
  rowInfo: { flex: 1 },
  username: { fontSize: 15, fontWeight: "600" },
  fullName: { fontSize: 13, marginTop: 2 },
  starBtn: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
  },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "500" },
});
