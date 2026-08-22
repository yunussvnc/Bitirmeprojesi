/**
 * WebView tabanlı harita görünümü – MapLibre GL JS + OpenFreeMap.
 * WebGL ile hardware-accelerated vector tile rendering.
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
  Keyboard,
  ScrollView,
  Modal,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import {
  getIstanbulDistrictsForPicker,
  type AiSearchDistrict,
} from '@/src/constants/aiDistricts';
import { CATEGORY_KEYS, STATUS_KEYS } from '@/src/utils/categories';
import * as Location from 'expo-location';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SearchInput } from '@/src/components/ui/Input';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
import { PlaceMediaPanel } from './PlaceMediaPanel';
import { useAppStore } from '@/src/store/useAppStore';
import { getPlaceStatus, type PlaceStatusType } from '@/src/utils/placeStatus';

import { useTranslation } from 'react-i18next';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

/** Category keys matching backend data values + translation keys */


const ISTANBUL_CENTER = { latitude: 41.0082, longitude: 28.9784 };

export interface ExploreWebMapViewProps {
  places: Place[];
  loading: boolean;
  onLoadPlaces: () => void;
}

function buildMapHTML(accentColor: string, isDark: boolean) {
  const styleUrl = isDark
    ? 'https://tiles.openfreemap.org/styles/dark'
    : 'https://tiles.openfreemap.org/styles/liberty';

  const mapBg = isDark ? '#1a1a2e' : '#f0f0f0';

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"/>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;overflow:hidden;background:${mapBg}!important}
  .maplibregl-ctrl-attrib{display:none!important}
  .maplibregl-ctrl-logo{display:none!important}
  .maplibregl-canvas{outline:none!important}

  /* Premium popup stili */
  .maplibregl-popup{z-index:10!important}
  .maplibregl-popup-content{
    background:${isDark ? 'rgba(18,18,28,0.95)' : 'rgba(255,255,255,0.97)'}!important;
    color:${isDark ? '#fff' : '#1a1a2e'}!important;
    border-radius:12px!important;
    padding:8px 14px!important;
    font-size:13px!important;
    font-weight:700!important;
    letter-spacing:0.2px!important;
    box-shadow:0 8px 32px rgba(0,0,0,${isDark ? '0.6' : '0.18'})!important;
    border:1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}!important;
    max-width:160px!important;
    white-space:nowrap!important;
    overflow:hidden!important;
    text-overflow:ellipsis!important;
    backdrop-filter:blur(12px)!important;
    -webkit-backdrop-filter:blur(12px)!important;
  }
  .maplibregl-popup-tip{
    border-top-color:${isDark ? 'rgba(18,18,28,0.95)' : 'rgba(255,255,255,0.97)'}!important;
  }
  .maplibregl-popup-close-button{display:none!important}

  /* Premium marker pin stili */
  .mk{
    cursor:pointer;width:36px;height:44px;
    display:flex;align-items:flex-start;justify-content:center;
    filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));
    transition:filter 0.25s ease;
  }
  .mk:hover{filter:drop-shadow(0 4px 10px rgba(0,0,0,0.5))}
  .mk svg{transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1)}
  .mk.active svg{transform:scale(1.35)}
  .mk.active{filter:drop-shadow(0 6px 16px rgba(0,0,0,0.5))!important;z-index:5!important}

  /* Kullanıcı konum pulse */
  @keyframes pulse{
    0%{transform:scale(1);opacity:0.6}
    50%{transform:scale(2.5);opacity:0}
    100%{transform:scale(1);opacity:0}
  }
  .user-loc{width:22px;height:22px;position:relative;display:flex;align-items:center;justify-content:center}
  .user-pulse{position:absolute;width:22px;height:22px;border-radius:50%;background:rgba(66,133,244,0.25);animation:pulse 2s ease-out infinite}
  .user-dot{width:13px;height:13px;border-radius:50%;background:#4285F4;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(66,133,244,0.4);position:relative;z-index:2}
</style>
</head><body>
<div id="map"></div>
<script>
var map = new maplibregl.Map({
  container:'map',
  style:'${styleUrl}',
  center:[${ISTANBUL_CENTER.longitude},${ISTANBUL_CENTER.latitude}],
  zoom:12,
  attributionControl:false,
  maxZoom:17.5,
  minZoom:5,
  pitchWithRotate:false,
  dragRotate:false
});

var _markers = {};
var _activePopup = null;
var _activeId = null;
var _userMarker = null;

map.on('load', function(){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
});

// Hata durumunda da mapReady gönder (stil yüklenemezse)
map.on('error', function(e){
  if(e && e.error && e.error.status === 404){
    // Stil bulunamazsa yine de çalış
  }
});

// Premium drop-pin SVG oluşturucu
function pinSVG(color){
  return '<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">'
    +'<path d="M14 0C6.268 0 0 6.268 0 14c0 9.8 12.348 20.826 12.874 21.302a1.5 1.5 0 002.252 0C15.652 34.826 28 23.8 28 14 28 6.268 21.732 0 14 0z" fill="'+color+'"/>'
    +'<circle cx="14" cy="13" r="5.5" fill="#fff" opacity="0.95"/>'
    +'<circle cx="14" cy="13" r="3" fill="'+color+'" opacity="0.7"/>'
    +'</svg>';
}

function updateMarkers(places){
  if(!places || !places.length){
    Object.keys(_markers).forEach(function(id){ _markers[id].remove(); });
    _markers = {};
    return;
  }

  var incoming = {};
  places.forEach(function(p){
    if(p.latitude!=null && p.longitude!=null) incoming[p.id] = p;
  });

  // Eski marker'ları temizle
  Object.keys(_markers).forEach(function(id){
    if(!incoming[id]){ _markers[id].remove(); delete _markers[id]; }
  });

  // Yeni marker'ları batch olarak ekle
  var keys = Object.keys(incoming), idx = 0, BATCH = 60;

  function addBatch(){
    for(var end = Math.min(idx+BATCH, keys.length); idx < end; idx++){
      var id = keys[idx], p = incoming[id];
      var color = p.statusColor || '${accentColor}';

      if(_markers[id]){
        if(_markers[id]._color !== color){
          _markers[id].getElement().querySelector('svg path').setAttribute('fill', color);
          _markers[id].getElement().querySelectorAll('svg circle')[1].setAttribute('fill', color);
          _markers[id]._color = color;
        }
        continue;
      }

      var el = document.createElement('div');
      el.className = 'mk';
      el.innerHTML = pinSVG(color);

      var marker = new maplibregl.Marker({element:el, anchor:'bottom'})
        .setLngLat([p.longitude, p.latitude])
        .addTo(map);
      marker._color = color;
      marker._name = p.name;
      marker._placeId = p.id;

      (function(mk, pp){
        mk.getElement().addEventListener('click', function(e){
          e.stopPropagation();
          selectMarker(pp.id, pp.name, pp.longitude, pp.latitude);
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:pp.id}));
        });
      })(marker, p);

      _markers[id] = marker;
    }
    if(idx < keys.length) requestAnimationFrame(addBatch);
  }
  requestAnimationFrame(addBatch);
}

