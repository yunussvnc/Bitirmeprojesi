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
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
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
import { DistanceSlider } from '@/src/components/ui/DistanceSlider';
import { useTranslation } from 'react-i18next';
import { GOOGLE_MAPS_API_KEY } from '@/src/constants/maps';

/** Category keys matching backend data values + translation keys */


const ISTANBUL_CENTER = { latitude: 41.0082, longitude: 28.9784 };
const WHOLE_CITY_KM = 50;

type MapMarker = {
  id: number | string;
  latitude: number;
  longitude: number;
  name: string;
  statusColor: string;
  category?: string;
};

export interface ExploreWebMapViewProps {
  places: Place[];
  loading: boolean;
  onLoadPlaces: () => void;
}

function buildGoogleMapHTML(apiKey: string, accentColor: string, isDark: boolean) {
  const mapBg = isDark ? '#1a1a1a' : '#f5f5f5';
  const darkStyles = JSON.stringify([
    { elementType: 'geometry', stylers: [{ color: '#212121' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  ]);

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;overflow:hidden;background:${mapBg}}
  .place-label{font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-size:13px;font-weight:600;color:#111;padding:2px 0}
  .place-meta{font-size:11px;color:#666;margin-top:2px}
</style>
</head><body>
<div id="map"></div>
<script>
var map,infoWindow,activeMarkerId=null,userCircle=null,placeMarkers=[];

function initMap(){
  map=new google.maps.Map(document.getElementById('map'),{
    center:{lat:${ISTANBUL_CENTER.latitude},lng:${ISTANBUL_CENTER.longitude}},
    zoom:13,
    disableDefaultUI:true,
    gestureHandling:'greedy',
    styles:${isDark ? darkStyles : '[]'}
  });
  infoWindow=new google.maps.InfoWindow({maxWidth:220});
  map.addListener('click',function(){
    activeMarkerId=null;
    infoWindow.close();
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'deselect'}));
  });
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
}

function pinIcon(color){
  var c=color||'${accentColor}';
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="'+c+'"/><circle cx="16" cy="14" r="5.5" fill="#fff" opacity="0.95"/></svg>';
  return {url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),scaledSize:new google.maps.Size(32,40),anchor:new google.maps.Point(16,40)};
}

function popupHtml(p){
  var cat=p.category?'<div class="place-meta">'+String(p.category).replace(/</g,'&lt;')+'</div>':'';
  return '<div class="place-label">'+String(p.name||'Mekan').replace(/</g,'&lt;')+'</div>'+cat;
}

function updateMarkers(places){
  if(!map)return;
  placeMarkers.forEach(function(m){m.setMap(null);});
  placeMarkers=[];
  if(!places||!places.length)return;
  places.forEach(function(p){
    if(p.latitude==null||p.longitude==null)return;
    var color=p.statusColor||'${accentColor}';
    var marker=new google.maps.Marker({
      position:{lat:p.latitude,lng:p.longitude},
      map:map,
      icon:pinIcon(color),
      title:p.name||''
    });
    marker.addListener('click',function(){
      activeMarkerId=p.id;
      infoWindow.setContent(popupHtml(p));
      infoWindow.open(map,marker);
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:p.id}));
    });
    placeMarkers.push(marker);
  });
}

