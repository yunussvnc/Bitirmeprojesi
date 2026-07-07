import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getFollowers, getHiddenStoryUsers, updateHiddenStoryUsers, UserSummary } from "@/src/services/userService";
import { useTranslation } from "react-i18next";
import { debounce } from "lodash";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

export default function HideStoryScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);

  const [followers, setFollowers] = useState<UserSummary[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<number>>(new Set());
  const [originalHiddenIds, setOriginalHiddenIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    if (!authUser) return;
    try {
      // Fetch both simultaneously
      const [followersRes, hiddenRes] = await Promise.all([
        getFollowers(authUser.id, 1, 1000), // Get a large number of followers
        getHiddenStoryUsers(),
      ]);

      const hiddenSet = new Set(hiddenRes.hidden_users.map(u => u.id));
      setHiddenIds(hiddenSet);
      setOriginalHiddenIds(hiddenSet);

      // We should show followers AND users who are already hidden (even if they don't follow us)
      const allUsers = [...followersRes.items];
      const followerIds = new Set(allUsers.map(u => u.id));

      for (const hiddenUser of hiddenRes.hidden_users) {
        if (!followerIds.has(hiddenUser.id)) {
          allUsers.push(hiddenUser);
        }
      }

      setFollowers(allUsers);
    } catch (e) {
      console.log("Failed to load hide story users", e);
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasChanges = useMemo(() => {
    if (hiddenIds.size !== originalHiddenIds.size) return true;
    for (const id of hiddenIds) {
      if (!originalHiddenIds.has(id)) return true;
    }
    return false;
  }, [hiddenIds, originalHiddenIds]);

  const handleSave = async () => {
    if (!hasChanges || saving) return;
    lightImpact();
    setSaving(true);
    try {
      await updateHiddenStoryUsers(Array.from(hiddenIds));
      success();
      setOriginalHiddenIds(new Set(hiddenIds));
      router.back();
    } catch (e) {
      Alert.alert(t("settings_extra.error_title", "Hata"), t("settings_extra.error_save", "Kaydedilirken bir hata oluştu."));
    } finally {
      setSaving(false);
    }
  };

  const toggleHideUser = (userId: number) => {
    lightImpact();
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return followers;
    const lowerQ = searchQuery.toLowerCase();
    return followers.filter(
      u =>
        u.username?.toLowerCase().includes(lowerQ) ||
        u.first_name?.toLowerCase().includes(lowerQ) ||
        u.last_name?.toLowerCase().includes(lowerQ)
    );
  }, [followers, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>
          {t("settings_extra.story_hide_title", "Hikayeyi Gizle")}
        </Text>
        {hasChanges ? (
          <TouchableOpacity onPress={handleSave} style={styles.headerBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.accent.primary} />
            ) : (
              <Text style={[styles.saveBtnText, { color: colors.accent.primary }]}>{t("settings_extra.save", "Bitti")}</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBtn} />
        )}
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.background.secondary }]}>
        <IconSymbol name="magnifyingglass" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text.primary }]}
          placeholder={t("settings_extra.search", "Ara")}
          placeholderTextColor={colors.text.tertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : followers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
            {t("settings_extra.no_followers", "Henüz takipçin yok.")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isHidden = hiddenIds.has(item.id);
            return (
              <TouchableOpacity
                style={[styles.row, { borderBottomColor: colors.surface.border }]}
                activeOpacity={0.7}
                onPress={() => toggleHideUser(item.id)}
              >
                <Image
                  source={item.avatar_url ? { uri: item.avatar_url } : require("@/assets/images/icon.png")}
                  style={styles.avatar}
                />
                <View style={styles.rowInfo}>
                  <Text style={[styles.username, { color: colors.text.primary }]}>
                    {item.username || item.first_name || `User #${item.id}`}
                  </Text>
                  {item.first_name && (
                    <Text style={[styles.fullname, { color: colors.text.secondary }]}>
                      {item.first_name} {item.last_name || ""}
                    </Text>
                  )}
                </View>
                <View style={styles.checkIcon}>
                  {isHidden ? (
                    <IconSymbol name="checkmark.circle.fill" size={24} color={colors.accent.primary} />
                  ) : (
                    <IconSymbol name="circle" size={24} color={colors.surface.border} />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                {t("settings_extra.no_search_results", "Sonuç bulunamadı.")}
              </Text>
            </View>
          }
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
  headerBtn: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  saveBtnText: { fontSize: 16, fontWeight: "600" },
  searchContainer: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: spacing.base, marginTop: spacing.md, marginBottom: spacing.sm,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  listContent: { padding: spacing.base },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 40 },
  emptyText: { fontSize: 16 },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: "#333" },
  rowInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "600", marginBottom: 2 },
  fullname: { fontSize: 14 },
  checkIcon: { marginLeft: 12, justifyContent: "center" },
});
