import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { useVenues } from '../hooks/useVenues'
import { istanbulImages } from '../data/istanbul-images'

// Sadece gerçek fotoğrafımız olan ilçeler görselli kart olur — geri kalanı nötr kart.
const DISTRICT_IMAGE: Record<string, { src: string; alt: string }> = {
  Kadıköy: istanbulImages.kadikoy,
  Beşiktaş: istanbulImages.besiktas,
  Beyoğlu: istanbulImages.galataTower,
  Fatih: istanbulImages.sultanahmet,
  Üsküdar: istanbulImages.bosphorusBridge,
  Şişli: istanbulImages.skyline,
}

const MAX_DISTRICTS = 24

export default function DistrictDiscovery() {
  const { venues, loading } = useVenues()

  const districtCounts = Object.entries(
    venues.reduce<Record<string, number>>((acc, v) => {
      acc[v.district] = (acc[v.district] || 0) + 1
      return acc
    }, {})
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_DISTRICTS)

  const goToDistrict = (district: string) => {
    window.dispatchEvent(new CustomEvent('district-select', { detail: district }))
    document.getElementById('kesif')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading || districtCounts.length === 0) return null

  return (
    <section className="section district-section">
      <div className="container">
        <motion.div
          className="section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
        >
          <span className="section-label">İlçeler</span>
          <h2 className="section-title">Semtinden <em>Başla</em></h2>
          <p className="section-desc">Bir ilçe seç, haritada o bölgenin mekanlarını gör.</p>
        </motion.div>

        <div className="district-grid">
          {districtCounts.map((d, i) => {
            const image = DISTRICT_IMAGE[d.name]
            return (
              <motion.button
                key={d.name}
                className={`district-card${image ? '' : ' district-card-plain'}`}
                onClick={() => goToDistrict(d.name)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
              >
                {image && <img src={image.src} alt={image.alt} loading="lazy" />}
                <div className="district-card-overlay" />
                <div className="district-card-text">
                  {!image && <MapPin size={16} className="district-card-icon" />}
                  <h3>{d.name}</h3>
                  <span>{d.count.toLocaleString('tr-TR')} mekan</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
