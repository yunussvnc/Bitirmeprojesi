/* ── Types & Helpers for Chat Screen ── */

export interface Message {
    id: string;
    text: string;
    isMine: boolean;
    timestamp: string;
    placeCard?: {
        id?: string;
        name: string;
        address: string;
        image: string;
        rating?: number;
        reviewCount?: number;
        category?: string;
        description?: string;
    };
    imageUri?: string;
    seen?: boolean;
    status?: 'sent' | 'delivered' | 'read';
    sharedPostId?: number;
    storySnapshotUrl?: string | null;
    isStoryReply?: boolean;
    parentStoryId?: number | null;
}

/**
 * ChatId'den hedef user_id'yi güvenli şekilde parse et.
 * Formatı: tamamen sayısal ("42") veya "match_timestamp_userId" ("match_1711836000000_5")
 */
export function parseTargetUserId(chatId: string): number | null {
    if (chatId.startsWith('match_')) {
        const parts = chatId.split('_');
        const lastPart = parts[parts.length - 1];
        const id = parseInt(lastPart, 10);
        return isNaN(id) ? null : id;
    }
    const num = parseInt(chatId, 10);
    return isNaN(num) ? null : num;
}
