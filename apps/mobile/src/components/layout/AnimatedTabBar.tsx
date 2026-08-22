import React from "react";
import { Animated as RNAnimated, StyleSheet, View, TouchableOpacity, Dimensions, Platform } from "react-native";
import { type MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightImpact } from "@/src/utils/haptics";
import { useTheme } from "@/src/hooks/useTheme";
import { BlurView } from "expo-blur";

export function AnimatedTabBar(props: MaterialTopTabBarProps) {
  const { translateY, opacity, setHeight, fadeIn } = useTabBarVisibility();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Adjusted bottom padding so it floats nicely
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);

  // Tab değiştiğinde tab bar'ı anında opak yap
  const currentIndex = props.state.index;
  React.useEffect(() => {
    fadeIn();
  }, [currentIndex, fadeIn]);

  return (
    <RNAnimated.View
      style={[
        styles.wrap, 
        { 
          transform: [{ translateY }],
          paddingBottom: bottomPadding,
          opacity: opacity,
        }
      ]}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      pointerEvents="box-none"
    >
      <BlurView
        intensity={isDark ? 60 : 80}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.tabBarContainer, 
          { 
            backgroundColor: isDark ? 'rgba(28,28,30,0.5)' : 'rgba(255,255,255,0.6)',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
          }
        ]}
      >
        {props.state.routes.map((route, index) => {
          const { options } = props.descriptors[route.key];
          const isFocused = props.state.index === index;

          const onPress = () => {
            const event = props.navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              lightImpact();
              props.navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItem 
              key={route.key}
              index={index}
              routesLength={props.state.routes.length}
              position={props.position}
              isFocused={isFocused} 
              onPress={onPress} 
              iconRender={options.tabBarIcon}
              themeColors={colors}
              isDark={isDark}
            />
          );
        })}
      </BlurView>
    </RNAnimated.View>
  );
}

function TabItem({ 
  index, 
  routesLength, 
  position, 
  isFocused, 
  onPress, 
  iconRender, 
  themeColors, 
  isDark 
}: { 
  index: number;
  routesLength: number;
  position: RNAnimated.AnimatedInterpolation<number>;
  isFocused: boolean;
  onPress: () => void;
  iconRender?: any;
  themeColors: any;
  isDark: boolean;
}) {
  
  // Synchronous animation based on pager position
  const inputRange = Array.from({ length: routesLength }, (_, i) => i);
  
  const opacity = position.interpolate({
    inputRange,
    outputRange: inputRange.map(i => (i === index ? 1 : 0)),
    extrapolate: 'clamp',
  });

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={1}
      style={styles.tabItem}
    >
      {/* Background Pill for Active State - Perfectly Synced with Swipe/Click */}
      <RNAnimated.View 
        style={[
          StyleSheet.absoluteFillObject, 
          styles.activePill, 
          { 
            backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
            opacity: opacity
          }
        ]} 
      />
      
      {/* Icon */}
      <View style={styles.iconContainer}>
        {iconRender && iconRender({ 
          focused: isFocused, 
          color: isFocused ? themeColors.text.primary : themeColors.text.tertiary 
        })}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    zIndex: 100,
    elevation: 10,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: 30, // Yüksekliği azalttığımız için radyusu da kıstık
    paddingHorizontal: 6,
    paddingVertical: 6,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 15, // Android shadow
    alignItems: 'center',
    justifyContent: 'space-between',
    width: Dimensions.get('window').width - 48, // Biraz daha dar bir kapsül
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tabItem: {
    flex: 1,
    height: 42, // Icon height slightly reduced from 48
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  activePill: {
    borderRadius: 21,
    marginHorizontal: 4,
  },
  iconContainer: {
    zIndex: 1,
  }
});
