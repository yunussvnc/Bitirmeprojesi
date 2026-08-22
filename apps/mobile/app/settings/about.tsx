/**
 * Hakkında — Uygulama bilgileri, lisanslar, sosyal medya
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";

const APP_VERSION = "1.0.0";
const BUILD_NUMBER = "2026.03.30";

const DEPS = [
  "React Native", "Expo", "FastAPI", "SQLAlchemy",
  "React Navigation", "Zustand", "Reanimated",
];

export default function AboutScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_about.title", "Hakkında")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Identity */}
        <View style={styles.identitySection}>
          <Image
            source={require("@/assets/images/icon.png")}
            style={styles.appIcon}
          />
          <Text style={[styles.appName, { color: colors.text.primary }]}>Asemos</Text>
          <Text style={[styles.tagline, { color: colors.accent.primary }]}>
            {t("settings_about.tagline", "Mekan keşfet • Eşleş • Paylaş")}
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }]}>
            <Text style={[styles.versionText, { color: colors.text.secondary }]}>
              v{APP_VERSION} ({BUILD_NUMBER})
            </Text>
          </View>
        </View>

        <Section title={t("settings_about.app_info", "Uygulama Bilgileri")}>
          <SettingsRow label={t("settings_help.version", "Sürüm")} value={`v${APP_VERSION}`} icon="info.circle" />
          <SettingsRow label="Build" value={BUILD_NUMBER} icon="hammer" />
          <SettingsRow label="Platform" value="React Native + Expo" icon="apps.iphone" />
          <SettingsRow label="Backend" value="FastAPI + PostgreSQL" icon="server.rack" />
        </Section>

        <Section title={t("settings_about.legal", "Yasal")}>
          <SettingsRow
            label={t("settings_about.terms", "Kullanım Koşulları")}
            showArrow
            icon="doc.plaintext"
            onPress={() => { lightImpact(); router.push({ pathname: "/settings/legal-document", params: { type: "terms" } } as any); }}
          />
          <SettingsRow
            label={t("settings_about.data_policy", "Gizlilik Politikası")}
            showArrow
            icon="shield"
            onPress={() => { lightImpact(); router.push("/settings/privacy-center" as any); }}
          />
          <SettingsRow
            label={t("settings_about.kvkk", "KVKK Aydınlatma Metni")}
            showArrow
            icon="doc.text"
            onPress={() => { lightImpact(); router.push("/settings/privacy-center" as any); }}
          />
        </Section>

        <Section title={t("settings_about.open_source", "Açık Kaynak Bağımlılıklar")}>
          {DEPS.map((dep) => (
            <View key={dep} style={[styles.depRow, { borderBottomColor: colors.surface.border }]}>
              <IconSymbol name="shippingbox" size={16} color={colors.text.tertiary} />
              <Text style={[styles.depName, { color: colors.text.primary }]}>{dep}</Text>
            </View>
          ))}
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_about.oss_hint", "Bu uygulama açık kaynak topluluk projelerine dayanmaktadır. Tüm lisanslar ilgili kütüphanelerin deposunda mevcuttur.")}
          </Text>
        </Section>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.text.tertiary }]}>
            © 2026 Asemos.
          </Text>
        </View>
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
  content: { padding: 16, paddingBottom: 60 },
  identitySection: { alignItems: "center", paddingVertical: 28 },
  appIcon: { width: 80, height: 80, borderRadius: 20, marginBottom: 14 },
  appName: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  tagline: { fontSize: 15, fontWeight: "600", marginTop: 4, letterSpacing: 0.5 },
  versionBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  versionText: { fontSize: 13, fontWeight: "500" },
  depRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  depName: { fontSize: 15, fontWeight: "500" },
  hint: { fontSize: 13, lineHeight: 18, marginTop: 8, marginBottom: 8, marginLeft: 16 },
  footer: { alignItems: "center", paddingTop: 32, gap: 4 },
  footerText: { fontSize: 13, fontWeight: "500" },
  footerSubtext: { fontSize: 12 },
});
