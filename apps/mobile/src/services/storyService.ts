import { apiGet, apiPost } from "@/src/utils/apiClient";

export type Story = {
  id: number;
  user_id: number;
  place_id?: number | null;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  is_close_friends: boolean;
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
  };
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
};

export type FeedStoriesFilter = "all" | "following";

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

/** Bir hikayeye metin yanıtı gönder — DM olarak kaydolur */
export async function replyToStory(
  storyId: number,
  text: string
): Promise<{ ok: boolean; conversation_id: number; message_id: number }> {
  return apiPost(`/stories/${storyId}/reply`, { text });
}
