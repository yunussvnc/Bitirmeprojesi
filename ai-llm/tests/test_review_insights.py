"""
Review Insight Sistemi - Hızlı Test
Gerçek SerpAPI verisi olmadan çalışır, sahte verilerle test eder.
"""

import sys
sys.path.insert(0, '.')

from review_analyzer import ReviewInsightExtractor, fast_extract_insights

def test_kahve_mekan():
    """Kahvesiyle bilinen bir kafenin yorumları"""
    reviews = [
        "Kahvesi gerçekten harika yapıyorlar, filtre kahvesi bir başka!",
        "Flat white içtik, mükemmeldi. Kesinlikle gelin.",
        "Kahvesi için bile yolu uzak olsa gelirim.",
        "Ortamı güzel ama kahvesi daha da güzel.",
        "En iyi espresso burada içtim şu ana kadar.",
        "Hizmet biraz yavaş ama kahvesi harika buna değer.",
        "Cappuccino mükemmeldi, personel de çok ilgiliydi.",
        "Deniz manzarası eşliğinde kahve içmek için ideal.",
        "Fiyatlar biraz yüksek ama kahve kalitesi yüksek.",
        "Arkadaşlarla güzel bir kahve molası geçirdik.",
        "Wifi var, kahve güzel, çalışmak için ideal mekan.",
        "Kahvaltı menüsü de güzelmiş, kahvesiyle birlikte harika.",
    ]
    
    result = fast_extract_insights(reviews, "Moda Kahve")
    
    print("\n" + "="*60)
    print("☕ KAHVE MEKANI TEST")
    print("="*60)
    print(f"Analiz: {result['review_count_analyzed']} yorum")
    print(f"Top: {result['top_specialty']}")
    print(f"Özet: {result['summary']}")
    print(f"Tags: {result['highlight_tags']}")
    
    for s in result['specialties']:
        print(f"\n  {s['display']}")
        print(f"  Güven: %{s['confidence']*100:.0f} | Bahsedilme: %{s['mention_rate']*100:.0f}")
        if s['example_review']:
            print(f"  → \"{s['example_review'][:80]}\"")


def test_hamburger_mekan():
    """Hamburgeriyle ünlü bir mekanın yorumları"""
    reviews = [
        "Hamburger burada gerçekten nefis, en iyi burger yeri!",
        "Double burger yedik, devasa ve lezzetli.",
        "Hamburgeri için özellikle geliyorum, muhteşem.",
        "Patates ve hamburger ikili harika uyum.",
        "Burger fiyatına göre biraz pahalı ama lezzetli.",
        "Burger burada başka, çok güzel yapıyorlar.",
        "Menüdeki tüm burgerlar denemeye değer.",
        "Smash burger denedik, harika bir deneyimdi.",
        "Hizmet iyi, hamburger daha iyi!",
        "Çok kalabalık olduğu için bekledik ama burgerlar buna değdi.",
    ]
    
    result = fast_extract_insights(reviews, "Burger Bros")
    
    print("\n" + "="*60)
    print("🍔 HAMBURGER MEKANI TEST")
    print("="*60)
    print(f"Analiz: {result['review_count_analyzed']} yorum")
    print(f"Top: {result['top_specialty']}")
    print(f"Özet: {result['summary']}")
    
    for s in result['specialties']:
        print(f"\n  {s['display']}")
        if s['example_review']:
            print(f"  → \"{s['example_review'][:80]}\"")


def test_karma_mekan():
    """Çoklu özelliğe sahip bir mekanın yorumları"""
    reviews = [
        "Deniz manzarası muhteşem, balığı nefis!",
        "Balık yemekleri harika, özellikle çipura.",
        "Manzarası şahane, akşam yemeği için ideal.",
        "Kahvaltı menüsü zengin, kahvesi de güzel.",
        "Tatlıları nefis, cheesecake özellikle iyi.",
        "Hizmet kalitesi mükemmel, garsonlar çok ilgili.",
        "Deniz kenarında akşam yemeği, balık harika.",
        "Atmosfer romantik, manzara eşsiz.",
        "Kahvaltı ve balık için geliyoruz her hafta.",
        "Tatlılarının tadı benzersiz, tiramisu özellikle.",
        "Sahildeki konumu harika, manzara güzel.",
        "Fiyat performans dengesi iyi, önerilir.",
    ]
    
    result = fast_extract_insights(reviews, "Sahil Restaurant")
    
    print("\n" + "="*60)
    print("🌊 KARMA MEKAN TEST")
    print("="*60)
    print(f"Analiz: {result['review_count_analyzed']} yorum")
    print(f"Top: {result['top_specialty']}")
    print(f"Tags: {result['highlight_tags']}")
    
    for s in result['specialties']:
        print(f"\n  {s['display']}")
        print(f"  Örnek: \"{s['example_review'][:70] if s['example_review'] else 'N/A'}\"")


def test_negatif_yorumlar():
    """Karışık yorumlar - negatif filtresi testi"""
    reviews = [
        "Kahvesi fena değil ama fiyatlar çok pahalı.",
        "Kahvesi güzel ama servis berbat.",
        "Kahve iyi ama bekleme süresi çok uzun.",
        "Kahvesi harika, kesinlikle tekrar gelirim.",
        "Ortam güzel, kahve nefis.",
        "Kahvesi yetersiz buldum, başka yere gidebilir.",  # negatif
        "Kahvesi kötüydü, beklentimi karşılamadı.",        # negatif
        "Kahvesi iyi ama servis çok yavaş aylık değil.",
        "Kahvesi süper, ortamı güzel.",
        "Kahve mükemmel, fiyat makul.",
    ]
    
    result = fast_extract_insights(reviews, "Karışık Mekan")
    
    print("\n" + "="*60)
    print("⚖️ NEGATİF FİLTRE TESTİ")
    print("="*60)
    print(f"Analiz: {result['review_count_analyzed']} yorum (2 negatif yorum içeriyor)")
    print(f"Top: {result['top_specialty']}")
    
    for s in result['specialties']:
        print(f"\n  {s['display']}")
        print(f"  Pozitif/Toplam: {s['positive_count']}/{s['mention_count']}")


if __name__ == "__main__":
    print("\n🔍 REVIEW INSIGHT SİSTEMİ TEST")
    print("Yorumlardan 'ne ile övülüyor' tespiti\n")
    
    test_kahve_mekan()
    test_hamburger_mekan()
    test_karma_mekan()
    test_negatif_yorumlar()
    
    print("\n" + "="*60)
    print("✅ Tüm testler tamamlandı!")
    print("="*60)
    print("\nAPI üzerinden kullanım:")
    print("  POST /api/smart-search-v2")
    print('  {"query": "Kadıköy kafe", "analyze_reviews": true}')
    print("\n  Response\'da her mekan için:")
    print("  place.review_insights.top_specialty  → '☕ Kahvesiyle ünlü (8 yorum)'")
    print("  place.review_insights.highlight_tags → ['☕ Kahve', '🍰 Tatlılar']")
    print("  place.recommendation_reason → '☕ Kahvesiyle ünlü • ⭐ Yüksek puan'")
