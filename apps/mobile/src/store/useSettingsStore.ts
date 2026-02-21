import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Hikaye, konum, kamera ve içerik tercihleri.
 * Instagram ayarları referans alınarak oluşturuldu.
 */

export type UploadQuality = 'high' | 'data_saver';
export type CameraToolbarSide = 'left' | 'right';

export type SettingsState = {
  // Hikaye
  storySaveToArchive: boolean;
  storySaveToCameraRoll: boolean;
  setStorySaveToArchive: (v: boolean) => void;
  setStorySaveToCameraRoll: (v: boolean) => void;

  // Harita / İçerik tercihleri
  mapShowStories: boolean;
  mapShowPosts: boolean;
  setMapShowStories: (v: boolean) => void;
  setMapShowPosts: (v: boolean) => void;

  // Medya kalitesi
  uploadQuality: UploadQuality;
  setUploadQuality: (v: UploadQuality) => void;

  // Kamera (hikaye/reels için gelecekte kullanılacak)
  cameraDefaultFront: boolean;
  cameraToolbarSide: CameraToolbarSide;
  setCameraDefaultFront: (v: boolean) => void;
  setCameraToolbarSide: (v: CameraToolbarSide) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      storySaveToArchive: true,
      storySaveToCameraRoll: false,
      setStorySaveToArchive: (v) => set({ storySaveToArchive: v }),
      setStorySaveToCameraRoll: (v) => set({ storySaveToCameraRoll: v }),

      mapShowStories: true,
      mapShowPosts: true,
      setMapShowStories: (v) => set({ mapShowStories: v }),
      setMapShowPosts: (v) => set({ mapShowPosts: v }),

      uploadQuality: 'high',
      setUploadQuality: (v) => set({ uploadQuality: v }),

      cameraDefaultFront: false,
      cameraToolbarSide: 'right',
      setCameraDefaultFront: (v) => set({ cameraDefaultFront: v }),
      setCameraToolbarSide: (v) => set({ cameraToolbarSide: v }),
    }),
    {
      name: "asemos-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
