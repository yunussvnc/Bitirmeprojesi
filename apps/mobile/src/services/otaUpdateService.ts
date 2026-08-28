/**
 * OTA Update Service — Expo EAS Update ile Mağaza Beklemeden Güncelleme
 *
 * Uygulama açılırken arka planda yeni JS bundle kontrolü yapar.
 * Güncelleme varsa sessizce indirir, kullanıcıya opsiyonel alert gösterir.
 * Kullanıcı uygulamayı yeniden başlattığında yeni versiyon aktif olur.
 *
 * @module services/otaUpdateService
 */

import { logger } from "@/src/utils/logger";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import * as Updates from "expo-updates";

/**
 * OTA güncelleme kontrolü yap.
 * Uygulama başlangıcında (_layout.tsx useEffect içinde) çağrılmalı.
 *
 * @param showAlert - Güncelleme varsa kullanıcıya bildirim göster (varsayılan: true)
 */
export async function checkForOTAUpdate(showAlert: boolean = true): Promise<void> {
  const mod = Updates;

  // Development modunda OTA kontrol çalışmaz
  if (__DEV__) {
    console.log("[OTA] Development modunda OTA kontrol atlanıyor");
    return;
  }

  try {
    logger.info("[OTA] Güncelleme kontrolü başlatılıyor...");

    const update = await mod.checkForUpdateAsync();

    if (!update.isAvailable) {
      logger.info("[OTA] Uygulama güncel ✅");
      return;
    }

    logger.info("[OTA] Yeni güncelleme bulundu! İndiriliyor...");

    // Arka planda sessizce indir
    const result = await mod.fetchUpdateAsync();

    if (!result.isNew) {
      logger.info("[OTA] İndirilen güncelleme mevcut versiyonla aynı");
      return;
    }

    logger.info("[OTA] Güncelleme indirildi ✅");

    if (showAlert) {
      // Kullanıcıya opsiyonel bildirim göster
      Alert.alert(
        "Güncelleme Hazır 🎉",
        "Yeni bir güncelleme indirildi. Uygulamayı yeniden başlatarak güncellemeleri aktif edebilirsiniz.",
        [
          {
            text: "Sonra",
            style: "cancel",
          },
          {
            text: "Şimdi Yeniden Başlat",
            onPress: async () => {
              try {
                await mod.reloadAsync();
              } catch (error) {
                logger.error("[OTA] Yeniden başlatma hatası:", error);
              }
            },
          },
        ]
      );
    }
    // showAlert=false ise sessizce indirilir,
    // kullanıcı uygulamayı sonraki açışında otomatik güncellenir
  } catch (error: any) {
    // OTA hatası uygulamayı kesmemeli
    logger.warn("[OTA] Güncelleme kontrolü başarısız:", error?.message);
  }
}

/**
 * Mevcut güncelleme bilgilerini al
 */
export function getCurrentUpdateInfo(): {
  updateId: string | null;
  channel: string | null;
  isEmbeddedLaunch: boolean;
} {
  const mod = Updates;

  return {
    updateId: mod.updateId || null,
    channel: mod.channel || null,
    isEmbeddedLaunch: mod.isEmbeddedLaunch ?? true,
  };
}
