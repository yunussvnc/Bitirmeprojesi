/**
 * Ana Ayarlar – Ayarlar ve hareketler
 * Instagram tarzı ana ayarlar ekranı.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { success, lightImpact } from "@/src/utils/haptics";
import { Section } from "@/src/components/layout/Section";
import { SettingsRow } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { BackButton } from "@/src/components/shared/navigation";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useAppStore } from "@/src/store/useAppStore";

export default function SettingsIndexScreen() {
  const { colors, isDark, setThemeMode, themeMode } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedIds = useAppStore((s) => s.savedIds);
  const [searchQuery, setSearchQuery] = useState("");

  const nav = (path: string) => () => {
    lightImpact();
    router.push(path as any);
  };

  const SECTIONS = [
    {
      title: "Hesabın",
      items: [
        { label: "Profili Düzenle", onPress: nav("/edit-profile"), icon: "person.crop.circle", showArrow: true, keywords: ["profili düzenle", "hesap", "isim", "ad", "kullanıcı", "isim değiştir"] },
        { label: "Şifre ve Güvenlik", onPress: nav("/settings/security"), icon: "shield.lefthalf.filled", showArrow: true, keywords: ["şifre ve güvenlik", "şifre", "güvenlik", "parola", "giriş"] },
        { label: "Kişisel Detaylar", onPress: nav("/settings/personal"), icon: "list.bullet.clipboard", showArrow: true, keywords: ["kişisel detaylar", "hesap bilgileri", "email", "e-posta", "telefon", "doğum tarihi"] },
      ],
    },
    {
      title: "Uygulamayı nasıl kullanıyorsun?",
      items: [
        {
          label: "Kaydedildi",
          value: `${savedIds.length}`,
          onPress: () => {
            lightImpact();
            router.replace("/(tabs)/saved" as any);
          },
          icon: "bookmark",
          showArrow: true,
          keywords: ["kaydedildi", "kaydedilenler", "koleksiyon", "koleksiyonlar", "yer imleri"],
        },
        { label: "Ziyaret Geçmişi", onPress: nav("/settings/activity"), icon: "clock.arrow.circlepath", showArrow: true, keywords: ["ziyaret geçmişi", "geçmiş", "ziyaretler", "activity", "hareketler", "hareketlerin"] },
        { label: "Bildirimler", onPress: nav("/notifications"), icon: "bell", showArrow: true, keywords: ["bildirimler", "sesler", "mesaj sesleri", "uyarılar"] },
        { label: "İçerik Tercihleri", onPress: nav("/settings/content"), icon: "slider.horizontal.3", showArrow: true, keywords: ["içerik tercihleri", "içerikler", "algoritma", "gösterim"] },
      ],
    },
    {
      title: "İçeriklerini kimler görebilir?",
      items: [
        { label: "Hesap Gizliliği", value: "Gizli", onPress: nav("/settings/privacy"), icon: "lock", showArrow: true, keywords: ["hesap gizliliği", "gizlilik", "gizli hesap", "herkese açık"] },
        { label: "Yakın Arkadaşlar", onPress: nav("/settings/close-friends"), icon: "star", showArrow: true, keywords: ["yakın arkadaşlar", "arkadaşlar", "close friends", "cf", "yeşil daire", "liste"] },
        { label: "Engellenenler", value: "3", onPress: nav("/settings/blocked-users"), icon: "nosign", showArrow: true, keywords: ["engellenenler", "engelli", "engel", "kısıtlı", "kişiler", "blok"] },
        { label: "Hikaye ve Konum Ayarları", onPress: nav("/settings/story"), icon: "location.slash", showArrow: true, keywords: ["hikaye ve konum ayarları", "hikaye gizliliği", "hikaye", "story"] },
      ],
    },
    {
      title: "Başkalarının seninle etkileşimleri",
      items: [
        { label: "Mesajlar ve Hikaye Yanıtları", onPress: nav("/settings/messages"), icon: "bubble.left.and.bubble.right", showArrow: true, keywords: ["mesajlar ve hikaye yanıtları", "mesaj", "dm", "istekler", "yanıt", "yanıtlar", "mesaj istekleri"] },
        { label: "Yorumlar", value: "Açık", onPress: nav("/settings/comments"), icon: "text.bubble", showArrow: true, keywords: ["yorumlar", "yorum kontrolü", "yorumları kapat"] },
        { label: "Kısıtlı Hesaplar", value: "0", onPress: nav("/settings/restricted"), icon: "person.crop.circle.badge.xmark", showArrow: true, keywords: ["kısıtlı hesaplar", "kısıtlamalar", "kısıtlı", "kısıtla", "sessize alınanlar"] },
        { label: "Gizlenen Sözcükler", onPress: nav("/settings/hidden-words"), icon: "eye.slash", showArrow: true, keywords: ["gizlenen sözcükler", "filtreler", "küfür", "sansür", "gizli"] },
      ],
    },
    {
      title: "Uygulaman ve medya",
      items: [
        { label: "Konum İzinleri", onPress: nav("/settings/location"), icon: "location", showArrow: true, keywords: ["konum izinleri", "lokasyon", "harita", "izin", "location"] },
        { label: "Medya Kalitesi", value: "Yüksek", onPress: nav("/settings/media-quality"), icon: "photo.circle", showArrow: true, keywords: ["medya kalitesi", "kalite", "yüksek kalite", "çözünürlük", "video", "fotoğraf"] },
        { label: "Dil Ayarları", value: "Türkçe", onPress: nav("/settings/language"), icon: "globe", showArrow: true, keywords: ["dil ayarları", "dil", "türkçe", "ingilizce", "zaman", "bölge", "language"] },
        { label: "Kamera Ayarları", onPress: nav("/settings/camera"), icon: "camera", showArrow: true, keywords: ["kamera ayarları", "kamera", "fotoğraf", "çekim", "kamera erişimi"] },
        {
          label: "Uygulama Teması",
          value: themeMode === "system" ? "Sistem" : isDark ? "Koyu" : "Açık",
          onPress: () => {
            lightImpact();
            Alert.alert("Tema", "Tema tercihinizi seçin", [
              { text: "İptal", style: "cancel" },
              { text: "Açık", onPress: () => { setThemeMode("light"); success(); } },
              { text: "Koyu", onPress: () => { setThemeMode("dark"); success(); } },
              { text: "Sistem", onPress: () => { setThemeMode("system"); success(); } },
            ]);
          },
          icon: "moon",
          showArrow: true,
          keywords: ["uygulama teması", "tema", "karanlık mod", "koyu mod", "aydınlık mod", "açık mod", "sistem", "dark mode"],
        },
      ],
    },
    {
      title: "Daha fazla bilgi ve destek",
      items: [
        { label: "Yardım Merkezi", onPress: nav("/settings/help"), icon: "questionmark.circle", showArrow: true, keywords: ["yardım", "destek", "yardım merkezi", "hata bildir", "iletişim", "sorun", "şikayet"] },
        { label: "Gizlilik Merkezi", onPress: nav("/settings/privacy-center"), icon: "shield", showArrow: true, keywords: ["gizlilik", "güvenlik", "gizlilik merkezi", "koşullar", "sözleşme"] },
        { label: "Hesap Durumu", value: "Aktif", onPress: nav("/settings/account-status"), icon: "checkmark.shield", showArrow: true, keywords: ["hesap durumu", "durum", "ban", "kısıtlama", "statü", "hesap"] },
        { label: "Hakkında", value: "v1.0.0", onPress: nav("/settings/about"), icon: "info.circle", showArrow: true, keywords: ["hakkında", "versiyon", "uygulama hakkında", "about", "bilgi", "açık kaynak", "sürüm"] },
      ],
    },
    {
      title: "Giriş",
      items: [
        {
          label: "Çıkış Yap",
          onPress: () => {
            lightImpact();
            Alert.alert("Çıkış", "Hesabınızdan çıkış yapmak istediğinize emin misiniz?", [
              { text: "İptal", style: "cancel" },
              { text: "Çıkış Yap", style: "destructive", onPress: () => router.replace("/login") },
            ]);
          },
          icon: "arrow.right.square",
          showArrow: false,
          keywords: ["çıkış", "oturumu kapat", "kapat", "çıkış yap", "log out", "hesap değiştir", "ekle"],
        },
      ],
    },
  ];

  const filteredSections = SECTIONS.map((section) => {
    const q = searchQuery.toLowerCase();
    const filteredItems = section.items.map((item) => {
      if (!q) return item; // arama yoksa her şey gelir, subtitle yok
      if (item.label.toLowerCase().includes(q)) return item; // isim eşleşmişse alt yazıya gerek yok

      // Keyword eşleşmesi varsa
      if (item.keywords) {
        const match = item.keywords.find(k => k.includes(q));
        if (match) {
          return { ...item, subtitle: `"${match}" içerir` };
        }
      }
      return null;
    }).filter(Boolean);

    return { ...section, items: filteredItems };
  }).filter((section) => section.items.length > 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.md }]}>
        <View style={styles.backBtn}>
          <BackButton
            onPress={() => {
              lightImpact();
              router.back();
            }}
          />
        </View>
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Ayarlar ve hareketler</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Araçlar ve hareketlerde ara"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            returnKeyType="search"
            cursorColor={colors.accent.primary}
          />
        </View>

        {filteredSections.map((section, idx) => (
          <Section key={idx} title={section.title}>
            {section.items.map((item, itemIdx) => {
              if (!item) return null;
              return (
                <SettingsRow
                  key={itemIdx}
                  label={item.label}
                  subtitle={(item as any).subtitle}
                  value={(item as any).value}
                  onPress={item.onPress}
                  showArrow={(item as any).showArrow}
                  icon={(item as any).icon as any}
                />
              );
            })}
          </Section>
        ))}

        {filteredSections.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>Arama sonucu bulunamadı.</Text>
          </View>
        )}
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
  title: { fontSize: 18, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: spacing.base, paddingBottom: spacing.xxl },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  emptyContainer: {
    paddingTop: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
