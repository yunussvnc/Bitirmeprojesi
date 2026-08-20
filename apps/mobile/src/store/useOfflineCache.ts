/**
 * Offline-First Cache Store
 * 
 * Munia felsefesiyle optimize edilmiş çevrimdışı veri önbelleği.
 * Mekan ve feed verilerini AsyncStorage'da persist eder.
 * İnternet yokken cache'den gösterir, geldiğinde sessizce senkronize eder.
 * 
 * @module store/useOfflineCache
 */

import { mmkvStorage } from "@/src/utils/mmkvStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { logger } from "@/src/utils/logger";

// Cache süresi: 10 dakika (milisaniye)
const STALE_TIME_MS = 10 * 60 * 1000;

export type CachedPlace = {
  id: number;
  name: string;
  address?: string;
  city?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
  average_rating?: number;
  photo_url?: string;
  distance_km?: number;
};

export type CachedPost = {
  id: number;
  user_id: number;
  content?: string;
  post_type?: string;
  created_at?: string;
  media?: { media_url: string; media_type: string }[];
  user?: { id: number; username?: string; avatar_url?: string };
};

type OfflineCacheState = {
  // Mekan verileri
  cachedNearbyPlaces: CachedPlace[];
  cachedPopularPlaces: CachedPlace[];
  nearbyLastSync: number | null;
  popularLastSync: number | null;

  // Feed verileri
  cachedFeedPosts: CachedPost[];
  feedLastSync: number | null;

  // Kullanıcı konumu (son bilinen)
  lastKnownLat: number | null;
  lastKnownLng: number | null;

  // Durum
  isSyncing: boolean;

  // Stale kontrolü
  isNearbyStale: () => boolean;
  isPopularStale: () => boolean;
  isFeedStale: () => boolean;

  // Cache güncelleme
  setCachedNearbyPlaces: (places: CachedPlace[]) => void;
  setCachedPopularPlaces: (places: CachedPlace[]) => void;
  setCachedFeedPosts: (posts: CachedPost[]) => void;
  setLastKnownLocation: (lat: number, lng: number) => void;
  setSyncing: (syncing: boolean) => void;

  // Senkronizasyon
  syncNearbyPlaces: (apiBaseUrl: string, token: string | null) => Promise<void>;
  syncPopularPlaces: (apiBaseUrl: string, token: string | null) => Promise<void>;
  syncFeed: (apiBaseUrl: string, token: string | null) => Promise<void>;

  // Temizleme
  clearCache: () => void;
};

