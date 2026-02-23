import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type PresenceState = {
  activePlaceId: string | null;
  activePlaceName: string | null;
  activeUntil: number | null; // epoch ms
  qrVerified: boolean;

  startSession: (placeId: string, durationMs?: number) => void;
  endSession: () => void;
  setQrVerified: (verified: boolean) => void;
  setActivePlaceName: (name: string) => void;

  isActive: (placeId: string) => boolean;
  isSessionActive: () => boolean;
  remainingMs: () => number;
  remainingText: () => string;

  cleanupIfExpired: () => void;
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export const usePresence = create<PresenceState>()(
  persist(
    (set, get) => ({
      activePlaceId: null,
      activePlaceName: null,
      activeUntil: null,
      qrVerified: false,

      startSession: (placeId, durationMs = TWO_HOURS_MS) => {
        const now = Date.now();
        set({
          activePlaceId: String(placeId),
          activeUntil: now + durationMs,
        });
      },

      endSession: () => {
        set({
          activePlaceId: null,
          activePlaceName: null,
          activeUntil: null,
          qrVerified: false,
        });
      },

      setQrVerified: (verified) => {
        set({ qrVerified: verified });
      },

      setActivePlaceName: (name) => {
        set({ activePlaceName: name });
      },

      cleanupIfExpired: () => {
        const { activeUntil } = get();
        if (!activeUntil) return;
        if (Date.now() >= activeUntil) {
          set({
            activePlaceId: null,
            activePlaceName: null,
            activeUntil: null,
            qrVerified: false,
          });
        }
      },

      isActive: (placeId) => {
        const { activePlaceId, activeUntil } = get();
        if (!activePlaceId || !activeUntil) return false;
        if (Date.now() >= activeUntil) return false;
        return String(placeId) === activePlaceId;
      },

      isSessionActive: () => {
        const { activePlaceId, activeUntil } = get();
        if (!activePlaceId || !activeUntil) return false;
        return Date.now() < activeUntil;
      },

      remainingMs: () => {
        const { activeUntil } = get();
        if (!activeUntil) return 0;
        const ms = activeUntil - Date.now();
        return ms > 0 ? ms : 0;
      },

      remainingText: () => {
        const ms = get().remainingMs();
        if (!ms) return "00:00";

        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const h = Math.floor(minutes / 60);
        const m = minutes % 60;

        if (h > 0) return `${h}:${pad2(m)}:${pad2(seconds)}`;
        return `${m}:${pad2(seconds)}`;
      },
    }),
    {
      name: "presence-v2",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);