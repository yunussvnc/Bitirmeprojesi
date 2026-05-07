"""
scripts/load_data.py
====================
Qdrant Vektör Veritabanına Mekan Verisi Yükleyici

İki kaynaktan veri alır:
1. SerpAPI (Google Maps) → Gerçek zamanlı mekanlar
2. Backend API → Sistemin kendi mekan veritabanı

Kullanım:
    python scripts/load_data.py --source serpapi --query "kafe istanbul" --limit 50
    python scripts/load_data.py --source backend
    python scripts/load_data.py --source both --limit 100
"""

import sys
import os
import argparse
import json
import time
from typing import List, Dict, Optional
from datetime import datetime

# Proje root'unu path'e ekle
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from dotenv import load_dotenv
load_dotenv()

from src.config import settings


# ==================== KAYNAK: SerpAPI ====================

def fetch_from_serpapi(
    queries: List[str],
    limit_per_query: int = 20
) -> List[Dict]:
    """
    SerpAPI üzerinden Google Maps'ten mekan verisi çeker.
    
    Args:
        queries: Arama sorguları ["kafe istanbul", "restoran kadıköy" ...]
        limit_per_query: Her sorgu için max mekan sayısı
    
    Returns:
        Normalize edilmiş mekan listesi
    """
    try:
        from serpapi_client import SerpApiClient
        client = SerpApiClient()
    except Exception as e:
        print(f"❌ SerpApiClient başlatılamadı: {e}")
        return []
    
    all_places = []
    seen_names = set()
    
    for query in queries:
        print(f"\n  🔍 {query}")
        try:
            places = client.search_places(query=query, limit=limit_per_query)
            
            for place in places:
                name = place.get("name", "")
                if name and name not in seen_names:
                    seen_names.add(name)
                    all_places.append(_normalize_serpapi_place(place))
            
            print(f"  ✅ {len(places)} mekan bulundu (toplam: {len(all_places)})")
            time.sleep(0.5)  # Rate limiting
            
        except Exception as e:
            print(f"  ⚠️ Hata: {e}")
    
    return all_places


def _normalize_serpapi_place(place: Dict) -> Dict:
    """SerpAPI mekan verisini standart formata dönüştür"""
    return {
        "id": hash(place.get("name", "") + place.get("address", "")) % (10**9),
        "ad": place.get("name", ""),
        "aciklama": place.get("description", "") or f"{place.get('category', 'Mekan')} - {place.get('address', '')}",
        "kategori": place.get("category", "Diğer"),
        "adres": place.get("address", ""),
        "enlem": place.get("latitude", 0.0),
        "boylam": place.get("longitude", 0.0),
        "puan": place.get("rating", 0.0),
        "yorum_sayisi": place.get("review_count", 0),
        "data_id": place.get("data_id", ""),
        "foto": place.get("photo_url") or place.get("thumbnail") or "",
        "kaynak": "serpapi",
        "yukleme_tarihi": datetime.now().isoformat()
    }


# ==================== KAYNAK: Backend API ====================

def fetch_from_backend(api_url: Optional[str] = None) -> List[Dict]:
    """
    Backend API'den mekan verisi çeker.
    Önce /places endpoint'ini dener, olmadıysa direkt PostgreSQL'e geçer.
    """
    import httpx

    url = api_url or settings.BACKEND_API_URL

    # Olası endpoint'leri dene
    endpoints = [
        f"{url}/places",
        f"{url}/api/v1/places",
        f"{url}/api/v1/mekanlar",
        f"{url}/mekanlar",
    ]

    for endpoint in endpoints:
        try:
            print(f"\n  🌐 Deneniyor: {endpoint}")
            with httpx.Client(timeout=10) as client:
                response = client.get(endpoint, params={"limit": 1000})
                if response.status_code == 200:
                    data = response.json()
                    # List veya dict içinde items/places olabilir
                    mekanlar = data if isinstance(data, list) else \
                               data.get("items", data.get("places", data.get("data", [])))
                    if mekanlar:
                        print(f"  ✅ {len(mekanlar)} mekan alındı ({endpoint})")
                        return [_normalize_backend_place(m) for m in mekanlar]
        except Exception:
            continue

    print("  ⚠️  Backend API yanıt vermedi → PostgreSQL doğrudan bağlantı deneniyor...")
    return fetch_from_postgres()


