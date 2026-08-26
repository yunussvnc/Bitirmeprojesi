import { useEffect, useMemo, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
// Vite, maplibre-gl'in kendi içinde `new Worker(new URL(...))` ile çözdüğü worker
// dosyasını doğru hash'leyip kopyalamıyor — nginx'in SPA fallback'i bu yüzden
// /assets/maplibre-gl-worker.mjs isteğine index.html (text/html) döndürüyordu,
// harita hiç render olmuyordu. `?url` ile Vite'a bunu gerçek bir statik asset
// olarak işlettirip doğru URL'i elle set ediyoruz.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
maplibregl.setWorkerUrl(maplibreWorkerUrl)
import { motion } from 'framer-motion'
import { MapPin, X, Star, LocateFixed } from 'lucide-react'
import { useVenues, type Venue } from '../hooks/useVenues'
import VenueImage from './VenueImage'
import { ALLOWED_PLACE_CATEGORIES } from '../lib/placeCategory'
import { getPlaceStatus } from '../lib/placeStatus'

// apps/mobile/src/components/domain/explore/ExploreMapView.tsx ile aynı sabitler —
// mobil uygulamadaki harita deneyimiyle görsel/davranışsal parite hedefi.
const ISTANBUL_CENTER = { lng: 28.9784, lat: 41.0082, zoom: 10 }
const DEFAULT_ZOOM = 14
const STYLE_URL = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
// Mobildeki accent (#1DB954) yerine sitenin kendi --primary'si — rol aynı, hex site geneliyle tutarlı.
const ACCENT = '#10b981'
// /places/lite açılış/kapanış saati taşımıyor, bu yüzden durum her zaman "bilinmiyor" —
// tek doğruluk kaynağı olarak placeStatus.ts'in fallback rengini kullanıyoruz (magic hex tekrarlamak yerine).
const FALLBACK_STATUS_COLOR = getPlaceStatus().color

function priceLabel(n: number) {
  return '₺'.repeat(Math.max(1, Math.min(4, n)))
}

function toGeoJSON(venues: Venue[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: venues.map((v) => ({
      type: 'Feature',
      id: Number(v.id),
      geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
      properties: { id: v.id, name: v.name, statusColor: FALLBACK_STATUS_COLOR },
    })),
  }
}

const fade = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
}

