import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { useIslandStore } from '@/src/store/useIslandStore';
import { lightImpact } from '@/src/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function DynamicIsland() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isVisible, title, subtitle, icon, color, hideIsland } = useIslandStore();

  // 0 = hidden (pill size), 1 = expanded (island size)
  const progress = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Small bounce effect when opening
      progress.value = withSpring(1, { damping: 14, stiffness: 120 });
      lightImpact();
    } else {
      progress.value = withTiming(0, { duration: 300 });
    }
  }, [isVisible, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    // Width expands from notch size (~120) to full island (~340)
    const width = interpolate(progress.value, [0, 1], [120, 340], Extrapolation.CLAMP);
    // Height expands from notch height (~30) to island height (~80)
    const height = interpolate(progress.value, [0, 1], [30, 76], Extrapolation.CLAMP);
    // Y position drops slightly
    const translateY = interpolate(progress.value, [0, 1], [-50, 0], Extrapolation.CLAMP);
    const opacity = interpolate(progress.value, [0, 0.2, 1], [0, 1, 1], Extrapolation.CLAMP);

    return {
      width,
      height,
      transform: [{ translateY }],
      opacity,
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [{ scale: progress.value }],
    };
  });

  // If not iOS or not visible, still render but keep it off-screen to preserve animations
  if (Platform.OS !== 'ios' && !isVisible) return null;

  return (
    <View style={[styles.container, { top: Math.max(insets.top - 10, 10) }]} pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View style={[styles.island, animatedStyle]}>
        <TouchableOpacity activeOpacity={0.9} onPress={hideIsland} style={StyleSheet.absoluteFill}>
          <BlurView intensity={80} tint="dark" style={styles.blur}>
            <Animated.View style={[styles.content, contentStyle]}>
              
              {/* Left Icon Area */}
              <View style={[styles.iconWrap, { backgroundColor: color || colors.accent.primary }]}>
                <IconSymbol name={(icon as any) || "bell.fill"} size={20} color="#FFF" />
              </View>

              {/* Text Area */}
              <View style={styles.textWrap}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
                {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
              </View>

              {/* Right Mini Graphic (e.g. waveform or action) */}
              <View style={styles.rightAction}>
                <IconSymbol name="chevron.right" size={16} color="rgba(255,255,255,0.5)" />
              </View>

            </Animated.View>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999, // On top of everything
    elevation: 9999,
  },
  island: {
    backgroundColor: '#000',
    borderRadius: 38,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
    padding: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  rightAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
