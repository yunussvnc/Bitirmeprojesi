"""
Fine-tuning için veri hazırlama scripti
Mekan önerileri için özel veri seti oluşturur
"""

import sys
import os
import json
from typing import List, Dict
import random

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.config import settings
import httpx
from dotenv import load_dotenv

load_dotenv()


def create_prompt_template(mekan_bilgisi: Dict, kullanici_sorgusu: str) -> str:
    """Fine-tuning için prompt template oluştur"""
    
    system_prompt = (
        "Sen bir mekan öneri asistanısın. Kullanıcıların isteklerine göre "
        "en uygun mekanları öneriyorsun. Türkçe yanıt veriyorsun. "
        "Kısa, öz ve samimi bir dil kullan.\n\n"
    )
    
    context = (
        f"Mekan Adı: {mekan_bilgisi.get('ad', 'N/A')}\n"
        f"Kategori: {mekan_bilgisi.get('kategori', 'N/A')}\n"
        f"Açıklama: {mekan_bilgisi.get('aciklama', 'N/A')}\n"
        f"Adres: {mekan_bilgisi.get('adres', 'N/A')}\n\n"
    )
    
    user_query = f"Kullanıcı: {kullanici_sorgusu}\n"
    assistant_response = (
        f"Bu mekanı öneriyorum çünkü: {mekan_bilgisi.get('aciklama', '')} "
        f"ve {kullanici_sorgusu.lower()} kriterlerine uygun görünüyor."
    )
    
    return {
        "system": system_prompt,
        "user": context + user_query,
        "assistant": assistant_response
    }


def generate_training_examples(mekanlar: List[Dict], num_examples: int = 50) -> List[Dict]:
    """Örnek eğitim verileri oluştur"""
    
    # Örnek kullanıcı sorguları
    example_queries = [
        "Sakin bir kafe arıyorum, wifi olmalı",
        "Ailemle gidebileceğim bir restoran",
        "Romantik bir akşam yemeği için yer",
        "Hızlı ve lezzetli yemek yiyebileceğim bir yer",
        "Çalışmak için sessiz bir kafe",
        "Denize yakın, güzel manzaralı restoran",
        "Ucuz ama lezzetli yemek",
        "Vegan seçenekleri olan restoran",
        "Kahvaltı için güzel bir mekan",
        "Gece geç saatlere kadar açık bar",
        "Çocuk dostu restoran",
        "Görüşme yapabileceğim profesyonel bir mekan",
        "Türk mutfağı restoranı",
        "İtalyan mutfağı seviyorum",
        "Sushi yiyebileceğim yer"
    ]
    
    training_data = []
    
    for i in range(num_examples):
        # Rastgele mekan ve sorgu seç
        mekan = random.choice(mekanlar)
        sorgu = random.choice(example_queries)
        
        # Prompt oluştur
        prompt_data = create_prompt_template(mekan, sorgu)
        
        training_data.append({
            "instruction": prompt_data["system"] + prompt_data["user"],
            "output": prompt_data["assistant"],
            "input": "",
            "category": "mekan_onerisi"
        })
    
    return training_data


def get_mekanlar_from_backend() -> List[Dict]:
    """Backend'den mekanları al"""
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{settings.BACKEND_API_URL}/api/v1/mekanlar",
                params={"limit": 100}
            )
            response.raise_for_status()
            return response.json()
    except Exception as e:
        print(f"Backend'den veri alınamadı: {e}")
        # Örnek veri oluştur
        return create_sample_mekanlar()


def create_sample_mekanlar() -> List[Dict]:
    """Örnek mekan verileri oluştur"""
    return [
        {
            "id": 1,
            "ad": "Sakin Kafe",
            "kategori": "Kafe",
            "aciklama": "Sessiz ve huzurlu bir ortam, güçlü wifi, lezzetli kahve",
            "adres": "Kadıköy, İstanbul",
            "enlem": 41.0082,
            "boylam": 28.9784
        },
        {
            "id": 2,
            "ad": "Aile Restoranı",
            "kategori": "Restoran",
            "aciklama": "Aile dostu ortam, geniş menü, çocuk oyun alanı",
            "adres": "Beşiktaş, İstanbul",
            "enlem": 41.0426,
            "boylam": 29.0083
        },
        {
            "id": 3,
            "ad": "Romantik Akşam",
            "kategori": "Restoran",
            "aciklama": "Deniz manzaralı, romantik atmosfer, özel menü",
            "adres": "Bebek, İstanbul",
            "enlem": 41.0828,
            "boylam": 29.0436
        }
    ]


def save_training_data(data: List[Dict], output_file: str = "data/processed/training_data.json"):
    """Eğitim verilerini kaydet"""
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✓ {len(data)} eğitim örneği kaydedildi: {output_file}")


def main():
    """Ana fonksiyon"""
    print("\n" + "="*60)
    print("Fine-tuning Veri Hazırlama")
    print("="*60 + "\n")
    
    # Mekanları al
    print("📥 Mekan verileri alınıyor...")
    mekanlar = get_mekanlar_from_backend()
    print(f"✓ {len(mekanlar)} mekan bulundu\n")
    
    # Eğitim verilerini oluştur
    print("🔄 Eğitim verileri oluşturuluyor...")
    training_data = generate_training_examples(mekanlar, num_examples=100)
    print(f"✓ {len(training_data)} örnek oluşturuldu\n")
    
    # Kaydet
    print("💾 Veriler kaydediliyor...")
    save_training_data(training_data, "data/processed/training_data.json")
    
    # Örnek göster
    print("\n📝 Örnek eğitim verisi:")
    print("-" * 60)
    example = training_data[0]
    print(f"Instruction: {example['instruction'][:100]}...")
    print(f"Output: {example['output']}")
    
    print("\n" + "="*60)
    print("✓ Veri hazırlama tamamlandı!")
    print("="*60 + "\n")
    print("Sonraki adım: python scripts/fine_tune_model.py")
    print()


if __name__ == "__main__":
    main()

