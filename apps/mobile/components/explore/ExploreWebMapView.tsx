/**
 * WebView tabanlı harita görünümü – Leaflet + OpenStreetMap.
 * Expo Go, Simulator ve gerçek cihazda çalışır (native modül gerektirmez).
 */

import { router } from 'expo-router';
import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Place } from '@/src/services/mekanService';
import { lightImpact } from '@/src/utils/haptics';

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
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch {}
    })();
  }, []);

  // Tema değişince HTML yenilenir, WebView reload olur – mapReady sıfırla ki onLoad'ta tekrar inject edilsin
  useEffect(() => {
    setMapReady(false);
  }, [isDark]);

  useEffect(() => {
    if (!mapReady || !webViewRef.current) return;
    const script: string[] = [];
    if (userLocation) {
      script.push(`flyToInitial(${userLocation.latitude},${userLocation.longitude},15)`);
      script.push(`setUserMarker(${userLocation.latitude},${userLocation.longitude})`);
    }
    script.push(`updateMarkers(${JSON.stringify(places.filter((p) => p.latitude != null && p.longitude != null))})`);
    webViewRef.current.injectJavaScript(script.join(';') + ';true;');
  }, [mapReady, userLocation, places]);

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
      } catch {}
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
        javaScriptEnabled
        originWhitelist={['*']}
        cacheEnabled
        {...(Platform.OS === 'android' && { cacheMode: 'LOAD_CACHE_ELSE_NETWORK' as const })}
        androidLayerType="hardware"
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

      {(loading || !mapReady) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
          <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
            {mapReady ? 'Mekanlar yükleniyor...' : 'Harita yükleniyor...'}
          </Text>
        </View>
      )}

      {selectedPlace && (
        <TouchableOpacity
          style={[styles.bottomCard, { backgroundColor: colors.surface.elevated }]}
          onPress={() => {
            lightImpact();
            router.push({ pathname: '/place/[id]', params: { id: String(selectedPlace.id) } } as any);
          }}
          activeOpacity={0.9}
        >
          <Text style={[styles.cardTitle, { color: colors.text.primary }]} numberOfLines={2}>
            {selectedPlace.name}
          </Text>
          {selectedPlace.category && (
            <Text style={[styles.cardCategory, { color: colors.text.tertiary }]}>
              {selectedPlace.category}
            </Text>
          )}
          <Text style={[styles.cardAction, { color: colors.accent.primary }]}>Detayları gör →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
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
  controls: { position: 'absolute', right: 16, bottom: 240, gapa: 10 },
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
  bottomCard: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 120 : 100,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  cardCategory: { fontSize: 13, marginTop: 4 },
  cardAction: { fontSize: 14, fontWeight: '600', marginTop: 8 },
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
