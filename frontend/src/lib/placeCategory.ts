/**
 * Mekan kategori taksonomisi ve normalizasyonu.
 * apps/mobile/src/utils/categories.ts ile birebir aynı mantık — web/mobil parite.
 */

export const ALLOWED_PLACE_CATEGORIES = [
  'Kafe',
  'Restoran',
  'Bar',
  'Meyhane',
  'Gece Kulübü',
  'Fast Food',
  'Nargile Cafe',
] as const

export type AllowedPlaceCategory = (typeof ALLOWED_PLACE_CATEGORIES)[number]

const BLOCKED_CATEGORY_PATTERNS = [/irlanda\s*pap/i, /irlanda\s*pub/i, /irish\s*pub/i]

/** SerpAPI / legacy ham kategorileri uygulama sözlüğüne indirger. */
export function normalizePlaceCategory(category: string | undefined | null): AllowedPlaceCategory | '' {
  const raw = (category ?? '').trim()
  if (!raw) return ''

  const lower = raw
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')

  if (BLOCKED_CATEGORY_PATTERNS.some((re) => re.test(lower) || re.test(raw))) {
    return 'Bar'
  }

  const exact = ALLOWED_PLACE_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase())
  if (exact) return exact

  if (/gece|kulup|club|night/.test(lower)) return 'Gece Kulübü'
  if (/meyhane/.test(lower)) return 'Meyhane'
  if (/nargile|hookah|shisha/.test(lower)) return 'Nargile Cafe'
  if (/fast\s*food|burger|doner|döner|kebap|pizza/.test(lower)) return 'Fast Food'
  if (/pub|bira|cocktail|kokteyl|bar|canli\s*muzik/.test(lower)) return 'Bar'
  if (/kahve|kafe|cafe|coffee|pastane|firin|fırın|brunch/.test(lower)) return 'Kafe'
  if (/restoran|restaurant|lokanta|mutfak|balik|balık|deniz|japon|italyan|vegan|müze|müzesi|galeri|turistik/.test(lower)) {
    return 'Restoran'
  }

  return 'Restoran'
}

export const STATUS_KEYS: { key: 'open' | 'closing_soon' | 'closed'; label: string; color: string }[] = [
  { key: 'open', label: 'Açık', color: '#4CAF50' },
  { key: 'closing_soon', label: 'Kapanıyor', color: '#FF9800' },
  { key: 'closed', label: 'Kapalı', color: '#F44336' },
]
