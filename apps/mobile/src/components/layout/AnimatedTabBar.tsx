import React, { useEffect } from "react";
import { Animated as RNAnimated, StyleSheet, View, TouchableOpacity, Dimensions, Platform } from "react-native";
import { type MaterialTopTabBarProps } from "@react-navigation/material-top-tabs";
import { useTabBarVisibility } from "@/src/components/layout/TabBarVisibilityContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { lightImpact } from "@/src/utils/haptics";
import { useTheme } from "@/src/hooks/useTheme";

export function AnimatedTabBar(props: MaterialTopTabBarProps) {
  const { translateY, opacity, setHeight, fadeIn } = useTabBarVisibility();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  // Adjusted bottom padding so it floats nicely
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 10);

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
      <View style={[
        styles.tabBarContainer, 
        { 
          backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'
        }
      ]}>
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
      </View>
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
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
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
    borderRadius: 40, // Highly rounded capsule
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 15, // Android shadow
    alignItems: 'center',
    justifyContent: 'space-between',
    width: Dimensions.get('window').width - 32, // Screen width minus margins
    borderWidth: 1,
  },
  tabItem: {
    flex: 1,
    height: 48, // Icon height
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  activePill: {
    borderRadius: 24,
    marginHorizontal: 8,
  },
  iconContainer: {
    zIndex: 1,
  }
});
