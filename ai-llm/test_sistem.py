"""
Semantik arama testi - JSON cikti
"""
import sys, os, json, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dotenv import load_dotenv; load_dotenv()

from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient

QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
COLLECTION  = os.getenv("QDRANT_COLLECTION_NAME", "mekan_embeddings")
MODEL_NAME  = os.getenv("EMBEDDING_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

SORGULAR = [
    "Kadıköy'de deniz manzaralı sessiz kafe",
    "Romantik akşam yemeği Boğaz manzarası",
    "WiFi olan sakin çalışma mekanı",
    "Ailecek gidebileceğimiz kahvaltı yeri",
    "Canlı müzik olan bar Beyoğlu",
]

def main():
    model = SentenceTransformer(MODEL_NAME)
    qdrant = QdrantClient(url=QDRANT_URL)
    info = qdrant.get_collection(COLLECTION)

    output = {
        "koleksiyon": COLLECTION,
        "toplam_mekan": info.points_count,
        "sonuclar": []
    }

    for sorgu in SORGULAR:
        vec = model.encode(sorgu).tolist()
        try:
            result = qdrant.query_points(collection_name=COLLECTION, query=vec, limit=3)
            hits = result.points
        except AttributeError:
            hits = qdrant.search(collection_name=COLLECTION, query_vector=vec, limit=3)

        mekanlar = []
        for h in hits:
            p = h.payload or {}
            mekanlar.append({
                "ad": p.get("ad", ""),
                "kategori": p.get("kategori", ""),
                "puan": p.get("puan", 0),
                "adres": p.get("adres", "")[:60],
                "aciklama": (p.get("aciklama", "") or "")[:100],
                "benzerlik": round(h.score, 4)
            })

        output["sonuclar"].append({"sorgu": sorgu, "mekanlar": mekanlar})

    with open("test_sonuc.json", "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print("Sonuclar test_sonuc.json dosyasina yazildi")

if __name__ == "__main__":
    main()
