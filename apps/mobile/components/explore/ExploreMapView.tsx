/**
 * Harita görünümü – react-native-maps kullanır.
 * Gerçek cihaz + dev build'de çalışır. Expo Go ve Simulator'da RNMapsMapView Unimplement hatası verir.
 */

import { router } from 'expo-router';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';

const ISTANBUL_CENTER = { latitude: 41.0082, longitude: 28.9784 };
const DEFAULT_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

export interface ExploreMapViewProps {
  places: Place[];
  loading: boolean;
  onLoadPlaces: () => void;
}

export function ExploreMapView({ places, loading, onLoadPlaces }: ExploreMapViewProps) {
  const { colors } = useTheme();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch {
        setLocationPermission(false);
      }
    })();
  }, []);

  const goToUserLocation = useCallback(() => {
    lightImpact();
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({ ...userLocation, ...DEFAULT_DELTA });
    } else {
      Alert.alert('Konum izni gerekli', 'Yakınınızdaki mekanları görmek için konum erişimine izin verin.', [{ text: 'Tamam' }]);
    }
  }, [userLocation]);

  const goToIstanbul = useCallback(() => {
    lightImpact();
    if (mapRef.current) {
      mapRef.current.animateToRegion({ ...ISTANBUL_CENTER, ...DEFAULT_DELTA });
    }
  }, []);

  const initialRegion = userLocation ? { ...userLocation, ...DEFAULT_DELTA } : { ...ISTANBUL_CENTER, ...DEFAULT_DELTA };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={locationPermission === true}
        showsMyLocationButton={false}
        onPress={() => setSelectedPlace(null)}
      >
        {places.map((place) => (
          <Marker
            key={String(place.id)}
            coordinate={{ latitude: place.latitude!, longitude: place.longitude! }}
            title={place.name}
            onPress={() => { lightImpact(); setSelectedPlace(place); }}
            pinColor={colors.accent.primary}
          />
        ))}
      </MapView>

      <View style={[styles.header, { backgroundColor: colors.background.secondary + 'F5' }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Keşfet</Text>
        <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>Yakınındaki mekanları haritada keşfet</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={goToUserLocation} style={[styles.controlBtn, { backgroundColor: colors.surface.elevated }]} activeOpacity={0.7}>
          <IconSymbol name="location.fill" size={22} color={colors.accent.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToIstanbul} style={[styles.controlBtn, { backgroundColor: colors.surface.elevated }]} activeOpacity={0.7}>
          <IconSymbol name="mappin.and.ellipse" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>Mekanlar yükleniyor...</Text>
        </View>
      )}

      {selectedPlace && (
        <TouchableOpacity
          style={[styles.bottomCard, { backgroundColor: colors.surface.elevated }]}
          onPress={() => { lightImpact(); router.push({ pathname: '/place/[id]', params: { id: String(selectedPlace.id) } } as any); }}
          activeOpacity={0.9}
        >
          <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={2}>{selectedPlace.name}</Text>
          {selectedPlace.category && <Text style={[styles.cardCategory, { color: colors.text.tertiary }]}>{selectedPlace.category}</Text>}
          <Text style={[styles.cardAction, { color: colors.accent.primary }]}>Detayları gör →</Text>
        </TouchableOpacity>
      )}

      {!loading && places.length > 0 && !selectedPlace && (
        <View style={[styles.badge, { backgroundColor: colors.surface.elevated }]}>
          <Text style={[styles.badgeText, { color: colors.text.secondary }]}>{places.length} mekan</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  header: { position: 'absolute', top: Platform.OS === 'ios' ? 54 : 16, left: 16, right: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  controls: { position: 'absolute', right: 16, bottom: 200, gap: 10 },
  controlBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  bottomCard: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 84, left: 16, right: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardCategory: { fontSize: 13, marginTop: 4 },
  cardAction: { fontSize: 14, fontWeight: '600', marginTop: 8 },
  badge: { position: 'absolute', bottom: Platform.OS === 'ios' ? 100 : 84, left: 16, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  badgeText: { fontSize: 13 },
});
