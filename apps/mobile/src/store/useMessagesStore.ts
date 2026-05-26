import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface Conversation {
    id: string;
    name: string;
    username: string;
    avatar: string;
    lastMessage: string;
    lastMessageSender?: "me" | string; // "me" = kullanıcının kendisi, string = karşı tarafın adı
    timestamp: string;
    unread: boolean;
    isOnline: boolean;
    targetUserId?: number; // Gerçek kullanıcı profil ID'si
    sharedPlace?: string;
    isMatch?: boolean;
    isRevealed?: boolean;
    revealRequestedByMe?: boolean;
    revealRequestedByThem?: boolean;
    isArchived?: boolean;
    isRequest?: boolean;
    isDeleted?: boolean;
    deletedAt?: number;
    lastMessageAt: number; // Son mesajın gerçek timestamp'i (sıralama için)
}

const now = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const INITIAL_CONVERSATIONS: Conversation[] = [];

type MessagesState = {
    conversations: Conversation[];
    activeConversationId: string | null;

    setActiveConversation: (id: string | null) => void;

    archiveConversation: (id: string) => void;
    unarchiveConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    markAsRead: (id: string) => void;
    updateLastMessageAt: (id: string, message: string, timestamp: string, sender?: "me" | string, isUnread?: boolean) => void;
    toggleRevealRequest: (id: string) => void;
    mockOtherPersonReveal: (id: string) => void;

    archiveMultiple: (ids: string[]) => void;
    unarchiveMultiple: (ids: string[]) => void;
    deleteMultiple: (ids: string[]) => void;

    restoreDeleted: (id: string) => void;
    restoreDeletedMultiple: (ids: string[]) => void;
    permanentlyDelete: (id: string) => void;
    permanentlyDeleteMultiple: (ids: string[]) => void;
    purgeExpiredMessages: () => void;

    addConversation: (conversation: Conversation) => void;
    updateConversationMeta: (id: string, meta: Partial<Pick<Conversation, 'avatar' | 'name' | 'isRevealed' | 'isMatch' | 'revealRequestedByMe' | 'revealRequestedByThem' | 'targetUserId'>>) => void;

    clearStore: () => void;
};

export const useMessagesStore = create<MessagesState>()(
    persist(
        (set) => ({
            conversations: INITIAL_CONVERSATIONS,
            activeConversationId: null,

            setActiveConversation: (id) => set({ activeConversationId: id }),

            archiveConversation: (id) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, isArchived: true } : c
                )
            })),

            unarchiveConversation: (id) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, isArchived: false } : c
                )
            })),

            deleteConversation: (id) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, isDeleted: true, deletedAt: Date.now() } : c
                )
            })),

            markAsRead: (id) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, unread: false } : c
                )
            })),

            updateLastMessageAt: (id, message, timestamp, sender, isUnread) => set((state) => ({
                conversations: state.conversations.map(c => {
                    if (c.id === id) {
                        return { 
                            ...c, 
                            lastMessage: message, 
                            timestamp, 
                            lastMessageAt: Date.now(), 
                            ...(sender !== undefined ? { lastMessageSender: sender } : {}),
                            ...(isUnread !== undefined ? { unread: isUnread } : {})
                        };
                    }
                    return c;
                })
            })),

            toggleRevealRequest: (id) => set((state) => ({
                conversations: state.conversations.map(c => {
                    if (c.id === id) {
                        const newReqMe = !c.revealRequestedByMe;
                        const fullyRevealed = newReqMe && c.revealRequestedByThem;
                        return {
                            ...c,
                            revealRequestedByMe: newReqMe,
                            isRevealed: fullyRevealed || c.isRevealed,
                            isMatch: fullyRevealed ? false : c.isMatch // Remove match status when fully revealed
                        };
                    }
                    return c;
                })
            })),

            mockOtherPersonReveal: (id) => set((state) => ({
                conversations: state.conversations.map(c => {
                    if (c.id === id) {
                        const fullyRevealed = c.revealRequestedByMe && true;
                        return {
                            ...c,
                            revealRequestedByThem: true,
                            isRevealed: fullyRevealed || c.isRevealed,
                            isMatch: fullyRevealed ? false : c.isMatch,
                        };
                    }
                    return c;
                })
            })),

            archiveMultiple: (ids) => set((state) => ({
                conversations: state.conversations.map(c =>
                    ids.includes(c.id) ? { ...c, isArchived: true } : c
                )
            })),

            unarchiveMultiple: (ids) => set((state) => ({
                conversations: state.conversations.map(c =>
                    ids.includes(c.id) ? { ...c, isArchived: false } : c
                )
            })),

            deleteMultiple: (ids) => set((state) => ({
                conversations: state.conversations.map(c =>
                    ids.includes(c.id) ? { ...c, isDeleted: true, deletedAt: Date.now() } : c
                )
            })),

            restoreDeleted: (id) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, isDeleted: false, deletedAt: undefined } : c
                )
            })),

            restoreDeletedMultiple: (ids) => set((state) => ({
                conversations: state.conversations.map(c =>
                    ids.includes(c.id) ? { ...c, isDeleted: false, deletedAt: undefined } : c
                )
            })),

            permanentlyDelete: (id) => set((state) => ({
                conversations: state.conversations.filter(c => c.id !== id)
            })),

            permanentlyDeleteMultiple: (ids) => set((state) => ({
                conversations: state.conversations.filter(c => !ids.includes(c.id))
            })),

            purgeExpiredMessages: () => set((state) => {
                const expiredAfter = 2 * 24 * 60 * 60 * 1000;
                const ts = Date.now();
                return {
                    conversations: state.conversations.filter(c => {
                        if (c.isDeleted && c.deletedAt) {
                            return (ts - c.deletedAt) <= expiredAfter;
                        }
                        return true;
                    })
                };
            }),

            addConversation: (conv) => set((state) => {
                // BUG-17: Aynı ID ile conversation eklenmesini önle
                if (state.conversations.some(c => c.id === conv.id)) {
                    return state; // zaten var, ekleme
                }
                return { conversations: [conv, ...state.conversations] };
            }),

            updateConversationMeta: (id, meta) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, ...meta } : c
                )
            })),

            clearStore: () => set({ conversations: INITIAL_CONVERSATIONS, activeConversationId: null })
        }),
        {
            name: "messages-store-v2",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
