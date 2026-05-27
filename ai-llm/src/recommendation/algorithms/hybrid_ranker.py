"""
Hybrid Recommendation Algorithms
=================================

3 farklı öneri algoritması:
1. ContentBasedFilter   - Mekan özellikleri bazlı (kategori, etiketler)
2. CollaborativeFilter  - Kullanıcı davranışı bazlı (beğeniler, ziyaretler)
3. HybridRanker         - İkisini birleştiren nihai sıralayıcı
"""

import math
from typing import List, Dict, Optional, Any
from datetime import datetime


# ==================== 1. İÇERİK BAZLI FİLTRELEME ====================

class ContentBasedFilter:
    """
    Mekan özelliklerine göre benzerlik skoru hesaplar.
    
    Kullanıcının tercihlerini (kategori, özellikler) mekan
    profilleriyle karşılaştırır.
    """
    
    # Kategori benzerlik matrisi
    CATEGORY_SIMILARITY = {
        ("kafe", "kafe"): 1.0,
        ("kafe", "restoran"): 0.4,
        ("kafe", "bar"): 0.3,
        ("restoran", "restoran"): 1.0,
        ("restoran", "kafe"): 0.4,
        ("restoran", "bar"): 0.5,
        ("bar", "bar"): 1.0,
        ("bar", "kafe"): 0.3,
        ("bar", "restoran"): 0.5,
    }
    
    # Özellik ağırlıkları
    FEATURE_WEIGHTS = {
        "wifi": 0.15,
        "deniz_manzarasi": 0.20,
        "bahce": 0.15,
        "sessiz": 0.10,
        "aile_dostu": 0.15,
        "romantik": 0.10,
        "canlı_muzik": 0.10,
        "otopark": 0.05,
    }
    
    def score(
        self,
        place: Dict[str, Any],
        user_preferences: Dict[str, Any]
    ) -> float:
        """
        Mekanın kullanıcı tercihlerine uyum skoru (0.0 - 1.0)
        
        Args:
            place: Mekan verisi
            user_preferences: {
                "preferred_categories": ["kafe", "restoran"],
                "required_features": ["wifi", "sessiz"],
                "price_range": [1, 3],
                "min_rating": 4.0
            }
        
        Returns:
            0.0 ile 1.0 arası uyum skoru
        """
        score = 0.0
        weights_used = 0.0
        
        # 1. Kategori uyumu (%30 ağırlık)
        category_score = self._category_score(
            place.get("category", "").lower(),
            user_preferences.get("preferred_categories", [])
        )
        score += category_score * 0.30
        weights_used += 0.30
        
        # 2. Rating uyumu (%25 ağırlık)
        rating_score = self._rating_score(
            place.get("rating", 0.0),
            user_preferences.get("min_rating", 3.5)
        )
        score += rating_score * 0.25
        weights_used += 0.25
        
        # 3. Fiyat aralığı uyumu (%20 ağırlık)
        price_score = self._price_score(
            place.get("price_level", 2),
            user_preferences.get("price_range", [1, 3])
        )
        score += price_score * 0.20
        weights_used += 0.20
        
        # 4. Özellik uyumu (%25 ağırlık)
        feature_score = self._feature_score(
            place.get("features", []),
            user_preferences.get("required_features", [])
        )
        score += feature_score * 0.25
        weights_used += 0.25
        
        result = score / weights_used if weights_used > 0 else 0.0
        return float(round(min(result, 1.0), 3))
    
    def _category_score(self, place_category: str, preferred: List[str]) -> float:
        if not preferred:
            return 0.5  # Tercih yoksa nötr
        
        max_sim = 0.0
        for pref in preferred:
            key = (pref.lower(), place_category)
            sim = self.CATEGORY_SIMILARITY.get(key, 0.1)
            max_sim = max(max_sim, sim)
        return max_sim
    
    def _rating_score(self, rating: float, min_rating: float) -> float:
        if rating >= min_rating:
            # 5.0 üzerinden normalize
            return min((rating - min_rating) / (5.0 - min_rating) * 0.5 + 0.5, 1.0)
        return max(0.0, rating / min_rating * 0.5)
    
    def _price_score(self, price_level: int, price_range: List[int]) -> float:
        min_price, max_price = price_range[0], price_range[-1]
        if min_price <= price_level <= max_price:
            return 1.0
        # Aralık dışında ceza
        distance = min(abs(price_level - min_price), abs(price_level - max_price))
        return max(0.0, 1.0 - (distance * 0.35))
    
    def _feature_score(self, place_features: List[str], required: List[str]) -> float:
        if not required:
            return 0.7  # Tercih yoksa yüksek nötr
        if not place_features:
            return 0.2
        
        place_features_lower = [f.lower() for f in place_features]
        matched = sum(1 for r in required if r.lower() in place_features_lower)
        return matched / len(required)
    
    def batch_score(
        self,
        places: List[Dict],
        user_preferences: Dict
    ) -> List[Dict]:
        """Tüm mekanları skorla ve content_score ekle"""
        for place in places:
            place["content_score"] = self.score(place, user_preferences)
        return sorted(places, key=lambda x: x["content_score"], reverse=True)


