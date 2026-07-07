import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { useTheme } from "@/src/hooks/useTheme";

const { width: screenWidth } = Dimensions.get("window");
const imageWidth = screenWidth;
const imageHeight = imageWidth;

export interface FeedCardSkeletonProps {
  count?: number;
}

export function FeedCardSkeleton({ count = 2 }: FeedCardSkeletonProps) {
  const { colors } = useTheme();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.wrapper,
            { backgroundColor: colors.background.primary }
          ]}
        >
          <View
            style={[
              styles.card,
              { 
                backgroundColor: colors.background.secondary, 
                borderColor: "rgba(0,0,0,0.06)" 
              },
            ]}
          >
            {/* Author Row */}
            <View style={[styles.authorRow, { backgroundColor: colors.background.secondary }]}>
              <Skeleton width={36} height={36} borderRadius={18} />
              <View style={styles.authorText}>
                <Skeleton width={100} height={16} borderRadius={4} />
                <Skeleton width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
              </View>
              <Skeleton width={20} height={20} borderRadius={10} style={{ marginLeft: "auto" }} />
            </View>

            {/* Image Area */}
            <Skeleton width={imageWidth} height={imageHeight} borderRadius={0} />

            {/* Content Area */}
            <View style={[styles.content, { backgroundColor: colors.background.secondary }]}>
              <View style={styles.actions}>
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width={24} height={24} borderRadius={12} />
                <Skeleton width={24} height={24} borderRadius={12} />
              </View>

              <Skeleton width="80%" height={14} borderRadius={4} />
              <Skeleton width="60%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
            </View>
          </View>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  card: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  authorText: {
    marginLeft: 10,
    flex: 1,
  },
  content: {
    padding: 14,
    paddingTop: 10,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 12,
  },
});
