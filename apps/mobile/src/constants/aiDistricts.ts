/**
 * İstanbul ilçeleri — AI arama UI + sorgu içi konum algılama.
 * `aliases` backend `parse_natural_query` district_map ile uyumludur.
 */
export type AiSearchDistrictId = string;

export type AiSearchDistrict = {
  id: AiSearchDistrictId;
  /** API `location` / SerpAPI bölge adı */
  apiLocation: string;
  lat: number;
  lng: number;
  /** Sorguda aranacak küçük harf varyantlar */
  aliases: string[];
};

/** Tüm ilçe — şehir merkezi ile arama */
export const AI_SEARCH_DISTRICT_ALL_ID = '' as const;

export const ISTANBUL_AI_DISTRICTS: AiSearchDistrict[] = [
  { id: 'adalar', apiLocation: 'Adalar', lat: 40.874, lng: 29.094, aliases: ['adalar'] },
  { id: 'arnavutkoy', apiLocation: 'Arnavutköy', lat: 41.185, lng: 28.740, aliases: ['arnavutköy', 'arnavutkoy'] },
  { id: 'atasehir', apiLocation: 'Ataşehir', lat: 40.983, lng: 29.124, aliases: ['ataşehir', 'atasehir'] },
  { id: 'avcilar', apiLocation: 'Avcılar', lat: 41.015, lng: 28.720, aliases: ['avcılar', 'avcilar'] },
  { id: 'bagcilar', apiLocation: 'Bağcılar', lat: 41.039, lng: 28.857, aliases: ['bağcılar', 'bagcilar'] },
  { id: 'bahcelievler', apiLocation: 'Bahçelievler', lat: 41.003, lng: 28.865, aliases: ['bahçelievler', 'bahcelievler'] },
  { id: 'bakirkoy', apiLocation: 'Bakırköy', lat: 40.978, lng: 28.874, aliases: ['bakırköy', 'bakirkoy'] },
  { id: 'basaksehir', apiLocation: 'Başakşehir', lat: 41.093, lng: 28.802, aliases: ['başakşehir', 'basaksehir'] },
  { id: 'bayrampasa', apiLocation: 'Bayrampaşa', lat: 41.039, lng: 28.914, aliases: ['bayrampaşa', 'bayrampasa'] },
  { id: 'besiktas', apiLocation: 'Beşiktaş', lat: 41.042, lng: 29.007, aliases: ['beşiktaş', 'besiktas'] },
  { id: 'beykoz', apiLocation: 'Beykoz', lat: 41.132, lng: 29.095, aliases: ['beykoz'] },
  { id: 'beylikduzu', apiLocation: 'Beylikdüzü', lat: 41.002, lng: 28.642, aliases: ['beylikdüzü', 'beylikduzu'] },
  { id: 'beyoglu', apiLocation: 'Beyoğlu', lat: 41.034, lng: 28.977, aliases: ['beyoğlu', 'beyoglu'] },
  { id: 'buyukcekmece', apiLocation: 'Büyükçekmece', lat: 41.021, lng: 28.585, aliases: ['büyükçekmece', 'buyukcekmece'] },
  { id: 'catalca', apiLocation: 'Çatalca', lat: 41.143, lng: 28.461, aliases: ['çatalca', 'catalca'] },
  { id: 'cekmekoy', apiLocation: 'Çekmeköy', lat: 41.032, lng: 29.178, aliases: ['çekmeköy', 'cekmekoy'] },
  { id: 'esenler', apiLocation: 'Esenler', lat: 41.043, lng: 28.879, aliases: ['esenler'] },
  { id: 'esenyurt', apiLocation: 'Esenyurt', lat: 41.034, lng: 28.677, aliases: ['esenyurt'] },
  { id: 'eyupsultan', apiLocation: 'Eyüpsultan', lat: 41.047, lng: 28.934, aliases: ['eyüp', 'eyup', 'eyüpsultan', 'eyupsultan'] },
  { id: 'fatih', apiLocation: 'Fatih', lat: 41.019, lng: 28.949, aliases: ['fatih'] },
  { id: 'gaziosmanpasa', apiLocation: 'Gaziosmanpaşa', lat: 41.062, lng: 28.912, aliases: ['gaziosmanpaşa', 'gaziosmanpasa'] },
  { id: 'gungoren', apiLocation: 'Güngören', lat: 41.021, lng: 28.882, aliases: ['güngören', 'gungoren'] },
  { id: 'kadikoy', apiLocation: 'Kadıköy', lat: 40.982, lng: 29.027, aliases: ['kadıköy', 'kadikoy'] },
  { id: 'kagithane', apiLocation: 'Kağıthane', lat: 41.079, lng: 28.975, aliases: ['kağıthane', 'kagithane'] },
  { id: 'kartal', apiLocation: 'Kartal', lat: 40.906, lng: 29.189, aliases: ['kartal'] },
  { id: 'kucukcekmece', apiLocation: 'Küçükçekmece', lat: 41.002, lng: 28.774, aliases: ['küçükçekmece', 'kucukcekmece'] },
  { id: 'maltepe', apiLocation: 'Maltepe', lat: 40.935, lng: 29.131, aliases: ['maltepe'] },
  { id: 'pendik', apiLocation: 'Pendik', lat: 40.877, lng: 29.234, aliases: ['pendik'] },
  { id: 'sancaktepe', apiLocation: 'Sancaktepe', lat: 41.002, lng: 29.230, aliases: ['sancaktepe'] },
  { id: 'sariyer', apiLocation: 'Sarıyer', lat: 41.166, lng: 29.050, aliases: ['sarıyer', 'sariyer'] },
  { id: 'silivri', apiLocation: 'Silivri', lat: 41.073, lng: 28.246, aliases: ['silivri'] },
  { id: 'sultanbeyli', apiLocation: 'Sultanbeyli', lat: 41.007, lng: 29.267, aliases: ['sultanbeyli'] },
  { id: 'sultangazi', apiLocation: 'Sultangazi', lat: 41.104, lng: 28.868, aliases: ['sultangazi'] },
  { id: 'sile', apiLocation: 'Şile', lat: 41.175, lng: 29.613, aliases: ['şile', 'sile'] },
  { id: 'sisli', apiLocation: 'Şişli', lat: 41.060, lng: 28.987, aliases: ['şişli', 'sisli'] },
  { id: 'tuzla', apiLocation: 'Tuzla', lat: 40.817, lng: 29.300, aliases: ['tuzla'] },
  { id: 'umraniye', apiLocation: 'Ümraniye', lat: 41.016, lng: 29.124, aliases: ['ümraniye', 'umraniye'] },
  { id: 'uskudar', apiLocation: 'Üsküdar', lat: 41.022, lng: 29.015, aliases: ['üsküdar', 'uskudar'] },
  { id: 'zeytinburnu', apiLocation: 'Zeytinburnu', lat: 41.003, lng: 28.907, aliases: ['zeytinburnu'] },
  { id: 'eminonu', apiLocation: 'Eminönü', lat: 41.017, lng: 28.974, aliases: ['eminönü', 'eminonu'] },
];

const districtById = new Map(ISTANBUL_AI_DISTRICTS.map((d) => [d.id, d]));

export function getAiDistrictById(id: AiSearchDistrictId | null | undefined): AiSearchDistrict | null {
  if (!id) return null;
  return districtById.get(id) ?? null;
}

/** UI listesi: alfabetik (Türkçe) */
export function getIstanbulDistrictsForPicker(): AiSearchDistrict[] {
  return [...ISTANBUL_AI_DISTRICTS].sort((a, b) =>
    a.apiLocation.localeCompare(b.apiLocation, 'tr'),
  );
}
