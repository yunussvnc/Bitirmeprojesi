import { Image, Video } from 'react-native-compressor';

/**
 * Medya türüne göre sıkıştırma uygular.
 * @param uri - Orjinal medya dosyasının local URI'ı (file://)
 * @param type - 'image' veya 'video'
 * @returns Sıkıştırılmış dosyanın local URI'ı
 */
export async function compressMedia(uri: string, type: 'image' | 'video' | string): Promise<string> {
  try {
    if (type === 'video') {
      console.log(`[MediaCompression] Video sıkıştırılıyor: ${uri}`);
      const compressedVideoUri = await Video.compress(
        uri,
        {
          compressionMethod: 'auto',
          // Kaliteyi bozmadan boyutu dramatik şekilde düşürür
          minimumFileSizeForCompress: 2, // 2MB altındaki videoları sıkıştırma
        },
        (progress) => {
          console.log(`[MediaCompression] Video sıkıştırma ilerlemesi: %${Math.round(progress * 100)}`);
        }
      );
      console.log(`[MediaCompression] Video sıkıştırma tamamlandı: ${compressedVideoUri}`);
      return compressedVideoUri;
    } else if (type === 'image') {
      console.log(`[MediaCompression] Görsel sıkıştırılıyor: ${uri}`);
      const compressedImageUri = await Image.compress(uri, {
        compressionMethod: 'auto',
        maxWidth: 1920, // 1080p-1440p optimizasyonu (mobil ekranlar için fazlasıyla yeterli)
        quality: 0.8, // %80 kalite, gözle görülür kayıp olmadan dosya boyutunu %50-70 düşürür
      });
      console.log(`[MediaCompression] Görsel sıkıştırma tamamlandı: ${compressedImageUri}`);
      return compressedImageUri;
    }
  } catch (error) {
    console.error(`[MediaCompression] Sıkıştırma hatası (${type}):`, error);
    // Hata durumunda orjinal uri'yi dön ki yükleme devam etsin
  }
  
  return uri;
}
