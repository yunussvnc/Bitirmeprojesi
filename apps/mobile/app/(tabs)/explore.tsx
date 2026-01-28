/**
 * Explore Screen
 * 
 * AI-powered recommendations screen with filters and search.
 * Spotify-inspired dark theme design.
 * 
 * @module app/(tabs)/explore
 */

import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen, Section } from '@/components/layout';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Button, Chip, SearchInput, Card, EmptyState, AnimatedPlaceCard } from '@/components/ui';
import { recommendPlaces } from '@/src/services/api';
import { usePreferences } from '@/src/state/preferences';
import type { PlaceCard as PlaceCardType, RecommendResponse } from '@/src/types/recommend';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { createTextStyle } from '@/constants/design';
import { lightImpact } from '@/src/utils/haptics';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/components/ui/icon-symbol';

function prefsToBadges(p: typeof usePreferences extends (selector: infer S) => any ? ReturnType<S>['prefs'] : never) {
  const vibe = p.vibe === 'quiet' ? 'Sessiz' : 'Canlı';
  const purpose =
    p.purpose === 'work' ? 'Çalışma' : p.purpose === 'friends' ? 'Arkadaş' : 'Date';
  const budget = p.budget === 'low' ? '₺ Düşük' : p.budget === 'mid' ? '₺₺ Orta' : '₺₺₺ Yüksek';
  return [vibe, purpose, budget];
}

