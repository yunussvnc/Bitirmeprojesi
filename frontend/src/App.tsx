import { useEffect, useRef, useState, Suspense, lazy } from 'react'
import { motion, useScroll, useTransform, type Variants } from 'framer-motion'
import {
  Users, MessageCircle, Brain,
  Heart, ArrowRight, Zap, Coffee,
  ChevronRight, Menu, Compass, Camera, Bell, Star, Bookmark, Route
} from 'lucide-react'
import PopularVenues from './components/PopularVenues'
import DistrictDiscovery from './components/DistrictDiscovery'
import { useVenues } from './hooks/useVenues'
import './index.css'

// three.js / maplibre-gl ağır — ilk render'ı bekletmesin diye ayrı chunk'a bölünüyor
const ParticleBackground = lazy(() => import('./components/ParticleBackground'))
const RealIstanbulMap = lazy(() => import('./components/RealIstanbulMap'))
const VenueMapSection = lazy(() => import('./components/VenueMapSection'))

const fade: Variants = { hidden:{opacity:0,y:40}, visible:{opacity:1,y:0,transition:{duration:.7,ease:[.25,.46,.45,.94]}} }
const stagger: Variants = { hidden:{opacity:0}, visible:{opacity:1,transition:{staggerChildren:.12}} }
const scaleIn: Variants = { hidden:{opacity:0,scale:.88}, visible:{opacity:1,scale:1,transition:{duration:.8,ease:[.25,.46,.45,.94]}} }

/*
 * Bento Grid — 12 column magazine layout
 * Row 1: [4] [8-featured]
 * Row 2: [6] [6]
 * Row 3: [8-featured] [4]
 * Row 4: [4] [4] [4]
 */
const features = [
  { icon:<Compass size={22}/>,  col:'col-4',  featured:false, title:'Akıllı Harita Keşfi',         desc:'Çevrenizdeki mekanları interaktif harita üzerinde keşfedin, mesafe ve kategoriye göre filtreleyin.' },
  { icon:<Brain size={22}/>,    col:'col-8',  featured:true,  title:'AI Öneri Motoru',             desc:'Yapay zeka geçmiş tercihlerinizi analiz eder, ruh halinize göre kişiselleştirilmiş öneriler sunar. "Bu akşam nereye gitsem?" sorusuna akıllı yanıtlar alın.' },
  { icon:<Users size={22}/>,    col:'col-6',  featured:false, title:'Sosyal Eşleşme',              desc:'Aynı mekan zevkine sahip insanları keşfedin, uyumluluk skoru ile doğru kişilerle tanışın.' },
  { icon:<MessageCircle size={22}/>, col:'col-6', featured:false, title:'Gerçek Zamanlı Mesajlaşma', desc:'WebSocket destekli anlık sohbet, eşleştiğiniz kişilerle hızlıca iletişime geçin.' },
  { icon:<Camera size={22}/>,   col:'col-8',  featured:true,  title:'Hikaye Paylaşımı',            desc:'24 saatlik mekan hikayeleri oluşturun, fotoğraf ve video ile deneyimlerinizi paylaşın. Arkadaşlarınızın keşiflerini canlı olarak takip edin.' },
  { icon:<Route size={22}/>,    col:'col-4',  featured:false, title:'Rota Planlama',               desc:'Birden fazla mekanı rota olarak planlayın, arkadaşlarınızla günlük gezi rotanızı oluşturun.' },
  { icon:<Star size={22}/>,     col:'col-4',  featured:false, title:'Zengin İncelemeler',           desc:'Fotoğraflı, puanlı ve detaylı yorumlar yazın, topluluk değerlendirmelerini keşfedin.' },
  { icon:<Bell size={22}/>,     col:'col-4',  featured:false, title:'Akıllı Bildirimler',           desc:'Eşleşmeler, beğeniler, yorumlar ve mekan önerileri için anlık push bildirimler.' },
  { icon:<Bookmark size={22}/>, col:'col-4',  featured:false, title:'Koleksiyon Kayıt',             desc:'Beğendiğiniz mekanları kaydedin, kişisel listeler oluşturun ve arkadaşlarınızla paylaşın.' },
]

