/**
 * Geofence Service
 * 
 * expo-task-manager + expo-location ile pil dostu arka plan konum takibi.
 * Kullanıcı favori bir mekanın yakınına geldiğinde push notification tetikler.
 * 
 * Pil Optimizasyonu:
 * - distanceInterval: 100m (her 100m'de bir güncelleme)
 * - accuracy: Balanced (GPS + WiFi hibrit, pil dostu)
 * - Gün içinde aynı mekan için max 1 bildirim (spam koruması)
 * 
 * @module services/geofenceService
 */

import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { useGeofenceStore } from "@/src/store/useGeofenceStore";
import { useOfflineCache } from "@/src/store/useOfflineCache";
import { calculateDistance } from "@/src/utils/location";
import { logger } from "@/src/utils/logger";

const BACKGROUND_LOCATION_TASK = "ASEMOS_GEOFENCE_TASK";

/**
 * Background Task: Konum güncellemelerini işler.
 * Bu fonksiyon app arka plandayken çalışır.
 */
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    logger.error("[Geofence] Background task hatası:", error);
    return;
  }

  if (!data) return;

  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations || locations.length === 0) return;

  const location = locations[locations.length - 1]; // En son konum
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

      // Push notification gönder
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
});

/**
 * Arka plan konum takibini başlat
 * Pil dostu ayarlarla çalışır.
 */
export async function startGeofencing(): Promise<boolean> {
  try {
    // Arka plan konum izni iste
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      logger.warn("[Geofence] Foreground konum izni reddedildi");
      return false;
    }

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      logger.warn("[Geofence] Background konum izni reddedildi");
      return false;
    }

    // Bildirim izni
    const { status: notifStatus } =
      await Notifications.requestPermissionsAsync();
    if (notifStatus !== "granted") {
      logger.warn("[Geofence] Bildirim izni reddedildi");
      return false;
    }

    // Zaten çalışıyor mu?
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRunning) {
      logger.info("[Geofence] Zaten çalışıyor");
      return true;
    }

    // Arka plan konum takibini başlat
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced, // GPS + WiFi hibrit (pil dostu)
      distanceInterval: 100, // Her 100 metrede bir güncelleme
      deferredUpdatesInterval: 60000, // Min 60 saniyede bir batch (ek pil tasarrufu)
      showsBackgroundLocationIndicator: true, // iOS: Durum çubuğunda mavi ok
      foregroundService: {
        notificationTitle: "AsemOS",
        notificationBody: "Yakındaki mekanlar izleniyor",
        notificationColor: "#6C5CE7",
      },
    });

    // Bugünün süresi dolan trigger'larını temizle
    useGeofenceStore.getState().clearExpiredTriggers();

    logger.info("[Geofence] ✅ Arka plan konum takibi başlatıldı");
    return true;
  } catch (error) {
    logger.error("[Geofence] Başlatma hatası:", error);
    return false;
  }
}

/**
 * Arka plan konum takibini durdur
 */
export async function stopGeofencing(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      logger.info("[Geofence] ⏹ Arka plan konum takibi durduruldu");
    }
  } catch (error) {
    logger.error("[Geofence] Durdurma hatası:", error);
  }
}

/**
 * Geofence durumunu kontrol et
 */
export async function isGeofencingActive(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
  } catch {
    return false;
  }
}
