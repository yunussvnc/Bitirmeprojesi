/**
 * Dil Ayarları — Uygulama dili seçimi
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore, type AppLanguage } from "@/src/store/useSettingsStore";

const LANG_OPTIONS: { key: AppLanguage; label: string; flag: string; native: string }[] = [
  { key: "tr", label: "Türkçe", flag: "🇹🇷", native: "Türkçe" },
  { key: "en", label: "English", flag: "🇬🇧", native: "English" },
];

export default function LanguageSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const handleSelect = (lang: AppLanguage) => {
    if (lang === language) return;
    lightImpact();
    Alert.alert(
      "Dil Değiştir",
      `Uygulama dili "${LANG_OPTIONS.find(l => l.key === lang)?.label}" olarak değiştirilecek.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Değiştir",
          onPress: () => { setLanguage(lang); success(); },
        },
      ]
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Dil Ayarları</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Uygulama Dili">
          {LANG_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.langRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => handleSelect(opt.key)}
              activeOpacity={0.6}
            >
              <Text style={styles.flag}>{opt.flag}</Text>
              <View style={styles.langInfo}>
                <Text style={[styles.langLabel, { color: colors.text.primary }]}>{opt.label}</Text>
                <Text style={[styles.langNative, { color: colors.text.tertiary }]}>{opt.native}</Text>
              </View>
              <View style={[
                styles.radio,
                { borderColor: language === opt.key ? colors.accent.primary : colors.surface.border },
              ]}>
                {language === opt.key && (
                  <View style={[styles.radioInner, { backgroundColor: colors.accent.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        <View style={[styles.noteBox, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }]}>
          <IconSymbol name="info.circle" size={16} color={colors.text.tertiary} />
          <Text style={[styles.noteText, { color: colors.text.tertiary }]}>
            Dil değişikliği bazı ekranlarda uygulamanın yeniden başlatılmasını gerektirebilir.
          </Text>
        </View>
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
  langRow: {
    flexDirection: "row", alignItems: "center", paddingVertical: 14,
    paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  flag: { fontSize: 28 },
  langInfo: { flex: 1 },
  langLabel: { fontSize: 16, fontWeight: "600" },
  langNative: { fontSize: 13, marginTop: 2 },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  noteBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, marginTop: 16,
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
