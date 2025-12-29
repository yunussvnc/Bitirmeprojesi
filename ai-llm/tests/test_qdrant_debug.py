"""
Debug - Qdrant arama testi
"""

import sys
import os

# Python path ayarla - bir üst klasörü ekle
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

os.environ['LLM_PROVIDER'] = 'huggingface'
os.environ['QDRANT_URL'] = 'http://localhost:6333'
os.environ['SIMILARITY_THRESHOLD'] = '0.0'  # Dusuk threshold ile test

from qdrant_client import QdrantClient
from src.models.embeddings.embedding_model import EmbeddingModel

print("\n" + "="*80)
print("  QDRANT DIREKT ARAMA TESTI")
print("="*80 + "\n")

# Qdrant client
client = QdrantClient(url="http://localhost:6333")

# Embedding model
print("[*] Embedding model yukleniyor...")
embedding_model = EmbeddingModel()
print("[+] Model hazir!\n")

# Test sorgusu
query = "kahve icmek istiyorum"
print(f"[?] Sorgu: '{query}'")

# Embedding olustur
print("[*] Embedding olusturuluyor...")
query_embedding = embedding_model.encode_single(query)
print(f"[+] Embedding boyutu: {len(query_embedding)}\n")

# Qdrant'ta ara
print("[*] Qdrant'ta arama yapiliyor...")
try:
    results = client.query_points(
        collection_name="mekan_embeddings",
        query=query_embedding,
        limit=5,
        score_threshold=0.0  # Tum sonuclari getir
    )
    
    print(f"[+] {len(results.points)} sonuc bulundu\n")
    
    if results.points:
        for idx, point in enumerate(results.points, 1):
            print(f"{idx}. {point.payload.get('ad', 'Bilinmeyen')}")
            print(f"   Skor    : {point.score:.4f}")
            print(f"   Kategori: {point.payload.get('kategori', 'N/A')}")
            print(f"   Konum   : ({point.payload.get('enlem', 0):.4f}, {point.payload.get('boylam', 0):.4f})")
            print()
    else:
        print("[!] Hic sonuc bulunamadi")
        
except Exception as e:
    print(f"[!] Hata: {e}")
    import traceback
    traceback.print_exc()

print("="*80)
print("[+] TEST TAMAMLANDI")
print("="*80 + "\n")

