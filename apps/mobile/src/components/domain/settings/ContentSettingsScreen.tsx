/**
 * İçerik Tercihleri
 * Haritada gösterilecek içerik türleri, medya kalitesi
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { BackButton } from "@/src/components/shared/navigation";
import { useSettingsStore, type UploadQuality } from "@/src/store/useSettingsStore";
import { lightImpact, success } from "@/src/utils/haptics";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

const UPLOAD_LABEL_KEYS: Record<UploadQuality, string> = {
  high: "content_settings.quality_high",
  auto: "content_settings.quality_auto",
  data_saver: "content_settings.quality_saver",
};

export default function ContentSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const mapShowStories = useSettingsStore((s) => s.mapShowStories);
  const mapShowPosts = useSettingsStore((s) => s.mapShowPosts);
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);
  const setMapShowStories = useSettingsStore((s) => s.setMapShowStories);
  const setMapShowPosts = useSettingsStore((s) => s.setMapShowPosts);
  const setUploadQuality = useSettingsStore((s) => s.setUploadQuality);

  const handleUploadQuality = () => {
    lightImpact();
    Alert.alert(t("settings_extra.content_upload_title"), t("settings_extra.content_upload_desc"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings_extra.content_quality_high"),
        onPress: () => {
          setUploadQuality("high");
          success();
        },
      },
      {
        text: t("settings_extra.content_quality_saver"),
        onPress: () => {
          setUploadQuality("data_saver");
          success();
        },
      },
    ]);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_extra.content_title")}</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_extra.content_section_map")}>
          <SettingsRow
            label={t("settings_extra.content_show_stories")}
            value={mapShowStories}
            switch
            onValueChange={setMapShowStories}
            icon="circle.hexagongrid.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>{t("settings_extra.content_hint_ring")}</Text>
          <SettingsRow
            label={t("settings_extra.content_show_posts")}
            value={mapShowPosts}
            switch
            onValueChange={setMapShowPosts}
            icon="photo.on.rectangle.angled"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>{t("settings_extra.content_hint_grid")}</Text>
        </Section>

        <Section title={t("settings_extra.content_section_quality")}>
          <SettingsRow label={t("settings_extra.content_upload_quality")} value={t(UPLOAD_LABEL_KEYS[uploadQuality])} onPress={handleUploadQuality} showArrow icon="photo" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_extra.content_quality_hint")}
          </Text>
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 44, minHeight: 44, alignItems: "flex-start", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  container: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 16,
  },
});
