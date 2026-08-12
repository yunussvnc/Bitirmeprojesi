import { istanbulImages } from '../data/istanbul-images'

// Canlı MapLibre 3D sahnesi kaldırıldı — yavaş açılıyordu ve masaüstünde
// güvenilir şekilde görünür bir sonuç üretmiyordu. Tanınabilir gerçek
// İstanbul fotoğrafı, hem mobil hem masaüstünde tutarlı ve hızlı.
export default function RealIstanbulMap() {
  return (
    <div className="istanbul-map-wrap" aria-hidden="true">
      <img src={istanbulImages.skyline.src} alt="" className="istanbul-map-canvas istanbul-map-static-img" />
      <div className="istanbul-map-overlay" />
    </div>
  )
}
