"""
Vektör Veritabanını Hazırlama Scripti
Mekan verilerini backend'den alıp embedding'lere dönüştürür ve Qdrant'a yükler
"""

import sys
import os
import asyncio
import httpx

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.vector_db.qdrant_client import QdrantVectorDB
from src.models.embeddings.embedding_model import EmbeddingModel
from src.config import settings
from src.utils.logging_config import setup_logging
from qdrant_client.models import PointStruct
from dotenv import load_dotenv

# Logging'i ayarla
setup_logging("INFO")
logger = setup_logging()

# .env dosyasını yükle
load_dotenv()


def get_mekanlar_from_backend():
    """Backend API'den mekanları al"""
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
    
    # Adres
    if mekan.get("adres"):
        parts.append(f"Konum: {mekan['adres']}")
    
    return " ".join(parts)


def prepare_and_upload_embeddings():
    """Mekanları embedding'e dönüştür ve Qdrant'a yükle"""
    print("\n" + "="*60)
    print("Vektör Veritabanı Hazırlama")
    print("="*60 + "\n")
    
    # 1. Backend'den mekanları al
    print("📥 Backend'den mekanlar alınıyor...")
    mekanlar = get_mekanlar_from_backend()
    
    if not mekanlar:
        print("⚠ Backend'den mekan alınamadı. Örnek veri kullanılacak...")
        # Örnek veri oluştur
        mekanlar = [
            {
                "id": i,
                "ad": f"Örnek Mekan {i}",
                "kategori": "Kafe" if i % 2 == 0 else "Restoran",
                "aciklama": f"Güzel bir mekan {i}",
                "adres": f"Adres {i}",
                "enlem": 41.0082 + (i * 0.001),
                "boylam": 28.9784 + (i * 0.001)
            }
            for i in range(1, 6)
        ]
    
    print(f"✓ {len(mekanlar)} mekan bulundu\n")
    
    # 2. Embedding modelini yükle
    print("🤖 Embedding modeli yükleniyor...")
    embedding_model = EmbeddingModel()
    vector_size = embedding_model.get_vector_size()
    print(f"✓ Model yüklendi (Vektör boyutu: {vector_size})\n")
    
    # 3. Qdrant'ı hazırla
    print("🗄️  Qdrant bağlantısı kuruluyor...")
    vector_db = QdrantVectorDB()
    vector_db.create_collection_if_not_exists(vector_size=vector_size)
    print("✓ Qdrant hazır\n")
    
    # 4. Embedding'leri oluştur
    print("🔄 Embedding'ler oluşturuluyor...")
    embedding_texts = []
    mekan_data = []
    
    for mekan in mekanlar:
        text = create_embedding_text(mekan)
        embedding_texts.append(text)
        mekan_data.append(mekan)
    
    embeddings = embedding_model.encode(embedding_texts)
    print(f"✓ {len(embeddings)} embedding oluşturuldu\n")
    
    # 5. Qdrant'a yükle
    print("📤 Qdrant'a yükleniyor...")
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
            }
        )
        points.append(point)
    
    # Batch'ler halinde yükle (her seferde 100)
    batch_size = 100
    for i in range(0, len(points), batch_size):
        batch = points[i:i+batch_size]
        success = vector_db.add_vectors(batch)
        if success:
            print(f"  ✓ {min(i+batch_size, len(points))}/{len(points)} mekan yüklendi")
        else:
            print(f"  ✗ Batch yüklenirken hata oluştu")
    
    print(f"\n✓ Toplam {len(points)} mekan Qdrant'a yüklendi")
    print("\n" + "="*60)
    print("Vektör veritabanı hazırlama tamamlandı! 🎉")
    print("="*60 + "\n")


if __name__ == "__main__":
    try:
        prepare_and_upload_embeddings()
    except KeyboardInterrupt:
        print("\n\n⚠ İşlem kullanıcı tarafından durduruldu")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Hata: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

