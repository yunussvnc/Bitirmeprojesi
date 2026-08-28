/**
 * Saved Service — Backend'den kayıtlı mekan/post yönetimi
 */

import { apiGet, apiPost, apiDelete } from "@/src/utils/apiClient";
import type { Place } from "./mekanService";

export type SavedToggleResponse = {
    saved: boolean;
};

export type PaginatedSavedPlaces = {
    items: Place[];
    total: number;
    page: number;
    page_size: number;
};

export type SavedPost = {
    id: number;
    user_id: number;
    caption: string;
    post_type: string;
    place_id: number | null;
    like_count: number;
    comment_count: number;
    created_at: string;
    media: { id: number; media_type: string; media_url: string }[];
    author?: { id: number; username: string; avatar_url: string | null };
    place?: { id: number; name: string; category: string | null } | null;
    is_liked?: boolean;
    is_saved?: boolean;
};

export type PaginatedSavedPosts = {
    items: SavedPost[];
    total: number;
    page: number;
    page_size: number;
};

/** Mekanı kaydet/kaldır (toggle) */
export async function toggleSavePlace(placeId: number): Promise<SavedToggleResponse> {
    return apiPost<SavedToggleResponse>(`/saved/places/${placeId}`);
}

/** Kayıtlı mekanlar listesi */
export async function getSavedPlaces(page = 1, pageSize = 20): Promise<PaginatedSavedPlaces> {
    return apiGet<PaginatedSavedPlaces>(`/saved/places?page=${page}&page_size=${pageSize}`);
}

/** Postu kaydet/kaldır (toggle) */
export async function toggleSavePost(postId: number): Promise<SavedToggleResponse> {
    return apiPost<SavedToggleResponse>(`/saved/posts/${postId}`);
}

/** Kayıtlı postlar listesi */
export async function getSavedPosts(page = 1, pageSize = 20): Promise<PaginatedSavedPosts> {
    return apiGet<PaginatedSavedPosts>(`/saved/posts?page=${page}&page_size=${pageSize}`);
}

/** Tüm kayıtlı mekanları temizle */
export async function clearSavedPlacesApi(): Promise<{ ok: boolean; message: string }> {
    return apiDelete<{ ok: boolean; message: string }>("/saved/places");
}

/** Tüm kayıtlı postları temizle */
export async function clearSavedPostsApi(): Promise<{ ok: boolean; message: string }> {
    return apiDelete<{ ok: boolean; message: string }>("/saved/posts");
}
