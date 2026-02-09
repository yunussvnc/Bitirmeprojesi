/**
 * Home Screen
 * 
 * Main discovery screen with featured places and quick access.
 * Spotify-inspired dark theme design.
 * 
 * @module app/(tabs)/index
 */

import { router, useNavigation } from 'expo-router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, useWindowDimensions } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/useTheme';
import { Screen, type ScreenRef } from '@/components/layout';
import { SearchInput, Chip, FilterCard, Button, AnimatedPlaceCard, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { createTextStyle, spacing, s } from '@/constants/design';
import { getPlaces } from '@/src/services/mekanService';
import type { Place } from '@/src/services/mekanService';
import { handleApiError } from '@/src/utils/errorHandler';
import { lightImpact } from '@/src/utils/haptics';

export default function HomeScreen() {
  const { height } = useWindowDimensions();
  const { colors, spacing, typography } = useTheme();
  const navigation = useNavigation();
  const screenRef = useRef<ScreenRef>(null);
  const savedCount = useSavedPlaces((s) => s.ids.length);
  const [places, setPlaces] = useState<Place[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'rating'>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedFilterSection, setExpandedFilterSection] = useState<'location' | 'category' | 'sort' | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      screenRef.current?.scrollToTop();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getPlaces();
      setAllPlaces(data);
    } catch (e: unknown) {
      const appError = handleApiError(e);
      setError(appError.userMessage);
      setPlaces([]);
      setAllPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    lightImpact();
    await loadPlaces();
    setRefreshing(false);
  };

  const applyFilters = useCallback((data: Place[]) => {
    let filtered = [...data];

    // Arama sorgusu filtresi
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const name = p.name?.toLowerCase() || '';
        const description = p.description?.toLowerCase() || '';
        const subtitle = p.subtitle?.toLowerCase() || '';
        const address = p.address?.toLowerCase() || '';
        return name.includes(query) || 
               description.includes(query) || 
               subtitle.includes(query) ||
               address.includes(query);
      });
    }

    // Kategori filtresi
    if (selectedCategory) {
      const categoryMap: { [key: string]: string } = {
        'Café': 'Kafe',
        'Restoran': 'Restoran',
        'Bar': 'Bar',
        'Gece Kulübü': 'Bar', // Gece kulüpleri de Bar kategorisinde
      };
      const backendCategory = categoryMap[selectedCategory] || selectedCategory;
      filtered = filtered.filter((p) => {
        // Önce category field'ını kontrol et
        if (p.category) {
          const placeCategory = p.category.toLowerCase();
          if (selectedCategory === 'Gece Kulübü') {
            // Gece kulübü için özel kontrol
            const name = p.name?.toLowerCase() || '';
            return name.includes('sortie') || name.includes('reina') || 
                   name.includes('anjelique') || name.includes('ruby') ||
                   name.includes('29') || placeCategory.includes('gece') ||
                   placeCategory.includes('kulüp') || placeCategory.includes('club');
          }
          return placeCategory === backendCategory.toLowerCase();
        }
        // Fallback: name'den kontrol et
        const name = p.name?.toLowerCase() || '';
        if (selectedCategory === 'Gece Kulübü') {
          return name.includes('sortie') || name.includes('reina') || 
                 name.includes('anjelique') || name.includes('ruby') ||
                 name.includes('29');
        }
        if (backendCategory === 'Kafe') {
          return name.includes('espresso') || name.includes('starbucks') || 
                 name.includes('kahve') || name.includes('café') || name.includes('cafe') ||
                 name.includes('nero') || name.includes('mado') || name.includes('simit');
        }
        if (backendCategory === 'Restoran') {
          return name.includes('nusr') || name.includes('günaydın') || 
                 name.includes('muhallebi') || name.includes('sütiş') ||
                 name.includes('çiya') || name.includes('ocakbaşı') ||
                 name.includes('mikla') || name.includes('sunset');
        }
        if (backendCategory === 'Bar') {
          return name.includes('bar') || name.includes('360') || 
                 name.includes('sortie') || name.includes('reina') ||
                 name.includes('anjelique') || name.includes('ruby');
        }
        return true;
      });
    }

    // Konum filtresi - daha iyi eşleştirme
    if (selectedLocation) {
      filtered = filtered.filter((p) => {
        const name = p.name?.toLowerCase() || '';
        const address = p.address?.toLowerCase() || '';
        const location = selectedLocation.toLowerCase();
        
        // Mekan adında konum var mı? (örn: "Starbucks - Beşiktaş")
        if (name.includes(` - ${location}`) || name.includes(` ${location}`)) {
          return true;
        }
        // Adres içinde konum var mı?
        if (address.includes(location)) {
          return true;
        }
        return false;
      });
    }

    // Sıralama
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    } else if (sortBy === 'rating') {
      // Rating'e göre sıralama (şimdilik default sıralama)
      filtered = filtered; // Backend'den rating gelirse buraya eklenebilir
    }

    // Return filtered results (slicing will be done in useEffect)
    return filtered;
  }, [selectedCategory, selectedLocation, searchQuery, sortBy]);

  // Memoize filter application
  const filteredPlaces = useMemo(() => {
    if (allPlaces.length === 0) return [];
    return applyFilters(allPlaces);
  }, [allPlaces, applyFilters]);

  useEffect(() => {
    if (filteredPlaces.length > 0) {
      setPlaces(filteredPlaces.slice(0, 12));
    } else {
      setPlaces([]);
    }
  }, [filteredPlaces]);

  const clearAllFilters = () => {
    lightImpact();
    setSelectedCategory(null);
    setSelectedLocation(null);
    setSearchQuery('');
    setSortBy('default');
  };

  const handleLocationSelect = (loc: string) => {
    lightImpact();
    setSelectedLocation(selectedLocation === loc ? null : loc);
  };

  const handleCategorySelect = (cat: string) => {
    lightImpact();
    setSelectedCategory(selectedCategory === cat ? null : cat);
  };

  const handleSortSelect = (sort: 'default' | 'name') => {
    lightImpact();
    setSortBy(sort);
  };

  const hasActiveFilters = selectedCategory || selectedLocation || searchQuery.trim() || sortBy !== 'default';

  const getLocationFromName = (name: string) => {
    if (!name || !name.includes(' - ')) return undefined;
    return name.split(' - ')[1]?.trim();
  };

  const renderPlaceItem = useCallback(
    ({ item, index }: { item: Place; index: number }) => (
      <AnimatedPlaceCard
        index={index}
        image={getPlaceImageSource(item)}
        imagePlaceholder={!item.photo_url}
        title={item.name}
        subtitle={item.subtitle}
        tags={item.tags}
        location={getLocationFromName(item.name)}
        onPress={() => router.push({ pathname: '/place/[id]', params: { id: String(item.id) } })}
      />
    ),
    []
  );

  return (
    <Screen ref={screenRef} onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[createTextStyle('title', colors.text.primary), styles.headerTitle]}>
          Ana Sayfa
        </Text>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.push('/(tabs)/profile');
          }}
          style={[styles.profileButton, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="person.fill" size={18} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Mekan ara..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Quick Filters */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          onPress={() => { lightImpact(); setShowFilters(!showFilters); }}
          activeOpacity={0.7}
          style={[styles.filterButton, { 
            backgroundColor: colors.surface.elevated, 
            borderColor: hasActiveFilters ? colors.accent.primary : colors.surface.border 
          }]}
        >
          <IconSymbol name="slider.horizontal.3" size={16} color={colors.text.secondary} />
          <Text style={[styles.filterButtonText, { color: colors.text.primary }]}>
            Filtreler
          </Text>
          {hasActiveFilters && (
            <View style={[styles.filterDot, { backgroundColor: colors.accent.primary }]} />
          )}
        </TouchableOpacity>
        
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={clearAllFilters}
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
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Konum</Text>
            <View style={styles.filterChips}>
              {['Beşiktaş', 'Kadıköy', 'Taksim', 'Nişantaşı'].map((loc) => (
                <Chip
                  key={loc}
                  label={loc}
                  size="small"
                  active={selectedLocation === loc}
                  onPress={() => handleLocationSelect(loc)}
                  style={{ marginRight: 10, marginBottom: 12 }}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Kategori</Text>
            <View style={styles.filterChips}>
              {['Café', 'Restoran', 'Bar'].map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  size="small"
                  active={selectedCategory === cat}
                  onPress={() => handleCategorySelect(cat)}
                  style={{ marginRight: 10, marginBottom: 8 }}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContainer}>
          <LoadingState message="Mekanlar yükleniyor..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <ErrorState
            title="Mekanlar Yüklenemedi"
            description={error}
            onRetry={loadPlaces}
          />
        </View>
      ) : places.length === 0 ? (
        <View style={styles.centerContainer}>
          <EmptyState
            icon={hasActiveFilters ? "magnifyingglass" : "mappin.slash"}
            title={hasActiveFilters ? "Sonuç Bulunamadı" : "Henüz Mekan Yok"}
            description={hasActiveFilters ? "Filtrelerinizi değiştirip tekrar deneyin" : "Yakında yeni mekanlar eklenecek"}
            actionLabel={hasActiveFilters ? "Filtreleri Temizle" : undefined}
            onAction={hasActiveFilters ? () => {
              setSelectedCategory(null);
              setSelectedLocation(null);
              setSearchQuery('');
              setSortBy('default');
            } : undefined}
          />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => String(item.id)}
          scrollEnabled={false}
          initialNumToRender={6}
          windowSize={7}
          removeClippedSubviews={true}
          renderItem={renderPlaceItem}
          listKey="home-place-list"
          contentContainerStyle={styles.listContent}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: s(5),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    marginBottom: s(5),
    width: '100%',
  },
  searchInput: {
    marginBottom: 0,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: s(2),
    marginBottom: s(5),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: s(4),
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
    paddingHorizontal: s(4),
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
    padding: s(4),
    marginBottom: s(5),
    gap: s(4),
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  listContent: {
    gap: s(5),
    paddingBottom: s(4),
  },
});
