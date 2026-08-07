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
import type { ResolvedAiSearchLocation } from '@/src/utils/aiSearchLocation';


// ============================================================
// AI Backend URL — Expo host'tan otomatik çözümlenir
// Manuel IP güncellemeye gerek yok!
// Override: EXPO_PUBLIC_AI_URL=http://...
// ============================================================
function resolveAIBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_AI_URL;
  if (override && override.startsWith('http')) return override.replace(/\/$/, '');

  if (__DEV__) {
    if (Platform.OS === 'web') return 'http://localhost:8001';
    const expoHost = Constants.expoConfig?.hostUri?.split(':')[0];
    // If expoHost is 127.0.0.1, it means we are using a local tunnel, we should use the actual local IP instead
    if (expoHost && expoHost !== '127.0.0.1') return `http://${expoHost}:8001`;
    // The user's Mac IP seems to be 192.168.1.4 based on Expo logs
    return `http://${process.env.EXPO_PUBLIC_DEV_API_HOST?.split(':')[0] ?? '192.168.1.4'}:8001`;
  }
  return process.env.EXPO_PUBLIC_AI_URL ?? 'https://ai.asemos.tr';
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

/** Konum alanlarını API gövdesine ekle (sorgu önceliği `resolveAiSearchLocation` ile). */
export function buildSmartSearchBody(
  req: SmartSearchRequest,
  resolved: ResolvedAiSearchLocation,
): SmartSearchRequest & { district?: string | null } {
  return {
    ...req,
    location: resolved.location,
    user_lat: resolved.user_lat,
    user_lng: resolved.user_lng,
    district: resolved.district?.apiLocation ?? null,
    analyze_reviews: req.analyze_reviews ?? false,
  };
}

/**
 * Doğal dil sorgusu ile mekan ara.
 * Örn: "Kadıköy'de deniz manzaralı sessiz kafe"
 */
export async function smartSearch(
  req: SmartSearchRequest,
  resolved?: ResolvedAiSearchLocation,
): Promise<SmartSearchResponse> {
  try {
    const body = resolved ? buildSmartSearchBody(req, resolved) : { ...req, analyze_reviews: req.analyze_reviews ?? false };
    logger.log('[aiService] smartSearch →', req.query, 'loc=', body.location);
    const res = await aiFetch<SmartSearchResponse>(
      '/api/smart-search-v2',
      {
        method: 'POST',
        body: JSON.stringify(body),
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
/**
 * Ses kaydını metne çevirmek için Whisper (Groq) API çağrısı
 * @param uri Ses dosyasının yerel cihazdaki URI adresi (file://...)
 */
export async function transcribeAudio(uri: string, language: string = 'tr'): Promise<{ text: string }> {
  const url = `${AI_BASE_URL}/api/v1/transcribe`;
  const formData = new FormData();

  formData.append('file', {
    uri: uri,
    type: uri.endsWith('.wav') ? 'audio/wav' : 'audio/m4a',
    name: `audio.${uri.split('.').pop() || 'm4a'}`,
  } as any);

  formData.append('language', language);

  logger.info(`[aiService] Ses transkripsiyonu başlatıldı: ${url}`);
  
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      Accept: 'application/json',
      // FormData kendisi boundary ayarlar, Content-Type manuel ezilmemeli!
    },
  });

  if (!res.ok) {
    const text = await res.text();
    logger.error(`[aiService] Transcribe hatası: ${res.status}`, text);
    throw new Error(`Ses çevrilemedi: ${res.status}`);
  }

  return await res.json();
}
