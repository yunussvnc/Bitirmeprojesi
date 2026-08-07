import { create } from 'zustand';
import { PlaceCardProps } from '@/src/components/domain/place/PlaceCard';

interface PreviewStoreState {
  previewedPlace: PlaceCardProps | null;
  setPreview: (place: PlaceCardProps) => void;
  clearPreview: () => void;
}

export const usePreviewStore = create<PreviewStoreState>((set) => ({
  previewedPlace: null,
  setPreview: (place) => set({ previewedPlace: place }),
  clearPreview: () => set({ previewedPlace: null }),
}));
