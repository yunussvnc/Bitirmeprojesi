"""
Review Analyzer - Yorumlardan Mekan Özelliklerini Çıkaran AI Sistemi
========================================================================

Nasıl çalışır:
1. Mekanın yorumlarını alır (SerpAPI üzerinden)
2. Her yorumda hangi ürün/özellik övülüyor tespit eder
3. "Buranın kahvesi güzel" → kahve specialty çıkarır
4. Öneri gerekçesine "☕ Kahvesiyle meşhur (15 yorum)" ekler
"""

import re
from typing import List, Dict, Optional, Tuple


# ==================== SPECIALTY PATTERNS ====================
# Her kategori için: hangi kelimeler aranır, emoji ve label

SPECIALTY_PATTERNS: Dict[str, Dict] = {
    # Kahve & İçecekler
    "kahve": {
        "keywords": ["kahve", "coffee", "espresso", "latte", "cappuccino", "americano",
                     "filtre kahve", "türk kahvesi", "cold brew", "flat white"],
        "emoji": "☕",
        "label": "Kahvesiyle ünlü",
        "positive_boost": ["mükemmel", "harika", "süper", "nefis", "şahane", "güzel",
                          "iyi", "great", "amazing", "perfect", "delicious", "best"]
    },
    "çay": {
        "keywords": ["çay", "tea", "bitki çayı", "yeşil çay", "papatya"],
        "emoji": "🍵",
        "label": "Çayıyla bilinen",
        "positive_boost": ["güzel", "taze", "iyi", "harika", "nefis"]
    },
    
    # Yiyecekler
    "hamburger": {
        "keywords": ["hamburger", "burger", "hamburgeri", "cheeseburger", "double burger"],
        "emoji": "🍔",
        "label": "Hamburgeriyle meşhur",
        "positive_boost": ["iyi", "güzel", "nefis", "harika", "lezzetli", "mükemmel", "best", "great"]
    },
    "pizza": {
        "keywords": ["pizza", "pizzası", "margherita", "pepperoni"],
        "emoji": "🍕",
        "label": "Pizzasıyla öne çıkan",
        "positive_boost": ["nefis", "güzel", "harika", "iyi", "lezzetli"]
    },
    "tatlı": {
        "keywords": ["tatlı", "pasta", "kek", "cheesecake", "tiramisu", "brownie",
                    "waffle", "pancake", "krep", "croissant", "baklava", "künefe",
                    "dessert", "cake"],
        "emoji": "🍰",
        "label": "Tatlılarıyla ünlü",
        "positive_boost": ["nefis", "harika", "lezzetli", "güzel", "mükemmel", "iyi"]
    },
    "kahvaltı": {
        "keywords": ["kahvaltı", "sabah kahvaltısı", "serpme kahvaltı", "brunch",
                    "breakfast", "menemen", "omlet", "eggs"],
        "emoji": "🍳",
        "label": "Kahvaltısıyla popüler",
        "positive_boost": ["güzel", "nefis", "harika", "zengin", "bol", "lezzetli"]
    },
    "kebap": {
        "keywords": ["kebap", "şiş kebap", "adana", "urfa", "döner", "pide",
                    "lahmacun", "gözleme", "et yemekleri", "izgara"],
        "emoji": "🥙",
        "label": "Kebabıyla bilinen",
        "positive_boost": ["nefis", "lezzetli", "güzel", "harika", "iyi"]
    },
    "balık": {
        "keywords": ["balık", "deniz ürünleri", "seafood", "fish", "levrek", "çipura",
                    "karides", "midye", "ahtapot", "mezze"],
        "emoji": "🐟",
        "label": "Balık/deniz ürünleriyle ünlü",
        "positive_boost": ["taze", "nefis", "güzel", "harika", "lezzetli"]
    },
    "sandviç": {
        "keywords": ["sandviç", "sandwich", "tost", "wrap", "dürüm", "banh mi"],
        "emoji": "🥪",
        "label": "Sandviçiyle bilinen",
        "positive_boost": ["güzel", "lezzetli", "iyi", "nefis", "harika"]
    },
    
    # Ortam/Atmosfer
    "manzara": {
        "keywords": ["manzara", "view", "deniz manzarası", "boğaz", "bosphorus",
                    "panorama", "vista", "görünüm", "doğa manzarası"],
        "emoji": "🌊",
        "label": "Manzarasıyla öne çıkan",
        "positive_boost": ["muhteşem", "harika", "güzel", "nefis", "şahane", "amazing", "beautiful"]
    },
    "atmosfer": {
        "keywords": ["atmosfer", "ambiance", "ambiyans", "ortam", "dekorasyon",
                    "dekor", "dizayn", "tasarım", "iç mekan", "ferah", "şık"],
        "emoji": "✨",
        "label": "Atmosferiyle beğenilen",
        "positive_boost": ["güzel", "harika", "şık", "şahane", "hoş", "nice", "cozy", "lovely"]
    },
    "müzik": {
        "keywords": ["müzik", "music", "canlı müzik", "live music", "dj", "konser",
                    "playlist", "ses sistemi"],
        "emoji": "🎵",
        "label": "Müziğiyle bilinen",
        "positive_boost": ["güzel", "harika", "iyi", "kaliteli"]
    },
    
    # Hizmet/Deneyim
    "hizmet": {
        "keywords": ["hizmet", "service", "garson", "personel", "staff", "ilgili",
                    "güler yüzlü", "friendly", "helpful", "kind"],
        "emoji": "👨‍💼",
        "label": "Hizmet kalitesiyle öne çıkan",
        "positive_boost": ["mükemmel", "harika", "güzel", "iyi", "kaliteli", "excellent", "great"]
    },
    "fiyat": {
        "keywords": ["fiyat", "uygun", "ucuz", "ekonomik", "reasonable", "affordable",
                    "değer", "value for money", "fiyat performans"],
        "emoji": "💰",
        "label": "Uygun fiyatıyla bilinen",
        "positive_boost": ["çok uygun", "makul", "iyi", "güzel", "reasonable", "affordable"]
    },
    
    # Spesifik içecekler
    "smoothie": {
        "keywords": ["smoothie", "meyve suyu", "taze sıkma", "juice", "fresh juice"],
        "emoji": "🥤",
        "label": "İçecekleriyle ünlü",
        "positive_boost": ["taze", "güzel", "nefis", "iyi"]
    },
    "kokteyl": {
        "keywords": ["kokteyl", "cocktail", "mocktail", "bitter", "gin", "viski",
                    "şarap", "wine", "bira", "beer", "alkol"],
        "emoji": "🍹",
        "label": "İçecekleriyle popüler",
        "positive_boost": ["güzel", "harika", "iyi", "kaliteli", "good"]
    },
}

