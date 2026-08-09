import { motion } from 'framer-motion'
import { MapPin, ArrowRight } from 'lucide-react'
import { venues } from '../data/venues'

// Kategori çeşitliliği olan, farklı ilçelerden elle seçilmiş öne çıkan mekanlar
const featuredIds = ['v13', 'v9', 'v22', 'v52', 'v44', 'v34', 'v53', 'v27', 'v41']
const featured = featuredIds.map((id) => venues.find((v) => v.id === id)!).filter(Boolean)

function priceLabel(n: number) {
  return '₺'.repeat(n)
}

export default function PopularVenues() {
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
          <p className="section-desc">Şehrin konuşulan mekanlarından bir seçki — kaydırarak keşfedin.</p>
        </motion.div>
      </div>

      <div className="popular-scroll">
        {featured.map((v, i) => (
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
              <img src={v.photoUrl} alt={v.name} loading="lazy" className="venue-card-img" />
              <span className="venue-card-price">{priceLabel(v.priceRange)}</span>
            </div>
            <div className="venue-card-body">
              <span className="venue-card-cat">{v.category}</span>
              <h3>{v.name}</h3>
              <span className="venue-card-district"><MapPin size={12} /> {v.district}</span>
              <p>{v.description}</p>
              <div className="venue-card-tags">
                {v.features.slice(0, 3).map((f) => (
                  <span key={f} className="venue-card-tag">{f.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <span className="venue-card-cta">Keşfet <ArrowRight size={14} /></span>
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  )
}
