import { create } from 'zustand';

interface IslandState {
  isVisible: boolean;
  title: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  showIsland: (params: { title: string; subtitle?: string; icon?: string; color?: string; duration?: number }) => void;
  hideIsland: () => void;
}

export const useIslandStore = create<IslandState>((set) => ({
  isVisible: false,
  title: '',
  subtitle: undefined,
  icon: undefined,
  color: undefined,

  showIsland: ({ title, subtitle, icon, color, duration = 4000 }) => {
    set({ isVisible: true, title, subtitle, icon, color });
    
    // Auto hide
    setTimeout(() => {
      set((state) => {
        // Only hide if the title hasn't changed (meaning another island didn't replace it)
        if (state.title === title) {
          return { ...state, isVisible: false };
        }
        return state;
      });
    }, duration);
  },

  hideIsland: () => set({ isVisible: false }),
}));
