import nezahatNurettinEgeKosku from '../assets/venues/nezahat-nurettin-ege-kosku.jpg'
import sushicoZorluCenter from '../assets/venues/sushico-zorlu-center.jpg'
import limonluBahce from '../assets/venues/limonlu-bahce.jpg'
import geceDonercisiKavacik from '../assets/venues/gece-donercisi-kavacik.jpg'
import uweCoffeeRoasters from '../assets/venues/uwe-coffee-roasters.jpg'
import merciBaku from '../assets/venues/merci-baku.jpg'
import pizzalazzaBesiktas from '../assets/venues/pizzalazza-besiktas.jpg'
import masterartBurger from '../assets/venues/masterart-burger.jpg'
import besBicakSteak from '../assets/venues/bes-bicak-steak.jpg'
import sarmasikCoffeeCo from '../assets/venues/sarmasik-coffee-co.jpg'
import pizzaWichBesiktas from '../assets/venues/pizza-wich-besiktas.jpg'
import isokyoZorluCenter from '../assets/venues/isokyo-zorlu-center.webp'
import durumcuEsnafPasabahce from '../assets/venues/durumcu-esnaf-pasabahce.jpg'
import coffeeBreakCocoBambu from '../assets/venues/coffee-break-coco-bambu.jpg'
import koskaBeylikduzu from '../assets/venues/koska-beylikduzu.jpg'
import kebabimBeylikduzu from '../assets/venues/kebabim-beylikduzu.jpg'
import besiktastaBirMeyhane from '../assets/venues/besiktasta-bir-meyhane.jpg'
import yuceFirin from '../assets/venues/yuce-firin.jpg'
import pizzalazzaMigros from '../assets/venues/pizzalazza-migros.jpg'
import haciUstaKebapHouse from '../assets/venues/haci-usta-kebap-house.jpg'
import pidemideBeylikduzu from '../assets/venues/pidemide-beylikduzu.jpg'
import pizzaKremaAkaretler from '../assets/venues/pizza-krema-akaretler.jpeg'
import babelOcakbasiNevizade from '../assets/venues/babel-ocakbasi-nevizade.jpg'
import senfoniRestoranCafe from '../assets/venues/senfoni-restoran-cafe.jpg'
import ativaCoffee from '../assets/venues/ativa-coffee.jpg'
import simirnaSogus from '../assets/venues/simirna-sogus.jpg'
import pasamRomaDondurma from '../assets/venues/pasam-roma-dondurma.jpg'
import alaRasiRestaurant from '../assets/venues/ala-rasi-restaurant.jpg'
import anzorMeatDoner from '../assets/venues/anzor-meat-doner.jpg'
import citirOcakbasi from '../assets/venues/citir-ocakbasi.jpg'
import hisarBuselik from '../assets/venues/hisar-buselik.jpg'
import ransserieCafeHouse from '../assets/venues/ransserie-cafe-house.jpg'
import besiktasCitirPide from '../assets/venues/besiktas-citir-pide.jpeg'
import waltersCoffeeRoastery from '../assets/venues/walters-coffee-roastery.jpg'
import booksCoffeeYeldegirmeni from '../assets/venues/books-coffee-yeldegirmeni.jpg'
import meetLabCoffee from '../assets/venues/meet-lab-coffee.jpg'
import tilkiCoffee from '../assets/venues/tilki-coffee.jpg'
import elaneCoffeeShop from '../assets/venues/elane-coffee-shop.jpg'
import lesCalinsCompagnieDeCafe from '../assets/venues/les-calins-compagnie-de-cafe.jpg'
import sevenSpecialtyCoffee from '../assets/venues/seven-specialty-coffee.jpg'
import vCoffeeKadikoy from '../assets/venues/v-coffee-kadikoy.webp'
import theCoffeeFactoryKadikoy from '../assets/venues/the-coffee-factory-kadikoy.jpg'
import storyCoffeeRoastery from '../assets/venues/story-coffee-roastery.jpg'

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

export const DEFAULT_VENUE_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop'
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Kafe: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&auto=format&fit=crop',
  Restoran: DEFAULT_VENUE_IMAGE,
  Bar: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&auto=format&fit=crop',
  Meyhane: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=1200&auto=format&fit=crop',
}
const PLACE_IMAGE_OVERRIDES: Record<string, string> = {
  '7289': sushicoZorluCenter,
  '7288': limonluBahce,
  '7287': geceDonercisiKavacik,
  '7285': uweCoffeeRoasters,
  '7284': merciBaku,
  '7282': pizzalazzaBesiktas,
  '7281': masterartBurger,
  '7280': besBicakSteak,
  '7279': sarmasikCoffeeCo,
  '7278': pizzaWichBesiktas,
  '7277': isokyoZorluCenter,
  '7276': durumcuEsnafPasabahce,
  '7275': coffeeBreakCocoBambu,
  '7274': koskaBeylikduzu,
  '7273': kebabimBeylikduzu,
  '7272': besiktastaBirMeyhane,
  '7270': yuceFirin,
  '7269': pizzalazzaMigros,
  '7268': haciUstaKebapHouse,
  '7267': pidemideBeylikduzu,
  '7266': pizzaKremaAkaretler,
  '7265': babelOcakbasiNevizade,
  '7264': senfoniRestoranCafe,
  '7262': ativaCoffee,
  '7261': simirnaSogus,
  '7260': pasamRomaDondurma,
  '7256': alaRasiRestaurant,
  '7255': anzorMeatDoner,
  '7253': citirOcakbasi,
  '7252': hisarBuselik,
  '7251': ransserieCafeHouse,
  '7249': besiktasCitirPide,
  '854': nezahatNurettinEgeKosku,
  '639': booksCoffeeYeldegirmeni,
  '638': waltersCoffeeRoastery,
  '644': meetLabCoffee,
  '648': tilkiCoffee,
  '652': elaneCoffeeShop,
  '653': lesCalinsCompagnieDeCafe,
  '657': sevenSpecialtyCoffee,
  '658': vCoffeeKadikoy,
  '659': theCoffeeFactoryKadikoy,
  '660': storyCoffeeRoastery,
}

export function getFallbackVenueImage(category: string): string {
  return CATEGORY_FALLBACK_IMAGES[category] ?? DEFAULT_VENUE_IMAGE
}

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
  const override = PLACE_IMAGE_OVERRIDES[String(place.id)]
  if (override) return override

  if (!place.photo_url) {
    return getFallbackVenueImage(place.category ?? '')
  }
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
  return !url.includes('googleusercontent.com') && !url.includes('/places/')
}

function toVenue(p: BackendPlace): Venue | null {
  if (p.latitude == null || p.longitude == null) return null
  const photoUrl = resolvePhotoUrl(p)
  return {
    id: String(p.id),
    name: p.name,
    address: p.address,
    district: districtFromAddress(p.address, p.city),
    category: p.category || 'Diğer',
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
