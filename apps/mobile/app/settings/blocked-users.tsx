/**
 * Engellenen Kullanıcılar Ekranı — Backend entegreli
 */
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { getBlockedUsers, toggleBlockUser } from "@/src/services/moderationService";

type BlockedUser = {
  id: number;
  username: string | null;
  first_name: string | null;
  avatar_url: string | null;
};

export default function BlockedUsersScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlocked = useCallback(async () => {
    try {
      const data = await getBlockedUsers();
      setUsers(data.items);
    } catch { } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBlocked(); }, [loadBlocked]);

  const handleUnblock = (user: BlockedUser) => {
    lightImpact();
    Alert.alert("Engeli Kaldır", `${user.username || user.first_name || "Bu kullanıcı"} engelinden çıkarılsın mı?`, [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Engeli Kaldır", style: "destructive", onPress: async () => {
          try {
            await toggleBlockUser(user.id);
            success();
            setUsers((prev) => prev.filter((u) => u.id !== user.id));
          } catch { Alert.alert("Hata", "İşlem başarısız."); }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.headerTitle]}>
          Engellenenler
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : users.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol name="checkmark.shield" size={48} color={colors.text.tertiary} />
          <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>Engellenen kullanıcı yok</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={[styles.row, { borderBottomColor: colors.surface.border }]}>
              <Image
                source={item.avatar_url ? { uri: item.avatar_url } : require("@/assets/images/icon.png")}
                style={styles.avatar}
              />
              <View style={styles.rowInfo}>
                <Text style={[styles.username, { color: colors.text.primary }]}>
                  {item.username || item.first_name || `Kullanıcı #${item.id}`}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.unblockBtn, { borderColor: colors.semantic.error }]}
                onPress={() => handleUnblock(item)}
                activeOpacity={0.7}
              >
                <Text style={[styles.unblockText, { color: colors.semantic.error }]}>Kaldır</Text>
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
  listContent: { padding: spacing.base },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { fontSize: 16, fontWeight: "500" },
  row: {
    flexDirection: "row", alignItems: "center", paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12, backgroundColor: "#333" },
  rowInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: "600" },
  unblockBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  unblockText: { fontSize: 13, fontWeight: "700" },
});