def fetch_from_postgres(db_url: Optional[str] = None) -> List[Dict]:
    """
    PostgreSQL places tablosunu doğrudan okur.
    Backend API çalışmıyor olsa bile veri alır.
    """
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("  ❌ psycopg2 yüklü değil: pip install psycopg2-binary")
        return []

    url = db_url or settings.database_url_normalized

    if not url:
        print("  ❌ DATABASE_URL tanımlı değil (.env'e ekleyin)")
        return []

    print(f"\n  🗄️  PostgreSQL: {url.split('@')[-1]}")

    try:
        conn = psycopg2.connect(url, connect_timeout=5)
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("""
            SELECT
                p.id,
                p.name,
                p.description,
                p.category,
                p.address,
                p.city,
                p.latitude,
                p.longitude,
                p.average_rating,
                p.features,
                p.photo_url,
                p.price_range,
                COUNT(r.id) AS review_count
            FROM places p
            LEFT JOIN reviews r ON r.place_id = p.id
            GROUP BY p.id
            ORDER BY p.id;
        """)

        rows = cur.fetchall()
        conn.close()

        if not rows:
            print("  ⚠️  places tablosu boş")
            return []

        print(f"  ✅ PostgreSQL'den {len(rows)} mekan alındı")
        return [_normalize_postgres_place(dict(r)) for r in rows]

    except psycopg2.OperationalError as e:
        print(f"  ❌ PostgreSQL bağlantı hatası: {e}")
        print("  💡 PostgreSQL çalışıyor mu? docker compose up -d postgres")
        return []
    except Exception as e:
        print(f"  ❌ PostgreSQL hatası: {e}")
        return []


def _normalize_postgres_place(row: Dict) -> Dict:
    """PostgreSQL places satırını standart formata dönüştür"""
    return {
        "id":          row.get("id", 0),
        "ad":          row.get("name", ""),
        "aciklama":    row.get("description", "") or "",
        "kategori":    row.get("category", "Diğer") or "Diğer",
        "adres":       f"{row.get('address', '')} {row.get('city', '')}".strip(),
        "enlem":       float(row.get("latitude") or 0.0),
        "boylam":      float(row.get("longitude") or 0.0),
        "puan":        float(row.get("average_rating") or 0.0),
        "yorum_sayisi": int(row.get("review_count") or 0),
        "data_id":     str(row.get("id", "")),
        "ozellikler":  row.get("features", "") or "",
        "foto":        row.get("photo_url", "") or "",
        "kaynak":      "postgresql",
        "yukleme_tarihi": datetime.now().isoformat()
    }


def _normalize_backend_place(mekan: Dict) -> Dict:
    """Backend mekan verisini standart formata dönüştür"""
    return {
        "id":          mekan.get("id", 0),
        "ad":          mekan.get("name", mekan.get("ad", "")),
        "aciklama":    mekan.get("description", mekan.get("aciklama", "")),
        "kategori":    mekan.get("category", mekan.get("kategori", "Diğer")),
        "adres":       mekan.get("address", mekan.get("adres", "")),
        "enlem":       float(mekan.get("latitude", mekan.get("enlem", 0.0)) or 0.0),
        "boylam":      float(mekan.get("longitude", mekan.get("boylam", 0.0)) or 0.0),
        "puan":        float(mekan.get("average_rating", mekan.get("puan", 0.0)) or 0.0),
        "yorum_sayisi": mekan.get("review_count", mekan.get("yorum_sayisi", 0)),
        "data_id":     mekan.get("data_id", ""),
        "foto":        mekan.get("photo_url") or mekan.get("foto") or "",
        "kaynak":      "backend",
        "yukleme_tarihi": datetime.now().isoformat()
    }


# ==================== VEKTÖR VERİTABANINA YÜKLEME ====================

def create_embedding_text(mekan: Dict) -> str:
    """
    Mekan için embedding metni oluştur.
    Semantic search kalitesini optimize etmek için alanları birleştirir.
    """
    parts = []
    
    ad = mekan.get("ad", "")
    if ad:
        parts.append(ad)
    
    kategori = mekan.get("kategori", "")
    if kategori:
        parts.append(f"Kategori: {kategori}")
    
    aciklama = mekan.get("aciklama", "")
    if aciklama:
        parts.append(aciklama)
    
    adres = mekan.get("adres", "")
    if adres:
        parts.append(f"Konum: {adres}")
    
    # Rating ve yorum bilgisini de ekle (semantic eşleşme için)
    puan = mekan.get("puan", 0)
    if puan > 0:
        if puan >= 4.5:
            parts.append("çok yüksek puanlı mükemmel mekan")
        elif puan >= 4.0:
            parts.append("yüksek puanlı iyi mekan")
    
    return " ".join(parts)


