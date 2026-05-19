/**
 * Message Service — Backend mesajlaşma API fonksiyonları
 *
 * REST endpoints:
 * - GET    /messages/{conversationId}       → Mesaj geçmişi
 * - POST   /messages/{conversationId}       → Mesaj gönder
 * - POST   /messages/{conversationId}/read  → Tümünü okundu işaretle
 * - DELETE /messages/{messageId}            → Mesaj sil
 * - GET    /messages/{conversationId}/unread-count → Okunmamış sayısı
 */

import { apiGet, apiPost, apiDelete } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";

// --- Types ---

export interface BackendMessage {
    id: number;
    conversation_id: number;
    sender_id: number;
    content: string;
    message_type: string; // "text" | "image" | "shared_post" | "story_reply"
    media_url?: string | null;
    shared_post_id?: number | null;
    parent_story_id?: number | null;
    story_snapshot_url?: string | null;
    is_read: boolean;
    status?: string;
    created_at: string;
    sender_name?: string | null;
}

export interface PaginatedMessages {
    items: BackendMessage[];
    total: number;
    page: number;
    page_size: number;
}

export interface SendMessagePayload {
    content: string;
    message_type?: string;
    media_url?: string;
    shared_post_id?: number;
    parent_story_id?: number;
    story_snapshot_url?: string;
}

// --- API Functions ---

/**
 * Mesaj geçmişini getir (en eskiden yeniye sıralı)
 */
export async function getMessages(
    conversationId: number,
    page = 1,
    pageSize = 50
): Promise<PaginatedMessages> {
    try {
        return await apiGet<PaginatedMessages>(
            `/messages/${conversationId}?page=${page}&page_size=${pageSize}`
        );
    } catch (error) {
        logger.error("[messageService] getMessages error:", error);
        throw error;
    }
}

/**
 * Mesaj gönder (REST fallback — WebSocket kapalıysa da çalışır)
 */
export async function sendMessage(
    conversationId: number,
    payload: SendMessagePayload
): Promise<BackendMessage> {
    try {
        return await apiPost<BackendMessage>(
            `/messages/${conversationId}`,
            payload
        );
    } catch (error) {
        logger.error("[messageService] sendMessage error:", error);
        throw error;
    }
}

/**
 * Konuşmadaki tüm mesajları okundu işaretle
 */
export async function markMessagesRead(
    conversationId: number
): Promise<{ ok: boolean }> {
    try {
        return await apiPost<{ ok: boolean }>(
            `/messages/${conversationId}/read`,
            {}
        );
    } catch (error) {
        logger.error("[messageService] markMessagesRead error:", error);
        throw error;
    }
}

/**
 * Belirli bir mesajı sil (sadece kendi mesajın)
 */
export async function deleteMessage(
    messageId: number
): Promise<{ ok: boolean }> {
    try {
        return await apiDelete<{ ok: boolean }>(`/messages/${messageId}`);
    } catch (error) {
        logger.error("[messageService] deleteMessage error:", error);
        throw error;
    }
}

/**
 * Okunmamış mesaj sayısı
 */
export async function getUnreadCount(
    conversationId: number
): Promise<{ count: number }> {
    try {
        return await apiGet<{ count: number }>(
            `/messages/${conversationId}/unread-count`
        );
    } catch (error) {
        logger.error("[messageService] getUnreadCount error:", error);
        throw error;
    }
}

export interface OpenConversationResponse {
    conversation_id: number;
    user_id: number;
    username: string;
    name: string;
    avatar_url?: string | null;
}

/**
 * Belirtilen kullanıcıyla DM konuşması aç (veya mevcut olanı getir).
 * Profil ekranındaki "Mesaj" butonu ve boş DM ekranındaki "Start Chat" için kullanılır.
 */
export async function openConversation(userId: number): Promise<OpenConversationResponse> {
    try {
        return await apiPost<OpenConversationResponse>(
            "/messages/conversation/open",
            { user_id: userId }
        );
    } catch (error) {
        logger.error("[messageService] openConversation error:", error);
        throw error;
    }
}
