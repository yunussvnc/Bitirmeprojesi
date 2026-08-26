import { normalizePlaceCategory } from './placeCategory'

export interface Venue {
  id: string
  name: string
  address: string
  district: string
  category: string
  description: string
  lat: number
  lng: number
  priceRange: number
  photoUrl: string
  photoReliable: boolean
  averageRating: number
  reviewCount: number
}

// /places/lite şemasına karşılık gelir — description ve diğer ağır alanlar
// (gallery_urls, menu_items, opening_hours_json) yok, payload'ı küçük tutmak için
// bilinçli olarak (bkz. backend/schemas.py PlaceLite).
interface BackendPlace {
  id: number
  name: string
  address: string
  city: string
  price_range: number | null
  category: string | null
  latitude: number | null
  longitude: number | null
  photo_url: string | null
  average_rating: number
  review_count: number
}

interface PaginatedPlaces {
  items: BackendPlace[]
  total: number
}

const API_ORIGIN = import.meta.env.VITE_API_URL as string
const API_URL = `${API_ORIGIN}/api/v1`

// İstanbul'un 39 ilçesi — adres string'inden eşleşme için, en spesifikten genele sıralı değil,
// eşleşme uzunluğuna göre sıralanıyor ki "Büyükçekmece" "Çekmece" gibi alt string'lere yanlış düşmesin.
const ISTANBUL_DISTRICTS = [
  'Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler',
  'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü',
  'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt',
  'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane',
  'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer',
  'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla',
  'Ümraniye', 'Üsküdar', 'Zeytinburnu',
].sort((a, b) => b.length - a.length)

function districtFromAddress(address: string, city: string): string {
  for (const d of ISTANBUL_DISTRICTS) {
    if (address.includes(d)) return d
  }
  return city || 'Diğer'
}

function resolvePhotoUrl(place: BackendPlace): string {
  if (!place.photo_url) return ''
  if (place.photo_url.startsWith('google_photo_ref:')) {
    return `${API_URL}/places/${place.id}/photo`
  }
  return place.photo_url
}

// Ham "lh3.googleusercontent.com" linkleri eski/oturum-bağımlı taramalardan kalma —
// zamanla süresi doluyor, hotlink olarak güvenilmez. Backend proxy'sinden gelenler
// (server-side API key ile stream edilir) ve diğer harici URL'ler (örn. Unsplash) güvenilir.
function isReliablePhoto(url: string): boolean {
  if (!url) return false
  return !url.includes('googleusercontent.com')
}

function toVenue(p: BackendPlace): Venue | null {
  if (p.latitude == null || p.longitude == null) return null
  const photoUrl = resolvePhotoUrl(p)
  return {
    id: String(p.id),
    name: p.name,
    address: p.address,
    district: districtFromAddress(p.address, p.city),
    category: normalizePlaceCategory(p.category) || 'Restoran',
    description: '',
    lat: p.latitude,
    lng: p.longitude,
    priceRange: p.price_range ?? 2,
    photoUrl,
    photoReliable: isReliablePhoto(photoUrl),
    averageRating: p.average_rating ?? 0,
    reviewCount: p.review_count ?? 0,
  }
}

export async function fetchAllVenues(): Promise<Venue[]> {
  const res = await fetch(`${API_URL}/places/lite?limit=6000`)
  if (!res.ok) throw new Error(`Places API ${res.status}`)
  const data: PaginatedPlaces = await res.json()
  return data.items.map(toVenue).filter((v): v is Venue => v !== null)
}
