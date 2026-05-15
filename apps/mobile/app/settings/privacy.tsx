/**
 * Hesap Gizliliği — Gizli/Herkese Açık hesap toggle
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
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useTranslation } from "react-i18next";

export default function PrivacySettingsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPrivate = useSettingsStore((s) => s.isPrivateAccount);
  const setIsPrivate = useSettingsStore((s) => s.setIsPrivateAccount);

  const handleTogglePrivacy = (val: boolean) => {
    if (val) {
      // Gizliye geçiş — doğrudan ayarla
      setIsPrivate(true);
      success();
    } else {
      // Açığa geçiş — uyarı göster
      Alert.alert(
        t("settings_privacy.public_account", "Herkese Açık Hesap"),
        t("settings_privacy.public_desc", "Herkes profilini, gönderilerini ve hikayelerini görebilir."),
        [
          { text: "Vazgeç", style: "cancel" },
          {
            text: "Herkese Açık Yap",
            style: "destructive",
            onPress: () => { setIsPrivate(false); success(); },
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_privacy.title", "Hesap Gizliliği")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Status Banner */}
        <View style={[styles.statusBanner, {
          backgroundColor: isPrivate
            ? (isDark ? "rgba(78,205,196,0.1)" : "rgba(78,205,196,0.08)")
            : (isDark ? "rgba(255,179,0,0.1)" : "rgba(255,179,0,0.08)"),
        }]}>
          <View style={[styles.statusIcon, {
            backgroundColor: isPrivate ? colors.accent.primary : "#FFB300",
          }]}>
            <IconSymbol name={isPrivate ? "lock.fill" : "lock.open"} size={22} color="#fff" />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusTitle, { color: colors.text.primary }]}>
              {isPrivate ? t("settings_privacy.private_account", "Gizli Hesap") : t("settings_privacy.public_account", "Herkese Açık Hesap")}
            </Text>
            <Text style={[styles.statusDesc, { color: colors.text.secondary }]}>
              {isPrivate
                ? t("settings_privacy.private_desc", "Sadece onayladığın kişiler gönderilerini ve hikayelerini görebilir.")
                : t("settings_privacy.public_desc", "Herkes profilini, gönderilerini ve hikayelerini görebilir.")}
            </Text>
          </View>
        </View>

        <Section title={t("settings_privacy.status", "Hesap Durumu")}>
          <SettingsRow
            label={t("settings_privacy.private_account", "Gizli Hesap")}
            value={isPrivate}
            switch
            onValueChange={handleTogglePrivacy}
            icon="lock"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_privacy.hint", "Hesabını gizliye çevirdiğinde, yalnızca onayladığın kişiler seni görebilir, gönderilerini ve hikayelerini izleyebilir.")}
          </Text>
        </Section>

        <Section title={t("settings_privacy.effects", "Gizlilik Etkileri")}>
          <SettingsRow label={t("settings_privacy.post_vis", "Gönderi görünürlüğü")} value={isPrivate ? t("settings_privacy.followers", "Takipçiler") : t("settings_privacy.everyone", "Herkes")} icon="photo.on.rectangle" />
          <SettingsRow label={t("settings_privacy.story_vis", "Hikaye görünürlüğü")} value={isPrivate ? t("settings_privacy.followers", "Takipçiler") : t("settings_privacy.everyone", "Herkes")} icon="circle.hexagongrid" />
          <SettingsRow label={t("settings_privacy.followers_req", "Takipçi istekleri")} value={isPrivate ? t("settings_privacy.approval", "Onay gerekli") : t("settings_privacy.automatic", "Otomatik")} icon="person.badge.plus" />
          <SettingsRow label={t("settings_privacy.profile_vis", "Profil görünürlüğü")} value={isPrivate ? t("settings_privacy.limited", "Sınırlı") : t("settings_privacy.full", "Tam")} icon="eye" />
        </Section>

        <View style={styles.tipBox}>
          <IconSymbol name="lightbulb" size={16} color={colors.accent.primary} />
          <Text style={[styles.tipText, { color: colors.text.tertiary }]}>
            {t("settings_privacy.tip", "İpucu: Gizli hesapların içerikleri keşfet ve harita sayfasında görünmez.")}
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
  content: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: "row", alignItems: "center", padding: 16,
    borderRadius: 14, marginBottom: 16, gap: 14,
  },
  statusIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  statusTextWrap: { flex: 1 },
  statusTitle: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  statusDesc: { fontSize: 13, lineHeight: 18 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  tipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingTop: 16, paddingHorizontal: 4,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
