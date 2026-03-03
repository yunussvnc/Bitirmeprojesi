"""
Faz 3.1: Fine-tuning için gelişmiş training data hazırlama script'i
Gerçek backend verilerini kullanarak Türkçe mekan önerisi için eğitim verisi oluşturur.
"""

import json
import random
import requests
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime


# Configuration
BACKEND_URL = "http://localhost:8080"
OUTPUT_DIR = Path("../data/processed")
OUTPUT_FILE = OUTPUT_DIR / "training_data_v2.json"


def fetch_places_from_backend() -> List[Dict[str, Any]]:
    """Backend'den gerçek mekan verilerini çek"""
    try:
        response = requests.get(f"{BACKEND_URL}/api/info")
        if response.status_code == 200:
            print("✅ Backend'e bağlandı")
            
            # Farklı query'ler ile mekan verilerini topla
            all_places = {}
            queries = [
                "sessiz kafe wifi",
                "romantik restoran",
                "canlı bar",
                "aile restoranı",
                "hızlı yemek",
                "deniz manzaralı",
                "doğa yürüyüşü",
                "lüks otel",
                "bütçe dostu konaklama",
                "alışveriş merkezi"
            ]
            
            for query in queries:
                try:
                    resp = requests.post(
                        f"{BACKEND_URL}/api/smart-search-v2",
                        json={
                            "query": query,
                            "user_lat": 41.0082,
                            "user_lon": 28.9784,
                            "limit": 20
                        },
                        timeout=10
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        places = data.get("places", [])
                        for place in places:
                            place_id = f"{place['name']}-{place['category']}"
                            all_places[place_id] = place
                        print(f"  ✓ '{query}' query'sinden {len(places)} mekan çekildi")
                except Exception as e:
                    print(f"  ⚠ Query '{query}' başarısız: {e}")
                    continue
            
            places_list = list(all_places.values())
            print(f"\n📊 Toplam {len(places_list)} benzersiz mekan bulundu")
            return places_list
            
    except Exception as e:
        print(f"❌ Backend bağlantısı başarısız: {e}")
    
    return []


def create_instruction_format(query: str, user_context: Dict, places: List[Dict], reasoning: str) -> Dict:
    """Gemma chat formatında instruction-response oluştur"""
    
    # User context bilgisi
    context_text = f"Konum: {user_context.get('location', 'İstanbul')}"
    if user_context.get('time'):
        context_text += f", Zaman: {user_context['time']}"
    if user_context.get('budget'):
        context_text += f", Bütçe: {user_context['budget']}"
    
    # Instruction (system + user)
    instruction = f"""Sen İstanbul'da mekan önerisi yapan bir yapay zeka asistanısın. 
Kullanıcının isteğine göre en uygun mekanları öner ve neden önerdiğini açıkla.

Kullanıcı: {query}
Kullanıcı Bilgileri: {context_text}"""
    
    # Response (assistant)
    response_parts = []
    response_parts.append(reasoning)
    response_parts.append("\n\n📍 Önerilen Mekanlar:\n")
    
    for i, place in enumerate(places[:5], 1):  # İlk 5 mekan
        features = place.get('features', '').split(',')
        features_text = ", ".join([f.strip().replace('_', ' ').title() for f in features if f.strip()])
        
        place_text = f"\n{i}. **{place['name']}** ({place['category']})"
        place_text += f"\n   📍 {place.get('address', 'Adres bilgisi yok')}"
        
        if place.get('distance_km'):
            place_text += f"\n   🚶 {place['distance_km']:.1f} km uzaklıkta"
        
        if features_text:
            place_text += f"\n   ✨ Özellikler: {features_text}"
        
        if place.get('reason'):
            place_text += f"\n   💡 {place['reason']}"
        
        response_parts.append(place_text)
    
    response = "".join(response_parts)
    
    return {
        "instruction": instruction,
        "response": response,
        "metadata": {
            "query": query,
            "context": user_context,
            "num_places": len(places),
            "categories": list(set([p['category'] for p in places]))
        }
    }


def generate_diverse_queries() -> List[Dict]:
    """Çeşitli kullanıcı senaryoları oluştur"""
    
    scenarios = [
        # Çalışma mekanları
        {
            "query": "Sakin bir kafede laptop ile çalışmak istiyorum, wifi şart",
            "context": {"location": "Kadıköy", "time": "sabah", "budget": "orta"},
            "category": "Kafe",
            "required_features": ["wifi", "quiet", "laptop_friendly"],
            "reasoning": "Çalışma için sessiz bir ortam, güçlü wifi ve laptop dostu masalar aradınız. Size Kadıköy'de bu kriterlere uygun kafeleri öneriyorum."
        },
        {
            "query": "Arkadaşlarla toplantı yapacağız, sessiz ve geniş masası olan kafe",
            "context": {"location": "Beşiktaş", "time": "öğleden sonra", "budget": "orta"},
            "category": "Kafe",
            "required_features": ["wifi", "quiet"],
            "reasoning": "Grup toplantısı için uygun, sessiz ve geniş masaları olan kafeler öneriyorum."
        },
        
        # Romantik mekanlar
        {
            "query": "Sevgilimle romantik bir akşam yemeği için restoran arıyorum",
            "context": {"location": "Bebek", "time": "akşam", "budget": "yüksek"},
            "category": "Restoran",
            "required_features": ["romantic", "outdoor_seating"],
            "reasoning": "Romantik bir akşam yemeği için şık ambiyansı, manzaralı oturma alanları ve lezzetli menüleri olan restoranlar öneriyorum."
        },
        {
            "query": "Evlilik teklifi için özel bir restoran önerisi",
            "context": {"location": "Ortaköy", "time": "akşam", "budget": "lüks"},
            "category": "Restoran",
            "required_features": ["romantic", "luxury"],
            "reasoning": "Evlilik teklifi gibi özel bir an için unutulmaz bir deneyim sunan, boğaz manzaralı ve lüks restoranlar öneriyorum."
        },
        
        # Aile mekanları
        {
            "query": "Ailece gidebileceğimiz park ve restoran",
            "context": {"location": "Sarıyer", "time": "hafta sonu", "budget": "orta"},
            "category": "Park",
            "required_features": ["family_friendly", "outdoor"],
            "reasoning": "Aile ile vakit geçirmek için çocuk dostu, geniş yeşil alanları ve yakınında restoranları olan parklar öneriyorum."
        },
        {
            "query": "Çocuklarla gidebileceğim oyun alanı olan restoran",
            "context": {"location": "Kadıköy", "time": "öğle", "budget": "orta"},
            "category": "Restoran",
            "required_features": ["family_friendly", "kids_menu"],
            "reasoning": "Çocuklarınızla rahat edebileceğiniz, oyun alanı veya çocuk menüsü olan aile dostu restoranlar öneriyorum."
        },
        
        # Sosyal/eğlence mekanları
        {
            "query": "Arkadaşlarla eğlenceli bir akşam geçireceğimiz canlı bar",
            "context": {"location": "Beyoğlu", "time": "gece", "budget": "orta"},
            "category": "Bar",
            "required_features": ["lively", "live_music"],
            "reasoning": "Eğlenceli bir gece için canlı müziği, keyifli atmosferi ve çeşitli içecek menüsü olan barlar öneriyorum."
        },
        {
            "query": "Canlı müzik dinleyebileceğim mekan",
            "context": {"location": "Beşiktaş", "time": "akşam", "budget": "orta"},
            "category": "Bar",
            "required_features": ["live_music", "lively"],
            "reasoning": "Canlı müzik performansları izleyebileceğiniz, enerjik atmosferi olan mekanlar öneriyorum."
        },
        
        # Hızlı yemek
        {
            "query": "Hızlı öğle yemeği ihtiyacım var, 30 dakikam var",
            "context": {"location": "Şişli", "time": "öğle", "budget": "düşük"},
            "category": "Fast Food",
            "required_features": ["quick_service"],
            "reasoning": "Kısa süreniz için hızlı servis yapan, doyurucu ve lezzetli seçenekleri olan mekanlar öneriyorum."
        },
        
        # Doğa/aktivite
        {
            "query": "Doğa yürüyüşü yapabileceğim yeşil alan",
            "context": {"location": "Beykoz", "time": "sabah", "budget": "ücretsiz"},
            "category": "Park",
            "required_features": ["outdoor", "nature"],
            "reasoning": "Doğa ile baş başa kalabileceğiniz, yürüyüş parkurları olan yeşil alanlar öneriyorum."
        },
        {
            "query": "Piknik yapabileceğim park önerisi",
            "context": {"location": "Sarıyer", "time": "hafta sonu", "budget": "ücretsiz"},
            "category": "Park",
            "required_features": ["outdoor", "picnic_area"],
            "reasoning": "Piknik için geniş yeşil alanları, oturma alanları ve güzel manzaraları olan parklar öneriyorum."
        },
        
        # Konaklama
        {
            "query": "İş seyahati için merkezi konumda otel",
            "context": {"location": "Taksim", "time": "hafta içi", "budget": "orta"},
            "category": "Otel",
            "required_features": ["wifi", "business_friendly"],
            "reasoning": "İş seyahati için ulaşımı kolay, wifi ve çalışma alanı olan oteller öneriyorum."
        },
        {
            "query": "Romantik bir hafta sonu kaçamağı için butik otel",
            "context": {"location": "Bebek", "time": "hafta sonu", "budget": "yüksek"},
            "category": "Otel",
            "required_features": ["romantic", "luxury", "spa"],
            "reasoning": "Romantik bir kaçamak için boğaz manzaralı, spa ve özel hizmetleri olan butik oteller öneriyorum."
        },
        
        # Alışveriş
        {
            "query": "Alışveriş merkezi önerisi",
            "context": {"location": "Şişli", "time": "hafta sonu", "budget": "değişken"},
            "category": "AVM",
            "required_features": ["shopping", "food_court"],
            "reasoning": "Çeşitli mağazaları, yeme-içme alanları ve eğlence seçenekleri olan alışveriş merkezleri öneriyorum."
        },
        
        # Kahvaltı
        {
            "query": "Serpme kahvaltı yapabileceğim mekan",
            "context": {"location": "Beşiktaş", "time": "sabah", "budget": "orta"},
            "category": "Kafe",
            "required_features": ["brunch", "outdoor_seating"],
            "reasoning": "Zengin serpme kahvaltı seçenekleri ve keyifli ortamı olan mekanlar öneriyorum."
        },
        
        # Manzara/fotoğraf
        {
            "query": "Boğaz manzaralı fotoğraf çekebileceğim kafe",
            "context": {"location": "Ortaköy", "time": "öğleden sonra", "budget": "orta"},
            "category": "Kafe",
            "required_features": ["outdoor_seating", "view"],
            "reasoning": "Instagram'lık fotoğraflar için muhteşem boğaz manzarasına sahip kafeler öneriyorum."
        },
        
        # Çalışma + Sosyal
        {
            "query": "Hem çalışıp hem arkadaşlarla vakit geçirebileceğim mekan",
            "context": {"location": "Kadıköy", "time": "öğleden sonra", "budget": "orta"},
            "category": "Kafe",
            "required_features": ["wifi", "lively"],
            "reasoning": "Hem çalışma hem sosyalleşme için uygun, wifi'si güçlü ve keyifli atmosferi olan kafeler öneriyorum."
        },
        
        # Öğrenci dostu
        {
            "query": "Öğrenci dostu ucuz kafe",
            "context": {"location": "Beşiktaş", "time": "öğleden sonra", "budget": "düşük"},
            "category": "Kafe",
            "required_features": ["wifi", "budget_friendly"],
            "reasoning": "Öğrenciler için uygun fiyatlı, wifi ve çalışma ortamı sunan kafeler öneriyorum."
        },
        
        # Sağlıklı beslenme
        {
            "query": "Vegan/vejetaryen seçenekleri olan restoran",
            "context": {"location": "Kadıköy", "time": "öğle", "budget": "orta"},
            "category": "Restoran",
            "required_features": ["vegan_options", "healthy"],
            "reasoning": "Sağlıklı beslenme tercihlerinize uygun, vegan ve vejetaryen menüleri zengin restoranlar öneriyorum."
        },
        
        # Özel günler
        {
            "query": "Doğum günü kutlaması için mekan",
            "context": {"location": "Beşiktaş", "time": "akşam", "budget": "yüksek"},
            "category": "Restoran",
            "required_features": ["lively", "celebration_friendly"],
            "reasoning": "Doğum günü gibi özel günler için eğlenceli atmosferi ve grup rezervasyonlarına uygun mekanlar öneriyorum."
        }
    ]
    
    return scenarios


def create_training_dataset(places_data: List[Dict], num_examples: int = 100) -> List[Dict]:
    """Training dataset oluştur"""
    
    scenarios = generate_diverse_queries()
    training_examples = []
    
    print(f"\n🔨 {len(scenarios)} farklı senaryo ile training data oluşturuluyor...")
    
    # Her senaryoyu kullan
    for scenario in scenarios:
        # Senaryoya uygun mekanları filtrele
        matching_places = []
        
        for place in places_data:
            # Kategori eşleşmesi
            if place['category'].lower() != scenario['category'].lower():
                continue
            
            # Feature eşleşmesi
            place_features = set(place.get('features', '').lower().split(','))
            place_features = {f.strip() for f in place_features if f.strip()}
            
            required_features = set(scenario.get('required_features', []))
            
            # En az bir required feature eşleşmeli
            if required_features and not (required_features & place_features):
                continue
            
            matching_places.append(place)
        
        if matching_places:
            # En fazla 10 mekan seç
            selected_places = random.sample(matching_places, min(10, len(matching_places)))
            
            # Training örneği oluştur
            example = create_instruction_format(
                query=scenario['query'],
                user_context=scenario['context'],
                places=selected_places,
                reasoning=scenario['reasoning']
            )
            
            training_examples.append(example)
            print(f"  ✓ '{scenario['query'][:50]}...' için {len(selected_places)} mekan eklendi")
        else:
            print(f"  ⚠ '{scenario['query'][:50]}...' için uygun mekan bulunamadı")
    
    # Eğer hedef sayısından az örnek varsa, random kombinasyonlar ekle
    while len(training_examples) < num_examples:
        scenario = random.choice(scenarios)
        random_places = random.sample(places_data, min(10, len(places_data)))
        
        example = create_instruction_format(
            query=scenario['query'],
            user_context=scenario['context'],
            places=random_places,
            reasoning=scenario['reasoning']
        )
        
        training_examples.append(example)
    
    print(f"\n✅ Toplam {len(training_examples)} training örneği oluşturuldu")
    return training_examples[:num_examples]


def save_training_data(examples: List[Dict], output_file: Path):
    """Training data'yı JSON formatında kaydet"""
    
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    dataset = {
        "metadata": {
            "created_at": datetime.now().isoformat(),
            "num_examples": len(examples),
            "format": "instruction-response",
            "model_target": "google/gemma-2-2b-it",
            "language": "tr"
        },
        "data": examples
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 Training data kaydedildi: {output_file}")
    print(f"📊 Toplam boyut: {output_file.stat().st_size / 1024:.1f} KB")


def main():
    print("=" * 60)
    print("🚀 FAZ 3.1: FINE-TUNING TRAINING DATA PREPARATION")
    print("=" * 60)
    
    # 1. Backend'den mekan verilerini çek
    print("\n📡 Adım 1: Backend'den mekan verileri çekiliyor...")
    places_data = fetch_places_from_backend()
    
    if not places_data:
        print("\n❌ Backend'den veri çekilemedi! Backend çalışıyor mu?")
        print("💡 Backend'i başlatmak için: cd ai-llm && python demo_backend_v2.py")
        return
    
    # 2. Training dataset oluştur
    print("\n🔨 Adım 2: Training dataset oluşturuluyor...")
    training_examples = create_training_dataset(places_data, num_examples=80)
    
    if not training_examples:
        print("\n❌ Training örneği oluşturulamadı!")
        return
    
    # 3. Kaydet
    print("\n💾 Adım 3: Training data kaydediliyor...")
    save_training_data(training_examples, OUTPUT_FILE)
    
    # 4. Özet bilgi
    print("\n" + "=" * 60)
    print("✅ BAŞARILI!")
    print("=" * 60)
    print(f"📁 Dosya: {OUTPUT_FILE}")
    print(f"📊 Örnek sayısı: {len(training_examples)}")
    print(f"🏷️ Kategoriler: {len(set([ex['metadata']['categories'][0] for ex in training_examples if ex['metadata']['categories']]))}")
    print("\n🎯 Sonraki adım: Fine-tuning script'ini çalıştır")
    print("   python scripts/fine_tune_gemma_lora.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
