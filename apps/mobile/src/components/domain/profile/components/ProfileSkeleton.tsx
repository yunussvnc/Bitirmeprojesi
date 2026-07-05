import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useTheme } from "@/src/hooks/useTheme";

const { width } = Dimensions.get("window");
const PADDING = 16;
const POST_SPACING = 2;
const POST_SIZE = (width - PADDING * 2 - POST_SPACING * 2) / 3;

export function ProfileSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      {/* ── Hero Section (Avatar, Name, Bio) ── */}
      <View style={styles.heroSection}>
        <View style={styles.avatarRing}>
          <Skeleton width={86} height={86} borderRadius={43} />
        </View>

        <View style={styles.heroInfo}>
          <Skeleton width={140} height={24} borderRadius={4} />
          <Skeleton width={200} height={14} borderRadius={4} style={{ marginTop: 8 }} />
          <Skeleton width={160} height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* ── Action Buttons ── */}
      <View style={styles.actionRow}>
        <Skeleton style={{ flex: 1 }} height={40} borderRadius={12} />
        <Skeleton width={40} height={40} borderRadius={12} />
        <Skeleton width={40} height={40} borderRadius={12} />
      </View>

      {/* ── Stats Card ── */}
      <View style={[styles.statsContainer, { backgroundColor: colors.surface.elevated }]}>
        <View style={styles.statItem}>
          <Skeleton width={30} height={20} borderRadius={4} />
          <Skeleton width={50} height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={30} height={20} borderRadius={4} />
          <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <View style={styles.statItem}>
          <Skeleton width={30} height={20} borderRadius={4} />
          <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabsRow}>
        <Skeleton width={80} height={20} borderRadius={4} style={{ marginRight: 24 }} />
        <Skeleton width={100} height={20} borderRadius={4} />
      </View>

      {/* ── Posts Grid ── */}
      <View style={styles.grid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton 
            key={index} 
            width={POST_SIZE} 
            height={POST_SIZE} 
            borderRadius={8} 
            style={{ marginBottom: POST_SPACING }} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  heroInfo: {
    flex: 1,
    alignItems: "flex-start",
    paddingLeft: 18,
  },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 2,
  },
});
