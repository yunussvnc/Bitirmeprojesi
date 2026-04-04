/**
 * Content Creation Module – Configuration
 * Configurable limits for media picker and validation.
 */

import type { AspectRatioOption } from './types';

/** Maximum number of media items in carousel (Story: 1, Post/Reels: configurable) */
export const MAX_MEDIA_COUNT = {
  story: 1,
  post: 10,
  reels: 1,
} as const;

/** Maximum video duration in seconds */
export const MAX_VIDEO_DURATION_SEC = {
  story: 15,
  post: 60,
  reels: 90,
} as const;

/** Maximum file size in megabytes */
export const MAX_FILE_SIZE_MB = 100;

/** Story aspect ratio */
export const STORY_ASPECT: [number, number] = [9, 16];

/** Reels aspect ratio (9:16 zorunlu) */
export const REELS_ASPECT: [number, number] = [9, 16];

/** Post aspect ratio options for cropper */
export const POST_ASPECT_RATIOS: AspectRatioOption[] = [
  { label: '1:1', value: [1, 1], icon: 'square' },
  { label: '4:5', value: [4, 5], icon: 'rectangle.portrait' },
  { label: 'Orijinal', value: null, icon: 'arrow.up.left.and.arrow.down.right' },
];

/** Gallery grid column count */
export const GALLERY_COLUMNS = 4;

/** Gallery page size for lazy loading */
export const GALLERY_PAGE_SIZE = 80;
