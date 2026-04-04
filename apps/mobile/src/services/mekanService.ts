import { apiGet, apiPut } from "@/src/utils/apiClient";
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
  gallery_urls?: string[];
  video_url?: string;
  average_rating?: number;
  price_range?: number;
  features?: string;
  opening_time?: string;
  closing_time?: string;
  review_count?: number;
  saved_count?: number;
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
  
  let photo_url = p?.photo_url || undefined;
  if (photo_url && photo_url.startsWith('google_photo_ref:')) {
    const API_BASE_URL = require('@/src/constants/api').API_BASE_URL;
    photo_url = `${API_BASE_URL}/places/${id}/photo`;
  }

  let gallery_urls: string[] | undefined = undefined;
  if (Array.isArray(p?.gallery_urls)) {
    const API_BASE_URL = require('@/src/constants/api').API_BASE_URL;
    gallery_urls = p.gallery_urls.map((url: string) => {
      if (typeof url === 'string' && url.startsWith('google_photo_ref:')) {
         const ref = url.split('google_photo_ref:')[1];
         // Pass ref as a query param or an endpoint if supported? 
         // Ah wait, our backend `/places/{id}/photo` only returns the main photo!
         // We might need to handle gallery photos later, but for now we format them just in case backend supports it.
         // Wait, backend doesn't support downloading gallery photos yet. Let's just pass the photo_url logic we just added.
         return url;
      }
      return url;
    });
  }

  const video_url = p?.video_url || undefined;
  const average_rating = typeof p?.average_rating === 'number' ? p.average_rating : undefined;
  const price_range = typeof p?.price_range === 'number' ? p.price_range : undefined;
  const features = p?.features || undefined;
  const opening_time = p?.opening_time || undefined;
  const closing_time = p?.closing_time || undefined;
  const review_count = typeof p?.review_count === 'number' ? p.review_count : undefined;
  const saved_count = typeof p?.saved_count === 'number' ? p.saved_count : undefined;

  return { id, name, subtitle, description, campaign_text, tags, category, address, city, latitude, longitude, photo_url, gallery_urls, video_url, average_rating, price_range, features, opening_time, closing_time, review_count, saved_count };
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

export async function getMyVenue(): Promise<Place | null> {
  try {
    const data = await apiGet<any>('/places/my-venue');
    if (!data || !data.id) return null;
    return normalizePlace(data);
  } catch (error) {
    logger.error("[getMyVenue] Error:", error);
    return null;
  }
}

export async function updateMyVenue(payload: Partial<Place>): Promise<Place | null> {
  try {
    const { id, name, subtitle, tags, average_rating, price_range, ...updateData } = payload as any;
    const { data } = await apiPut<any>('/places/my-venue', updateData);
    if (!data || !data.id) return null;
    return normalizePlace(data);
  } catch (error) {
    logger.error("[updateMyVenue] Error:", error);
    throw error;
  }
}
