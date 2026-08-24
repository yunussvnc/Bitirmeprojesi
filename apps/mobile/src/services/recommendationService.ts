import { apiGet, apiPost } from '@/src/utils/apiClient';
import type { UserSummary } from './feedService'; // or userService

export type RecommendedUser = UserSummary & {
  recommendation_reason: string;
  is_private?: boolean;
  follow_status?: string | null;
  last_name?: string;
};

export type RecommendationResponse = {
  items: RecommendedUser[];
};

export type ContactItem = {
  name: string | null;
  phone: string;
};

export async function syncContacts(contacts: ContactItem[]): Promise<{ message: string; count: number }> {
  return apiPost<{ message: string; count: number }>('/users/me/contacts/sync', { contacts });
}

export async function getFriendRecommendations(): Promise<RecommendationResponse> {
  return apiGet<RecommendationResponse>('/users/me/recommendations');
}
