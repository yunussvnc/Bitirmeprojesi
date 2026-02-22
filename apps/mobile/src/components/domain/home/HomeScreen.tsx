/**
 * Ana Sayfa – Keşfet + Ana Sayfa Birleşimi
 *
 * Arama, tercihler, filtreler ve AI önerisi tek ekranda.
 * UX/UI uyumlu, kompakt düzen.
 */

import { router, useNavigation } from "expo-router";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ViewToken,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlatList } from "react-native-gesture-handler";
import * as Location from "expo-location";
import { useTheme } from "@/src/hooks/useTheme";
import { Screen, type ScreenRef } from "@/src/components/shared/layout";
import {
  ChatInput,
  AnimatedPlaceCard,
  ErrorState,
  EmptyState,
  PlaceCardSkeleton,
  FilterBottomSheet,
  getFilterSummaryChips,
  countActiveFilters,
  IconSymbol,
  type FilterValues,
} from "@/src/components/shared/ui";
import { usePreferences } from "@/src/store/preferences";
import { getPlaceImageSource, hasPlaceImage } from "@/src/utils/placeImages";
import { createTextStyle, s } from "@/src/constants/design";
import { getAllPlaces } from "@/src/services/mekanService";
import { recommendPlaces } from "@/src/services/api";
import type { Place } from "@/src/services/mekanService";
import type { RecommendItem, RecommendResponse } from "@/src/types/recommend";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";
import { useAppStore } from "@/src/store/useAppStore";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";

/** İstanbul ilçeleri */
const DISTRICTS = [
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy",
  "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece",
  "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa",
  "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik",
  "Sancaktepe", "Sarıyer", "Silivri", "Şile", "Şişli", "Sultanbeyli", "Sultangazi",
  "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu",
];

const PLACE_TYPES = [
  "Bar", "Meyhane", "Gece Kulübü", "Kafe", "Restoran", "Fast Food",
  "Kebapçı", "Balıkçı", "Tatlıcı", "Pastane", "Burgerci", "Pizzacı", "Dönerci", "Nargile Cafe",
];

type DisplayMode = "browse" | "ai";

