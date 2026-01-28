/**
 * Saved Screen
 * 
 * Saved places management screen.
 * Spotify-inspired dark theme design.
 * 
 * @module app/(tabs)/saved
 */

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Screen, Section } from '@/components/layout';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Button, EmptyState, AnimatedPlaceCard } from '@/components/ui';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { createTextStyle } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { lightImpact, success } from '@/src/utils/haptics';
import { getPlaces } from '@/src/services/mekanService';

export default function SavedScreen() {
  const { colors, spacing } = useTheme();
  const ids = useSavedPlaces((s) => s.ids);
  const byId = useSavedPlaces((s) => s.byId);
  const clear = useSavedPlaces((s) => s.clear);
  const remove = useSavedPlaces((s) => s.remove);
  const [refreshing, setRefreshing] = useState(false);

  const items = useMemo(() => ids.map((id) => byId[id]).filter(Boolean), [ids, byId]);

  const titleStyle = createTextStyle('title', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);

  const handleClear = () => {
    if (!items.length) return;
    Alert.alert('Temizle?', 'Tüm kaydedilen mekanlar silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          lightImpact();
          clear();
        },
      },
    ]);
  };

  const handleRemove = (id: string | number) => {
    lightImpact();
    remove(id);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    lightImpact();
    // Refresh saved places (could sync with backend in future)
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  return (
    <Screen onRefresh={handleRefresh} refreshing={refreshing}>
      {/* Header */}
      <View style={[styles.header, { marginTop: spacing.base, marginBottom: spacing.xl }]}>
        <View style={{ flex: 1 }}>
          <Text style={[titleStyle, styles.title]}>Kaydedilenler</Text>
          <Text style={[subtitleStyle, styles.subtitle]}>
            Kaydettiğin mekanlar burada
          </Text>
        </View>
        {items.length > 0 && (
          <View style={styles.headerActions}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: colors.surface.default,
                  borderColor: colors.surface.border,
                },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.text.secondary }]}>
                {items.length} kayıt
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={0.8}
              style={[
                styles.clearButton,
                {
                  backgroundColor: colors.semantic.error + '20',
                  borderColor: colors.semantic.error,
                },
              ]}
            >
              <IconSymbol name="trash" size={16} color={colors.semantic.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Henüz kayıt yok"
          description="Explore'dan beğendiğin mekanları 'Kaydet' diyerek buraya ekleyebilirsin."
          actionLabel="Keşfet'e Git"
          onAction={() => router.push('/(tabs)/explore')}
        />
      ) : (
        <Section title={`Kaydedilenler (${items.length})`}>
          {items.map((place, idx) => (
            <View key={place.id} style={styles.cardWrapper}>
              <AnimatedPlaceCard
                index={idx}
                image={getPlaceImageSource(place)}
                title={place.name}
                subtitle={place.subtitle}
                rank={idx + 1}
                onPress={() =>
                  router.push({ pathname: '/place/[id]', params: { id: String(place.id) } })
                }
              />
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handleRemove(place.id)}
                style={[
                  styles.removeButton,
                  {
                    backgroundColor: colors.semantic.error + '20',
                    borderColor: colors.semantic.error,
                  },
                ]}
              >
                <IconSymbol name="xmark" size={14} color={colors.semantic.error} />
              </TouchableOpacity>
            </View>
          ))}
        </Section>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  clearButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    zIndex: 10,
  },
});
