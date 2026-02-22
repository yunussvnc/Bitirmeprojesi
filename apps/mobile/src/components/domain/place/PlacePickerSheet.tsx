/**
 * PlacePickerSheet – Mekan seçici bottom sheet
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { createTextStyle } from "@/src/constants/design";
import { getPlaces, type Place } from "@/src/services/mekanService";

export interface PlacePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: Place) => void;
}

export function PlacePickerSheet({ visible, onClose, onSelect }: PlacePickerSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setLoading(true);
    getPlaces(1, 50)
      .then((res) => { if (!cancelled) setPlaces(res.items); })
      .catch(() => { if (!cancelled) setPlaces([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [visible]);

  const handleSelect = useCallback(
    (place: Place) => {
      lightImpact();
      onSelect(place);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: insets.bottom + 16,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} />
          <View style={styles.header}>
            <Text style={[createTextStyle("title", colors.text.primary), styles.title]}>
              Konum ekle
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Text style={[styles.cancelText, { color: colors.accent.primary }]}>İptal</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={colors.accent.primary} />
            </View>
          ) : (
            <FlatList
              data={places}
              keyExtractor={(p) => String(p.id)}
              initialNumToRender={12}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
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
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: "700" },
  cancelText: { fontSize: 16, fontWeight: "500" },
  loadingWrap: { padding: 40, alignItems: "center" },
  list: { maxHeight: 400 },
  listContent: { paddingBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  rowText: { flex: 1, minWidth: 0 },
  placeName: { fontSize: 16, fontWeight: "600" },
  placeCategory: { fontSize: 13, marginTop: 2 },
});
