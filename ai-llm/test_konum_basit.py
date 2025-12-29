"""
Basit Konum Bazlı Arama Testi
Doğrudan Python kodunu çalıştırır
"""

import sys
import os

# Python path ayarla
sys.path.insert(0, os.path.dirname(__file__))

# Basit ayarlamalar
os.environ['LLM_PROVIDER'] = 'openai'
os.environ['QDRANT_URL'] = 'http://localhost:6333'

def test_mekan_varmi():
    """Önce Qdrant'ta mekan olup olmadığını kontrol et"""
    print("\n" + "="*80)
    print("  QDRANT KONTROL - MEKAN VARLIK TESTI")
    print("="*80 + "\n")
    
    try:
        from qdrant_client import QdrantClient
        
        client = QdrantClient(url="http://localhost:6333")
        
        # Collection bilgisini al
        collections = client.get_collections()
        print(f"[*] Koleksiyonlar: {[c.name for c in collections.collections]}\n")
        
        # mekan_embeddings koleksiyonu var mı?
        collection_name = "mekan_embeddings"
        if collection_name in [c.name for c in collections.collections]:
            collection_info = client.get_collection(collection_name)
            print(f"[+] '{collection_name}' koleksiyonu bulundu")
            print(f"    Nokta sayisi: {collection_info.points_count}")
            print(f"    Vektor boyutu: {collection_info.config.params.vectors.size}")
            
            # İlk birkaç noktayı getir
            if collection_info.points_count > 0:
                points = client.scroll(
                    collection_name=collection_name,
                    limit=3,
                    with_payload=True,
                    with_vectors=False
                )
                
                print(f"\n[i] Ornek mekanlar:")
                for point in points[0]:
                    payload = point.payload
                    print(f"    - {payload.get('ad', 'Bilinmeyen')}")
                    print(f"      Kategori: {payload.get('kategori', 'N/A')}")
                    print(f"      Konum: ({payload.get('enlem', 0)}, {payload.get('boylam', 0)})")
                    print()
                
                return True
            else:
                print("\n[!] Koleksiyon bos!")
                return False
        else:
            print(f"[!] '{collection_name}' koleksiyonu bulunamadi")
            print("\n[i] Lutfen once veri yukleme scriptini calistirin:")
            print("    python scripts/prepare_vector_db.py")
            return False
            
    except Exception as e:
        print(f"[!] Hata: {e}")
        print("\n[i] Qdrant calismiyor olabilir. Baslatmak icin:")
        print("    docker-compose up -d")
        return False


def test_konum_arama():
    """Konum bazlı arama testi"""
    print("\n" + "="*80)
    print("  KONUM BAZLI ARAMA TESTI")
    print("="*80 + "\n")
    
    try:
        from src.rag.retriever import RAGRetriever
        import time
        
        print("[*] Retriever baslatiliyor...")
        retriever = RAGRetriever()
        print("[+] Retriever hazir!\n")
        
        # Test senaryoları
        test_scenarios = [
            {
                "query": "kahve icmek istiyorum",
                "location": {"enlem": 41.0082, "boylam": 28.9784},
                "name": "Sultanahmet"
            },
            {
                "query": "sessiz calisma mekani",
                "location": {"enlem": 41.0370, "boylam": 28.9850},
                "name": "Taksim"
            },
            {
                "query": "guzel kahvalti",
                "location": {"enlem": 40.9903, "boylam": 29.0250},
                "name": "Kadikoy"
            }
        ]
        
        for idx, scenario in enumerate(test_scenarios, 1):
            print("-"*80)
            print(f"TEST {idx}: {scenario['name']}")
            print("-"*80)
            print(f"[?] Sorgu: '{scenario['query']}'")
            print(f"[*] Konum: ({scenario['location']['enlem']}, {scenario['location']['boylam']})\n")
            
            start_time = time.time()
            results = retriever.retrieve(
                query=scenario['query'],
                location=scenario['location'],
                top_k=5
            )
            elapsed = (time.time() - start_time) * 1000
            
            print(f"[i] Arama suresi: {elapsed:.0f}ms")
            print(f"[i] Donen sonuc sayisi: {len(results) if results else 0}")
            
            if results:
                print(f"[+] {len(results)} mekan bulundu\n")
                
                for i, result in enumerate(results[:3], 1):
                    payload = result.get('payload', {})
                    print(f"  {i}. {payload.get('ad', 'Bilinmeyen')}")
                    print(f"     Kategori: {payload.get('kategori', 'N/A')}")
                    print(f"     Skor    : {result.get('score', 0):.3f}")
                    print(f"     Konum   : ({payload.get('enlem', 0):.4f}, {payload.get('boylam', 0):.4f})")
                    if payload.get('adres'):
                        print(f"     Adres   : {payload['adres'][:50]}...")
                    print()
            else:
                print("[!] Mekan bulunamadi\n")
        
        print("="*80)
        print("[+] TEST TAMAMLANDI")
        print("="*80 + "\n")
        return True
        
    except ImportError as e:
        print(f"[!] Import hatasi: {e}")
        print("\n[i] Gerekli kutuphaneler yuklu degil. Yuklemek icin:")
        print("    pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"[!] Hata: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("\n" + "="*80)
    print(" "*25 + "KONUM BAZLI ARAMA TEST")
    print("="*80)
    
    # 1. Qdrant'ta mekan var mı kontrol et
    if not test_mekan_varmi():
        print("\n[!] Qdrant'ta mekan yok. Test devam edemez.")
        return
    
    # 2. Konum bazlı arama testi
    if test_konum_arama():
        print("\n[+] Tum testler basariyla tamamlandi!\n")
    else:
        print("\n[!] Testler tamamlanamadi\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n[!] Test kullanici tarafindan durduruldu\n")
    except Exception as e:
        print(f"\n[!] Beklenmeyen hata: {e}\n")
        import traceback
        traceback.print_exc()

