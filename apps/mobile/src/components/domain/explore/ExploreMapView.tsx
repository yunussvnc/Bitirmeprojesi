/**
 * WebView tabanlı harita görünümü – MapLibre GL JS + OpenFreeMap.
 * WebGL ile hardware-accelerated vector tile rendering.
 * Expo Go, Simulator ve gerçek cihazda çalışır (native modül gerektirmez).
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { Map, Camera, GeoJSONSource, Layer, UserLocation, type CameraRef, type GeoJSONSourceRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import {
  type AiSearchDistrict,
} from '@/src/constants/aiDistricts';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { GlassCard } from '@/src/components/ui/GlassCard';
import { lightImpact } from '@/src/utils/haptics';
import { PlaceMediaPanel } from './PlaceMediaPanel';
import { getPlaceStatus, type PlaceStatusType } from '@/src/utils/placeStatus';
import { useAppStore } from '@/src/store/useAppStore';
import { Place, logInteraction } from '@/src/services/mekanService';
import { useTranslation } from 'react-i18next';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { ExploreMapControls } from './explore-map/ExploreMapControls';
import { styles } from './explore-map/styles';

const ISTANBUL_CENTER = {
  latitude: 41.0082,
  longitude: 28.9784,
  zoomLevel: 10,
};

const DEFAULT_ZOOM = 14;

export interface ExploreMapViewProps {
  places: Place[];
  loading: boolean;
  onLoadPlaces?: () => void;
}

export function ExploreMapView({ places, loading, onLoadPlaces }: ExploreMapViewProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const cameraRef = useRef<CameraRef>(null);
  const geoJSONSourceRef = useRef<GeoJSONSourceRef>(null);
  
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<PlaceStatusType[]>([]);
  const markerPressRef = useRef(false);

  const [selectedDistrict, setSelectedDistrict] = useState<AiSearchDistrict | null>(null);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);

  const activeFilterCount = selectedCategories.length + selectedStatuses.length;

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  }, []);

  const toggleStatus = useCallback((s: PlaceStatusType) => {
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((v) => v !== s) : [...prev, s],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSelectedDistrict(null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getLastKnownPositionAsync();
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }
          if (loc) {
            setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            // Sadece ilk seferinde konuma git
            if (cameraRef.current) {
              cameraRef.current.flyTo({
                center: [loc.coords.longitude, loc.coords.latitude],
                zoom: DEFAULT_ZOOM,
                duration: 1000,
              });
            }
          }
        }
      } catch { }
    })();
  }, []);

  const filteredPlaces = useMemo(() => {
    const normalizeText = (text: string) => {
      return text
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    };

    const q = normalizeText(query.trim());
    return places.filter((p) => {
      // Metin arama
      if (q) {
        const haystack = [
          p.name,
          p.category,
          p.address,
          p.city,
          p.subtitle,
        ]
          .filter(Boolean)
          .join(' ');
        
        if (!normalizeText(haystack).includes(q)) return false;
      }
      // Kategori filtresi
      if (selectedCategories.length > 0) {
        if (!p.category || !selectedCategories.includes(p.category)) return false;
      }
      // Durum filtresi
      if (selectedStatuses.length > 0) {
        const status = getPlaceStatus(p.opening_time, p.closing_time);
        if (!selectedStatuses.includes(status.status)) return false;
      }
      // İlçe filtresi
      if (selectedDistrict) {
        const addressText = p.address ? normalizeText(p.address) : '';
        const cityText = p.city ? normalizeText(p.city) : '';
        const hasMatch = selectedDistrict.aliases.some(alias => 
          addressText.includes(alias) || cityText.includes(alias)
        );
        if (!hasMatch) {
          return false;
        }
      }
      return true;
    });
  }, [places, query, selectedCategories, selectedStatuses, selectedDistrict]);

  const visiblePlaces = useMemo(
    () => filteredPlaces.filter((p) => p.latitude != null && p.longitude != null),
    [filteredPlaces],
  );

  // GeoJSON data preparation for MapLibre
  const placesGeoJSON = useMemo(() => {
    const now = new Date();
    
    const features: GeoJSON.Feature[] = visiblePlaces.map((p) => {
      const status = getPlaceStatus(p.opening_time, p.closing_time, now);
      return {
        type: 'Feature',
        id: p.id,
        geometry: {
          type: 'Point',
          coordinates: [p.longitude!, p.latitude!],
        },
        properties: {
          id: p.id,
          name: p.name,
          statusColor: status.color,
        },
      };
    });

    return {
      type: 'FeatureCollection',
      features,
    } as GeoJSON.FeatureCollection;
  }, [visiblePlaces]);

  useEffect(() => {
    if (selectedDistrict && cameraRef.current) {
      setSelectedPlace(null);
      cameraRef.current.flyTo({
        center: [selectedDistrict.lng, selectedDistrict.lat],
        zoom: DEFAULT_ZOOM,
        duration: 1000,
      });
    }
  }, [selectedDistrict]);

  const goToUserLocation = useCallback(() => {
    lightImpact();
    if (userLocation && cameraRef.current) {
      cameraRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: DEFAULT_ZOOM,
        duration: 1000,
      });
    } else {
      Alert.alert(
        t('explore.location_required'),
        t('explore.location_desc'),
        [{ text: t('explore.ok') }],
      );
    }
  }, [userLocation, t]);

  const goToIstanbul = useCallback(() => {
    lightImpact();
    cameraRef.current?.flyTo({
      center: [ISTANBUL_CENTER.longitude, ISTANBUL_CENTER.latitude],
      zoom: ISTANBUL_CENTER.zoomLevel,
      duration: 1000,
    });
  }, []);

  const handleSelectPlace = useCallback((place: Place) => {
    markerPressRef.current = true;
    // Android'de native marker onPress içinden doğrudan state güncellemesi
    // ve animateToRegion çağrısı native tarafta crash'e yol açıyor.
    // setTimeout(0) ile JS event loop'una defer ediyoruz.
    setTimeout(() => {
      lightImpact();
      setSelectedPlace(place);
      setQuery(place.name ?? '');
      setShowResults(false);
      Keyboard.dismiss();
      if (place.latitude != null && place.longitude != null) {
        cameraRef.current?.flyTo({
          center: [place.longitude, place.latitude],
          zoom: DEFAULT_ZOOM + 1,
          duration: 1000,
        });
      }
      setTimeout(() => {
        markerPressRef.current = false;
      }, 500);
    }, 0);
  }, []);



  useEffect(() => {
    if (!selectedPlace) return;
    if (query.trim().length === 0) return;
    if (!filteredPlaces.find((p) => p.id === selectedPlace.id)) {
      setSelectedPlace(null);
    }
  }, [filteredPlaces, query, selectedPlace]);

  const pendingPlaceName = useAppStore(state => state.pendingPlaceName);
  const clearPendingPlace = useAppStore(state => state.clearPendingPlace);

  // Mesajlardan gelen mekan açma isteğini dinle
  useEffect(() => {
    if (!pendingPlaceName || places.length === 0) return;

    const matchedPlace = places.find(
      (p) => p.name?.toLowerCase() === pendingPlaceName.toLowerCase()
    );

    if (matchedPlace) {
      setQuery(matchedPlace.name ?? '');
      setShowResults(false);

      if (matchedPlace.latitude != null && matchedPlace.longitude != null) {
        cameraRef.current?.flyTo({
          center: [matchedPlace.longitude, matchedPlace.latitude],
          zoom: DEFAULT_ZOOM + 1,
          duration: 1000,
        });
      }

      setTimeout(() => {
        setSelectedPlace(matchedPlace);
      }, 1000);
    }

    clearPendingPlace();
  }, [places, pendingPlaceName, clearPendingPlace]);

  const styleURL = isDark
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

  return (
    <View style={styles.container}>
      <Map
        style={styles.map}
        mapStyle={styleURL}
        logo={false}
        attribution={false}
        compass={false}
        onRegionWillChange={(e: any) => {
          const isUser = e?.properties?.isUserInteraction ?? e?.isUserInteraction ?? true;
          if (isUser) {
            setShowFilter(false);
            setShowResults(false);
            Keyboard.dismiss();
          }
        }}
        onPress={(event) => {
          if (markerPressRef.current) return;
          setSelectedPlace(null);
          setShowResults(false);
          setShowFilter(false);
          Keyboard.dismiss();
        }}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: [ISTANBUL_CENTER.longitude, ISTANBUL_CENTER.latitude],
            zoom: ISTANBUL_CENTER.zoomLevel,
          }}
        />

        <GeoJSONSource
          ref={geoJSONSourceRef}
          id="placesSource"
          data={placesGeoJSON}
          cluster={true}
          clusterRadius={75} // Önceden 40'tı. 75 yaparak uzaktan daha az ve bölgesel küme çıkmasını sağladık
          clusterMaxZoom={14}
          onPress={async (event: any) => {
            // event could have features directly, or inside nativeEvent.payload
            let feature = event?.features?.[0];
            if (!feature && event?.nativeEvent?.payload) {
              feature = event.nativeEvent.payload;
            }
            if (!feature && event?.nativeEvent?.features) {
              feature = event.nativeEvent.features[0];
            }

            if (!feature) return;

            if (feature.properties?.cluster) {
              const coords = feature.geometry?.coordinates;
              
              if (coords) {
                const clusterId = feature.properties.cluster_id;
                const pointCount = feature.properties.point_count;
                
                if (clusterId) {
                  try {
                    router.push({
                      pathname: '/cluster-places',
                      params: {
                        clusterCount: pointCount,
                        lat: coords[1],
                        lng: coords[0]
                      }
                    });
                  } catch {
                  }
                }
              }
              return;
            }

            if (feature?.properties?.id) {
              const fullPlace = places.find((p) => String(p.id) === String(feature.properties.id));
              if (fullPlace) {
                // Haritada tıklandı etkileşimini arka planda kaydet (Weight 2)
                logInteraction(fullPlace.id, 'MAP_CLICK', 2).catch(() => {});
                handleSelectPlace(fullPlace);
              }
            }
          }}
        >

          {/* Küme (Cluster) Dış Hale (Glow/Soft Ring) */}
          <Layer
            key="clustersGlow"
            id="clustersGlow"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': colors.accent.primary,
              'circle-opacity': 0.3,
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                24,
                10,
                32,
                50,
                40,
              ],
            }}
          />

          {/* Küme (Cluster) Katmanları (Ana İç Daire) */}
          <Layer
            key="clusters"
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': colors.accent.primary,
              'circle-opacity': 0.9,
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                16,
                10,
                22,
                50,
                28,
              ],
              'circle-stroke-width': 1.5,
              'circle-stroke-color': isDark ? '#000000' : '#ffffff',
            }}
          />
          <Layer
            key="cluster-count"
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-size': 13,
            }}
            paint={{
              'text-color': '#ffffff',
            }}
          />

          {/* Tekil Nokta (Mekan) Katmanları - Dış Daire (Küme rengiyle aynı) */}
          <Layer
            key="placesCircles"
            id="placesCircles"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': 9,
              'circle-color': colors.accent.primary,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': isDark ? '#1a1a1a' : '#fff',
            }}
          />
          {/* Tekil Nokta (Mekan) Katmanları - İç Nokta (Durum rengi) */}
          <Layer
            key="placesCirclesInner"
            id="placesCirclesInner"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': 4.5,
              'circle-color': ['get', 'statusColor'],
            }}
          />
          <Layer
            key="placesLabels"
            id="placesLabels"
            type="symbol"
            minzoom={14} // 13'tü, çok fazla mekan isminin üst üste binmesini önlemek için 14 yaptık
            filter={['!', ['has', 'point_count']]}
            layout={{
              'text-field': ['get', 'name'],
              'text-size': 11,
              'text-anchor': 'top',
              'text-offset': [0, 0.8],
              'text-allow-overlap': false,
              'text-optional': true,
            }}
            paint={{
              'text-color': isDark ? '#fff' : '#1a1a1a',
              'text-halo-color': isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)',
              'text-halo-width': 1.5,
            }}
          />
        </GeoJSONSource>

        {userLocation && (
          <UserLocation />
        )}
      </Map>

      {/* ── Empty State ── */}
      {visiblePlaces.length === 0 && !loading && (
        <View style={styles.emptyStateContainer} pointerEvents="none">
          <GlassCard intensity={80} tint={isDark ? "dark" : "light"} borderRadius={24} style={styles.emptyStateCard}>
            <LottieView 
              source={require('@/assets/animations/empty-box.json')}
              autoPlay
              loop
              style={styles.emptyStateLottie}
            />
            <Text style={[styles.emptyStateTitle, { color: colors.text.primary }]}>
              {t('explore.no_results', 'Sonuç Bulunamadı')}
            </Text>
            <Text style={[styles.emptyStateDesc, { color: colors.text.secondary }]}>
              {t('explore.no_results_desc', 'Filtrelerinize uygun mekan bulamadık. Filtreleri temizlemeyi deneyin.')}
            </Text>
          </GlassCard>
        </View>
      )}

      <ExploreMapControls
        query={query}
        onQueryChange={(text) => {
          setQuery(text);
          setShowResults(true);
          setSelectedPlace(null);
        }}
        onSearchFocus={() => {
          setShowResults(true);
          setSelectedPlace(null);
        }}
        onSearchBlur={() => setShowResults(false)}
        onClearQuery={() => {
          setQuery('');
          setShowResults(false);
        }}
        showFilter={showFilter}
        onCloseFilter={() => setShowFilter(false)}
        onToggleFilter={() => {
          lightImpact();
          setShowFilter((visible) => !visible);
          Keyboard.dismiss();
        }}
        activeFilterCount={activeFilterCount}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        selectedStatuses={selectedStatuses}
        onToggleStatus={toggleStatus}
        onClearFilters={clearFilters}
        selectedDistrict={selectedDistrict}
        onClearDistrict={() => setSelectedDistrict(null)}
        districtModalOpen={districtModalOpen}
        onOpenDistrictModal={() => {
          lightImpact();
          setDistrictModalOpen(true);
        }}
        onCloseDistrictModal={() => setDistrictModalOpen(false)}
        onSelectDistrict={(district) => {
          lightImpact();
          setSelectedDistrict(district);
          setDistrictModalOpen(false);
        }}
        showResults={showResults}
        filteredPlaces={filteredPlaces}
        onSelectPlace={handleSelectPlace}
        userLocation={userLocation}
      />

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={goToUserLocation}
          style={[styles.controlBtn, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="location.fill" size={22} color={colors.accent.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={goToIstanbul}
          style={[styles.controlBtn, { backgroundColor: colors.surface.elevated }]}
          activeOpacity={0.7}
        >
          <IconSymbol name="mappin.and.ellipse" size={22} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {t('explore.loading_places')}
          </Text>
        </View>
      )}

      {selectedPlace && (
        <PlaceMediaPanel
          place={selectedPlace}
          onClose={() => {
            setSelectedPlace(null);
            setQuery('');
          }}
        />
      )}
    </View>
  );
}
