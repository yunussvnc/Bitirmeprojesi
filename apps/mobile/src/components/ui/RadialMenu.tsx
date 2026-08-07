import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';

interface RadialMenuItem {
  icon: string;
  color?: string;
  onPress: () => void;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  style?: ViewStyle;
  mainIcon?: string;
  bottomOffset?: number;
}

const RADIUS = 80; // Distance of items from center

export function RadialMenu({ items, style, mainIcon = "plus", bottomOffset = 120 }: RadialMenuProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  // 0 = closed, 1 = open
  const progress = useSharedValue(0);

  const toggleMenu = () => {
    lightImpact();
    if (isOpen) {
      setIsOpen(false);
      progress.value = withSpring(0, { damping: 15, stiffness: 150 });
    } else {
      setIsOpen(true);
      progress.value = withSpring(1, { damping: 12, stiffness: 120 });
    }
  };

  const mainButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${progress.value * 45}deg` }, // Rotates main icon (e.g. plus turns into X)
      ],
    };
  });

  const getSubItemStyle = (index: number, total: number) => {
    return useAnimatedStyle(() => {
      // Calculate angle for a 90 degree arc (e.g. from top to left)
      const arc = Math.PI / 2;
      const startAngle = Math.PI; // 180 degrees (left)
      const angle = startAngle + (arc / (total - 1)) * index; // distribute evenly

      const targetX = Math.cos(angle) * RADIUS;
      const targetY = Math.sin(angle) * RADIUS;

      const translateX = interpolate(progress.value, [0, 1], [0, targetX], Extrapolation.CLAMP);
      const translateY = interpolate(progress.value, [0, 1], [0, targetY], Extrapolation.CLAMP);
      const scale = interpolate(progress.value, [0, 0.5, 1], [0.3, 1.1, 1], Extrapolation.CLAMP);
      const opacity = interpolate(progress.value, [0, 0.5, 1], [0, 1, 1], Extrapolation.CLAMP);

      return {
        transform: [
          { translateX },
          { translateY },
          { scale },
        ],
        opacity,
        position: 'absolute',
      };
    });
  };

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {/* Backdrop to close when tapping outside */}
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <View style={[styles.menuContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
        {/* Render Sub Items */}
        {items.map((item, index) => {
          const itemStyle = getSubItemStyle(index, items.length);
          
          return (
            <Animated.View key={`item-${index}`} style={itemStyle} pointerEvents={isOpen ? 'auto' : 'none'}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  mediumImpact();
                  toggleMenu();
                  item.onPress();
                }}
              >
                <BlurView intensity={60} tint="dark" style={[styles.subItem, { backgroundColor: item.color || colors.surface.elevated }]}>
                  <IconSymbol name={item.icon as any} size={20} color="#FFF" />
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Main Button */}
        <Animated.View style={[mainButtonStyle]}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleMenu}
            style={[styles.mainButton, { backgroundColor: colors.accent.primary, shadowColor: colors.accent.primary }]}
          >
            <IconSymbol name={mainIcon as any} size={28} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    top: 0,
    left: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  menuContainer: {
    position: 'absolute',
    right: 24,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  mainButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  subItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  }
});
