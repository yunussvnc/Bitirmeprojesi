// apps/mobile/src/services/mekanService.ts
import { apiGet } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";

export type Place = {
  id: number | string;
  name: string;
  subtitle?: string;
  description?: string;
  tags?: string[];
  category?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

function normalizePlace(p: any): Place {
  const id = p?.id ?? p?._id ?? p?.place_id ?? String(Math.random());
  const name = String(p?.name ?? p?.title ?? p?.mekan_adi ?? "Mekan");
  const description = p?.description ?? p?.aciklama ?? "";
  const subtitle =
    p?.subtitle ??
    (description ? String(description).slice(0, 80) : undefined);

  const tags = Array.isArray(p?.tags) ? p.tags : undefined;
  const category = p?.category || undefined;
  const address = p?.address || undefined;
  const city = p?.city || undefined;
  const latitude = typeof p?.latitude === 'number' ? p.latitude : undefined;
  const longitude = typeof p?.longitude === 'number' ? p.longitude : undefined;

  return { id, name, subtitle, description, tags, category, address, city, latitude, longitude };
}

export async function getPlaces(): Promise<Place[]> {
  try {
    const data = await apiGet<any>('/places/');
    
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.data)
      ? data.data
      : [];

    logger.log(`[getPlaces] Loaded ${arr.length} places`);
    return arr.map(normalizePlace);
  } catch (error) {
    logger.error('[getPlaces] Error:', error);
    throw error;
  }
}