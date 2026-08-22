/**
 * Saved Screen
 *
 * Saved places management screen.
 * Spotify-inspired dark theme design.
 */

import { router, useNavigation } from "expo-router";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import {
  
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  ListRenderItem,
  RefreshControl,
  Platform,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { useTheme } from "@/src/hooks/useTheme";
import { Screen } from "@/src/components/layout";
import { EmptyState, AnimatedPlaceCard } from "@/src/components/ui";
import { FeedCard, SharePostSheet } from "@/src/components/domain/feed";
import { useAppStore, type SavedPlace } from "@/src/store/useAppStore";
import { getPlaceImageSource, hasPlaceImage } from "@/src/utils/placeImages";
import { spacing as designSpacing } from "@/src/constants/design";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { logger } from "@/src/utils/logger";
import { lightImpact } from "@/src/utils/haptics";
import { getAllPlaces } from "@/src/services/mekanService";
import type { Place } from "@/src/services/mekanService";
import type { Post } from "@/src/services/feedService";
import { getSavedPlaces, getSavedPosts } from "@/src/services/savedService";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

export default function SavedScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const flatListRef = useRef<FlatList>(null);
  const [tab, setTab] = useState<"places" | "posts">("places");
  const ids = useAppStore((s) => s.savedIds);
  const byId = useAppStore((s) => s.savedById);
  const remove = useAppStore((s) => s.removeSaved);
  const removePost = useAppStore((s) => s.removeSavedPost);
  const postIds = useAppStore((s) => s.savedPostIds);
  const postsById = useAppStore((s) => s.savedPostsById);
  const [refreshing, setRefreshing] = useState(false);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const [placesData, setPlacesData] = useState<Record<string, Place>>({});
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Selection Mode States
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelection = useCallback((id: string | number) => {
    lightImpact();
    const strId = String(id);
    setSelectedIds((prev) =>
      prev.includes(strId) ? prev.filter((i) => i !== strId) : [...prev, strId]
    );
  }, []);

  // Reset selection when tab changes
  useEffect(() => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  }, [tab]);

  // Listen for tab press to scroll to top
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress" as any, () => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return unsubscribe;
  }, [navigation]);

  // API'den tüm mekanları çek ve cache'le + Backend'den kayıtlıları senkronize et
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const places = await getAllPlaces();
        if (cancelled) return;
        const placesMap: Record<string, Place> = {};
        places.forEach((place) => {
          placesMap[String(place.id)] = place;
        });
        setPlacesData(placesMap);

        // Backend Senkronizasyonu (İlk Yükleme)
        try {
          // Çoklu istekleri paralel at (kayıtlı mekanlar + kayıtlı postlar)
          const [savedPlacesRes, savedPostsRes] = await Promise.all([
            getSavedPlaces(1, 50),
            getSavedPosts(1, 50)
          ]);

          if (cancelled) return;
          const store = useAppStore.getState();

          // Mekanları sync et
          savedPlacesRes.items.forEach(p => {
            const strId = String(p.id);
            if (!store.isSaved(strId)) {
              store.toggleSave({
                id: strId,
                name: p.name,
                subtitle: p.address || "",
                photo_url: p.photo_url,
                category: p.category,
                tags: p.tags,
              });
            }
          });

          // Postları sync et
          savedPostsRes.items.forEach(sp => {
            const strId = String(sp.id);
            if (!store.isPostSaved(strId)) {
              store.toggleSavePost(sp as any);
            }
          });

        } catch (syncErr) {
          logger.warn("[SavedScreen] Backend sync failed", syncErr);
        }

      } catch (error) {
        if (!cancelled) logger.error("Error loading places:", error);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const items: SavedPlace[] = useMemo(() => {
    return ids
      .map((id) => {
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
      })
      .filter(Boolean) as SavedPlace[];
  }, [ids, byId, placesData]);

  const postItems: Post[] = useMemo(() => {
    return postIds.map((id) => postsById[id]).filter(Boolean) as Post[];
  }, [postIds, postsById]);

  const handleRemove = useCallback(
    (id: string | number) => {
      lightImpact();
      remove(id);
    },
    [remove]
  );

  const handleRemovePost = useCallback(
    (id: string | number) => {
      lightImpact();
      removePost(id);
    },
    [removePost]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    lightImpact();
    // Refresh saved places (could sync with backend in future)
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  };

  const renderRightActions = useCallback(
    (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, id: string | number, isPost = false) => {
      const scale = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [1, 0],
        extrapolate: "clamp",
      });

      return (
        <TouchableOpacity
          onPress={() => (isPost ? handleRemovePost(id) : handleRemove(id))}
          style={[styles.deleteAction, { backgroundColor: colors.semantic.error }]}
          activeOpacity={0.8}
        >
          <Animated.View style={{ transform: [{ scale }] }}>
            <IconSymbol name="trash.fill" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      );
    },
    [handleRemove, handleRemovePost, colors.semantic.error]
  );

  const renderPlaceItem: ListRenderItem<SavedPlace> = useCallback(
    ({ item, index }) => {
      const isSelected = selectedIds.includes(String(item.id));
      return (
        <Swipeable
          key={item.id}
          enabled={!isSelectionMode}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}
          overshootRight={false}
          friction={2}
          rightThreshold={40}
          failOffsetX={[-1000, 10]}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {isSelectionMode && (
              <View style={{ paddingLeft: 16 }}>
                <IconSymbol
                  name={isSelected ? "checkmark.circle.fill" : "circle"}
                  size={24}
                  color={isSelected ? colors.accent.primary : colors.text.tertiary}
                />
              </View>
            )}
            <View style={{ flex: 1, pointerEvents: isSelectionMode ? 'none' : 'auto' }}>
              <AnimatedPlaceCard
                index={index}
                placeId={item.id}
                image={getPlaceImageSource(item)}
                imagePlaceholder={!hasPlaceImage(item)}
                title={item.name}
                subtitle={item.subtitle}
                tags={item.tags}
                address={item.address}
                onPress={() => router.push({
                  pathname: "/place/[id]",
                  params: {
                    id: String(item.id),
                    name: item.name || "",
                    subtitle: item.subtitle || "",
                    photo_url: item.photo_url || "",
                    category: item.category || "",
                    description: item.description || "",
                    address: item.address || "",
                  }
                })}
              />
            </View>
            {isSelectionMode && (
              <TouchableOpacity 
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                onPress={() => toggleSelection(item.id)}
              />
            )}
          </View>
        </Swipeable>
      );
    },
    [renderRightActions, isSelectionMode, selectedIds, toggleSelection, colors]
  );

  const listHeader = useCallback(
    () => (
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              router.back();
            }}
            style={styles.backBtn}
            hitSlop={12}
          >
            <IconSymbol name="chevron.left" size={26} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>{t("saved.title")}</Text>
          {((tab === "places" && items.length > 0) || (tab === "posts" && postItems.length > 0)) && (
            <View style={styles.headerRight}>
              <View style={[styles.countBadge, { backgroundColor: colors.surface.elevated }]}>
                <Text style={[styles.countText, { color: colors.text.secondary }]}>
                  {tab === "posts" ? postItems.length : items.length}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  if (isSelectionMode) {
                    setIsSelectionMode(false);
                    setSelectedIds([]);
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                activeOpacity={0.8}
                style={[styles.clearButton, { backgroundColor: colors.surface.elevated, paddingHorizontal: 12 }]}
              >
                <Text style={{ color: isSelectionMode ? colors.semantic.error : colors.text.primary, fontSize: 14, fontWeight: "600" }}>
                  {isSelectionMode ? t("common.cancel", "İptal") : t("common.select", "Seç")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              {
                backgroundColor: tab === "places" ? colors.text.primary : colors.surface.default,
                borderColor: tab === "places" ? "transparent" : colors.surface.border,
                borderWidth: tab === "places" ? 0 : 1,
              },
            ]}
            onPress={() => setTab("places")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: tab === "places" ? colors.background.primary : colors.text.secondary }]}>
              {t("saved_extra.places")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabPill,
              {
                backgroundColor: tab === "posts" ? colors.text.primary : colors.surface.default,
                borderColor: tab === "posts" ? "transparent" : colors.surface.border,
                borderWidth: tab === "posts" ? 0 : 1,
              },
            ]}
            onPress={() => setTab("posts")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: tab === "posts" ? colors.background.primary : colors.text.secondary }]}>
              {t("saved_extra.posts")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      items.length,
      postItems.length,
      colors.background.primary,
      colors.semantic.error,
      colors.surface.border,
      colors.surface.default,
      colors.surface.elevated,
      colors.text.primary,
      colors.text.secondary,
      isSelectionMode,
      tab,
      t,
    ]
  );

  const listEmptyPlaces = (
    <View style={styles.emptyContainer}>
      <EmptyState
        variant="saved"
        title={t("saved_extra.empty_title")}
        description={t("saved_extra.empty_places_desc")}
        actionLabel={t("saved_extra.empty_places_action")}
        onAction={() => router.push("/(tabs)/explore")}
      />
    </View>
  );

  const listEmptyPosts = (
    <View style={styles.emptyContainer}>
      <EmptyState
        variant="saved"
        title={t("saved_extra.empty_title")}
        description={t("saved_extra.empty_posts_desc")}
        actionLabel={t("saved_extra.empty_posts_action")}
        onAction={() => router.push("/(tabs)/feed")}
      />
    </View>
  );
  return (
    <Screen scrollable={false}>
      {tab === "places" ? (
        <FlatList
          ref={flatListRef}
          data={items}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={renderPlaceItem}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmptyPlaces}
          contentContainerStyle={[styles.listContainer, items.length === 0 && { flex: 1 }]}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} colors={[colors.accent.primary]} />
          }
          style={styles.flatList}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={postItems}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(String(item.id));
            return (
              <Swipeable
                key={item.id}
                enabled={!isSelectionMode}
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id, true)}
                overshootRight={false}
                friction={2}
                rightThreshold={40}
                failOffsetX={[-1000, 10]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {isSelectionMode && (
                    <View style={{ paddingLeft: 16 }}>
                      <IconSymbol
                        name={isSelected ? "checkmark.circle.fill" : "circle"}
                        size={24}
                        color={isSelected ? colors.accent.primary : colors.text.tertiary}
                      />
                    </View>
                  )}
                  <View style={{ flex: 1, pointerEvents: isSelectionMode ? 'none' : 'auto' }}>
                    <FeedCard
                      post={item}
                      onPress={() => item.place_id && router.push(`/place/${item.place_id}` as any)}
                      onAuthorPress={() => router.push(`/user/${item.user_id}` as any)}
                      onPlacePress={() => item.place_id && router.push(`/place/${item.place_id}` as any)}
                      onShare={() => setSharePost(item)}
                    />
                  </View>
                  {isSelectionMode && (
                    <TouchableOpacity 
                      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                      onPress={() => toggleSelection(item.id)}
                    />
                  )}
                </View>
              </Swipeable>
            );
          }}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmptyPosts}
          contentContainerStyle={[styles.listContainer, postItems.length === 0 && { flex: 1 }]}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.primary} colors={[colors.accent.primary]} />
          }
          style={styles.flatList}
        />
      )}

      {isSelectionMode && selectedIds.length > 0 && (
        <View style={[styles.bulkActionContainer, { paddingBottom: Math.max(insets.bottom, 16), flexDirection: 'row', gap: 12 }]}>
          <TouchableOpacity
            style={[styles.bulkDeleteButton, { backgroundColor: colors.semantic.error, flex: 1 }]}
            onPress={() => {
              Alert.alert(t("common.delete"), `${selectedIds.length} öğeyi silmek istediğinize emin misiniz?`, [
                { text: t("common.cancel"), style: "cancel" },
                {
                  text: t("common.delete"),
                  style: "destructive",
                  onPress: () => {
                    lightImpact();
                    selectedIds.forEach(id => {
                      if (tab === "places") remove(id);
                      else removePost(id);
                    });
                    setSelectedIds([]);
                    setIsSelectionMode(false);
                  }
                }
              ]);
            }}
          >
            <IconSymbol name="trash.fill" size={20} color="#FFF" />
            <Text style={styles.bulkDeleteText}>{t("common.delete")} ({selectedIds.length})</Text>
          </TouchableOpacity>

          {tab === "places" && selectedIds.length === 2 && (
            <TouchableOpacity
              style={[styles.bulkDeleteButton, { backgroundColor: colors.accent.primary, flex: 1 }]}
              onPress={() => {
                lightImpact();
                router.push(`/compare?ids=${selectedIds.join(',')}` as any);
                setIsSelectionMode(false);
                setSelectedIds([]);
              }}
            >
              <IconSymbol name="arrow.left.arrow.right" size={20} color={colors.accent.onPrimary} />
              <Text style={[styles.bulkDeleteText, { color: colors.accent.onPrimary }]}>
                Karşılaştır
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <SharePostSheet
        visible={!!sharePost}
        onClose={() => setSharePost(null)}
        post={sharePost}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: designSpacing.lg,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    marginRight: designSpacing.sm,
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: "row",
    gap: designSpacing.sm,
    marginTop: designSpacing.base,
  },
  tabPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: designSpacing.sm,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  bulkActionContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  bulkDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  bulkDeleteText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  flatList: {
    flex: 1,
  },
  listContainer: {
    gap: designSpacing.sm,
    paddingBottom: designSpacing.xl,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
    borderRadius: 12,
    marginLeft: designSpacing.sm,
  },
});
