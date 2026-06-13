/**
 * WebView tabanlı harita görünümü – Leaflet + OpenStreetMap.
 * Expo Go, Simulator ve gerçek cihazda çalışır (native modül gerektirmez).
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  ScrollView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  ISTANBUL_AI_DISTRICTS,
  getIstanbulDistrictsForPicker,
  type AiSearchDistrict,
} from '@/src/constants/aiDistricts';
import { CATEGORY_KEYS, STATUS_KEYS, getTranslatedCategory } from '@/src/utils/categories';
import * as Location from 'expo-location';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SearchInput } from '@/src/components/ui/Input';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
import { PlaceMediaPanel } from './PlaceMediaPanel';
import { useAppStore } from '@/src/store/useAppStore';
import { getPlaceStatus, type PlaceStatusType } from '@/src/utils/placeStatus';
import { calculateDistance } from '@/src/utils/location';

import { useTranslation } from 'react-i18next';

/** Category keys matching backend data values + translation keys */


const ISTANBUL_CENTER = { latitude: 41.0082, longitude: 28.9784 };

export interface ExploreWebMapViewProps {
  places: Place[];
  loading: boolean;
  onLoadPlaces: () => void;
}

function buildMapHTML(accentColor: string, isDark: boolean) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const tileAttr = '&copy; <a href="https://carto.com/">CARTO</a>';

  const mapBg = isDark ? '#1a1a1a' : '#e0e0e0';

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;overflow:hidden;background:${mapBg}!important}
  .leaflet-container{background:${mapBg}!important}
  .leaflet-tile-pane .leaflet-layer{background:${mapBg}}
  .leaflet-tile{background:${mapBg}!important}
  .leaflet-control-attribution{display:none!important}
  .custom-pin{
    width:28px;height:28px;border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease;
  }
  .custom-pin.active{
    transform:scale(1.45);
    box-shadow:0 0 0 8px rgba(255,255,255,0.25),0 4px 12px rgba(0,0,0,0.4);
    border-color:#fff;
  }
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,touchZoom:true,doubleClickZoom:true,scrollWheelZoom:true,boxZoom:true}).setView([${ISTANBUL_CENTER.latitude},${ISTANBUL_CENTER.longitude}],13);
L.tileLayer('${tileUrl}',{maxZoom:19,attribution:'${tileAttr}',keepBuffer:14,subdomains:'abc',crossOrigin:true,updateWhenIdle:false}).addTo(map);

var activePinEl=null;
var markerLayer=L.layerGroup().addTo(map);
// Diff-based marker cache: id → {marker, color}
var markerCache={};

function makeIcon(color){
  return L.divIcon({className:'',html:'<div class="custom-pin" style="background:'+color+'"></div>',iconSize:[28,28],iconAnchor:[14,14]});
}

function selectPin(el){
  if(activePinEl) activePinEl.classList.remove('active');
  if(el){el.classList.add('active');activePinEl=el;}
  else{activePinEl=null;}
}

function updateMarkers(places){
  if(!places||!places.length){
    // Tümünü temizle
    Object.keys(markerCache).forEach(function(id){
      markerLayer.removeLayer(markerCache[id].marker);
    });
    markerCache={};
    return;
  }
  // Gelen ID seti
  var incoming={};
  places.forEach(function(p){
    if(p.latitude==null||p.longitude==null)return;
    incoming[p.id]=p;
  });
  // Artık görünmeyen marker'ları kaldır
  Object.keys(markerCache).forEach(function(id){
    if(!incoming[id]){
      markerLayer.removeLayer(markerCache[id].marker);
      delete markerCache[id];
    }
  });
  // Yeni marker'ları ekle (renk değişimi dahil)
  Object.keys(incoming).forEach(function(id){
    var p=incoming[id];
    var color=p.statusColor||'${accentColor}';
    if(markerCache[id]){
      // Renk değiştiyse ikonu güncelle, marker'ı yeniden oluşturma
      if(markerCache[id].color!==color){
        markerCache[id].marker.setIcon(makeIcon(color));
        markerCache[id].color=color;
      }
      return; // Zaten haritada, dokunma
    }
    var m=L.marker([p.latitude,p.longitude],{icon:makeIcon(color)})
      .on('click',function(e){
        selectPin(e.target.getElement().querySelector('.custom-pin'));
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:p.id}));
      });
    markerLayer.addLayer(m);
    markerCache[id]={marker:m,color:color};
  });
}

function flyToInitial(lat,lng,zoom){
  map.setView([lat,lng],zoom||13);
}

map.on('click',function(){
  selectPin(null);
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'deselect'}));
});