export default function ExploreScreen() {
  const { colors, spacing, typography } = useTheme();
  const [query, setQuery] = useState('');
  const { prefs, patchPrefs, resetPrefs } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string>('');
  const [items, setItems] = useState<PlaceCardType[]>([]);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  const savedIds = useSavedPlaces((s) => s.ids);
  const toggle = useSavedPlaces((s) => s.toggle);

  const requestBody = useMemo(
    () => ({
      queryText: query,
      preferences: prefs,
    }),
    [query, prefs]
  );

  async function runRecommend() {
    try {
      setError('');
      setLoading(true);
      const res: RecommendResponse = await recommendPlaces(requestBody);
      setItems(res.items);
      setExplanation(res.explanation);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error 
        ? (e as any).userMessage || e.message 
        : 'Bir hata oluştu';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runRecommend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    lightImpact();
    await runRecommend();
    setRefreshing(false);
  };

  const topBadges = useMemo(() => prefsToBadges(prefs), [prefs]);
  const titleStyle = createTextStyle('title', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);

  return (
    <Screen onRefresh={handleRefresh} refreshing={refreshing}>
      {/* Header */}
      <View style={[styles.header, { marginTop: spacing.base, marginBottom: spacing.xl }]}>
        <View style={{ flex: 1 }}>
          <Text style={[titleStyle, styles.title]}>AsEmOs AI</Text>
          <Text style={[subtitleStyle, styles.subtitle]}>
            Size özel mekan önerileri
          </Text>
        </View>
        {items.length > 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.accent.primary,
                borderColor: colors.accent.primary,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.text.inverse }]}>
              {items.length} öneri
            </Text>
          </View>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder="Ne arıyorsun? (örn: sessiz çalışmalık kafe)"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={runRecommend}
          containerStyle={styles.searchInput}
        />
        <Text style={[styles.helper, { color: colors.text.tertiary }]}>
          Yaz veya filtrelerle özelleştir
        </Text>
      </View>

      {/* Active Filters */}
      {topBadges.length > 0 && (
        <View style={styles.activeFilters}>
          <Text style={[styles.sectionLabel, { color: colors.text.secondary }]}>
            Aktif Filtreler
          </Text>
          <View style={styles.chipsContainer}>
            {topBadges.map((badge) => (
              <Chip key={badge} label={badge} />
            ))}
          </View>
        </View>
      )}

      {/* Filter Card */}
      <Card style={[styles.filterCard, { marginTop: spacing.base }]}>
        <View style={styles.filterHeader}>
          <Text style={[styles.filterTitle, { color: colors.text.primary }]}>Filtreler</Text>
          <TouchableOpacity
            onPress={() => {
              resetPrefs();
              setTimeout(() => runRecommend(), 0);
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.resetText, { color: colors.accent.primary }]}>Temizle</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.filterContent, { marginTop: spacing.base }]}>
          {/* Vibe */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Vibe</Text>
            <View style={styles.chipsContainer}>
              <Chip
                label="Sessiz"
                active={prefs.vibe === 'quiet'}
                onPress={() => {
                  patchPrefs({ vibe: 'quiet' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Canlı"
                active={prefs.vibe === 'lively'}
                onPress={() => {
                  patchPrefs({ vibe: 'lively' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
            </View>
          </View>

          {/* Purpose */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Amaç</Text>
            <View style={styles.chipsContainer}>
              <Chip
                label="Çalışma"
                active={prefs.purpose === 'work'}
                onPress={() => {
                  patchPrefs({ purpose: 'work' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Arkadaş"
                active={prefs.purpose === 'friends'}
                onPress={() => {
                  patchPrefs({ purpose: 'friends' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Date"
                active={prefs.purpose === 'date'}
                onPress={() => {
                  patchPrefs({ purpose: 'date' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
            </View>
          </View>

          {/* Budget */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text.secondary }]}>Bütçe</Text>
            <View style={styles.chipsContainer}>
              <Chip
                label="Düşük"
                active={prefs.budget === 'low'}
                onPress={() => {
                  patchPrefs({ budget: 'low' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Orta"
                active={prefs.budget === 'mid'}
                onPress={() => {
                  patchPrefs({ budget: 'mid' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
              <Chip
                label="Yüksek"
                active={prefs.budget === 'high'}
                onPress={() => {
                  patchPrefs({ budget: 'high' });
                  setTimeout(() => runRecommend(), 0);
                }}
              />
            </View>
          </View>
        </View>
      </Card>

      {/* Get Recommendations Button */}
      <Button
        variant="primary"
        size="large"
        onPress={runRecommend}
        loading={loading}
        disabled={loading}
        style={styles.recommendButton}
      >
        Öneri Getir
      </Button>

      {/* Error */}
      {error && (
        <View
          style={[
            styles.errorContainer,
            {
              backgroundColor: colors.semantic.error + '20',
              borderColor: colors.semantic.error,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: colors.semantic.error }]}>Hata: {error}</Text>
        </View>
      )}

      {/* AI Explanation */}
      {explanation && (
        <Card style={[styles.explanationCard, { marginTop: spacing.base }]}>
          <View style={styles.explanationHeader}>
            <Text style={[styles.explanationTitle, { color: colors.text.primary }]}>
              Neden bu öneriler?
            </Text>
            <Chip label="AI" />
          </View>
          <Text style={[styles.explanationText, { color: colors.text.secondary }]}>
            {explanation}
          </Text>
        </Card>
      )}

      {/* Results */}
      {items.length > 0 && (
        <Section title={`Sonuçlar (${items.length})`} style={styles.resultsSection}>
          {items.map((place, idx) => {
            const id = String((place as any).id);
            const saved = savedIds.includes(id);

            return (
              <View key={id} style={styles.cardWrapper}>
                <AnimatedPlaceCard
                  index={idx}
                  image={getPlaceImageSource({ id, name: place.name, category: (place as any).category } as any)}
                  title={place.name}
                  subtitle={place.subtitle}
                  tags={place.tags}
                  rank={idx + 1}
                  onPress={() =>
                    router.push({ pathname: '/place/[id]', params: { id } } as any)
                  }
                />
                <View style={styles.saveButtonContainer}>
                  <BlurView intensity={60} style={styles.saveButtonBlur}>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => {
                        lightImpact();
                        toggle({
                          id,
                          name: place.name,
                          subtitle: place.subtitle,
                        });
                      }}
                      style={[
                        styles.saveButton,
                        {
                          backgroundColor: saved
                            ? colors.accent.primary
                            : 'rgba(255, 255, 255, 0.15)',
                        },
                      ]}
                    >
                      <IconSymbol
                        name={saved ? 'heart.fill' : 'heart'}
                        size={18}
                        color={saved ? colors.text.inverse : colors.text.primary}
                      />
                    </TouchableOpacity>
                  </BlurView>
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && !error && (
        <EmptyState
          icon="magnifyingglass"
          title="Henüz sonuç yok"
          description="Filtreleri değiştirip tekrar dene veya arama yap"
          actionLabel="Filtreleri Temizle"
          onAction={() => {
            resetPrefs();
            runRecommend();
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginTop: 4,
  },
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    marginBottom: 8,
  },
  helper: {
    fontSize: 12,
    marginTop: 4,
  },
  activeFilters: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterCard: {
    marginBottom: 16,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterContent: {
    gap: 16,
  },
  filterSection: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  recommendButton: {
    marginTop: 8,
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 14,
  },
  explanationCard: {
    marginBottom: 16,
  },
  explanationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  resultsSection: {
    marginTop: 24,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  saveButtonContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  saveButtonBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
