import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { apiGet, apiPut } from "@/src/utils/apiClient";

/**
 * Uygulama genelinde kullanıcı tercihleri.
 * Hikaye, gizlilik, konum, kamera, içerik, mesaj, yorum, dil, filtre ayarları.
 * Backend senkronizasyonu: PUT /auth/me/preferences ile sunucuya persist edilir.
 */

export type UploadQuality = 'high' | 'auto' | 'data_saver';
export type CameraToolbarSide = 'left' | 'right';
export type Audience = 'everyone' | 'followers' | 'off';
export type AppLanguage = 'tr' | 'en';

type BackendPrefs = {
  is_private_account: boolean;
  default_comments_disabled: boolean;
  comment_allowed_audience: string;
  unknown_message_requests: boolean;
  story_reply_audience: string;
  show_read_receipts: boolean;
  story_save_to_archive: boolean;
  story_save_to_camera_roll: boolean;
  hide_offensive_words: boolean;
  hidden_words: string[];
  upload_quality: string;
  wifi_auto_high_quality: boolean;
  include_location_in_posts: boolean;
  language: string;
};

export type SettingsState = {
  // —— Hikaye ——
  storySaveToArchive: boolean;
  storySaveToCameraRoll: boolean;
  setStorySaveToArchive: (v: boolean) => void;
  setStorySaveToCameraRoll: (v: boolean) => void;

  // —— Harita / İçerik ——
  mapShowStories: boolean;
  mapShowPosts: boolean;
  setMapShowStories: (v: boolean) => void;
  setMapShowPosts: (v: boolean) => void;

  // —— Medya kalitesi ——
  uploadQuality: UploadQuality;
  wifiAutoHighQuality: boolean;
  setUploadQuality: (v: UploadQuality) => void;
  setWifiAutoHighQuality: (v: boolean) => void;

  // —— Kamera ——
  cameraDefaultFront: boolean;
  cameraToolbarSide: CameraToolbarSide;
  setCameraDefaultFront: (v: boolean) => void;
  setCameraToolbarSide: (v: CameraToolbarSide) => void;

  // —— Gizlilik ——
  isPrivateAccount: boolean;
  setIsPrivateAccount: (v: boolean) => void;

  // —— Yakın Arkadaşlar ——
  closeFriendIds: number[];
  toggleCloseFriend: (id: number) => void;

  // —— Yorum Kontrolleri ——
  defaultCommentsDisabled: boolean;
  commentAllowedAudience: Audience;
  setDefaultCommentsDisabled: (v: boolean) => void;
  setCommentAllowedAudience: (v: Audience) => void;

  // —— Mesaj Kontrolleri ——
  unknownMessageRequests: boolean;
  storyReplyAudience: Audience;
  showReadReceipts: boolean;
  setUnknownMessageRequests: (v: boolean) => void;
  setStoryReplyAudience: (v: Audience) => void;
  setShowReadReceipts: (v: boolean) => void;

  // —— Gizlenen Sözcükler ——
  hideOffensiveWords: boolean;
  hiddenWords: string[];
  setHideOffensiveWords: (v: boolean) => void;
  addHiddenWord: (word: string) => void;
  removeHiddenWord: (word: string) => void;

  // —— Dil ——
  language: AppLanguage;
  setLanguage: (v: AppLanguage) => void;

  // —— Konum ——
  includeLocationInPosts: boolean;
  setIncludeLocationInPosts: (v: boolean) => void;

  // —— Kısıtlı Hesaplar ——
  restrictedUserIds: number[];
  toggleRestrictedUser: (id: number) => void;

  // —— Backend Senkronizasyon ——
  syncWithBackend: () => Promise<void>;
  pushToBackend: () => Promise<void>;
  _isSyncing: boolean;
};

/** Backend'e tek seferli push yapmak için debounce timer */
let _pushDebounce: ReturnType<typeof setTimeout> | null = null;