export const useOfflineCache = create<OfflineCacheState>()(
  persist(
    (set, get) => ({
      cachedNearbyPlaces: [],
      cachedPopularPlaces: [],
      nearbyLastSync: null,
      popularLastSync: null,
      cachedFeedPosts: [],
      feedLastSync: null,
      lastKnownLat: null,
      lastKnownLng: null,
      isSyncing: false,

      isNearbyStale: () => {
        const { nearbyLastSync } = get();
        if (!nearbyLastSync) return true;
        return Date.now() - nearbyLastSync > STALE_TIME_MS;
      },

      isPopularStale: () => {
        const { popularLastSync } = get();
        if (!popularLastSync) return true;
        return Date.now() - popularLastSync > STALE_TIME_MS;
      },

      isFeedStale: () => {
        const { feedLastSync } = get();
        if (!feedLastSync) return true;
        return Date.now() - feedLastSync > STALE_TIME_MS;
      },

      setCachedNearbyPlaces: (places) =>
        set({ cachedNearbyPlaces: places, nearbyLastSync: Date.now() }),

      setCachedPopularPlaces: (places) =>
        set({ cachedPopularPlaces: places, popularLastSync: Date.now() }),

      setCachedFeedPosts: (posts) =>
        set({ cachedFeedPosts: posts, feedLastSync: Date.now() }),

      setLastKnownLocation: (lat, lng) =>
        set({ lastKnownLat: lat, lastKnownLng: lng }),

      setSyncing: (syncing) => set({ isSyncing: syncing }),

      syncNearbyPlaces: async (apiBaseUrl, token) => {
        const { lastKnownLat, lastKnownLng, isNearbyStale } = get();
        if (!isNearbyStale() || !lastKnownLat || !lastKnownLng) return;

        try {
          set({ isSyncing: true });
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(
            `${apiBaseUrl}/places/nearby?lat=${lastKnownLat}&lng=${lastKnownLng}&radius=5&page_size=50`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            const places: CachedPlace[] = (data.items || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              address: p.address,
              city: p.city,
              category: p.category,
              latitude: p.latitude,
              longitude: p.longitude,
              average_rating: p.average_rating,
              photo_url: p.photo_url,
              distance_km: p.distance_km,
            }));
            set({ cachedNearbyPlaces: places, nearbyLastSync: Date.now() });
            logger.info(`[OfflineCache] ${places.length} yakın mekan cache'lendi`);
          }
        } catch (error) {
          logger.warn("[OfflineCache] Nearby sync başarısız (muhtemelen offline)");
        } finally {
          set({ isSyncing: false });
        }
      },

      syncPopularPlaces: async (apiBaseUrl, token) => {
        const { isPopularStale } = get();
        if (!isPopularStale()) return;

        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`${apiBaseUrl}/places/popular?page_size=30`, { headers });
          if (res.ok) {
            const data = await res.json();
            const places: CachedPlace[] = (data.items || []).map((p: any) => ({
              id: p.id,
              name: p.name,
              address: p.address,
              city: p.city,
              category: p.category,
              latitude: p.latitude,
              longitude: p.longitude,
              average_rating: p.average_rating,
              photo_url: p.photo_url,
            }));
            set({ cachedPopularPlaces: places, popularLastSync: Date.now() });
            logger.info(`[OfflineCache] ${places.length} popüler mekan cache'lendi`);
          }
        } catch {
          logger.warn("[OfflineCache] Popular sync başarısız");
        }
      },

      syncFeed: async (apiBaseUrl, token) => {
        const { isFeedStale } = get();
        if (!isFeedStale()) return;

        try {
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch(`${apiBaseUrl}/feed?page_size=30`, { headers });
          if (res.ok) {
            const data = await res.json();
            // Munia hafif JSON paketleme — sadece gerekli alanlar
            const posts: CachedPost[] = (data.items || []).map((p: any) => ({
              id: p.id,
              user_id: p.user_id,
              content: p.content,
              post_type: p.post_type,
              created_at: p.created_at,
              media: p.media?.slice(0, 3), // Max 3 medya (veri tasarrufu)
              user: p.user ? { id: p.user.id, username: p.user.username, avatar_url: p.user.avatar_url } : undefined,
            }));
            set({ cachedFeedPosts: posts, feedLastSync: Date.now() });
            logger.info(`[OfflineCache] ${posts.length} post cache'lendi`);
          }
        } catch {
          logger.warn("[OfflineCache] Feed sync başarısız");
        }
      },

      clearCache: () =>
        set({
          cachedNearbyPlaces: [],
          cachedPopularPlaces: [],
          cachedFeedPosts: [],
          nearbyLastSync: null,
          popularLastSync: null,
          feedLastSync: null,
        }),
    }),
    {
      name: "asemos-offline-cache",
      storage: createJSONStorage(() => mmkvStorage),
      // Sadece veri alanlarını persist et (fonksiyonları değil)
      partialize: (state) => ({
        cachedNearbyPlaces: state.cachedNearbyPlaces,
        cachedPopularPlaces: state.cachedPopularPlaces,
        nearbyLastSync: state.nearbyLastSync,
        popularLastSync: state.popularLastSync,
        cachedFeedPosts: state.cachedFeedPosts,
        feedLastSync: state.feedLastSync,
        lastKnownLat: state.lastKnownLat,
        lastKnownLng: state.lastKnownLng,
      }),
    }
  )
);
