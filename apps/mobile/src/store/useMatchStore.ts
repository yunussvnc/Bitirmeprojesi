import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
    MatchProfile,
    MatchCandidate,
    MatchConversation,
    MatchProfileCreate,
} from "@/src/services/matchService";
import * as matchService from "@/src/services/matchService";

type MatchState = {
    // Profil
    myProfile: MatchProfile | null;
    hasProfile: boolean;
    profileLoading: boolean;

    // Adaylar
    candidates: MatchCandidate[];
    candidatesLoading: boolean;
    currentIndex: number;

    // Konuşmalar
    conversations: MatchConversation[];

    // Ayarlar
    isGhostMode: boolean;

    // Aksiyonlar
    fetchMyProfile: () => Promise<void>;
    createProfile: (data: MatchProfileCreate) => Promise<void>;
    deleteProfile: () => Promise<void>;

    fetchCandidates: (placeId?: number) => Promise<void>;
    likeCandidate: (userId: number, placeId?: number) => Promise<matchService.MatchActionResponse>;
    passCandidate: (userId: number, placeId?: number) => Promise<void>;
    nextCandidate: () => void;
    resetCandidateIndex: () => void;
    toggleGhostMode: () => void;

    fetchConversations: () => Promise<void>;
    revealProfile: (conversationId: number) => Promise<void>;
};

export const useMatchStore = create<MatchState>()(
    persist(
        (set, get) => ({
            myProfile: null,
            hasProfile: false,
            profileLoading: false,
            candidates: [],
            candidatesLoading: false,
            currentIndex: 0,
            conversations: [],
            isGhostMode: false,

            fetchMyProfile: async () => {
                set({ profileLoading: true });
                try {
                    const profile = await matchService.getMyMatchProfile();
                    set({ myProfile: profile, hasProfile: true, profileLoading: false });
                } catch {
                    set({ myProfile: null, hasProfile: false, profileLoading: false });
                }
            },

            createProfile: async (data) => {
                set({ profileLoading: true });
                try {
                    const profile = await matchService.createOrUpdateMatchProfile(data);
                    set({ myProfile: profile, hasProfile: true, profileLoading: false });
                } catch (error) {
                    set({ profileLoading: false });
                    throw error;
                }
            },

            deleteProfile: async () => {
                try {
                    await matchService.deleteMatchProfile();
                    set({ myProfile: null, hasProfile: false });
                } catch (error: any) {
                    // If the backend says 404 or profile not found, just clear it locally
                    const msg = error?.message?.toLowerCase() || "";
                    const code = error?.code || "";
                    if (msg.includes("404") || msg.includes("not found") || code === "NOT_FOUND") {
                        set({ myProfile: null, hasProfile: false });
                    } else {
                        throw error;
                    }
                }
            },

            fetchCandidates: async (placeId) => {
                set({ candidatesLoading: true });
                try {
                    const candidates = await matchService.getMatchCandidates(placeId);
                    set({ candidates, candidatesLoading: false, currentIndex: 0 });
                } catch (error: any) {
                    // Cache senkronizasyon problemi: Backend'de profilimiz silinmiş ama telefonda cachelenmiş olabilir.
                    const msg = error?.message || "";
                    const userMsg = error?.userMessage || "";
                    if (msg.includes("400") || userMsg.includes("profil")) {
                        set({ hasProfile: false, myProfile: null });
                    }
                    set({ candidates: [], candidatesLoading: false });
                }
            },

            likeCandidate: async (userId, placeId) => {
                const result = await matchService.likeUser(userId, placeId, "like");
                if (result.matched) {
                    await get().fetchConversations();
                }
                return result;
            },

            passCandidate: async (userId, placeId) => {
                await matchService.likeUser(userId, placeId, "pass");
            },

            nextCandidate: () => {
                const { currentIndex, candidates } = get();
                if (currentIndex < candidates.length) {
                    set({ currentIndex: currentIndex + 1 });
                }
            },

            resetCandidateIndex: () => {
                set({ currentIndex: 0 });
            },

            toggleGhostMode: () => {
                set({ isGhostMode: !get().isGhostMode });
            },

            fetchConversations: async () => {
                try {
                    const conversations = await matchService.getMatchConversations();
                    set({ conversations });
                } catch {
                    // fail silently
                }
            },

            revealProfile: async (conversationId) => {
                await matchService.revealProfile(conversationId);
                await get().fetchConversations();
            },
        }),
        {
            name: "match-store-v1",
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                myProfile: state.myProfile,
                hasProfile: state.hasProfile,
                conversations: state.conversations,
                isGhostMode: state.isGhostMode,
            }),
        }
    )
);