function flyToInitial(lat,lng,zoom){if(map)map.setCenter({lat:lat,lng:lng});if(map&&zoom)map.setZoom(zoom);}
function flyTo(lat,lng,zoom){if(!map)return;map.panTo({lat:lat,lng:lng});if(zoom)map.setZoom(zoom);}
function setUserMarker(lat,lng){
  if(!map)return;
  if(userCircle)userCircle.setMap(null);
  userCircle=new google.maps.Circle({center:{lat:lat,lng:lng},radius:80,fillColor:'#4285F4',fillOpacity:0.25,strokeColor:'#4285F4',strokeWeight:2,map:map});
}
function selectPin(id){activeMarkerId=id;}
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap"></script>
</body></html>`;
}

function buildLeafletMapHTML(accentColor: string, isDark: boolean) {
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const tileAttr = '&copy; <a href="https://carto.com/">CARTO</a>';
  const mapBg = isDark ? '#1a1a1a' : '#e0e0e0';
  const popupBg = isDark ? '#2a2a2a' : '#ffffff';
  const popupText = isDark ? '#f5f5f5' : '#111111';
  const popupMeta = isDark ? '#aaaaaa' : '#666666';

  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;overflow:hidden;background:${mapBg}!important}
  .leaflet-container{background:${mapBg}!important}
  .leaflet-tile-pane .leaflet-layer{background:${mapBg}}
  .leaflet-tile{background:${mapBg}!important}
  .leaflet-control-attribution{display:none!important}
  .leaflet-popup-content-wrapper{border-radius:12px;padding:0;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.18)}
  .leaflet-popup-content{margin:10px 14px;font-family:-apple-system,BlinkMacSystemFont,sans-serif}
  .place-label{font-size:13px;font-weight:700;color:${popupText}}
  .place-meta{font-size:11px;color:${popupMeta};margin-top:3px}
  .marker-cluster-small,.marker-cluster-medium,.marker-cluster-large{background:rgba(66,133,244,0.25)!important}
  .marker-cluster-small div,.marker-cluster-medium div,.marker-cluster-large div{background:${accentColor}!important;color:#fff!important;font-weight:700}
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,touchZoom:true,doubleClickZoom:true,scrollWheelZoom:true,boxZoom:true}).setView([${ISTANBUL_CENTER.latitude},${ISTANBUL_CENTER.longitude}],13);
L.tileLayer('${tileUrl}',{maxZoom:19,attribution:'${tileAttr}',keepBuffer:14,subdomains:'abc',crossOrigin:true,updateWhenIdle:false}).addTo(map);

var markerCluster=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:50,spiderfyOnMaxZoom:true});
map.addLayer(markerCluster);
var activeMarker=null;

function pinIcon(color){
  var c=color||'${accentColor}';
  var svg='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="'+c+'"/><circle cx="16" cy="14" r="5.5" fill="#fff" opacity="0.95"/></svg>';
  return L.icon({iconUrl:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),iconSize:[32,40],iconAnchor:[16,40],popupAnchor:[0,-38]});
}

function popupHtml(p){
  var cat=p.category?'<div class="place-meta">'+String(p.category).replace(/</g,'&lt;')+'</div>':'';
  return '<div class="place-label">'+String(p.name||'Mekan').replace(/</g,'&lt;')+'</div>'+cat;
}

function selectPin(marker){
  if(activeMarker&&activeMarker.setOpacity)activeMarker.setOpacity(1);
  activeMarker=marker||null;
  if(activeMarker&&activeMarker.setOpacity)activeMarker.setOpacity(1);
}

function updateMarkers(places){
  markerCluster.clearLayers();
  if(!places||!places.length)return;
  places.forEach(function(p){
    if(p.latitude==null||p.longitude==null)return;
    var color=p.statusColor||'${accentColor}';
    var m=L.marker([p.latitude,p.longitude],{icon:pinIcon(color)});
    m.bindPopup(popupHtml(p),{closeButton:false,offset:[0,-4]});
    m.on('click',function(){
      selectPin(m);
      m.openPopup();
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:p.id}));
    });
    markerCluster.addLayer(m);
  });
}

function flyToInitial(lat,lng,zoom){map.setView([lat,lng],zoom||13);}

map.on('click',function(){
  selectPin(null);
  map.closePopup();
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'deselect'}));
});

function flyTo(lat,lng,zoom){map.flyTo([lat,lng],zoom||15)}
function setUserMarker(lat,lng){
  if(window._userCircle) map.removeLayer(window._userCircle);
  window._userCircle=L.circleMarker([lat,lng],{radius:8,fillColor:'#4285F4',color:'#fff',weight:3,fillOpacity:1}).addTo(map);
}
window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapReady'}));
</script>
</body></html>`;
}

function buildMapHTML(accentColor: string, isDark: boolean): string {
  if (GOOGLE_MAPS_API_KEY) {
    return buildGoogleMapHTML(GOOGLE_MAPS_API_KEY, accentColor, isDark);
  }
  return buildLeafletMapHTML(accentColor, isDark);
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
  const [maxDistance, setMaxDistance] = useState<number>(50); // 50km = All City
  const webViewRef = useRef<WebView>(null);

  const activeFilterCount = selectedCategories.length + selectedStatuses.length + (maxDistance < 50 ? 1 : 0);

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
    setMaxDistance(50);
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

  // Tema değişince HTML yenilenir, WebView reload olur – mapReady sıfırla
  useEffect(() => {
    setMapReady(false);
    setDidAutoCenter(false);
  }, [isDark]);

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();
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
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
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
      // Mesafe filtresi — yalnızca slider 50 km'den düşükse uygula ("Bütün Şehir" = filtre yok)
      if (userLocation && maxDistance < WHOLE_CITY_KM && p.latitude != null && p.longitude != null) {
        const distKm = calculateDistance(userLocation.latitude, userLocation.longitude, p.latitude, p.longitude) / 1000;
        if (distKm > maxDistance) return false;
      }
      return true;
    });
  }, [places, query, selectedCategories, selectedStatuses, maxDistance, userLocation]);

  const visiblePlaces = useMemo(
    () => filteredPlaces.filter((p) => p.latitude != null && p.longitude != null),
    [filteredPlaces],
  );

  const mapMarkers = useMemo<MapMarker[]>(() => {
    const now = new Date();
    return visiblePlaces.map((p) => {
      const status = getPlaceStatus(p.opening_time, p.closing_time, now);
      return {
        id: p.id,
        latitude: p.latitude!,
        longitude: p.longitude!,
        name: p.name,
        statusColor: status.color,
        category: p.category,
      };
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
    script.push(`updateMarkers(${JSON.stringify(mapMarkers)})`);
    webViewRef.current.injectJavaScript(script.join(';') + ';true;');
  }, [mapReady, userLocation, mapMarkers, didAutoCenter]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapReady') {
          setMapReady(true);
          return;
        }
        if (data.type === 'marker') {
          lightImpact();
          const place = places.find((p) => String(p.id) === String(data.id));
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

            {/* Mesafe Filtresi */}
            {userLocation && (
              <View style={[styles.filterSection, { marginTop: 4 }]}>
                <DistanceSlider
                  min={1}
                  max={50}
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  title={t('explore.filter_distance')}
                  maxLabel={t('explore.whole_city')}
                />
              </View>
            )}

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

      {!loading && mapReady && visiblePlaces.length > 0 && !selectedPlace && (
        <View style={[styles.badge, { backgroundColor: colors.surface.elevated }]}>
          <Text style={[styles.badgeText, { color: colors.text.secondary }]}>
            {t('explore.place_map_count', { count: visiblePlaces.length })}
          </Text>
        </View>
      )}

      {(loading || !mapReady) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {mapReady ? t('explore.loading_places') : t('explore.loading_map')}
          </Text>
        </View>
      )}

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
});