# ==================== 2. İŞBİRLİKÇİ FİLTRELEME ====================

class CollaborativeFilter:
    """
    Kullanıcı davranış verilerine göre öneri üretir.
    
    "Senin gibi kullanıcılar bu mekanları beğendi" mantığı.
    Şu an lightweight versiyon - tam veri tabanı bağlantısı olmadan çalışır.
    """
    
    def __init__(self):
        # Kullanıcı davranış simülasyonu (gerçek DB olmadan)
        self._interaction_cache: Dict[str, List[str]] = {}
    
    def record_interaction(
        self,
        user_id: str,
        place_id: str,
        interaction_type: str = "view"  # view, like, visit
    ) -> None:
        """Kullanıcı etkileşimini kaydet"""
        if user_id not in self._interaction_cache:
            self._interaction_cache[user_id] = []
        self._interaction_cache[user_id].append(f"{interaction_type}:{place_id}")
    
    def get_user_based_boost(
        self,
        place: Dict,
        user_id: Optional[str],
        similar_users_liked: Optional[List[str]] = None
    ) -> float:
        """
        Benzer kullanıcıların bu mekanı beğenip beğenmediğine göre boost.
        
        Returns:
            -0.1 ile +0.2 arası boost değeri
        """
        if not user_id or not similar_users_liked:
            return 0.0
        
        place_id = place.get("data_id", place.get("name", ""))
        
        if place_id in similar_users_liked:
            return 0.15  # Benzer kullanıcılar beğenmiş → boost
        
        return 0.0
    
    def popularity_score(self, place: Dict) -> float:
        """
        Genel popülerlik skoru (rating + review_count bazlı)
        
        Returns:
            0.0 ile 1.0 arası popülerlik skoru
        """
        rating = place.get("rating", 0.0)
        review_count = place.get("review_count", 0)
        
        # Rating ağırlığı: 60%
        rating_component = (rating / 5.0) * 0.6
        
        # Review count ağırlığı: 40% (log scale - 1000 yorum = max)
        if review_count > 0:
            log_reviews = math.log10(min(review_count, 10000)) / math.log10(10000)
            review_component = log_reviews * 0.4
        else:
            review_component = 0.0
        
        return float(round(min(rating_component + review_component, 1.0), 3))
    
    def trending_boost(self, place: Dict) -> float:
        """
        Günün saatine ve hava koşuluna göre trend boost.
        Akşam saatlerinde barlar, sabah kafeleri boost alır.
        """
        hour = datetime.now().hour
        category = place.get("category", "").lower()
        
        boosts = {
            # Sabah (06-11): Kahvaltı ve kafe zamanı
            (6, 11): {"kafe": 0.10, "kahvaltı": 0.15, "restoran": 0.05},
            # Öğle (11-15): Restoran zamanı
            (11, 15): {"restoran": 0.12, "kafe": 0.05},
            # İkindi (15-18): Kafe zamanı
            (15, 18): {"kafe": 0.10, "pasta": 0.08},
            # Akşam (18-23): Restoran ve bar zamanı
            (18, 23): {"restoran": 0.12, "bar": 0.10, "küçük sahne": 0.08},
        }
        
        for (start, end), category_boosts in boosts.items():
            if start <= hour < end:
                for cat_key, boost in category_boosts.items():
                    if cat_key in category:
                        return boost
        
        return 0.0


# ==================== 3. HİBRİT SIRALAYICI ====================

