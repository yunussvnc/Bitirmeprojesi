import { apiGet } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";

export type Place = {
  id: number | string;
  name: string;
  subtitle?: string;
  description?: string;
  campaign_text?: string;
  tags?: string[];
  category?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  photo_url?: string;
  video_url?: string;
  average_rating?: number;
  price_range?: number;
  features?: string;
  opening_time?: string;
  closing_time?: string;
};

export type PaginatedPlaces = {
  items: Place[];
  total: number;
  page: number;
  page_size: number;
};

function normalizePlace(p: any): Place {
  const id = p?.id ?? p?._id ?? p?.place_id ?? String(Math.random());
  const name = String(p?.name ?? p?.title ?? p?.mekan_adi ?? "Mekan");
  const description = p?.description ?? p?.aciklama ?? "";
  const campaign_text = p?.campaign_text ?? p?.campaign ?? p?.kampanya ?? undefined;
  const subtitle =
    p?.subtitle ??
    (description ? String(description).slice(0, 80) : undefined);

  const tags = Array.isArray(p?.tags) ? p.tags : (p?.category ? [p.category] : undefined);
  const category = p?.category || undefined;
  const address = p?.address || undefined;
  const city = p?.city || undefined;
  const latitude = typeof p?.latitude === 'number' ? p.latitude : undefined;
  const longitude = typeof p?.longitude === 'number' ? p.longitude : undefined;
  const photo_url = p?.photo_url || undefined;
  const video_url = p?.video_url || undefined;
  const average_rating = typeof p?.average_rating === 'number' ? p.average_rating : undefined;
  const price_range = typeof p?.price_range === 'number' ? p.price_range : undefined;
  const features = p?.features || undefined;
  const opening_time = p?.opening_time || undefined;
  const closing_time = p?.closing_time || undefined;

  return { id, name, subtitle, description, campaign_text, tags, category, address, city, latitude, longitude, photo_url, video_url, average_rating, price_range, features, opening_time, closing_time };
}

export async function getPlaces(page = 1, pageSize = 20): Promise<PaginatedPlaces> {
  try {
    const data = await apiGet<any>(`/places/?page=${page}&page_size=${pageSize}`);

    if (data?.items && typeof data.total === "number") {
      return {
        items: data.items.map(normalizePlace),
        total: data.total,
        page: data.page ?? page,
        page_size: data.page_size ?? pageSize,
      };
    }

    const arr = Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : [];
    logger.log(`[getPlaces] Loaded ${arr.length} places (page ${page})`);
    return {
      items: arr.map(normalizePlace),
      total: arr.length,
      page,
      page_size: pageSize,
    };
  } catch (error) {
    logger.error("[getPlaces] Error:", error);
    throw error;
  }
}

export async function getAllPlaces(): Promise<Place[]> {
  try {
    const data = await apiGet<any>('/places/?page=1&page_size=500');
    const arr = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
    logger.log(`[getAllPlaces] Loaded ${arr.length} places`);
    return arr.map(normalizePlace);
  } catch (error) {
    logger.error("[getAllPlaces] Error:", error);
    throw error;
  }
}

export async function getPlaceById(id: string | number): Promise<Place | null> {
  try {
    const data = await apiGet<any>(`/places/${id}`);
    if (!data || !data.id) return null;
    return normalizePlace(data);
  } catch (error) {
    logger.error(`[getPlaceById] Error for id=${id}:`, error);
    return null;
  }
}

export async function checkHealth(): Promise<boolean> {
  try {
    const data = await apiGet<any>('/health');
    return data?.status === "ok";
  } catch {
    return false;
  }
}
