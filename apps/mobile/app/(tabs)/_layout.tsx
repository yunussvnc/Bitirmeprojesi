/**
 * Tab Navigator Layout
 *
 * Alt navigasyon çubuğu ve ekran başlıkları tema ile uyumlu,
 * ASEMOS uygulamasına uygun header ve tab bar.
 */

import { Tabs } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/components/ui/icon-symbol";
import { StyleSheet, Platform } from "react-native";

function TabIcon({ name, color }: { name: IconSymbolName; focused: boolean; color: string }) {
  return (
    <IconSymbol
      name={name}
      size={22}
      color={color}
    />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
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
          height: Platform.OS === "ios" ? 88 : 60,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          elevation: 0,
          shadowOpacity: 0,
        },
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
          title: "Ana Sayfa",
          tabBarIcon: ({ color, focused }) => <TabIcon name="house.fill" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Keşfet",
          tabBarIcon: ({ color, focused }) => <TabIcon name="magnifyingglass" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Kaydedilenler",
          tabBarIcon: ({ color, focused }) => <TabIcon name="bookmark.fill" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, focused }) => <TabIcon name="person.fill" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}

