/**
 * WebView tabanlı harita görünümü – MapLibre GL JS + OpenFreeMap.
 * WebGL ile hardware-accelerated vector tile rendering.
 * Expo Go, Simulator ve gerçek cihazda çalışır (native modül gerektirmez).
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  InteractionManager,
  Pressable,
} from 'react-native';
import { Map, Camera, GeoJSONSource, Layer, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import {
  ISTANBUL_AI_DISTRICTS,
  getIstanbulDistrictsForPicker,
  type AiSearchDistrict,
} from '@/src/constants/aiDistricts';
import { CATEGORY_KEYS, STATUS_KEYS, getTranslatedCategory } from '@/src/utils/categories';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SearchInput } from '@/src/components/ui/Input';
import { lightImpact } from '@/src/utils/haptics';
import { PlaceMediaPanel } from './PlaceMediaPanel';
import { getPlaceStatus, type PlaceStatusType } from '@/src/utils/placeStatus';
import { useAppStore } from '@/src/store/useAppStore';
import { Place, logInteraction } from '@/src/services/mekanService';
import { useTranslation } from 'react-i18next';

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
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
        if (!p.city || normalizeText(p.city) !== normalizeText(selectedDistrict.apiLocation)) {
          return false;
        }
      }
      return true;
    });
  }, [places, query, selectedCategories, selectedStatuses, userLocation, selectedDistrict]);

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
  }, [userLocation]);

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
        onRegionWillChange={(e: any) => {
          const isUser = e?.properties?.isUserInteraction ?? e?.isUserInteraction ?? true;
          if (isUser) {
            setShowFilter(false);
            setShowResults(false);
            Keyboard.dismiss();
          }
        }}
        onPress={(event) => {
          console.log('[DEBUG] Map onPress fired. markerPressRef:', markerPressRef.current);
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
              if (coords && cameraRef.current) {
                // Kümeye tıklandığında iyice yakınlaşıp kümelerin mekanlara ayrılmasını sağla
                cameraRef.current.flyTo({
                  center: [coords[0], coords[1]],
                  zoom: 15, // 14'tü 15 yaptık, daha net dağılım için
                  duration: 600,
                });
              }
              return;
            }

            console.log('[DEBUG] Found feature id:', feature?.properties?.id);

            if (feature?.properties?.id) {
              const fullPlace = places.find((p) => String(p.id) === String(feature.properties.id));
              if (fullPlace) {
                console.log('[DEBUG] Executing handleSelectPlace for', fullPlace.name);
                // Haritada tıklandı etkileşimini arka planda kaydet (Weight 2)
                logInteraction(fullPlace.id, 'MAP_CLICK', 2).catch(() => {});
                handleSelectPlace(fullPlace);
              }
            }
          }}
        >
          {/* Küme (Cluster) Dış Hale (Glow/Soft Ring) */}
          <Layer
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
            id="placesCirclesInner"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': 4.5,
              'circle-color': ['get', 'statusColor'],
            }}
          />
          <Layer
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

      {/* Filtre ve Arama Arka Planı (Tüm ekranı kaplar) */}
      {showFilter && (
        <Pressable
          style={styles.filterBackdrop}
          onPressIn={() => setShowFilter(false)}
        />
      )}

      <View
        style={[
          styles.searchWrap,
          { backgroundColor: colors.background.secondary + 'CC' },
        ]}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchInputFlex}>
            <SearchInput
              placeholder={t('explore.search_placeholder')}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setShowResults(true);
                setSelectedPlace(null);
              }}
              onFocus={() => {
                setShowResults(true);
                setSelectedPlace(null);
              }}
              onBlur={() => setShowResults(false)}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              rightIcon={query ? 'xmark' : undefined}
              onRightIconPress={() => {
                setQuery('');
                setShowResults(false);
              }}
              containerStyle={styles.searchContainer}
            />
          </View>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              setShowFilter((v) => !v);
              Keyboard.dismiss();
            }}
            style={[
              styles.filterBtn,
              {
                backgroundColor: activeFilterCount > 0 ? colors.accent.primary : colors.surface.elevated,
              },
            ]}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="line.3.horizontal.decrease.circle"
              size={20}
              color={activeFilterCount > 0 ? '#fff' : colors.text.secondary}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* İlçe Seçici */}
        <TouchableOpacity
          style={[
            styles.districtSelector,
            {
              backgroundColor: selectedDistrict ? colors.accent.primary + '1A' : colors.surface.elevated,
              borderColor: selectedDistrict ? colors.accent.primary : colors.surface.border,
            },
          ]}
          onPress={() => {
            lightImpact();
            setDistrictModalOpen(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.districtSelectorLeft}>
            <IconSymbol
              name="mappin.and.ellipse"
              size={14}
              color={selectedDistrict ? colors.accent.primary : colors.text.secondary}
            />
            <Text
              style={[
                styles.districtSelectorText,
                { color: selectedDistrict ? colors.accent.primary : colors.text.primary },
              ]}
            >
              {selectedDistrict 
                ? `${t('explore.district_label', 'İlçe')}: ${selectedDistrict.apiLocation}` 
                : t('explore.select_district', 'İlçe Seçin')}
            </Text>
          </View>
          <View style={styles.districtSelectorRight}>
            {selectedDistrict && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  lightImpact();
                  setSelectedDistrict(null);
                }}
                style={styles.clearDistrictBtn}
              >
                <IconSymbol name="xmark.circle.fill" size={16} color={colors.accent.primary} />
              </TouchableOpacity>
            )}
            <IconSymbol
              name="chevron.down"
              size={12}
              color={selectedDistrict ? colors.accent.primary : colors.text.secondary}
            />
          </View>
        </TouchableOpacity>

        {/* Filtre Paneli */}
        {showFilter && (
          <Pressable 
            style={[styles.filterPanel, { backgroundColor: colors.surface.elevated }]}
            onPress={() => {}} // Swallow touch
          >
              {/* Kategori */}
              <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text.secondary }]}>{t('explore.filter_category')}</Text>
              <View style={styles.chipRow}>
                {CATEGORY_KEYS.map(({ value, tKey }) => {
                  const active = selectedCategories.includes(value);
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? colors.accent.primary : colors.background.secondary,
                          borderColor: active ? colors.accent.primary : colors.surface.border,
                        },
                      ]}
                      onPress={() => toggleCategory(value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#fff' : colors.text.primary },
                        ]}
                      >
                        {t(tKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Durum */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text.secondary }]}>{t('explore.filter_status')}</Text>
              <View style={styles.chipRow}>
                {STATUS_KEYS.map((s) => {
                  const active = selectedStatuses.includes(s.key);
                  return (
                    <TouchableOpacity
                      key={s.key}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? s.color : colors.background.secondary,
                          borderColor: active ? s.color : colors.surface.border,
                        },
                      ]}
                      onPress={() => toggleStatus(s.key)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.chipDot, { backgroundColor: active ? '#fff' : s.color }]} />
                      <Text
                        style={[
                          styles.chipText,
                          { color: active ? '#fff' : colors.text.primary },
                        ]}
                      >
                        {t(s.tKey)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>



            {/* Temizle */}
            {activeFilterCount > 0 && (
              <TouchableOpacity
                onPress={clearFilters}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.clearBtnText, { color: colors.accent.primary }]}>{t('explore.filter_clear')}</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        )}
        {showResults && query.trim().length > 0 && (
          <View style={[styles.resultsCard, { backgroundColor: colors.surface.elevated }]}>
            {filteredPlaces.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                {t('explore.no_results')}
              </Text>
            ) : (
              <ScrollView
                style={styles.resultsScroll}
                contentContainerStyle={styles.resultsScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredPlaces.map((place) => {
                  const placeStatus = getPlaceStatus(place.opening_time, place.closing_time);
                  return (
                    <TouchableOpacity
                      key={String(place.id)}
                      style={styles.resultRow}
                      onPress={() => handleSelectPlace(place)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.statusDot, { backgroundColor: placeStatus.color }]} />
                      <View style={styles.resultText}>
                        <Text style={[styles.resultTitle, { color: colors.text.primary }]} numberOfLines={1}>
                          {place.name}
                        </Text>
                        {!!(place.category || place.city) && (
                          <Text style={[styles.resultMeta, { color: colors.text.tertiary }]} numberOfLines={1}>
                            {[place.category, place.city].filter(Boolean).join(' • ')}
                            {placeStatus.hoursText ? ` · ${placeStatus.label}` : ''}
                          </Text>
                        )}
                      </View>
                      <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}
      </View>

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

      <Modal
        visible={districtModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDistrictModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setDistrictModalOpen(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.surface.elevated }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {t('explore.select_district_title', 'İlçe Seçin')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  setDistrictModalOpen(false);
                }}
                style={styles.modalCloseBtn}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* "Tümü" seçeneği */}
              <TouchableOpacity
                style={[
                  styles.districtItem,
                  !selectedDistrict && [
                    styles.districtItemActive,
                    { backgroundColor: colors.accent.primary + '1F' }
                  ],
                  { borderBottomColor: colors.surface.border }
                ]}
                onPress={() => {
                  lightImpact();
                  setSelectedDistrict(null);
                  setDistrictModalOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.districtItemText,
                    { color: !selectedDistrict ? colors.accent.primary : colors.text.primary },
                    !selectedDistrict && styles.districtItemTextActive
                  ]}
                >
                  {t('explore.all_districts', 'Tüm İlçeler')}
                </Text>
                {!selectedDistrict && (
                  <IconSymbol name="checkmark" size={18} color={colors.accent.primary} />
                )}
              </TouchableOpacity>

              {/* İlçeler listesi */}
              {getIstanbulDistrictsForPicker().map((district) => {
                const isActive = selectedDistrict?.id === district.id;
                return (
                  <TouchableOpacity
                    key={district.id}
                    style={[
                      styles.districtItem,
                      isActive && [
                        styles.districtItemActive,
                        { backgroundColor: colors.accent.primary + '1F' }
                      ],
                      { borderBottomColor: colors.surface.border }
                    ]}
                    onPress={() => {
                      lightImpact();
                      setSelectedDistrict(district);
                      setDistrictModalOpen(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.districtItemText,
                        { color: isActive ? colors.accent.primary : colors.text.primary },
                        isActive && styles.districtItemTextActive
                      ]}
                    >
                      {district.apiLocation}
                    </Text>
                    {isActive && (
                      <IconSymbol name="checkmark" size={18} color={colors.accent.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
  searchWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 16,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    zIndex: 50,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputFlex: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  filterPanel: {
    marginTop: 10,
    borderRadius: 14,
    padding: 14,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  clearBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultsCard: {
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 6,
    overflow: 'hidden',
  },
  resultsScroll: { maxHeight: 220 },
  resultsScrollContent: { paddingVertical: 2 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  resultText: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '600' },
  resultMeta: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  emptyText: { paddingHorizontal: 12, paddingVertical: 10, fontSize: 13 },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  controls: { position: 'absolute', right: 16, bottom: Platform.OS === 'ios' ? 120 : 104, gap: 10 },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: { marginTop: 12, fontSize: 14 },
  badge: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 84,
    left: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  badgeText: { fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 16,
  },
  modalScrollContent: {
    paddingVertical: 8,
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  districtItemActive: {
    borderRadius: 12,
  },
  districtItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  districtItemTextActive: {
    fontWeight: '700',
  },
  districtSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  districtSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  districtSelectorText: {
    fontSize: 14,
    fontWeight: '600',
  },
  districtSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearDistrictBtn: {
    padding: 2,
  },
  filterBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
});

const markerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    maxWidth: 80,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  label: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 1,
    textAlign: 'center',
    color: '#1a1a1a',
    textShadowColor: 'rgba(255,255,255,0.95)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  labelDark: {
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.95)',
  },
});
