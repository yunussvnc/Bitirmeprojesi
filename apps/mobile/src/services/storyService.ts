import { apiGet, apiPost, apiDelete, apiPatch } from "@/src/utils/apiClient";
import type { UserSummary } from "./userService";

export type Story = {
  id: number;
  user_id: number;
  place_id?: number | null;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  is_close_friends: boolean;
  is_archived: boolean;
  mentioned_user_ids?: number[] | null;
  link_type?: string | null;   // 'place', 'profile', 'event'
  link_id?: number | null;
  link_label?: string | null;
  created_at: string;
  expires_at: string;
  author?: {
    id: number;
    username?: string;
    first_name?: string;
    avatar_url?: string;
  };
  place?: {
    id: number;
    name: string;
    category?: string;
    thumbnail_url?: string;
    hero_image_url?: string;
  };
  view_count?: number;
  is_viewed?: boolean;
  reaction_count?: number;
  my_reaction?: string | null;
};

export type PaginatedStories = {
  items: Story[];
  total: number;
  page: number;
  page_size: number;
};

export type CreateStoryPayload = {
  place_id?: number | null;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url?: string;
  is_close_friends?: boolean;
  mentioned_user_ids?: number[];
  link_type?: string;
  link_id?: number;
  link_label?: string;
};

export type StoryViewAnalyticsPayload = {
  watch_duration_seconds: number;
  did_visit_profile?: boolean;
  did_visit_place?: boolean;
  source?: string;
};

export type StoryViewerItem = {
  user: UserSummary;
  viewed_at: string;
  watch_duration_seconds: number;
  did_visit_profile: boolean;
  did_visit_place: boolean;
  source?: string | null;
  reaction?: string | null;
};

export type StoryViewerList = {
  items: StoryViewerItem[];
  total: number;
  total_watch_seconds: number;
  profile_visit_count: number;
  place_visit_count: number;
};

export type FeedStoriesFilter = "all" | "following";

// ── CRUD ──────────────────────────────────────────────────────────────────

export async function getPlaceStories(
  placeId: number,
  page = 1,
  pageSize = 50
): Promise<PaginatedStories> {
  return apiGet<PaginatedStories>(
    `/places/${placeId}/stories?page=${page}&page_size=${pageSize}`
  );
}

export async function getFeedStories(
  page = 1,
  pageSize = 50,
  filter: FeedStoriesFilter = "all"
): Promise<PaginatedStories> {
  return apiGet<PaginatedStories>(
    `/feed/stories?page=${page}&page_size=${pageSize}&filter=${filter}`
  );
}

export async function createStory(payload: CreateStoryPayload): Promise<Story> {
  return apiPost<Story>("/stories", payload);
}

export async function getUserStories(
  userId: number,
  page = 1,
  pageSize = 50
): Promise<PaginatedStories> {
  return apiGet<PaginatedStories>(
    `/users/${userId}/stories?page=${page}&page_size=${pageSize}`
  );
}

/** Kullanıcının arşivlenmiş hikayelerini getir */
export async function getMyStoryArchive(
  page = 1,
  pageSize = 30
): Promise<PaginatedStories> {
  return apiGet<PaginatedStories>(`/me/stories/archive?page=${page}&page_size=${pageSize}`);
}

// ── View / Analytics ───────────────────────────────────────────────────────

/** Hikaye açıldığında ilk görüntüleme kaydı */
export async function recordStoryView(
  storyId: number,
  source?: string
): Promise<{ ok: boolean; recorded: boolean }> {
  const qs = source ? `?source=${source}` : '';
  return apiPost(`/stories/${storyId}/view${qs}`);
}

/** Hikaye kapanınca analitik verileri güncelle (izleme süresi, profil/mekan tıklaması) */
export async function updateStoryViewAnalytics(
  storyId: number,
  data: StoryViewAnalyticsPayload
): Promise<{ ok: boolean }> {
  return apiPatch<{ ok: boolean }>(`/stories/${storyId}/view`, data);
}

/** Hikayeyi görüntüleyenlerin listesini al */
export async function getStoryViewers(storyId: number): Promise<StoryViewerList> {
  return apiGet<StoryViewerList>(`/stories/${storyId}/viewers`);
}

// ── Reactions ─────────────────────────────────────────────────────────────

export const STORY_EMOJIS = ['❤️', '🔥', '😍', '👏', '😂'] as const;
export type StoryEmoji = typeof STORY_EMOJIS[number];

/** Hikayeye emoji tepkisi gönder (aynı emoji tekrar gönderilirse kaldırılır) */
export async function reactToStory(
  storyId: number,
  emoji: StoryEmoji
): Promise<{ ok: boolean; action: 'added' | 'updated' | 'removed'; emoji: string }> {
  return apiPost(`/stories/${storyId}/react`, { emoji });
}

/** Tepkiyi kaldır */
export async function removeStoryReaction(
  storyId: number
): Promise<{ ok: boolean }> {
  return apiDelete<{ ok: boolean }>(`/stories/${storyId}/react`);
}

// ── Reply ──────────────────────────────────────────────────────────────────

/** Bir hikayeye metin yanıtı gönder — DM olarak kaydolur */
export async function replyToStory(
  storyId: number,
  text: string
): Promise<{ ok: boolean; conversation_id: number; message_id: number }> {
  return apiPost(`/stories/${storyId}/reply`, { text });
}
