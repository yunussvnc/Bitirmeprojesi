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
      name: "auth-storage",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        user: state.user,
        hydrated: state.hydrated,
        // accessToken ve refreshToken'ı MMKV'ye KESİNLİKLE yazma
        // Bunlar sadece expo-secure-store (Keychain/Keystore) içinde durmalı
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Rehydration sırasında secure store'dan tokenları yükle
          secureGetTokens().then((tokens) => {
            if (tokens.accessToken && tokens.refreshToken) {
              state.setTokens(tokens.accessToken, tokens.refreshToken);
            }
            state.setHydrated(true);
          });
        }
      },
    }
  )
);
