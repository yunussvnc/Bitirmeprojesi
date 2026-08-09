import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion } from 'framer-motion'
import { Coffee, UtensilsCrossed, Martini, Wine, Disc3, Sandwich, Flame, MapPin, X } from 'lucide-react'
import { venues, type Venue } from '../data/venues'

const CATEGORY_META: Record<string, { icon: typeof Coffee; color: string }> = {
  Kafe: { icon: Coffee, color: '#d4a15a' },
  Restoran: { icon: UtensilsCrossed, color: '#f87171' },
  Bar: { icon: Martini, color: '#a78bfa' },
  Meyhane: { icon: Wine, color: '#fb923c' },
  'Gece Kulübü': { icon: Disc3, color: '#f472b6' },
  'Fast Food': { icon: Sandwich, color: '#facc15' },
  'Nargile Cafe': { icon: Flame, color: '#34d399' },
}

const categoryOrder = Object.keys(CATEGORY_META).filter((c) => venues.some((v) => v.category === c))

function priceLabel(n: number) {
  return '₺'.repeat(n)
}

function popupHTML(v: Venue) {
  const meta = CATEGORY_META[v.category]
  return `
    <div class="venue-popup">
      <img src="${v.photoUrl}" alt="${v.name}" loading="lazy" />
      <div class="venue-popup-body">
        <span class="venue-popup-cat" style="color:${meta?.color ?? 'var(--primary)'}">${v.category} · ${v.district}</span>
        <h4>${v.name}</h4>
        <p>${v.description}</p>
        <div class="venue-popup-meta">
          <span>${priceLabel(v.priceRange)}</span>
        </div>
      </div>
    </div>
  `
}

export default function VenueMapSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{ venue: Venue; marker: maplibregl.Marker; el: HTMLDivElement }[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [28.99, 41.02],
      zoom: 11.2,
      pitch: 0,
      attributionControl: false,
    })
    mapRef.current = map
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.scrollZoom.disable()

    map.on('load', () => {
      venues.forEach((v) => {
        const meta = CATEGORY_META[v.category]
        const el = document.createElement('div')
        el.className = 'venue-map-pin'
        el.style.background = meta?.color ?? 'var(--primary)'
        el.title = v.name

        const popup = new maplibregl.Popup({ offset: 14, closeButton: false, maxWidth: '260px' }).setHTML(
          popupHTML(v)
        )
        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([v.lng, v.lat])
          .setPopup(popup)
          .addTo(map)

        el.addEventListener('mouseenter', () => marker.togglePopup())
        el.addEventListener('mouseleave', () => marker.togglePopup())
        el.addEventListener('click', () => marker.togglePopup())

        markersRef.current.push({ venue: v, marker, el })
      })
    })

    return () => {
      markersRef.current.forEach((m) => m.marker.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    markersRef.current.forEach(({ venue, el }) => {
      const matchesCategory = activeCategory === 'all' || venue.category === activeCategory
      const matchesDistrict = !activeDistrict || venue.district === activeDistrict
      el.style.display = matchesCategory && matchesDistrict ? 'block' : 'none'
    })
  }, [activeCategory, activeDistrict])

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
  }, [])

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
            {venues.length} gerçek mekanı haritada keşfedin — kategoriye göre filtreleyin, üzerine gelin, detayları görün.
          </p>
          {activeDistrict && (
            <button className="district-chip" onClick={() => setActiveDistrict(null)}>
              <MapPin size={13} /> {activeDistrict} <X size={13} />
            </button>
          )}
        </motion.div>

        <div className="venue-filters">
          <button
            className={`venue-filter-btn${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <MapPin size={15} /> Tümü <span className="count">{venues.length}</span>
          </button>
          {categoryOrder.map((cat) => {
            const meta = CATEGORY_META[cat]
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

        <div className="venue-map-wrap">
          <div ref={containerRef} className="venue-map-canvas" />
        </div>
      </div>
    </section>
  )
}
