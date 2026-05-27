"""
RAG Sistemi Komple Demo
Bu script hem vektör veritabanını yükler hem de test eder (in-memory mode için)
"""

import sys
import os
import json

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from src.vector_db.qdrant_client import QdrantVectorDB
from src.models.embeddings.embedding_model import EmbeddingModel
from src.rag.pipeline import RAGPipeline
from qdrant_client.models import PointStruct
from dotenv import load_dotenv
import logging

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .env dosyasını yükle
load_dotenv()


def load_data_to_qdrant(vector_db, embedding_model):
    """Mekan verilerini Qdrant'a yükle"""
    print("\n[1/2] Mekan verileri yukleniyor...\n")
    
    # JSON'dan mekanları al
    json_path = os.path.join(os.path.dirname(__file__), 'data', 'loaded_places.json')
    with open(json_path, 'r', encoding='utf-8') as f:
        places = json.load(f)
    
    print(f"OK: {len(places)} mekan bulundu")
    
    # Mekanları normalize et
    mekanlar = []
    for idx, place in enumerate(places):
        mekanlar.append({
            "id": idx + 1,
            "ad": place.get("name", ""),
            "kategori": place.get("category", ""),
            "aciklama": place.get("description", ""),
            "adres": place.get("address", ""),
            "enlem": place.get("latitude"),
            "boylam": place.get("longitude"),
            "rating": place.get("rating", 0),
            "review_count": place.get("review_count", 0),
            "user_review": place.get("user_review", "")
        })
    
    # Embedding'leri oluştur
    print("Embedding'ler olusturuluyor...")
    embedding_texts = []
    for mekan in mekanlar:
        text_parts = []
        if mekan.get("ad"):
            text_parts.append(mekan["ad"])
        if mekan.get("kategori"):
            text_parts.append(f"Kategori: {mekan['kategori']}")
        if mekan.get("aciklama"):
            text_parts.append(mekan["aciklama"])
        if mekan.get("user_review"):
            text_parts.append(f"Yorum: {mekan['user_review']}")
        if mekan.get("adres"):
            text_parts.append(f"Konum: {mekan['adres']}")
        
        embedding_texts.append(" ".join(text_parts))
    
    embeddings = embedding_model.encode(embedding_texts)
    print(f"OK: {len(embeddings)} embedding olusturuldu")
    
    # Qdrant'a yükle
    print("Qdrant'a yukleniyor...")
    points = []
    for i, (embedding, mekan) in enumerate(zip(embeddings, mekanlar)):
        point = PointStruct(
            id=mekan["id"],
            vector=embedding,
            payload={
                "id": mekan["id"],
                "ad": mekan["ad"],
                "aciklama": mekan["aciklama"],
                "kategori": mekan["kategori"],
                "enlem": mekan["enlem"],
                "boylam": mekan["boylam"],
                "adres": mekan["adres"],
                "rating": mekan["rating"],
                "review_count": mekan["review_count"],
                "user_review": mekan["user_review"]
            }
        )
        points.append(point)
    
    vector_db.add_vectors(points)
    print(f"OK: {len(points)} mekan yuklendi\n")
    
    return len(points)


def test_rag_search(rag_pipeline):
    """RAG aramasını test et"""
    print("\n[2/2] RAG Arama Testi\n")
    
    test_queries = [
        "Kadikoy'de sessiz ve sakin bir kafe",
        "Deniz manzarali restoran",
        "Kahvesiyle unlu bir mekan",
        "Besiktas'ta hamburger yiyebilecegim yer",
        "Romantik bir aksam yemegi icin restoran"
    ]
    
    print("Test sorgulari:")
    for i, query in enumerate(test_queries, 1):
        print(f"  {i}. {query}")
    print()
    
    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"SORGU: {query}")
        print('='*60)
        
        try:
            result = rag_pipeline.process(user_query=query)
            
            if result and result.get("oneriler"):
                print(f"\nOK: {len(result['oneriler'])} mekan bulundu\n")
                
                # En iyi 3 öneriyi göster
                for idx, oneri in enumerate(result["oneriler"][:3], 1):
                    print(f"{idx}. {oneri.get('ad', 'N/A')}")
                    print(f"   Kategori: {oneri.get('kategori', 'N/A')}")
                    print(f"   Benzerlik: {oneri.get('benzerlik_skoru', 0):.3f}")
                    if oneri.get("adres"):
                        addr = oneri['adres'][:70]
                        print(f"   Adres: {addr}...")
                    print()
            else:
                print("UYARI: Sonuc bulunamadi\n")
                
        except Exception as e:
            print(f"HATA: {e}\n")


def main():
    """Ana fonksiyon"""
    print("\n" + "="*60)
    print("RAG SISTEMI KOMPLE DEMO")
    print("(Vektor Yukleme + Test)")
    print("="*60)
    
    try:
        # Embedding model yükle
        print("\nEmbedding modeli yukleniyor...")
        embedding_model = EmbeddingModel()
        vector_size = embedding_model.get_vector_size()
        print(f"OK: Model yuklendi (Vektor boyutu: {vector_size})")
        
        # Qdrant client oluştur
        print("\nQdrant baglantisi kuruluyor...")
        vector_db = QdrantVectorDB()
        vector_db.create_collection_if_not_exists(vector_size=vector_size)
        print("OK: Qdrant hazir")
        
        # Veriyi yükle
        total_loaded = load_data_to_qdrant(vector_db, embedding_model)
        
        # RAG pipeline oluştur (aynı vector_db instance'ı kullanarak)
        print("RAG pipeline olusturuluyor...")
        rag_pipeline = RAGPipeline()
        # Aynı vector_db'yi kullan
        rag_pipeline.retriever._vector_db = vector_db
        rag_pipeline.retriever._embedding_model = embedding_model
        print("OK: RAG pipeline hazir")
        
        # Test et
        test_rag_search(rag_pipeline)
        
        print("\n" + "="*60)
        print("DEMO TAMAMLANDI! BASARILI!")
        print(f"Toplam {total_loaded} mekan uzerinden arama yapildi")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\nHATA: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nUYARI: Demo kullanici tarafindan durduruldu")
        sys.exit(1)
