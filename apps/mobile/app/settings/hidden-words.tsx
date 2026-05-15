/**
 * Gizlenen Sözcükler — Yorum filtreleme ve özel kelime listesi
 */

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact, success } from "@/src/utils/haptics";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useTranslation } from "react-i18next";

export default function HiddenWordsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const hideOffensive = useSettingsStore((s) => s.hideOffensiveWords);
  const hiddenWords = useSettingsStore((s) => s.hiddenWords);
  const setHideOffensive = useSettingsStore((s) => s.setHideOffensiveWords);
  const addWord = useSettingsStore((s) => s.addHiddenWord);
  const removeWord = useSettingsStore((s) => s.removeHiddenWord);

  const [newWord, setNewWord] = useState("");

  const handleAdd = () => {
    const word = newWord.trim();
    if (!word) return;
    if (hiddenWords.includes(word.toLowerCase())) {
      Alert.alert("Bilgi", t("settings_hidden.already_added", "Bu sözcük zaten listede."));
      return;
    }
    addWord(word);
    setNewWord("");
    success();
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_hidden.title", "Gizlenen Sözcükler")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_hidden.auto_filter", "Otomatik Filtre")}>
          <SettingsRow
            label={t("settings_hidden.hide_offensive", "Rahatsız edici sözcükleri gizle")}
            value={hideOffensive}
            switch
            onValueChange={(v: boolean) => { setHideOffensive(v); success(); }}
            icon="shield.lefthalf.filled"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {t("settings_hidden.hide_desc", "Küfür, hakaret ve spam içerikli yorumlar otomatik olarak gizlenir. Bu yorum silinmez, sadece diğer kullanıcılardan saklanır.")}
          </Text>
        </Section>

        <Section title={t("settings_hidden.custom_list", "Özel Sözcük Listesi")}>
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            {t("settings_hidden.custom_desc", "Aşağıya eklediğin sözcükleri içeren yorumlar otomatik olarak gizlenir.")}
          </Text>

          {/* Add word input */}
          <View style={[styles.addRow, { borderColor: colors.surface.border }]}>
            <TextInput
              style={[styles.addInput, { color: colors.text.primary, backgroundColor: colors.surface.elevated }]}
              placeholder={t("settings_hidden.add_placeholder", "Sözcük ekle...")}
              placeholderTextColor={colors.text.tertiary}
              value={newWord}
              onChangeText={setNewWord}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.accent.primary, opacity: newWord.trim() ? 1 : 0.4 }]}
              onPress={handleAdd}
              disabled={!newWord.trim()}
              activeOpacity={0.7}
            >
              <IconSymbol name="plus" size={18} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Word chips */}
          {hiddenWords.length > 0 ? (
            <View style={styles.chipContainer}>
              {hiddenWords.map((word) => (
                <View key={word} style={[styles.chip, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)" }]}>
                  <Text style={[styles.chipText, { color: colors.text.primary }]}>{word}</Text>
                  <TouchableOpacity
                    onPress={() => { lightImpact(); removeWord(word); }}
                    hitSlop={8}
                  >
                    <IconSymbol name="xmark.circle.fill" size={16} color={colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyChips}>
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                {t("settings_hidden.empty_chips", "Henüz özel sözcük eklenmedi")}
              </Text>
            </View>
          )}
        </Section>

        <View style={styles.tipBox}>
          <IconSymbol name="lightbulb" size={16} color={colors.accent.primary} />
          <Text style={[styles.tipText, { color: colors.text.tertiary }]}>
            {t("settings_hidden.tip", "İpucu: Sözcükler büyük/küçük harf duyarsız olarak eşleştirilir.")}
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
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  sectionDesc: { fontSize: 14, lineHeight: 20, marginBottom: 12, paddingHorizontal: 16 },
  addRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, marginBottom: 12,
  },
  addInput: {
    flex: 1, fontSize: 15, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10,
  },
  addBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  chipContainer: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  chipText: { fontSize: 14, fontWeight: "500" },
  emptyChips: { paddingHorizontal: 16, paddingVertical: 20, alignItems: "center" },
  emptyText: { fontSize: 14 },
  tipBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingTop: 16, paddingHorizontal: 4,
  },
  tipText: { flex: 1, fontSize: 13, lineHeight: 18 },
});
