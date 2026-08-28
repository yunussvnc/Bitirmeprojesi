/**
 * Media Validation & Payload Sanitization
 *
 * Munia-inspired: Validate and sanitize all data before sending to the API.
 * Ensures lightweight, error-free payloads and prevents invalid media uploads.
 *
 * Dummygram-inspired: Simple, predictable validation functions.
 */

import { File } from 'expo-file-system';
import type {
  MediaItem,
  ContentType,
  ValidationResult,
  MediaMetadata,
  RawPostInput,
  RawStoryInput,
  SanitizedPostPayload,
  SanitizedStoryPayload,
} from './types';
import {
  MAX_FILE_SIZE_MB,
  MAX_VIDEO_DURATION_SEC,
  MAX_MEDIA_COUNT,
} from './config';

// ── Constants ───────────────────────────────────────────────

const MAX_CAPTION_LENGTH = 2200;
const MAX_FILE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ── Media Validation ────────────────────────────────────────

/**
 * Validates a single media item against content type constraints.
 * Checks file existence, size, and duration.
 */
export async function validateMedia(
  item: MediaItem,
  contentType: ContentType
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. File existence (SDK 53+ API)
  try {
    const file = new File(item.uri);
    if (!file.exists) {
      errors.push('File does not exist');
      return { valid: false, errors };
    }

    // 2. File size
    const size = file.size;
    if (size && size > MAX_FILE_BYTES) {
      errors.push(`File size (${(size / 1024 / 1024).toFixed(1)}MB) exceeds maximum (${MAX_FILE_SIZE_MB}MB)`);
    }
  } catch {
    // File check not available, skip — validation yine de devam etsin
    console.log('[MediaValidation] File check skipped (URI may not be a local file)');
  }

  // 3. Video duration
  if (item.type === 'video' && item.duration) {
    const maxDuration = MAX_VIDEO_DURATION_SEC[contentType];
    if (item.duration > maxDuration) {
      errors.push(`Video duration (${item.duration}s) exceeds maximum (${maxDuration}s) for ${contentType}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates an array of media items for a given content type.
 */
export async function validateMediaBatch(
  items: MediaItem[],
  contentType: ContentType
): Promise<ValidationResult> {
  const errors: string[] = [];
  const maxCount = MAX_MEDIA_COUNT[contentType];

  if (items.length === 0) {
    errors.push('At least one media item is required');
    return { valid: false, errors };
  }

  if (items.length > maxCount) {
    errors.push(`Maximum ${maxCount} media items allowed for ${contentType}`);
  }

  // Validate each item
  for (let i = 0; i < items.length; i++) {
    const result = await validateMedia(items[i], contentType);
    if (!result.valid) {
      errors.push(...result.errors.map((e) => `Item ${i + 1}: ${e}`));
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Media Metadata ──────────────────────────────────────────

/**
 * Extracts metadata from a media file URI.
 */
export async function getMediaMetadata(uri: string): Promise<Partial<MediaMetadata>> {
  try {
    const file = new File(uri);
    return {
      fileSize: file.exists ? (file.size ?? 0) : 0,
    };
  } catch {
    return {};
  }
}

// ── Payload Sanitization (Munia-inspired) ───────────────────

/**
 * Sanitizes raw post input into a clean API-ready payload.
 *
 * Munia's approach:
 *  - Strip empty strings → undefined
 *  - Validate numeric IDs
 *  - Trim and cap text fields
 *  - Filter out incomplete media entries
 *  - Ensure boolean defaults
 */
export function sanitizePostPayload(raw: RawPostInput): SanitizedPostPayload {
  // Caption: trim, cap length, convert empty to undefined
  const caption = raw.caption?.trim();
  const cleanCaption = caption && caption.length > 0
    ? caption.substring(0, MAX_CAPTION_LENGTH)
    : undefined;

  // Place ID: must be positive integer
  const placeId = typeof raw.placeId === 'number' && raw.placeId > 0 && Number.isInteger(raw.placeId)
    ? raw.placeId
    : undefined;

  // Tagged users: deduplicate and validate
  const taggedUserIds = raw.taggedUserIds && raw.taggedUserIds.length > 0
    ? [...new Set(raw.taggedUserIds.filter((id) => typeof id === 'number' && id > 0))]
    : undefined;

  // Determine post type from first media item
  const hasVideo = raw.mediaItems.some((m) => m.type === 'video');
  const postType = hasVideo ? 'reel' : 'photo';

  return {
    caption: cleanCaption,
    place_id: placeId,
    post_type: postType,
    comments_disabled: Boolean(raw.commentsDisabled),
    likes_hidden: Boolean(raw.likesHidden),
    tagged_user_ids: taggedUserIds,
    media: [], // Will be filled after upload with actual URLs
  };
}

/**
 * Sanitizes raw story input into a clean API-ready payload.
 */
export function sanitizeStoryPayload(raw: RawStoryInput): SanitizedStoryPayload {
  const placeId = typeof raw.placeId === 'number' && raw.placeId > 0 && Number.isInteger(raw.placeId)
    ? raw.placeId
    : undefined;

  return {
    place_id: placeId,
    media_type: raw.isVideo ? 'video' : 'image',
    media_url: '', // Will be filled after upload
    is_close_friends: Boolean(raw.isCloseFriends),
  };
}

/**
 * Strips HTML tags for XSS prevention (Munia pattern).
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize caption text — strip HTML, trim whitespace, cap length.
 */
export function sanitizeCaption(raw: string): string {
  return stripHtml(raw).trim().substring(0, MAX_CAPTION_LENGTH);
}
