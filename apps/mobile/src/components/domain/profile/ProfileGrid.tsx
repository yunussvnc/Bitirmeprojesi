/**
 * Profil gönderi grid (Instagram tarzı 3 sütun)
 */

import React from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";

const COLS = 3;
const GAP = 2;

export type ProfileGridItem = {
  id: number;
  thumbnail?: string;
  media_type?: string;
  place_id?: number;
};

export interface ProfileGridProps {
  items: ProfileGridItem[];
  onItemPress: (item: ProfileGridItem) => void;
}

export function ProfileGrid({ items, onItemPress }: ProfileGridProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const contentWidth = width - 40;
  const totalGap = GAP * (COLS - 1);
  const itemSize = (contentWidth - totalGap) / COLS;

  return (
    <View style={styles.grid}>
      {items.map((item, idx) => (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.cell,
            { backgroundColor: colors.surface.elevated, width: itemSize, height: itemSize },
            idx % COLS !== COLS - 1 && { marginRight: GAP },
            idx >= COLS && { marginTop: GAP },
          ]}
          onPress={() => onItemPress(item)}
          activeOpacity={0.8}
        >
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.thumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.placeholder, { backgroundColor: colors.surface.border }]}>
              <IconSymbol
                name={item.media_type === "video" ? "play.fill" : "photo"}
                size={24}
                color={colors.text.tertiary}
              />
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
});
