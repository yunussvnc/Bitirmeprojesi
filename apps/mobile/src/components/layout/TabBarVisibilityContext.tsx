import React, { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { Animated } from "react-native";

type TabBarVisibilityContextValue = {
  translateY: Animated.Value;
  /** Tab bar'ın arka plan opaklığı (1 = opak, 0.15 = şeffaf) */
  opacity: Animated.Value;
  setHeight: (height: number) => void;
  show: () => void;
  hide: () => void;
  /** Aşağı kaydırmada çağır — tab bar şeffaflaşır (~150ms) */
  fadeOut: () => void;
  /** Yukarı kaydırma veya dokunmada çağır — tab bar anında opak olur (0ms) */
  fadeIn: () => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibilityContextValue | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const heightRef = useRef(0);
  const isFaded = useRef(false);

  const setHeight = useCallback((height: number) => {
    if (height > 0) heightRef.current = height;
  }, []);

  // Tab bar gizleme (translateY) devre dışı — kullanıcı isteği
  const animate = useCallback((_hidden: boolean) => {}, []);

  const fadeOut = useCallback(() => {
    if (isFaded.current) return;
    isFaded.current = true;
    Animated.timing(opacity, {
      toValue: 0.15,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  const fadeIn = useCallback(() => {
    if (!isFaded.current) return;
    isFaded.current = false;
    // Anlık geri dönüş — gecikme yok
    opacity.setValue(1);
  }, [opacity]);

  const value = useMemo(
    () => ({
      translateY,
      opacity,
      setHeight,
      show: () => animate(false),
      hide: () => animate(true),
      fadeOut,
      fadeIn,
    }),
    [translateY, opacity, setHeight, animate, fadeOut, fadeIn]
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
