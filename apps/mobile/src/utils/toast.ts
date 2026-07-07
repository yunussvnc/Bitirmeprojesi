/**
 * Toast Helper — Non-blocking kullanıcı bildirimleri
 *
 * Alert.alert() yerine kullanılır. Kullanıcının akışını kesmez,
 * ekranın üstünde animasyonlu toast gösterir.
 *
 * Kullanım:
 *   showSuccess("Başarılı", "Gönderi paylaşıldı");
 *   showError("Hata", "Bir sorun oluştu");
 *   showInfo("Bilgi", "Profil güncellendi");
 *
 * @module utils/toast
 */

import Toast from "react-native-toast-message";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

/**
 * Başarı mesajı göster (yeşil ✓)
 */
export function showSuccess(title: string, message?: string): void {
  Toast.show({
    type: "success",
    text1: title,
    text2: message,
    visibilityTime: 3000,
    topOffset: 60,
  });
}

/**
 * Hata mesajı göster (kırmızı ✕)
 */
export function showError(title: string, message?: string): void {
  Toast.show({
    type: "error",
    text1: title,
    text2: message,
    visibilityTime: 4000,
    topOffset: 60,
  });
}

/**
 * Bilgi mesajı göster (mavi ℹ)
 */
export function showInfo(title: string, message?: string): void {
  Toast.show({
    type: "info",
    text1: title,
    text2: message,
    visibilityTime: 3000,
    topOffset: 60,
  });
}
