/**
 * Cluster Places Screen
 *
 * Haritadaki yeşil küme (cluster) ikonuna tıklandığında açılan
 * Trendyol Yemek ilhamlı mekan listesi ekranı.
 *
 * Özellikler:
 * - Arama çubuğu (mekan adı, kategori, adres)
 * - Kategori ve durum filtreleri
 * - 12'lik sayfalama ile sonsuz scroll
 * - Mekan kartına tıklayınca detay sayfasına gidiş
 * - Geri ok tuşuyla bu listeye dönüş
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItem,
  ScrollView,
} from "react-native";
import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { SearchInput } from "@/src/components/ui/Input";
import { AnimatedPlaceCard, PlaceCardSkeleton } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { getPlaceImageSource, hasPlaceImage } from "@/src/utils/placeImages";
import { getPlaceStatus, type PlaceStatusType } from "@/src/utils/placeStatus";
import { CATEGORY_KEYS, STATUS_KEYS } from "@/src/utils/categories";
import { useAppStore } from "@/src/store/useAppStore";
import { getAllPlaces, type Place } from "@/src/services/mekanService";
import { useTranslation } from "react-i18next";
import { spacing as designSpacing } from "@/src/constants/design";

const PAGE_SIZE = 12;

export default function ClusterPlacesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    clusterCount: string;
    lat: string;
    lng: string;
    isGlobal?: string;
  }>();

  const isGlobal = params.isGlobal === "true";
  const clusterCount = isGlobal ? 999999 : (parseInt(params.clusterCount || "0", 10) || 10);
  const centerLat = parseFloat(params.lat || "0");
  const centerLng = parseFloat(params.lng || "0");

  const flatListRef = useRef<any>(null);

  // Get user's saved IDs for personalization
  const savedIds = useAppStore((s) => s.savedIds);

  // Get places directly from memory cache for 0ms load time
  const allPlaces = useAppStore((s) => s.globalPlaces);
  const isLoadingPlaces = useAppStore((s) => s.isGlobalPlacesLoading);

  // Search & Filter State
  const [query, setQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<PlaceStatusType[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Filter places that belong to this cluster (calculate nearest N places)
  const clusterPlaces = useMemo(() => {
    if (allPlaces.length === 0) return [];
    if (!isGlobal && (clusterCount <= 0 || !centerLat || !centerLng)) return [];
    
    const normalizeText = (text: string) =>
      text
        .toLowerCase()
        .replace(/ğ/g, "g")
        .replace(/ü/g, "u")
        .replace(/ş/g, "s")
        .replace(/ı/g, "i")
        .replace(/ö/g, "o")
        .replace(/ç/g, "c");
    
    const q = normalizeText(query.trim());
    
    // Sort all places by score
    const withScore = allPlaces.map(p => {
      let score = 0;
      
      const pLat = p.latitude || 0;
      const pLng = p.longitude || 0;
      
      // 1. Proximity (Distance) - En yakın olana en yüksek puan
      let proximityScore = 0;
      let dist = 999999;
      if (centerLat !== 0 && centerLng !== 0) {
        dist = Math.pow(pLat - centerLat, 2) + Math.pow(pLng - centerLng, 2);
        // dist is very small (e.g. 0.0001). Let's convert to a rough proximity score (max 30)
        proximityScore = Math.max(0, 30 - (dist * 1000000));
      }
      score += proximityScore;
      
      // 2. Average Rating - 4.5 ve üzerine 15 puan, 4.0 ve üzerine 10 puan
      if (p.average_rating && p.average_rating >= 4.5) score += 15;
      else if (p.average_rating && p.average_rating >= 4.0) score += 10;
      
      // 3. Review Count - 100 üstü yoruma 10 puan
      if (p.review_count && p.review_count > 100) score += 10;
      else if (p.review_count && p.review_count > 20) score += 5;
      
      // 4. Follower Count - Popülerlik
      if (p.follower_count && p.follower_count > 500) score += 10;
      
      // 5. Saved Count - Başkaları tarafından çok kaydedilenler
      if (p.saved_count && p.saved_count > 50) score += 10;
      
      // 6. Active Campaign - Fırsatı olan mekanlar
      if (p.campaign_text && p.campaign_text.length > 0) score += 15;
      
      // 7. Search Relevance (if active)
      if (q) {
        const pName = normalizeText(p.name);
        if (pName === q) score += 50; // Exact match
        else if (pName.includes(q)) score += 20; // Partial match
      }
      
      // 8. Open Status
      const status = getPlaceStatus(p.opening_time, p.closing_time).status;
      if (status === 'open') score += 15;
      else if (status === 'closed') score -= 10;
      
      // 9. Photo & Visual Quality
      if (p.photo_url || (p.gallery_urls && p.gallery_urls.length > 0)) score += 10;
      
      // 10. Personalized - Is Following
      if (p.is_following) score += 25;
      
      // 11. Personalized - Is Saved (Local store)
      if (savedIds.includes(String(p.id))) score += 25;
      
      // 12. Rich Content - Menü veya tag zenginliği
      if (p.menu_items && p.menu_items.length > 0) score += 5;
      if (p.tags && p.tags.length > 0) score += 5;
      
      return { place: p, score, dist };
    });
    
    // Filtreleme (Mesafe bazlı ön eleme)
    // Sadece en yakın 'clusterCount * 3' adayı alıp puanlarına göre sıralıyoruz.
    // Çok uzak olanları dahil etmemek için önce dist'e göre sırala:
    withScore.sort((a, b) => a.dist - b.dist);
    const nearestCandidates = withScore.slice(0, isGlobal ? withScore.length : Math.max(clusterCount * 3, 50));
    
    // Sonra bu adayları puana göre yüksekten düşüğe sırala
    nearestCandidates.sort((a, b) => b.score - a.score);
    
    return nearestCandidates.slice(0, clusterCount).map(w => w.place);
  }, [allPlaces, clusterCount, centerLat, centerLng, query, savedIds]);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setVisibleCount(PAGE_SIZE);
  }, []);

  const toggleStatus = useCallback((s: PlaceStatusType) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s]
    );
    setVisibleCount(PAGE_SIZE);
  }, []);

  const activeFilterCount = selectedCategories.length + selectedStatuses.length;

  // Filtered places (apply category/status filters strictly)
  const filteredPlaces = useMemo(() => {
    return clusterPlaces.filter((p: Place) => {
      // Category filter
      if (selectedCategories.length > 0) {
        if (!p.category || !selectedCategories.includes(p.category)) return false;
      }
      // Status filter
      if (selectedStatuses.length > 0) {
        const status = getPlaceStatus(p.opening_time, p.closing_time);
        if (!selectedStatuses.includes(status.status)) return false;
      }
      return true;
    });
  }, [clusterPlaces, selectedCategories, selectedStatuses]);

  // Paginated places
  const visiblePlaces = useMemo(
    () => filteredPlaces.slice(0, visibleCount),
    [filteredPlaces, visibleCount]
  );

  const hasMore = visibleCount < filteredPlaces.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  const handlePlacePress = useCallback((place: Place) => {
    lightImpact();
    router.push({
      pathname: "/place/[id]",
      params: {
        id: String(place.id),
        name: place.name || "",
        subtitle: place.subtitle || "",
        photo_url: place.photo_url || "",
        category: place.category || "",
        description: place.description || "",
        address: place.address || "",
      },
    });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Place>) => (
      <AnimatedPlaceCard
        index={index}
        placeId={item.id}
        image={getPlaceImageSource(item)}
        imagePlaceholder={!hasPlaceImage(item)}
        title={item.name}
        subtitle={item.subtitle}
        tags={item.tags}
        address={item.address}
        city={item.city}
        category={item.category}
        onPress={() => handlePlacePress(item)}
      />
    ),
    [handlePlacePress]
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
      </View>
    );
  }, [hasMore, colors.accent.primary]);

  // Available categories from cluster places
  const availableCategories = useMemo(() => {
    const cats = new Set(clusterPlaces.map((p: Place) => p.category).filter(Boolean));
    return CATEGORY_KEYS.filter((c) => cats.has(c.value));
  }, [clusterPlaces]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.background.primary,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              router.back();
            }}
            style={styles.backBtn}
            hitSlop={12}
          >
            <IconSymbol
              name="chevron.left"
              size={26}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text
              style={[styles.title, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {isGlobal ? t("explore.all_places", "Tüm Mekanlar") : t("explore.places", "Mekanlar")}
            </Text>
            {!isLoadingPlaces && (
              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.accent.primary + "1A" },
                ]}
              >
                <Text
                  style={[styles.countText, { color: colors.accent.primary }]}
                >
                  {filteredPlaces.length}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <SearchInput
            placeholder={t(
              "explore.search_cluster",
              "Mekan ara..."
            )}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setVisibleCount(PAGE_SIZE);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            rightIcon={query ? "xmark" : undefined}
            onRightIconPress={() => {
              setQuery("");
              setVisibleCount(PAGE_SIZE);
            }}
            containerStyle={styles.searchContainer}
          />
        </View>

        {/* Filter Chips */}
        <View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {availableCategories.map(({ value, tKey }) => {
              const active = selectedCategories.includes(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? colors.accent.primary
                        : colors.surface.elevated,
                      borderColor: active
                        ? colors.accent.primary
                        : colors.surface.border,
                    },
                  ]}
                  onPress={() => toggleCategory(value)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? "#fff" : colors.text.primary },
                    ]}
                  >
                    {t(tKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            
            <View style={styles.filterDivider} />
            
            {STATUS_KEYS.map((s) => {
              const active = selectedStatuses.includes(s.key);
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active
                        ? s.color
                        : colors.surface.elevated,
                      borderColor: active ? s.color : colors.surface.border,
                    },
                  ]}
                  onPress={() => toggleStatus(s.key)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: active ? "#fff" : s.color },
                    ]}
                  />
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? "#fff" : colors.text.primary },
                    ]}
                  >
                    {t(s.tKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSelectedCategories([]);
                  setSelectedStatuses([]);
                  setVisibleCount(PAGE_SIZE);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: colors.semantic.error + "1A",
                    borderColor: colors.semantic.error,
                  },
                ]}
                activeOpacity={0.7}
              >
                <IconSymbol name="xmark" size={12} color={colors.semantic.error} />
                <Text
                  style={[styles.chipText, { color: colors.semantic.error }]}
                >
                  {t("explore.filter_clear", "Temizle")}
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Place List */}
      <View style={{ flex: 1, width: "100%" }}>
        {isLoadingPlaces ? (
          <View style={{ padding: 16 }}>
            <PlaceCardSkeleton count={4} />
          </View>
        ) : visiblePlaces.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              name="mappin.slash"
              size={48}
              color={colors.text.tertiary}
            />
            <Text
              style={[styles.emptyTitle, { color: colors.text.secondary, textAlign: 'center' }]}
            >
              {t("explore.no_results", "Bu tercihlere göre mekan bulunmamaktadır.")}
            </Text>
            {(query || activeFilterCount > 0) && (
              <Text
                style={[styles.emptyDesc, { color: colors.text.tertiary, textAlign: 'center', marginTop: 4 }]}
              >
                {t(
                  "explore.try_different_search",
                  "Farklı filtreler veya arama terimi deneyin"
                )}
              </Text>
            )}
          </View>
        ) : (
          <FlashList
            ref={flatListRef}
            data={visiblePlaces}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            // @ts-ignore
            estimatedItemSize={280}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
  },
  searchRow: {
    marginBottom: 10,
  },
  searchContainer: {
    marginBottom: 0,
  },
  filterRow: {
    paddingRight: 16,
    gap: 8,
    alignItems: "center",
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#ccc",
    marginHorizontal: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
