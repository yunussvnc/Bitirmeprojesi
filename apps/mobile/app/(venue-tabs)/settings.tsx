import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/store/useAuthStore';
import { deleteAccount } from '@/src/services/authService';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol, IconSymbolName } from '@/src/components/ui/icon-symbol';
import { lightImpact, heavyImpact, selection } from '@/src/utils/haptics';
import * as WebBrowser from 'expo-web-browser';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/src/store/useSettingsStore';

const SettingRow = ({
  icon,
  iconColor = '#fff',
  label,
  subtitle,
  onPress,
  isDangerous = false
}: {
  icon: IconSymbolName;
  iconColor?: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  isDangerous?: boolean;
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={() => { selection(); onPress(); }}
    activeOpacity={0.7}
  >
    <View style={[styles.settingIconWrap, { backgroundColor: isDangerous ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.08)' }]}>
      <IconSymbol name={icon} size={20} color={isDangerous ? '#dc2626' : iconColor} />
    </View>
    <View style={styles.settingTexts}>
      <Text style={[styles.settingLabel, isDangerous && { color: '#dc2626' }]}>{label}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    <IconSymbol name="chevron.right" size={20} color="rgba(255,255,255,0.3)" />
  </TouchableOpacity>
);

export default function VenueSettingsScreen() {
  const { user, logout } = useAuthStore();
  const { language, setLanguage } = useSettingsStore();
  const scrollRef = useRef<ScrollView>(null);
  const { t } = useTranslation();

  useScrollToTop(scrollRef);

  const handleLogout = () => {
    heavyImpact();
    Alert.alert(t('settings.logout_alert_title'), t('settings.logout_alert_body'), [
      { text: t('settings.logout_alert_cancel'), style: 'cancel' },
      {
        text: t('settings.logout_alert_confirm'),
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    heavyImpact();
    Alert.alert(t('settings.delete_alert_title'), t('settings.delete_alert_body'), [
      { text: t('settings.delete_alert_cancel'), style: 'cancel' },
      {
        text: t('settings.delete_alert_confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            logout();
            router.replace('/login');
          } catch {
            Alert.alert(t('settings.error_title'), t('settings.error_body'));
          }
        },
      },
    ]);
  };

  const handleLanguageSwitch = () => {
    Alert.alert(
      t('settings.language_label'),
      t('settings.language_label'),
      [
        { text: 'Türkçe', onPress: () => setLanguage('tr') },
        { text: 'English', onPress: () => setLanguage('en') },
        { text: t('settings.logout_alert_cancel'), style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>{t('settings.title')}</Text>

        {/* --- PROFILE HEADER --- */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{((user?.venue_name || user?.username) ?? 'M').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.venue_name || t('settings.profile_title')}</Text>
            <View style={styles.roleBadge}>
              <IconSymbol name="checkmark.seal.fill" size={14} color="#10b981" />
              <Text style={styles.roleText}>{t('settings.verified_partner')}</Text>
            </View>
          </View>
        </View>

        {/* --- PREMIUM BANNER --- */}
        <TouchableOpacity activeOpacity={0.9} onPress={lightImpact}>
          <LinearGradient
            colors={['#064e3b', '#059669', '#10b981']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBanner}
          >
            <View style={styles.proBannerContent}>
              <View>
                <Text style={styles.proBannerTitle}>{t('settings.pro_badge')}</Text>
                <Text style={styles.proBannerSub}>{t('settings.pro_subtitle')}</Text>
              </View>
              <View style={styles.proIconCircle}>
                <IconSymbol name="star.fill" size={24} color="#047857" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* --- BUSINESS MANAGEMENT --- */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeader}>{t('settings.section_business')}</Text>
          <BlurView intensity={25} tint="dark" style={styles.sectionBox}>
            <SettingRow 
              icon="chart.bar.fill" 
              iconColor="#10b981" 
              label={t('settings.stats_label')} 
              subtitle={t('settings.stats_subtitle')}
              onPress={() => router.push('/(venue-tabs)/stats' as any)} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="speaker.slash" 
              iconColor="#34d399" 
              label={t('settings.campaign_label')} 
              subtitle={t('settings.campaign_subtitle')}
              onPress={() => Alert.alert(t('settings.soon_alert_title'), t('settings.soon_alert_body'))} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="creditcard.fill" 
              iconColor="#059669" 
              label={t('settings.invoice_label')} 
              subtitle={t('settings.invoice_subtitle')}
              onPress={() => Alert.alert(t('settings.soon_alert_title'), t('settings.soon_alert_body'))} 
            />
          </BlurView>
        </View>

        {/* --- ACCOUNT & SUPPORT --- */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeader}>{t('settings.section_support')}</Text>
          <BlurView intensity={25} tint="dark" style={styles.sectionBox}>
            <SettingRow 
              icon="globe" 
              iconColor="#3b82f6" 
              label={t('settings.language_label')} 
              subtitle={language === 'tr' ? 'Türkçe' : 'English'}
              onPress={handleLanguageSwitch} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="bell.fill" 
              iconColor="#f43f5e" 
              label={t('settings.notifications_label')} 
              onPress={() => {}} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="envelope.fill" 
              iconColor="#2dd4bf" 
              label={t('settings.support_label')} 
              subtitle={t('settings.support_subtitle')}
              onPress={() => {}} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="doc.text.fill" 
              iconColor="#94a3b8" 
              label={t('settings.terms_label')} 
              onPress={() => WebBrowser.openBrowserAsync('https://asemos.tr/terms')} 
            />
          </BlurView>
        </View>

        {/* --- DANGER ZONE --- */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeader}>{t('settings.section_security')}</Text>
          <BlurView intensity={25} tint="dark" style={styles.sectionBox}>
            <SettingRow 
              icon="arrow.right.square.fill" 
              label={t('settings.logout_label')} 
              onPress={handleLogout} 
              isDangerous
            />
          </BlurView>

          {/* Minimal Kalıcı Sil Butonu */}
          <View style={styles.dangerZoneWrap}>
            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6}>
              <Text style={styles.dangerZoneText}>{t('settings.delete_account')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  pageTitle: { fontSize: 34, fontWeight: '800', color: '#fff', marginBottom: 24, letterSpacing: 0.5 },
  
  // Profile Header
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 4 },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#333', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#10b981'
  },
  profileAvatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#10b981', letterSpacing: 0.3 },

  // PRO Banner
  proBanner: { borderRadius: 20, padding: 20, marginBottom: 32, elevation: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
  proBannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  proBannerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4, letterSpacing: 0.5 },
  proBannerSub: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.9)' },
  proIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' },

  // Sections
  sectionGroup: { marginBottom: 32 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.4)', marginLeft: 12, marginBottom: 8, letterSpacing: 1.2 },
  sectionBox: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginLeft: 64 }, // Align border with text

  // Setting Row
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  settingIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingTexts: { flex: 1, marginLeft: 14 },
  settingLabel: { fontSize: 16, fontWeight: '600', color: '#fff', letterSpacing: 0.2 },
  settingSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 },

  // Danger Zone
  dangerZoneWrap: { alignItems: 'center', marginTop: 24 },
  dangerZoneText: { fontSize: 13, fontWeight: '500', color: 'rgba(220,38,38,0.7)', textDecorationLine: 'underline', padding: 8 }
});
