/**
 * Kamera Ayarları
 * Instagram referansı: Hikaye/Reels/Canlı modları, kontroller, film rulosu
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { BackButton } from "@/src/components/shared/navigation";
import { useSettingsStore, type CameraToolbarSide } from "@/src/store/useSettingsStore";
import { lightImpact, success } from "@/src/utils/haptics";

const getToolbarLabels = (t: any): Record<CameraToolbarSide, string> => ({
  left: t("settings_camera.left", "Sol Taraf"),
  right: t("settings_camera.right", "Sağ Taraf"),
});

export default function CameraSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const cameraDefaultFront = useSettingsStore((s) => s.cameraDefaultFront);
  const cameraToolbarSide = useSettingsStore((s) => s.cameraToolbarSide);
  const setCameraDefaultFront = useSettingsStore((s) => s.setCameraDefaultFront);
  const setCameraToolbarSide = useSettingsStore((s) => s.setCameraToolbarSide);

  const handleToolbarSide = () => {
    lightImpact();
    Alert.alert(t("settings_extra.cam_toolbar"), t("settings_extra.cam_toolbar_desc"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("settings_extra.cam_toolbar_left"),
        onPress: () => {
          setCameraToolbarSide("left");
          success();
        },
      },
      {
        text: t("settings_extra.cam_toolbar_right"),
        onPress: () => {
          setCameraToolbarSide("right");
          success();
        },
      },
    ]);
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <BackButton onPress={() => router.back()} />
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_extra.cam_title")}</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_extra.cam_section_story")}>
          <Text style={[styles.sectionHint, { color: colors.text.tertiary }]}>
            {t("settings_extra.cam_section_story_hint")}
          </Text>
        </Section>

        <Section title={t("settings_extra.cam_section_controls")}>
          <SettingsRow
            label={t("settings_extra.cam_front_default")}
            value={cameraDefaultFront}
            switch
            onValueChange={setCameraDefaultFront}
            icon="camera.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>{t("settings_extra.cam_hint")}</Text>
          <SettingsRow label={t("settings_camera.toolbar", "Kamera Araç Çubuğu")} value={getToolbarLabels(t)[cameraToolbarSide]} onPress={handleToolbarSide} showArrow icon="slider.horizontal.3" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_extra.cam_toolbar_hint")}
          </Text>
        </Section>

        <Section title={t("settings_extra.cam_section_roll")}>
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_extra.cam_section_roll_hint")}
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
  sectionHint: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 8,
    marginLeft: 16,
  },
});
