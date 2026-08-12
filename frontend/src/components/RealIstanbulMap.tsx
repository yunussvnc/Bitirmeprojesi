import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useVenues } from '../hooks/useVenues'
import { istanbulImages } from '../data/istanbul-images'

// Bosphorus / Golden Horn view — recognizable Istanbul coastline + 3D building density
const CENTER: [number, number] = [28.9784, 41.0175]
const BASE_BEARING = -17
const BASE_PITCH = 55
const BASE_ZOOM = 13.2
const HERO_PIN_COUNT = 8

export default function RealIstanbulMap() {
  const { venues } = useVenues()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [mapReady, setMapReady] = useState(false)
  const [isMobile] = useState(() => window.matchMedia('(max-width: 768px)').matches)

  useEffect(() => {
    if (isMobile) return
    if (!containerRef.current || mapRef.current) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: CENTER,
      zoom: BASE_ZOOM,
      pitch: BASE_PITCH,
      bearing: BASE_BEARING,
      interactive: false,
      attributionControl: false,
    })
    mapRef.current = map

    map.on('load', () => {
      if (!map.getLayer('3d-buildings') && map.getSource('openmaptiles')) {
        map.addLayer({
          id: '3d-buildings',
          source: 'openmaptiles',
          'source-layer': 'building',
          type: 'fill-extrusion',
          minzoom: 12,
          paint: {
            'fill-extrusion-color': '#1c3a2e',
            'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 12],
            'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
            'fill-extrusion-opacity': 0.92,
          },
        })
      }

      setMapReady(true)
    })

    // Scroll-driven camera offset, RAF-throttled
    let scrollProgress = 0
    let ticking = false
    const computeScrollProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      scrollProgress = docHeight > 0 ? Math.min(Math.max(window.scrollY / docHeight, 0), 1) : 0
      ticking = false
    }
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(computeScrollProgress)
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    // Slow autonomous drift + scroll offset, single RAF loop
    let rafId = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = (now - start) / 1000
      const drift = reduceMotion ? 0 : Math.sin(t * 0.05) * 6
      const scrollBearing = scrollProgress * 70
      const scrollPitch = scrollProgress * 20
      const scrollZoom = scrollProgress * 1.4

      map.jumpTo({
        bearing: BASE_BEARING - drift - scrollBearing,
        pitch: Math.max(20, BASE_PITCH - scrollPitch),
        zoom: BASE_ZOOM - scrollZoom,
        center: [CENTER[0] + scrollProgress * 0.01, CENTER[1] - scrollProgress * 0.01],
      })

      rafId = requestAnimationFrame(tick)
    }
    if (!reduceMotion) {
      rafId = requestAnimationFrame(tick)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapReady || venues.length === 0) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const topRated = [...venues]
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, HERO_PIN_COUNT)

    topRated.forEach((v) => {
      const el = document.createElement('div')
      el.className = 'venue-pin'
      el.title = v.name
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([v.lng, v.lat])
        .addTo(map)
      markersRef.current.push(marker)
    })
  }, [venues, mapReady])

  if (isMobile) {
    // Mobilde ağır WebGL 3D sahne yerine gerçek statik fotoğraf — perf için (bkz. brief #13)
    return (
      <div className="istanbul-map-wrap" aria-hidden="true">
        <img src={istanbulImages.skyline.src} alt="" className="istanbul-map-canvas istanbul-map-static-img" />
        <div className="istanbul-map-overlay" />
      </div>
    )
  }

  // Masaüstünde de aynı tanınabilir gerçek fotoğraf temel katman olarak durur —
  // canlı MapLibre sahnesi (koyu stil nedeniyle görünürlüğü zayıf) üstüne başarıyla
  // yüklenirse görünür, yüklenemezse fotoğraf zaten görünür durumda kalır.
  return (
    <div className="istanbul-map-wrap" aria-hidden="true">
      <img src={istanbulImages.skyline.src} alt="" className="istanbul-map-canvas istanbul-map-static-img" />
      <div ref={containerRef} className="istanbul-map-canvas" />
      <div className="istanbul-map-overlay" />
    </div>
  )
}
