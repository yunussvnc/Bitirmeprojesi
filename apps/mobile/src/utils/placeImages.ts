import type { ImageSourcePropType } from "react-native";
import type { Place } from "@/src/services/mekanService";

/**
 * Mekan görsellerini mekan tipine göre döndürür
 * Metro bundler'da require path'leri statik olmalı.
 */
export function getPlaceImageSource(place: Place | string | number): ImageSourcePropType {
  // Eğer Place objesi gelirse, category'ye göre görsel seç
  if (typeof place === 'object' && place !== null && 'category' in place) {
    const category = place.category?.toLowerCase() || '';
    const name = place.name?.toLowerCase() || '';
    
    // Kafe görselleri
    if (category === 'kafe' || name.includes('espresso') || name.includes('starbucks') || 
        name.includes('kahve') || name.includes('café') || name.includes('cafe') ||
        name.includes('nero') || name.includes('mado') || name.includes('simit')) {
      return require("../../assets/places/place-1.jpg"); // Kafe görseli
    }
    
    // Restoran görselleri
    if (category === 'restoran' || name.includes('nusr') || name.includes('günaydın') || 
        name.includes('muhallebi') || name.includes('sütiş') || name.includes('çiya') ||
        name.includes('ocakbaşı') || name.includes('mikla') || name.includes('sunset')) {
      return require("../../assets/places/place-2.jpg"); // Restoran görseli
    }
    
    // Bar görselleri
    if (category === 'bar' || name.includes('bar') || name.includes('360') || 
        name.includes('sortie') || name.includes('reina') || name.includes('anjelique')) {
      return require("../../assets/places/place-3.jpg"); // Bar görseli
    }
    
    // Fast Food görselleri
    if (category === 'fast food' || name.includes('mcdonald') || name.includes('burger king') ||
        name.includes('kfc') || name.includes('pizza') || name.includes('subway')) {
      return require("../../assets/places/place-4.jpg"); // Fast Food görseli
    }
    
    // Default
    return require("../../assets/places/place-5.jpg");
  }
  
  // Eski API uyumluluğu için (sadece ID gelirse)
  const n = typeof place === 'number' ? place : Number(place);
  const safe = Number.isFinite(n) && n > 0 ? n : 1;
  const idx = ((safe - 1) % 6) + 1;

  switch (idx) {
    case 1:
      return require("../../assets/places/place-1.jpg");
    case 2:
      return require("../../assets/places/place-2.jpg");
    case 3:
      return require("../../assets/places/place-3.jpg");
    case 4:
      return require("../../assets/places/place-4.jpg");
    case 5:
      return require("../../assets/places/place-5.jpg");
    case 6:
    default:
      return require("../../assets/places/place-6.jpg");
  }
}