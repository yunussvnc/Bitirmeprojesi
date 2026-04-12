import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { IconSymbol, IconSymbolName } from '@/src/components/ui/icon-symbol';
import { lightImpact, selection } from '@/src/utils/haptics';
import { getMyVenueStats, Place } from '@/src/services/mekanService';

const StatCard = ({ icon, color, title, value, subtitle }: { icon: IconSymbolName; color: string; title: string; value: string | number; subtitle?: string }) => (
  <BlurView intensity={30} tint="dark" style={styles.statCard}>
    <View style={[styles.statIconWrap, { backgroundColor: `${color}15` }]}>
      <IconSymbol name={icon} size={22} color={color} />
    </View>
    <View style={styles.statContent}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  </BlurView>
);

export default function VenueStatsScreen() {
  const [stats, setStats] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getMyVenueStats();
      if (data) setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const onRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  if (loading && !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>İstatistikler Yükleniyor...</Text>
      </View>
    );
  }

  // Fallbacks if stats not present
  const reviewCount = stats?.review_count || 0;
  const averageRating = stats?.average_rating?.toFixed(1) || '0.0';
  const savedCount = stats?.saved_count || 0;
  const popScore = stats?.popularity_score?.toFixed(1) || '0.0';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => { selection(); router.back(); }}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analizler</Text>
        <View style={{ width: 40 }} /> 
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        <LinearGradient
          colors={['rgba(16,185,129,0.2)', 'transparent']}
          style={styles.heroBanner}
        >
          <Text style={styles.heroLabel}>Mekan Popülerlik Skoru</Text>
          <View style={styles.heroScoreRow}>
            <Text style={styles.heroScore}>{popScore}</Text>
            <IconSymbol name="flame.fill" size={32} color="#10b981" />
          </View>
          <Text style={styles.heroDesc}>Skorunuz mekana yapılan yorum ve kaydetmeler ışığında anlık güncellenir.</Text>
        </LinearGradient>

        <View style={styles.gridContainer}>
          <StatCard 
            icon="star.fill" 
            color="#34d399" 
            title="Ortalama Puan" 
            value={`${averageRating} / 5`} 
            subtitle="Genel müşteri memnuniyeti" 
          />
          <StatCard 
            icon="text.bubble.fill" 
            color="#0ea5e9" 
            title="Toplam Yorum" 
            value={reviewCount} 
            subtitle="Tüm zamanlar" 
          />
          <StatCard 
            icon="bookmark.fill" 
            color="#10b981" 
            title="Kaydedilme" 
            value={savedCount} 
            subtitle="Favoriye alan kullanıcılar" 
          />
          <StatCard 
            icon="eye.fill" 
            color="#0d9488" 
            title="Profil Görüntüleme" 
            value="--" 
            subtitle="Çok yakında aktif olacak" 
          />
        </View>

        <Text style={styles.infoText}>Analiz verileriniz son 30 günün aktif kullanıcı eğilimlerini de baz alarak hesaplanmaktadır. Daha detaylı kampanya analitikleri yakında AsEmOs Partner sistemine eklenecektir.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.6)', marginTop: 12, fontSize: 15, fontWeight: '500' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 0.5 },
  container: { padding: 20, paddingBottom: 80 },
  heroBanner: { borderRadius: 24, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  heroLabel: { fontSize: 13, fontWeight: '600', color: '#10b981', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  heroScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  heroScore: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -1 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 18 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  statCard: { width: '47%', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  statIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  statContent: { flex: 1 },
  statTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  statSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  infoText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }
});
