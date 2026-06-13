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
import { useTranslation } from "react-i18next";
import * as Location from "expo-location";

export default function LocationSettingsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [permStatus, setPermStatus] = useState<string>("checking");

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermStatus(status);
    } catch {
      setPermStatus("unavailable");
    }
  };

  const requestPermission = async () => {
    lightImpact();
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermStatus(status);
      if (status === "granted") {
        success();
      } else {
        Alert.alert(
          t("common.error", "İzin Gerekli"),
          t("settings_location.enable_desc", "Konum özelliklerini kullanmak için ayarlardan konum iznini etkinleştirin."),
          [
            { text: t("common.cancel", "Vazgeç"), style: "cancel" },
            { text: t("common.settings", "Ayarları Aç"), onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch {
      Alert.alert(t("common.error", "Hata"), t("settings_location.error_check", "Konum izni kontrol edilemedi."));
    }
  };

  const statusLabel = permStatus === "granted" ? `${t("settings_location.granted", "İzin Verildi")} ✅` :
                      permStatus === "denied" ? `${t("settings_location.denied", "Reddedildi")} ❌` :
                      permStatus === "checking" ? t("settings_location.checking", "Kontrol ediliyor...") :
                      t("settings_location.unavailable", "Kullanılamıyor");

  const statusColor = permStatus === "granted" ? "#4ECE8D" :
                      permStatus === "denied" ? "#FF4757" : colors.text.tertiary;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_location.title", "Konum İzinleri")}</Text>
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
            <Text style={[styles.statusTitle, { color: colors.text.primary }]}>{t("settings_location.access", "Konum Erişimi")}</Text>
            <Text style={[styles.statusValue, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {permStatus !== "granted" && (
            <TouchableOpacity
              style={[styles.grantBtn, { backgroundColor: colors.accent.primary }]}
              onPress={requestPermission}
              activeOpacity={0.7}
            >
              <Text style={styles.grantBtnText}>{t("settings_location.grant", "İzin Ver")}</Text>
            </TouchableOpacity>
          )}
        </View>

        <Section title={t("settings_location.map_usage", "Harita Kullanımı")}>
          <SettingsRow label={t("settings_location.nearby_places", "Yakındaki mekanlar")} value={permStatus === "granted" ? t("settings_location.active", "Aktif") : t("common.off", "Kapalı")} icon="building.2" />
          <SettingsRow label={t("settings_location.location_history", "Konum geçmişi")} value={t("settings_location.stored_on_device", "Cihazda saklanır")} icon="clock.arrow.circlepath" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_location.history_desc", "Konum verileriniz yalnızca cihazınızda saklanır ve hiçbir zaman üçüncü taraflarla paylaşılmaz.")}
          </Text>
        </Section>
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
