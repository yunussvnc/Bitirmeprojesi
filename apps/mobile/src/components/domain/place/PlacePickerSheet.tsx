/**
 * PlacePickerSheet – Mekan seçici bottom sheet
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Keyboard,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  TextInput,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { createTextStyle } from "@/src/constants/design";
import { getPlaces, type Place } from "@/src/services/mekanService";
import { searchPlaces, getNearbyPlaces } from "@/src/services/searchService";
import { getCurrentLocation } from "@/src/utils/location";
import { useTranslation } from "react-i18next";

export interface PlacePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: Place) => void;
}

const PAGE_SIZE = 12;
const MAX_HEIGHT = 570;
const MIN_HEIGHT = 420;
const HIDDEN_Y = MAX_HEIGHT;
const MIN_Y = MAX_HEIGHT - MIN_HEIGHT; // 150
const MAX_Y = 0; // 0 means fully expanded to 570

export function PlacePickerSheet({ visible, onClose, onSelect }: PlacePickerSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoaded, setLocationLoaded] = useState(false);
  
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(HIDDEN_Y)).current;

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Load user location once when sheet becomes visible
  useEffect(() => {
    if (visible && !locationLoaded) {
      getCurrentLocation()
        .then((loc) => {
          if (loc) setUserLocation({ lat: loc.latitude, lng: loc.longitude });
        })
        .catch(() => {})
        .finally(() => {
          setLocationLoaded(true);
        });
    }
  }, [visible, locationLoaded]);

  // Animation and Visibility Control
  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      translateY.setValue(HIDDEN_Y);
      Animated.spring(translateY, {
        toValue: MIN_Y, // Snap to 420px height
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: HIDDEN_Y,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
        Keyboard.dismiss();
      });
    }
  }, [visible, translateY]);

  const handleClose = useCallback(() => {
    setQuery("");
    setDebouncedQuery("");
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: HIDDEN_Y,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      onClose();
    });
  }, [translateY, onClose]);

  // Pan Responder for Dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, g) => {
        // Prevent dragging above MAX_HEIGHT (which is translateY = 0)
        const offset = (translateY as any)._offset;
        const currentY = offset + g.dy;
        if (currentY < 0) {
          translateY.setValue(-offset); // Clamp to 0
        } else {
          translateY.setValue(g.dy);
        }
      },
      onPanResponderRelease: (_, g) => {
        translateY.flattenOffset();
        const currentY = (translateY as any)._value;
        const velocityY = g.vy;

        let targetY = MIN_Y; // Default to 420px

        if (velocityY > 1.5 || currentY > MIN_Y + 100) {
          // Dragged down hard or past threshold -> close
          targetY = HIDDEN_Y;
        } else if (velocityY < -0.5 || currentY < MIN_Y - 50) {
          // Dragged up -> snap to max height (570px)
          targetY = MAX_Y;
        } else {
          // Snap to min height (420px)
          targetY = MIN_Y;
        }

        if (targetY === HIDDEN_Y) {
          handleClose();
        } else {
          Animated.spring(translateY, {
            toValue: targetY,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  // Fetch places
  const fetchPlaces = useCallback(async (pageNum: number, isRefresh: boolean) => {
    if (!visible) return;
    if (!debouncedQuery && !locationLoaded) return;

    if (isRefresh) setLoading(true);
    else setLoadingMore(true);

    try {
      if (debouncedQuery) {
        const result = await searchPlaces(debouncedQuery, undefined, undefined, pageNum, PAGE_SIZE);
        setPlaces((prev) => (isRefresh ? result.items : [...prev, ...result.items]));
        setHasMore(result.items.length === PAGE_SIZE);
        setPage(pageNum);
      } else if (userLocation) {
        const resp = await getNearbyPlaces(userLocation.lat, userLocation.lng, 50, pageNum, PAGE_SIZE);
        if (resp && resp.items) {
          setPlaces((prev) => (isRefresh ? resp.items : [...prev, ...resp.items]));
          setHasMore(resp.items.length === PAGE_SIZE);
          setPage(pageNum);
        }
      } else {
        // Konum yoksa ve arama yoksa varsayılan popüler mekanları getir
        const resp = await getPlaces(pageNum, PAGE_SIZE);
        if (resp && resp.items) {
          setPlaces((prev) => (isRefresh ? resp.items : [...prev, ...resp.items]));
          setHasMore(resp.items.length === PAGE_SIZE);
          setPage(pageNum);
        }
      }
    } catch (error) {
      console.error("[PlacePickerSheet] Fetch Error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [visible, debouncedQuery, userLocation, locationLoaded]);

  useEffect(() => {
    if (visible && locationLoaded) {
      setPlaces([]);
      fetchPlaces(1, true);
    }
  }, [visible, debouncedQuery, locationLoaded]);

  const handleSelect = useCallback(
    (place: Place) => {
      lightImpact();
      onSelect(place);
      handleClose();
    },
    [onSelect, handleClose]
  );

  const handleEndReached = () => {
    if (!loading && !loadingMore && hasMore && places.length > 0) {
      fetchPlaces(page + 1, false);
    }
  };

  const clampedTranslateY = translateY.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, 1000],
    extrapolateLeft: "clamp",
  });

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: Math.max(insets.bottom, 24),
              transform: [{ translateY: clampedTranslateY }],
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={(e: any) => e.stopPropagation()} />
          {/* Drag Handle Area */}
          <View {...panResponder.panHandlers} style={styles.dragArea}>
            <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} />
            <View style={styles.header}>
              <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>
                {t("content_creation.add_location")}
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={12}>
                <Text style={[styles.cancelText, { color: colors.accent.primary }]}>{t("content_creation.cancel")}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="magnifyingglass" size={18} color={colors.text.tertiary} style={styles.searchIcon} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Mekan ara..."
                placeholderTextColor={colors.text.tertiary}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
                onFocus={() => {
                  // Expand to max height when keyboard opens
                  Animated.spring(translateY, {
                    toValue: MAX_Y,
                    useNativeDriver: true,
                    damping: 20,
                    stiffness: 200,
                  }).start();
                }}
              />
            </View>
          </View>

          {/* List */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
          ) : (
            <FlatList
              data={places}
              keyExtractor={(p, i) => `${p.id}-${i}`}
              initialNumToRender={12}
              windowSize={5}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.row, { borderBottomColor: colors.surface.border }]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="mappin.circle.fill" size={22} color={colors.accent.primary} />
                  <View style={styles.rowText}>
                    <Text style={[styles.placeName, { color: colors.text.primary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.category && (
                      <Text style={[styles.placeCategory, { color: colors.text.tertiary }]} numberOfLines={1}>
                        {item.category}
                      </Text>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
                </TouchableOpacity>
              )}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              ListEmptyComponent={
                !loading && query ? (
                   <View style={styles.emptyWrap}>
                     <Text style={{ color: colors.text.secondary }}>Sonuç bulunamadı.</Text>
                   </View>
                ) : null
              }
              ListFooterComponent={
                loadingMore ? (
                  <View style={{ paddingVertical: 16 }}>
                    <ActivityIndicator size="small" color={colors.accent.primary} />
                  </View>
                ) : null
              }
            />
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end", // Align to bottom
  },
  sheet: {
    height: MAX_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  dragArea: {
    width: "100%",
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  title: { fontSize: 18, fontWeight: "700" },
  cancelText: { fontSize: 16, fontWeight: "500" },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyWrap: { padding: 40, alignItems: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  placeCategory: {
    fontSize: 13,
  },
});
