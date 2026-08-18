import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource } from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion } from 'framer-motion'
import {
  Coffee, Croissant, Martini, Wine, Disc3, Fish, Pizza, Beef, Egg,
  IceCream, UtensilsCrossed, MapPin, X,
} from 'lucide-react'
import { useVenues, type Venue } from '../hooks/useVenues'
import { getAllowedVenueImageUrl } from '../lib/safeVenueImageUrl'

const CATEGORY_META: Record<string, { icon: typeof Coffee; color: string }> = {
  Kafe: { icon: Coffee, color: '#d4a15a' },
  Fırın: { icon: Croissant, color: '#e0a458' },
  Bar: { icon: Martini, color: '#a78bfa' },
  'Gece Kulübü': { icon: Disc3, color: '#f472b6' },
  Meyhane: { icon: Wine, color: '#fb923c' },
  'Deniz Ürünleri': { icon: Fish, color: '#60a5fa' },
  Pizza: { icon: Pizza, color: '#fb7185' },
  Burger: { icon: Beef, color: '#f97316' },
  Suşi: { icon: Fish, color: '#34d399' },
  Steakhouse: { icon: Beef, color: '#dc2626' },
  Kahvaltı: { icon: Egg, color: '#fbbf24' },
  Tatlıcı: { icon: IceCream, color: '#f9a8d4' },
  'Türk Mutfağı': { icon: UtensilsCrossed, color: '#ef4444' },
  Restoran: { icon: UtensilsCrossed, color: '#f87171' },
}
const DEFAULT_META = { icon: MapPin, color: '#10b981' }

function priceLabel(n: number) {
  return '₺'.repeat(Math.max(1, Math.min(4, n)))
}

function createPopupContent(v: Venue): HTMLElement {
  const meta = CATEGORY_META[v.category] ?? DEFAULT_META
  const rating = v.averageRating > 0 ? `★ ${v.averageRating.toFixed(1)} (${v.reviewCount})` : 'Henüz puan yok'

  const popup = document.createElement('div')
  popup.className = 'venue-popup'

  const imageUrl = getAllowedVenueImageUrl(v.photoUrl, window.location.origin)
  if (imageUrl) {
    const image = document.createElement('img')
    image.src = imageUrl
    image.alt = v.name
    image.loading = 'lazy'
    image.addEventListener('error', () => image.remove(), { once: true })
    popup.append(image)
  }

  const body = document.createElement('div')
  body.className = 'venue-popup-body'

  const category = document.createElement('span')
  category.className = 'venue-popup-cat'
  category.style.color = meta.color
  category.textContent = `${v.category} · ${v.district}`

  const title = document.createElement('h4')
  title.textContent = v.name

  const description = document.createElement('p')
  description.textContent = v.description || v.address

  const metadata = document.createElement('div')
  metadata.className = 'venue-popup-meta'
  const price = document.createElement('span')
  price.textContent = priceLabel(v.priceRange)
  const ratingText = document.createElement('span')
  ratingText.textContent = rating
  metadata.append(price, ratingText)

  body.append(category, title, description, metadata)
  popup.append(body)
  return popup
}

function toGeoJSON(venues: Venue[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: venues.map((v) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [v.lng, v.lat] },
      properties: {
        id: v.id,
        category: v.category,
        color: (CATEGORY_META[v.category] ?? DEFAULT_META).color,
      },
    })),
  }
}

export default function VenueMapSection() {
  const { venues, districts, categories, loading } = useVenues()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const venuesByIdRef = useRef<Map<string, Venue>>(new Map())
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null)

  const categoryOrder = categories.filter((c) => c !== 'Diğer')

  // Harita — bir kez kurulur
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [28.99, 41.02],
      zoom: 10.4,
      pitch: 0,
      attributionControl: false,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.scrollZoom.disable()

    map.on('load', () => {
      map.addSource('venues', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 45,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'venues',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(16,185,129,0.85)',
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(2,2,4,0.8)',
          'circle-radius': ['step', ['get', 'point_count'], 16, 25, 20, 100, 26, 500, 34],
        },
      })
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'venues',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#020204' },
      })
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'venues',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(2,2,4,0.8)',
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

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features?.[0]
        const id = feature?.properties?.id
        if (!id) return
        const venue = venuesByIdRef.current.get(String(id))
        if (!venue) return
        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup({ offset: 10, maxWidth: '260px' })
          .setLngLat([venue.lng, venue.lat])
          .setDOMContent(createPopupContent(venue))
          .addTo(map)
      })

      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''))
      map.on('mouseenter', 'unclustered-point', () => (map.getCanvas().style.cursor = 'pointer'))
      map.on('mouseleave', 'unclustered-point', () => (map.getCanvas().style.cursor = ''))

      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Veri geldiğinde / filtre değiştiğinde source'u güncelle
  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady) return

    venuesByIdRef.current = new Map(venues.map((v) => [v.id, v]))

    const filtered = venues.filter((v) => {
      const matchesCategory = activeCategory === 'all' || v.category === activeCategory
      const matchesDistrict = !activeDistrict || v.district === activeDistrict
      return matchesCategory && matchesDistrict
    })

    const source = map.getSource('venues') as GeoJSONSource | undefined
    source?.setData(toGeoJSON(filtered))
  }, [venues, activeCategory, activeDistrict, mapReady])

  useEffect(() => {
    const onDistrictSelect = (e: Event) => {
      const district = (e as CustomEvent<string>).detail
      setActiveDistrict(district)
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
        { padding: 80, duration: 1200, maxZoom: 15 }
      )
    }
    window.addEventListener('district-select', onDistrictSelect)
    return () => window.removeEventListener('district-select', onDistrictSelect)
  }, [venues])

  const counts = categoryOrder.reduce<Record<string, number>>((acc, c) => {
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
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
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
              className={`venue-filter-btn${activeCategory === 'all' ? ' active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              <MapPin size={15} /> Tümü <span className="count">{venues.length}</span>
            </button>
            {categoryOrder.map((cat) => {
              const meta = CATEGORY_META[cat] ?? DEFAULT_META
              const Icon = meta.icon
              return (
                <button
                  key={cat}
                  className={`venue-filter-btn${activeCategory === cat ? ' active' : ''}`}
                  style={activeCategory === cat ? { borderColor: meta.color, color: meta.color } : undefined}
                  onClick={() => setActiveCategory(cat)}
                >
                  <Icon size={15} /> {cat} <span className="count">{counts[cat]}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className="venue-map-wrap">
          <div ref={containerRef} className="venue-map-canvas" />
          {districts.length === 0 && !loading && (
            <div className="venue-map-empty">Mekan verisi yüklenemedi.</div>
          )}
        </div>
      </div>
    </section>
  )
}
