/**
 * Notification Store (Novu Provider Pattern)
 *
 * Merkezi bildirim state yönetimi — Novu'nun Provider mantığından ilham alır.
 * - notifications: Tüm bildirimler
 * - followRequests: Filtrelenmiş pending takip istekleri
 * - unreadCount: Badge sayacı
 * - Digest gruplama: Aynı post'a gelen like/comment'leri birleştirir
 * - Optimistic UI: Accept/reject anında yansır
 */

import { create } from 'zustand';
import type { Notification } from '@/src/services/notificationService';
import {
  getNotifications,
  getFollowRequests,
  getUnreadCount,
  markNotificationsRead,
  markSingleRead,
  deleteNotification as apiDeleteNotification,
} from '@/src/services/notificationService';
import { acceptFollowRequest, rejectFollowRequest } from '@/src/services/userService';
import { logger } from '@/src/utils/logger';

// ── Types ───────────────────────────────────────────────────

type NotificationStoreState = {
  notifications: Notification[];
  followRequests: Notification[];
  unreadCount: number;
  loading: boolean;
  followRequestsLoading: boolean;

  // Actions
  loadNotifications: (page?: number) => Promise<void>;
  loadFollowRequests: (page?: number) => Promise<void>;
  syncUnreadCount: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  removeNotification: (id: number) => Promise<void>;

  // Follow request actions (Dummygram optimistic pattern)
  acceptRequest: (actorId: number, notificationId: number) => Promise<void>;
  rejectRequest: (actorId: number, notificationId: number) => Promise<void>;

  // WebSocket integration (Novu real-time)
  handleWebSocketMessage: (data: any) => void;

  // Reset
  reset: () => void;
};

// ── Store ───────────────────────────────────────────────────

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  followRequests: [],
  unreadCount: 0,
  loading: false,
  followRequestsLoading: false,

  // ── Tüm bildirimleri yükle ────────────────────────────
  async loadNotifications(page = 1) {
    set({ loading: true });
    try {
      const res = await getNotifications(page, 30);
      // Deduplicate by id (prevents WS + REST race duplicates)
      const seen = new Set<number>();
      const unique = res.items.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
      set({ notifications: unique });
      // Mark all read on open
      if (unique.length > 0) {
        await markNotificationsRead();
        set({ unreadCount: 0 });
      }
    } catch (e) {
      logger.error('[NotificationStore] loadNotifications failed:', e);
    } finally {
      set({ loading: false });
    }
  },

  // ── Takip isteklerini yükle (Novu ayrı kanal) ────────
  async loadFollowRequests(page = 1) {
    set({ followRequestsLoading: true });
    try {
      const res = await getFollowRequests(page, 30);
      set({ followRequests: res.items });
    } catch (e) {
      logger.error('[NotificationStore] loadFollowRequests failed:', e);
    } finally {
      set({ followRequestsLoading: false });
    }
  },

  // ── Unread count senkronize et ────────────────────────
  async syncUnreadCount() {
    try {
      const res = await getUnreadCount();
      set({ unreadCount: res.count });
    } catch (e) {
      logger.error('[NotificationStore] syncUnreadCount failed:', e);
    }
  },

  // ── Tümünü okundu yap ─────────────────────────────────
  async markAllRead() {
    try {
      await markNotificationsRead();
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      }));
    } catch (e) {
      logger.error('[NotificationStore] markAllRead failed:', e);
    }
  },

  // ── Tekil okundu ──────────────────────────────────────
  async markRead(id: number) {
    // Optimistic
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
    try {
      await markSingleRead(id);
    } catch (e) {
      logger.error('[NotificationStore] markRead failed:', e);
    }
  },

  // ── Tekil sil ─────────────────────────────────────────
  async removeNotification(id: number) {
    // Optimistic
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
      followRequests: s.followRequests.filter((n) => n.id !== id),
    }));
    try {
      await apiDeleteNotification(id);
    } catch (e) {
      logger.error('[NotificationStore] removeNotification failed:', e);
    }
  },

  // ── Takip isteğini kabul et (Dummygram optimistic) ────
  async acceptRequest(actorId: number, notificationId: number) {
    // Optimistic: remove from followRequests, convert in notifications to follow_accepted
    set((s) => ({
      notifications: s.notifications
        .map((n) =>
          n.id === notificationId ? { ...n, type: 'follow_accepted' } : n
        ),
      followRequests: s.followRequests.filter((n) => n.id !== notificationId),
    }));
    try {
      await acceptFollowRequest(actorId);
      // Reload both to sync server state
      get().loadFollowRequests();
    } catch (e) {
      // Revert on error
      logger.error('[NotificationStore] acceptRequest failed:', e);
      get().loadFollowRequests();
      get().loadNotifications();
    }
  },

  // ── Takip isteğini reddet (Dummygram optimistic) ──────
  async rejectRequest(actorId: number, notificationId: number) {
    // Optimistic: remove from both lists immediately
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== notificationId),
      followRequests: s.followRequests.filter((n) => n.id !== notificationId),
    }));
    try {
      await rejectFollowRequest(actorId);
      get().loadFollowRequests();
    } catch (e) {
      logger.error('[NotificationStore] rejectRequest failed:', e);
      get().loadFollowRequests();
      get().loadNotifications();
    }
  },

  // ── WebSocket mesajını işle (Novu real-time) ──────────
  handleWebSocketMessage(data: any) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;

      // Yeni bildirimi listenin başına ekle
      const newNotif: Notification = {
        id: parsed.id || Date.now(),
        user_id: parsed.user_id || 0,
        type: parsed.type || 'unknown',
        actor_id: parsed.actor_id,
        post_id: parsed.post_id,
        place_id: parsed.place_id,
        is_read: false,
        payload: parsed.payload,
        created_at: parsed.created_at || new Date().toISOString(),
        actor_username: undefined,
        actor_avatar: undefined,
        post_thumbnail: undefined,
        group_count: 0,
      };

      // Payload'dan zengin alanları parse et
      if (parsed.payload) {
        try {
          const p = typeof parsed.payload === 'string' ? JSON.parse(parsed.payload) : parsed.payload;
          newNotif.actor_username = p.actor_username;
          newNotif.actor_avatar = p.actor_avatar;
          newNotif.post_thumbnail = p.post_thumbnail;
        } catch { /* ignore */ }
      }

      // Deduplicate by id — prevent double-add from WS + HTTP fetch
      set((s) => {
        const alreadyExists = s.notifications.some((n) => n.id === newNotif.id);
        if (alreadyExists) return {}; // no-op
        return {
          notifications: [newNotif, ...s.notifications],
          unreadCount: s.unreadCount + 1,
          // Follow request → also add to followRequests list (deduplicated)
          followRequests: parsed.type === 'follow_request'
            ? (s.followRequests.some((n) => n.id === newNotif.id)
                ? s.followRequests
                : [newNotif, ...s.followRequests])
            : s.followRequests,
        };
      });
    } catch (e) {
      logger.error('[NotificationStore] handleWebSocketMessage failed:', e);
    }
  },

  // ── Reset ─────────────────────────────────────────────
  reset() {
    set({
      notifications: [],
      followRequests: [],
      unreadCount: 0,
      loading: false,
      followRequestsLoading: false,
    });
  },
}));