# Pozitif bağlam kelimeleri (negatif olmayan)
NEGATIVE_CONTEXT = [
    "değil", "yok", "olmadı", "berbat", "kötü", "rezalet",
    "tavsiye etmem", "berbattı", "hayal kırıklığı", "beğenmedim",
    "not good", "bad", "terrible", "awful", "worst"
]


class ReviewInsightExtractor:
    """
    Yorumlardan mekan güçlü yönlerini çıkaran sistem
    
    Örnek çıktı:
    {
        "specialties": [
            {
                "key": "kahve",
                "label": "Kahvesiyle ünlü",
                "emoji": "☕",
                "mention_count": 12,
                "confidence": 0.85,
                "example_review": "Kahvesi gerçekten çok güzel, özellikle filtre kahvesi mükemmel"
            }
        ],
        "top_specialty": "☕ Kahvesiyle ünlü (12 yorum)",
        "summary": "Bu mekan özellikle kahvesi ve atmosferiyle öne çıkıyor."
    }
    """
    
    def __init__(self):
        self.patterns = SPECIALTY_PATTERNS
    
    def extract_insights(
        self,
        reviews: List[str],
        place_name: str = ""
    ) -> Dict:
        """
        Yorumlardan mekan özelliklerini çıkar
        
        Args:
            reviews: Yorum metinleri listesi
            place_name: Mekan adı (log için)
        
        Returns:
            Specialties ve özet dict
        """
        if not reviews:
            return {"specialties": [], "top_specialty": None, "summary": ""}
        
        # Her specialty için sayım
        specialty_counts: Dict[str, Dict] = {}
        
        for review in reviews:
            review_lower = review.lower()
            
            # Önce negatif bağlam kontrol et
            has_negative_context = any(neg in review_lower for neg in NEGATIVE_CONTEXT[:5])
            
            for spec_key, spec_data in self.patterns.items():
                # Bu yorumda ilgili keyword var mı?
                matched_keyword = None
                for kw in spec_data["keywords"]:
                    if kw in review_lower:
                        matched_keyword = kw
                        break
                
                if not matched_keyword:
                    continue
                
                # Pozitif bağlam var mı?
                has_positive = any(pos in review_lower for pos in spec_data["positive_boost"])
                
                # Negatif bağlamda geçiyorsa sayma (örn: "kahvesi kötü")
                if has_negative_context:
                    # Sadece aynı cümlede mi diye kontrol et
                    sentences = re.split(r'[.!?,;]', review_lower)
                    for sentence in sentences:
                        if matched_keyword in sentence:
                            is_negative_sentence = any(neg in sentence for neg in NEGATIVE_CONTEXT)
                            if is_negative_sentence:
                                has_positive = False
                                break
                
                # Sayıma ekle
                if spec_key not in specialty_counts:
                    specialty_counts[spec_key] = {
                        "count": 0,
                        "positive_count": 0,
                        "example_review": None
                    }
                
                specialty_counts[spec_key]["count"] += 1
                
                if has_positive:
                    specialty_counts[spec_key]["positive_count"] += 1
                    if not specialty_counts[spec_key]["example_review"]:
                        # Kısa ve anlamlı bir örnek seç
                        specialty_counts[spec_key]["example_review"] = self._extract_relevant_sentence(
                            review, matched_keyword
                        )
        
        # Specialties listesi oluştur
        total_reviews = len(reviews)
        specialties = []
        
        for spec_key, counts in specialty_counts.items():
            if counts["count"] < 2:  # En az 2 yorumda geçmeli
                continue
            
            spec_data = self.patterns[spec_key]
            
            # Confidence: pozitif bahseden yorum oranı
            confidence = counts["positive_count"] / max(counts["count"], 1)
            
            # Çok az güven varsa eklemeka
            if confidence < 0.4:
                continue
            
            # Mention rate (kaç yorumda geçiyor)
            mention_rate = counts["count"] / total_reviews
            
            specialties.append({
                "key": spec_key,
                "label": spec_data["label"],
                "emoji": spec_data["emoji"],
                "mention_count": counts["count"],
                "positive_count": counts["positive_count"],
                "confidence": round(confidence, 2),
                "mention_rate": round(mention_rate, 2),
                "example_review": counts["example_review"] or "",
                "display": f"{spec_data['emoji']} {spec_data['label']} ({counts['count']} yorum)"
            })
        
        # Önce confidence * mention_rate göre sırala
        specialties.sort(key=lambda x: x["confidence"] * x["mention_rate"], reverse=True)
        
        # En fazla 5 specialty
        specialties = specialties[:5]
        
        # Özet oluştur
        top_specialty = specialties[0]["display"] if specialties else None
        summary = self._generate_summary(place_name, specialties, total_reviews)
        
        # Kısa öneri etiketi (Frontend için)
        highlight_tags = [
            f"{s['emoji']} {s['key'].title()}" for s in specialties[:3]
        ]
        
        return {
            "specialties": specialties,
            "top_specialty": top_specialty,
            "highlight_tags": highlight_tags,
            "summary": summary,
            "review_count_analyzed": total_reviews
        }
    
    def _extract_relevant_sentence(self, review: str, keyword: str) -> str:
        """Yorumdan ilgili kelimeyi içeren en kısa cümleyi çıkar"""
        sentences = re.split(r'[.!?\n]', review)
        review_lower = review.lower()
        keyword_lower = keyword.lower()
        
        for sentence in sentences:
            if keyword_lower in sentence.lower():
                sentence = sentence.strip()
                if len(sentence) > 15:  # Çok kısa cümleleri atla
                    # 150 karakteri aşarsa kısalt
                    if len(sentence) > 150:
                        sentence = sentence[:147] + "..."
                    return sentence.strip()
        
        # Bulamazsa review'un başını döndür
        return review[:120] + "..." if len(review) > 120 else review
    
    def _generate_summary(
        self,
        place_name: str,
        specialties: List[Dict],
        total_reviews: int
    ) -> str:
        """Specialties'ten özet metin üret"""
        if not specialties:
            return ""
        
        name = place_name or "Bu mekan"
        
        if len(specialties) == 1:
            s = specialties[0]
            return (f"{name}, {total_reviews} yorumun {s['positive_count']}'inde "
                   f"özellikle {s['key']}i için övülüyor.")
        
        top_labels = [s["label"].lower() for s in specialties[:2]]
        return (f"{name}, müşteri yorumlarında özellikle "
               f"{' ve '.join(top_labels)} ile öne çıkıyor. "
               f"({total_reviews} yorum analiz edildi)")


