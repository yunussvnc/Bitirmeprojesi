import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet, Text, LayoutChangeEvent } from 'react-native';
import { useTheme } from '@/src/hooks/useTheme';

export interface DistanceSliderProps {
  min: number;
  max: number;
  value: number;
  onValueChange: (val: number) => void;
  title?: string;
  maxLabel?: string;
}

export function DistanceSlider({ min, max, value, onValueChange, title = 'Mesafe', maxLabel = 'Bütün Şehir' }: DistanceSliderProps) {
  const { colors } = useTheme();
  const widthRef = useRef(0);
  
  // Stale closure koruması için ref
  const valueRef = useRef(value);
  valueRef.current = value;

  const startValRef = useRef(value);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        // Dokunduğumuz andaki mevcut değerden başlatırız
        startValRef.current = valueRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (widthRef.current > 0) {
          const dx = gestureState.dx;
          const range = max - min;
          const pctChange = dx / widthRef.current;
          let newVal = Math.round(startValRef.current + pctChange * range);
          newVal = Math.max(min, Math.min(max, newVal));
          if (newVal !== valueRef.current) {
            onValueChange(newVal);
          }
        }
      },
    })
  ).current;

  const percentage = Math.max(0, Math.min(1, (value - min) / (max - min)));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.secondary }]}>{title}</Text>
        <Text style={[styles.valueText, { color: colors.accent.primary }]}>
          {value === max ? maxLabel : `${value} km`}
        </Text>
      </View>

      <View 
        style={styles.trackContainer}
        onLayout={(e: LayoutChangeEvent) => {
          widthRef.current = e.nativeEvent.layout.width;
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.track, { backgroundColor: colors.surface.border }]}>
          <View style={[styles.trackFill, { backgroundColor: colors.accent.primary, width: `${percentage * 100}%` }]} />
        </View>
        
        <View 
          style={[
            styles.thumb, 
            { 
              backgroundColor: '#fff', 
              borderColor: colors.accent.primary,
              left: `${percentage * 100}%`
            }
          ]} 
        />
      </View>
      <View style={styles.labels}>
        <Text style={[styles.label, { color: colors.text.tertiary }]}>{min}km</Text>
        <Text style={[styles.label, { color: colors.text.tertiary }]}>{maxLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '700',
  },
  trackContainer: {
    height: 30,
    justifyContent: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginLeft: -12, // center the thumb
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
  }
});
