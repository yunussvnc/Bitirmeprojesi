/**
 * Geofence Store
 * 
 * Geo-fence durumunu ve favori mekan koordinatlarını yönetir.
 * Spam koruması: Aynı mekan için gün içinde max 1 bildirim.
 * 
 * @module store/useGeofenceStore
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type GeofencePlace = {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  campaignText?: string;
};

type GeofenceState = {
  // Geo-fence ayarları
  isGeofenceEnabled: boolean;
  defaultRadiusMeters: number; // Varsayılan yarıçap (metre)

  // İzlenecek mekanlar (favori + kampanyalı)
  watchedPlaces: GeofencePlace[];

  // Spam koruması: Son tetiklenen bildirimler
  // key: "placeId:YYYY-MM-DD", value: true
  triggeredToday: Record<string, boolean>;

  // Ayarlar
  setGeofenceEnabled: (enabled: boolean) => void;
  setDefaultRadius: (radius: number) => void;

  // Mekan yönetimi
  addWatchedPlace: (place: GeofencePlace) => void;
  removeWatchedPlace: (placeId: number) => void;
  setWatchedPlaces: (places: GeofencePlace[]) => void;

  // Spam kontrolü
  hasTriggeredToday: (placeId: number) => boolean;
  markAsTriggered: (placeId: number) => void;
  clearExpiredTriggers: () => void;
};

export const useGeofenceStore = create<GeofenceState>()(
  persist(
    (set, get) => ({
      isGeofenceEnabled: false,
      defaultRadiusMeters: 100,
      watchedPlaces: [],
      triggeredToday: {},

      setGeofenceEnabled: (enabled) => set({ isGeofenceEnabled: enabled }),
      setDefaultRadius: (radius) => set({ defaultRadiusMeters: radius }),

      addWatchedPlace: (place) =>
        set((state) => {
          const exists = state.watchedPlaces.find((p) => p.id === place.id);
          if (exists) return state;
          return { watchedPlaces: [...state.watchedPlaces, place] };
        }),

      removeWatchedPlace: (placeId) =>
        set((state) => ({
          watchedPlaces: state.watchedPlaces.filter((p) => p.id !== placeId),
        })),

      setWatchedPlaces: (places) => set({ watchedPlaces: places }),

      hasTriggeredToday: (placeId) => {
        const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const key = `${placeId}:${today}`;
        return !!get().triggeredToday[key];
      },

      markAsTriggered: (placeId) => {
        const today = new Date().toISOString().split("T")[0];
        const key = `${placeId}:${today}`;
        set((state) => ({
          triggeredToday: { ...state.triggeredToday, [key]: true },
        }));
      },

      clearExpiredTriggers: () => {
        const today = new Date().toISOString().split("T")[0];
        set((state) => {
          const fresh: Record<string, boolean> = {};
          for (const key of Object.keys(state.triggeredToday)) {
            if (key.endsWith(today)) {
              fresh[key] = true;
            }
          }
          return { triggeredToday: fresh };
        });
      },
    }),
    {
      name: "asemos-geofence",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isGeofenceEnabled: state.isGeofenceEnabled,
        defaultRadiusMeters: state.defaultRadiusMeters,
        watchedPlaces: state.watchedPlaces,
        triggeredToday: state.triggeredToday,
      }),
    }
  )
);
