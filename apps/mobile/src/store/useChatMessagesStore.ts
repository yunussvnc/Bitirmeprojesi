// Chat messages store – keeps messages per conversation (chatId)
import { mmkvStorage } from "@/src/utils/mmkvStorage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Message {
    id: string;
    text: string;
    isMine: boolean;
    timestamp: string;
    imageUri?: string;
    status?: "sent" | "delivered" | "read";
    sharedPostId?: number;
}

type ChatMessagesState = {
    messagesByChat: Record<string, Message[]>;
    getMessages: (chatId: string) => Message[];
    addMessage: (chatId: string, msg: Message) => void;
    clearStore: () => void;
};

export const useChatMessagesStore = create<ChatMessagesState>()(
    persist(
        (set, get) => ({
            messagesByChat: {},
            getMessages: (chatId) => {
                const map = get().messagesByChat;
                return map[chatId] ?? [];
            },
            addMessage: (chatId, msg) =>
                set((state) => {
                    const existing = state.messagesByChat[chatId] ?? [];
                    return {
                        messagesByChat: {
                            ...state.messagesByChat,
                            [chatId]: [...existing, msg],
                        },
                    };
                }),
            clearStore: () => set({ messagesByChat: {} }),
        }),
        {
            name: "chat-messages-store",
            storage: createJSONStorage(() => mmkvStorage),
        }
    )
);
