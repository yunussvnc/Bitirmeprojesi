import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';
import * as Location from 'expo-location';
import { lightImpact } from '@/src/utils/haptics';
import type { Place } from '@/src/services/mekanService';
import { getPlaceStatus, type PlaceStatusType } from '@/src/utils/placeStatus';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { useAppStore } from '@/src/store/useAppStore';
import type { AiSearchDistrict } from '@/src/constants/aiDistricts';
import type { TFunction } from 'i18next';

const ISTANBUL_CENTER = { latitude: 41.0082, longitude: 28.9784 } as const;

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

interface HookParams {
  places: Place[];
  isDark: boolean;
  accentColor: string;
  t: TFunction;
}

export function useExploreWebMap({ places, isDark, accentColor, t }: HookParams) {
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
      } catch { /* ignore */ }
    })();
  }, []);

  // Tema değişince HTML yenilenir, WebView reload olur – mapReady sıfırla ki onLoad'ta tekrar inject edilsin
  useEffect(() => {
    setMapReady(false);
  }, [isDark]);

  const normalizeText = useCallback((text: string) => (
    text
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
  ), []);

  const filteredPlaces = useMemo(() => {
    const q = normalizeText(query.trim());
    return places.filter((p) => {
      if (q) {
        const haystack = [p.name, p.category, p.address, p.city, p.subtitle].filter(Boolean).join(' ');
        if (!normalizeText(haystack).includes(q)) return false;
      }
      if (selectedCategories.length > 0) {
        if (!p.category || !selectedCategories.includes(p.category)) return false;
      }
      if (selectedStatuses.length > 0) {
        const status = getPlaceStatus(p.opening_time, p.closing_time);
        if (!selectedStatuses.includes(status.status)) return false;
      }
      if (selectedDistrict) {
        if (!p.city || normalizeText(p.city) !== normalizeText(selectedDistrict.apiLocation)) {
          return false;
        }
      }
      return true;
    });
  }, [places, query, selectedCategories, selectedStatuses, selectedDistrict, normalizeText]);

  const visiblePlaces = useMemo(
    () => filteredPlaces.filter((p) => p.latitude != null && p.longitude != null),
    [filteredPlaces],
  );

  const visiblePlacesWithStatus = useMemo(() => {
    const now = new Date();
    return visiblePlaces.map((p) => {
      const status = getPlaceStatus(p.opening_time, p.closing_time, now);
      return {
        id: p.id,
        latitude: p.latitude,
        longitude: p.longitude,
        name: p.name,
        statusColor: status.color,
      } as {
        id: Place['id'];
        latitude: NonNullable<Place['latitude']>;
        longitude: NonNullable<Place['longitude']>;
        name: NonNullable<Place['name']>;
        statusColor: string;
      };
    });
  }, [visiblePlaces]);

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
    if (injectTimerRef.current) clearTimeout(injectTimerRef.current);
    injectTimerRef.current = setTimeout(() => {
      webViewRef.current?.injectJavaScript(script.join(';') + ';true;');
    }, 120);
  }, [mapReady, userLocation, visiblePlacesWithStatus, didAutoCenter]);

  useEffect(() => () => { if (injectTimerRef.current) clearTimeout(injectTimerRef.current); }, []);

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
      } catch { /* ignore parse errors */ }
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

  const pendingPlaceName = useAppStore((state) => state.pendingPlaceName);
  const clearPendingPlace = useAppStore((state) => state.clearPendingPlace);

  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!pendingPlaceName || !mapReady || places.length === 0) return;

    const matchedPlace = places.find(
      (p) => p.name?.toLowerCase() === pendingPlaceName.toLowerCase()
    );

    if (matchedPlace) {
      setQuery(matchedPlace.name ?? '');
      setShowResults(false);

      if (matchedPlace.latitude != null && matchedPlace.longitude != null) {
        webViewRef.current?.injectJavaScript(
          `flyTo(${matchedPlace.latitude},${matchedPlace.longitude},16);true;`
        );
      }

      pendingTimeoutRef.current = setTimeout(() => {
        setSelectedPlace(matchedPlace);
      }, 1200);
    }

    clearPendingPlace();
  }, [mapReady, places, pendingPlaceName, clearPendingPlace]);

  useEffect(() => () => { if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current); }, []);

  const html = useMemo(
    () => buildMapHTML(accentColor, isDark),
    [accentColor, isDark],
  );

  const onCloseSelectedPlace = useCallback((alsoDeselectMarker: boolean) => {
    setSelectedPlace(null);
    if (alsoDeselectMarker) {
      webViewRef.current?.injectJavaScript('selectMarker(null);true;');
    }
  }, []);

  const onWebViewTouchStart = useCallback(() => {
    setShowResults(false);
    setShowFilter(false);
    Keyboard.dismiss();
  }, []);

  return {
    webViewRef,
    html,
    mapReady,
    handleMessage,
    onWebViewTouchStart,

    query,
    setQuery,
    showResults,
    setShowResults,

    showFilter,
    setShowFilter,
    selectedCategories,
    selectedStatuses,
    activeFilterCount,
    toggleCategory,
    toggleStatus,
    clearFilters,

    selectedDistrict,
    setSelectedDistrict,
    districtModalOpen,
    setDistrictModalOpen,

    filteredPlaces,

    goToUserLocation,
    goToIstanbul,
    handleSelectPlace,

    selectedPlace,
    onCloseSelectedPlace,
  } as const;
}
