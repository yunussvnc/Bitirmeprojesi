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
import { useSettingsStore, type Audience } from "@/src/store/useSettingsStore";
import { useTranslation } from "react-i18next";

const getAudienceLabels = (t: any): Record<Audience, string> => ({
  everyone: t("settings_messages.everyone", "Herkes"),
  followers: t("settings_messages.followers", "Takipçiler"),
  off: t("settings_messages.nobody", "Kapalı"),
});

export default function MessagesSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const unknownRequests = useSettingsStore((s) => s.unknownMessageRequests);
  const storyReply = useSettingsStore((s) => s.storyReplyAudience);
  const readReceipts = useSettingsStore((s) => s.showReadReceipts);
  const setUnknownRequests = useSettingsStore((s) => s.setUnknownMessageRequests);
  const setStoryReply = useSettingsStore((s) => s.setStoryReplyAudience);
  const setReadReceipts = useSettingsStore((s) => s.setShowReadReceipts);

  const audienceOptions: Audience[] = ["everyone", "followers", "off"];

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

        <Section title={t("settings_messages.replies", "Hikaye Yanıtları")}>
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            {t("settings_messages.allow_replies", "Hikayelerine kimlerin yanıt verebileceğini seç")}
          </Text>
          {audienceOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); setStoryReply(opt); success(); }}
              activeOpacity={0.6}
            >
              <Text style={[styles.radioLabel, { color: colors.text.primary }]}>
                {getAudienceLabels(t)[opt]}
              </Text>
              <View style={[
                styles.radio,
                { borderColor: storyReply === opt ? colors.accent.primary : colors.surface.border },
              ]}>
                {storyReply === opt && (
                  <View style={[styles.radioInner, { backgroundColor: colors.accent.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
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

        <Section title={t("settings_messages.groups", "Grup Mesajları")}>
          <SettingsRow label={t("settings_messages.group_allow", "Herkesin seni gruba eklemesine izin ver")} value={true} switch icon="person.3" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_messages.group_hint", "Kapatırsan, yalnızca takip ettiğin kişiler seni gruplara ekleyebilir.")}
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
