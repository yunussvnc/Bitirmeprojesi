/** Google Maps JavaScript API — Keşfet haritası (WebView). Backend fotoğraf proxy'si ayrı anahtar kullanır. */
export const GOOGLE_MAPS_API_KEY =
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || '';

export const USE_GOOGLE_MAPS = GOOGLE_MAPS_API_KEY.length > 0;
