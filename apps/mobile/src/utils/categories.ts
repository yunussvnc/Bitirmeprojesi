export type PlaceStatusType = 'open' | 'closing_soon' | 'closed';

export const ALLOWED_PLACE_CATEGORIES = [
  'Kafe',
  'Restoran',
  'Bar',
  'Meyhane',
  'Gece Kulübü',
  'Fast Food',
  'Nargile Cafe',
] as const;

export type AllowedPlaceCategory = (typeof ALLOWED_PLACE_CATEGORIES)[number];

export const CATEGORY_KEYS = [
  { value: 'Kafe', tKey: 'categories.cafe' },
  { value: 'Restoran', tKey: 'categories.restaurant' },
  { value: 'Bar', tKey: 'categories.bar' },
  { value: 'Meyhane', tKey: 'categories.meyhane' },
  { value: 'Gece Kulübü', tKey: 'categories.nightclub' },
  { value: 'Fast Food', tKey: 'categories.fastfood' },
  { value: 'Nargile Cafe', tKey: 'categories.nargile' },
] as const;

const BLOCKED_CATEGORY_PATTERNS = [/irlanda\s*pap/i, /irlanda\s*pub/i, /irish\s*pub/i];

/** SerpAPI / legacy ham kategorileri uygulama sözlüğüne indirger. */
export function normalizePlaceCategory(category: string | undefined | null): AllowedPlaceCategory | '' {
  const raw = (category ?? '').trim();
  if (!raw) return '';

  const lower = raw
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');

  if (BLOCKED_CATEGORY_PATTERNS.some((re) => re.test(lower) || re.test(raw))) {
    return 'Bar';
  }

  const exact = ALLOWED_PLACE_CATEGORIES.find(
    (c) => c.toLowerCase() === raw.toLowerCase()
  );
  if (exact) return exact;

  if (/gece|kulup|club|night/.test(lower)) return 'Gece Kulübü';
  if (/meyhane/.test(lower)) return 'Meyhane';
  if (/nargile|hookah|shisha/.test(lower)) return 'Nargile Cafe';
  if (/fast\s*food|burger|doner|döner|kebap|pizza/.test(lower)) return 'Fast Food';
  if (/pub|bira|cocktail|kokteyl|bar|canli\s*muzik/.test(lower)) return 'Bar';
  if (/kahve|kafe|cafe|coffee|pastane|firin|fırın|brunch/.test(lower)) return 'Kafe';
  if (/restoran|restaurant|lokanta|mutfak|balik|balık|deniz|japon|italyan|vegan|müze|müzesi|galeri|turistik/.test(lower)) {
    return 'Restoran';
  }

  return 'Restoran';
}

export const STATUS_KEYS: { key: PlaceStatusType; tKey: string; color: string }[] = [
  { key: 'open', tKey: 'status.open', color: '#4CAF50' },
  { key: 'closing_soon', tKey: 'status.closing_soon', color: '#FF9800' },
  { key: 'closed', tKey: 'status.closed', color: '#F44336' },
];

export const getTranslatedCategory = (category: string | undefined | null, t: any) => {
  const normalized = normalizePlaceCategory(category);
  if (!normalized) return "";
  const found = CATEGORY_KEYS.find((c) => c.value === normalized);
  return found ? t(found.tKey, normalized) : normalized;
};
