import { apiGet, apiPost, apiPut } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";
import { API_BASE_URL } from "@/src/constants/api";
import { normalizePriceRange } from "@/src/utils/placeCardHelpers";

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
  user_review?: string;
  phone_number?: string;
  data_id?: string;
  vector_id?: string;
  follower_count?: number;
  is_following?: boolean;
};

export type GoogleReview = {
  author_name: string;
  rating: number;
  text: string;
  relative_time?: string | null;
  avatar_url?: string | null;
};

export type GoogleReviewsResponse = {
  reviews: GoogleReview[];
  total_fetched: number;
  display_limit: number;
  source: string;
};

export type PaginatedPlaces = {
  items: Place[];
  total: number;
  page: number;
  page_size: number;
};

function parseCoord(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

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
  const latitude = parseCoord(p?.latitude ?? p?.lat ?? p?.enlem);
  const longitude = parseCoord(p?.longitude ?? p?.lng ?? p?.boylam);
  
  let photo_url = p?.photo_url || undefined;
  if (photo_url && photo_url.startsWith('google_photo_ref:')) {
    photo_url = `${API_BASE_URL}/places/${id}/photo`;
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
  const average_rating =
    typeof p?.average_rating === 'number'
      ? p.average_rating
      : typeof p?.rating === 'number'
        ? p.rating
        : typeof p?.puan === 'number'
          ? p.puan
          : undefined;
  const price_range = normalizePriceRange(p?.price_range ?? p?.price_level);
  const features = p?.features || undefined;
  const opening_time = p?.opening_time || p?.acilis || undefined;
  const closing_time = p?.closing_time || p?.kapanis || undefined;
  const review_count = (() => {
    const appReviews = typeof p?.review_count === 'number' ? p.review_count : undefined;
    const googleReviews =
      typeof p?.user_ratings_total === 'number'
        ? p.user_ratings_total
        : typeof p?.yorum_sayisi === 'number'
          ? p.yorum_sayisi
          : undefined;
    if (typeof appReviews === 'number' && appReviews > 0) return appReviews;
    return googleReviews ?? appReviews;
  })();
  const saved_count = typeof p?.saved_count === 'number' ? p.saved_count : undefined;
  const popularity_score = typeof p?.popularity_score === 'number' ? p.popularity_score : undefined;
  const user_review = p?.user_review || undefined;
  const phone_number = p?.phone_number || p?.telefon || undefined;
  const data_id = p?.data_id || p?.vector_id || undefined;
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

  return {
    id,
    name,
    subtitle,
    description,
    campaign_text,
    tags,
    category,
    address,
    city,
    latitude,
    longitude,
    photo_url,
    gallery_urls,
    video_url,
    average_rating,
    price_range,
    features,
    opening_time,
    closing_time,
    review_count,
    saved_count,
    popularity_score,
    menu_items,
    user_review,
    phone_number,
    data_id,
    vector_id: p?.vector_id || data_id,
    follower_count,
    is_following,
  };
}

export async function getPlaceGoogleReviews(
  placeId: string | number,
  limit = 5,
): Promise<GoogleReviewsResponse> {
  const data = await apiGet<GoogleReviewsResponse>(
    `/places/${placeId}/google-reviews?limit=${limit}`,
  );
  return {
    reviews: data?.reviews ?? [],
    total_fetched: data?.total_fetched ?? 0,
    display_limit: data?.display_limit ?? limit,
    source: data?.source ?? "google_maps",
  };
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
    const pageSize = 200;
    let page = 1;
    let total = Number.POSITIVE_INFINITY;
    const all: Place[] = [];

    while (all.length < total) {
      const batch = await getPlaces(page, pageSize);
      total = batch.total;
      if (batch.items.length === 0) break;
      all.push(...batch.items);
      if (batch.items.length < pageSize) break;
      page += 1;
    }

    logger.log(`[getAllPlaces] Loaded ${all.length} places`);
    return all;
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
