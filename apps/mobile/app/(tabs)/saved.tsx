/**
 * Saved Screen
 * 
 * Saved places management screen.
 * Spotify-inspired dark theme design.
 * 
 * @module app/(tabs)/saved
 */

import { router, useNavigation } from 'expo-router';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, Animated, FlatList, ListRenderItem, ViewToken, RefreshControl } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { Screen } from '@/components/layout';
import { EmptyState, AnimatedPlaceCard } from '@/components/ui';
import { useAppStore, type SavedPlace } from '@/src/store/useAppStore';
import { getPlaceImageSource, hasPlaceImage } from '@/src/utils/placeImages';
import { createTextStyle, spacing as designSpacing } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import { getAllPlaces } from '@/src/services/mekanService';
import type { Place } from '@/src/services/mekanService';

export default function SavedScreen() {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const ids = useAppStore((s) => s.savedIds);
  const byId = useAppStore((s) => s.savedById);
  const clear = useAppStore((s) => s.clearSaved);
  const remove = useAppStore((s) => s.removeSaved);
  const [refreshing, setRefreshing] = useState(false);
  const [placesData, setPlacesData] = useState<Record<string, Place>>({});
  const [viewableItems, setViewableItems] = useState(new Set<string>()); // Added viewableItems state

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress' as any, () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  // API'den tüm mekanları çek ve cache'le
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const places = await getAllPlaces();
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

  const items: SavedPlace[] = useMemo(() => { // Explicitly define type as SavedPlace[]
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
    }).filter(Boolean) as SavedPlace[]; // Cast to SavedPlace[]
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

  const renderRightActions = useCallback(
    (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
      id: string | number
    ) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      });

      return (
        <TouchableOpacity
          onPress={() => handleRemove(id)}
          style={[styles.deleteAction, { backgroundColor: colors.semantic.error }]}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <IconSymbol name="trash.fill" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [handleRemove, colors.semantic.error]
  );

  const renderPlaceItem: ListRenderItem<SavedPlace> = useCallback(
    ({ item, index }) => (
      <Swipeable
        key={item.id}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <AnimatedPlaceCard
          index={index}
          image={getPlaceImageSource(item)}
          imagePlaceholder={!hasPlaceImage(item)}
          title={item.name}
          subtitle={item.subtitle}
          tags={item.tags}
          onPress={() =>
            router.push({ pathname: '/place/[id]', params: { id: String(item.id) } })
          }
        />
      </Swipeable>
    ),
    [viewableItems, renderRightActions]
  );

  const onViewableItemsChanged = useRef(({ viewableItems: vItems }: { viewableItems: ViewToken[] }) => {
    setViewableItems(new Set(vItems.map((item) => String(item.item.id))));
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const listHeader = useCallback(
    () => (
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
    ),
    [items.length, titleStyle, colors.surface.elevated, colors.text.secondary]
  );

  if (items.length === 0) {
    return (
      <Screen onRefresh={handleRefresh} refreshing={refreshing} withTabBar>
        <View style={styles.header}>
          <Text style={[titleStyle, styles.title]}>Kaydedilenler</Text>
        </View>
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="bookmark"
            title="Henüz kayıt yok"
            description="Beğendiğin mekanları kaydet"
            actionLabel="Keşfet"
            onAction={() => router.push('/(tabs)/explore')}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable={false} withTabBar>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderPlaceItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContainer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
            colors={[colors.accent.primary]}
          />
        }
        style={styles.flatList}
      />
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
  flatList: {
    flex: 1,
  },
  listContainer: {
    gap: designSpacing.sm,
    paddingBottom: designSpacing.xl,
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