/**
 * Yorumlar Ayarları — Varsayılan yorum tercihleri
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
  everyone: t("settings_comments.everyone", "Herkes"),
  followers: t("settings_comments.followers", "Takipçiler"),
  off: t("settings_comments.nobody", "Kapalı"),
});

export default function CommentsSettingsScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const defaultDisabled = useSettingsStore((s) => s.defaultCommentsDisabled);
  const audience = useSettingsStore((s) => s.commentAllowedAudience);
  const hideOffensiveWords = useSettingsStore((s) => s.hideOffensiveWords);
  const setDefaultDisabled = useSettingsStore((s) => s.setDefaultCommentsDisabled);
  const setAudience = useSettingsStore((s) => s.setCommentAllowedAudience);
  const setHideOffensiveWords = useSettingsStore((s) => s.setHideOffensiveWords);
  const isPrivate = useSettingsStore((s) => s.isPrivateAccount);

  const audienceOptions: Audience[] = isPrivate ? ["followers", "off"] : ["everyone", "followers", "off"];

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_comments.title", "Yorumlar")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_comments.controls", "Yorum Kontrolleri")}>
          <SettingsRow
            label={t("settings_comments.disable_default", "Varsayılan olarak yorumları kapat")}
            value={defaultDisabled}
            switch
            onValueChange={(v: boolean) => { setDefaultDisabled(v); success(); }}
            icon="text.bubble"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_comments.disable_hint", "Açıldığında, yeni paylaşımlarında yorumlar varsayılan olarak kapalı olur. Her paylaşımda bunu ayrıca değiştirebilirsin.")}
          </Text>
        </Section>

        <Section title={t("settings_comments.allow_from", "Kimler yorum yapabilir?")}>
          {audienceOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); setAudience(opt); success(); }}
              activeOpacity={0.6}
            >
              <Text style={[styles.radioLabel, { color: colors.text.primary }]}>
                {getAudienceLabels(t)[opt]}
              </Text>
              <View style={[
                styles.radio,
                { borderColor: audience === opt ? colors.accent.primary : colors.surface.border },
              ]}>
                {audience === opt && (
                  <View style={[styles.radioInner, { backgroundColor: colors.accent.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_comments.allow_hint", "Takipçiler: Yalnızca seni takip eden kişiler yorum yapabilir. Kapalı: Hiç kimse yorum yapamaz.")}
          </Text>
        </Section>

        <Section title={t("settings_comments.filter", "Yorum Filtresi")}>
          <SettingsRow
            label={t("settings_comments.hide_offensive", "Uygunsuz yorumları gizle")}
            value={hideOffensiveWords}
            switch
            onValueChange={(v: boolean) => { setHideOffensiveWords(v); success(); }}
            icon="shield.lefthalf.filled"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_comments.hide_desc", "Yapay zekâ destekli filtre, spam ve uygunsuz içerikli yorumları otomatik olarak gizler.")}
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
