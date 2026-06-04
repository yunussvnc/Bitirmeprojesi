/**
 * AI arama konum önceliği:
 * - Sorguda il/ilçe geçiyorsa → prompt konumu (UI seçimi devre dışı)
 * - Geçmiyorsa → seçili şehir + ilçe (İstanbul)
 */
import { AI_SEARCH_CITIES, type AiSearchCity, type AiSearchCityId } from '@/src/constants/aiCities';
import {
  getAiDistrictById,
  ISTANBUL_AI_DISTRICTS,
  type AiSearchDistrict,
  type AiSearchDistrictId,
} from '@/src/constants/aiDistricts';

export type QueryLocationMatch = {
  district: AiSearchDistrict | null;
  city: AiSearchCity | null;
};

export type ResolvedAiSearchLocation = {
  location: string;
  user_lat: number;
  user_lng: number;
  /** true → sorgudan; false → UI şehir/ilçe */
  locationFromQuery: boolean;
  district: AiSearchDistrict | null;
  city: AiSearchCity;
};

const CITY_QUERY_ALIASES: Record<AiSearchCityId, string[]> = {
  istanbul: ['istanbul', 'i̇stanbul', 'ist'],
  ankara: ['ankara'],
  izmir: ['izmir', 'i̇zmir'],
  antalya: ['antalya'],
  bursa: ['bursa'],
};

/** Uzun eşleşmeler önce (alt string yanlış pozitiflerini azaltır). */
const DISTRICT_QUERY_ENTRIES = [...ISTANBUL_AI_DISTRICTS]
  .flatMap((d) => d.aliases.map((alias) => ({ alias, district: d })))
  .sort((a, b) => b.alias.length - a.alias.length);

const CITY_QUERY_ENTRIES = AI_SEARCH_CITIES.flatMap((city) =>
  (CITY_QUERY_ALIASES[city.id] ?? [city.id]).map((alias) => ({ alias, city })),
).sort((a, b) => b.alias.length - a.alias.length);

function normalizeForMatch(text: string): string {
  return text.toLocaleLowerCase('tr-TR').normalize('NFC');
}

function containsToken(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  const re = new RegExp(`(?:^|[\\s,.;:!?'"()\\[\\]{}])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[\\s,.;:!?'"()\\[\\]{}])`, 'u');
  return re.test(` ${haystack} `);
}

/**
 * Sorguda geçen ilk ilçe / il bilgisini döndürür.
 */
export function detectLocationInQuery(query: string): QueryLocationMatch {
  const q = normalizeForMatch(query.trim());
  if (!q) return { district: null, city: null };

  let district: AiSearchDistrict | null = null;
  for (const { alias, district: d } of DISTRICT_QUERY_ENTRIES) {
    const a = normalizeForMatch(alias);
    if (containsToken(q, a)) {
      district = d;
      break;
    }
  }

  let city: AiSearchCity | null = null;
  for (const { alias, city: c } of CITY_QUERY_ENTRIES) {
    const a = normalizeForMatch(alias);
    if (containsToken(q, a)) {
      city = c;
      break;
    }
  }

  return { district, city };
}

export function resolveAiSearchLocation(params: {
  query: string;
  city: AiSearchCity;
  districtId?: AiSearchDistrictId | null;
}): ResolvedAiSearchLocation {
  const { query, city } = params;
  const uiDistrict =
    city.id === 'istanbul' ? getAiDistrictById(params.districtId ?? null) : null;

  const fromQuery = detectLocationInQuery(query);

  if (fromQuery.district || fromQuery.city) {
    const effectiveCity = fromQuery.city ?? city;
    const effectiveDistrict = fromQuery.district;
    const location = effectiveDistrict
      ? effectiveDistrict.apiLocation
      : effectiveCity.apiLocation;
    const coords = effectiveDistrict ?? effectiveCity;
    return {
      location,
      user_lat: coords.lat,
      user_lng: coords.lng,
      locationFromQuery: true,
      district: effectiveDistrict,
      city: effectiveCity,
    };
  }

  if (uiDistrict) {
    return {
      location: uiDistrict.apiLocation,
      user_lat: uiDistrict.lat,
      user_lng: uiDistrict.lng,
      locationFromQuery: false,
      district: uiDistrict,
      city,
    };
  }

  return {
    location: city.apiLocation,
    user_lat: city.lat,
    user_lng: city.lng,
    locationFromQuery: false,
    district: null,
    city,
  };
}