def load_to_qdrant(mekanlar: List[Dict], batch_size: int = 50) -> Dict:
    """
    Mekanları embedding'e dönüştürüp Qdrant'a yükle.
    """
    from qdrant_client import QdrantClient
    from qdrant_client.models import PointStruct, VectorParams, Distance
    
    stats = {
        "total": len(mekanlar),
        "uploaded": 0,
        "failed": 0,
        "skipped": 0
    }
    
    if not mekanlar:
        print("  ⚠️ Yüklenecek mekan yok")
        return stats
    
    # Embedding modeli yükle (direkt sentence-transformers kullan)
    print("\n  🤖 Embedding modeli yükleniyor...")
    try:
        from sentence_transformers import SentenceTransformer
        model_name = settings.EMBEDDING_MODEL
        embedding_model = SentenceTransformer(model_name)
        test_vec = embedding_model.encode(["test"])
        vector_size = len(test_vec[0])
        print(f"  ✅ Model hazır (vektör boyutu: {vector_size})")
    except Exception as e:
        print(f"  ❌ Embedding modeli yüklenemedi: {e}")
        return stats
    
    # Qdrant bağlantısı (direkt)
    print(f"\n  🗄️  Qdrant bağlantısı: {settings.QDRANT_URL}")
    try:
        qdrant = QdrantClient(url=settings.QDRANT_URL)
        collection_name = settings.QDRANT_COLLECTION_NAME
        
        # Collection oluştur (yoksa)
        existing = [c.name for c in qdrant.get_collections().collections]
        if collection_name not in existing:
            qdrant.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )
            print(f"  ✅ Collection oluşturuldu: {collection_name}")
        else:
            print(f"  ✅ Collection mevcut: {collection_name}")
    except Exception as e:
        print(f"  ❌ Qdrant bağlantı hatası: {e}")
        print("  💡 Docker çalışıyor mu? docker compose up -d")
        return stats
    
    # Metinleri ve payload'ları hazırla
    texts = []
    valid_mekanlar = []
    
    for m in mekanlar:
        if not m.get("ad"):
            stats["skipped"] += 1
            continue
        texts.append(create_embedding_text(m))
        valid_mekanlar.append(m)
    
    print(f"\n  ⚡ {len(valid_mekanlar)} mekan için embedding oluşturuluyor...")
    
    # Batch embedding
    all_points = []
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_mekanlar = valid_mekanlar[i:i + batch_size]
        
        try:
            embeddings = embedding_model.encode(batch_texts, show_progress_bar=False)
            
            for j, (embedding, mekan) in enumerate(zip(embeddings, batch_mekanlar)):
                point = PointStruct(
                    id=abs(mekan.get("id", i * batch_size + j)) % (2**31 - 1),
                    vector=embedding.tolist(),
                    payload={
                        "id": mekan.get("id"),
                        "ad": mekan.get("ad", ""),
                        "aciklama": mekan.get("aciklama", ""),
                        "kategori": mekan.get("kategori", ""),
                        "adres": mekan.get("adres", ""),
                        "enlem": mekan.get("enlem"),
                        "boylam": mekan.get("boylam"),
                        "puan": mekan.get("puan", 0.0),
                        "yorum_sayisi": mekan.get("yorum_sayisi", 0),
                        "data_id": mekan.get("data_id", ""),
                        "foto": mekan.get("foto") or mekan.get("photo_url") or "",
                        "kaynak": mekan.get("kaynak", ""),
                    }
                )
                all_points.append(point)
            
            print(f"  ✅ {min(i + batch_size, len(texts))}/{len(texts)} embedding hazır")
            
        except Exception as e:
            print(f"  ❌ Batch {i//batch_size + 1} embedding hatası: {e}")
            stats["failed"] += len(batch_texts)
    
    # Qdrant'a yükle
    print(f"\n  📤 Qdrant'a yükleniyor ({len(all_points)} nokta)...")
    for i in range(0, len(all_points), batch_size):
        batch = all_points[i:i + batch_size]
        try:
            qdrant.upsert(collection_name=collection_name, points=batch)
            stats["uploaded"] += len(batch)
            print(f"  ✅ {min(i + batch_size, len(all_points))}/{len(all_points)} yüklendi")
        except Exception as e:
            print(f"  ❌ Yükleme hatası: {e}")
            stats["failed"] += len(batch)
    
    return stats



