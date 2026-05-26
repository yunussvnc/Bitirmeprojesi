/**
 * Tab Navigator Layout
 *
 * Alt navigasyon çubuğu ve ekran başlıkları tema ile uyumlu,
 * ASEMOS uygulamasına uygun header ve tab bar.
 */

import { Tabs } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { StyleSheet, Platform } from "react-native";
import { selection } from "@/src/utils/haptics";
import { AnimatedTabBar } from "@/src/components/layout/AnimatedTabBar";
import { TabBarVisibilityProvider } from "@/src/components/layout/TabBarVisibilityContext";
import { useTranslation } from "react-i18next";
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

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
            title: t('tabs.home'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="house.fill" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime, expo-router types are incomplete
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: t('tabs.explore'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="map.fill" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime, expo-router types are incomplete
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: t('tabs.messages'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="paperplane" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime, expo-router types are incomplete
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="feed"
          options={{
            title: t('tabs.feed'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="square.grid.2x2.fill" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime, expo-router types are incomplete
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="matching"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="ai"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, focused }) => <TabIcon name="person.fill" focused={focused} color={color} />,
            // @ts-expect-error - listeners works at runtime, expo-router types are incomplete
            listeners: () => ({ tabPress: () => selection() }),
          }}
        />
        <Tabs.Screen
          name="saved"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="messages/archive"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </TabBarVisibilityProvider>
  );
}

