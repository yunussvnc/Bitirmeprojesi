import { apiGet, apiPost, apiPut } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";
import { API_V1 } from "@/src/constants/api";

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
  popularity_score?: number;
  menu_items?: any[];
  // Takip sistemi
  follower_count?: number;
  is_following?: boolean;
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
  const rawDescription: string = p?.description ?? p?.aciklama ?? "";

  // Helper to clean address prefix and keep real review/description
  const cleanPlaceDescription = (placeName: string, desc: string): string => {
    if (!desc) return "";
    const lines = desc.split('\n');
    const cleanedLines: string[] = [];
    const lowerName = placeName.toLowerCase().trim();
    const namePrefix = lowerName.slice(0, 20);
    
    for (let line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      const lowerLine = trimmedLine.toLowerCase();
      
      const isAddressLine = 
        (lowerLine.startsWith(namePrefix) && lowerLine.includes(' - ')) ||
        (trimmedLine.length < 80 && /\bNo[:.]\s*\d|Cd\.|Sk\.|Mah\.|mahalle|sokak|caddesi|ilçesi|yokuşu|bulvarı|yol/i.test(trimmedLine)) ||
        (trimmedLine.length <= 25 && (lowerLine === lowerName || lowerLine.includes('istanbul')));
        
      if (isAddressLine) continue;
      cleanedLines.push(trimmedLine);
    }
    return cleanedLines.join('\n\n').trim();
  };
  const description = cleanPlaceDescription(name, rawDescription);

  const campaign_text = p?.campaign_text ?? p?.campaign ?? p?.kampanya ?? undefined;

  // Parse features JSON array → human-readable Turkish labels
  const FEATURE_LABELS: Record<string, string> = {
    yemek: 'Yemek', rezervasyon: 'Rezervasyon', aile: 'Aile Dostu',
    wifi: 'Wi-Fi', oturma_alani: 'Oturma Alanı', icecek: 'İçecek',
    kahve: 'Kahve', teras: 'Teras', paket: 'Paket Servis',
    alkol: 'Alkol', vegan: 'Vegan', vejetaryen: 'Vejetaryen',
    gluten_free: 'Glüten Yok', canlı_muzik: 'Canlı Müzik',
    otopark: 'Otopark', engelli: 'Engelli Erişimi',
    deniz_manzarası: 'Deniz Manzarası', bahçe: 'Bahçe',
    nargile: 'Nargile', fast_food: 'Fast Food',
  };
  let featuresArr: string[] = [];
  if (p?.features) {
    try {
      const parsed = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
      if (Array.isArray(parsed)) featuresArr = parsed.slice(0, 3);
    } catch { /* ignore */ }
  }
  const featuresLabel = featuresArr
    .map((f: string) => FEATURE_LABELS[f] ?? f)
    .filter(Boolean)
    .join(' · ');

  // Subtitle priority:
  //  1. Explicit DB subtitle
  //  2. Real description (first 80 chars)
  //  3. Features label (from features array)
  //  4. Category name as last resort
  const subtitle =
    p?.subtitle ??
    (description ? String(description).slice(0, 80) : undefined) ??
    (featuresLabel || undefined) ??
    (p?.category ? String(p.category) : undefined);

  const tags = Array.isArray(p?.tags) ? p.tags : (p?.category ? [p.category] : undefined);
  const category = p?.category || undefined;
  const address = p?.address || undefined;
  const city = p?.city || undefined;
  const latitude = typeof p?.latitude === 'number' ? p.latitude : undefined;
  const longitude = typeof p?.longitude === 'number' ? p.longitude : undefined;
  
  let photo_url = p?.photo_url || undefined;
  if (photo_url && photo_url.startsWith('google_photo_ref:')) {
    photo_url = `${API_V1}/places/${id}/photo`;
  }

  let gallery_urls: string[] | undefined = undefined;
  if (Array.isArray(p?.gallery_urls)) {
    gallery_urls = p.gallery_urls.map((url: string) => {
      if (typeof url === 'string' && url.startsWith('google_photo_ref:')) {
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
  const popularity_score = typeof p?.popularity_score === 'number' ? p.popularity_score : undefined;
  const follower_count = typeof p?.follower_count === 'number' ? p.follower_count : 0;
  const is_following = typeof p?.is_following === 'boolean' ? p.is_following : false;
  
  let menu_items: any[] | undefined = undefined;
  const rawMenu = p?.menu_items ?? p?.menu_items_json;
  if (rawMenu) {
    try {
      menu_items = typeof rawMenu === 'string' ? JSON.parse(rawMenu) : rawMenu;
      if (!Array.isArray(menu_items)) menu_items = undefined;
    } catch {
      menu_items = undefined;
    }
  }

  return { id, name, subtitle, description, campaign_text, tags, category, address, city, latitude, longitude, photo_url, gallery_urls, video_url, average_rating, price_range, features, opening_time, closing_time, review_count, saved_count, popularity_score, menu_items, follower_count, is_following };
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
    const data = await apiGet<any>('/places/?page=1&page_size=2000');
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
    const { id, subtitle, tags, average_rating, ...updateData } = payload as any;
    const data = await apiPut<any>('/places/my-venue', updateData);
    if (!data || !data.id) return null;
    return normalizePlace(data);
  } catch (error) {
    logger.error("[updateMyVenue] Error:", error);
    throw error;
  }
}

export async function getMyVenueStats(): Promise<any | null> {
  try {
    const data = await apiGet<any>('/places/my-venue/stats');
    return data;
  } catch (error) {
    logger.error("[getMyVenueStats] Error:", error);
    return null;
  }
}

// ── MEKAN TAKİP ──────────────────────────────────────────────────────────────

export async function togglePlaceFollow(
  placeId: string | number
): Promise<{ followed: boolean; follower_count: number }> {
  return apiPost<any>(`/places/${placeId}/follow`);
}

export async function getPlaceFollowStatus(
  placeId: string | number
): Promise<{ is_following: boolean; follower_count: number }> {
  return apiGet<any>(`/places/${placeId}/follow-status`);
}

// ── MEKAN GÖNDERI & HİKAYELER ───────────────────────────────────────────────

export async function getPlacePosts(
  placeId: string | number,
  page = 1,
  pageSize = 18
): Promise<any> {
  return apiGet<any>(`/places/${placeId}/posts?page=${page}&page_size=${pageSize}`);
}

export async function getPlaceStories(placeId: string | number): Promise<any> {
  return apiGet<any>(`/places/${placeId}/stories`);
}

// ── MEKAN ETKİLEŞİM KAYIT ───────────────────────────────────────────────────

export async function recordPlaceInteraction(
  placeId: string | number,
  type: 'view' | 'search' | 'review' | 'like' = 'view'
): Promise<void> {
  try {
    await apiPost<any>(`/places/${placeId}/interact?interaction_type=${type}`);
  } catch {
    // Sessizce başarısız ol — kritik değil
  }
}

// ── FORYOU ALGORTİMASI (ÖNERİ MOTORU) ──────────────────────────────────────

export async function getForYouPlaces(
  lat?: number,
  lng?: number,
  page = 1,
  pageSize = 12
): Promise<PaginatedPlaces> {
  try {
    let url = `/places/foryou?page=${page}&page_size=${pageSize}`;
    if (lat && lng) {
      url += `&lat=${lat}&lng=${lng}`;
    }
    const data = await apiGet<any>(url);
    if (data && Array.isArray(data.items)) {
      return {
        ...data,
        items: data.items.map(normalizePlace),
      };
    }
    return { items: [], total: 0, page, page_size: pageSize };
  } catch (error) {
    logger.error("[getForYouPlaces] Error:", error);
    return { items: [], total: 0, page, page_size: pageSize };
  }
}

export async function logInteraction(
  placeId: string | number,
  interactionType: 'MAP_CLICK' | 'CARD_VIEW' | 'AI_SUGGESTION' | 'SEARCH_CLICK',
  weight: number = 1
): Promise<void> {
  try {
    await apiPost<any>('/places/interactions', {
      place_id: Number(placeId),
      interaction_type: interactionType,
      weight,
    });
  } catch {
    // Sessizce başarısız ol — kullanıcı deneyimini bozmamalı
  }
}
