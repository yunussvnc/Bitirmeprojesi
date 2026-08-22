/**
 * Kısıtlı Hesaplar — Kısıtlanan kullanıcıları yönet
 */

import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Image, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useTranslation } from "react-i18next";
import { apiPost } from "@/src/utils/apiClient";

export default function RestrictedAccountsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const restrictedIds = useSettingsStore((s) => s.restrictedUserIds);
  const toggleRestricted = useSettingsStore((s) => s.toggleRestrictedUser);

  interface RestrictedProfile {
    id: number;
    username: string;
    avatar_url: string | null;
  }

  const [profiles, setProfiles] = useState<RestrictedProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restrictedIds.length === 0) {
      setProfiles([]);
      return;
    }

    const fetchProfiles = async () => {
      setLoading(true);
      try {
        const res = await apiPost<{ items: RestrictedProfile[] }>("/users/batch", {
          user_ids: restrictedIds,
        });
        const itemsMap = new Map(res.items.map((item) => [item.id, item]));
        const data = restrictedIds.map((id) => {
          const matched = itemsMap.get(id);
          if (matched) {
            return {
              id,
              username: matched.username || `user_${id}`,
              avatar_url: matched.avatar_url || null,
            };
          } else {
            return {
              id,
              username: `${t("settings_restricted.user", "Kullanıcı")} #${id}`,
              avatar_url: null,
            };
          }
        });
        setProfiles(data);
      } catch (err) {
        console.warn("Restricted profiles fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfiles();
  }, [restrictedIds, t]);

  const handleRemove = (id: number) => {
    lightImpact();
    Alert.alert(t("settings_restricted.unrestrict_title", "Kısıtlamayı Kaldır"), t("settings_restricted.unrestrict_desc", "Bu kullanıcının kısıtlamasını kaldırmak istiyor musunuz?"), [
      { text: t("settings_restricted.cancel", "Vazgeç"), style: "cancel" },
      {
        text: t("settings_restricted.unrestrict", "Kaldır"),
        style: "destructive",
        onPress: () => { toggleRestricted(id); success(); },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.headerTitle]}>{t("settings_restricted.title", "Kısıtlı Hesaplar")}</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Info Banner */}
      <View style={[styles.infoBanner, { backgroundColor: isDark ? "rgba(255,179,0,0.08)" : "rgba(255,179,0,0.06)" }]}>
        <IconSymbol name="info.circle" size={18} color="#FFB300" />
        <Text style={[styles.infoText, { color: colors.text.secondary }]}>
          {t("settings_restricted.info", "Kısıtladığın kişiler mesaj gönderebilir ancak bildirim almaz, yorumları yalnızca onlar görebilir. Engellenmekten farklıdır.")}
        </Text>
      </View>

      {loading && profiles.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : restrictedIds.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
            <IconSymbol name="checkmark.shield" size={48} color={colors.text.tertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t("settings_restricted.no_restricted", "Kısıtlı hesap yok")}</Text>
          <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
            {t("settings_restricted.empty_desc", "Bir kullanıcıyı kısıtlamak için profilindeki menüden\n\"Kısıtla\" seçeneğini kullanabilirsin.")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: colors.surface.border }]}>
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface.elevated }]}>
                  <IconSymbol name="person.fill" size={20} color={colors.text.tertiary} />
                </View>
              )}
              <Text style={[styles.userId, { color: colors.text.primary }]}>{item.username}</Text>
              <TouchableOpacity
                style={[styles.removeBtn, { borderColor: colors.semantic.error }]}
                onPress={() => handleRemove(item.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.removeText, { color: colors.semantic.error }]}>{t("settings_restricted.unrestrict", "Kaldır")}</Text>
              </TouchableOpacity>
            </View>
          )}
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
  infoBanner: {
    flexDirection: "row", alignItems: "center", marginHorizontal: 16,
    marginTop: 12, padding: 12, borderRadius: 10, gap: 8,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: "center", justifyContent: "center", marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyDesc: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", marginRight: 12,
  },
  avatarImage: {
    width: 44, height: 44, borderRadius: 22,
    marginRight: 12,
  },
  userId: { flex: 1, fontSize: 15, fontWeight: "600" },
  removeBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  removeText: { fontSize: 13, fontWeight: "700" },
});
