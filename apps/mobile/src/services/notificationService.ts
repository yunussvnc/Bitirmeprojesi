import { apiGet, apiPost, apiDelete } from "@/src/utils/apiClient";

// ── Munia-tarzı zengin bildirim tipi ──────────────────────────

export type Notification = {
  id: number;
  user_id: number;
  type: string;  // like, comment, follow, follow_request, follow_accepted, tag, mention
  actor_id: number;
  post_id?: number;
  place_id?: number;
  is_read: boolean;
  payload?: string | null;
  created_at: string;
  actor_username?: string;
  // Munia: Zengin payload alanları (backend'den parse edilmiş)
  actor_avatar?: string;
  post_thumbnail?: string;
  // Novu: Digest gruplama
  group_count?: number;  // "X, Y ve 3 kişi daha beğendi"
};

export type PaginatedNotifications = {
  items: Notification[];
  total: number;
  page: number;
  page_size: number;
};

// ── API Çağrıları ─────────────────────────────────────────────

/** Tüm bildirimler – sayfalı, N+1 optimize */
export async function getNotifications(
  page = 1,
  pageSize = 20
): Promise<PaginatedNotifications> {
  return apiGet<PaginatedNotifications>(
    `/notifications?page=${page}&page_size=${pageSize}`
  );
}

/** Novu ayrı kanal: Sadece takip istekleri */
export async function getFollowRequests(
  page = 1,
  pageSize = 20
): Promise<PaginatedNotifications> {
  return apiGet<PaginatedNotifications>(
    `/notifications/follow-requests?page=${page}&page_size=${pageSize}`
  );
}

/** Okunmamış bildirim sayısı (badge) */
export async function getUnreadCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>("/notifications/unread-count");
}

/** Tüm bildirimleri okundu yap */
export async function markNotificationsRead(): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/notifications/read");
}

/** Tekil bildirimi okundu yap */
export async function markSingleRead(id: number): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>(`/notifications/${id}/read`);
}

/** Tekil bildirimi sil */
export async function deleteNotification(id: number): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/notifications/${id}`);
}
