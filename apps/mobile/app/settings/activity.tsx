/**
 * Ziyaret Geçmişi / Aktivite İstatistikleri
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { apiGet } from "@/src/utils/apiClient";
import { LinearGradient } from "expo-linear-gradient";

type UserStats = {
  post_count?: number;
  follower_count?: number;
  following_count?: number;
  review_count?: number;
  visit_count?: number;
};

export default function ActivityScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiGet<UserStats>("/auth/me/stats");
      setStats(data);
    } catch {
      setStats({ post_count: 0, follower_count: 0, following_count: 0, review_count: 0, visit_count: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const statCards: { label: string; value: number; icon: string; gradient: [string, string] }[] = [
    { label: "Gönderi", value: stats?.post_count ?? 0, icon: "photo.on.rectangle", gradient: ["#4ECDC4", "#44B8AE"] },
    { label: "Takipçi", value: stats?.follower_count ?? 0, icon: "person.2", gradient: ["#667EEA", "#5A6FD6"] },
    { label: "Takip", value: stats?.following_count ?? 0, icon: "person.badge.plus", gradient: ["#F093FB", "#D06AE6"] },
    { label: "Değerlendirme", value: stats?.review_count ?? 0, icon: "star", gradient: ["#FFB347", "#F5A623"] },
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Ziyaret Geçmişi</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>İSTATİSTİKLERİN</Text>
          <View style={styles.grid}>
            {statCards.map((card) => (
              <LinearGradient
                key={card.label}
                colors={card.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statCard}
              >
                <IconSymbol name={card.icon as any} size={24} color="rgba(255,255,255,0.9)" />
                <Text style={styles.statValue}>{card.value.toLocaleString("tr-TR")}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </LinearGradient>
            ))}
          </View>

          {/* Activity Summary */}
          <Text style={[styles.sectionTitle, { color: colors.text.secondary, marginTop: 24 }]}>AKTİVİTE ÖZETİ</Text>
          <View style={[styles.summaryCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
            <View style={styles.summaryRow}>
              <IconSymbol name="mappin.circle" size={20} color={colors.accent.primary} />
              <Text style={[styles.summaryLabel, { color: colors.text.primary }]}>Ziyaret edilen mekan</Text>
              <Text style={[styles.summaryValue, { color: colors.accent.primary }]}>{stats?.visit_count ?? 0}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.surface.border }]} />
            <View style={styles.summaryRow}>
              <IconSymbol name="text.bubble" size={20} color={colors.accent.primary} />
              <Text style={[styles.summaryLabel, { color: colors.text.primary }]}>Toplam değerlendirme</Text>
              <Text style={[styles.summaryValue, { color: colors.accent.primary }]}>{stats?.review_count ?? 0}</Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.surface.border }]} />
            <View style={styles.summaryRow}>
              <IconSymbol name="heart" size={20} color={colors.accent.primary} />
              <Text style={[styles.summaryLabel, { color: colors.text.primary }]}>Beğenilen gönderi</Text>
              <Text style={[styles.summaryValue, { color: colors.accent.primary }]}>—</Text>
            </View>
          </View>

          <View style={styles.tipBox}>
            <IconSymbol name="lightbulb" size={16} color={colors.accent.primary} />
            <Text style={[styles.tipText, { color: colors.text.tertiary }]}>
              İstatistiklerin gerçek zamanlı olarak güncellenir ve sadece sen görebilirsin.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: "600", letterSpacing: 0.8, marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48%", borderRadius: 14, padding: 16,
    alignItems: "flex-start", gap: 6,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  statValue: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  statLabel: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.85)" },
  summaryCard: { borderRadius: 14, borderWidth: 1, padding: 4 },
  summaryRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 14,
  },
  summaryLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  summaryValue: { fontSize: 17, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  tipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingTop: 20, paddingHorizontal: 4,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
