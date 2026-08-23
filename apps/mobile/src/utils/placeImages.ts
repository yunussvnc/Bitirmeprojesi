import type { ImageSourcePropType } from "react-native";
import type { Place } from "@/src/services/mekanService";
import { API_BASE_URL } from "@/src/constants/api";

const CATEGORY_PLACEHOLDERS: Record<string, string> = {
  kafe: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  restoran: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  bar: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  "gece kulübü": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "fast food": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800",
  meyhane: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800",
  "nargile cafe": "https://images.unsplash.com/photo-1527661929436-1e546b1e5b3e?w=800",
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
  "fırın": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
  "kahvaltı": "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800",
  pizza: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
  steakhouse: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
  "suşi": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800",
  "tatlıcı": "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800",
  "türk mutfağı": "https://images.unsplash.com/photo-1621510456681-2330151969d4?w=800",
};

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

type PlaceLike = Place | { name?: string; photo_url?: string; category?: string };

/** Kategori adına göre placeholder URL döner, yoksa default */
export function getCategoryFallbackUrl(category?: string): string {
  if (!category) return DEFAULT_IMAGE;
  const key = category.toLowerCase().trim();
  return CATEGORY_PLACEHOLDERS[key] ?? DEFAULT_IMAGE;
}

export function getPlaceImageSource(
  place: PlaceLike | string | number
): ImageSourcePropType {
  if (typeof place === "object" && place !== null) {
    if ("photo_url" in place && place.photo_url) {
      const url = place.photo_url.startsWith('/') ? `${API_BASE_URL}${place.photo_url}` : place.photo_url;
      return { uri: url };
    }
    if ("category" in place && place.category) {
      const key = place.category.toLowerCase().trim();
      const url = CATEGORY_PLACEHOLDERS[key];
      if (url) return { uri: url };
    }
  }
  return { uri: DEFAULT_IMAGE };
}

export function hasPlaceImage(
  place: PlaceLike | null | undefined
): boolean {
  if (!place || typeof place !== "object") return false;
  if ("photo_url" in place && place.photo_url) return true;
  if ("category" in place && place.category) {
    const key = place.category.toLowerCase().trim();
    return key in CATEGORY_PLACEHOLDERS;
  }
  return false;
}
