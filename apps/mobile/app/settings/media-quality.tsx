/**
 * Medya Kalitesi Ayarları
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore, type UploadQuality } from "@/src/store/useSettingsStore";
import { useTranslation } from "react-i18next";

const getQualityOptions = (t: any): { key: UploadQuality; label: string; desc: string; icon: string }[] => [
  { key: "high", label: t("settings_media.high", "Yüksek Kalite"), desc: t("settings_media.high_desc", "En iyi görüntü ve video kalitesi. Daha fazla veri kullanır."), icon: "sparkles" },
  { key: "auto", label: t("settings_media.auto", "Otomatik"), desc: t("settings_media.auto_desc", "Bağlantı hızına göre otomatik ayarlanır."), icon: "wand.and.rays" },
  { key: "data_saver", label: t("settings_media.data_saver", "Veri Tasarrufu"), desc: t("settings_media.data_desc", "Düşük kalite, minimum veri kullanımı."), icon: "arrow.down.circle" },
];

export default function MediaQualityScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const quality = useSettingsStore((s) => s.uploadQuality);
  const wifiAuto = useSettingsStore((s) => s.wifiAutoHighQuality);
  const setQuality = useSettingsStore((s) => s.setUploadQuality);
  const setWifiAuto = useSettingsStore((s) => s.setWifiAutoHighQuality);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_media.title", "Medya Kalitesi")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_media.quality", "Yükleme Kalitesi")}>
          {getQualityOptions(t).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.qualityCard,
                {
                  backgroundColor: quality === opt.key
                    ? (isDark ? "rgba(78,205,196,0.1)" : "rgba(78,205,196,0.06)")
                    : colors.surface.elevated,
                  borderColor: quality === opt.key ? colors.accent.primary : colors.surface.border,
                },
              ]}
              onPress={() => { lightImpact(); setQuality(opt.key); success(); }}
              activeOpacity={0.7}
            >
              <View style={styles.qualityRow}>
                <IconSymbol name={opt.icon as any} size={22} color={quality === opt.key ? colors.accent.primary : colors.text.tertiary} />
                <View style={styles.qualityInfo}>
                  <Text style={[styles.qualityLabel, { color: colors.text.primary }]}>{opt.label}</Text>
                  <Text style={[styles.qualityDesc, { color: colors.text.tertiary }]}>{opt.desc}</Text>
                </View>
                <View style={[
                  styles.radio,
                  { borderColor: quality === opt.key ? colors.accent.primary : colors.surface.border },
                ]}>
                  {quality === opt.key && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent.primary }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        <Section title={t("settings_media.wifi_title", "Wi-Fi Ayarları")}>
          <SettingsRow
            label={t("settings_media.wifi_high", "Wi-Fi'da en yüksek kaliteyi kullan")}
            value={wifiAuto}
            switch
            onValueChange={(v: boolean) => { setWifiAuto(v); success(); }}
            icon="wifi"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_media.wifi_hint", "Wi-Fi bağlantısında seçilen kaliteden bağımsız olarak en yüksek kalite kullanılır.")}
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
  qualityCard: {
    borderRadius: 12, borderWidth: 1.5, padding: 14, marginBottom: 10,
  },
  qualityRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  qualityInfo: { flex: 1 },
  qualityLabel: { fontSize: 16, fontWeight: "600" },
  qualityDesc: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
});
