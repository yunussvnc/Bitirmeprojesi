import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useTheme } from "@/src/hooks/useTheme";

export interface MessageListSkeletonProps {
  count?: number;
}

export function MessageListSkeleton({ count = 5 }: MessageListSkeletonProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.row}>
          {/* Avatar Skeleton */}
          <Skeleton width={52} height={52} borderRadius={26} />

          {/* Content Skeleton */}
          <View style={styles.content}>
            <View style={styles.topRow}>
              <Skeleton width={120} height={16} borderRadius={4} />
              <Skeleton width={40} height={12} borderRadius={4} />
            </View>
            <Skeleton width="70%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
