/**
 * Hikaye Ayarları
 * Instagram referansı: Görüntüleyenler, Kaydetme, Yanıt verme
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
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { lightImpact } from "@/src/utils/haptics";

export default function StorySettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const storySaveToArchive = useSettingsStore((s) => s.storySaveToArchive);
  const storySaveToCameraRoll = useSettingsStore((s) => s.storySaveToCameraRoll);
  const setStorySaveToArchive = useSettingsStore((s) => s.setStorySaveToArchive);
  const setStorySaveToCameraRoll = useSettingsStore((s) => s.setStorySaveToCameraRoll);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.accent.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Hikaye ayarları</Text>
        <View style={styles.backBtn} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Görüntüleyenler">
          <SettingsRow label="Hikayeyi şu kişilerden gizle" value="Yakında" icon="person.2.fill" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>Hikayeni ve canlı videolarını belirli kişilerden gizle</Text>
          <SettingsRow label="Yakın Arkadaşlar" value="Yakında" icon="star.fill" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>Hikayeni sadece belirli kişilerle paylaş</Text>
        </Section>

        <Section title="Kaydetme">
          <SettingsRow
            label="Hikayeyi arşive kaydet"
            value={storySaveToArchive}
            switch
            onValueChange={setStorySaveToArchive}
            icon="square.grid.2x2.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            24 saat sonra silinen hikayeler arşive taşınır (sunucu tarafı gelecek)
          </Text>
          <SettingsRow
            label="Hikayeyi film rulosuna kaydet"
            value={storySaveToCameraRoll}
            switch
            onValueChange={setStorySaveToCameraRoll}
            icon="photo"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Fotoğrafları ve videoları otomatik olarak telefonunun film rulosuna kaydet
          </Text>
        </Section>

        <Section title="Yanıt verme">
          <SettingsRow label="Mesaj yanıtlarına izin ver" value="Yakında" icon="bubble.right" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>Hikayene kimlerin yanıt verebileceğini seç</Text>
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
