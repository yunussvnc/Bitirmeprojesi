import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Coffee, Croissant, Martini, Wine, Disc3, Fish, Pizza, Beef, Egg,
  IceCream, UtensilsCrossed, MapPin, X, Star,
} from 'lucide-react'
import { useVenues, type Venue } from '../hooks/useVenues'
import VenueImage from './VenueImage'

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

const PAGE_SIZE = 24

function priceLabel(n: number) {
  return '₺'.repeat(Math.max(1, Math.min(4, n)))
}

function VenueGridCard({ v, index }: { v: Venue; index: number }) {
  const meta = CATEGORY_META[v.category] ?? DEFAULT_META
  return (
    <motion.div
      className="venue-card"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
    >
      <div className="venue-card-img-wrap">
        <VenueImage src={v.photoUrl} alt={v.name} className="venue-card-img" />
        <span className="venue-card-price">{priceLabel(v.priceRange)}</span>
      </div>
      <div className="venue-card-body">
        <span className="venue-card-cat" style={{ color: meta.color }}>{v.category}</span>
        <h3>{v.name}</h3>
        <span className="venue-card-district"><MapPin size={12} /> {v.district}</span>
        <p>{v.description || v.address}</p>
        <div className="venue-card-tags">
          <span className="venue-card-tag venue-card-rating">
            <Star size={11} fill="currentColor" />
            {v.averageRating > 0 ? `${v.averageRating.toFixed(1)} (${v.reviewCount})` : 'Henüz puan yok'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function VenueMapSection() {
  const { venues, categories, loading } = useVenues()
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeDistrict, setActiveDistrict] = useState<string | null>(null)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const categoryOrder = categories.filter((c) => c !== 'Diğer')

  useEffect(() => {
    const onDistrictSelect = (e: Event) => {
      const district = (e as CustomEvent<string>).detail
      setActiveDistrict(district)
      setVisibleCount(PAGE_SIZE)
    }
    window.addEventListener('district-select', onDistrictSelect)
    return () => window.removeEventListener('district-select', onDistrictSelect)
  }, [])

  const filtered = venues.filter((v) => {
    const matchesCategory = activeCategory === 'all' || v.category === activeCategory
    const matchesDistrict = !activeDistrict || v.district === activeDistrict
    return matchesCategory && matchesDistrict
  })

  const visible = filtered.slice(0, visibleCount)

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
            {loading ? 'Mekanlar yükleniyor…' : `${venues.length.toLocaleString('tr-TR')} gerçek mekanı keşfedin — kategoriye göre filtreleyin, fotoğraflarla detayları görün.`}
          </p>
          {activeDistrict && (
            <button className="district-chip" onClick={() => { setActiveDistrict(null); setVisibleCount(PAGE_SIZE) }}>
              <MapPin size={13} /> {activeDistrict} <X size={13} />
            </button>
          )}
        </motion.div>

        {!loading && (
          <div className="venue-filters">
            <button
              className={`venue-filter-btn${activeCategory === 'all' ? ' active' : ''}`}
              onClick={() => { setActiveCategory('all'); setVisibleCount(PAGE_SIZE) }}
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
                  onClick={() => { setActiveCategory(cat); setVisibleCount(PAGE_SIZE) }}
                >
                  <Icon size={15} /> {cat} <span className="count">{counts[cat]}</span>
                </button>
              )
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="venue-map-empty venue-map-empty-static">Bu filtreye uygun mekan bulunamadı.</div>
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="venue-grid">
              {visible.map((v, i) => (
                <VenueGridCard key={v.id} v={v} index={i} />
              ))}
            </div>
            {visibleCount < filtered.length && (
              <div className="venue-grid-more">
                <button className="btn-ghost" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                  Daha Fazla Göster ({filtered.length - visibleCount} mekan daha)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