function selectMarker(id, name, lng, lat){
  // Önceki aktif marker'ı normale döndür
  if(_activeId && _markers[_activeId]){
    _markers[_activeId].getElement().classList.remove('active');
  }
  if(_activePopup){ _activePopup.remove(); _activePopup = null; }

  _activeId = id;

  if(id && _markers[id]){
    _markers[id].getElement().classList.add('active');
    // Sadece seçili mekanın ismini göster
    if(name && lng != null && lat != null){
      _activePopup = new maplibregl.Popup({offset:[0,-40], closeOnClick:false})
        .setLngLat([lng, lat])
        .setHTML('<div>'+name.replace(/</g,'&lt;')+'</div>')
        .addTo(map);
    }
  }
}

function deselectAll(){
  selectMarker(null);
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'deselect'}));
}

map.on('click', function(){
  deselectAll();
});

function flyTo(lat, lng, zoom){
  map.flyTo({center:[lng,lat], zoom:zoom||13, duration:600, essential:true});
}

function flyToInitial(lat, lng, zoom){
  map.jumpTo({center:[lng,lat], zoom:zoom||13});
}

function setUserMarker(lat, lng){
  if(_userMarker) _userMarker.remove();
  var el = document.createElement('div');
  el.className = 'user-loc';
  el.innerHTML = '<div class="user-pulse"></div><div class="user-dot"></div>';
  _userMarker = new maplibregl.Marker({element:el, anchor:'center'})
    .setLngLat([lng, lat])
    .addTo(map);
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
  }, [places, query, selectedCategories, selectedStatuses, selectedDistrict]);

  const visiblePlaces = useMemo(
    () => filteredPlaces.filter((p) => p.latitude != null && p.longitude != null),
    [filteredPlaces],
  );

  // Haritaya gönderilecek mekanları statusColor ile zenginleştir
  // now sabitleniyor — her render'da yeni Date() üretmeyi önlemek için
  const visiblePlacesWithStatus = useMemo(() => {
    const now = new Date();
    return visiblePlaces.map((p) => {
      const status = getPlaceStatus(p.opening_time, p.closing_time, now);
      // Haritaya sadece gerekli alanları gönder (payload küçük olsun)
      return {
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        name: p.name,
        statusColor: status.color,
      };
    });
  }, [visiblePlaces]);

  // Marker inject'i debounce ref ile throttle et
  const injectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    const script: string[] = [];
    if (userLocation && !didAutoCenter) {
      script.push(`flyToInitial(${userLocation.latitude},${userLocation.longitude},15)`);
      script.push(`setUserMarker(${userLocation.latitude},${userLocation.longitude})`);
      setDidAutoCenter(true);
    }
    const payload = JSON.stringify(visiblePlacesWithStatus);
    script.push(`updateMarkers(${payload})`);
    // Filtre/arama değişimlerini 120ms debounce ile gönder
    if (injectTimerRef.current) clearTimeout(injectTimerRef.current);
    injectTimerRef.current = setTimeout(() => {
      webViewRef.current?.injectJavaScript(script.join(';') + ';true;');
    }, 120);
  }, [mapReady, userLocation, visiblePlacesWithStatus, didAutoCenter]);

  const prevDistrictRef = useRef<AiSearchDistrict | null>(null);

  useEffect(() => {
    if (mapReady && webViewRef.current) {
      if (selectedDistrict) {
        setSelectedPlace(null);
        webViewRef.current.injectJavaScript(
          `flyTo(${selectedDistrict.lat},${selectedDistrict.lng},14);selectMarker(null);true;`,
        );
      } else if (prevDistrictRef.current) {
        setSelectedPlace(null);
        if (userLocation) {
          webViewRef.current.injectJavaScript(
            `flyTo(${userLocation.latitude},${userLocation.longitude},15);selectMarker(null);true;`,
          );
        } else {
          webViewRef.current.injectJavaScript(
            `flyTo(${ISTANBUL_CENTER.latitude},${ISTANBUL_CENTER.longitude},13);selectMarker(null);true;`,
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
        } else if (data.type === 'mapReady') {
          setMapReady(true);
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
  }, [userLocation, t]);

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
        domStorageEnabled
        startInLoadingState={false}
        setBuiltInZoomControls={false}
        {...(Platform.OS === 'android' && {
          cacheMode: 'LOAD_CACHE_ELSE_NETWORK' as const,
          androidLayerType: 'hardware' as const,
          mixedContentMode: 'always' as const,
          thirdPartyCookiesEnabled: false,
        })}
        renderLoading={() => <></>}
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
            webViewRef.current?.injectJavaScript('selectMarker(null);true;');
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
