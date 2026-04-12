/**
 * Bildirimler ekranı
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Screen } from "@/src/components/layout";
import { Avatar, EmptyState, LoadingState } from "@/src/components/ui";
import { BackButton } from "@/src/components/shared/navigation";
import { useTheme } from "@/src/hooks/useTheme";
import { createTextStyle, spacing } from "@/src/constants/design";
import { getNotifications, markNotificationsRead, type Notification } from "@/src/services/notificationService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";
import { timeAgo } from "@/src/utils/timeAgo";
import { useTranslation } from "react-i18next";

function getNotificationMessage(n: Notification, t: any): string {
  const u = n.actor_username || t("notifications.someone");
  switch (n.type) {
    case "like":
      return t("notifications.like", { user: u });
    case "comment":
      return t("notifications.comment", { user: u });
    case "follow":
      return t("notifications.follow", { user: u });
    default:
      return t("notifications.default", { user: u });
  }
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (refresh = false) => {
    try {
      if (!refresh) setLoading(true);
      const res = await getNotifications(1, 30);
      setItems(res.items);
      if (res.items.length > 0) {
        await markNotificationsRead();
      }
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
    }, [load])
  );

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    load(true);
  }, [load]);

  const handlePress = useCallback(
    (n: Notification) => {
      lightImpact();
      if (n.place_id) {
        router.push(`/place/${n.place_id}` as any);
      } else if (n.type === "follow" && n.actor_id) {
        router.push(`/user/${n.actor_id}` as any);
      }
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: Notification }) => (
      <TouchableOpacity
        style={[styles.item, { backgroundColor: item.is_read ? "transparent" : colors.surface.elevated }]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <Avatar name={item.actor_username || "?"} size={44} />
        <View style={styles.itemContent}>
          <Text style={[styles.message, { color: colors.text.primary }]}>{getNotificationMessage(item, t)}</Text>
          <Text style={[styles.time, { color: colors.text.tertiary }]}>{timeAgo(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, handlePress]
  );

  return (
    <Screen withTabBar scrollable={false}>
      <View style={styles.header}>
        <BackButton
          onPress={() => {
            lightImpact();
            router.back();
          }}
        />
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("notifications.title")}</Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <LoadingState message={t("notifications.loading")} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          data={items}
          keyExtractor={(i) => String(i.id)}
          renderItem={renderItem}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.listContent}
          ListEmptyComponent={
            <EmptyState variant="notifications" title={t("notifications.empty_title")} description={t("notifications.empty_desc")} />
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: { fontSize: 20, fontWeight: "700" },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl * 2 },
  listEmpty: { flexGrow: 1 },
  center: { flex: 1, justifyContent: "center", minHeight: 200 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.md,
  },
  itemContent: { flex: 1 },
  message: { fontSize: 15, fontWeight: "500" },
  time: { fontSize: 12, marginTop: 2 },
});
