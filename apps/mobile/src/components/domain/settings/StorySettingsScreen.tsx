/**
 * Hikaye ve Konum Ayarları
 * Görüntüleyenler, Kaydetme, Yanıt verme — tümü interaktif
 */

import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useSettingsStore, type Audience } from "@/src/store/useSettingsStore";
import { lightImpact, success } from "@/src/utils/haptics";

const AUDIENCE_LABELS: Record<Audience, string> = {
  everyone: "Herkes",
  followers: "Takipçiler",
  off: "Kapalı",
};

export default function StorySettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const storySaveToArchive = useSettingsStore((s) => s.storySaveToArchive);
  const storySaveToCameraRoll = useSettingsStore((s) => s.storySaveToCameraRoll);
  const storyReplyAudience = useSettingsStore((s) => s.storyReplyAudience);
  const isPrivate = useSettingsStore((s) => s.isPrivateAccount);
  const closeFriendCount = useSettingsStore((s) => s.closeFriendIds.length);

  const setStorySaveToArchive = useSettingsStore((s) => s.setStorySaveToArchive);
  const setStorySaveToCameraRoll = useSettingsStore((s) => s.setStorySaveToCameraRoll);
  const setStoryReply = useSettingsStore((s) => s.setStoryReplyAudience);

  const replyOptions: Audience[] = ["everyone", "followers", "off"];

  const handleHideFrom = () => {
    lightImpact();
    Alert.alert(
      "Hikayeyi Gizle",
      "Belirli kişilerden hikayelerinizi gizlemek için profil ayarlarından düzenleme yapabilirsiniz.",
      [{ text: "Tamam" }]
    );
  };

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color={colors.accent.primary} />
        </TouchableOpacity>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Hikaye Ayarları</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Section title="Görüntüleyenler">
          <SettingsRow
            label="Hikayeyi gizle"
            value="Düzenle"
            showArrow
            icon="person.2.fill"
            onPress={handleHideFrom}
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Hikayeni ve canlı videolarını belirli kişilerden gizle
          </Text>
          <SettingsRow
            label="Yakın Arkadaşlar"
            value={`${closeFriendCount} kişi`}
            showArrow
            icon="star.fill"
            onPress={() => { lightImpact(); router.push("/settings/close-friends" as any); }}
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Hikayeni sadece belirli kişilerle paylaş
          </Text>
        </Section>

        <Section title="Kaydetme">
          <SettingsRow
            label="Hikayeyi arşive kaydet"
            value={storySaveToArchive}
            switch
            onValueChange={(v: boolean) => { setStorySaveToArchive(v); success(); }}
            icon="square.grid.2x2.fill"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            24 saat sonra süresi dolan hikayeler arşive taşınır
          </Text>
          <SettingsRow
            label="Hikayeyi film rulosuna kaydet"
            value={storySaveToCameraRoll}
            switch
            onValueChange={(v: boolean) => { setStorySaveToCameraRoll(v); success(); }}
            icon="photo"
          />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            Fotoğrafları ve videoları otomatik olarak telefonun film rulosuna kaydet
          </Text>
        </Section>

        <Section title="Yanıt Verme">
          <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
            Hikayelerine kimlerin yanıt verebileceğini seç
          </Text>
          {replyOptions.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.radioRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); setStoryReply(opt); success(); }}
              activeOpacity={0.6}
            >
              <Text style={[styles.radioLabel, { color: colors.text.primary }]}>
                {AUDIENCE_LABELS[opt]}
              </Text>
              <View style={[
                styles.radio,
                { borderColor: storyReplyAudience === opt ? colors.accent.primary : colors.surface.border },
              ]}>
                {storyReplyAudience === opt && (
                  <View style={[styles.radioInner, { backgroundColor: colors.accent.primary }]} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </Section>

        <Section title="Konum & Mekan">
          <SettingsRow label="Hikaye konumu" value={isPrivate ? "Gizli" : "Görünür"} icon="location" />
          <Text style={[styles.hint, { color: colors.text.tertiary }]}>
            {isPrivate
              ? "Gizli hesaplarda hikayeler haritada görünmez"
              : "Hikayeleriniz paylaşıldığı mekanın harita sayfasında görünebilir"}
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
  content: { padding: 16, paddingBottom: 32 },
  hint: { fontSize: 13, lineHeight: 18, marginTop: -4, marginBottom: 8, marginLeft: 16 },
  sectionDesc: { fontSize: 14, marginBottom: 8, paddingHorizontal: 16 },
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
