/**
 * Home Screen
 * 
 * Main discovery screen with featured places and quick access.
 * Spotify-inspired dark theme design.
 * 
 * @module app/(tabs)/index
 */

import { router } from 'expo-router';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/hooks/useTheme';
import { Screen, Section } from '@/components/layout';
import { PlaceCard } from '@/components/place/PlaceCard';
import { SearchInput, Chip, FilterCard, Card, Button, PlaceCardSkeleton, AnimatedPlaceCard } from '@/components/ui';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { createTextStyle, spacing } from '@/constants/design';
import { getPlaces } from '@/src/services/mekanService';
import type { Place } from '@/src/services/mekanService';
import { handleApiError } from '@/src/utils/errorHandler';
import { lightImpact } from '@/src/utils/haptics';

export default function HomeScreen() {
  const { colors, spacing, typography } = useTheme();
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
  const [refreshing, setRefreshing] = useState(false);

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

  // Marka adı
  const brandName = 'AsEmOs';

  const getDateText = () => {
    const date = new Date();
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    const months = [
      'Ocak',
      'Şubat',
      'Mart',
      'Nisan',
      'Mayıs',
      'Haziran',
      'Temmuz',
      'Ağustos',
      'Eylül',
      'Ekim',
      'Kasım',
      'Aralık',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const greetingStyle = createTextStyle('title', colors.text.primary);
  const dateStyle = createTextStyle('bodySmall', colors.text.secondary);

  return (
    <Screen onRefresh={handleRefresh} refreshing={refreshing}>
      {/* Header */}
      <View style={[styles.header, { marginTop: spacing.base, marginBottom: spacing.xl }]}>
        <View>
          <Text style={[greetingStyle, styles.greeting]}>{brandName}</Text>
          <Text style={[dateStyle, styles.date]}>{getDateText()}</Text>
        </View>
        <View
          style={[
            styles.statsContainer,
            {
              backgroundColor: colors.surface.default,
              borderColor: colors.surface.border,
            },
          ]}
        >
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent.primary }]}>
              {loading ? '...' : '121+'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Mekan</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.accent.primary }]}>
              {savedCount}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text.secondary }]}>Kayıtlı</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Mekan ara..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />
      </View>

      {/* Active Filters & Results Count */}
      {hasActiveFilters && (
        <View style={[styles.activeFiltersBar, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
          <View style={styles.activeFiltersContent}>
            <Text style={[styles.resultsCount, { color: colors.text.primary }]}>
              {places.length} mekan bulundu
            </Text>
            <TouchableOpacity
              onPress={clearAllFilters}
              style={[styles.clearButton, { backgroundColor: colors.surface.default }]}
            >
              <Text style={[styles.clearButtonText, { color: colors.accent.primary }]}>
                Filtreleri Temizle
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.activeFiltersChips}>
            {selectedLocation && (
              <Chip
                label={`Konum: ${selectedLocation}`}
                active
                onPress={() => setSelectedLocation(null)}
              />
            )}
            {selectedCategory && (
              <Chip
                label={`Kategori: ${selectedCategory}`}
                active
                onPress={() => setSelectedCategory(null)}
              />
            )}
            {searchQuery.trim() && (
              <Chip
                label={`Arama: ${searchQuery}`}
                active
                onPress={() => setSearchQuery('')}
              />
            )}
          </View>
        </View>
      )}

      {/* Filter Toggle Button */}
      <TouchableOpacity
        onPress={() => setShowFilters(!showFilters)}
        style={[styles.filterToggle, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
      >
        <Text style={[styles.filterToggleText, { color: colors.text.primary }]}>
          {showFilters ? 'Filtreleri Gizle' : 'Filtreleri Göster'}
        </Text>
        <IconSymbol
          name={showFilters ? 'chevron.up' : 'chevron.down'}
          size={24}
          color={colors.text.secondary}
        />
      </TouchableOpacity>

      {/* Filters Section - Trendyol Style */}
      {showFilters && (
        <Card style={[styles.filtersCard, { marginBottom: spacing.base }]}>
          {/* Location Filters */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Konum Seç
            </Text>
            <View style={styles.filterCardsContainer}>
              {['Beşiktaş', 'Nişantaşı', 'Taksim', 'Kadıköy', 'Levent', 'Bebek', 'Üsküdar', 'Ortaköy'].map((loc) => {
                const count = allPlaces.filter(p => {
                  const name = p.name?.toLowerCase() || '';
                  return name.includes(` - ${loc.toLowerCase()}`) || name.includes(` ${loc.toLowerCase()}`);
                }).length;
                return (
                  <FilterCard
                    key={loc}
                    label={loc}
                    value={count > 0 ? `${count} mekan` : undefined}
                    active={selectedLocation === loc}
                    icon="location.fill"
                    onPress={() => handleLocationSelect(loc)}
                  />
                );
              })}
            </View>
          </View>

          {/* Category Filters */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Kategori Seç
            </Text>
            <View style={styles.filterCardsContainer}>
              {['Café', 'Restoran', 'Bar', 'Gece Kulübü'].map((cat) => {
                const count = allPlaces.filter(p => {
                  const name = p.name?.toLowerCase() || '';
                  const category = p.category?.toLowerCase() || '';
                  if (cat === 'Gece Kulübü') {
                    return name.includes('sortie') || name.includes('reina') || 
                           name.includes('anjelique') || name.includes('ruby') || name.includes('29');
                  }
                  if (cat === 'Café') {
                    return name.includes('espresso') || name.includes('starbucks') || 
                           name.includes('kahve') || name.includes('café') || name.includes('cafe') ||
                           name.includes('nero') || name.includes('mado') || name.includes('simit') ||
                           category === 'kafe';
                  }
                  if (cat === 'Restoran') {
                    return name.includes('nusr') || name.includes('günaydın') || 
                           name.includes('muhallebi') || name.includes('sütiş') ||
                           name.includes('çiya') || name.includes('ocakbaşı') ||
                           name.includes('mikla') || name.includes('sunset') ||
                           category === 'restoran';
                  }
                  if (cat === 'Bar') {
                    return name.includes('bar') || name.includes('360') || category === 'bar';
                  }
                  return false;
                }).length;
                return (
                  <FilterCard
                    key={cat}
                    label={cat}
                    value={count > 0 ? `${count} mekan` : undefined}
                    active={selectedCategory === cat}
                    onPress={() => handleCategorySelect(cat)}
                  />
                );
              })}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text.primary }]}>
              Sıralama
            </Text>
            <View style={styles.filterCardsContainer}>
              <FilterCard
                label="Varsayılan"
                active={sortBy === 'default'}
                icon="slider.horizontal.3"
                onPress={() => handleSortSelect('default')}
              />
              <FilterCard
                label="İsme Göre (A-Z)"
                active={sortBy === 'name'}
                icon="arrow.up.arrow.down"
                onPress={() => handleSortSelect('name')}
              />
            </View>
          </View>
        </Card>
      )}

      {/* Results Header */}
      {!loading && !error && places.length > 0 && (
        <View style={[styles.resultsHeader, { marginBottom: spacing.base }]}>
          <Text style={[styles.resultsHeaderText, { color: colors.text.primary }]}>
            {places.length} mekan bulundu
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={clearAllFilters}
              style={styles.clearFiltersButton}
            >
              <Text style={[styles.clearFiltersText, { color: colors.accent.primary }]}>
                Temizle
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Featured Places */}
      <Section title={hasActiveFilters ? "Sonuçlar" : "Öne Çıkan Mekanlar"}>
        {loading ? (
          <PlaceCardSkeleton count={6} />
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: colors.semantic.error }]}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={loadPlaces}
              style={[styles.retryButton, { backgroundColor: colors.accent.primary }]}
            >
              <Text style={[styles.retryText, { color: colors.text.inverse }]}>
                Tekrar Dene
              </Text>
            </TouchableOpacity>
          </View>
        ) : places.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
              Henüz mekan bulunmuyor
            </Text>
          </View>
        ) : (
          places.map((place, index) => (
            <AnimatedPlaceCard
              key={place.id}
              index={index}
              image={getPlaceImageSource(place)}
              title={place.name}
              subtitle={place.subtitle}
              tags={place.tags}
              onPress={() => router.push({ pathname: '/place/[id]', params: { id: String(place.id) } })}
            />
          ))
        )}
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    marginBottom: 4,
  },
  date: {
    // Styling applied dynamically
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  searchContainer: {
    marginBottom: 24,
    width: '100%',
  },
  searchInput: {
    marginBottom: 0,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    marginBottom: 16,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  activeFiltersBar: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  activeFiltersContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeFiltersChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  filterToggleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersCard: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  filterCardsContainer: {
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  resultsHeaderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
