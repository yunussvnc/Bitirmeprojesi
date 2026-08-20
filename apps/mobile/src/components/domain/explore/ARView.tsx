import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTheme } from '@/src/hooks/useTheme';
import { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
// import { Magnetometer, Accelerometer } from 'expo-sensors';
// Geçici olarak expo-sensors'ü mock'luyoruz (Expo Go veya Pedometer hatası veren ortamlarda crash olmaması için)
interface SensorData {
  x: number;
  y: number;
  z: number;
}

interface SensorSubscription {
  remove: () => void;
}

const Magnetometer = {
  setUpdateInterval: (_interval: number) => undefined,
  addListener: (_callback: (data: SensorData) => void): SensorSubscription => ({ remove: () => undefined }),
};
const Accelerometer = {
  setUpdateInterval: (_interval: number) => undefined,
  addListener: (_callback: (data: SensorData) => void): SensorSubscription => ({ remove: () => undefined }),
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FOV = 60; // Field of view in degrees (approximate)

// Helper: Haversine distance in meters
function haversineDistance(coords1: { lat: number; lng: number }, coords2: { lat: number; lng: number }) {
  const R = 6371e3; // metres
  const φ1 = (coords1.lat * Math.PI) / 180;
  const φ2 = (coords2.lat * Math.PI) / 180;
  const Δφ = ((coords2.lat - coords1.lat) * Math.PI) / 180;
  const Δλ = ((coords2.lng - coords1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Helper: Calculate bearing from coord1 to coord2 (in degrees, 0-360)
function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) - Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  
  let brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

// Get shortest angle difference (-180 to 180)
function getAngleDiff(target: number, source: number) {
  let diff = target - source;
  while (diff < -180) diff += 360;
  while (diff > 180) diff -= 360;
  return diff;
}

interface ARViewProps {
  places: Place[];
  userLocation: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onPlaceSelect: (place: Place) => void;
}

export function ARView({ places, userLocation, onClose, onPlaceSelect }: ARViewProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  
  const [heading, setHeading] = useState(0);
  const [pitch, setPitch] = useState(0); // Up/down tilt

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  useEffect(() => {
    let magSubscription: SensorSubscription;
    let accSubscription: SensorSubscription;

    // Update interval (fast for smooth AR)
    Magnetometer.setUpdateInterval(50);
    Accelerometer.setUpdateInterval(50);

    magSubscription = Magnetometer.addListener((data: { x: number; y: number; z: number }) => {
      // Calculate heading from x, y
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      
      // Adjust for screen orientation (assuming portrait)
      // Note: Device-specific magnetic north offsets might vary. This is a simplified approach.
      angle = (angle + 360) % 360;
      setHeading(angle);
    });

    accSubscription = Accelerometer.addListener((data: { x: number; y: number; z: number }) => {
      // Very basic pitch calculation (0 is flat, 90 is upright)
      // data.y is roughly 1 when upright in portrait, 0 when flat
      const p = Math.atan2(data.y, data.z) * (180 / Math.PI);
      setPitch(p); 
    });

    return () => {
      magSubscription?.remove();
      accSubscription?.remove();
    };
  }, []);

  // Filter places within 2km and with coordinates
  const nearbyPlaces = useMemo(() => {
    if (!userLocation) return [];
    
    return places
      .filter((p) => p.latitude != null && p.longitude != null)
      .map((p) => {
        const distance = haversineDistance(
          { lat: userLocation.latitude, lng: userLocation.longitude },
          { lat: p.latitude!, lng: p.longitude! }
        );
        const bearing = calculateBearing(
          userLocation.latitude,
          userLocation.longitude,
          p.latitude!,
          p.longitude!
        );
        return { ...p, distance, bearing };
      })
      .filter((p) => p.distance < 2000) // max 2km
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 15); // Max 15 places at once so it's not cluttered
  }, [places, userLocation]);

  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.primary }]}>
        <Text style={{ color: colors.text.primary, marginBottom: 16 }}>
          AR görünümü için kamera izni gerekiyor.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={{ color: colors.accent.primary }}>İzin Ver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 24 }} onPress={onClose}>
          <Text style={{ color: colors.text.secondary }}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background.primary }]}>
        <ActivityIndicator color={colors.accent.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Camera */}
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
      />

      {/* AR HUD Overlay */}
      <View style={styles.hudContainer}>
        {nearbyPlaces.map((place) => {
          const angleDiff = getAngleDiff(place.bearing, heading);
          
          // If difference is greater than FOV/2 + margin, it's off-screen
          if (Math.abs(angleDiff) > FOV) return null;

          // X Position: angleDiff = 0 means center of screen
          // We map [-FOV/2, FOV/2] to [0, SCREEN_WIDTH]
          const xPos = (angleDiff / (FOV / 2)) * (SCREEN_WIDTH / 2) + (SCREEN_WIDTH / 2);
          
          // Y Position: affected by pitch (looking up/down)
          // Also slightly offset by distance so further items appear slightly higher
          const yPos = (SCREEN_HEIGHT / 2) + (pitch * 5) - (place.distance / 10);

          // Scale: further away = smaller
          const scale = interpolate(place.distance, [0, 2000], [1, 0.4], Extrapolation.CLAMP);
          // Opacity: fade out when getting too far or on the edge of screen
          const opacity = interpolate(Math.abs(angleDiff), [FOV/2, FOV], [1, 0], Extrapolation.CLAMP);

          return (
            <Animated.View
              key={place.id}
              entering={FadeIn}
              exiting={FadeOut}
              style={[
                styles.arItem,
                {
                  transform: [
                    { translateX: xPos - 75 }, // 75 is half width
                    { translateY: yPos },
                    { scale }
                  ],
                  opacity
                }
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  lightImpact();
                  onPlaceSelect(place as Place);
                }}
              >
                <BlurView intensity={40} tint="dark" style={styles.placeCard}>
                  <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                  <Text style={styles.placeDist}>{(place.distance).toFixed(0)}m</Text>
                </BlurView>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* UI Controls */}
      <View style={[styles.controls, { top: Math.max(insets.top, 20) }]}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <BlurView intensity={30} tint="dark" style={styles.iconWrap}>
            <IconSymbol name="xmark" size={24} color="#FFF" />
          </BlurView>
        </TouchableOpacity>
        
        <View style={styles.badgeWrap}>
          <BlurView intensity={30} tint="dark" style={styles.badge}>
            <IconSymbol name="arkit" size={16} color="#FFF" />
            <Text style={styles.badgeText}>Iron Man Vision</Text>
          </BlurView>
        </View>
      </View>
      
      {/* Radar minimap or compass indicator can go here */}
      <View style={[styles.radar, { bottom: Math.max(insets.bottom, 20) }]}>
        <BlurView intensity={30} tint="dark" style={styles.radarCard}>
          <Text style={{ color: '#FFF', fontSize: 12 }}>Yön: {heading.toFixed(0)}°</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>Yakınında {nearbyPlaces.length} mekan var</Text>
        </BlurView>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  hudContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'box-none',
  },
  arItem: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 150,
    alignItems: 'center',
  },
  placeCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  placeDist: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  badgeText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 13,
  },
  radar: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  radarCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
});
