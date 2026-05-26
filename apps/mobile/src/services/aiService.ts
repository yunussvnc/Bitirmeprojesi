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
import { apiPost } from '@/src/utils/apiClient';
import { getSystemLanguagePayload, normalizeAppLanguageCode } from '@/src/utils/locale';
import type {
  SmartSearchRequest,
  SmartSearchResponse,
  AnalyzeReviewRequest,
  AnalyzeReviewResponse,
  Place,
} from '@/src/types/ai';
import type { RecommendResponse } from '@/src/types/recommend';


// ============================================================
// AI Backend URL — Expo host'tan otomatik çözümlenir
// Manuel IP güncellemeye gerek yok!
// Override: EXPO_PUBLIC_AI_URL=http://...
// ============================================================
function resolveAIBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_AI_URL;
  if (override && override.startsWith('http')) return override.replace(/\/$/, '');

  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:8080';
    // Expo'nun bağlı olduğu host'u kullan (telefon + PC aynı Wi-Fi'da)
    const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (expoHost) return `http://${expoHost}:8080`;
    // Fallback: .env'den veya local IP
    return `http://${process.env.EXPO_PUBLIC_DEV_API_HOST?.split(':')[0] ?? '192.168.1.36'}:8080`;
  }
  // Production: Render AI service URL
  return 'https://asemos-ai.onrender.com';
}

export const getAIBaseUrl = resolveAIBaseUrl;

export const AI_BASE_URL = resolveAIBaseUrl();

export function normalizeAILanguageCode(value?: string | null): string | undefined {
  return normalizeAppLanguageCode(value);
}

export function getCurrentAILanguagePayload(): { language: string; locale?: string } {
  return getSystemLanguagePayload();
}

function withCurrentAILanguage<T extends { language?: string; locale?: string }>(req: T): T {
  const current = getCurrentAILanguagePayload();
  return {
    ...req,
    language: current.language,
    locale: current.locale,
  };
}


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

function normalizeSmartSearchResponse(res: SmartSearchResponse): SmartSearchResponse {
  const message = res.message || res.ai_message || '';
  return {
    ...res,
    message,
    ai_message: res.ai_message || message,
    recommendations: res.recommendations || [],
    _cache: res._cache || { hit: false },
  };
}

function mapBackendFallbackToSmartSearch(req: SmartSearchRequest, res: RecommendResponse): SmartSearchResponse {
  const recommendations: Place[] = (res.items || []).map((item) => ({
    name: item.name,
    address: item.subtitle || '',
    latitude: req.user_lat ?? 0,
    longitude: req.user_lng ?? 0,
    rating: 0,
    review_count: 0,
    price_level: 1,
    category: item.category || 'Mekan',
    description: item.explanation || '',
    photo_url: item.photo_url || null,
    data_id: item.data_id || String(item.id),
    distance_km: item.distance_m ? item.distance_m / 1000 : undefined,
    recommendation_reason: item.explanation,
    review_insights: item.tags?.length
      ? {
          specialties: [],
          top_specialty: null,
          highlight_tags: item.tags,
          summary: '',
          review_count_analyzed: 0,
        }
      : undefined,
  }));

  return {
    query: req.query,
    found: recommendations.length,
    recommendations,
    message: res.summary || '',
    ai_message: res.summary || '',
    _cache: { hit: res.cached || false },
  };
}

/**
 * Doğal dil sorgusu ile mekan ara.
 * Örn: "Kadıköy'de deniz manzaralı sessiz kafe"
 */
export async function smartSearch(
  req: SmartSearchRequest,
): Promise<SmartSearchResponse> {
  const localizedReq = withCurrentAILanguage(req);
  try {
    logger.log('[aiService] smartSearch →', localizedReq.query, localizedReq.language);
    const res = await aiFetch<SmartSearchResponse>(
      '/api/smart-search-v2',
      { method: 'POST', body: JSON.stringify(localizedReq) },
    );
    logger.log('[aiService] smartSearch ←', res.found, 'sonuç');
    return normalizeSmartSearchResponse(res);
  } catch (error) {
    logger.warn('[aiService] smartSearch hatası, backend fallback deneniyor:', error);
    const fallback = await apiPost<RecommendResponse>('/recommend', {
      queryText: localizedReq.query,
      location: localizedReq.user_lat && localizedReq.user_lng ? { lat: localizedReq.user_lat, lng: localizedReq.user_lng } : undefined,
      radius_m: localizedReq.max_distance_km ? localizedReq.max_distance_km * 1000 : undefined,
      language: localizedReq.language,
      locale: localizedReq.locale,
    });
    return mapBackendFallbackToSmartSearch(localizedReq, fallback);
  }
}

/**
 * Belirli bir mekanın yorumlarını AI ile analiz et.
 */
export async function analyzeReviews(
  req: AnalyzeReviewRequest,
): Promise<AnalyzeReviewResponse> {
  const localizedReq = withCurrentAILanguage(req);
  try {
    logger.log('[aiService] analyzeReviews →', localizedReq.data_id, localizedReq.language);
    const res = await aiFetch<AnalyzeReviewResponse>(
      '/api/analyze-place-reviews',
      { method: 'POST', body: JSON.stringify(localizedReq) },
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
          ...getCurrentAILanguagePayload(),
        }),
      },
      60000, // 60 sn timeout (görsel analiz yavaş olabilir)
    );
    logger.log('[aiService] imageSearch ←', res.found, 'sonuç', res.image_analysis?.detected_query);
    return normalizeSmartSearchResponse(res) as SmartSearchResponse & { image_analysis?: { detected_query: string; category: string; description: string; gemini_available: boolean } };
  } catch (error) {
    logger.error('[aiService] imageSearch hatası:', error);
    throw error;
  }
}
