/**
 * AI Mekan Öneri Servisi
 * demo_backend_v2.py (localhost:8080) ile entegrasyon
 *
 * Endpoints:
 *  POST /api/smart-search-v2  → Doğal dil ile mekan ara
 *  POST /api/analyze-place-reviews → Yorum analizi
 *  GET  /health               → Backend sağlık kontrolü
 *  GET  /api/stats            → Sistem istatistikleri
 */

import { logger } from '@/src/utils/logger';
import type {
  SmartSearchRequest,
  SmartSearchResponse,
  AnalyzeReviewRequest,
  AnalyzeReviewResponse,
} from '@/src/types/ai';
import { Platform } from 'react-native';

// ============================================================
// AI Backend URL — dev modunda PC'nin IP'si, prod'da env var
// ============================================================
function resolveAIBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_AI_URL;
  if (override && override.startsWith('http')) return override.replace(/\/$/, '');

  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:8080';
    // Gerçek telefon veya emülatör → PC'nin Wi-Fi IP'si
    // PC Wi-Fi: 10.23.0.167  (ipconfig ile güncelle)
    return 'http://10.23.0.167:8080';
  }
  return process.env.EXPO_PUBLIC_AI_URL ?? 'http://10.23.0.167:8080';
}

export const AI_BASE_URL = resolveAIBaseUrl();

// ============================================================
// Yardımcı fetch fonksiyonu (auth gerektirmiyor)
// ============================================================
async function aiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 40000,
): Promise<T> {
  const url = `${AI_BASE_URL}${path}`;
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });
    clearTimeout(tid);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI API ${res.status}: ${text.slice(0, 200)}`);
    }

    const text = await res.text();
    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  } catch (err) {
    clearTimeout(tid);
    throw err;
  }
}

// ============================================================
// API Fonksiyonları
// ============================================================

/**
 * Doğal dil sorgusu ile mekan ara.
 * Örn: "Kadıköy'de deniz manzaralı sessiz kafe"
 */
export async function smartSearch(
  req: SmartSearchRequest,
): Promise<SmartSearchResponse> {
  try {
    logger.log('[aiService] smartSearch →', req.query);
    const res = await aiFetch<SmartSearchResponse>(
      '/api/smart-search-v2',
      { method: 'POST', body: JSON.stringify(req) },
    );
    logger.log('[aiService] smartSearch ←', res.found, 'sonuç');
    return res;
  } catch (error) {
    logger.error('[aiService] smartSearch hatası:', error);
    throw error;
  }
}

/**
 * Belirli bir mekanın yorumlarını AI ile analiz et.
 */
export async function analyzeReviews(
  req: AnalyzeReviewRequest,
): Promise<AnalyzeReviewResponse> {
  try {
    logger.log('[aiService] analyzeReviews →', req.data_id);
    const res = await aiFetch<AnalyzeReviewResponse>(
      '/api/analyze-place-reviews',
      { method: 'POST', body: JSON.stringify(req) },
    );
    return res;
  } catch (error) {
    logger.error('[aiService] analyzeReviews hatası:', error);
    throw error;
  }
}

/**
 * Backend sağlık kontrolü
 */
export async function checkAIHealth(): Promise<{
  ok: boolean;
  modelLoaded: boolean;
  cache: string;
}> {
  try {
    const data = await aiFetch<{
      status: string;
      model_loaded: boolean;
      cache: string;
    }>('/health', { method: 'GET' }, 5000);
    return {
      ok: data.status === 'ok',
      modelLoaded: data.model_loaded ?? false,
      cache: data.cache ?? 'unknown',
    };
  } catch {
    return { ok: false, modelLoaded: false, cache: 'error' };
  }
}
