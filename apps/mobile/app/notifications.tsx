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
import { Screen } from "@/components/layout";
import { Avatar , EmptyState, LoadingState } from "@/components/ui";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useTheme } from "@/hooks/useTheme";
import { createTextStyle, spacing } from "@/constants/design";
import {
  getNotifications,
  markNotificationsRead,
  type Notification,
} from "@/src/services/notificationService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";
import { timeAgo } from "@/src/utils/timeAgo";

function getNotificationMessage(n: Notification): string {
  const u = n.actor_username || "Birisi";
  switch (n.type) {
    case "like":
      return `${u} gönderini beğendi`;
    case "comment":
      return `${u} gönderine yorum yaptı`;
    case "follow":
      return `${u} seni takip etmeye başladı`;
    default:
      return `${u} bir etkileşimde bulundu`;
  }
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
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
        style={[
          styles.item,
          { backgroundColor: item.is_read ? "transparent" : colors.surface.elevated },
        ]}
        onPress={() => handlePress(item)}
        activeOpacity={0.7}
      >
        <Avatar
          name={item.actor_username || "?"}
          size={44}
        />
        <View style={styles.itemContent}>
          <Text style={[styles.message, { color: colors.text.primary }]}>
            {getNotificationMessage(item)}
          </Text>
          <Text style={[styles.time, { color: colors.text.tertiary }]}>
            {timeAgo(item.created_at)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, handlePress]
  );

  return (
    <Screen withTabBar scrollable={false}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          style={styles.backBtn}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>
          Bildirimler
        </Text>
      </View>

      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <LoadingState message="Bildirimler yükleniyor..." />
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
            <EmptyState
              variant="notifications"
              title="Henüz bildirim yok"
              description="Yeni etkileşimler burada görünecek"
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent.primary}
            />
          }
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
  backBtn: { padding: 4, marginRight: spacing.sm },
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