export default function App() {
  const navRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const heroImgY = useTransform(scrollY, [0, 800], [0, -80])
  const [loading, setLoading] = useState(true)
  const { venues, districts, categories, loading: venuesLoading } = useVenues()

  useEffect(() => {
    const handle = () => navRef.current?.classList.toggle('scrolled', window.scrollY > 60)
    window.addEventListener('scroll', handle)
    return () => window.removeEventListener('scroll', handle)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <div className={`loading-splash${loading ? '' : ' fade-out'}`} aria-hidden={!loading}>
        <span className="logo">As<em>Em</em>Os</span>
        <span className="status">İstanbul keşfediliyor<span className="dot" style={{ display: 'inline-block', marginLeft: 6 }} /></span>
      </div>
      <Suspense fallback={null}>
        <RealIstanbulMap />
        <ParticleBackground />
      </Suspense>

      {/* NAV */}
      <nav className="nav" ref={navRef}>
        <div className="container nav-inner">
          <a href="#" className="logo">As<em>Em</em>Os</a>
          <ul className="nav-links">
            <li><a href="#ozellikler">Özellikler</a></li>
            <li><a href="#kesif">Keşif</a></li>
            <li><a href="#eslesme">Eşleşme</a></li>
            <li><a href="#ai">Yapay Zeka</a></li>
          </ul>
          <button className="nav-cta">Uygulamayı İndir</button>
          <button className="menu-btn"><Menu size={24}/></button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fade} className="hero-badge">
              <span className="pulse"/> İstanbul'u Keşfet
            </motion.div>
            <motion.h1 variants={fade}>
              İstanbul'un{' '}
              <span className="gradient">Lezzetlerini ve Mekanlarını Keşfet</span>
            </motion.h1>
            <motion.p variants={fade} className="hero-sub">
              Şehrin en iyi kafe, restoran ve mekanlarını haritada incele, yapay zeka destekli
              kişisel önerilerle bir sonraki durağını bul — İstanbul'u yeniden keşfet.
            </motion.p>
            <motion.div variants={fade} className="hero-actions">
              <a href="#kesif" className="btn-glow">Mekanları Keşfet <ArrowRight size={18}/></a>
              <button className="btn-ghost">Uygulamayı İndir <ChevronRight size={18}/></button>
            </motion.div>
            <motion.div variants={fade} className="hero-stats">
              <div className="hero-stat"><h3>{venuesLoading ? '…' : venues.length.toLocaleString('tr-TR')}</h3><p>Gerçek Mekan</p></div>
              <div className="hero-stat"><h3>{venuesLoading ? '…' : districts.length}</h3><p>İlçe</p></div>
              <div className="hero-stat"><h3>AI</h3><p>Akıllı Öneriler</p></div>
            </motion.div>
          </motion.div>
          <motion.div className="hero-img-wrap" style={{y:heroImgY}} initial={{opacity:0,scale:.85}} animate={{opacity:1,scale:1}} transition={{duration:1,delay:.3,ease:[.25,.46,.45,.94]}}>
            <img src="/hero-mockup.png" alt="AsEmOs Uygulama" className="hero-img"/>
          </motion.div>
        </div>
      </section>

      {/* FEATURES — BENTO GRID */}
      <section id="ozellikler" className="section section-dark">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{once:true,amount:.3}} variants={fade}>
            <span className="section-label">Özellikler</span>
            <h2 className="section-title">Tek Uygulamada <em>Her Şey</em></h2>
            <p className="section-desc">Mekan keşfinden yapay zeka önerilerine, sosyal eşleşmeden gerçek zamanlı mesajlaşmaya kadar ihtiyacınız olan her şey tek bir yerde.</p>
          </motion.div>
          <motion.div className="bento-grid" initial="hidden" whileInView="visible" viewport={{once:true,amount:.1}} variants={stagger}>
            {features.map((f,i) => (
              <motion.div key={i} className={`bento-card ${f.col}${f.featured?' featured':''}`} variants={fade}>
                <div className="glow-line"/>
                <div className="bento-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* INTERACTIVE VENUE MAP */}
      <Suspense fallback={<div className="venue-map-loading">Harita yükleniyor…</div>}>
        <VenueMapSection />
      </Suspense>

      {/* POPULAR VENUES */}
      <PopularVenues />

      {/* DISTRICT DISCOVERY */}
      <DistrictDiscovery />

      {/* SHOWCASE: MATCHING */}
      <section id="eslesme" className="section section-dark">
        <div className="container">
          <motion.div className="showcase reverse" initial="hidden" whileInView="visible" viewport={{once:true,amount:.25}} variants={stagger}>
            <motion.div className="showcase-content" variants={stagger}>
              <motion.h2 variants={fade}>Zevklerin <em>Eşleşsin</em></motion.h2>
              <motion.p variants={fade}>Aynı mekanları seven, aynı atmosferi arayan insanları keşfedin. Uyumluluk algoritması ortak ilgi alanlarınızı analiz eder ve sizi doğru kişilerle buluşturur.</motion.p>
              <motion.ul className="check-list" variants={stagger}>
                {[
                  {t:'Uyumluluk Skoru',d:'Ortak ilgi alanlarına dayalı yüzdelik eşleşme.'},
                  {t:'Anlık Mesajlaşma',d:'Eşleştikten sonra WebSocket destekli canlı sohbet.'},
                  {t:'Ortak Mekan Planı',d:'Birlikte gidilecek mekanları birlikte planlayın.'},
                ].map((item,i)=>(
                  <motion.li key={i} className="check-item" variants={fade}>
                    <span className="check-dot"><Heart size={13}/></span>
                    <div><h4>{item.t}</h4><p>{item.d}</p></div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
            <motion.div className="showcase-img-wrap" variants={scaleIn}>
              <img src="/feature-match.png" alt="Sosyal Eşleşme" className="showcase-img"/>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SHOWCASE: SOCIAL FEED */}
      <section className="section">
        <div className="container">
          <motion.div className="showcase" initial="hidden" whileInView="visible" viewport={{once:true,amount:.25}} variants={stagger}>
            <motion.div className="showcase-img-wrap" variants={scaleIn}>
              <img src="/feature-social.png" alt="Sosyal Akış" className="showcase-img"/>
            </motion.div>
            <motion.div className="showcase-content" variants={stagger}>
              <motion.h2 variants={fade}>Sosyal <em>Deneyim</em></motion.h2>
              <motion.p variants={fade}>Mekan deneyimlerinizi fotoğraflarla paylaşın, hikayeler oluşturun ve arkadaşlarınızın keşiflerini takip edin.</motion.p>
              <motion.ul className="check-list" variants={stagger}>
                {[
                  {t:'24 Saat Hikayeler',d:'Mekan hikayelerinizi paylaşın, başkalarının deneyimlerini izleyin.'},
                  {t:'Zengin İnceleme Sistemi',d:'Fotoğraflı, puanlı ve detaylı mekan yorumları.'},
                  {t:'Push Bildirimler',d:'Beğeniler, yorumlar ve eşleşmeler için anlık bildirimler.'},
                ].map((item,i)=>(
                  <motion.li key={i} className="check-item" variants={fade}>
                    <span className="check-dot"><Zap size={13}/></span>
                    <div><h4>{item.t}</h4><p>{item.d}</p></div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SHOWCASE: AI */}
      <section id="ai" className="section section-dark">
        <div className="container">
          <motion.div className="showcase reverse" initial="hidden" whileInView="visible" viewport={{once:true,amount:.25}} variants={stagger}>
            <motion.div className="showcase-content" variants={stagger}>
              <motion.h2 variants={fade}>Yapay Zeka <em>Asistanınız</em></motion.h2>
              <motion.p variants={fade}>"Bu akşam nereye gitsem?" diye düşünmeyin. AI asistanımız profilinizi, ruh halinizi ve geçmiş deneyimlerinizi analiz ederek size özel öneriler sunar.</motion.p>
              <motion.ul className="check-list" variants={stagger}>
                {[
                  {t:'Doğal Dil İle Arama',d:'AI ile sohbet eder gibi mekan arayın.'},
                  {t:'Ruh Hali Analizi',d:'Anınıza uygun mekan önerisi, atmosfer eşleştirme.'},
                  {t:'Kişisel Profil Analizi',d:'Zevklerinizi öğrenen ve gelişen akıllı öneri motoru.'},
                ].map((item,i)=>(
                  <motion.li key={i} className="check-item" variants={fade}>
                    <span className="check-dot"><Coffee size={13}/></span>
                    <div><h4>{item.t}</h4><p>{item.d}</p></div>
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
            <motion.div className="showcase-img-wrap" variants={scaleIn}>
              <img src="/feature-ai.png" alt="AI Öneri" className="showcase-img"/>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* NUMBERS */}
      <section className="section">
        <div className="container">
          <motion.div className="section-header" initial="hidden" whileInView="visible" viewport={{once:true}} variants={fade}>
            <span className="section-label">Rakamlarla</span>
            <h2 className="section-title">AsEmOs <em>Etkisi</em></h2>
          </motion.div>
          <motion.div className="num-grid" initial="hidden" whileInView="visible" viewport={{once:true,amount:.2}} variants={stagger}>
            {[
              {n:venuesLoading?'…':venues.length.toLocaleString('tr-TR'),l:'Gerçek Mekan'},{n:venuesLoading?'…':String(districts.length),l:'İlçe'},
              {n:venuesLoading?'…':String(categories.length),l:'Kategori'},{n:'7/24',l:'AI Öneri Motoru'},
            ].map((s,i)=>(
              <motion.div key={i} className="num-card" variants={fade}>
                <h3>{s.n}</h3><p>{s.l}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <motion.div className="cta-box" initial="hidden" whileInView="visible" viewport={{once:true}} variants={scaleIn}>
            <h2>İstanbul'un <em>Bir Sonraki Lezzetini</em> Keşfet</h2>
            <p>AsEmOs'u indir, yapay zeka destekli mekan önerilerini al ve aynı zevklere sahip insanlarla tanış.</p>
            <a href="#kesif" className="btn-glow">Hemen Başla <ArrowRight size={18}/></a>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container footer-inner">
          <p className="footer-copy">&copy; {new Date().getFullYear()} AsEmOs — Akıllı Sosyalleşme ve Eğlenceli Mekan Öneri Sistemi</p>
          <div className="footer-links">
            <a href="#">Gizlilik</a>
            <a href="#">Kullanım Şartları</a>
            <a href="#">İletişim</a>
          </div>
        </div>
      </footer>
    </>
  )
}
