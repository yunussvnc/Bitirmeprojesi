/**
 * Gizlilik Merkezi — Politikalar, KVKK, Verilerimi İndir
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";

export default function PrivacyCenterScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleDataRequest = () => {
    lightImpact();
    Alert.alert(
      t("settings_privacy_center.download_data", "Verilerimi İndir"),
      t(
        "settings_privacy_center.download_coming_soon",
        "Veri dışa aktarma özelliği yakında eklenecek. Şimdilik hesap silme talebi için Güvenlik ayarlarını kullanabilirsiniz."
      )
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_privacy_center.title", "Gizlilik Merkezi")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Shield Banner */}
        <View style={[styles.banner, { backgroundColor: isDark ? "rgba(78,205,196,0.08)" : "rgba(78,205,196,0.05)" }]}>
          <View style={[styles.bannerIcon, { backgroundColor: colors.accent.primary }]}>
            <IconSymbol name="shield.lefthalf.filled" size={28} color="#fff" />
          </View>
          <Text style={[styles.bannerTitle, { color: colors.text.primary }]}>{t("settings_privacy_center.priority_title", "Gizliliğin Bizim İçin Öncelik")}</Text>
          <Text style={[styles.bannerDesc, { color: colors.text.secondary }]}>
            {t("settings_privacy_center.priority_desc", "Verileriniz güvende. Asemos, kişisel bilgilerinizi satmaz veya üçüncü taraflarla paylaşmaz.")}
          </Text>
        </View>

        <Section title={t("settings_privacy_center.permissions", "Yasal Belgeler")}>
          <SettingsRow
            label={t("settings_privacy_center.data_policy", "Gizlilik Politikası")}
            showArrow
            icon="doc.text"
            onPress={() => { lightImpact(); router.push({ pathname: "/settings/legal-document", params: { type: "privacy" } } as any); }}
          />
          <SettingsRow
            label={t("settings_privacy_center.tos", "Kullanım Koşulları")}
            showArrow
            icon="doc.plaintext"
            onPress={() => { lightImpact(); router.push({ pathname: "/settings/legal-document", params: { type: "terms" } } as any); }}
          />
          <SettingsRow
            label={t("settings_privacy_center.cookie_policy", "Çerez Politikası")}
            showArrow
            icon="info.circle"
            onPress={() => { lightImpact(); router.push({ pathname: "/settings/legal-document", params: { type: "cookies" } } as any); }}
          />
        </Section>

        <Section title={t("settings_privacy_center.kvkk_title", "KVKK (Kişisel Verilerin Korunması)")}>
          <View style={[styles.kvkkCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
            <Text style={[styles.kvkkText, { color: colors.text.secondary }]}>
              {t("settings_privacy_center.kvkk_desc", "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında...")}
            </Text>
          </View>
        </Section>

        <Section title={t("settings_privacy_center.data_controls", "Veri Hakların")}>
          <SettingsRow
            label={t("settings_privacy_center.download_data", "Verilerimi İndir")}
            showArrow
            icon="arrow.down.doc"
            onPress={handleDataRequest}
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_privacy_center.download_data_hint", "Hesabınıza ait tüm verilerin bir kopyasını talep edebilirsiniz.")}
          </Text>
          <SettingsRow
            label={t("settings_privacy_center.delete_data", "Veri Silme Talebi")}
            showArrow
            icon="trash"
            onPress={() => {
              lightImpact();
              router.push("/settings/security" as any);
            }}
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_privacy_center.delete_data_hint", "Hesabınızı ve tüm verilerinizi kalıcı olarak silmek için Güvenlik ayarlarındaki hesap silme bölümünü kullanabilirsiniz.")}
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
  banner: {
    alignItems: "center", padding: 24, borderRadius: 16, marginBottom: 16,
  },
  bannerIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  bannerTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6, textAlign: "center" },
  bannerDesc: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  kvkkCard: {
    borderRadius: 12, borderWidth: 1, padding: 16,
  },
  kvkkText: { fontSize: 14, lineHeight: 22 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
});