# ==================== ÖRNEK VERİ ====================

def load_sample_data() -> List[Dict]:
    """
    Qdrant ve SerpAPI olmadan test için örnek İstanbul mekanları.
    """
    return [
        {
            "id": 1, "ad": "Karaköy Lokantası", "kategori": "Restoran",
            "aciklama": "Deniz mahsulleri ve Türk mutfağı, tarihi Karaköy'de konumlanmış kaliteli restoran",
            "adres": "Karaköy, Beyoğlu, İstanbul", "enlem": 41.0229, "boylam": 28.9745,
            "puan": 4.6, "yorum_sayisi": 1200, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 2, "ad": "Moda Kafe", "kategori": "Kafe",
            "aciklama": "Deniz manzaralı wifi olan sessiz kafe, filtre kahve ve tatlılarıyla ünlü",
            "adres": "Moda, Kadıköy, İstanbul", "enlem": 40.9878, "boylam": 29.0297,
            "puan": 4.8, "yorum_sayisi": 520, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 3, "ad": "Bebek Kahvesi", "kategori": "Kafe",
            "aciklama": "Boğaz manzaralı romantik kafe, kahvaltı ve özel anlar için ideal",
            "adres": "Bebek, Beşiktaş, İstanbul", "enlem": 41.0778, "boylam": 29.0439,
            "puan": 4.7, "yorum_sayisi": 890, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 4, "ad": "Çukurcuma Antika Kafe", "kategori": "Kafe",
            "aciklama": "Antika eşyalarla dolu sanatsal atmosfer, sakin ve özgün ortam",
            "adres": "Çukurcuma, Beyoğlu, İstanbul", "enlem": 41.0318, "boylam": 28.9852,
            "puan": 4.5, "yorum_sayisi": 340, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 5, "ad": "Balıkçı Sabahattin", "kategori": "Restoran",
            "aciklama": "Tarihi yarımada'da taze balık ve deniz mahsulleri, Türk usulü meze",
            "adres": "Cankurtaran, Fatih, İstanbul", "enlem": 41.0026, "boylam": 28.9810,
            "puan": 4.4, "yorum_sayisi": 2100, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 6, "ad": "Ortaköy Sahil Bar", "kategori": "Bar",
            "aciklama": "Boğaz köprüsü manzarası, canlı müzik ve cocktails",
            "adres": "Ortaköy, Beşiktaş, İstanbul", "enlem": 41.0477, "boylam": 29.0276,
            "puan": 4.2, "yorum_sayisi": 650, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 7, "ad": "Tarihi Kapalıçarşı Kervansaray", "kategori": "Restoran",
            "aciklama": "Tarihi Kapalıçarşı içinde geleneksel Osmanlı mutfağı ve çay",
            "adres": "Kapalıçarşı, Fatih, İstanbul", "enlem": 41.0105, "boylam": 28.9680,
            "puan": 4.3, "yorum_sayisi": 780, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 8, "ad": "Nişantaşı Rooftop Kafe", "kategori": "Kafe",
            "aciklama": "Şehir manzaralı teras kafe, çalışmak için ideal wifi ve sessiz ortam",
            "adres": "Nişantaşı, Şişli, İstanbul", "enlem": 41.0477, "boylam": 28.9955,
            "puan": 4.6, "yorum_sayisi": 430, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 9, "ad": "Kadıköy Pazar Restoran", "kategori": "Restoran",
            "aciklama": "Kadıköy pazar yakınında kahvaltı ve ev yemekleri, aile dostu",
            "adres": "Kadıköy, İstanbul", "enlem": 40.9903, "boylam": 29.0250,
            "puan": 4.5, "yorum_sayisi": 920, "data_id": "", "kaynak": "ornek"
        },
        {
            "id": 10, "ad": "Galata Kule Terası", "kategori": "Kafe",
            "aciklama": "Galata Kulesi manzarası, romantik akşam yemekleri için ideal",
            "adres": "Galata, Beyoğlu, İstanbul", "enlem": 41.0256, "boylam": 28.9741,
            "puan": 4.7, "yorum_sayisi": 1560, "data_id": "", "kaynak": "ornek"
        },
    ]


# ==================== ANA FONKSİYON ====================

