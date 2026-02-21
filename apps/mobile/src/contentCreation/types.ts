/**
 * Content Creation Module – Types
 * Type-safe state and payload types.
 */

export type ContentType = 'story' | 'post' | 'reels';

export type MediaItem = {
  uri: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
};

export type FilterPreset = 'none' | 'warm' | 'cool' | 'vintage' | 'dramatic';

export type TextOverlay = {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EditedMedia = {
  media: MediaItem;
  filter?: FilterPreset;
  textOverlays?: TextOverlay[];
};
