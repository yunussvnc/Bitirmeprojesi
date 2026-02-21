/**
 * Content Creation Module – Configuration
 * Configurable limits for media picker and validation.
 */

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
