import { mmkvStorage } from "@/src/utils/mmkvStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AuthUser } from "@/src/services/authService";
import { useMessagesStore } from "./useMessagesStore";
import { useChatMessagesStore } from "./useChatMessagesStore";
import { useNotificationStore } from "./useNotificationStore";
import {
  saveTokens as secureSaveTokens,
  getTokens as secureGetTokens,
  clearTokens as secureClearTokens,
} from "@/src/utils/secureStorage";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  hydrated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
  setHydrated: (v: boolean) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setTokens: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
        // Token'ları Keychain/Keystore'a da kaydet
        secureSaveTokens(access, refresh);
      },

      setUser: (user) => set({ user }),

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        // Keychain/Keystore'dan token'ları sil
        secureClearTokens();
        
        // Merkezi çıkış (logout) işleminde, eski verilerin diğer hesaplarda görünmesini
        // engellemek için yerel önbellekleri (store) temizle.
        useMessagesStore.getState().clearStore();
        useChatMessagesStore.getState().clearStore();
        useNotificationStore.setState({ notifications: [], followRequests: [], unreadCount: 0 });
      },

      setHydrated: (v) => set({ hydrated: v }),
    }),
    {
      name: "auth-store-v2",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        // Token'lar artık SecureStore'da — MMKV'de sadece user bilgisi
        user: state.user,
      }),
      onRehydrateStorage: () => async (state) => {
        if (state) {
          // MMKV'den user geldi, şimdi SecureStore'dan token'ları al
          try {
            const { accessToken, refreshToken } = await secureGetTokens();
            if (accessToken && refreshToken) {
              state.setTokens(accessToken, refreshToken);
            }
          } catch {
            // SecureStore okunamazsa sessizce devam et
          }
          state.setHydrated(true);
        }
      },
    }
  )
);
