export function parseLegacyMatchTargetUserId(chatId: string): number | null {
    if (!chatId.startsWith("match_")) {
        return null;
    }

    const parts = chatId.split("_");
    const id = Number.parseInt(parts[parts.length - 1], 10);
    return Number.isFinite(id) ? id : null;
}

export function resolveChatTargetUserId(
    explicitTargetUserId: number | null | undefined,
    chatId: string,
): number | null {
    if (typeof explicitTargetUserId === "number" && Number.isFinite(explicitTargetUserId)) {
        return explicitTargetUserId;
    }

    return parseLegacyMatchTargetUserId(chatId);
}