function flyTo(lat,lng,zoom){map.flyTo([lat,lng],zoom||13)}
function setUserMarker(lat,lng){
  if(window._userCircle) map.removeLayer(window._userCircle);
  window._userCircle=L.circleMarker([lat,lng],{radius:8,fillColor:'#4285F4',color:'#fff',weight:3,fillOpacity:1}).addTo(map);
}
</script>
</body></html>`;
}

export function ExploreWebMapView({ places, loading, onLoadPlaces }: ExploreWebMapViewProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [didAutoCenter, setDidAutoCenter] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<PlaceStatusType[]>([]);

  const [selectedDistrict, setSelectedDistrict] = useState<AiSearchDistrict | null>(null);
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const webViewRef = useRef<WebView>(null);

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
        }
      } catch { }
    })();
  }, []);

  // Tema değişince HTML yenilenir, WebView reload olur – mapReady sıfırla ki onLoad'ta tekrar inject edilsin
  useEffect(() => {
    setMapReady(false);
  }, [isDark]);

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

  // Haritaya gönderilecek mekanları statusColor ile zenginleştir
  const visiblePlacesWithStatus = useMemo(() => {
    const now = new Date();
    return visiblePlaces.map((p) => {
      const status = getPlaceStatus(p.opening_time, p.closing_time, now);
      return { ...p, statusColor: status.color };
    });
  }, [visiblePlaces]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    const script: string[] = [];
    if (userLocation && !didAutoCenter) {
      script.push(`flyToInitial(${userLocation.latitude},${userLocation.longitude},15)`);
      script.push(`setUserMarker(${userLocation.latitude},${userLocation.longitude})`);
      setDidAutoCenter(true);
    }
    script.push(`updateMarkers(${JSON.stringify(visiblePlacesWithStatus)})`);
    webViewRef.current.injectJavaScript(script.join(';') + ';true;');
  }, [mapReady, userLocation, visiblePlacesWithStatus, didAutoCenter]);

  const prevDistrictRef = useRef<AiSearchDistrict | null>(null);

  useEffect(() => {
    if (mapReady && webViewRef.current) {
      if (selectedDistrict) {
        setSelectedPlace(null);
        webViewRef.current.injectJavaScript(
          `flyTo(${selectedDistrict.lat},${selectedDistrict.lng},14);selectPin(null);true;`,
        );
      } else if (prevDistrictRef.current) {
        setSelectedPlace(null);
        if (userLocation) {
          webViewRef.current.injectJavaScript(
            `flyTo(${userLocation.latitude},${userLocation.longitude},15);selectPin(null);true;`,
          );
        } else {
          webViewRef.current.injectJavaScript(
            `flyTo(${ISTANBUL_CENTER.latitude},${ISTANBUL_CENTER.longitude},13);selectPin(null);true;`,
          );
        }
      }
      prevDistrictRef.current = selectedDistrict;
    }
  }, [selectedDistrict, mapReady, userLocation]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'marker') {
          lightImpact();
          const place = places.find((p) => p.id === data.id);
          setSelectedPlace(place ?? null);
        } else if (data.type === 'deselect') {
          setSelectedPlace(null);
        }
      } catch { }
    },
    [places],
  );

  const goToUserLocation = useCallback(() => {
    lightImpact();
    if (userLocation && webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `flyTo(${userLocation.latitude},${userLocation.longitude},15);true;`,
      );
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
    webViewRef.current?.injectJavaScript(
      `flyTo(${ISTANBUL_CENTER.latitude},${ISTANBUL_CENTER.longitude},13);true;`,
    );
  }, []);

  const handleSelectPlace = useCallback((place: Place) => {
    lightImpact();
    setSelectedPlace(place);
    setQuery(place.name ?? '');
    setShowResults(false);
    Keyboard.dismiss();
    if (place.latitude != null && place.longitude != null) {
      webViewRef.current?.injectJavaScript(
        `flyTo(${place.latitude},${place.longitude},15);true;`,
      );
    }
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
    if (!pendingPlaceName || !mapReady || places.length === 0) return;

    // İsim ile eşleşen mekanı bul
    const matchedPlace = places.find(
      (p) => p.name?.toLowerCase() === pendingPlaceName.toLowerCase()
    );

    if (matchedPlace) {
      setQuery(matchedPlace.name ?? '');
      setShowResults(false);

      // Önce haritada konuma uç
      if (matchedPlace.latitude != null && matchedPlace.longitude != null) {
        webViewRef.current?.injectJavaScript(
          `flyTo(${matchedPlace.latitude},${matchedPlace.longitude},16);true;`
        );
      }

      // Harita animasyonu bittikten sonra kartı aç
      setTimeout(() => {
        setSelectedPlace(matchedPlace);
      }, 1200);
    }

    clearPendingPlace();
  }, [mapReady, places, pendingPlaceName, clearPendingPlace]);

  // HTML sabit – WebView tek sefer yüklenir, reload olmaz (kaydırınca loading ekranı gelmez)
  const html = useMemo(
    () => buildMapHTML(colors.accent.primary, isDark),
    [colors.accent.primary, isDark],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        key={isDark ? 'dark' : 'light'}
        source={{ html }}
        style={[styles.map, { backgroundColor: colors.background.tertiary }]}
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        onLoad={() => setMapReady(true)}
        onContentProcessDidTerminate={() => webViewRef.current?.reload()}
        onRenderProcessGone={() => webViewRef.current?.reload()}
        onMessage={handleMessage}
        onTouchStart={() => {
          setShowResults(false);
          setShowFilter(false);
          Keyboard.dismiss();
        }}
        javaScriptEnabled
        originWhitelist={['*']}
        cacheEnabled
        {...(Platform.OS === 'android' && { cacheMode: 'LOAD_CACHE_ELSE_NETWORK' as const })}
        androidLayerType="hardware"
      />

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
          <View style={[styles.filterPanel, { backgroundColor: colors.surface.elevated }]}>
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
          </View>
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

      {(loading || !mapReady) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {mapReady ? t('explore.loading_places') : t('explore.loading_map')}
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
            webViewRef.current?.injectJavaScript('selectPin(null);true;');
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
});
