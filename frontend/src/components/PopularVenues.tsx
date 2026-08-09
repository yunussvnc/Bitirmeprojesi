import { motion } from 'framer-motion'
import { MapPin, ArrowRight, Star } from 'lucide-react'
import { useVenues } from '../hooks/useVenues'
import VenueImage from './VenueImage'

const FEATURED_COUNT = 9
const MIN_REVIEWS = 5

function priceLabel(n: number) {
  return '₺'.repeat(Math.max(1, Math.min(4, n)))
}

export default function PopularVenues() {
  const { venues, loading } = useVenues()

  const featured = [...venues]
    .filter((v) => v.photoUrl && v.reviewCount >= MIN_REVIEWS)
    .sort((a, b) => {
      if (a.photoReliable !== b.photoReliable) return a.photoReliable ? -1 : 1
      return b.averageRating - a.averageRating || b.reviewCount - a.reviewCount
    })
    .slice(0, FEATURED_COUNT)

  return (
    <section className="section popular-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
        >
          <span className="section-label">Popüler</span>
          <h2 className="section-title">Bugün <em>Ne Yesem?</em></h2>
          <p className="section-desc">Şehrin en yüksek puanlı mekanlarından bir seçki — kaydırarak keşfedin.</p>
        </motion.div>
      </div>

      <div className="popular-scroll">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="venue-card venue-card-skeleton" aria-hidden="true">
              <div className="venue-card-img-wrap skeleton-block" />
              <div className="venue-card-body">
                <div className="skeleton-block skeleton-line" style={{ width: '40%' }} />
                <div className="skeleton-block skeleton-line" style={{ width: '80%', height: '1.2rem' }} />
                <div className="skeleton-block skeleton-line" style={{ width: '60%' }} />
              </div>
            </div>
          ))}

        {!loading &&
          featured.map((v, i) => (
            <motion.a
              key={v.id}
              href="#kesif"
              className="venue-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.08 }}
            >
              <div className="venue-card-img-wrap">
                <VenueImage src={v.photoUrl} alt={v.name} className="venue-card-img" />
                <span className="venue-card-price">{priceLabel(v.priceRange)}</span>
              </div>
              <div className="venue-card-body">
                <span className="venue-card-cat">{v.category}</span>
                <h3>{v.name}</h3>
                <span className="venue-card-district"><MapPin size={12} /> {v.district}</span>
                <p>{v.description || v.address}</p>
                <div className="venue-card-tags">
                  <span className="venue-card-tag venue-card-rating">
                    <Star size={11} fill="currentColor" /> {v.averageRating.toFixed(1)} ({v.reviewCount})
                  </span>
                </div>
                <span className="venue-card-cta">Keşfet <ArrowRight size={14} /></span>
              </div>
            </motion.a>
          ))}
      </div>
    </section>
  )
}
