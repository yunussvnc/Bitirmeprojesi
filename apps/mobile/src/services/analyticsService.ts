/**
 * Analytics Service — Provider-Agnostic Kullanıcı Analitik Takibi
 *
 * Munia felsefesiyle hafif JSON paketleme ve batch queue ile çalışır.
 * Şimdi console'a log atar, ileride PostHog/Mixpanel SDK bağlanabilir.
 *
 * Kullanım:
 *   analytics.track("venue_click", { venue_id: 42, venue_name: "Kadıköy Coffee" });
 *   analytics.screen("HomeScreen");
 *   analytics.identify(userId, { username: "ali" });
 *
 * @module services/analyticsService
 */

import { logger } from "@/src/utils/logger";

// --- Event Tipleri ---
export type AnalyticsEvent = {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
};

// --- Konfigürasyon ---
const BATCH_SIZE = 10; // Bu kadar event biriktiğinde flush
const FLUSH_INTERVAL_MS = 30000; // 30 saniyede bir flush
const MAX_QUEUE_SIZE = 100; // Kuyruk taşması koruması

// --- Batch Queue ---
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let currentUserId: string | null = null;
let currentUserTraits: Record<string, any> = {};

/**
 * Analitik sağlayıcıya event'leri gönder (placeholder — PostHog/Mixpanel buraya bağlanır)
 */
async function sendToProvider(events: AnalyticsEvent[]): Promise<void> {
  // TODO: PostHog veya Mixpanel SDK bağlantısı
  // Örnek PostHog:
  //   const posthog = require('posthog-react-native');
  //   events.forEach(e => posthog.capture(e.event, e.properties));

  // Şimdilik development'da console'a logla
  if (__DEV__) {
    console.log(
      `[Analytics] 📊 Flushing ${events.length} event(s):`,
      events.map((e) => `${e.event}(${JSON.stringify(e.properties || {})})`)
    );
  }
}

/**
 * Kuyruğu temizle ve sağlayıcıya gönder
 */
async function flush(): Promise<void> {
  if (eventQueue.length === 0) return;

  const batch = [...eventQueue];
  eventQueue = [];

  try {
    await sendToProvider(batch);
  } catch (error) {
    // Gönderilemezse kuyruğa geri koy (max size kontrolüyle)
    eventQueue = [...batch, ...eventQueue].slice(0, MAX_QUEUE_SIZE);
    if (__DEV__) {
      console.warn("[Analytics] Flush başarısız, kuyrukta bekletiliyor");
    }
  }
}

/**
 * Auto-flush timer'ı başlat
 */
function ensureFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flush, FLUSH_INTERVAL_MS);
}

// --- Public API ---

export const analytics = {
  /**
   * Kullanıcı aksiyonu kaydet
   * Örnek: analytics.track("venue_click", { venue_id: 42 })
   */
  track(event: string, properties?: Record<string, any>): void {
    const enrichedProps = {
      ...properties,
      user_id: currentUserId,
      timestamp_iso: new Date().toISOString(),
    };

    eventQueue.push({
      event,
      properties: enrichedProps,
      timestamp: Date.now(),
    });

    // Batch size'a ulaştıysa flush
    if (eventQueue.length >= BATCH_SIZE) {
      flush();
    }

    ensureFlushTimer();
  },

  /**
   * Sayfa görüntülemesi kaydet
   * Örnek: analytics.screen("HomeScreen")
   */
  screen(screenName: string, properties?: Record<string, any>): void {
    this.track("screen_view", {
      screen_name: screenName,
      ...properties,
    });
  },

  /**
   * Kullanıcıyı tanımla (login sonrası)
   * Örnek: analytics.identify("123", { username: "ali" })
   */
  identify(userId: string | number, traits?: Record<string, any>): void {
    currentUserId = String(userId);
    currentUserTraits = traits || {};

    this.track("user_identified", {
      ...currentUserTraits,
    });

    if (__DEV__) {
      console.log(`[Analytics] 👤 Kullanıcı tanımlandı: ${currentUserId}`);
    }
  },

  /**
   * Kullanıcı oturumunu temizle (logout)
   */
  reset(): void {
    flush(); // Kalan event'leri gönder
    currentUserId = null;
    currentUserTraits = {};
  },

  /**
   * Kuyruğu zorla temizle
   */
  flush,

  /**
   * Timer'ı durdur (app arka plana geçerken)
   */
  pause(): void {
    if (flushTimer) {
      clearInterval(flushTimer);
      flushTimer = null;
    }
    flush(); // Kalan event'leri gönder
  },

  /**
   * Timer'ı yeniden başlat (app ön plana gelirken)
   */
  resume(): void {
    ensureFlushTimer();
  },
};

// --- Predefined Event İsimleri (Type Safety) ---
export const AnalyticsEvents = {
  // Mekan
  VENUE_CLICK: "venue_click",
  VENUE_FAVORITE: "venue_favorite",
  VENUE_REVIEW_STARTED: "venue_review_started",
  VENUE_REVIEW_COMPLETED: "venue_review_completed",

  // Gönderi
  POST_SHARE_STARTED: "post_share_started",
  POST_SHARE_COMPLETED: "post_share_completed",
  POST_SHARE_ABANDONED: "post_share_abandoned",
  POST_LIKE: "post_like",
  POST_COMMENT: "post_comment",

  // Sosyal
  FOLLOW_USER: "follow_user",
  UNFOLLOW_USER: "unfollow_user",
  DM_SENT: "dm_sent",
  COMMUNITY_ROOM_JOINED: "community_room_joined",

  // Navigasyon
  TAB_SWITCH: "tab_switch",
  SEARCH_PERFORMED: "search_performed",

  // Hata
  API_ERROR: "api_error",
  CRASH_RECOVERED: "crash_recovered",
} as const;
