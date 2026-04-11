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
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const handleLogout = () => {
    heavyImpact();
    Alert.alert('Güvenli Çıkış', 'Mekan yönetim panelinden çıkış yapmak üzeresiniz. Onaylıyor musunuz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Çıkış Yap',
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
    Alert.alert('İşletme Hesabını Kapat', 'Tüm mekan profiliniz, fotoğraflarınız, istatistikleriniz ve menü bilgileriniz kalıcı olarak silinecektir. Bu işlem GERİ DÖNDÜRÜLEMEZ.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Kalıcı Olarak Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            logout();
            router.replace('/login');
          } catch (err) {
            Alert.alert("Hata", "Hesap silinirken bir hata oluştu.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Ayarlar</Text>

        {/* --- PROFILE HEADER --- */}
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{((user?.venue_name || user?.username) ?? 'M').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{user?.venue_name || 'İşletme Profili'}</Text>
            <View style={styles.roleBadge}>
              <IconSymbol name="checkmark.seal.fill" size={14} color="#f59e0b" />
              <Text style={styles.roleText}>Onaylı Partner</Text>
            </View>
          </View>
        </View>

        {/* --- PREMIUM BANNER --- */}
        <TouchableOpacity activeOpacity={0.9} onPress={lightImpact}>
          <LinearGradient
            colors={['#b45309', '#f59e0b', '#fbbf24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBanner}
          >
            <View style={styles.proBannerContent}>
              <View>
                <Text style={styles.proBannerTitle}>AsEmOs Partner PRO</Text>
                <Text style={styles.proBannerSub}>Detaylı istatistikler aktif</Text>
              </View>
              <View style={styles.proIconCircle}>
                <IconSymbol name="star.fill" size={24} color="#b45309" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* --- BUSINESS MANAGEMENT --- */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeader}>İŞLETME YÖNETİMİ</Text>
          <BlurView intensity={25} tint="dark" style={styles.sectionBox}>
            <SettingRow 
              icon="chart.bar.fill" 
              iconColor="#3b82f6" 
              label="İstatistikler ve Analizler" 
              subtitle="Profil görüntülenmeleri ve favoriler"
              onPress={() => router.push('/(venue-tabs)/stats' as any)} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="speaker.slash" 
              iconColor="#10b981" 
              label="Kampanya Duyuruları" 
              subtitle="Mekanınıza özel push bildirim hakkı"
              onPress={() => Alert.alert('Bilgi', 'Yakında eklenecek.')} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="creditcard.fill" 
              iconColor="#a855f7" 
              label="Fatura ve Üyelik" 
              subtitle="Aylık abonelik işlemleri"
              onPress={() => Alert.alert('Bilgi', 'Ödeme sistemi şu an bakımda.')} 
            />
          </BlurView>
        </View>

        {/* --- ACCOUNT & SUPPORT --- */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeader}>HESAP VE DESTEK</Text>
          <BlurView intensity={25} tint="dark" style={styles.sectionBox}>
            <SettingRow 
              icon="bell.fill" 
              iconColor="#f43f5e" 
              label="Bildirim Tercihleri" 
              onPress={() => {}} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="envelope.fill" 
              iconColor="#2dd4bf" 
              label="Partner Destek Ekibi" 
              subtitle="7/24 öncelikli destek"
              onPress={() => {}} 
            />
            <View style={styles.separator} />
            <SettingRow 
              icon="doc.text.fill" 
              iconColor="#94a3b8" 
              label="Kullanım Koşulları" 
              onPress={() => WebBrowser.openBrowserAsync('https://asemos.com/terms')} 
            />
          </BlurView>
        </View>

        {/* --- DANGER ZONE --- */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionHeader}>GÜVENLİK</Text>
          <BlurView intensity={25} tint="dark" style={styles.sectionBox}>
            <SettingRow 
              icon="arrow.right.square.fill" 
              label="Yönetim Panelinden Çıkış Yap" 
              onPress={handleLogout} 
              isDangerous
            />
          </BlurView>

          {/* Minimal Kalıcı Sil Butonu */}
          <View style={styles.dangerZoneWrap}>
            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.6}>
              <Text style={styles.dangerZoneText}>Veya işletme kaydınızı kalıcı olarak silin</Text>
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
    borderWidth: 2, borderColor: '#f59e0b'
  },
  profileAvatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
  profileInfo: { marginLeft: 16, flex: 1 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#f59e0b', letterSpacing: 0.3 },

  // PRO Banner
  proBanner: { borderRadius: 20, padding: 20, marginBottom: 32, elevation: 8, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
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
