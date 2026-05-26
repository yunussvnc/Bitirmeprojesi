import { Tabs } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { StyleSheet, Platform } from "react-native";
import { selection } from "@/src/utils/haptics";
import { AnimatedTabBar } from "@/src/components/layout/AnimatedTabBar";
import { TabBarVisibilityProvider } from "@/src/components/layout/TabBarVisibilityContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function TabIcon({ name, color }: { name: IconSymbolName; focused: boolean; color: string }) {
  return (
    <IconSymbol
      name={name}
      size={22}
      color={color}
    />
  );
}

export default function VenueTabsLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === "ios" ? 24 : 16);

  return (
    <TabBarVisibilityProvider>
      <Tabs
        tabBar={(props) => <AnimatedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          tabBarPosition: "bottom",
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.background.secondary,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.surface.border,
            height: 56 + bottomInset,
            paddingTop: 6,
            paddingBottom: bottomInset,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarAllowFontScaling: false,
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Mekan",
            tabBarIcon: ({ color, focused }) => <TabIcon name="house.fill" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="edit"
          options={{
            title: "Düzenle",
            tabBarIcon: ({ color, focused }) => <TabIcon name="slider.horizontal.3" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Ayarlar",
            tabBarIcon: ({ color, focused }) => <TabIcon name="gearshape.fill" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            href: null,
            title: "İstatistikler",
          }}
        />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}
