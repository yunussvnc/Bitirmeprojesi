import React, { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import {
  Canvas,
  BackdropFilter,
  Blur,
  Fill,
} from '@shopify/react-native-skia';

export interface GlassCardProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
}

/**
 * A premium glassmorphism card using @shopify/react-native-skia.
 * It provides a high-quality blur and a subtle glossy border.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  intensity = 20,
  tint = 'dark',
  borderRadius = 28,
}) => {
  // Determine fill color based on tint
  let fillColor = 'rgba(255, 255, 255, 0.15)';
  let borderColor = 'rgba(255, 255, 255, 0.3)';
  
  if (tint === 'dark') {
    fillColor = 'rgba(0, 0, 0, 0.35)';
    borderColor = 'rgba(255, 255, 255, 0.15)';
  } else if (tint === 'default') {
    fillColor = 'rgba(128, 128, 128, 0.2)';
    borderColor = 'rgba(255, 255, 255, 0.2)';
  }

  return (
    <View style={[styles.container, { borderRadius, borderColor }, style]}>
      {/* 
        The Canvas covers the entire view. It only draws within its bounds.
        BackdropFilter blurs whatever is behind the Canvas in the React Native view hierarchy.
      */}
      <Canvas style={StyleSheet.absoluteFill}>
        <BackdropFilter filter={<Blur blur={intensity} />}>
          <Fill color={fillColor} />
        </BackdropFilter>
      </Canvas>
      
      {/* Content rendered on top of the glass */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderWidth: 1,
    // Provide a default premium drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
});
