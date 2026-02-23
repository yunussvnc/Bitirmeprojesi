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
import * as Location from 'expo-location';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SearchInput } from '@/src/components/ui/Input';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';
import { PlaceMediaPanel } from './PlaceMediaPanel';
import { useAppStore } from '@/src/store/useAppStore';

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
    background:${accentColor};border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
    transition:transform .25s cubic-bezier(.34,1.56,.64,1),box-shadow .25s ease;
  }
  .custom-pin.active{
    transform:scale(1.45);
    box-shadow:0 0 0 8px ${accentColor}33,0 4px 12px rgba(0,0,0,0.4);
    border-color:${accentColor};
    background:#fff;
  }
</style>
</head><body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,touchZoom:true,doubleClickZoom:true,scrollWheelZoom:true,boxZoom:true}).setView([${ISTANBUL_CENTER.latitude},${ISTANBUL_CENTER.longitude}],13);
L.tileLayer('${tileUrl}',{maxZoom:19,attribution:'${tileAttr}',keepBuffer:14,subdomains:'abc',crossOrigin:true,updateWhenIdle:false}).addTo(map);

var pin=L.divIcon({className:'',html:'<div class="custom-pin"></div>',iconSize:[28,28],iconAnchor:[14,14]});
var activePinEl=null;
var markerLayer=L.layerGroup().addTo(map);

function selectPin(el){
  if(activePinEl) activePinEl.classList.remove('active');
  if(el){el.classList.add('active');activePinEl=el;}
  else{activePinEl=null;}
}

function updateMarkers(places){
  markerLayer.clearLayers();
  if(!places||!places.length)return;
  places.forEach(function(p){
    if(p.latitude==null||p.longitude==null)return;
    var m=L.marker([p.latitude,p.longitude],{icon:pin})
      .on('click',function(e){selectPin(e.target.getElement().querySelector('.custom-pin'));window.ReactNativeWebView.postMessage(JSON.stringify({type:'marker',id:p.id}))});
    markerLayer.addLayer(m);
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
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [didAutoCenter, setDidAutoCenter] = useState(false);
  const webViewRef = useRef<WebView>(null);

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
    const q = query.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => {
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
      return haystack.includes(q);
    });
  }, [places, query]);

  const visiblePlaces = useMemo(
    () => filteredPlaces.filter((p) => p.latitude != null && p.longitude != null),
    [filteredPlaces],
  );

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    const script: string[] = [];
    if (userLocation && !didAutoCenter) {
      script.push(`flyToInitial(${userLocation.latitude},${userLocation.longitude},15)`);
      script.push(`setUserMarker(${userLocation.latitude},${userLocation.longitude})`);
      setDidAutoCenter(true);
    }
    script.push(`updateMarkers(${JSON.stringify(visiblePlaces)})`);
    webViewRef.current.injectJavaScript(script.join(';') + ';true;');
  }, [mapReady, userLocation, visiblePlaces, didAutoCenter]);

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
        'Konum izni gerekli',
        'Yakınızdaki mekanları görmek için konum erişimine izin verin.',
        [{ text: 'Tamam' }],
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

  // Mesajlardan gelen mekan açma isteğini dinle
  useEffect(() => {
    const pendingName = useAppStore.getState().pendingPlaceName;
    if (!pendingName || !mapReady || places.length === 0) return;

    // İsim ile eşleşen mekanı bul
    const matchedPlace = places.find(
      (p) => p.name?.toLowerCase() === pendingName.toLowerCase()
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

    useAppStore.getState().clearPendingPlace();
  }, [mapReady, places]);

  // HTML sabit – WebView tek sefer yüklenir, reload olmaz (kaydırınca loading ekranı gelmez)
  const html = useMemo(
    () => buildMapHTML(colors.accent.primary, isDark),
    [colors.accent.primary, isDark],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={[styles.map, { backgroundColor: colors.background.tertiary }]}
        scrollEnabled
        bounces={false}
        overScrollMode="never"
        onLoad={() => setMapReady(true)}
        onMessage={handleMessage}
        onTouchStart={() => {
          setShowResults(false);
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
        <SearchInput
          placeholder="Mekan ara..."
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
        {showResults && query.trim().length > 0 && (
          <View style={[styles.resultsCard, { backgroundColor: colors.surface.elevated }]}>
            {filteredPlaces.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                Sonuç bulunamadı
              </Text>
            ) : (
              <ScrollView
                style={styles.resultsScroll}
                contentContainerStyle={styles.resultsScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {filteredPlaces.map((place) => (
                  <TouchableOpacity
                    key={String(place.id)}
                    style={styles.resultRow}
                    onPress={() => handleSelectPlace(place)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.resultText}>
                      <Text style={[styles.resultTitle, { color: colors.text.primary }]} numberOfLines={1}>
                        {place.name}
                      </Text>
                      {!!(place.category || place.city) && (
                        <Text style={[styles.resultMeta, { color: colors.text.tertiary }]} numberOfLines={1}>
                          {[place.category, place.city].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
                  </TouchableOpacity>
                ))}
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
            {mapReady ? 'Mekanlar yükleniyor...' : 'Harita yükleniyor...'}
          </Text>
        </View>
      )}

      {selectedPlace && (
        <PlaceMediaPanel
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
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
  searchContainer: {
    marginBottom: 0,
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
