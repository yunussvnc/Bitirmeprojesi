/**
 * Konum İzinleri — Cihaz konum durumu ve paylaşım tercihi
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore } from "@/src/store/useSettingsStore";

export default function LocationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const includeLocation = useSettingsStore((s) => s.includeLocationInPosts);
  const setIncludeLocation = useSettingsStore((s) => s.setIncludeLocationInPosts);

  const [permStatus, setPermStatus] = useState<string>("checking");

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const Location = await import("expo-location");
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermStatus(status);
    } catch {
      setPermStatus("unavailable");
    }
  };

  const requestPermission = async () => {
    lightImpact();
    try {
      const Location = await import("expo-location");
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermStatus(status);
      if (status === "granted") {
        success();
      } else {
        Alert.alert(
          "İzin Gerekli",
          "Konum özelliklerini kullanmak için ayarlardan konum iznini etkinleştirin.",
          [
            { text: "Vazgeç", style: "cancel" },
            { text: "Ayarları Aç", onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch {
      Alert.alert("Hata", "Konum izni kontrol edilemedi.");
    }
  };

  const statusLabel = permStatus === "granted" ? "İzin Verildi ✅" :
                      permStatus === "denied" ? "Reddedildi ❌" :
                      permStatus === "checking" ? "Kontrol ediliyor..." :
                      "Kullanılamıyor";

  const statusColor = permStatus === "granted" ? "#4ECE8D" :
                      permStatus === "denied" ? "#FF4757" : colors.text.tertiary;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Konum İzinleri</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Permission Status Banner */}
        <View style={[styles.statusBanner, {
          backgroundColor: permStatus === "granted"
            ? (isDark ? "rgba(78,206,141,0.1)" : "rgba(78,206,141,0.06)")
            : (isDark ? "rgba(255,71,87,0.1)" : "rgba(255,71,87,0.06)"),
        }]}>
          <View style={[styles.statusIcon, { backgroundColor: statusColor }]}>
            <IconSymbol name={permStatus === "granted" ? "location.fill" : "location.slash"} size={22} color="#fff" />
          </View>
          <View style={styles.statusInfo}>
            <Text style={[styles.statusTitle, { color: colors.text.primary }]}>Konum Erişimi</Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {permStatus !== "granted" && (
            <TouchableOpacity
              style={[styles.grantBtn, { backgroundColor: colors.accent.primary }]}
              onPress={requestPermission}
              activeOpacity={0.7}
            >
              <Text style={styles.grantBtnText}>İzin Ver</Text>
            </TouchableOpacity>
          )}
        </View>

        <Section title="Konum Tercihleri">
          <SettingsRow
            label="Paylaşımlarda konum bilgisi ekle"
            value={includeLocation}
            switch
            onValueChange={(v: boolean) => { setIncludeLocation(v); success(); }}
            icon="mappin.and.ellipse"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Gönderi ve hikaye paylaşırken konumun otomatik olarak eklenmesini sağlar.
          </Text>
        </Section>

        <Section title="Harita Kullanımı">
          <SettingsRow label="Yakındaki mekanlar" value={permStatus === "granted" ? "Aktif" : "Kapalı"} icon="building.2" />
          <SettingsRow label="Konum geçmişi" value="Cihazda saklanır" icon="clock.arrow.circlepath" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Konum verileriniz yalnızca cihazınızda saklanır ve hiçbir zaman üçüncü taraflarla paylaşılmaz.
          </Text>
        </Section>

        {Platform.OS === "ios" && (
          <TouchableOpacity
            style={[styles.settingsLink, { borderColor: colors.surface.border }]}
            onPress={() => Linking.openSettings()}
            activeOpacity={0.6}
          >
            <IconSymbol name="gear" size={18} color={colors.accent.primary} />
            <Text style={[styles.settingsLinkText, { color: colors.accent.primary }]}>
              Sistem Konum Ayarlarını Aç
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    flexDirection: "row", alignItems: "center", padding: 16,
    borderRadius: 14, marginBottom: 16, gap: 12,
  },
  statusIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 16, fontWeight: "700" },
  statusValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  grantBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  grantBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  settingsLink: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, marginTop: 16, borderRadius: 12, borderWidth: 1,
  },
  settingsLinkText: { fontSize: 15, fontWeight: "600" },
});
