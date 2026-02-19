/**
 * Ana Sayfa – Keşfet + Ana Sayfa Birleşimi
 *
 * Arama, tercihler, filtreler ve AI önerisi tek ekranda.
 * UX/UI uyumlu, kompakt düzen.
 *
 * @module app/(tabs)/index
 */

import { router, useNavigation } from 'expo-router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Platform,
  RefreshControl,
  ViewToken,
} from 'react-native';
import * as Location from 'expo-location';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/useTheme';
import { Screen, type ScreenRef } from '@/components/layout';
import {
  ChatInput,
  AnimatedPlaceCard,
  LoadingState,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import {
  FilterBottomSheet,
  getFilterSummaryChips,
  countActiveFilters,
} from '@/components/ui/FilterBottomSheet';
import type { FilterValues } from '@/components/ui/FilterBottomSheet';
import { usePreferences } from '@/src/state/preferences';
import { getPlaceImageSource, hasPlaceImage } from '@/src/utils/placeImages';
import { createTextStyle, s } from '@/constants/design';
import { getAllPlaces } from '@/src/services/mekanService';
import { recommendPlaces } from '@/src/services/api';
import type { Place } from '@/src/services/mekanService';
import type { RecommendItem, RecommendResponse } from '@/src/types/recommend';
import { handleApiError } from '@/src/utils/errorHandler';
import { lightImpact } from '@/src/utils/haptics';

/** İstanbul ilçeleri */
const DISTRICTS = [
  'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy',
  'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece',
  'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa',
  'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik',
  'Sancaktepe', 'Sarıyer', 'Silivri', 'Şile', 'Şişli', 'Sultanbeyli', 'Sultangazi',
  'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu',
];

const PLACE_TYPES = [
  'Bar', 'Meyhane', 'Gece Kulübü', 'Kafe', 'Restoran', 'Fast Food',
  'Kebapçı', 'Balıkçı', 'Tatlıcı', 'Pastane', 'Burgerci', 'Pizzacı', 'Dönerci', 'Nargile Cafe',
];

type DisplayMode = 'browse' | 'ai';

/** Ayrı component – FlatList her query değişiminde header'ı remount etmez, klavye kapanmaz */
function HomeListHeader({
  query,
  setQuery,
  aiLoading,
  runRecommend,
  hasActiveFilters,
  activeFilterCount,
  summaryChips,
  summaryExtra,
  hasAnyFilter,
  isAiMode,
  aiSummary,
  setAiSummary,
  setFilterSheetOpen,
  clearAll,
}: {
  query: string;
  setQuery: (q: string) => void;
  aiLoading: boolean;
  runRecommend: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  summaryChips: string[];
  summaryExtra: number;
  hasAnyFilter: boolean;
  isAiMode: boolean;
  aiSummary: string;
  setAiSummary: (s: string) => void;
  setFilterSheetOpen: (v: boolean) => void;
  clearAll: () => void;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={[createTextStyle('title', colors.text.primary), styles.title]}>Ana Sayfa</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => { lightImpact(); router.push('/(tabs)/profile'); }}
          style={[styles.profileBtn, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="person.fill" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <ChatInput
          value={query}
          onChangeText={setQuery}
          onSubmit={runRecommend}
          placeholder="Bugün nasıl bir yere gidelim?"
          loading={aiLoading}
          containerStyle={styles.chatInput}
        />
      </View>

      <View style={styles.filterSummaryRow}>
        <TouchableOpacity
          onPress={() => { lightImpact(); setFilterSheetOpen(true); }}
          activeOpacity={0.7}
          style={[
            styles.filterTrigger,
            {
              backgroundColor: hasActiveFilters ? colors.accent.primary + '12' : colors.background.tertiary,
              borderColor: hasActiveFilters ? colors.accent.primary + '30' : colors.surface.border,
            },
          ]}
        >
          <IconSymbol name="slider.horizontal.3" size={15} color={hasActiveFilters ? colors.accent.primary : colors.text.tertiary} />
          <Text style={[styles.filterTriggerText, { color: hasActiveFilters ? colors.accent.primary : colors.text.secondary }]}>
            {activeFilterCount > 0 ? `Filtreler (${activeFilterCount})` : 'Filtreler'}
          </Text>
        </TouchableOpacity>

        {summaryChips.map((chip) => (
          <View key={chip} style={[styles.summaryTag, { backgroundColor: colors.background.tertiary }]}>
            <Text style={[styles.summaryTagText, { color: colors.text.secondary }]}>{chip}</Text>
          </View>
        ))}
        {summaryExtra > 0 && (
          <View style={[styles.summaryTag, { backgroundColor: colors.background.tertiary }]}>
            <Text style={[styles.summaryTagText, { color: colors.text.tertiary }]}>+{summaryExtra}</Text>
          </View>
        )}
        {hasAnyFilter && (
          <TouchableOpacity onPress={clearAll} hitSlop={8} activeOpacity={0.7}>
            <IconSymbol name="xmark.circle.fill" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isAiMode && aiSummary ? (
        <View style={[styles.summaryBanner, { backgroundColor: colors.accent.primary + '10', borderColor: colors.accent.primary + '25' }]}>
          <View style={styles.summaryBannerIcon}>
            <IconSymbol name="sparkles" size={14} color={colors.accent.primary} />
          </View>
          <Text style={[styles.summaryBannerText, { color: colors.text.secondary }]} numberOfLines={3}>
            {aiSummary}
          </Text>
          <TouchableOpacity onPress={() => setAiSummary('')} hitSlop={8}>
            <IconSymbol name="xmark" size={14} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      ) : null}

      {aiLoading && (
        <View style={[styles.aiLoadingWrap, { backgroundColor: colors.surface.elevated }]}>
          <IconSymbol name="sparkles" size={16} color={colors.accent.primary} />
          <Text style={[styles.aiLoadingText, { color: colors.text.secondary }]}>AI düşünüyor...</Text>
        </View>
      )}
    </>
  );
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const screenRef = useRef<ScreenRef>(null);
  const flatListRef = useRef<FlatList>(null);
  const { prefs, patchPrefs, resetPrefs } = usePreferences();

  const [query, setQuery] = useState('');
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiItems, setAiItems] = useState<RecommendItem[]>([]);
  const [aiSummary, setAiSummary] = useState('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('browse');
  const [refreshing, setRefreshing] = useState(false);
  const [placesById, setPlacesById] = useState<Record<string, Place>>({});
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    location: null,
    category: null,
    vibe: null,
    purpose: null,
    budget: null,
  });

  useEffect(() => {
    const unsub = navigation.addListener('tabPress' as any, () => {
      screenRef.current?.scrollToTop?.();
      flatListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    loadPlaces();
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      // Fallback: İstanbul merkez
    }
  };

  useEffect(() => {
    if (allPlaces.length > 0) {
      const map: Record<string, Place> = {};
      allPlaces.forEach((p) => { map[String(p.id)] = p; });
      setPlacesById(map);
    }
  }, [allPlaces]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllPlaces();
      setAllPlaces(data);
    } catch (e: unknown) {
      const appError = handleApiError(e);
      setError(appError.userMessage);
      setAllPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const runRecommend = useCallback(async () => {
    try {
      setAiLoading(true);
      setError('');
      setAiSummary('');
      const res: RecommendResponse = await recommendPlaces({
        queryText: query.trim() || undefined,
        preferences: {
          vibe: prefs.vibe || filters.vibe || undefined,
          purpose: prefs.purpose || filters.purpose || undefined,
          budget: prefs.budget || filters.budget || undefined,
        },
        location: userLocation || undefined,
        radius_m: 5000,
        category: filters.category || undefined,
      });
      setAiItems(res.items ?? []);
      setAiSummary(res.summary || '');
      setDisplayMode('ai');
    } catch (e: unknown) {
      const err = e instanceof Error ? (e as any).userMessage || e.message : 'Öneriler alınamadı';
      setError(err);
    } finally {
      setAiLoading(false);
    }
  }, [query, prefs, filters, userLocation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    lightImpact();
    await loadPlaces();
    setRefreshing(false);
  };

  const activeFilterCount = countActiveFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;

  const filteredPlaces = useMemo(() => {
    let list = [...allPlaces];
    const norm = (str: string) => str.toLowerCase().replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c');

    if (filters.category) {
      const search = norm(filters.category);
      list = list.filter((p) => {
        const cat = norm(p.category ?? '');
        const name = norm(p.name ?? '');
        const desc = norm(p.description ?? '');
        const sub = norm(p.subtitle ?? '');
        return cat.includes(search) || name.includes(search) || desc.includes(search) || sub.includes(search);
      });
    }
    if (filters.location) {
      const locNorm = filters.location.toLowerCase();
      list = list.filter((p) => {
        const name = (p.name ?? '').toLowerCase();
        const addr = (p.address ?? '').toLowerCase();
        return name.includes(` - ${locNorm}`) || name.includes(` ${locNorm}`) || addr.includes(locNorm);
      });
    }
    return list.slice(0, 12);
  }, [allPlaces, filters.category, filters.location]);

  const displayList = displayMode === 'ai' ? aiItems : filteredPlaces;
  const isAiMode = displayMode === 'ai';


  const handleApplyFilters = useCallback((v: FilterValues) => {
    setFilters(v);
    patchPrefs({
      vibe: v.vibe ?? undefined,
      purpose: v.purpose ?? undefined,
      budget: v.budget ?? undefined,
    });
  }, [patchPrefs]);

  const clearAll = useCallback(() => {
    lightImpact();
    resetPrefs();
    setFilters({ location: null, category: null, vibe: null, purpose: null, budget: null });
    setQuery('');
    setDisplayMode('browse');
  }, [resetPrefs]);

  const getLocationFromName = (name: string) =>
    name?.includes(' - ') ? name.split(' - ')[1]?.trim() : undefined;

  const handlePlacePress = useCallback((id: string) => {
    lightImpact();
    router.push({ pathname: '/place/[id]', params: { id } } as any);
  }, []);

  const renderPlaceItem = useCallback(
    ({ item, index }: { item: RecommendItem | Place; index: number }) => {
      const id = String((item as any).id);
      const place = placesById[id] || (item as Place);
      const merged = {
        id,
        name: (item as any).name,
        category: (item as any).category ?? place?.category,
        photo_url: (item as any).photo_url ?? place?.photo_url,
        description: (item as any).description ?? place?.description,
        subtitle: (item as any).subtitle ?? place?.subtitle,
      };
      const loc = getLocationFromName((item as any).name ?? '');
      const isAi = displayMode === 'ai';

      return (
        <AnimatedPlaceCard
          key={id}
          index={index}
          image={getPlaceImageSource(merged)}
          imagePlaceholder={!hasPlaceImage(merged)}
          title={(item as any).name ?? 'Mekan'}
          subtitle={(item as any).subtitle ?? place?.subtitle}
          tags={(item as any).tags ?? place?.tags}
          location={loc}
          explanation={isAi ? (item as RecommendItem).explanation : undefined}
          distance_m={isAi ? (item as RecommendItem).distance_m : undefined}
          isRecommended={isAi}
          onPress={() => handlePlacePress(id)}
        />
      );
    },
    [placesById, handlePlacePress, displayMode]
  );

  const onViewableItemsChanged = useRef(({ viewableItems: v }: { viewableItems: ViewToken[] }) => {}).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const listEmpty = useCallback(() => {
    if (loading && allPlaces.length === 0) {
      return (
        <View style={styles.centerWrap}>
          <LoadingState message="Mekanlar yükleniyor..." />
        </View>
      );
    }
    if (error && !aiLoading) {
      return (
        <View style={styles.centerWrap}>
          <ErrorState title="Hata" description={error} onRetry={loadPlaces} />
        </View>
      );
    }
    if (isAiMode && !aiLoading && aiItems.length === 0) {
      return (
        <View style={styles.centerWrap}>
          <EmptyState
            icon="magnifyingglass"
            title="Sonuç bulunamadı"
            description="Tercihlerinizi veya aramayı değiştirip tekrar deneyin"
            actionLabel="Temizle"
            onAction={clearAll}
          />
        </View>
      );
    }
    if (!isAiMode && filteredPlaces.length === 0) {
      return (
        <View style={styles.centerWrap}>
          <EmptyState
            icon={hasActiveFilters ? 'magnifyingglass' : 'mappin.slash'}
            title={hasActiveFilters ? 'Sonuç bulunamadı' : 'Henüz mekan yok'}
            description={hasActiveFilters ? 'Filtreleri değiştirin' : 'Yakında eklenecek'}
            actionLabel={hasActiveFilters ? 'Temizle' : undefined}
            onAction={hasActiveFilters ? clearAll : undefined}
          />
        </View>
      );
    }
    return null;
  }, [loading, allPlaces.length, error, aiLoading, isAiMode, aiItems.length, filteredPlaces.length, hasActiveFilters, clearAll]);

  const hasAnyFilter = hasActiveFilters || query.trim();
  const { chips: summaryChips, extra: summaryExtra } = getFilterSummaryChips(filters, 3);

  return (
    <Screen ref={screenRef} scrollable={false} onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
      <View style={styles.screen}>
        <FilterBottomSheet
          visible={filterSheetOpen}
          onClose={() => setFilterSheetOpen(false)}
          values={filters}
          onApply={handleApplyFilters}
          districts={DISTRICTS}
          placeTypes={PLACE_TYPES}
        />

        <FlatList
          ref={flatListRef}
          data={displayList}
          keyExtractor={(item) => String((item as any).id)}
          renderItem={renderPlaceItem}
          ListHeaderComponent={
            <HomeListHeader
              query={query}
              setQuery={setQuery}
              aiLoading={aiLoading}
              runRecommend={runRecommend}
              hasActiveFilters={hasActiveFilters}
              activeFilterCount={activeFilterCount}
              summaryChips={summaryChips}
              summaryExtra={summaryExtra}
              hasAnyFilter={!!hasAnyFilter}
              isAiMode={isAiMode}
              aiSummary={aiSummary}
              setAiSummary={setAiSummary}
              setFilterSheetOpen={setFilterSheetOpen}
              clearAll={clearAll}
            />
          }
          ListEmptyComponent={listEmpty}
          contentContainerStyle={displayList.length > 0 ? styles.listContent : styles.listContentEmpty}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
          }
          keyboardShouldPersistTaps="handled"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: s(4),
  },
  headerLeft: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4, marginLeft: 16 },
  profileBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  searchWrap: { marginBottom: s(3), minHeight: 72 },
  chatInput: { alignSelf: 'stretch', minHeight: 64 },
  filterSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTriggerText: { fontSize: 13, fontWeight: '600' },
  summaryTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  summaryTagText: { fontSize: 12, fontWeight: '500' },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: s(3),
    marginTop: s(5),
  },
  summaryBannerIcon: { marginTop: 2 },
  summaryBannerText: { flex: 1, fontSize: 13, lineHeight: 19 },
  aiLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: s(3),
  },
  aiLoadingText: { fontSize: 14, fontWeight: '600' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(3),
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: s(5 )},
  count: { fontSize: 13 },
  listContent: { gap: s(5), paddingBottom: s(8) },
  listContentEmpty: { flexGrow: 1 },
  centerWrap: { minHeight: 320, justifyContent: 'center' },
});
