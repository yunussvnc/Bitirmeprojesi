import React from "react";
import { Animated, StyleSheet } from "react-native";
import { MaterialTopTabBar, type MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";

export function AnimatedTabBar(props: MaterialTopTabBarProps) {
  const { translateY, setHeight } = useTabBarVisibility();
  return (
    <Animated.View
      style={[styles.wrap, { transform: [{ translateY }] }]}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <MaterialTopTabBar {...props} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    left: 0,
    right: 0,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
    elevation: 10,
  },
});
