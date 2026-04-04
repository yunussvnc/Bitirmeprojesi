/**
 * Hesap Durumu — Aktif/Kısıtlı badge, hesap bilgileri
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";
import { apiGet } from "@/src/utils/apiClient";

type AccountInfo = {
  id: number;
  email?: string;
  username?: string;
  role?: string;
  is_email_verified?: boolean;
  created_at?: string;
  is_active?: boolean;
};

export default function AccountStatusScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const authUser = useAuthStore((s) => s.user);

  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiGet<AccountInfo>("/auth/me");
      setInfo(data);
    } catch {
      if (authUser) {
        setInfo({
          id: authUser.id,
          username: (authUser as any).username,
          email: (authUser as any).email,
          role: "user",
          is_email_verified: true,
          is_active: true,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [authUser]);

  useEffect(() => { load(); }, [load]);

  const isActive = info?.is_active !== false;
  const formatDate = (d?: string) => {
    if (!d) return "Bilinmiyor";
    try { return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Hesap Durumu</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.accent.primary} />
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          <View style={[styles.statusBanner, {
            backgroundColor: isActive
              ? (isDark ? "rgba(78,206,141,0.1)" : "rgba(78,206,141,0.06)")
              : (isDark ? "rgba(255,71,87,0.1)" : "rgba(255,71,87,0.06)"),
          }]}>
            <View style={[styles.statusBadge, { backgroundColor: isActive ? "#4ECE8D" : "#FF4757" }]}>
              <IconSymbol name={isActive ? "checkmark.shield.fill" : "xmark.shield"} size={28} color="#fff" />
            </View>
            <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
              {isActive ? "Hesabınız Aktif" : "Hesabınız Kısıtlı"}
            </Text>
            <Text style={[styles.statusDesc, { color: colors.text.secondary }]}>
              {isActive
                ? "Hesabınızda herhangi bir kısıtlama bulunmuyor. Tüm özellikleri kullanabilirsiniz."
                : "Hesabınızda bazı kısıtlamalar mevcut. Detaylar için Yardım Merkezi'ne başvurun."}
            </Text>
          </View>

          <Section title="Hesap Bilgileri">
            <SettingsRow label="Kullanıcı Adı" value={`@${info?.username || "—"}`} icon="at" />
            <SettingsRow label="Kullanıcı ID" value={`#${info?.id || "—"}`} icon="number" />
            <SettingsRow label="E-posta" value={info?.email || "—"} icon="envelope" />
            <SettingsRow label="Hesap Rolü" value={
              info?.role === "admin" ? "Yönetici" :
              info?.role === "venue" ? "Mekan Sahibi" : "Kullanıcı"
            } icon="person.text.rectangle" />
          </Section>

          <Section title="Doğrulama Durumu">
            <SettingsRow
              label="E-posta Doğrulama"
              value={info?.is_email_verified ? "Doğrulanmış ✅" : "Doğrulanmamış ⚠️"}
              icon="checkmark.seal"
            />
            <SettingsRow
              label="Hesap Oluşturma Tarihi"
              value={formatDate(info?.created_at)}
              icon="calendar"
            />
          </Section>

          {!isActive && (
            <TouchableOpacity
              style={[styles.helpLink, { borderColor: colors.accent.primary }]}
              onPress={() => { lightImpact(); router.push("/settings/help" as any); }}
              activeOpacity={0.7}
            >
              <IconSymbol name="questionmark.circle" size={18} color={colors.accent.primary} />
              <Text style={[styles.helpLinkText, { color: colors.accent.primary }]}>Yardım Merkezi'ne Git</Text>
            </TouchableOpacity>
          )}
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
  statusBanner: {
    alignItems: "center", padding: 24, borderRadius: 16, marginBottom: 16,
  },
  statusBadge: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  statusTitle: { fontSize: 20, fontWeight: "800", marginBottom: 6, textAlign: "center" },
  statusDesc: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  helpLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, marginTop: 20, borderRadius: 12, borderWidth: 1.5,
  },
  helpLinkText: { fontSize: 15, fontWeight: "700" },
});
