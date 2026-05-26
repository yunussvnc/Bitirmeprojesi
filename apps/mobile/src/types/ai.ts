/**
 * AI servisi tip tanımlamaları
 * Review insight sistemi ile güncellendi
 */

// ==================== REVIEW INSIGHT TİPLERİ ====================

export interface ReviewSpecialty {
  key: string;           // "kahve", "hamburger", "atmosfer"
  label: string;         // "Kahvesiyle ünlü"
  emoji: string;         // "☕"
  mention_count: number; // Kaç yorumda geçiyor
  positive_count: number;// Kaç yorumda pozitif bahsi var
  confidence: number;    // 0.0 - 1.0
  mention_rate: number;  // Toplam yorumlardan yüzde kaçında
  example_review: string;// Gerçek bir yorum örneği
  display: string;       // "☕ Kahvesiyle ünlü (8 yorum)"
}

export interface ReviewInsights {
  specialties: ReviewSpecialty[];
  top_specialty: string | null;   // "☕ Kahvesiyle ünlü (8 yorum)"
  highlight_tags: string[];        // ["☕ Kahve", "🍔 Hamburger"]
  summary: string;                 // "Bu mekan özellikle kahvesiyle öne çıkıyor."
  review_count_analyzed: number;
}

export interface ExampleReview {
  specialty: string;
  emoji: string;
  review: string;
}

// ==================== MEKAN TİPLERİ ====================

export interface Place {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  review_count: number;
  price_level: number;
  category: string;
  description: string;
  photo_url: string | null;
  data_id: string;
  user_review?: string;
  
  // Arama sonucu alanları
  match_score?: number;
  rerank_score?: number;
  distance_km?: number;
  recommendation_reason?: string;
  recommendation_reason_bonus?: string;
  score_breakdown?: {
    feature: number;
    distance: number;
    popularity: number;
    time: number;
  };
  
  // Yorum insight verileri (arka planda yüklenir)
  review_insights?: ReviewInsights;
}

// ==================== API REQUEST/RESPONSE TİPLERİ ====================

export interface SmartSearchRequest {
  query: string;
  location?: string;
  limit?: number;
  user_lat?: number;
  user_lng?: number;
  max_distance_km?: number;
  analyze_reviews?: boolean; // false yaparak API kredisi tasarrufu
  language?: string;
  locale?: string;
}

export interface SmartSearchResponse {
  query: string;
  found: number;
  recommendations: Place[];
  is_conversational?: boolean;
  message?: string;
  ai_message?: string;
  context?: {
    weather: string | null;
    temperature: number | null;
    language?: string;
  };
  _cache: {
    hit: boolean;
    timestamp?: string;
  };
  _performance?: {
    response_time_seconds: number;
    cached: boolean;
  };
}

export interface AnalyzeReviewRequest {
  data_id: string;
  place_name?: string;
  language?: string;
  locale?: string;
}

export interface AnalyzeReviewResponse {
  success: boolean;
  review_count: number;
  sentiment_score?: number;
  analysis_text: string;
  specialties: ReviewSpecialty[];
  highlight_tags: string[];
  example_reviews: ExampleReview[];
  summary: string;
  language?: string;
}