export default function VenueMapSection() {
  const { venues, loading } = useVenues()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const userMarkerRef = useRef<maplibregl.Marker | null>(null)
  const venuesByIdRef = useRef<Map<string, Venue>>(new Map())
  const [mapReady, setMapReady] = useState(false)
  const [activeCategories, setActiveCategories] = useState<string[]>([])
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null)
  const [selectedPlace, setSelectedPlace] = useState<Venue | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)

  const toggleCategory = (cat: string) =>
    setActiveCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))

  const filtered = useMemo(
    () =>
      venues.filter((v) => {
        if (activeCategories.length > 0 && !activeCategories.includes(v.category)) return false
        if (activeDistrict && v.district !== activeDistrict) return false
        return true
      }),
    [venues, activeCategories, activeDistrict]
  )

  function selectPlace(v: Venue) {
    setSelectedPlace(v)
    mapRef.current?.flyTo({ center: [v.lng, v.lat], zoom: DEFAULT_ZOOM + 1, duration: 800 })
  }

  // Harita — bir kez kurulur
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [ISTANBUL_CENTER.lng, ISTANBUL_CENTER.lat],
      zoom: ISTANBUL_CENTER.zoom,
      attributionControl: false,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

    // Geçici teşhis: harita canlıda siyah kalıyordu, kök sebep uzaktan (DevTools
    // olmadan) belirsizdi — gerçek hatayı doğrudan sayfada gösteriyoruz.
    map.on('error', (e) => {
      // eslint-disable-next-line no-console
      console.error('[VenueMapSection] MapLibre hata:', e.error)
      setMapError(e.error?.message || String(e.error) || 'Bilinmeyen harita hatası')
    })

    map.on('load', () => {
      map.addSource('venues', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterRadius: 75,
        clusterMaxZoom: 14,
      })

      map.addLayer({
        id: 'clustersGlow',
        type: 'circle',
        source: 'venues',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ACCENT,
          'circle-opacity': 0.3,
          'circle-radius': ['step', ['get', 'point_count'], 24, 10, 32, 50, 40],
        },
      })
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'venues',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': ACCENT,
          'circle-opacity': 0.9,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 22, 50, 28],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#000000',
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'venues',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 13,
          'text-font': ['Noto Sans Bold'],
        },
        paint: { 'text-color': '#ffffff' },
      })
      map.addLayer({
        id: 'placesCircles',
        type: 'circle',
        source: 'venues',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 9,
          'circle-color': ACCENT,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#1a1a1a',
        },
      })
      map.addLayer({
        id: 'placesCirclesInner',
        type: 'circle',
        source: 'venues',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 4.5,
          'circle-color': ['get', 'statusColor'],
        },
      })
      map.addLayer({
        id: 'placesLabels',
        type: 'symbol',
        source: 'venues',
        minzoom: 14,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 11,
          'text-anchor': 'top',
          'text-offset': [0, 0.8],
          'text-allow-overlap': false,
          'text-optional': true,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.8)',
          'text-halo-width': 1.5,
        },
      })

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        const clusterId = features[0]?.properties?.cluster_id
        const source = map.getSource('venues') as GeoJSONSource
        if (clusterId == null) return
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geom = features[0].geometry
          if (geom.type !== 'Point') return
          map.easeTo({ center: geom.coordinates as [number, number], zoom, duration: 600 })
        })
      })

      map.on('click', 'placesCircles', (e) => {
        const feature = e.features?.[0]
        const id = feature?.properties?.id
        if (!id) return
        const venue = venuesByIdRef.current.get(String(id))
        if (venue) selectPlace(venue)
      })

      // Boş bir alana tıklanırsa seçili mekanı temizle (mobildeki Map onPress ile aynı davranış)
      map.on('click', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters', 'placesCircles'] })
        if (features.length === 0) setSelectedPlace(null)
      })

      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''))
      map.on('mouseenter', 'placesCircles', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'placesCircles', () => (map.getCanvas().style.cursor = ''))

      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Filtre değiştiğinde harita kaynağını güncelle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return
    venuesByIdRef.current = new Map(filtered.map((v) => [v.id, v]))
    const source = map.getSource('venues') as GeoJSONSource | undefined
    source?.setData(toGeoJSON(filtered))
  }, [filtered, mapReady])

  // DistrictDiscovery.tsx'in dispatch ettiği 'district-select' event'i — mevcut köprü korunuyor
  useEffect(() => {
    const onDistrictSelect = (e: Event) => {
      const district = (e as CustomEvent<string>).detail
      setActiveDistrict(district)
      setSelectedPlace(null)
      const map = mapRef.current
      const districtVenues = venues.filter((v) => v.district === district)
      if (!map || districtVenues.length === 0) return
      const lngs = districtVenues.map((v) => v.lng)
      const lats = districtVenues.map((v) => v.lat)
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 80, duration: 1000, maxZoom: 15 }
      )
    }
    window.addEventListener('district-select', onDistrictSelect)
    return () => window.removeEventListener('district-select', onDistrictSelect)
  }, [venues])

  function goToUserLocation() {
    if (!navigator.geolocation) {
      setLocateError('Tarayıcınız konum özelliğini desteklemiyor.')
      return
    }
    setLocating(true)
    setLocateError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        const { latitude, longitude } = pos.coords
        const map = mapRef.current
        if (!map) return
        if (!userMarkerRef.current) {
          const el = document.createElement('div')
          el.className = 'venue-map-user-dot'
          userMarkerRef.current = new maplibregl.Marker({ element: el })
        }
        userMarkerRef.current.setLngLat([longitude, latitude]).addTo(map)
        map.flyTo({ center: [longitude, latitude], zoom: DEFAULT_ZOOM, duration: 1000 })
      },
      () => {
        setLocating(false)
        setLocateError('Konum izni verilmedi.')
      },
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  const counts = ALLOWED_PLACE_CATEGORIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = venues.filter((v) => v.category === c).length
    return acc
  }, {})

  return (
    <section id="kesif" className="section venue-map-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          variants={fade}
        >
          <span className="section-label">Keşif</span>
          <h2 className="section-title">İstanbul'da <em>Nerede Ne Yenir?</em></h2>
          <p className="section-desc">
            {loading ? 'Mekanlar yükleniyor…' : `${venues.length.toLocaleString('tr-TR')} gerçek mekanı haritada keşfedin — kategoriye göre filtreleyin, kümeleri açın, detayları görün.`}
          </p>
          {activeDistrict && (
            <button className="district-chip" onClick={() => setActiveDistrict(null)}>
              <MapPin size={13} /> {activeDistrict} <X size={13} />
            </button>
          )}
        </motion.div>

        {!loading && (
          <div className="venue-filters">
            <button
              className={`venue-filter-btn${activeCategories.length === 0 ? ' active' : ''}`}
              onClick={() => setActiveCategories([])}
            >
              <MapPin size={15} /> Tümü <span className="count">{venues.length}</span>
            </button>
            {ALLOWED_PLACE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`venue-filter-btn${activeCategories.includes(cat) ? ' active' : ''}`}
                onClick={() => toggleCategory(cat)}
              >
                {cat} <span className="count">{counts[cat] ?? 0}</span>
              </button>
            ))}
          </div>
        )}

        <div className="kesif-layout">
          <div className="kesif-list">
            {loading && <div className="venue-map-loading">Mekanlar yükleniyor…</div>}
            {!loading && filtered.length === 0 && (
              <div className="venue-map-empty-static">Bu filtreye uygun mekan bulunamadı.</div>
            )}
            {!loading &&
              filtered.slice(0, 200).map((v) => (
                <button
                  key={v.id}
                  className={`kesif-list-row${selectedPlace?.id === v.id ? ' active' : ''}`}
                  onClick={() => selectPlace(v)}
                >
                  <VenueImage src={v.photoUrl} alt={v.name} className="kesif-list-row-img" />
                  <div className="kesif-list-row-body">
                    <span className="kesif-list-row-cat">{v.category}</span>
                    <h4>{v.name}</h4>
                    <span className="kesif-list-row-meta">
                      <MapPin size={11} /> {v.district} · {priceLabel(v.priceRange)}
                    </span>
                  </div>
                </button>
              ))}
          </div>

          <div className="venue-map-wrap">
            <div ref={containerRef} className="venue-map-canvas" />
            <button
              className="venue-map-locate-btn"
              onClick={goToUserLocation}
              disabled={locating}
              aria-label="Konumum"
              title="Konumum"
            >
              <LocateFixed size={18} />
            </button>
            {locateError && <div className="venue-map-locate-error">{locateError}</div>}
            {mapError && <div className="venue-map-locate-error">Harita hatası: {mapError}</div>}
            {!loading && filtered.length === 0 && (
              <div className="venue-map-empty">Bu filtreye uygun mekan yok.</div>
            )}
          </div>
        </div>
      </div>

      {selectedPlace && (
        <>
          <div className="place-panel-backdrop" onClick={() => setSelectedPlace(null)} />
          <div className="place-panel">
            <button className="place-panel-close" onClick={() => setSelectedPlace(null)} aria-label="Kapat">
              <X size={18} />
            </button>
            <div className="place-panel-img-wrap">
              <VenueImage src={selectedPlace.photoUrl} alt={selectedPlace.name} className="place-panel-img" />
            </div>
            <div className="place-panel-body">
              <span className="place-panel-cat">{selectedPlace.category}</span>
              <h3>{selectedPlace.name}</h3>
              <span className="place-panel-district">
                <MapPin size={12} /> {selectedPlace.district}
              </span>
              {selectedPlace.address && <p>{selectedPlace.address}</p>}
              <div className="place-panel-tags">
                <span className="venue-card-tag venue-card-rating">
                  <Star size={11} fill="currentColor" />
                  {selectedPlace.averageRating > 0
                    ? `${selectedPlace.averageRating.toFixed(1)} (${selectedPlace.reviewCount})`
                    : 'Henüz puan yok'}
                </span>
                <span className="venue-card-tag">{priceLabel(selectedPlace.priceRange)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
