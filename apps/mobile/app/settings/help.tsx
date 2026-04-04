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

const FAQ_ITEMS = [
  {
    q: "Hesabımı nasıl gizli yapabilirim?",
    a: "Ayarlar > Hesap Gizliliği bölümünden hesabınızı gizli moda geçirebilirsiniz. Gizli hesaplarda yalnızca onayladığınız kişiler gönderilerinizi görebilir.",
  },
  {
    q: "Şifremi unuttum, ne yapmalıyım?",
    a: "Giriş ekranındaki 'Şifremi Unuttum' bağlantısına tıklayarak e-posta adresinize sıfırlama linki gönderebilirsiniz.",
  },
  {
    q: "Birini nasıl engellerim?",
    a: "Kullanıcının profiline gidin, sağ üst köşedeki menü simgesine (⋯) tıklayın ve 'Engelle' seçeneğini seçin. Engellenen kişiler sizinle iletişim kuramaz.",
  },
  {
    q: "Gönderilerimi kimler görebilir?",
    a: "Eğer hesabınız herkese açıksa herkes, gizli ise sadece takipçileriniz görebilir. Hikayelerinizi yakın arkadaşlar listesiyle sınırlandırabilirsiniz.",
  },
  {
    q: "Hesabımı nasıl silebilirim?",
    a: "Ayarlar > Şifre ve Güvenlik > Tehlike Bölgesi altından hesabınızı kalıcı olarak silebilirsiniz. Bu işlem geri alınamaz.",
  },
  {
    q: "Mekan nasıl eklerim?",
    a: "Harita ekranında istediğiniz konuma uzun basarak yeni mekan ekleme formunu açabilirsiniz. Eklenen mekanlar moderasyon sonrası yayına alınır.",
  },
];

export default function HelpCenterScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleEmail = () => {
    lightImpact();
    Linking.openURL("mailto:destek@asemos.com?subject=Asemos%20Destek%20Talebi");
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Yardım Merkezi</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Sıkça Sorulan Sorular">
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

        <Section title="Bize Ulaşın">
          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
            onPress={handleEmail}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: colors.accent.primary }]}>
              <IconSymbol name="envelope.fill" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text.primary }]}>Hata Bildir / Destek Talebi</Text>
              <Text style={[styles.contactDesc, { color: colors.text.tertiary }]}>destek@asemos.com</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.contactCard, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
            onPress={() => { lightImpact(); Linking.openURL("mailto:oneri@asemos.com"); }}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#FFB347" }]}>
              <IconSymbol name="lightbulb.fill" size={20} color="#fff" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactTitle, { color: colors.text.primary }]}>Öneride Bulun</Text>
              <Text style={[styles.contactDesc, { color: colors.text.tertiary }]}>oneri@asemos.com</Text>
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
