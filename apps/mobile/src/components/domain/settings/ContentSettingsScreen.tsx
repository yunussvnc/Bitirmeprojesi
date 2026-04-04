/**
 * İçerik Tercihleri
 * Haritada gösterilecek içerik türleri, medya kalitesi
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
import { useSettingsStore, type UploadQuality } from "@/src/store/useSettingsStore";
import { lightImpact, success } from "@/src/utils/haptics";

const UPLOAD_LABELS: Record<UploadQuality, string> = {
  high: "Yüksek",
  auto: "Otomatik",
  data_saver: "Veri tasarrufu",
};

export default function ContentSettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapShowStories = useSettingsStore((s) => s.mapShowStories);
  const mapShowPosts = useSettingsStore((s) => s.mapShowPosts);
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);
  const setMapShowStories = useSettingsStore((s) => s.setMapShowStories);
  const setMapShowPosts = useSettingsStore((s) => s.setMapShowPosts);
  const setUploadQuality = useSettingsStore((s) => s.setUploadQuality);

  const handleUploadQuality = () => {
    lightImpact();
    Alert.alert("Yükleme kalitesi", "Hikaye ve gönderi paylaşırken kullanılacak medya kalitesi", [
      { text: "İptal", style: "cancel" },
      {
        text: "Yüksek",
        onPress: () => {
          setUploadQuality("high");
          success();
        },
      },
      {
        text: "Veri tasarrufu",
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
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.accent.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>İçerik tercihleri</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Harita / Keşfet">
          <SettingsRow
            label="Mekanda hikayeleri göster"
            value={mapShowStories}
            switch
            onValueChange={setMapShowStories}
            icon="circle.hexagongrid.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>{`Haritada mekan seçildiğinde hikaye ring'leri görünür`}</Text>
          <SettingsRow
            label="Mekanda gönderileri göster"
            value={mapShowPosts}
            switch
            onValueChange={setMapShowPosts}
            icon="photo.on.rectangle.angled"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>Haritada mekan seçildiğinde post grid görünür</Text>
        </Section>

        <Section title="Medya kalitesi">
          <SettingsRow label="Yükleme kalitesi" value={UPLOAD_LABELS[uploadQuality]} onPress={handleUploadQuality} showArrow icon="photo" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Yüksek: Daha iyi görüntü kalitesi, daha fazla veri. Veri tasarrufu: Düşük kalite, az veri.
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
