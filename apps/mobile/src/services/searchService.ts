/**
 * Search Service — Mekan ve kullanıcı arama
 */

import { apiGet } from "@/src/utils/apiClient";
import type { Place } from "./mekanService";

export type PaginatedPlaces = {
    items: Place[];
    total: number;
    page: number;
    page_size: number;
};

export type UserSummary = {
    id: number;
    username: string | null;
    first_name: string | null;
    last_name?: string | null;
    avatar_url: string | null;
    is_following?: boolean;
    follow_status?: 'pending' | 'accepted' | null;
    is_private?: boolean;
};

export type PaginatedUsers = {
    items: UserSummary[];
    total: number;
    page: number;
    page_size: number;
};

/** Mekan arama — isim, kategori, şehir */
export async function searchPlaces(
    q = "",
    category?: string,
    city?: string,
    page = 1,
    pageSize = 20
): Promise<PaginatedPlaces> {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return apiGet<PaginatedPlaces>(`/places/search?${params.toString()}`);
}

/** Yakındaki mekanlar */
export async function getNearbyPlaces(
    lat: number,
    lng: number,
    radius = 5,
    page = 1,
    pageSize = 20
): Promise<PaginatedPlaces> {
    return apiGet<PaginatedPlaces>(
        `/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&page=${page}&page_size=${pageSize}`
    );
}

/** Popüler mekanlar */
export async function getPopularPlaces(page = 1, pageSize = 20): Promise<PaginatedPlaces> {
    return apiGet<PaginatedPlaces>(`/places/popular?page=${page}&page_size=${pageSize}`);
}

/** Kullanıcı arama */
export async function searchUsers(q: string, page = 1, pageSize = 20): Promise<PaginatedUsers> {
    return apiGet<PaginatedUsers>(`/users/search?q=${encodeURIComponent(q)}&page=${page}&page_size=${pageSize}`);
}
