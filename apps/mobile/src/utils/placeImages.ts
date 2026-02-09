import type { ImageSourcePropType } from "react-native";
import type { Place } from "@/src/services/mekanService";

/**
 * Brand Image Mapping
 * İstanbul zincir mekanları – markaya özel görseller (5+ şubeli zincirler)
 * Öncelik: API photo_url > bu map > kategori placeholder > varsayılan
 */
const BRAND_IMAGE_MAP: Record<string, string> = {
  // Kahve zincirleri (Espressolab, Starbucks, Kahve Dünyası vb.)
  "espressolab": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  "espresso lab": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  "starbucks": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
  "kahve dünyası": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
  "gloria jeans": "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800",
  "caffè nero": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
  "nero": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
  "mado": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
  "simit sarayı": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800",
  "the house café": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  "bigchefs": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",

  // Fast food zincirleri
  "mcdonald": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
  "mcdonalds": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800",
  "burger king": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=800",
  "kfc": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
  "subway": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
  "popeyes": "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800",
  "domino": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  "domino's": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  "pizza hut": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  "sbarro": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
  "köfteci yusuf": "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800",

  // Restoran zincirleri (Nusret, Günaydın vb.)
  "nusret": "https://images.unsplash.com/photo-1558030006-450675393462?w=800",
  "nusr-et": "https://images.unsplash.com/photo-1558030006-450675393462?w=800",
  "nusr et": "https://images.unsplash.com/photo-1558030006-450675393462?w=800",
  "günaydın": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
  "çiya": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
  "sütiş": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
  "muhallebici": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
  "saray muhallebicisi": "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",

  // Bar / gece kulübü
  "360": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  "360 bar": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  "reina": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "sortie": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "anjelique": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "anjelik": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "ruby": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "mikla": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
  "sunset": "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
};

/**
 * Category-based placeholder images
 * Marka eşleşmezse kategoriye göre fallback
 */
const CATEGORY_PLACEHOLDER_MAP: Record<string, string> = {
  "cafe": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  "kafe": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  "coffee": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
  
  "restaurant": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  "restoran": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800",
  
  "bar": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  "pub": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
  
  "club": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "nightclub": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  "gece kulübü": "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=800",
  
  "fast food": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800",
  "fastfood": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800",
};

/** Genel varsayılan görsel (hiçbir şey eşleşmezse) */
const DEFAULT_PLACE_IMAGE_URI = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";

/**
 * Mekan adından marka tespiti (case-insensitive anahtar kelime eşleştirme)
 */
function detectBrandImage(placeName: string): string | null {
  const lowerName = placeName.toLowerCase().trim();
  
  // Exact match veya contains kontrolü
  for (const [keyword, imageUrl] of Object.entries(BRAND_IMAGE_MAP)) {
    if (lowerName.includes(keyword)) {
      return imageUrl;
    }
  }
  
  return null;
}

/**
 * Kategoriden placeholder tespiti
 */
function getCategoryPlaceholder(category?: string): string | null {
  if (!category) return null;
  
  const lowerCategory = category.toLowerCase().trim();
  return CATEGORY_PLACEHOLDER_MAP[lowerCategory] || null;
}

/**
 * Mekan görseli kaynağı - Öncelik sırası:
 * 1. API'den gelen photo_url (varsa)
 * 2. Marka eşleştirmesi (place name'den)
 * 3. Kategori placeholder
 * 4. Genel varsayılan görsel
 */
export function getPlaceImageSource(
  place: Place | { name?: string; photo_url?: string; category?: string } | string | number
): ImageSourcePropType {
  // 1. API'den photo_url varsa öncelik ver
  if (typeof place === "object" && place !== null && "photo_url" in place && place.photo_url) {
    return { uri: place.photo_url };
  }
  
  // 2. Mekan adından marka tespiti
  if (typeof place === "object" && place !== null && "name" in place && place.name) {
    const brandImage = detectBrandImage(place.name);
    if (brandImage) {
      return { uri: brandImage };
    }
  }
  
  // 3. Kategoriye göre placeholder
  if (typeof place === "object" && place !== null && "category" in place && place.category) {
    const categoryImage = getCategoryPlaceholder(place.category);
    if (categoryImage) {
      return { uri: categoryImage };
    }
  }
  
  // 4. Genel varsayılan
  return { uri: DEFAULT_PLACE_IMAGE_URI };
}
