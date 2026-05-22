/**
 * Hikaye ve Konum Ayarları
 * Görüntüleyenler, Kaydetme, Yanıt verme — tümü interaktif
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { BackButton } from "@/src/components/shared/navigation";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useSettingsStore, type Audience } from "@/src/store/useSettingsStore";
import { lightImpact, success } from "@/src/utils/haptics";

const AUDIENCE_LABELS: Record<Audience, string> = {
  everyone: "Herkes",
  followers: "Takipçiler",
  off: "Kapalı",
};

export default function StorySettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const storySaveToArchive = useSettingsStore((s) => s.storySaveToArchive);
  const storySaveToCameraRoll = useSettingsStore((s) => s.storySaveToCameraRoll);
  const storyReplyAudience = useSettingsStore((s) => s.storyReplyAudience);
  const isPrivate = useSettingsStore((s) => s.isPrivateAccount);


  const setStorySaveToArchive = useSettingsStore((s) => s.setStorySaveToArchive);
  const setStorySaveToCameraRoll = useSettingsStore((s) => s.setStorySaveToCameraRoll);
  const setStoryReply = useSettingsStore((s) => s.setStoryReplyAudience);

  const replyOptions: Audience[] = ["everyone", "followers", "off"];

  const handleHideFrom = () => {
    lightImpact();
    Alert.alert(
      t("settings_extra.hide_story"),
      t("settings_extra.hide_story_desc"),
      [{ text: t("common.ok") }]
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_extra.story_title")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_extra.story_section_viewers")}>
          <SettingsRow
            label={t("settings_extra.story_hide_label")}
            value={t("settings_extra.story_edit")}
            showArrow
            icon="person.2.fill"
            onPress={handleHideFrom}
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_extra.story_hide_hint")}
          </Text>

        </Section>

        <Section title={t("settings_extra.story_section_save")}>
          <SettingsRow
            label={t("settings_extra.story_save_archive")}
            value={storySaveToArchive}
            switch
            onValueChange={(v: boolean) => { setStorySaveToArchive(v); success(); }}
            icon="square.grid.2x2.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_extra.story_save_archive_hint")}
          </Text>
          <SettingsRow
            label={t("settings_extra.story_save_roll")}
            value={storySaveToCameraRoll}
            switch
            onValueChange={(v: boolean) => { setStorySaveToCameraRoll(v); success(); }}
            icon="photo"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_extra.story_save_roll_hint")}
          </Text>
        </Section>

        <Section title={t("settings_extra.story_section_reply")}>
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            {t("settings_extra.story_reply_desc")}
          </Text>
          {replyOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); setStoryReply(opt); success(); }}
              activeOpacity={0.6}
            >
              <Text style={[styles.radioLabel, { color: colors.text.primary }]}>
                {t(`settings_extra.story_audience_${opt === "everyone" ? "everyone" : opt === "followers" ? "followers" : "off"}`)}
              </Text>
              <View style={[
                styles.radio,
                { borderColor: storyReplyAudience === opt ? colors.accent.primary : colors.surface.border },
              ]}>
                {storyReplyAudience === opt && (
                  <View style={[styles.radioInner, { backgroundColor: colors.accent.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        <Section title={t("settings_extra.story_section_location")}>
          <SettingsRow label={t("settings_extra.story_location_label")} value={isPrivate ? t("settings_extra.story_location_hidden") : t("settings_extra.story_location_visible")} icon="location" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {isPrivate
              ? t("settings_extra.story_location_hint_private")
              : t("settings_extra.story_location_hint_public")}
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
  content: { padding: 16, paddingBottom: 32 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  sectionDesc: { fontSize: 14, marginBottom: 8, paddingHorizontal: 16 },
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
