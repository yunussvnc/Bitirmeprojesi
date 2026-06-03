/**
 * AI Mekan Öneri Servisi
 * ai-llm/app.py (Port 8080) ile entegrasyon
 *
 * Endpoints:
 *  POST /api/smart-search-v2  → Doğal dil ile mekan ara
 *  POST /api/analyze-place-reviews → Yorum analizi
 *  GET  /health               → Backend sağlık kontrolü
 *  GET  /api/info             → Sistem bilgileri
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { logger } from '@/src/utils/logger';
import type {
  SmartSearchRequest,
  SmartSearchResponse,
  AnalyzeReviewRequest,
  AnalyzeReviewResponse,
} from '@/src/types/ai';


// ============================================================
// AI Backend URL — Expo host'tan otomatik çözümlenir
// Manuel IP güncellemeye gerek yok!
// Override: EXPO_PUBLIC_AI_URL=http://...
// ============================================================
function resolveAIBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_AI_URL;
  if (override && override.startsWith('http')) return override.replace(/\/$/, '');

  if (__DEV__) {
    // iOS Simulator: localhost; physical device: expo hostUri or EXPO_PUBLIC_DEV_API_HOST
    if (Platform.OS === 'web') return 'http://localhost:8080';
    // Expo'nun bağlı olduğu host'u kullan (telefon + PC aynı Wi-Fi'da)
    const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (expoHost) return `http://${expoHost}:8080`;
    // Fallback: .env'den veya local IP
    return `http://${process.env.EXPO_PUBLIC_DEV_API_HOST?.split(':')[0] ?? '192.168.1.36'}:8080`;
  }
  return process.env.EXPO_PUBLIC_AI_URL ?? 'https://asemos-ai.onrender.com';
}

export const getAIBaseUrl = resolveAIBaseUrl;

export const AI_BASE_URL = resolveAIBaseUrl();


// ============================================================
// Yardımcı fetch fonksiyonu (auth gerektirmiyor)
// ============================================================
async function aiFetch<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 28000,
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
      {
        method: 'POST',
        body: JSON.stringify({
          ...req,
          analyze_reviews: req.analyze_reviews ?? false,
        }),
      },
      28000,
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
    }>('/health', { method: 'GET' }, 2500);
    return {
      ok: data.status === 'ok',
      modelLoaded: data.model_loaded ?? false,
      cache: data.cache ?? 'unknown',
    };
  } catch {
    return { ok: false, modelLoaded: false, cache: 'error' };
  }
}

/**
 * Görsel ile mekan ara.
 * base64 image → Gemini Vision analizi → mekan önerileri
 */
export async function imageSearch(
  imageBase64: string,
  mimeType: string = 'image/jpeg',
  opts: {
    location?: string;
    userLat?: number;
    userLng?: number;
    limit?: number;
  } = {},
): Promise<SmartSearchResponse & { image_analysis?: { detected_query: string; category: string; description: string; gemini_available: boolean } }> {
  try {
    logger.log('[aiService] imageSearch →', mimeType, imageBase64.length, 'chars');
    const res = await aiFetch<SmartSearchResponse & { image_analysis?: any }>(
      '/api/image-search',
      {
        method: 'POST',
        body: JSON.stringify({
          image_base64: imageBase64,
          mime_type: mimeType,
          location: opts.location ?? 'Istanbul',
          user_lat: opts.userLat,
          user_lng: opts.userLng,
          limit: opts.limit ?? 5,
          max_distance_km: 10,
        }),
      },
      60000, // 60 sn timeout (görsel analiz yavaş olabilir)
    );
    logger.log('[aiService] imageSearch ←', res.found, 'sonuç', res.image_analysis?.detected_query);
    return res;
  } catch (error) {
    logger.error('[aiService] imageSearch hatası:', error);
    throw error;
  }
}
