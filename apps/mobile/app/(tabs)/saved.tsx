/**
 * Saved Screen
 * 
 * Saved places management screen.
 * Spotify-inspired dark theme design.
 * 
 * @module app/(tabs)/saved
 */

import { router, useNavigation } from 'expo-router';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { Screen, type ScreenRef } from '@/components/layout';
import { EmptyState, AnimatedPlaceCard } from '@/components/ui';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { createTextStyle, spacing as designSpacing } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import { getPlaces } from '@/src/services/mekanService';
import type { Place } from '@/src/services/mekanService';

export default function SavedScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const screenRef = useRef<ScreenRef>(null);
  const ids = useSavedPlaces((s) => s.ids);
  const byId = useSavedPlaces((s) => s.byId);
  const clear = useSavedPlaces((s) => s.clear);
  const remove = useSavedPlaces((s) => s.remove);
  const [refreshing, setRefreshing] = useState(false);
  const [placesData, setPlacesData] = useState<Record<string, Place>>({});

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, (e: any) => {
      screenRef.current?.scrollToTop();
    });
    return unsubscribe;
  }, [navigation]);

  // API'den tüm mekanları çek ve cache'le
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const places = await getPlaces();
        const placesMap: Record<string, Place> = {};
        places.forEach((place) => {
          placesMap[String(place.id)] = place;
        });
        setPlacesData(placesMap);
      } catch (error) {
        console.error('Error loading places:', error);
      }
    };
    loadPlaces();
  }, []);

  const items = useMemo(() => {
    return ids.map((id) => {
      const savedPlace = byId[id];
      const fullPlace = placesData[id];
      
      // API'den gelen tam bilgiyi kullan, yoksa kayıtlı bilgiyi kullan
      if (fullPlace) {
        return {
          ...savedPlace,
          photo_url: fullPlace.photo_url,
          category: fullPlace.category,
          tags: fullPlace.tags,
        };
      }
      
      return savedPlace;
    }).filter(Boolean);
  }, [ids, byId, placesData]);

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
    <Screen ref={screenRef} onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[titleStyle, styles.title]}>Kaydedilenler</Text>
        {items.length > 0 && (
          <View style={styles.headerRight}>
            <View style={[styles.countBadge, { backgroundColor: colors.surface.elevated }]}>
              <Text style={[styles.countText, { color: colors.text.secondary }]}>
                {items.length}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClear}
              activeOpacity={0.8}
              style={[styles.clearButton, { backgroundColor: colors.surface.elevated }]}
            >
              <IconSymbol name="trash" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Content */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bookmark"
            title="Henüz kayıt yok"
            description="Beğendiğin mekanları kaydet"
            actionLabel="Keşfet"
            onAction={() => router.push('/(tabs)/explore')}
          />
        </View>
      ) : (
        <View style={styles.listContainer}>
          {items.map((place, idx) => {
            const renderRightActions = (
              progress: Animated.AnimatedInterpolation<number>,
              dragX: Animated.AnimatedInterpolation<number>
            ) => {
              const scale = dragX.interpolate({
                inputRange: [-80, 0],
                outputRange: [1, 0],
                extrapolate: 'clamp',
              });

              return (
                <TouchableOpacity
                  onPress={() => handleRemove(place.id)}
                  style={[styles.deleteAction, { backgroundColor: colors.semantic.error }]}
                  activeOpacity={0.8}
                >
                  <Animated.View style={{ transform: [{ scale }] }}>
                    <IconSymbol name="trash.fill" size={24} color="#FFFFFF" />
                  </Animated.View>
                </TouchableOpacity>
              );
            };

            return (
              <Swipeable
                key={place.id}
                renderRightActions={renderRightActions}
                overshootRight={false}
                friction={2}
                rightThreshold={40}
              >
                <AnimatedPlaceCard
                  index={idx}
                  image={getPlaceImageSource(place)}
                  imagePlaceholder={!place.photo_url}
                  title={place.name}
                  subtitle={place.subtitle}
                  tags={place.tags}
                  onPress={() =>
                    router.push({ pathname: '/place/[id]', params: { id: String(place.id) } })
                  }
                />
              </Swipeable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designSpacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSpacing.sm,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  countText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  listContainer: {
    gap: designSpacing.sm,
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
    borderRadius: 12,
    marginLeft: designSpacing.sm,
  },
});
