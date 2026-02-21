import React, { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { Animated, Easing } from "react-native";

type TabBarVisibilityContextValue = {
  translateY: Animated.Value;
  setHeight: (height: number) => void;
  show: () => void;
  hide: () => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

const TAB_BAR_ANIM_DURATION_MS = 240;

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const heightRef = useRef(0);
  const isHidden = useRef(false);

  const setHeight = useCallback((height: number) => {
    if (height > 0) heightRef.current = height;
  }, []);

  const animate = useCallback(
    (hidden: boolean) => {
      if (isHidden.current === hidden) return;
      isHidden.current = hidden;
      const offset = Math.max(heightRef.current, 1);
      Animated.timing(translateY, {
        toValue: hidden ? offset : 0,
        duration: TAB_BAR_ANIM_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [translateY]
  );

  const value = useMemo(
    () => ({
      translateY,
      setHeight,
      show: () => animate(false),
      hide: () => animate(true),
    }),
    [translateY, setHeight, animate]
  );

  return <TabBarVisibilityContext.Provider value={value}>{children}</TabBarVisibilityContext.Provider>;
}

export function useTabBarVisibility() {
  const ctx = useContext(TabBarVisibilityContext);
  if (!ctx) {
    throw new Error("useTabBarVisibility must be used within TabBarVisibilityProvider");
  }
  return ctx;
}
