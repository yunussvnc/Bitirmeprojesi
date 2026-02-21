/**
 * Ana Ayarlar – Ayarlar ve hareketler
 * Instagram tarzı ana ayarlar ekranı.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { success , lightImpact } from "@/src/utils/haptics";
import { Section } from "@/components/layout/Section";
import { SettingsRow } from "@/components/ui";
import { createTextStyle, spacing } from "@/constants/design";
import { useAppStore } from "@/src/store/useAppStore";

export default function SettingsIndexScreen() {
  const { colors, isDark, setThemeMode, themeMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedIds = useAppStore((s) => s.savedIds);

  const nav = (path: string) => () => {
    lightImpact();
    router.push(path as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent.primary }]}>Geri</Text>
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Ayarlar</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hesabın */}
        <Section title="Hesabın">
          <SettingsRow label="Profili düzenle" onPress={nav("/edit-profile")} showArrow icon="person.fill" />
        </Section>

        {/* Nasıl kullanıyorsun */}
        <Section title="Uygulamayı nasıl kullanıyorsun?">
          <SettingsRow
            label="Kaydedilenler"
            value={`${savedIds.length}`}
            onPress={() => {
              lightImpact();
              router.replace("/(tabs)/saved" as any);
            }}
            showArrow
            icon="bookmark"
          />
          <SettingsRow label="Arşiv" value="Yakında" showArrow icon="square.grid.2x2.fill" />
          <SettingsRow label="Bildirimler" onPress={nav("/notifications")} showArrow icon="bell.fill" />
        </Section>

        {/* İçeriklerini kimler görebilir */}
        <Section title="İçeriklerini kimler görebilir?">
          <SettingsRow label="Hesap gizliliği" value="Yakında" showArrow icon="lock.fill" />
          <SettingsRow label="Yakın Arkadaşlar" value="Yakında" showArrow icon="star.fill" />
        </Section>

        {/* Hikaye, canlı yayın ve konum */}
        <Section title="Hikaye, canlı yayın ve konum">
          <SettingsRow label="Hikaye ayarları" onPress={nav("/settings/story")} showArrow icon="circle.hexagongrid.fill" />
          <SettingsRow label="İçerik tercihleri" onPress={nav("/settings/content")} showArrow icon="photo.on.rectangle.angled" />
          <SettingsRow label="Kamera ayarları" onPress={nav("/settings/camera")} showArrow icon="camera.fill" />
        </Section>

        {/* Gönderi, Hikaye ve Reels */}
        <Section title="Gönderi, hikaye ve Reels">
          <SettingsRow label="Gönderi ayarları" value="Yakında" showArrow icon="photo" />
          <SettingsRow label="Reels ayarları" value="Yakında" showArrow icon="play.circle.fill" />
        </Section>

        {/* Uygulama */}
        <Section title="Uygulama">
          <SettingsRow
            label="Tema"
            value={themeMode === "system" ? "Sistem" : isDark ? "Koyu" : "Açık"}
            onPress={() => {
              lightImpact();
              Alert.alert(
                "Tema",
                "Tema tercihinizi seçin",
                [
                  { text: "İptal", style: "cancel" },
                  { text: "Açık", onPress: () => { setThemeMode("light"); success(); } },
                  { text: "Koyu", onPress: () => { setThemeMode("dark"); success(); } },
                  { text: "Sistem", onPress: () => { setThemeMode("system"); success(); } },
                ]
              );
            }}
            showArrow
            icon="gear"
          />
        </Section>

        {/* Yardım */}
        <Section title="Yardım ve destek">
          <SettingsRow label="Yardım" value="Yakında" showArrow icon="questionmark.circle.fill" />
          <SettingsRow label="Uygulama sürümü" value="1.0.0" showArrow={false} icon="info.circle.fill" />
        </Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { minWidth: 60, alignItems: "flex-start" },
  backText: { fontSize: 16, fontWeight: "500" },
  title: { fontSize: 18, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
});
