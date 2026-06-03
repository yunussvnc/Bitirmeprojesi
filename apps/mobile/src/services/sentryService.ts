/**
 * Sentry Service — Merkezi Hata İzleme (Crash Tracking)
 *
 * Sentry SDK wrapper'ı. DSN yoksa sessizce devre dışı kalır.
 * ErrorBoundary ve logger ile entegre çalışır.
 *
 * Kurulum: npx expo install @sentry/react-native
 * Sentry.io'dan DSN alınıp .env dosyasına eklenmeli:
 *   EXPO_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
 *
 * @module services/sentryService
 */

import { logger } from "@/src/utils/logger";

// Sentry SDK — opsiyonel import (kurulu değilse hata vermez)
let Sentry: any = null;
let isSentryEnabled = false;

/**
 * Sentry'yi başlat. Uygulama açılırken (_layout.tsx) çağrılmalı.
 */
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

  if (!dsn) {
    if (__DEV__) {
      console.log("[Sentry] DSN bulunamadı, Sentry devre dışı.");
    }
    return;
  }

  try {
    // Dynamic import — @sentry/react-native kurulu değilse hata yakalanır
    Sentry = require("@sentry/react-native");

    Sentry.init({
      dsn,
      debug: __DEV__,
      environment: __DEV__ ? "development" : "production",
      tracesSampleRate: __DEV__ ? 1.0 : 0.2, // Prod'da %20 trace sampling
      enableAutoSessionTracking: true,
      sessionTrackingIntervalMillis: 30000,

      // Hassas verileri filtrele
      beforeSend(event: any) {
        // Kullanıcı şifresini veya token'ını gönderme
        if (event.request?.headers) {
          delete event.request.headers["Authorization"];
        }
        return event;
      },
    });

    isSentryEnabled = true;
    if (__DEV__) {
      console.log("[Sentry] ✅ Başlatıldı");
    }
  } catch (error) {
    // @sentry/react-native kurulu değilse sessizce geç
    if (__DEV__) {
      console.log("[Sentry] SDK bulunamadı, devre dışı kalacak:", error);
    }
  }
}

/**
 * Hata yakala ve Sentry'ye gönder
 */
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
): void {
  if (!isSentryEnabled || !Sentry) {
    // Sentry yoksa en azından console'a logla
    if (__DEV__) {
      console.error("[Sentry:Fallback]", error, context);
    }
    return;
  }

  try {
    if (context) {
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  } catch {
    // Sentry çağrısının kendisi hata verirse sessizce geç
  }
}

/**
 * Mesaj gönder (error olmayan ama önemli durumlar)
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
): void {
  if (!isSentryEnabled || !Sentry) return;
  try {
    Sentry.captureMessage(message, level);
  } catch {
    // Silent fallback
  }
}

/**
 * Kullanıcı bilgisini Sentry'ye set et (login sonrası çağrılmalı)
 */
export function setUser(user: {
  id: number | string;
  username?: string;
  email?: string;
} | null): void {
  if (!isSentryEnabled || !Sentry) return;
  try {
    Sentry.setUser(
      user
        ? {
            id: String(user.id),
            username: user.username,
            email: user.email,
          }
        : null
    );
  } catch {
    // Silent fallback
  }
}

/**
 * Breadcrumb ekle (hata öncesi kullanıcı aksiyonlarını izle)
 */
export function addBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, any>
): void {
  if (!isSentryEnabled || !Sentry) return;
  try {
    Sentry.addBreadcrumb({
      category,
      message,
      data,
      level: "info",
    });
  } catch {
    // Silent fallback
  }
}