/** Common shape for list items (RecommendItem | Place) */
type PlaceLike = { id: number | string; name?: string; category?: string; photo_url?: string; description?: string; subtitle?: string; tags?: string[] };

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
  savedCount,
  onSavedPress,
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
  savedCount: number;
  onSavedPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>Ana Sayfa</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onSavedPress}
          style={[styles.savedBtn, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="bookmark.fill" size={22} color={colors.text.secondary} />
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
          onPress={() => {
            lightImpact();
            setFilterSheetOpen(true);
          }}
          activeOpacity={0.7}
          style={[
            styles.filterTrigger,
            {
              backgroundColor: hasActiveFilters ? colors.accent.primary + "12" : colors.background.tertiary,
              borderColor: hasActiveFilters ? colors.accent.primary + "30" : colors.surface.border,
            },
          ]}
        >
          <IconSymbol
            name="slider.horizontal.3"
            size={15}
            color={hasActiveFilters ? colors.accent.primary : colors.text.tertiary}
          />
          <Text style={[styles.filterTriggerText, { color: hasActiveFilters ? colors.accent.primary : colors.text.secondary }]}>
            {activeFilterCount > 0 ? `Filtreler (${activeFilterCount})` : "Filtreler"}
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
        <View
          style={[
            styles.summaryBanner,
            { backgroundColor: colors.accent.primary + "10", borderColor: colors.accent.primary + "25" },
          ]}
        >
          <View style={styles.summaryBannerIcon}>
            <IconSymbol name="sparkles" size={14} color={colors.accent.primary} />
          </View>
          <Text style={[styles.summaryBannerText, { color: colors.text.secondary }]} numberOfLines={3}>
            {aiSummary}
          </Text>
          <TouchableOpacity onPress={() => setAiSummary("")} hitSlop={8}>
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
  const savedIds = useAppStore((s) => s.savedIds);

  const [query, setQuery] = useState("");
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiItems, setAiItems] = useState<RecommendItem[]>([]);
  const [aiSummary, setAiSummary] = useState("");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("browse");
  const [refreshing, setRefreshing] = useState(false);
  const [placesById, setPlacesById] = useState<Record<string, Place>>({});
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [miniBarVisible, setMiniBarVisible] = useState(false);
  const miniBarAnim = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const lastToggleY = useRef(0);
  const lastDirection = useRef<"up" | "down" | null>(null);
  const miniBarVisibleRef = useRef(false);
  const { hide: hideTabBar, show: showTabBar } = useTabBarVisibility();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<FilterValues>({
    location: null,
    category: null,
    vibe: null,
    purpose: null,
    budget: null,
  });

  useEffect(() => {
    const unsub = navigation.addListener("tabPress" as any, () => {
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
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      // Fallback: İstanbul merkez
    }
  };

  useEffect(() => {
    if (allPlaces.length > 0) {
      const map: Record<string, Place> = {};
      allPlaces.forEach((p) => {
        map[String(p.id)] = p;
      });
      setPlacesById(map);
    }
  }, [allPlaces]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      setError("");
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
      setError("");
      setAiSummary("");
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
      setAiSummary(res.summary || "");
      setDisplayMode("ai");
    } catch (e: unknown) {
      const err = handleApiError(e).userMessage;
      setError(err);
    } finally {
      setAiLoading(false);
    }
  }, [query, prefs, filters, userLocation]);

  const animateMiniBar = useCallback(
    (visible: boolean) => {
      if (miniBarVisibleRef.current === visible) return;
      miniBarVisibleRef.current = visible;
      setMiniBarVisible(visible);
      if (visible) hideTabBar();
      else showTabBar();
      Animated.timing(miniBarAnim, {
        toValue: visible ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [miniBarAnim, hideTabBar, showTabBar]
  );

  const handleScroll = useCallback(
    (rawY: number) => {
      const y = Math.max(rawY, 0);
      const dy = y - lastScrollY.current;
      lastScrollY.current = y;

      if (y <= 0) {
        animateMiniBar(false);
        lastToggleY.current = 0;
        lastDirection.current = null;
        return;
      }

      if (dy === 0) return;

      const direction: "up" | "down" = dy > 0 ? "down" : "up";
      if (direction !== lastDirection.current) {
        lastDirection.current = direction;
        lastToggleY.current = y;
      }

      if (direction === "down") {
        if (miniBarVisibleRef.current) animateMiniBar(false);
      } else {
        if (!miniBarVisibleRef.current && y > 120 && lastToggleY.current - y >= 20) {
          animateMiniBar(true);
          lastToggleY.current = y;
        }
      }
    },
    [animateMiniBar]
  );

  const miniBarOpacity = miniBarAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const miniBarTranslateY = miniBarAnim.interpolate({ inputRange: [0, 1], outputRange: [-48, 0] });

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
    const norm = (str: string) =>
      str
        .toLowerCase()
        .replace(/ı/g, "i")
        .replace(/ş/g, "s")
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c");

    if (filters.category) {
      const search = norm(filters.category);
      list = list.filter((p) => {
        const cat = norm(p.category ?? "");
        const name = norm(p.name ?? "");
        const desc = norm(p.description ?? "");
        const sub = norm(p.subtitle ?? "");
        return cat.includes(search) || name.includes(search) || desc.includes(search) || sub.includes(search);
      });
    }
    if (filters.location) {
      const locNorm = filters.location.toLowerCase();
      list = list.filter((p) => {
        const name = (p.name ?? "").toLowerCase();
        const addr = (p.address ?? "").toLowerCase();
        return name.includes(` - ${locNorm}`) || name.includes(` ${locNorm}`) || addr.includes(locNorm);
      });
    }
    return list.slice(0, 12);
  }, [allPlaces, filters.category, filters.location]);

  const displayList = displayMode === "ai" ? aiItems : filteredPlaces;
  const isAiMode = displayMode === "ai";

  const handleApplyFilters = useCallback(
    (v: FilterValues) => {
      setFilters(v);
      patchPrefs({
        vibe: v.vibe ?? undefined,
        purpose: v.purpose ?? undefined,
        budget: v.budget ?? undefined,
      });
    },
    [patchPrefs]
  );

  const clearAll = useCallback(() => {
    lightImpact();
    resetPrefs();
    setFilters({ location: null, category: null, vibe: null, purpose: null, budget: null });
    setQuery("");
    setDisplayMode("browse");
  }, [resetPrefs]);

  const getLocationFromName = (name: string) => (name?.includes(" - ") ? name.split(" - ")[1]?.trim() : undefined);

  const navigatingRef = useRef(false);
  const handlePlacePress = useCallback((id: string) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    lightImpact();
    router.push({ pathname: "/place/[id]", params: { id } } as any);
    setTimeout(() => {
      navigatingRef.current = false;
    }, 1000);
  }, []);

  const renderPlaceItem = useCallback(
    ({ item, index }: { item: RecommendItem | Place; index: number }) => {
      const it = item as PlaceLike;
      const id = String(it.id);
      const place = placesById[id] || (item as Place);
      const merged = {
        id,
        name: it.name,
        category: it.category ?? place?.category,
        photo_url: it.photo_url ?? place?.photo_url,
        description: it.description ?? place?.description,
        subtitle: it.subtitle ?? place?.subtitle,
      };
      const loc = getLocationFromName(it.name ?? "");
      const isAi = displayMode === "ai";

      return (
        <AnimatedPlaceCard
          key={id}
          index={index}
          image={getPlaceImageSource(merged)}
          imagePlaceholder={!hasPlaceImage(merged)}
          title={it.name ?? "Mekan"}
          subtitle={it.subtitle ?? place?.subtitle}
          tags={it.tags ?? place?.tags}
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

  const onViewableItemsChanged = useRef(({ viewableItems: v }: { viewableItems: ViewToken[] }) => { }).current;
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const listEmpty = useCallback(() => {
    if (loading && allPlaces.length === 0) {
      return (
        <View style={styles.skeletonWrap}>
          <PlaceCardSkeleton count={4} />
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
            variant="search"
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
            variant={hasActiveFilters ? "search" : "places"}
            title={hasActiveFilters ? "Sonuç bulunamadı" : "Henüz mekan yok"}
            description={hasActiveFilters ? "Filtreleri değiştirin" : "Yakında eklenecek"}
            actionLabel={hasActiveFilters ? "Temizle" : undefined}
            onAction={hasActiveFilters ? clearAll : undefined}
          />
        </View>
      );
    }
    return null;
  }, [
    loading,
    allPlaces.length,
    error,
    aiLoading,
    isAiMode,
    aiItems.length,
    filteredPlaces.length,
    hasActiveFilters,
    clearAll,
  ]);

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
          keyExtractor={(item) => String((item as PlaceLike).id)}
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
              savedCount={savedIds.length}
              onSavedPress={() => {
                lightImpact();
                router.push("/(tabs)/saved");
              }}
            />
          }
          ListEmptyComponent={listEmpty}
          contentContainerStyle={displayList.length > 0 ? styles.listContent : styles.listContentEmpty}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          scrollEventThrottle={16}
        />
        <Animated.View
          style={[
            styles.miniBar,
            {
              backgroundColor: colors.background.primary,
              borderBottomColor: colors.surface.border,
              top: 0,
              opacity: miniBarOpacity,
              transform: [{ translateY: miniBarTranslateY }],
            },
          ]}
          pointerEvents={miniBarVisible ? "auto" : "none"}
        >
          <View style={styles.miniBarPlaceholder} />
          <Text style={[styles.miniTitle, { color: colors.text.primary }]}>Ana Sayfa</Text>
          <TouchableOpacity
            style={[styles.miniIconBtn, { backgroundColor: colors.surface.default }]}
            onPress={() => {
              lightImpact();
              router.push("/(tabs)/saved");
            }}
          >
            <IconSymbol name="bookmark.fill" size={18} color={colors.text.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: s(4),
    overflow: "visible",
  },
  headerLeft: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 0 },
  subtitle: { fontSize: 13, marginTop: 4, marginLeft: 16 },
  savedBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },
  savedBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  savedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  searchWrap: { marginBottom: s(3), minHeight: 72 },
  chatInput: { alignSelf: "stretch", minHeight: 64 },
  filterSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterTriggerText: { fontSize: 13, fontWeight: "600" },
  summaryTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  summaryTagText: { fontSize: 12, fontWeight: "500" },
  summaryBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: s(3),
  },
  aiLoadingText: { fontSize: 14, fontWeight: "600" },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: s(3),
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: s(5) },
  count: { fontSize: 13 },
  listContent: { gap: s(5), paddingBottom: s(8) },
  listContentEmpty: { flexGrow: 1 },
  centerWrap: { minHeight: 320, justifyContent: "center" },
  skeletonWrap: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  miniBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  miniTitle: { flex: 1, fontSize: 16, fontWeight: "700", textAlign: "center" },
  miniBarPlaceholder: { width: 34, height: 34 },
  miniIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
