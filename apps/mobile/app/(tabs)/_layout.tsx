/**
 * Tab Navigator Layout (Top Tabs with PagerView for Swipeable Tabs)
 *
 * Alt navigasyon çubuğu ve ekran başlıkları tema ile uyumlu,
 * ASEMOS uygulamasına uygun header ve tab bar.
 */

import { withLayoutContext } from "expo-router";
import { createMaterialTopTabNavigator, MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol, type IconSymbolName } from "@/src/components/ui/icon-symbol";
import { StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { selection } from "@/src/utils/haptics";
import { AnimatedTabBar } from "@/src/components/layout/AnimatedTabBar";
import { TabBarVisibilityProvider } from "@/src/components/layout/TabBarVisibilityContext";
import { useTranslation } from "react-i18next";
import { useMessagesStore } from "@/src/store/useMessagesStore";
import { useRegisterPushToken } from "@/src/hooks/useRegisterPushToken";
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from "react";

const { Navigator } = createMaterialTopTabNavigator();

// Create custom Expo Router Layout Context for Top Tabs
const TopTabs = withLayoutContext<any, typeof Navigator, any, any>(Navigator);

function TabIcon({ name, color, focused }: { name: IconSymbolName; focused: boolean; color: string }) {
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

  const TAB_ICON_AREA = 50; 
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 8 : 0);
  const tabBarHeight = TAB_ICON_AREA + bottomPadding;

  const unreadMessagesCount = useMessagesStore((state) =>
    state.conversations.filter(c => c.unread && !c.isArchived).length
  );

  useRegisterPushToken();

  return (
    <TabBarVisibilityProvider>
      <TopTabs
        tabBarPosition="bottom"
        tabBar={(props: MaterialTopTabBarProps) => <AnimatedTabBar {...props} />}
        initialRouteName="index"
        screenOptions={{
          swipeEnabled: true,
          lazy: true,
          lazyPreloadDistance: 0, 
          tabBarStyle: {
            backgroundColor: colors.background.secondary,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.surface.border,
            height: tabBarHeight,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarShowIcon: true,
          tabBarActiveTintColor: colors.accent.primary,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: "500",
            textTransform: 'none',
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarIndicatorStyle: {
            display: 'none', // We don't want the default top-tab indicator line
          },
          sceneStyle: {
            backgroundColor: colors.background.primary,
          },
        }}
      >
        <TopTabs.Screen
          name="index"
          options={{
            title: t('tabs.home'),
            tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <TabIcon name="house.fill" focused={focused} color={color} />,
          }}
        />
        <TopTabs.Screen
          name="explore"
          options={{
            title: t('tabs.explore'),
            tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <TabIcon name="map.fill" focused={focused} color={color} />,
          }}
        />
        <TopTabs.Screen
          name="messages"
          options={{
            title: t('tabs.messages'),
            tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <TabIcon name="paperplane" focused={focused} color={color} />,
            tabBarBadge: unreadMessagesCount > 0 ? () => <></> : undefined,
          }}
        />
        <TopTabs.Screen
          name="feed"
          options={{
            title: t('tabs.feed'),
            tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <TabIcon name="square.grid.2x2.fill" focused={focused} color={color} />,
          }}
        />
        <TopTabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color, focused }: { color: string, focused: boolean }) => <TabIcon name="person.fill" focused={focused} color={color} />,
          }}
        />
      </TopTabs>
    </TabBarVisibilityProvider>
  );
}
