import { apiGet, apiPost } from "@/src/utils/apiClient";

export type Notification = {
  id: number;
  user_id: number;
  type: string;
  actor_id: number;
  post_id?: number;
  place_id?: number;
  is_read: boolean;
  created_at: string;
  actor_username?: string;
};

export type PaginatedNotifications = {
  items: Notification[];
  total: number;
  page: number;
  page_size: number;
};

export async function getNotifications(
  page = 1,
  pageSize = 20
): Promise<PaginatedNotifications> {
  return apiGet<PaginatedNotifications>(
    `/notifications?page=${page}&page_size=${pageSize}`
  );
}

export async function getUnreadCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>("/notifications/unread-count");
}

export async function markNotificationsRead(): Promise<{ ok: boolean }> {
  return apiPost<{ ok: boolean }>("/notifications/read");
}
