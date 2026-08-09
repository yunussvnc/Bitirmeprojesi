import { motion } from 'framer-motion'
import { venues } from '../data/venues'
import { istanbulImages } from '../data/istanbul-images'

const DISTRICT_IMAGE: Record<string, { src: string; alt: string }> = {
  Kadıköy: istanbulImages.kadikoy,
  Beşiktaş: istanbulImages.besiktas,
  Beyoğlu: istanbulImages.galataTower,
  Fatih: istanbulImages.sultanahmet,
  Üsküdar: istanbulImages.bosphorusBridge,
  Şişli: istanbulImages.skyline,
}

const districtCounts = Object.keys(DISTRICT_IMAGE)
  .map((d) => ({ name: d, count: venues.filter((v) => v.district === d).length }))
  .filter((d) => d.count > 0)
  .sort((a, b) => b.count - a.count)

export default function DistrictDiscovery() {
  const goToDistrict = (district: string) => {
    window.dispatchEvent(new CustomEvent('district-select', { detail: district }))
    document.getElementById('kesif')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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
          {districtCounts.map((d, i) => (
            <motion.button
              key={d.name}
              className="district-card"
              onClick={() => goToDistrict(d.name)}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 6) * 0.06 }}
            >
              <img src={DISTRICT_IMAGE[d.name].src} alt={DISTRICT_IMAGE[d.name].alt} loading="lazy" />
              <div className="district-card-overlay" />
              <div className="district-card-text">
                <h3>{d.name}</h3>
                <span>{d.count} mekan</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  )
}