function schedulePush() {
  if (_pushDebounce) clearTimeout(_pushDebounce);
  _pushDebounce = setTimeout(() => {
    useSettingsStore.getState().pushToBackend();
  }, 1500);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Hikaye
      storySaveToArchive: true,
      storySaveToCameraRoll: false,
      setStorySaveToArchive: (v) => { set({ storySaveToArchive: v }); schedulePush(); },
      setStorySaveToCameraRoll: (v) => { set({ storySaveToCameraRoll: v }); schedulePush(); },

      // Harita
      mapShowStories: true,
      mapShowPosts: true,
      setMapShowStories: (v) => set({ mapShowStories: v }),
      setMapShowPosts: (v) => set({ mapShowPosts: v }),

      // Medya
      uploadQuality: 'high',
      wifiAutoHighQuality: true,
      setUploadQuality: (v) => { set({ uploadQuality: v }); schedulePush(); },
      setWifiAutoHighQuality: (v) => { set({ wifiAutoHighQuality: v }); schedulePush(); },

      // Kamera
      cameraDefaultFront: false,
      cameraToolbarSide: 'right',
      setCameraDefaultFront: (v) => set({ cameraDefaultFront: v }),
      setCameraToolbarSide: (v) => set({ cameraToolbarSide: v }),

      // Gizlilik
      isPrivateAccount: false,
      setIsPrivateAccount: (v) => { set({ isPrivateAccount: v }); schedulePush(); },

      // Yakın Arkadaşlar
      closeFriendIds: [],
      toggleCloseFriend: (id) => {
        const ids = get().closeFriendIds;
        set({ closeFriendIds: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id] });
      },

      // Yorum
      defaultCommentsDisabled: false,
      commentAllowedAudience: 'everyone',
      setDefaultCommentsDisabled: (v) => { set({ defaultCommentsDisabled: v }); schedulePush(); },
      setCommentAllowedAudience: (v) => { set({ commentAllowedAudience: v }); schedulePush(); },

      // Mesaj
      unknownMessageRequests: true,
      storyReplyAudience: 'everyone',
      showReadReceipts: true,
      setUnknownMessageRequests: (v) => { set({ unknownMessageRequests: v }); schedulePush(); },
      setStoryReplyAudience: (v) => { set({ storyReplyAudience: v }); schedulePush(); },
      setShowReadReceipts: (v) => { set({ showReadReceipts: v }); schedulePush(); },

      // Gizlenen Sözcükler
      hideOffensiveWords: true,
      hiddenWords: [],
      setHideOffensiveWords: (v) => { set({ hideOffensiveWords: v }); schedulePush(); },
      addHiddenWord: (word) => {
        const w = word.trim().toLowerCase();
        if (!w) return;
        const current = get().hiddenWords;
        if (!current.includes(w)) { set({ hiddenWords: [...current, w] }); schedulePush(); }
      },
      removeHiddenWord: (word) => { set({ hiddenWords: get().hiddenWords.filter((w) => w !== word) }); schedulePush(); },

      // Dil
      language: 'tr',
      setLanguage: (v) => { set({ language: v }); schedulePush(); },

      // Konum
      includeLocationInPosts: true,
      setIncludeLocationInPosts: (v) => { set({ includeLocationInPosts: v }); schedulePush(); },

      // Kısıtlı
      restrictedUserIds: [],
      toggleRestrictedUser: (id) => {
        const ids = get().restrictedUserIds;
        set({ restrictedUserIds: ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id] });
      },

      // Backend Senkronizasyon
      _isSyncing: false,

      syncWithBackend: async () => {
        if (get()._isSyncing) return;
        set({ _isSyncing: true });
        try {
          const prefs = await apiGet<BackendPrefs>("/auth/me/preferences");
          set({
            isPrivateAccount: prefs.is_private_account,
            defaultCommentsDisabled: prefs.default_comments_disabled,
            commentAllowedAudience: prefs.comment_allowed_audience as Audience,
            unknownMessageRequests: prefs.unknown_message_requests,
            storyReplyAudience: prefs.story_reply_audience as Audience,
            showReadReceipts: prefs.show_read_receipts,
            storySaveToArchive: prefs.story_save_to_archive,
            storySaveToCameraRoll: prefs.story_save_to_camera_roll,
            hideOffensiveWords: prefs.hide_offensive_words,
            hiddenWords: prefs.hidden_words ?? [],
            uploadQuality: prefs.upload_quality as UploadQuality,
            wifiAutoHighQuality: prefs.wifi_auto_high_quality,
            includeLocationInPosts: prefs.include_location_in_posts,
            language: prefs.language as AppLanguage,
          });
        } catch {
          // İlk kullanımda backend'de kayıt olmayabilir, default'lar kullanılır
        } finally {
          set({ _isSyncing: false });
        }
      },

      pushToBackend: async () => {
        const s = get();
        try {
          await apiPut("/auth/me/preferences", {
            is_private_account: s.isPrivateAccount,
            default_comments_disabled: s.defaultCommentsDisabled,
            comment_allowed_audience: s.commentAllowedAudience,
            unknown_message_requests: s.unknownMessageRequests,
            story_reply_audience: s.storyReplyAudience,
            show_read_receipts: s.showReadReceipts,
            story_save_to_archive: s.storySaveToArchive,
            story_save_to_camera_roll: s.storySaveToCameraRoll,
            hide_offensive_words: s.hideOffensiveWords,
            hidden_words: s.hiddenWords,
            upload_quality: s.uploadQuality,
            wifi_auto_high_quality: s.wifiAutoHighQuality,
            include_location_in_posts: s.includeLocationInPosts,
            language: s.language,
          });
        } catch {
          // Sessiz başarısızlık — lokal durum korunur
        }
      },
    }),
    {
      name: "asemos-settings",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        // Fonksiyonları ve sync flag'ini persist etme
        const { syncWithBackend, pushToBackend, _isSyncing, ...rest } = state;
        const plainState: Record<string, any> = {};
        for (const [key, value] of Object.entries(rest)) {
          if (typeof value !== "function") plainState[key] = value;
        }
        return plainState as any;
      },
    }
  )
);
