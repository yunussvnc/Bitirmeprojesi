import type { Place as AiPlace } from '@/src/types/ai';

/** AI/Groq önerilerinde eksik kartları filtreler; tam dolu kartlar kalır. */
export function isCompleteAiRecommendation(place: Partial<AiPlace>): boolean {
  const name = (place.name ?? '').trim();
  if (name.length < 2) return false;

  const lat = place.latitude;
  const lng = place.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;

  const category = (place.category ?? '').trim();
  const address = (place.address ?? '').trim();
  if (!category && !address) return false;

  return true;
}

export function filterCompleteAiRecommendations<T extends Partial<AiPlace>>(places: T[]): T[] {
  return places.filter(isCompleteAiRecommendation);
}
