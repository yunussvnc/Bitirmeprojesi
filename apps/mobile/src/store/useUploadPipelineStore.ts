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
import * as ImageManipulator from 'expo-image-manipulator';
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

  // Upload-done event listeners
  _doneListeners: Set<(contentType: ContentType) => void>;
  onUploadDone: (fn: (contentType: ContentType) => void) => () => void;

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

    // URI artık CustomGalleryGrid'de file:// olarak çözümlenmiş olmalı
    const uri = item.uri;
    console.log(`[UploadPipeline]   URI: ${uri.substring(0, 100)}`);

    // Güvenlik kontrolü: ph:// hala geliyorsa uyar
    if (uri.startsWith('ph://') || uri.startsWith('ph-upload://')) {
      console.error(`[UploadPipeline] ✗ HATA: ph:// URI hala çözümlenmemiş! URI: ${uri}`);
      throw new Error('Fotoğraf URI çözümlenemedi. Lütfen tekrar deneyin.');
    }

    const uploadFn = item.type === 'video' ? uploadVideo : uploadImage;
    const filename = uri.split('/').pop() || `media_${index}.jpg`;
    const match = /\.([^.]+)$/.exec(filename);
    
    let ext = match ? match[1].toLowerCase() : 'jpg';
    if (ext === 'jpg') ext = 'jpeg';
    
    const mime = item.type === 'video' 
      ? `video/${ext === 'mov' ? 'quicktime' : 'mp4'}`
      : `image/${ext}`;

    // Sıkıştırma (Compression) Adımı
    const { compressMedia } = await import('../utils/mediaCompression');
    const finalUri = await compressMedia(uri, item.type);

    console.log(`[UploadPipeline]   Uploading as ${mime}, filename: ${filename}, Final URI: ${finalUri}`);
    const result = await uploadFn({
      uri: finalUri,
      type: mime,
      name: filename,
    });
    console.log(`[UploadPipeline]   Upload result:`, JSON.stringify(result));

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
      console.log(`[UploadPipeline] ▶ Stage 1/5: VALIDATING (${job.mediaItems.length} items)`);
      updateJob(jobId, { stage: 'validating', progress: 0 });
      const validation = await validateMediaBatch(job.mediaItems, job.contentType);
      if (!validation.valid) {
        console.error(`[UploadPipeline] ✗ Validation failed:`, validation.errors);
        updateJob(jobId, {
          stage: 'error',
          error: validation.errors.join('; '),
          progress: 0,
        });
        return;
      }
      console.log(`[UploadPipeline] ✓ Validation passed`);
      updateJob(jobId, { progress: 100 });

      // Stage 2: COMPRESSING (Fixes EXIF rotation & optimizes)
      console.log(`[UploadPipeline] ▶ Stage 2/5: COMPRESSING`);
      updateJob(jobId, { stage: 'compressing', progress: 0 });
      
      const compressedItems: MediaItem[] = [];
      for (let i = 0; i < job.mediaItems.length; i++) {
        const item = job.mediaItems[i];
        if (item.type === 'image') {
          try {
            // Empty action array [] + JPEG format bakes EXIF rotation into pixel data
            // This prevents images uploaded from camera roll from appearing sideways
            const manipResult = await ImageManipulator.manipulateAsync(
              item.uri,
              [],
              { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
            );
            compressedItems.push({
              ...item,
              uri: manipResult.uri,
              width: manipResult.width,
              height: manipResult.height,
            });
          } catch (err) {
            console.warn(`[UploadPipeline] Image processing failed for item ${i}, using original:`, err);
            compressedItems.push(item);
          }
        } else {
          compressedItems.push(item);
        }
      }
      
      job.mediaItems = compressedItems;
      updateJob(jobId, { mediaItems: compressedItems, progress: 100 });

      // Stage 3: UPLOADING — sequential upload of all media
      console.log(`[UploadPipeline] ▶ Stage 3/5: UPLOADING`);
      updateJob(jobId, { stage: 'uploading', progress: 0 });
      const uploadedUrls: string[] = [];
      const thumbnailUrls: (string | undefined)[] = [];

      for (let i = 0; i < job.mediaItems.length; i++) {
        console.log(`[UploadPipeline]   Uploading item ${i + 1}/${job.mediaItems.length}: ${job.mediaItems[i].uri.substring(0, 60)}...`);
        const url = await uploadSingleMedia(
          job.mediaItems[i],
          jobId,
          i,
          job.mediaItems.length
        );
        console.log(`[UploadPipeline]   ✓ Uploaded → ${url.substring(0, 80)}...`);
        uploadedUrls.push(url);
        thumbnailUrls.push(undefined); // Thumbnail generation can be added later
      }

      updateJob(jobId, { uploadedUrls, thumbnailUrls });

      // Stage 4: CREATING_POST — send to API
      console.log(`[UploadPipeline] ▶ Stage 4/5: CREATING_POST`);
      updateJob(jobId, { stage: 'creating_post', progress: 0 });

      if (job.contentType === 'story') {
        const storyPayload = job.payload as SanitizedStoryPayload;
        console.log(`[UploadPipeline]   Creating story...`);
        await createStory({
          ...storyPayload,
          media_url: uploadedUrls[0],
          thumbnail_url: thumbnailUrls[0],
        });
      } else {
        const postPayload = job.payload as SanitizedPostPayload;
        console.log(`[UploadPipeline]   Creating post with ${uploadedUrls.length} media, caption: "${postPayload.caption?.substring(0, 30) ?? '(none)'}"`);
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
            width: job.mediaItems[i].width,
            height: job.mediaItems[i].height,
          })),
        });
      }

      updateJob(jobId, { progress: 100 });

      // Stage 5: DONE
      console.log(`[UploadPipeline] ✓ Stage 5/5: DONE — Job ${jobId} completed!`);
      updateJob(jobId, { stage: 'done', progress: 100 });
      logger.info(`[UploadPipeline] Job ${jobId} completed successfully`);
      // Fire done listeners so UI can auto-refresh
      get()._doneListeners.forEach((fn) => fn(job.contentType));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[UploadPipeline] ✗ Job ${jobId} FAILED:`, message, error);
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
    _doneListeners: new Set(),

    // Register a listener for upload-done events. Returns an unsubscribe fn.
    onUploadDone(fn: (contentType: ContentType) => void): () => void {
      get()._doneListeners.add(fn);
      return () => get()._doneListeners.delete(fn);
    },

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