def main():
    parser = argparse.ArgumentParser(
        description="Qdrant vektör veritabanına mekan verisi yükle",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Örnekler:
  # SerpAPI'dan İstanbul mekanları yükle
  python scripts/load_data.py --source serpapi

  # SerpAPI + Backend birleşik
  python scripts/load_data.py --source both --limit 50

  # Sadece örnek veriyle test et (SerpAPI gerekmez)
  python scripts/load_data.py --source sample

  # Özel sorgularla
  python scripts/load_data.py --source serpapi --queries "kafe kadıköy" "restoran beşiktaş"
        """
    )
    
    parser.add_argument(
        "--source",
        choices=["serpapi", "backend", "postgres", "both", "all", "sample"],
        default="sample",
        help="Veri kaynak: serpapi | backend | postgres | both | all | sample"
    )
    parser.add_argument(
        "--queries",
        nargs="+",
        default=["kafe istanbul", "restoran kadıköy", "kafe beşiktaş", "restoran beyoğlu"],
        help="SerpAPI arama sorguları"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=20,
        help="Her sorgu için max mekan sayısı"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Qdrant yükleme batch boyutu"
    )
    parser.add_argument(
        "--save-json",
        action="store_true",
        help="Mekanları JSON dosyasına da kaydet"
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*65)
    print("  📦 QDRANT VERİ YÜKLEYİCİ")
    print("="*65)
    print(f"  Kaynak    : {args.source}")
    print(f"  Qdrant URL: {settings.QDRANT_URL}")
    print(f"  Collection: {settings.QDRANT_COLLECTION_NAME}")
    print("="*65 + "\n")
    
    all_places = []
    
    # 1. Veri topla
    print("📥 VERİ TOPLANIYOR")
    print("-"*40)
    
    if args.source in ("serpapi", "both", "all"):
        print("\n[SerpAPI] Google Maps'ten mekanlar cekiliyor...")
        serpapi_places = fetch_from_serpapi(args.queries, args.limit)
        all_places.extend(serpapi_places)
        print(f"[SerpAPI] {len(serpapi_places)} mekan alindi")

    if args.source in ("backend", "both", "all"):
        print("\n[Backend] API + PostgreSQL fallback...")
        backend_places = fetch_from_backend()
        all_places.extend(backend_places)
        print(f"[Backend/DB] {len(backend_places)} mekan alindi")

    if args.source in ("postgres",):
        print("\n[PostgreSQL] Direkt veritabani baglantisi...")
        pg_places = fetch_from_postgres()
        all_places.extend(pg_places)
        print(f"[PostgreSQL] {len(pg_places)} mekan alindi")

    if args.source == "sample":
        print("\n[Ornek] Hazir Istanbul mekan verisi kullaniliyor...")
        all_places = load_sample_data()
        print(f"[Ornek] {len(all_places)} mekan hazir")
    
    if not all_places:
        print("\n❌ Hiç mekan verisi alınamadı. Çıkılıyor.")
        sys.exit(1)
    
    # Duplicate temizle
    seen = set()
    unique_places = []
    for p in all_places:
        key = p.get("ad", "") + p.get("adres", "")
        if key not in seen:
            seen.add(key)
            unique_places.append(p)
    
    print(f"\n✅ Toplam (benzersiz): {len(unique_places)} mekan")
    
    # JSON'a kaydet (opsiyonel)
    if args.save_json:
        out_path = os.path.join(os.path.dirname(__file__), "..", "data", "loaded_places.json")
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(unique_places, f, ensure_ascii=False, indent=2)
        print(f"💾 JSON kaydedildi: {out_path}")
    
    # 2. Qdrant'a yükle
    print("\n" + "-"*40)
    print("📤 QDRANT'A YÜKLENİYOR")
    print("-"*40)
    
    try:
        stats = load_to_qdrant(unique_places, batch_size=args.batch_size)
        
        print("\n" + "="*65)
        print("  ✅ YÜKLEME TAMAMLANDI")
        print("="*65)
        print(f"  Toplam mekan  : {stats['total']}")
        print(f"  Yüklenen      : {stats['uploaded']}")
        print(f"  Atlanan       : {stats['skipped']}")
        print(f"  Hata          : {stats['failed']}")
        print("="*65)
        print("\n💡 Şimdi şunu çalıştırabilirsiniz:")
        print("   uvicorn demo_backend_v2:app --port 8080")
        print("   # veya chatbot:")
        print("   python chatbot_interaktif.py\n")
        
    except Exception as e:
        print(f"\n❌ Yükleme hatası: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