class HybridRanker:
    """
    Content-based ve Collaborative filtering sonuçlarını birleştirir.
    
    Nihai skor = α * content_score + β * collab_score + γ * serpapi_score
    
    Varsayılan ağırlıklar:
    - α = 0.35 (içerik uyumu)
    - β = 0.25 (popülerlik + işbirlikçi)
    - γ = 0.40 (SerpAPI/RAG skoru - en güvenilir sinyal)
    """
    
    def __init__(
        self,
        content_weight: float = 0.35,
        collab_weight: float = 0.25,
        base_weight: float = 0.40
    ):
        self.content_filter = ContentBasedFilter()
        self.collab_filter = CollaborativeFilter()
        
        self.alpha = content_weight  # İçerik uyumu
        self.beta = collab_weight    # İşbirlikçi
        self.gamma = base_weight     # Temel skor (SerpAPI/RAG)
        
        # Normalize et
        total = self.alpha + self.beta + self.gamma
        self.alpha /= total
        self.beta /= total
        self.gamma /= total
    
    def rank(
        self,
        places: List[Dict],
        user_preferences: Optional[Dict] = None,
        user_id: Optional[str] = None,
        base_score_key: str = "match_score"
    ) -> List[Dict]:
        """
        Mekanları hibrit skora göre sırala.
        
        Args:
            places: Mekan listesi
            user_preferences: Kullanıcı tercihleri
            user_id: Kullanıcı ID (kişiselleştirme için)
            base_score_key: Temel skor alanı adı
        
        Returns:
            Hybrid score ile sıralanmış mekan listesi
        """
        if not places:
            return []
        
        preferences = user_preferences or {}
        
        for place in places:
            # 1. İçerik skoru
            content_score = self.content_filter.score(place, preferences)
            
            # 2. Popülerlik skoru + trend boost
            pop_score = self.collab_filter.popularity_score(place)
            trend = self.collab_filter.trending_boost(place)
            collab_score = min(pop_score + trend, 1.0)
            
            # 3. Temel skor (SerpAPI match score veya RAG score)
            base_score = place.get(base_score_key, 0.5)
            # 0-1 aralığına normalize
            if base_score > 1.0:
                base_score = base_score / 10.0
            base_score = max(0.0, min(base_score, 1.0))
            
            # 4. Hibrit skor
            hybrid = (
                self.alpha * content_score +
                self.beta * collab_score +
                self.gamma * base_score
            )
            
            # 5. Review insight bonus (varsa)
            review_bonus = self._review_insight_bonus(place)
            
            final_score = min(hybrid + review_bonus, 1.0)
            
            place["hybrid_score"] = float(round(final_score, 4))
            place["score_breakdown_hybrid"] = {
                "content":    float(round(content_score, 3)),
                "popularity": float(round(pop_score, 3)),
                "trend":      float(round(trend, 3)),
                "base":       float(round(base_score, 3)),
                "review_bonus": float(round(review_bonus, 3)),
                "final":      float(round(final_score, 4))
            }
        
        return sorted(places, key=lambda x: x["hybrid_score"], reverse=True)
    
    def _review_insight_bonus(self, place: Dict) -> float:
        """
        Yorum analizinden gelen confidence bonus'u.
        Çok sayıda yorum varsa ve yüksek confidence → bonus
        """
        insights = place.get("review_insights", {})
        specialties = insights.get("specialties", [])
        
        if not specialties:
            return 0.0
        
        # En yüksek güvenli specialtyi bul
        top_confidence = max(
            (s.get("confidence", 0) * s.get("mention_rate", 0))
            for s in specialties
        )
        
        # Max %5 bonus (güvenilir yorum sinyali)
        return float(round(top_confidence * 0.05, 3))
    
    def explain(self, place: Dict) -> str:
        """Mekanın neden önerildiğini açıkla"""
        breakdown = place.get("score_breakdown_hybrid", {})
        name = place.get("name", "Bu mekan")
        parts = []
        
        if breakdown.get("content", 0) > 0.7:
            parts.append("tercihlerinizle uyumlu")
        if breakdown.get("popularity", 0) > 0.7:
            parts.append("çok popüler")
        if breakdown.get("trend", 0) > 0:
            parts.append("bu saatler için ideal")
        if breakdown.get("review_bonus", 0) > 0:
            parts.append("yüksek güvenilir yorum")
        
        if parts:
            return f"{name}: {', '.join(parts)}"
        return f"{name}: genel uygunluk"


# ==================== FACTORY / KULLANIM ====================

def create_default_ranker() -> HybridRanker:
    """Varsayılan hibrit sıralayıcı oluştur"""
    return HybridRanker(
        content_weight=0.35,
        collab_weight=0.25,
        base_weight=0.40
    )


def rank_places_for_user(
    places: List[Dict],
    user_preferences: Optional[Dict] = None,
    user_id: Optional[str] = None
) -> List[Dict]:
    """
    Kullanıcıya özel mekan sıralaması.
    
    Kullanım:
        ranked = rank_places_for_user(
            places=search_results,
            user_preferences={
                "preferred_categories": ["kafe"],
                "required_features": ["wifi"],
                "price_range": [1, 2],
                "min_rating": 4.0
            }
        )
    """
    ranker = create_default_ranker()
    return ranker.rank(places, user_preferences, user_id)


# ==================== TEST ====================

if __name__ == "__main__":
    test_places = [
        {
            "name": "Moda Kafe",
            "category": "Kafe",
            "rating": 4.7,
            "review_count": 320,
            "price_level": 2,
            "features": ["wifi", "sessiz"],
            "match_score": 0.85
        },
        {
            "name": "Sahil Restoran",
            "category": "Restoran",
            "rating": 4.9,
            "review_count": 1200,
            "price_level": 3,
            "features": ["deniz_manzarasi", "bahce"],
            "match_score": 0.72
        },
        {
            "name": "Küçük Bar",
            "category": "Bar",
            "rating": 4.3,
            "review_count": 89,
            "price_level": 2,
            "features": ["canlı_muzik"],
            "match_score": 0.60
        }
    ]
    
    user_prefs = {
        "preferred_categories": ["kafe", "restoran"],
        "required_features": ["wifi"],
        "price_range": [1, 3],
        "min_rating": 4.0
    }
    
    ranker = HybridRanker()
    ranked = ranker.rank(test_places, user_prefs)
    
    print("\n=== HİBRİT SIRALAMA SONUÇLARI ===\n")
    for i, place in enumerate(ranked, 1):
        print(f"{i}. {place['name']}")
        print(f"   Hybrid Score: {place['hybrid_score']}")
        b = place['score_breakdown_hybrid']
        print(f"   İçerik: {b['content']} | Popülerlik: {b['popularity']} | Temel: {b['base']}")
        print(f"   → {ranker.explain(place)}\n")
