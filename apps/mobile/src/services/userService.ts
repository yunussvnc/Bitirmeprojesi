import { apiGet, apiPost, apiPut } from "@/src/utils/apiClient";
import type { Post } from "./feedService";

export type UserStats = {
  post_count: number;
  review_count: number;
  visit_count: number;
  visits_this_month: number;
  favorite_category: string | null;
  favorite_region: string | null;
};

export type UserProfile = {
  id: number;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  followers_count: number;
  following_count: number;
  friends_count: number;
  place_follow_count: number; // Takip edilen mekan sayısı
  is_following: boolean;
  follow_status: 'pending' | 'accepted' | null;
  is_private?: boolean;
};

/** Takipçi/takip/arkadaş listeleri için tip */
export type UserSummary = {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_following: boolean;
  follow_status: 'pending' | 'accepted' | null;
  is_private: boolean;
};

export async function getUserProfile(userId: number): Promise<UserProfile> {
  return apiGet<UserProfile>(`/users/${userId}`);
}

export async function toggleFollow(userId: number): Promise<{ status: string | null; followers_count: number; friends_count: number }> {
  return apiPost<{ status: string | null; followers_count: number; friends_count: number }>(`/users/${userId}/follow`);
}

export async function acceptFollowRequest(userId: number): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/users/${userId}/follow/accept`);
}

export async function rejectFollowRequest(userId: number): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/users/${userId}/follow/reject`);
}

export async function getUserStats(userId: number): Promise<UserStats> {
  return apiGet<UserStats>(`/users/${userId}/stats`);
}

export type UserPostsResponse = {
  items: Post[];
  total: number;
  page: number;
  page_size: number;
};

export async function getUserPosts(
  userId: number,
  page = 1,
  pageSize = 30
): Promise<UserPostsResponse> {
  return apiGet<UserPostsResponse>(`/users/${userId}/posts?page=${page}&page_size=${pageSize}`);
}

export type NetworkResponse = {
  items: UserSummary[];
  total: number;
  page: number;
  page_size: number;
};

export async function getFollowers(userId: number, page = 1, pageSize = 20): Promise<NetworkResponse> {
  return apiGet<NetworkResponse>(`/users/${userId}/followers?page=${page}&page_size=${pageSize}`);
}

export async function getFollowing(userId: number, page = 1, pageSize = 20): Promise<NetworkResponse> {
  return apiGet<NetworkResponse>(`/users/${userId}/following?page=${page}&page_size=${pageSize}`);
}

export async function getFriends(userId: number, page = 1, pageSize = 20): Promise<NetworkResponse> {
  return apiGet<NetworkResponse>(`/users/${userId}/friends?page=${page}&page_size=${pageSize}`);
}

export type StoryHiddenUsersResponse = {
  hidden_users: UserSummary[];
};

export async function getHiddenStoryUsers(): Promise<StoryHiddenUsersResponse> {
  return apiGet<StoryHiddenUsersResponse>(`/users/me/hidden-story-users`);
}

export async function updateHiddenStoryUsers(hidden_user_ids: number[]): Promise<StoryHiddenUsersResponse> {
  return apiPost<StoryHiddenUsersResponse>(`/users/me/hidden-story-users`, { hidden_user_ids });
}

export async function getTaggedPosts(
  userId: number,
  page = 1,
  pageSize = 30
): Promise<UserPostsResponse> {
  return apiGet<UserPostsResponse>(`/users/${userId}/tagged-posts?page=${page}&page_size=${pageSize}`);
}

export type NotificationSubscriptionResponse = {
  notify_posts: boolean;
  notify_stories: boolean;
};

export async function getNotificationSubscription(targetUserId: number): Promise<NotificationSubscriptionResponse> {
  return apiGet<NotificationSubscriptionResponse>(`/users/${targetUserId}/notification-subscriptions`);
}

export async function updateNotificationSubscription(
  targetUserId: number,
  notifyOnPost: boolean,
  notifyOnStory: boolean
): Promise<NotificationSubscriptionResponse> {
  return apiPut<NotificationSubscriptionResponse>(`/users/${targetUserId}/notification-subscriptions`, {
    notify_posts: notifyOnPost,
    notify_stories: notifyOnStory,
  });
}
