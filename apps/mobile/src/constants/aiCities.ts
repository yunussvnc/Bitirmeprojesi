/** AI arama için desteklenen iller (API `location` + harita merkezi). */
export type AiSearchCityId = 'istanbul' | 'ankara' | 'izmir' | 'antalya' | 'bursa';

export type AiSearchCity = {
  id: AiSearchCityId;
  /** smart-search-v2 `location` alanı */
  apiLocation: string;
  lat: number;
  lng: number;
  /** Veri ağırlıklı şehir — diğerlerinde sonuç az/boş olabilir */
  hasFullData: boolean;
};

export const AI_SEARCH_CITIES: AiSearchCity[] = [
  { id: 'istanbul', apiLocation: 'Istanbul', lat: 41.0082, lng: 28.9784, hasFullData: true },
  { id: 'ankara', apiLocation: 'Ankara', lat: 39.9334, lng: 32.8597, hasFullData: false },
  { id: 'izmir', apiLocation: 'Izmir', lat: 38.4237, lng: 27.1428, hasFullData: false },
  { id: 'antalya', apiLocation: 'Antalya', lat: 36.8969, lng: 30.7133, hasFullData: false },
  { id: 'bursa', apiLocation: 'Bursa', lat: 40.1885, lng: 29.0610, hasFullData: false },
];

export const DEFAULT_AI_SEARCH_CITY_ID: AiSearchCityId = 'istanbul';

export function getAiCityById(id: AiSearchCityId): AiSearchCity {
  return AI_SEARCH_CITIES.find((c) => c.id === id) ?? AI_SEARCH_CITIES[0];
}
