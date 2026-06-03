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
import { useAuthStore } from "@/src/store/useAuthStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useMessagesStore } from "@/src/store/useMessagesStore";
import { useChatMessagesStore } from "@/src/store/useChatMessagesStore";
import { useNotificationStore } from "@/src/store/useNotificationStore";
import { useTranslation } from "react-i18next";

export default function SettingsIndexScreen() {
  const { colors, isDark, setThemeMode, themeMode } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const savedIds = useAppStore((s) => s.savedIds);
  const isPrivate = useSettingsStore((s) => s.isPrivateAccount);
  const commentAudience = useSettingsStore((s) => s.commentAllowedAudience);
  const restrictedCount = useSettingsStore((s) => s.restrictedUserIds.length);
  const language = useSettingsStore((s) => s.language);
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);
  const qualityLabel = uploadQuality === 'high' ? t('settings_main.quality_high') : uploadQuality === 'auto' ? t('settings_main.quality_auto') : t('settings_main.quality_saver');
  const [searchQuery, setSearchQuery] = useState("");

  const nav = (path: string) => () => {
    lightImpact();
    router.push(path as any);
  };

  const SECTIONS = [
    {
      title: t('settings_main.section_account'),
      items: [
        { label: t('settings_main.edit_profile'), onPress: nav("/edit-profile"), icon: "person.crop.circle", showArrow: true, keywords: ["profili düzenle", "hesap", "edit profile"] },
        { label: t('settings_main.security'), onPress: nav("/settings/security"), icon: "shield.lefthalf.filled", showArrow: true, keywords: ["şifre", "güvenlik", "security", "password"] },
        { label: t('settings_main.personal'), onPress: nav("/settings/personal"), icon: "list.bullet.clipboard", showArrow: true, keywords: ["kişisel", "personal", "email", "phone"] },
      ],
    },
    {
      title: t('settings_main.section_usage'),
      items: [
        {
          label: t('settings_main.saved'),
          value: `${savedIds.length}`,
          onPress: () => {
            lightImpact();
            router.replace("/(tabs)/saved" as any);
          },
          icon: "bookmark",
          showArrow: true,
          keywords: ["kaydedildi", "saved", "bookmark"],
        },
        { label: t('settings_main.visit_history'), onPress: nav("/settings/activity"), icon: "clock.arrow.circlepath", showArrow: true, keywords: ["geçmiş", "history", "activity"] },
        { label: t('settings_main.notifications'), onPress: nav("/notifications"), icon: "bell", showArrow: true, keywords: ["bildirimler", "notifications"] },
        { label: t('settings_main.content_prefs'), onPress: nav("/settings/content"), icon: "slider.horizontal.3", showArrow: true, keywords: ["içerik", "content", "preferences"] },
      ],
    },
    {
      title: t('settings_main.section_visibility'),
      items: [
        { label: t('settings_main.account_privacy'), value: isPrivate ? t('settings_main.private') : t('settings_main.public'), onPress: nav("/settings/privacy"), icon: "lock", showArrow: true, keywords: ["gizlilik", "privacy"] },
        { label: t('settings_main.blocked'), onPress: nav("/settings/blocked-users"), icon: "nosign", showArrow: true, keywords: ["engellenen", "blocked"] },
        { label: t('settings_main.story_location'), onPress: nav("/settings/story"), icon: "location.slash", showArrow: true, keywords: ["hikaye", "story", "location"] },
      ],
    },
    {
      title: t('settings_main.section_interactions'),
      items: [
        { label: t('settings_main.messages_replies'), onPress: nav("/settings/messages"), icon: "bubble.left.and.bubble.right", showArrow: true, keywords: ["mesaj", "messages", "replies"] },
        { label: t('settings_main.comments'), value: commentAudience === 'everyone' ? t('settings_main.public') : commentAudience === 'followers' ? t('settings_main.followers_only') : t('settings_main.off'), onPress: nav("/settings/comments"), icon: "text.bubble", showArrow: true, keywords: ["yorum", "comments"] },
        { label: t('settings_main.restricted'), value: `${restrictedCount}`, onPress: nav("/settings/restricted"), icon: "person.crop.circle.badge.xmark", showArrow: true, keywords: ["kısıtlı", "restricted"] },
        { label: t('settings_main.hidden_words'), onPress: nav("/settings/hidden-words"), icon: "eye.slash", showArrow: true, keywords: ["gizlenen", "hidden words"] },
      ],
    },
    {
      title: t('settings_main.section_app'),
      items: [
        { label: t('settings_main.location_perms'), onPress: nav("/settings/location"), icon: "location", showArrow: true, keywords: ["konum", "location"] },
        { label: t('settings_main.media_quality'), value: qualityLabel, onPress: nav("/settings/media-quality"), icon: "photo.circle", showArrow: true, keywords: ["kalite", "quality", "media"] },
        { label: t('settings_main.language'), value: language === 'tr' ? 'Türkçe' : 'English', onPress: nav("/settings/language"), icon: "globe", showArrow: true, keywords: ["dil", "language"] },
        { label: t('settings_main.camera'), onPress: nav("/settings/camera"), icon: "camera", showArrow: true, keywords: ["kamera", "camera"] },
        {
          label: t('settings_main.theme'),
          value: themeMode === "system" ? t('settings_main.theme_system') : isDark ? t('settings_main.theme_dark') : t('settings_main.theme_light'),
          onPress: () => {
            lightImpact();
            Alert.alert(t('settings_main.theme'), t('settings_main.theme_select'), [
              { text: t('common.cancel'), style: "cancel" },
              { text: t('settings_main.theme_light'), onPress: () => { setThemeMode("light"); success(); } },
              { text: t('settings_main.theme_dark'), onPress: () => { setThemeMode("dark"); success(); } },
              { text: t('settings_main.theme_system'), onPress: () => { setThemeMode("system"); success(); } },
            ]);
          },
          icon: "moon",
          showArrow: true,
          keywords: ["tema", "theme", "dark", "light"],
        },
      ],
    },
    {
      title: t('settings_main.section_help'),
      items: [
        { label: t('settings_main.help_center'), onPress: nav("/settings/help"), icon: "questionmark.circle", showArrow: true, keywords: ["yardım", "help"] },
        { label: t('settings_main.privacy_center'), onPress: nav("/settings/privacy-center"), icon: "shield", showArrow: true, keywords: ["gizlilik", "privacy center"] },
        { label: t('settings_main.account_status'), value: t('settings_main.active'), onPress: nav("/settings/account-status"), icon: "checkmark.shield", showArrow: true, keywords: ["durum", "status"] },
        { label: t('settings_main.about'), value: "v1.0.0", onPress: nav("/settings/about"), icon: "info.circle", showArrow: true, keywords: ["hakkında", "about"] },
      ],
    },
    {
      title: t('settings_main.section_login'),
      items: [
        {
          label: t('settings_main.logout'),
          onPress: () => {
            lightImpact();
            Alert.alert(t('settings_main.logout_title'), t('settings_main.logout_body'), [
              { text: t('common.cancel'), style: "cancel" },
              {
                text: t('settings_main.logout'), style: "destructive", onPress: () => {
                  useAuthStore.getState().logout();
                  
                  // Clear local messaging and notification stores to prevent data leakage
                  useMessagesStore.getState().clearStore();
                  useChatMessagesStore.getState().clearStore();
                  useNotificationStore.setState({ notifications: [], followRequests: [], unreadCount: 0 });
                  
                  router.replace("/login");
                }
              },
            ]);
          },
          icon: "arrow.right.square",
          showArrow: false,
          keywords: ["çıkış", "logout", "log out"],
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
          return { ...item, subtitle: `"${match}"` };
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
        <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>{t('settings_main.title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <IconSymbol name="magnifyingglass" size={20} color={colors.text.tertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder={t('settings_main.search_placeholder')}
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
            <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>{t('settings_main.no_results')}</Text>
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
