/**
 * Keşfet (Explore) Ekranı
 *
 * AI destekli mekan önerileri: arama, filtreler, açıklama ve sonuç kartları.
 * Üst düzey görsel düzen ve okunabilirlik.
 *
 * @module app/(tabs)/explore
 */

import { router, useNavigation } from 'expo-router';
import { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen, type ScreenRef } from '@/components/layout';
import { Button, Chip, SearchInput, EmptyState, AnimatedPlaceCard, LoadingState, ErrorState } from '@/components/ui';
import { recommendPlaces } from '@/src/services/api';
import { usePreferences } from '@/src/state/preferences';
import type { PlaceCard as PlaceCardType, RecommendResponse } from '@/src/types/recommend';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { getPlaces } from '@/src/services/mekanService';
import type { Place } from '@/src/services/mekanService';
import { createTextStyle } from '@/constants/design';
import { spacing } from '@/constants/design';
import { lightImpact } from '@/src/utils/haptics';
import { IconSymbol } from '@/components/ui/icon-symbol';

function hasActivePrefs(p: { vibe?: string; purpose?: string; budget?: string }) {
  return !!(p.vibe || p.purpose || p.budget);
}

export default function ExploreScreen() {
  const { colors, spacing: themeSpacing } = useTheme();
  const navigation = useNavigation();
  const screenRef = useRef<ScreenRef>(null);
  const [query, setQuery] = useState('');
  const { prefs, patchPrefs, resetPrefs } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [items, setItems] = useState<PlaceCardType[]>([]);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [placesById, setPlacesById] = useState<Record<string, Place>>({});

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      screenRef.current?.scrollToTop();
    });
    return unsubscribe;
  }, [navigation]);

  const savedIds = useSavedPlaces((s) => s.ids);
  const toggle = useSavedPlaces((s) => s.toggle);

  useEffect(() => {
    getPlaces()
      .then((list) => {
        const map: Record<string, Place> = {};
        list.forEach((p) => { map[String(p.id)] = p; });
        setPlacesById(map);
      })
      .catch(() => {});
  }, []);

  const requestBody = useMemo(
    () => ({ queryText: query, preferences: prefs }),
    [query, prefs]
  );

  async function runRecommend() {
    try {
      setError('');
      setLoading(true);
      const res: RecommendResponse = await recommendPlaces(requestBody);
      setItems(res.items);
      setExplanation(res.explanation ?? '');
    } catch (e: unknown) {
      const err = e instanceof Error ? (e as any).userMessage || e.message : 'Bir hata oluştu';
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runRecommend();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    lightImpact();
    await runRecommend();
    setRefreshing(false);
  };

  const hasFilters = useMemo(() => hasActivePrefs(prefs), [prefs]);
  const titleStyle = createTextStyle('title', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);

  return (
    <Screen ref={screenRef} onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[titleStyle as any, styles.headerTitle]}>Keşfet</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchInput
          placeholder="Ne arıyorsun?"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runRecommend}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          onPress={() => { lightImpact(); setShowFilters(!showFilters); }}
          style={[styles.filterButton, { 
            backgroundColor: colors.surface.elevated, 
            borderColor: hasFilters ? colors.accent.primary : colors.surface.border 
          }]}
          activeOpacity={0.75}
        >
          <IconSymbol name="slider.horizontal.3" size={16} color={colors.text.secondary} />
          <Text style={[styles.filterButtonText, { color: colors.text.primary }]}>
            Tercihler
          </Text>
          {hasFilters && (
            <View style={[styles.filterDot, { backgroundColor: colors.accent.primary }]} />
          )}
        </TouchableOpacity>
        
        {hasFilters && (
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              resetPrefs();
            }}
            activeOpacity={0.7}
            style={[styles.clearFiltersBtn, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
          >
            <Text style={[styles.clearFiltersBtnText, { color: colors.text.tertiary }]}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Compact Filters Panel */}
      {showFilters && (
        <View style={[styles.filterPanel, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Ortam</Text>
            <View style={styles.chipRow}>
              <Chip 
                label="Sessiz" 
                size="small" 
                active={prefs.vibe === 'quiet'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ vibe: prefs.vibe === 'quiet' ? undefined : 'quiet' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
              <Chip 
                label="Canlı" 
                size="small" 
                active={prefs.vibe === 'lively'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ vibe: prefs.vibe === 'lively' ? undefined : 'lively' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Amaç</Text>
            <View style={styles.chipRow}>
              <Chip 
                label="Çalışma" 
                size="small" 
                active={prefs.purpose === 'work'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ purpose: prefs.purpose === 'work' ? undefined : 'work' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
              <Chip 
                label="Arkadaş" 
                size="small" 
                active={prefs.purpose === 'friends'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ purpose: prefs.purpose === 'friends' ? undefined : 'friends' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
              <Chip 
                label="Date" 
                size="small" 
                active={prefs.purpose === 'date'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ purpose: prefs.purpose === 'date' ? undefined : 'date' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Bütçe</Text>
            <View style={styles.chipRow}>
              <Chip 
                label="₺" 
                size="small" 
                active={prefs.budget === 'low'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ budget: prefs.budget === 'low' ? undefined : 'low' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
              <Chip 
                label="₺₺" 
                size="small" 
                active={prefs.budget === 'mid'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ budget: prefs.budget === 'mid' ? undefined : 'mid' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
              <Chip 
                label="₺₺₺" 
                size="small" 
                active={prefs.budget === 'high'} 
                onPress={() => { 
                  lightImpact(); 
                  patchPrefs({ budget: prefs.budget === 'high' ? undefined : 'high' }); 
                }} 
                style={{ marginRight: 10, marginBottom: 6 }} 
              />
            </View>
          </View>
        </View>
      )}

      {/* Öneri Getir Button */}
      <Button
        variant="primary"
        size="medium"
        onPress={runRecommend}
        loading={loading}
        disabled={loading}
        style={styles.recommendBtn}
      >
        Öneri Getir
      </Button>

      {/* Hata */}
      {error ? (
        <ErrorState
          title="Öneriler Alınamadı"
          description={error}
          onRetry={runRecommend}
          compact
        />
      ) : null}

      {/* Sonuçlar */}
      {loading && items.length === 0 ? (
        <LoadingState message="Öneriler hazırlanıyor..." compact />
      ) : items.length > 0 ? (
        <View style={styles.resultsSection}>
          {items.map((place, idx) => {
            const id = String((place as any).id);
            const saved = savedIds.includes(id);
            const fullPlace = placesById[id];
            const hasPhoto = !!(fullPlace?.photo_url ?? (place as any).photo_url);
            const imageSource = getPlaceImageSource(fullPlace || { id, name: place.name, category: (place as any).category, photo_url: (place as any).photo_url });
            const locationName = place.name && place.name.includes(' - ') ? place.name.split(' - ')[1]?.trim() : undefined;
            return (
              <AnimatedPlaceCard
                key={id}
                index={idx}
                image={imageSource}
                imagePlaceholder={!hasPhoto}
                title={place.name}
                subtitle={place.subtitle}
                tags={place.tags}
                location={locationName}
                onPress={() => router.push({ pathname: '/place/[id]', params: { id } } as any)}
              />
            );
          })}
        </View>
      ) : !loading && !error ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon="magnifyingglass"
            title="Henüz sonuç yok"
            description="Tercihlerini ayarla ve Öneri Getir'e bas"
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  searchWrap: {
    marginBottom: spacing.xl,
  },
  searchInput: { 
    marginBottom: 0,
  },
  quickFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  clearFiltersBtn: {
    paddingHorizontal: spacing.base,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  clearFiltersBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterPanel: {
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.base,
    marginBottom: spacing.xl,
    gap: spacing.base,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  recommendBtn: { 
    marginBottom: spacing.xl,
    borderRadius: 12,
  },
  resultsSection: { 
    marginTop: spacing.sm,
    gap: spacing.xl,
  },
});
