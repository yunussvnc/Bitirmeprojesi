import { apiGet, apiPost, apiDelete } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";

// --- Types ---

export interface MatchProfile {
    id: number;
    user_id: number;
    display_name: string;
    age: number;
    bio?: string;
    photo_urls: string[];
    height?: number;
    gender?: string;
    education?: string;
    location_text?: string;
    smoking?: string;
    drinking?: string;
    looking_for?: string;
    interests: string[];
    star_sign?: string;
    family_plans?: string;
    exercise?: string;
    prompts?: { question: string; answer: string }[];
    is_active: boolean;
    created_at: string;
}

export interface MatchProfileCreate {
    display_name: string;
    age: number;
    bio?: string;
    photo_urls?: string[];
    height?: number;
    gender?: string;
    education?: string;
    location_text?: string;
    smoking?: string;
    drinking?: string;
    looking_for?: string;
    interests?: string[];
    star_sign?: string;
    family_plans?: string;
    exercise?: string;
    prompts?: { question: string; answer: string }[];
}

export interface MatchCandidate {
    user_id: number;
    display_name: string;
    age: number;
    bio?: string;
    photo_urls: string[];
    height?: number;
    gender?: string;
    education?: string;
    smoking?: string;
    drinking?: string;
    looking_for?: string;
    interests: string[];
    star_sign?: string;
    exercise?: string;
    prompts?: { question: string; answer: string }[];
    active_place_name?: string;
    is_qr_verified: boolean;
    distance_priority: number;
}

export interface MatchActionResponse {
    action: string;
    matched: boolean;
    conversation_id?: number;
}

export interface MatchConversation {
    id: number;
    other_user_display_name: string;
    other_user_photo?: string;
    other_user_id: number;
    place_name?: string;
    my_profile_revealed: boolean;
    other_profile_revealed: boolean;
    is_active: boolean;
    created_at: string;
    last_message_at?: string;
}

export interface QRVerifyResponse {
    verified: boolean;
    place_id: number;
    place_name: string;
    active_until?: string;
}

// --- API Calls ---

export async function createOrUpdateMatchProfile(
    data: MatchProfileCreate
): Promise<MatchProfile> {
    try {
        return await apiPost<MatchProfile>("/match-profile", data);
    } catch (error) {
        logger.error("[matchService] createOrUpdateMatchProfile error:", error);
        throw error;
    }
}

export async function getMyMatchProfile(): Promise<MatchProfile> {
    try {
        return await apiGet<MatchProfile>("/match-profile/me");
    } catch (error: any) {
        // Profil yoksa 404 döner — bu beklenen bir durum, loglama
        throw error;
    }
}

export async function deleteMatchProfile(): Promise<void> {
    try {
        await apiDelete("/match-profile");
    } catch (error) {
        logger.error("[matchService] deleteMatchProfile error:", error);
        throw error;
    }
}

export async function verifyQR(
    placeId: number,
    userLat?: number,
    userLng?: number
): Promise<QRVerifyResponse> {
    try {
        return await apiPost<QRVerifyResponse>("/venue/qr-verify", {
            place_id: placeId,
            user_lat: userLat,
            user_lng: userLng,
        });
    } catch (error) {
        logger.error("[matchService] verifyQR error:", error);
        throw error;
    }
}

export async function getMatchCandidates(
    placeId?: number
): Promise<MatchCandidate[]> {
    try {
        const query = placeId ? `?place_id=${placeId}` : "";
        return await apiGet<MatchCandidate[]>(`/match/candidates${query}`);
    } catch (error) {
        logger.error("[matchService] getMatchCandidates error:", error);
        throw error;
    }
}

export async function likeUser(
    toUserId: number,
    placeId?: number,
    action: "like" | "pass" = "like"
): Promise<MatchActionResponse> {
    try {
        return await apiPost<MatchActionResponse>("/match/like", {
            to_user_id: toUserId,
            place_id: placeId,
            action,
        });
    } catch (error) {
        logger.error("[matchService] likeUser error:", error);
        throw error;
    }
}

export async function getMatchConversations(): Promise<MatchConversation[]> {
    try {
        return await apiGet<MatchConversation[]>("/match/conversations");
    } catch (error) {
        logger.error("[matchService] getMatchConversations error:", error);
        throw error;
    }
}

export async function revealProfile(
    conversationId: number
): Promise<{ ok: boolean; revealed: boolean }> {
    try {
        return await apiPost<{ ok: boolean; revealed: boolean }>(
            `/match/reveal-profile/${conversationId}`
        );
    } catch (error) {
        logger.error("[matchService] revealProfile error:", error);
        throw error;
    }
}
