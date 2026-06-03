import type { RecommendRequest, RecommendResponse } from "../types/recommend";
import { smartSearch } from "./aiService";
import { apiPost } from "@/src/utils/apiClient";
import { logger } from "@/src/utils/logger";
import type { Place } from "../types/ai";
import { filterCompleteAiRecommendations } from "@/src/utils/aiPlaceValidation";

// Google Place ID'yi numeric ID'ye çevir
function hashPlaceId(dataId: string): number {
  let hash = 0;
  for (let i = 0; i < dataId.length; i++) {
    const char = dataId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export async function recommendPlaces(
  req: RecommendRequest
): Promise<RecommendResponse> {
  try {
    // ============================================================
    // ÖNCELİK 1: AI Servisi (SerpAPI + Groq) - Gerçek Zamanlı
    // ============================================================
    const result = await smartSearch({
      query: req.queryText || "",
      location: req.location ? `${req.location.lat},${req.location.lng}` : undefined,
      user_lat: req.location?.lat,
      user_lng: req.location?.lng,
      limit: 10,
      max_distance_km: req.radius_m ? req.radius_m / 1000 : 5,
      analyze_reviews: false,
    });

    const completePlaces = filterCompleteAiRecommendations(result.recommendations || []);

    // AI servisi Place[] döndürüyor, RecommendItem[] formatına çevir
    const items = completePlaces.map((place: Place) => {
      const dataId = place.data_id || "";
      const numericId = dataId ? hashPlaceId(dataId) : Math.floor(Math.random() * 1000000);
      
      return {
        id: numericId,
        name: place.name,
        category: place.category,
        distance_m: place.distance_km ? place.distance_km * 1000 : undefined,
        photo_url: place.photo_url || undefined,
        explanation: place.recommendation_reason,
        tags: place.review_insights?.highlight_tags,
        subtitle: place.address,
        data_id: dataId,
      };
    });
    
    logger.log("[recommendPlaces] AI Servisi başarılı:", items.length, "sonuç");
    
    return {
      items,
      summary: result.message || "",
      query: req.queryText || "",
      cached: result._cache?.hit || false,
    };
  } catch (error) {
    // ============================================================
    // FALLBACK: Backend Veritabanı (SerpAPI patlama durumu)
    // ============================================================
    logger.warn("[recommendPlaces] AI Servisi hatası, veritabanına fallback:", error);
    
    try {
      const backendResult = await apiPost<RecommendResponse>("/recommend", req);
      logger.log("[recommendPlaces] Veritabanı fallback başarılı:", backendResult.items?.length || 0, "sonuç");
      return backendResult;
    } catch (backendError) {
      logger.error("[recommendPlaces] Hem AI hem Backend hatası:", backendError);
      throw new Error("Mekan arama servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin.");
    }
  }
}
