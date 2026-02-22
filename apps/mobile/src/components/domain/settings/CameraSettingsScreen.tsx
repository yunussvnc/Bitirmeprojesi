/**
 * Kamera Ayarları
 * Instagram referansı: Hikaye/Reels/Canlı modları, kontroller, film rulosu
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { useSettingsStore, type CameraToolbarSide } from "@/src/store/useSettingsStore";
import { lightImpact, success } from "@/src/utils/haptics";

const TOOLBAR_LABELS: Record<CameraToolbarSide, string> = {
  left: "Sol taraf",
  right: "Sağ taraf",
};

export default function CameraSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraDefaultFront = useSettingsStore((s) => s.cameraDefaultFront);
  const cameraToolbarSide = useSettingsStore((s) => s.cameraToolbarSide);
  const setCameraDefaultFront = useSettingsStore((s) => s.setCameraDefaultFront);
  const setCameraToolbarSide = useSettingsStore((s) => s.setCameraToolbarSide);

  const handleToolbarSide = () => {
    lightImpact();
    Alert.alert("Kamera araç çubuğu", "Kamera araç çubuğunun ekranın hangi tarafında olmasını istediğini seç.", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sol taraf",
        onPress: () => {
          setCameraToolbarSide("left");
          success();
        },
      },
      {
        text: "Sağ taraf",
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
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.accent.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Kamera ayarları</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Hikaye ve içerik">
          <Text style={[styles.sectionHint, { color: colors.text.tertiary }]}>
            Hikaye oluştururken galeriden medya seçiliyor. Uygulama içi kamera yakında eklenecek.
          </Text>
        </Section>

        <Section title="Kontroller">
          <SettingsRow
            label="Ön kamerayı varsayılan yap"
            value={cameraDefaultFront}
            switch
            onValueChange={setCameraDefaultFront}
            icon="camera.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>Hikaye veya video kaydederken ön kamera ile başla</Text>
          <SettingsRow label="Kamera araç çubuğu" value={TOOLBAR_LABELS[cameraToolbarSide]} onPress={handleToolbarSide} showArrow icon="slider.horizontal.3" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Kamera araç çubuğunun ekranın hangi tarafında olacağını seç
          </Text>
        </Section>

        <Section title="Film rulosu">
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Hikaye ve gönderi paylaşırken cihazının galerisine erişim istenecek. Konum ve medya kalitesi verileri, mekan etiketlemesi için kullanılabilir.
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