# ==================== FAST KEYWORD MATCHER (no model needed) ====================

def fast_extract_insights(reviews: List[str], place_name: str = "") -> Dict:
    """
    Model gerektirmeyen hızlı keyword tabanlı insight çıkarma.
    Model yüklü değilse bu kullanılır.
    """
    extractor = ReviewInsightExtractor()
    return extractor.extract_insights(reviews, place_name)


# ==================== TEST ====================

def test_extractor():
    """Test fonksiyonu"""
    sample_reviews = [
        "Kahvesi gerçekten harika, özellikle filtre kahvesi çok güzel yapıyorlar.",
        "Hamburger burada mis gibi, en iyi burger yeri bu semtte.",
        "Kahvesini çok sevdim, tekrar geleceğim kesinlikle.",
        "Kahvaltısı da harikaymuş, zengin bir menü var.",
        "Hizmet biraz yavaştı ama kahvesi buna değdi.",
        "Hamburgeri büyük ve lezzetli, fiyatı da uygun.",
        "Wifi var, sakin bir ortam, çalışmak için ideal.",
        "Manzarası muhteşem, sahil kenarında güzel bir mekan.",
        "Kahvesi güzel ama fiyatlar biraz pahalı.",
        "Personel çok ilgiliydi, hizmet mükemmeldi.",
        "Atmosfer çok güzel, içerisi şık ve ferah.",
        "Kahvesi harika, cappuccino özellikle bir başka.",
    ]
    
    extractor = ReviewInsightExtractor()
    result = extractor.extract_insights(sample_reviews, "Test Mekanı")
    
    print("\n" + "="*60)
    print("YORUM ANALİZİ SONUÇLARI")
    print("="*60)
    print(f"\nAnaliz edilen yorum sayısı: {result['review_count_analyzed']}")
    print(f"\nTop Specialty: {result['top_specialty']}")
    print(f"\nÖzet: {result['summary']}")
    print(f"\nHighlight Tags: {result['highlight_tags']}")
    
    print("\n--- Tüm Specialties ---")
    for s in result['specialties']:
        print(f"\n{s['emoji']} {s['label']}")
        print(f"   Bahsedilme: {s['mention_count']} yorum | Güven: %{s['confidence']*100:.0f}")
        if s['example_review']:
            print(f"   Örnek: \"{s['example_review']}\"")
    
    print("\n" + "="*60)


if __name__ == "__main__":
    test_extractor()
