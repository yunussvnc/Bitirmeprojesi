import React from "react";
import { Animated, Text, TouchableOpacity, StyleSheet, View } from "react-native";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";

interface FeedMiniBarProps {
  visible: boolean;
  opacity: Animated.AnimatedInterpolation<number>;
  translateY: Animated.AnimatedInterpolation<number>;
  unreadCount: number;
  onCreatePress: () => void;
  onNotificationsPress: () => void;
}

export function FeedMiniBar({
  visible,
  opacity,
  translateY,
  unreadCount,
  onCreatePress,
  onNotificationsPress,
}: FeedMiniBarProps) {
  const { colors } = useTheme();

  return (
    <Animated.View
      style={[
        styles.miniBar,
        {
          backgroundColor: colors.background.primary,
          borderBottomColor: colors.surface.border,
          top: 0,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={visible ? "auto" : "none"}
    >
      <TouchableOpacity
        style={[styles.miniIconBtn, { backgroundColor: colors.surface.default }]}
        onPress={() => {
          lightImpact();
          onCreatePress();
        }}
      >
        <IconSymbol name="plus" size={18} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={[styles.miniTitle, { color: colors.text.primary }]}>Akış</Text>
      <TouchableOpacity
        style={[styles.miniIconBtn, { backgroundColor: colors.surface.default }]}
        onPress={() => {
          lightImpact();
          onNotificationsPress();
        }}
      >
        <IconSymbol name="bell.fill" size={18} color={colors.text.primary} />
        {unreadCount > 0 && (
          <View style={[styles.miniBadge, { backgroundColor: colors.semantic.error }]}>
            <Text style={[styles.miniBadgeText, { color: colors.accent.onPrimary }]}>
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  miniBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  miniTitle: { flex: 1, fontSize: 16, fontWeight: "700", textAlign: "center" },
  miniIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  miniBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
});
