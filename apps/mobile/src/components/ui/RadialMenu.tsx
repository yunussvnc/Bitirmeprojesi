import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { IconSymbol, type IconSymbolName } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { lightImpact, mediumImpact } from '@/src/utils/haptics';

interface RadialMenuItem {
  icon: IconSymbolName;
  color?: string;
  onPress: () => void;
}

interface RadialMenuProps {
  items: RadialMenuItem[];
  style?: ViewStyle;
  mainIcon?: IconSymbolName;
  bottomOffset?: number;
}

interface RadialMenuSubItemProps {
  item: RadialMenuItem;
  index: number;
  total: number;
  progress: SharedValue<number>;
  isOpen: boolean;
  fallbackColor: string;
  onSelect: (item: RadialMenuItem) => void;
}

const RADIUS = 80;

function RadialMenuSubItem({
  item,
  index,
  total,
  progress,
  isOpen,
  fallbackColor,
  onSelect,
}: RadialMenuSubItemProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const arc = Math.PI / 2;
    const startAngle = Math.PI;
    const angle = total <= 1
      ? startAngle + arc / 2
      : startAngle + (arc / (total - 1)) * index;

    const targetX = Math.cos(angle) * RADIUS;
    const targetY = Math.sin(angle) * RADIUS;

    return {
      transform: [
        { translateX: interpolate(progress.value, [0, 1], [0, targetX], Extrapolation.CLAMP) },
        { translateY: interpolate(progress.value, [0, 1], [0, targetY], Extrapolation.CLAMP) },
        { scale: interpolate(progress.value, [0, 0.5, 1], [0.3, 1.1, 1], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(progress.value, [0, 0.5, 1], [0, 1, 1], Extrapolation.CLAMP),
      position: 'absolute' as const,
    };
  });

  return (
    <Animated.View style={animatedStyle} pointerEvents={isOpen ? 'auto' : 'none'}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onSelect(item)}>
        <BlurView
          intensity={60}
          tint="dark"
          style={[styles.subItem, { backgroundColor: item.color || fallbackColor }]}
        >
          <IconSymbol name={item.icon} size={20} color="#FFF" />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

export function RadialMenu({ items, style, mainIcon = 'plus', bottomOffset = 120 }: RadialMenuProps) {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (item: RadialMenuItem) => {
    mediumImpact();
    toggleMenu();
    item.onPress();
  };

  const mainButtonStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 45}deg` }],
  }));

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      {isOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={toggleMenu}
        />
      )}

      <View style={[styles.menuContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
        {items.map((item, index) => (
          <RadialMenuSubItem
            key={`item-${index}`}
            item={item}
            index={index}
            total={items.length}
            progress={progress}
            isOpen={isOpen}
            fallbackColor={colors.surface.elevated}
            onSelect={handleSelect}
          />
        ))}

        <Animated.View style={mainButtonStyle}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={toggleMenu}
            style={[
              styles.mainButton,
              { backgroundColor: colors.accent.primary, shadowColor: colors.accent.primary },
            ]}
          >
            <IconSymbol name={mainIcon} size={28} color="#FFF" />
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
  },
});
