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
    sharedPlace?: string;
    isArchived?: boolean;
    isDeleted?: boolean;
    deletedAt?: number;
    lastMessageAt: number; // Son mesajın gerçek timestamp'i (sıralama için)
}

const now = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const INITIAL_CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        name: "Ahmet Yılmaz",
        username: "ahmetyilmaz",
        avatar: "https://i.pravatar.cc/150?img=1",
        lastMessage: "Olur ikisine de bakalım! Haritada kaydediyorum 📌",
        lastMessageSender: "Ahmet Yılmaz",
        timestamp: "2dk",
        unread: true,
        isOnline: true,
        sharedPlace: "Sortie - Kuruçeşme",
        lastMessageAt: now - 2 * MINUTE,
    },
    {
        id: "2",
        name: "Elif Kaya",
        username: "elifkaya",
        avatar: "https://i.pravatar.cc/150?img=5",
        lastMessage: "Çok güzel görünüyor! Cumartesi akşamı olur mu?",
        lastMessageSender: "me",
        timestamp: "15dk",
        unread: true,
        isOnline: false,
        sharedPlace: "Kastel - Beyoğlu",
        lastMessageAt: now - 15 * MINUTE,
    },
    {
        id: "3",
        name: "Burak Demir",
        username: "burakdemir",
        avatar: "https://i.pravatar.cc/150?img=3",
        lastMessage: "Olur, Cuma akşamı uyar bana",
        lastMessageSender: "me",
        timestamp: "1sa",
        unread: false,
        isOnline: true,
        lastMessageAt: now - 1 * HOUR,
    },
    {
        id: "4",
        name: "Zeynep Toprak",
        username: "zeyneptoprak",
        avatar: "https://i.pravatar.cc/150?img=9",
        lastMessage: "Ne güzel! Bir sonraki sefere ben de geleyim",
        lastMessageSender: "Zeynep Toprak",
        timestamp: "3sa",
        unread: false,
        isOnline: false,
        lastMessageAt: now - 3 * HOUR,
    },
    {
        id: "5",
        name: "Can Aydın",
        username: "canaydin",
        avatar: "https://i.pravatar.cc/150?img=8",
        lastMessage: "Evet kaydettim, çok iyi görünüyor!",
        lastMessageSender: "me",
        timestamp: "5sa",
        unread: false,
        isOnline: false,
        lastMessageAt: now - 5 * HOUR,
    },
    {
        id: "6",
        name: "Selin Arslan",
        username: "selinarslan",
        avatar: "https://i.pravatar.cc/150?img=10",
        lastMessage: "Süpermiş! Teşekkürler 🙏",
        lastMessageSender: "me",
        timestamp: "Dün",
        unread: false,
        isOnline: true,
        sharedPlace: "Oligark - Kuruçeşme",
        lastMessageAt: now - 1 * DAY,
    },
    {
        id: "7",
        name: "Mert Özkan",
        username: "mertozkan",
        avatar: "https://i.pravatar.cc/150?img=11",
        lastMessage: "Vay be, detay ver! 🍽️",
        lastMessageSender: "me",
        timestamp: "Dün",
        unread: false,
        isOnline: false,
        lastMessageAt: now - 1.5 * DAY,
    },
    {
        id: "8",
        name: "Deniz Güneş",
        username: "denizgunes",
        avatar: "https://i.pravatar.cc/150?img=12",
        lastMessage: "Teşekkürler! Hemen kaydediyorum",
        lastMessageSender: "me",
        timestamp: "2g",
        unread: false,
        isOnline: false,
        sharedPlace: "Fakülte Teras - Beyoğlu",
        lastMessageAt: now - 2 * DAY,
    },
];

type MessagesState = {
    conversations: Conversation[];

    archiveConversation: (id: string) => void;
    unarchiveConversation: (id: string) => void;
    deleteConversation: (id: string) => void;
    markAsRead: (id: string) => void;
    updateLastMessageAt: (id: string, message: string, timestamp: string, sender?: "me" | string) => void;

    archiveMultiple: (ids: string[]) => void;
    unarchiveMultiple: (ids: string[]) => void;
    deleteMultiple: (ids: string[]) => void;

    restoreDeleted: (id: string) => void;
    restoreDeletedMultiple: (ids: string[]) => void;
    permanentlyDelete: (id: string) => void;
    permanentlyDeleteMultiple: (ids: string[]) => void;
    purgeExpiredMessages: () => void;
};

export const useMessagesStore = create<MessagesState>()(
    persist(
        (set) => ({
            conversations: INITIAL_CONVERSATIONS,

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

            updateLastMessageAt: (id, message, timestamp, sender) => set((state) => ({
                conversations: state.conversations.map(c =>
                    c.id === id ? { ...c, lastMessage: message, timestamp, lastMessageAt: Date.now(), ...(sender !== undefined ? { lastMessageSender: sender } : {}) } : c
                )
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
                const now = Date.now();
                const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;
                return {
                    conversations: state.conversations.filter(c => {
                        if (c.isDeleted && c.deletedAt) {
                            return (now - c.deletedAt) <= TWO_DAYS;
                        }
                        return true;
                    })
                };
            })
        }),
        {
            name: "messages-store-v2",
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
