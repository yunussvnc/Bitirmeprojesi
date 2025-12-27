import type { ImageSourcePropType } from "react-native";

/**
 * NOT:
 * Metro bundler'da require path'leri statik olmalı.
 * Bu yüzden dinamik string yerine switch kullanıyoruz.
 *
 * Beklenen dosyalar:
 * - assets/places/place-1.jpg
 * - assets/places/place-2.jpg
 * - assets/places/place-3.jpg
 * - assets/places/place-4.jpg
 * - assets/places/place-5.jpg
 * - assets/places/place-6.jpg
 */
export function getPlaceImageSource(placeId: string | number): ImageSourcePropType {
  const n = Number(placeId);
  const safe = Number.isFinite(n) && n > 0 ? n : 1;

  // 1..6 arası döndür
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