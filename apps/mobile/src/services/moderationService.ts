/**
 * Moderation Service — Rapor, engelleme, yorum silme
 */

import { apiPost, apiGet, apiDelete } from "@/src/utils/apiClient";

// --- Raporlama ---

export type ReportPayload = {
    target_type: "post" | "comment" | "user" | "match_profile";
    target_id: number;
    reason: "spam" | "inappropriate" | "harassment" | "other";
    description?: string;
};

export async function createReport(payload: ReportPayload): Promise<{ ok: boolean; report_id: number; message: string }> {
    return apiPost("/report", payload);
}

// --- Engelleme ---

export async function toggleBlockUser(userId: number): Promise<{ blocked: boolean }> {
    return apiPost(`/users/${userId}/block`);
}

export async function getBlockedUsers(): Promise<{ items: { id: number; username: string | null; first_name: string | null; avatar_url: string | null }[]; total: number }> {
    return apiGet("/users/blocked");
}

// --- Yorum Silme ---

export async function deleteComment(postId: number, commentId: number): Promise<{ ok: boolean }> {
    return apiDelete(`/posts/${postId}/comments/${commentId}`);
}

// --- Unmatch ---

export async function unmatchConversation(conversationId: number): Promise<{ ok: boolean; message: string }> {
    return apiDelete(`/match/conversations/${conversationId}`);
}
