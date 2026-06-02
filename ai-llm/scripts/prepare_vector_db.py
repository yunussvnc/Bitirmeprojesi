"""
Vektör Veritabanını Hazırlama Scripti
Mekan verilerini backend'den alıp embedding'lere dönüştürür ve Qdrant'a yükler
"""

import sys
import os
import asyncio
import httpx
import json
import argparse

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.vector_db.qdrant_client import QdrantVectorDB
from src.models.embeddings.embedding_model import EmbeddingModel
from src.config import settings
from qdrant_client.models import PointStruct
from dotenv import load_dotenv
import logging

# Logging'i ayarla
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .env dosyasını yükle
load_dotenv()


def get_mekanlar_from_json(json_path=None):
    """JSON dosyasından mekanları al"""
    try:
        json_path = json_path or os.path.join(os.path.dirname(__file__), '..', 'data', 'loaded_places.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            mekanlar = json.load(f)
        logger.info(f"JSON'dan {len(mekanlar)} mekan alındı")

        # JSON formatını normalize et
        normalized = []
        for idx, mekan in enumerate(mekanlar):
            normalized.append({
                "id": idx + 1,
                "ad": mekan.get("name", ""),
                "kategori": mekan.get("category", ""),
                "aciklama": mekan.get("description", ""),
                "adres": mekan.get("address", ""),
                "enlem": mekan.get("latitude"),
                "boylam": mekan.get("longitude"),
                "rating": mekan.get("rating", 0),
                "review_count": mekan.get("review_count", 0),
                "user_review": mekan.get("user_review", "")
            })
        return normalized
    except Exception as e:
        logger.error(f"JSON dosyasından mekan alınamadı: {e}")
        return []


def get_mekanlar_from_backend():
    """Backend API'den mekanları al (fallback)"""
    try:
        with httpx.Client() as client:
            response = client.get(
                f"{settings.BACKEND_API_URL}/api/v1/mekanlar",
                params={"limit": 1000}  # Tüm mekanları al
            )
            response.raise_for_status()
            mekanlar = response.json()
            logger.info(f"Backend'den {len(mekanlar)} mekan alındı")
            return mekanlar
    except Exception as e:
        logger.error(f"Backend'den mekan alınamadı: {e}")
        return []


def create_embedding_text(mekan: dict) -> str:
    """Mekan bilgilerinden embedding için metin oluştur"""
    parts = []
    
    # Mekan adı
    if mekan.get("ad"):
        parts.append(mekan["ad"])
    
    # Kategori
    if mekan.get("kategori"):
        parts.append(f"Kategori: {mekan['kategori']}")
    
    # Açıklama
    if mekan.get("aciklama"):
        parts.append(mekan["aciklama"])

    # Kullanıcı yorumu (önemli!)
    if mekan.get("user_review"):
        parts.append(f"Yorum: {mekan['user_review']}")

    # Adres
    if mekan.get("adres"):
        parts.append(f"Konum: {mekan['adres']}")

    return " ".join(parts)


def prepare_and_upload_embeddings(json_path=None, limit=None, force_reindex=False):
    """Mekanları embedding'e dönüştür ve Qdrant'a yükle"""
    print("\n" + "="*60)
    print("Vektor Veritabani Hazirlama")
    print("="*60 + "\n")

    # 1. JSON'dan mekanları al (öncelikli)
    print("[1/5] JSON dosyasindan mekanlar yukleniyor...")
    mekanlar = get_mekanlar_from_json(json_path=json_path)

    if not mekanlar:
        print("UYARI: JSON'dan mekan alinamadi. Backend API deneniyor...")
        mekanlar = get_mekanlar_from_backend()

    if not mekanlar:
        print("HATA: Hic mekan bulunamadi. Script durduruluyor...")
        return

    if limit:
        mekanlar = mekanlar[:limit]
    
    print(f"OK: {len(mekanlar)} mekan bulundu\n")
    
    # 2. Embedding modelini yükle
    print("[2/5] Embedding modeli yukleniyor...")
    embedding_model = EmbeddingModel()
    vector_size = embedding_model.get_vector_size()
    print(f"OK: Model yuklendi (Vektor boyutu: {vector_size})\n")
    
    # 3. Qdrant'ı hazırla
    print("[3/5] Qdrant baglantisi kuruluyor...")
    vector_db = QdrantVectorDB()
    vector_db.create_collection_if_not_exists(vector_size=vector_size)
    current_count = vector_db.count_vectors()
    if current_count >= len(mekanlar) and not force_reindex:
        print(f"OK: Qdrant koleksiyonunda zaten {current_count} vektor var; yeniden yukleme atlandi")
        return
    print("OK: Qdrant hazir\n")
    
    # 4. Embedding'leri oluştur
    print("[4/5] Embedding'ler olusturuluyor...")
    embedding_texts = []
    mekan_data = []
    
    for mekan in mekanlar:
        text = create_embedding_text(mekan)
        embedding_texts.append(text)
        mekan_data.append(mekan)
    
    embeddings = embedding_model.encode(embedding_texts)
    print(f"OK: {len(embeddings)} embedding olusturuldu\n")
    
    # 5. Qdrant'a yükle
    print("[5/5] Qdrant'a yukleniyor...")
    points = []
    for i, (embedding, mekan) in enumerate(zip(embeddings, mekan_data)):
        point = PointStruct(
            id=mekan.get("id", i),
            vector=embedding,
            payload={
                "id": mekan.get("id", i),
                "ad": mekan.get("ad", ""),
                "aciklama": mekan.get("aciklama", ""),
                "kategori": mekan.get("kategori", ""),
                "enlem": mekan.get("enlem"),
                "boylam": mekan.get("boylam"),
                "adres": mekan.get("adres", ""),
                "rating": mekan.get("rating", 0),
                "review_count": mekan.get("review_count", 0),
                "user_review": mekan.get("user_review", "")
            }
        )
        points.append(point)
    
    # Batch'ler halinde yükle (her seferde 100)
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i:i+batch_size]
        success = vector_db.add_vectors(batch)
        if success:
            print(f"  OK: {min(i+batch_size, len(points))}/{len(points)} mekan yuklendi")
        else:
            print(f"  HATA: Batch yuklenirken hata olustu")
    
    print(f"\nOK: Toplam {len(points)} mekan Qdrant'a yuklendi")
    print("\n" + "="*60)
    print("Vektor veritabani hazirlama tamamlandi! BASARILI!")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser(description="loaded_places.json verisini Qdrant'a indeksle")
        parser.add_argument("--json", dest="json_path", default=None, help="Mekan JSON dosyası yolu")
        parser.add_argument("--limit", type=int, default=None, help="Yüklenecek maksimum mekan sayısı")
        parser.add_argument("--force", action="store_true", help="Mevcut sayı yeterli olsa bile upsert yap")
        args = parser.parse_args()

        prepare_and_upload_embeddings(
            json_path=args.json_path,
            limit=args.limit,
            force_reindex=args.force
        )
    except KeyboardInterrupt:
        print("\n\nUYARI: İşlem kullanıcı tarafından durduruldu")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

