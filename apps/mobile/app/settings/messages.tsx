/**
 * Mesajlar ve Hikaye Yanıtları Ayarları
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
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useTranslation } from "react-i18next";

export default function MessagesSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const unknownRequests = useSettingsStore((s) => s.unknownMessageRequests);
  const readReceipts = useSettingsStore((s) => s.showReadReceipts);
  const setUnknownRequests = useSettingsStore((s) => s.setUnknownMessageRequests);
  const setReadReceipts = useSettingsStore((s) => s.setShowReadReceipts);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_messages.title", "Mesajlar ve Yanıtlar")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_messages.msg_requests", "Mesaj İstekleri")}>
          <SettingsRow
            label={t("settings_messages.req_desc", "Tanımadığım kişilerin mesajlarını isteklere al")}
            value={unknownRequests}
            switch
            onValueChange={(v: boolean) => { setUnknownRequests(v); success(); }}
            icon="envelope.badge"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_messages.req_hint", "Takip etmediğin kişilerden gelen mesajlar, mesaj istekleri klasörüne düşer.")}
          </Text>
        </Section>

        <Section title={t("settings_messages.read_receipts", "Okundu Bilgisi")}>
          <SettingsRow
            label={t("settings_messages.show_read", "Okundu bilgisini göster")}
            value={readReceipts}
            switch
            onValueChange={(v: boolean) => { setReadReceipts(v); success(); }}
            icon="checkmark.message"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_messages.show_read_desc", "Kapatırsan, mesajlarını okuduğunu diğer kişiler göremez. Sen de başkalarının okundu bilgisini göremezsin.")}
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
  sectionDesc: { fontSize: 14, marginBottom: 8, paddingHorizontal: 16 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  radioRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  radioLabel: { fontSize: 16, fontWeight: "500" },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
});
