import type { AiSearchDistrict } from '@/src/constants/aiDistricts';
import type { Place } from '@/src/services/mekanService';

export function normalizeDistrictText(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');
}

export function placeMatchesDistrict(place: Place, district: AiSearchDistrict): boolean {
  const haystack = normalizeDistrictText(
    [
      place.city,
      place.address,
      place.name,
      place.subtitle,
    ]
      .filter(Boolean)
      .join(' '),
  );

  return [district.apiLocation, ...district.aliases].some((term) =>
    haystack.includes(normalizeDistrictText(term)),
  );
}
