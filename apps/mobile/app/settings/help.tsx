/**
 * Yardım Merkezi — SSS Accordion + İletişim
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { Section } from "@/src/components/layout/Section";
import { useTranslation } from "react-i18next";


export default function HelpCenterScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const FAQ_ITEMS = Array.from({ length: 6 }).map((_, idx) => ({
    q: t(`settings_help.faq_${idx}_q`),
    a: t(`settings_help.faq_${idx}_a`),
  }));

  const handleEmail = () => {
    lightImpact();
    Linking.openURL("mailto:asemos.tr@gmail.com?subject=Asemos%20Destek%20Talebi");
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t("settings_help.title", "Yardım Merkezi")}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title={t("settings_help.faqs", "Sıkça Sorulan Sorular")}>
          {FAQ_ITEMS.map((item, idx) => (
            <View key={idx}>
              <TouchableOpacity
                style={[styles.faqRow, { borderBottomColor: colors.surface.border }]}
                onPress={() => { lightImpact(); setOpenIndex(openIndex === idx ? null : idx); }}
                activeOpacity={0.6}
              >
                <Text style={[styles.faqQuestion, { color: colors.text.primary }]}>{item.q}</Text>
                <IconSymbol
                  name={openIndex === idx ? "chevron.up" : "chevron.down"}
                  size={16}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
              {openIndex === idx && (
                <View style={[styles.faqAnswer, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }]}>
                  <Text style={[styles.faqAnswerText, { color: colors.text.secondary }]}>{item.a}</Text>
                </View>
              )}
            </View>
          ))}
        </Section>

        <Section title={t("settings_help.contact", "Bize Ulaşın")}>
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: colors.accent.primary }]}>
              <IconSymbol name="envelope.fill" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text.primary }]}>{t("settings_help.report_problem", "Hata Bildir / Destek Talebi")}</Text>
              <Text style={[styles.contactDesc, { color: colors.text.tertiary }]}>asemos.tr@gmail.com</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
            onPress={() => { lightImpact(); Linking.openURL("mailto:oneri@asemos.tr"); }}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#FFB347" }]}>
              <IconSymbol name="lightbulb.fill" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text.primary }]}>{t("settings_help.support", "Öneride Bulun")}</Text>
              <Text style={[styles.contactDesc, { color: colors.text.tertiary }]}>oneri@asemos.tr</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
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
  faqRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  faqQuestion: { flex: 1, fontSize: 15, fontWeight: "600", marginRight: 12 },
  faqAnswer: { padding: 16, borderRadius: 8, marginHorizontal: 16, marginBottom: 4 },
  faqAnswerText: { fontSize: 14, lineHeight: 22 },
  contactCard: {
    flexDirection: "row", alignItems: "center", padding: 14,
    borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 12,
  },
  contactIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15, fontWeight: "600" },
  contactDesc: { fontSize: 13, marginTop: 2 },
});
