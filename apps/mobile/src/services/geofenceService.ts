/**
 * Geofence Service (Foreground Only)
 * 
 * Uygulama açıkken (ön plandayken) konum takibi yapar.
 * Kullanıcı favori bir mekanın yakınına geldiğinde in-app bildirim veya push notification tetikler.
 * 
 * Pil Optimizasyonu & App Store Uyumlu:
 * - distanceInterval: 100m (her 100m'de bir güncelleme)
 * - Sadece uygulama açıkken çalışır (Apple incelemesinde sorun yaratmaz)
 * - Gün içinde aynı mekan için max 1 bildirim (spam koruması)
 * 
 * @module services/geofenceService
 */

import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useGeofenceStore } from "@/src/store/useGeofenceStore";
import { useOfflineCache } from "@/src/store/useOfflineCache";
import { calculateDistance } from "@/src/utils/location";
import { logger } from "@/src/utils/logger";

let locationSubscription: Location.LocationSubscription | null = null;

/**
 * Konum geldiğinde çalışacak ana iş mantığı
 */
const handleLocationUpdate = async (location: Location.LocationObject) => {
  const { latitude, longitude } = location.coords;

  // Offline cache'i güncelle (son bilinen konum)
  useOfflineCache.getState().setLastKnownLocation(latitude, longitude);

  // Geofence store'dan izlenen mekanları al
  const geofenceState = useGeofenceStore.getState();
  if (!geofenceState.isGeofenceEnabled) return;

  const { watchedPlaces, hasTriggeredToday, markAsTriggered } = geofenceState;

  // Her izlenen mekan için mesafe kontrolü
  for (const place of watchedPlaces) {
    // Spam koruması: Bugün zaten bildirim gönderilmiş mi?
    if (hasTriggeredToday(place.id)) continue;

    const distance = calculateDistance(
      latitude,
      longitude,
      place.latitude,
      place.longitude
    );

    // Mekan yarıçapı içinde mi?
    if (distance <= place.radiusMeters) {
      logger.info(
        `[Geofence] 📍 Mekan yakınında: ${place.name} (${Math.round(distance)}m)`
      );

      // Push notification (Local) gönder
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📍 Favori mekanınız yakında!",
          body: place.campaignText
            ? `${place.name}: ${place.campaignText}`
            : `${place.name} sadece ${Math.round(distance)} metre uzağınızda!`,
          data: { type: "geofence", placeId: place.id, placeName: place.name },
          sound: "default",
        },
        trigger: null, // Anında göster
      });

      // Spam koruması: Bugün tetiklendi olarak işaretle
      markAsTriggered(place.id);
    }
  }
};

/**
 * Ön plan konum takibini başlat
 * Sadece 'When In Use' iznine ihtiyaç duyar.
 */
export async function startGeofencing(): Promise<boolean> {
  try {
    // Zaten çalışıyorsa tekrar başlatma
    if (locationSubscription) {
      logger.info("[Geofence] Zaten ön plan takibi çalışıyor");
      return true;
    }

    // Ön plan konum izni iste
    const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      logger.warn("[Geofence] Foreground konum izni reddedildi");
      return false;
    }

    // Bildirim izni
    const { status: notifStatus } = await Notifications.requestPermissionsAsync();
    if (notifStatus !== "granted") {
      logger.warn("[Geofence] Bildirim izni reddedildi");
      return false;
    }

    // Bugünün süresi dolan trigger'larını temizle
    useGeofenceStore.getState().clearExpiredTriggers();

    // Ön plan izlemeyi başlat
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced, // Pil dostu
        distanceInterval: 100, // 100 metrede bir güncelleme
      },
      (location) => {
        handleLocationUpdate(location).catch((err) =>
          logger.error("[Geofence] Konum isleme hatasi:", err)
        );
      }
    );

    logger.info("[Geofence] ✅ Ön plan konum takibi başlatıldı");
    return true;
  } catch (error) {
    logger.error("[Geofence] Başlatma hatası:", error);
    return false;
  }
}

/**
 * Ön plan konum takibini durdur
 */
export async function stopGeofencing(): Promise<void> {
  try {
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
      logger.info("[Geofence] ⏹ Ön plan konum takibi durduruldu");
    }
  } catch (error) {
    logger.error("[Geofence] Durdurma hatası:", error);
  }
}

/**
 * Geofence durumunu kontrol et
 */
export async function isGeofencingActive(): Promise<boolean> {
  return locationSubscription !== null;
}
