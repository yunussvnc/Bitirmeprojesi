import React from "react";
import { Animated, StyleSheet } from "react-native";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTabBarVisibility } from "@/components/layout/TabBarVisibilityContext";

export function AnimatedTabBar(props: BottomTabBarProps) {
  const { translateY, setHeight } = useTabBarVisibility();
  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }] }]}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 0,
    right: 0,
  },
});
