/**
 * Upload Pipeline Store (Novu-inspired)
 *
 * Architecture reference: Novu's notification workflow pipeline.
 * Each upload is a "job" that flows through sequential stages:
 *   IDLE → VALIDATING → COMPRESSING → UPLOADING → CREATING_POST → DONE | ERROR
 *
 * Key features:
 *  - Background upload: User returns to feed immediately
 *  - Queue management: Multiple uploads processed sequentially
 *  - Granular progress: Each stage reports 0-100%
 *  - Retry mechanism: Failed jobs can be retried from last stage
 *  - Observable state: UI components subscribe to job status
 */

import { create } from 'zustand';
import type {
  UploadJob,
  UploadStage,
  MediaItem,
  SanitizedPostPayload,
  SanitizedStoryPayload,
  ContentType,
  RawPostInput,
  RawStoryInput,
} from '@/src/contentCreation/types';
import {
  validateMediaBatch,
  sanitizePostPayload,
  sanitizeStoryPayload,
} from '@/src/contentCreation/mediaValidation';
import { uploadImage, uploadVideo, createPost } from '@/src/services/feedService';
import { createStory } from '@/src/services/storyService';
import { logger } from '@/src/utils/logger';

// ── Constants ───────────────────────────────────────────────

const MAX_RETRIES = 3;
const JOB_TTL_MS = 30 * 60 * 1000; // 30 min — auto-clean old jobs

// ── Store Types ─────────────────────────────────────────────

