import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/ui';
import { useAuthStore } from '@/src/store/useAuthStore';
import { deleteAccount } from '@/src/services/authService';
import { router } from 'expo-router';
import { useScrollToTop } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/src/components/ui/icon-symbol';

export default function VenueSettingsScreen() {
  const { logout } = useAuthStore();
  const scrollRef = useRef<ScrollView>(null);

  useScrollToTop(scrollRef);

  const handleLogout = () => {
    Alert.alert('Çıkış', 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
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
    Alert.alert('Hesabı Sil', 'Tüm mekan verileriniz geri döndürülemez şekilde silinecektir. Onaylıyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Evet, Sil',
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
        <Text style={styles.title}>Ortak Ayarları</Text>
        
        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="envelope.fill" size={20} color="#f472b6" />
            <Text style={styles.sectionTitle}>İletişim & Destek</Text>
          </View>
          <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
            <Button variant="secondary" style={styles.btn} onPress={() => {}}>Bize Ulaşın</Button>
            <Button variant="secondary" style={styles.btn} onPress={() => {}}>Sıkça Sorulan Sorular</Button>
          </BlurView>
        </View>

        <View style={styles.sectionMargin}>
          <View style={styles.sectionHeader}>
            <IconSymbol name="person.crop.circle.badge.exclamationmark.fill" size={20} color="#f87171" />
            <Text style={styles.sectionTitle}>Tehlikeli Alan</Text>
          </View>
          <BlurView intensity={20} tint="dark" style={styles.sectionCard}>
            <Button variant="secondary" style={styles.btn} onPress={handleLogout}>Oturumu Kapat</Button>
            <View style={styles.divider} />
            <Button variant="primary" style={styles.deleteBtn} onPress={handleDeleteAccount}>
              İşletme Hesabını Sil
            </Button>
          </BlurView>
        </View>
        
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  container: { padding: 24, paddingBottom: 120 },
  title: { fontSize: 32, fontWeight: '800', color: '#ffffff', marginBottom: 32, letterSpacing: -0.5 },
  sectionMargin: { marginBottom: 32 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#ffffff', 
    marginLeft: 8,
    letterSpacing: 0.3,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    paddingBottom: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  btn: { marginBottom: 16 },
  deleteBtn: { marginBottom: 16, backgroundColor: '#dc2626' },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 4,
    marginBottom: 20,
  },
});
