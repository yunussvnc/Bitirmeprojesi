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

const AUDIENCE_LABELS: Record<Audience, string> = {
  everyone: "Herkes",
  followers: "Takipçiler",
  off: "Kapalı",
};

export default function CommentsSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const defaultDisabled = useSettingsStore((s) => s.defaultCommentsDisabled);
  const audience = useSettingsStore((s) => s.commentAllowedAudience);
  const setDefaultDisabled = useSettingsStore((s) => s.setDefaultCommentsDisabled);
  const setAudience = useSettingsStore((s) => s.setCommentAllowedAudience);

  const audienceOptions: Audience[] = ["everyone", "followers", "off"];

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Yorumlar</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Yorum Kontrolleri">
          <SettingsRow
            label="Varsayılan olarak yorumları kapat"
            value={defaultDisabled}
            switch
            onValueChange={(v: boolean) => { setDefaultDisabled(v); success(); }}
            icon="text.bubble"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Açıldığında, yeni paylaşımlarında yorumlar varsayılan olarak kapalı olur. Her paylaşımda bunu ayrıca değiştirebilirsin.
          </Text>
        </Section>

        <Section title="Kimler yorum yapabilir?">
          {audienceOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); setAudience(opt); success(); }}
              activeOpacity={0.6}
            >
              <Text style={[styles.radioLabel, { color: colors.text.primary }]}>
                {AUDIENCE_LABELS[opt]}
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
            Takipçiler: Yalnızca seni takip eden kişiler yorum yapabilir. Kapalı: Hiç kimse yorum yapamaz.
          </Text>
        </Section>

        <Section title="Yorum Filtresi">
          <SettingsRow
            label="Uygunsuz yorumları gizle"
            value={true}
            switch
            icon="shield.lefthalf.filled"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Yapay zekâ destekli filtre, spam ve uygunsuz içerikli yorumları otomatik olarak gizler.
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