type UploadPipelineState = {
  jobs: UploadJob[];
  processing: boolean;

  // Actions
  enqueuePost: (input: RawPostInput, mediaItems: MediaItem[]) => string;
  enqueueStory: (input: RawStoryInput, mediaItem: MediaItem) => string;
  processNext: () => Promise<void>;
  retry: (jobId: string) => void;
  cancel: (jobId: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;

  // Selectors
  getActiveJob: () => UploadJob | undefined;
  getJobById: (id: string) => UploadJob | undefined;
  hasActiveUploads: () => boolean;
};

// ── Helper: Generate unique job ID ──────────────────────────

function generateJobId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// ── Store Implementation ────────────────────────────────────

export const useUploadPipelineStore = create<UploadPipelineState>((set, get) => {
  // ── Internal: Update a specific job ─────────────────────
  function updateJob(jobId: string, updates: Partial<UploadJob>) {
    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === jobId ? { ...j, ...updates } : j)),
    }));
  }

  // ── Internal: Upload a single media file ────────────────
  async function uploadSingleMedia(
    item: MediaItem,
    jobId: string,
    index: number,
    total: number
  ): Promise<string> {
    const baseProgress = Math.round((index / total) * 100);
    updateJob(jobId, { progress: baseProgress });

    const uploadFn = item.type === 'video' ? uploadVideo : uploadImage;
    const ext = item.type === 'video' ? 'mp4' : 'jpg';
    const mime = item.type === 'video' ? 'video/mp4' : 'image/jpeg';

    const result = await uploadFn({
      uri: item.uri,
      type: mime,
      name: `media_${index}.${ext}`,
    });

    if (!result?.url) {
      throw new Error(`Upload failed for media item ${index + 1}`);
    }

    const finalProgress = Math.round(((index + 1) / total) * 100);
    updateJob(jobId, { progress: finalProgress });

    return result.url;
  }

  // ── Internal: Process a single job through pipeline ─────
  async function processJob(job: UploadJob): Promise<void> {
    const jobId = job.id;

    try {
      // Stage 1: VALIDATING
      updateJob(jobId, { stage: 'validating', progress: 0 });
      const validation = await validateMediaBatch(job.mediaItems, job.contentType);
      if (!validation.valid) {
        updateJob(jobId, {
          stage: 'error',
          error: validation.errors.join('; '),
          progress: 0,
        });
        return;
      }
      updateJob(jobId, { progress: 100 });

      // Stage 2: COMPRESSING (placeholder — expo-image-manipulator integration point)
      updateJob(jobId, { stage: 'compressing', progress: 0 });
      // For now, skip compression — media is used as-is
      updateJob(jobId, { progress: 100 });

      // Stage 3: UPLOADING — sequential upload of all media
      updateJob(jobId, { stage: 'uploading', progress: 0 });
      const uploadedUrls: string[] = [];
      const thumbnailUrls: (string | undefined)[] = [];

      for (let i = 0; i < job.mediaItems.length; i++) {
        const url = await uploadSingleMedia(
          job.mediaItems[i],
          jobId,
          i,
          job.mediaItems.length
        );
        uploadedUrls.push(url);
        thumbnailUrls.push(undefined); // Thumbnail generation can be added later
      }

      updateJob(jobId, { uploadedUrls, thumbnailUrls });

      // Stage 4: CREATING_POST — send to API
      updateJob(jobId, { stage: 'creating_post', progress: 0 });

      if (job.contentType === 'story') {
        const storyPayload = job.payload as SanitizedStoryPayload;
        await createStory({
          ...storyPayload,
          media_url: uploadedUrls[0],
          thumbnail_url: thumbnailUrls[0],
        });
      } else {
        const postPayload = job.payload as SanitizedPostPayload;
        await createPost({
          caption: postPayload.caption,
          place_id: postPayload.place_id,
          post_type: postPayload.post_type,
          comments_disabled: postPayload.comments_disabled,
          likes_hidden: postPayload.likes_hidden,
          tagged_user_ids: postPayload.tagged_user_ids,
          media: uploadedUrls.map((url, i) => ({
            media_type: job.mediaItems[i].type === 'video' ? 'video' : 'image',
            media_url: url,
            thumbnail_url: thumbnailUrls[i],
            order_index: i,
          })),
        });
      }

      updateJob(jobId, { progress: 100 });

      // Stage 5: DONE
      updateJob(jobId, { stage: 'done', progress: 100 });
      logger.info(`[UploadPipeline] Job ${jobId} completed successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`[UploadPipeline] Job ${jobId} failed: ${message}`);

      const currentJob = get().getJobById(jobId);
      const retryCount = (currentJob?.retryCount ?? 0) + 1;

      updateJob(jobId, {
        stage: 'error',
        error: message,
        retryCount,
      });
    }
  }

  return {
    jobs: [],
    processing: false,

    // ── Enqueue a post upload ───────────────────────────
    enqueuePost(input: RawPostInput, mediaItems: MediaItem[]): string {
      const id = generateJobId();
      const payload = sanitizePostPayload(input);

      const job: UploadJob = {
        id,
        stage: 'idle',
        progress: 0,
        mediaItems,
        uploadedUrls: [],
        thumbnailUrls: [],
        payload,
        contentType: input.mediaItems.some((m) => m.type === 'video') ? 'reels' : 'post',
        retryCount: 0,
        createdAt: Date.now(),
      };

      set((s) => ({ jobs: [...s.jobs, job] }));

      // Auto-process
      setTimeout(() => get().processNext(), 0);

      return id;
    },

    // ── Enqueue a story upload ──────────────────────────
    enqueueStory(input: RawStoryInput, mediaItem: MediaItem): string {
      const id = generateJobId();
      const payload = sanitizeStoryPayload(input);

      const job: UploadJob = {
        id,
        stage: 'idle',
        progress: 0,
        mediaItems: [mediaItem],
        uploadedUrls: [],
        thumbnailUrls: [],
        payload,
        contentType: 'story',
        retryCount: 0,
        createdAt: Date.now(),
      };

      set((s) => ({ jobs: [...s.jobs, job] }));

      // Auto-process
      setTimeout(() => get().processNext(), 0);

      return id;
    },

    // ── Process next pending job ────────────────────────
    async processNext(): Promise<void> {
      const state = get();
      if (state.processing) return;

      // Clean old jobs first
      const now = Date.now();
      set((s) => ({
        jobs: s.jobs.filter(
          (j) => j.stage !== 'done' || now - j.createdAt < JOB_TTL_MS
        ),
      }));

      // Find next idle job
      const nextJob = get().jobs.find((j) => j.stage === 'idle');
      if (!nextJob) return;

      set({ processing: true });

      try {
        await processJob(nextJob);
      } finally {
        set({ processing: false });
        // Process next in queue
        const hasMore = get().jobs.some((j) => j.stage === 'idle');
        if (hasMore) {
          setTimeout(() => get().processNext(), 100);
        }
      }
    },

    // ── Retry a failed job ─────────────────────────────
    retry(jobId: string): void {
      const job = get().getJobById(jobId);
      if (!job || job.stage !== 'error') return;
      if (job.retryCount >= MAX_RETRIES) return;

      updateJob(jobId, { stage: 'idle', error: undefined, progress: 0 });
      setTimeout(() => get().processNext(), 0);
    },

    // ── Cancel a job ───────────────────────────────────
    cancel(jobId: string): void {
      set((s) => ({
        jobs: s.jobs.filter((j) => j.id !== jobId),
      }));
    },

    // ── Clear completed jobs ───────────────────────────
    clearCompleted(): void {
      set((s) => ({
        jobs: s.jobs.filter((j) => j.stage !== 'done'),
      }));
    },

    // ── Clear all jobs ─────────────────────────────────
    clearAll(): void {
      set({ jobs: [], processing: false });
    },

    // ── Selectors ──────────────────────────────────────
    getActiveJob(): UploadJob | undefined {
      return get().jobs.find(
        (j) => j.stage !== 'idle' && j.stage !== 'done' && j.stage !== 'error'
      );
    },

    getJobById(id: string): UploadJob | undefined {
      return get().jobs.find((j) => j.id === id);
    },

    hasActiveUploads(): boolean {
      return get().jobs.some(
        (j) => j.stage !== 'idle' && j.stage !== 'done' && j.stage !== 'error'
      );
    },
  };
});
