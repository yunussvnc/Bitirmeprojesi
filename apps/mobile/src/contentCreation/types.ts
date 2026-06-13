/**
 * Content Creation Module – Types
 * Type-safe state and payload types.
 *
 * Architecture references:
 *  - Novu: UploadStage pipeline concept
 *  - Munia: SanitizedPostPayload JSON optimization
 *  - Dummygram: PostMeta simple state management
 */

// ── Core Media Types ────────────────────────────────────────

export type ContentType = 'story' | 'post' | 'reels';

export type MediaItem = {
  uri: string;
  originalUri?: string;
  assetId?: string;
  type: 'image' | 'video';
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  cropState?: { scale: number; translateX: number; translateY: number };
  filter?: FilterPreset;
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

/** Aspect ratio option for post cropper */
export type AspectRatioOption = {
  label: string;
  value: [number, number] | null; // null = free/original
  icon: string; // SF Symbol name
};

/** Crop region coordinates (normalised 0-1) */
export type CropRegion = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

/** Gallery album info */
export type GalleryAlbum = {
  id: string;
  title: string;
  assetCount: number;
};

// ── Upload Pipeline Types (Novu-inspired) ───────────────────

/**
 * Novu's workflow concept: each upload goes through sequential stages.
 * Each stage is a "step" in the pipeline, enabling granular progress tracking.
 */
export type UploadStage =
  | 'idle'
  | 'validating'
  | 'compressing'
  | 'uploading'
  | 'creating_post'
  | 'done'
  | 'error';

export type UploadJob = {
  id: string;
  stage: UploadStage;
  progress: number; // 0-100
  mediaItems: MediaItem[];
  uploadedUrls: string[];
  thumbnailUrls: (string | undefined)[];
  payload: SanitizedPostPayload | SanitizedStoryPayload;
  contentType: ContentType;
  error?: string;
  retryCount: number;
  createdAt: number;
};

// ── Payload Types (Munia-inspired sanitization) ─────────────

/**
 * Raw input from the UI — may contain empty strings, undefined values,
 * and un-validated data. Munia's approach: sanitize before sending to API.
 */
export type RawPostInput = {
  caption?: string;
  placeId?: number | null;
  placeName?: string;
  isVideo: boolean;
  mediaItems: MediaItem[];
  commentsDisabled?: boolean;
  likesHidden?: boolean;
  taggedUserIds?: number[];
};

export type RawStoryInput = {
  placeId?: number | null;
  isVideo: boolean;
  mediaUri: string;
  isCloseFriends?: boolean;
};

/**
 * Cleaned, validated payload ready for the API.
 * All optional fields are explicitly undefined (not empty strings).
 */
export type SanitizedPostPayload = {
  caption?: string;
  place_id?: number;
  post_type: 'photo' | 'reel';
  comments_disabled: boolean;
  likes_hidden: boolean;
  tagged_user_ids?: number[];
  media: {
    media_type: 'image' | 'video';
    media_url: string;
    thumbnail_url?: string;
    order_index: number;
  }[];
};

export type SanitizedStoryPayload = {
  place_id?: number;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  is_close_friends: boolean;
};

// ── Post Meta State (Dummygram-inspired) ────────────────────

/**
 * Dummygram's clean, single-state approach for all post metadata.
 * One state object, one updater — no scattered useState calls.
 */
export type TaggedUser = {
  id: number;
  username: string;
  avatar_url?: string;
};

export type PostMeta = {
  caption: string;
  place: { id: number; name: string } | null;
  taggedUsers: TaggedUser[];
  commentsDisabled: boolean;
  likesHidden: boolean;
};

// ── Validation Types ────────────────────────────────────────

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

export type MediaMetadata = {
  width: number;
  height: number;
  fileSize: number;
  duration?: number; // video only, in seconds
  mimeType?: string;
};
