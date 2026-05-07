"""
scripts/fetch_google_maps.py
============================
Google Maps Places API (New) ile Istanbul mekanlarini ceker.
SerpAPI'den COKK daha zengin veri saglar:
  - Gercek fotograf URL'leri
  - Acilis/kapanis saatleri
  - price_level (1-4)
  - Telefon, website
  - Google place_id (kalici ID)
  - editorial summary

Kullanim:
  python scripts/fetch_google_maps.py              # Qdrant + PostgreSQL'e ekle
  python scripts/fetch_google_maps.py --dry-run    # Sadece goster
  python scripts/fetch_google_maps.py --only-qdrant   # Sadece Qdrant
  python scripts/fetch_google_maps.py --only-postgres  # Sadece PostgreSQL

Google Places API (New) limitleri:
  - Text Search: 5000 istek/ay (ucretsiz)
  - Her istek max 20 sonuc
  - Her konu icin 2-3 sayfa = 40-60 mekan
"""

import sys
import os
import json
import time
import argparse
from typing import Dict, List, Optional
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from dotenv import load_dotenv; load_dotenv()
from src.config import settings

# ── Google Places API endpoint ───────────────────────────────────────────────
PLACES_TEXT_SEARCH = "https://places.googleapis.com/v1/places:searchText"

# Hangi alanlar gelsin (field mask)
FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.location",
    "places.rating",
    "places.userRatingCount",
    "places.priceLevel",
    "places.types",
    "places.primaryTypeDisplayName",
    "places.editorialSummary",
    "places.currentOpeningHours",
    "places.regularOpeningHours",
    "places.photos",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.businessStatus",
    "places.googleMapsUri",
])

# Istanbul merkezi
ISTANBUL = {"latitude": 41.0082, "longitude": 28.9784}
RADIUS_METERS = 50000  # 50km yaricap

# Arama sorgulari — cesitli kategoriler
SORGULAR = [
    # Kahve & Kafe
    "romantik kafe istanbul bogazici",
    "deniz manzarali kafe istanbul",
    "sakin calisma kafe wifi istanbul",
    "kahvalti mekan istanbul kadikoy",
    "kahvalti istanbul beyoglu",
    # Restoranlar
    "fine dining restoran istanbul",
    "deniz mahsulleri restoran istanbul",
    "rooftop teras restoran istanbul",
    "vegan vejetaryen restoran istanbul",
    "aile dostu restoran istanbul",
    "japon suşi restoran istanbul",
    "italyan restoran istanbul",
    # Bar & Eglence
    "canli muzik bar beyoglu istanbul",
    "rooftop bar istanbul manzarali",
    "craft beer bar istanbul",
    "cocktail bar nisantasi istanbul",
    # Ozel kategoriler
    "ortak calisma alani coworking istanbul",
    "gece kulubu istanbul",
    "nargile kafe istanbul",
    "kahvalti brunch istanbul moda",
]

# price_level donusumu
PRICE_MAP = {
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
}


# ── API istemcisi ────────────────────────────────────────────────────────────

def search_places(query: str, api_key: str, page_token: str = None) -> dict:
    """Google Places Text Search API'yi cagir"""
    import httpx

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": FIELD_MASK,
    }

    body = {
        "textQuery": query,
        "languageCode": "tr",
        "regionCode": "TR",
        "maxResultCount": 20,
        "locationBias": {
            "circle": {
                "center": ISTANBUL,
                "radius": float(RADIUS_METERS),
            }
        }
    }

    if page_token:
        body["pageToken"] = page_token

    try:
        with httpx.Client(timeout=15) as client:
            r = client.post(PLACES_TEXT_SEARCH, headers=headers, json=body)
            if r.status_code == 200:
                return r.json()
            else:
                print(f"    API Hata {r.status_code}: {r.text[:200]}")
                return {}
    except Exception as e:
        print(f"    Baglanti hatasi: {e}")
        return {}


def normalize_place(p: dict) -> dict:
    """Google Places verisini standart formata donustur"""
    name = p.get("displayName", {}).get("text", "")
    address = p.get("formattedAddress", "")
    loc = p.get("location", {})

    # Acilis saatleri
    opening_hours = p.get("regularOpeningHours") or p.get("currentOpeningHours") or {}
    periods = opening_hours.get("periods", [])
    open_time = close_time = None
    if periods:
        # Pazartesi (0) saatlerini al
        for period in periods:
            if period.get("open", {}).get("day") == 1:  # Monday
                o = period.get("open", {})
                c = period.get("close", {})
                if o.get("hour") is not None:
                    open_time = f"{o['hour']:02d}:{o.get('minute',0):02d}"
                if c.get("hour") is not None:
                    close_time = f"{c['hour']:02d}:{c.get('minute',0):02d}"
                break
        if not open_time and periods[0].get("open", {}).get("hour") is not None:
            o = periods[0].get("open", {})
            c = periods[0].get("close", {})
            open_time = f"{o['hour']:02d}:{o.get('minute',0):02d}"
            close_time = f"{c['hour']:02d}:{c.get('minute',0):02d}" if c else None

    # Fotograf URL'i (Places API photo reference)
    photos = p.get("photos", [])
    photo_url = None
    if photos:
        photo_name = photos[0].get("name", "")
        if photo_name:
            photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxHeightPx=800&key={settings.GOOGLE_MAPS_API_KEY}"

    # Kategori
    primary_type = p.get("primaryTypeDisplayName", {}).get("text", "")
    types = p.get("types", [])
    if not primary_type and types:
        primary_type = types[0].replace("_", " ").title()

    # Ozet
    aciklama = p.get("editorialSummary", {}).get("text", "")

    # City parse (adresin son bolumu genellikle sehir)
    city = _parse_city_from_address(address)

    return {
        "id":           abs(hash(p.get("id", name + address))) % (2**31 - 1),
        "google_id":    p.get("id", ""),
        "ad":           name,
        "aciklama":     aciklama,
        "kategori":     primary_type or "Mekan",
        "adres":        address,
        "sehir":        city,
        "enlem":        float(loc.get("latitude", 0)),
        "boylam":       float(loc.get("longitude", 0)),
        "puan":         float(p.get("rating", 0)),
        "yorum_sayisi": int(p.get("userRatingCount", 0)),
        "price_level":  PRICE_MAP.get(p.get("priceLevel", ""), 2),
        "foto":         photo_url,
        "website":      p.get("websiteUri", ""),
        "telefon":      p.get("nationalPhoneNumber", ""),
        "google_url":   p.get("googleMapsUri", ""),
        "opening_time": open_time or "09:00",
        "closing_time": close_time or "22:00",
        "aktif":        p.get("businessStatus", "") == "OPERATIONAL",
        "kaynak":       "google_maps",
        "yukleme_tarihi": datetime.now().isoformat()
    }


def _parse_city_from_address(address: str) -> str:
    """Adresten sehir/semt cikar"""
    if not address:
        return "Istanbul"
    semtler = [
        "Kadikoy", "Beyoglu", "Besiktas", "Sisli", "Fatih", "Uskudar",
        "Bakirkoy", "Sariyer", "Atasehir", "Maltepe", "Kartal", "Tuzla",
        "Kagithane", "Eyup", "Nisantasi", "Ortakoy", "Bebek", "Moda",
        "Karakoy", "Taksim", "Galata", "Cihangir", "Balat", "Eminonu",
    ]
    addr_upper = address.upper()
    for s in semtler:
        if s.upper() in addr_upper:
            return s
    if "ISTANBUL" in addr_upper or "İSTANBUL" in addr_upper:
        return "Istanbul"
    return "Istanbul"


# ── Qdrant'a yukle ───────────────────────────────────────────────────────────

def yukle_qdrant(mekanlar: List[dict]) -> int:
    """Mekanları embedding'e donusturup Qdrant'a yukle"""
    from sentence_transformers import SentenceTransformer
    from qdrant_client import QdrantClient
    from qdrant_client.models import VectorParams, Distance

    print("\n[Qdrant] Embedding modeli yukleniyor...")
    model = SentenceTransformer(settings.EMBEDDING_MODEL)

    qdrant = QdrantClient(url=settings.QDRANT_URL)
    col = settings.QDRANT_COLLECTION_NAME

    # Collection olustur (yoksa)
    existing = [c.name for c in qdrant.get_collections().collections]
    if col not in existing:
        vec_size = len(model.encode(["test"])[0])
        qdrant.create_collection(col, vectors_config=VectorParams(size=vec_size, distance=Distance.COSINE))
        print(f"[Qdrant] Collection olusturuldu: {col}")

    print(f"[Qdrant] {len(mekanlar)} mekan icin embedding olusturuluyor...")

    from qdrant_client.models import PointStruct
    batch_size = 50
    yuklenen = 0

    for i in range(0, len(mekanlar), batch_size):
        batch = mekanlar[i:i+batch_size]
        texts = []
        for m in batch:
            parts = [m["ad"]]
            if m["kategori"]: parts.append(f"Kategori: {m['kategori']}")
            if m["aciklama"]: parts.append(m["aciklama"])
            if m["adres"]:    parts.append(f"Konum: {m['adres']}")
            if m["puan"] >= 4.5: parts.append("cok yuksek puanli mukemmel mekan")
            texts.append(" ".join(parts))

        embeddings = model.encode(texts, show_progress_bar=False)
        points = []
        for j, (emb, m) in enumerate(zip(embeddings, batch)):
            points.append(PointStruct(
                id=m["id"],
                vector=emb.tolist(),
                payload={
                    "id":         m["id"],
                    "google_id":  m["google_id"],
                    "ad":         m["ad"],
                    "aciklama":   m["aciklama"],
                    "kategori":   m["kategori"],
                    "adres":      m["adres"],
                    "enlem":      m["enlem"],
                    "boylam":     m["boylam"],
                    "puan":       m["puan"],
                    "yorum_sayisi": m["yorum_sayisi"],
                    "foto":       m["foto"],
                    "kaynak":     "google_maps",
                }
            ))

        qdrant.upsert(collection_name=col, points=points)
        yuklenen += len(points)
        print(f"  [Qdrant] {min(i+batch_size, len(mekanlar))}/{len(mekanlar)} yuklendi")

    return yuklenen


# ── PostgreSQL'e yukle ───────────────────────────────────────────────────────

def yukle_postgres(mekanlar: List[dict], db_url: str) -> int:
    """Mekanları PostgreSQL places tablosuna ekle"""
    import psycopg2, psycopg2.extras

    try:
        conn = psycopg2.connect(db_url, connect_timeout=5)
        conn.autocommit = False
        cur = conn.cursor()
    except Exception as e:
        print(f"[PostgreSQL] Baglanti hatasi: {e}")
        return 0

    # Mevcut Google ID'leri cek (duplicate atlama)
    cur.execute("SELECT vector_id FROM places WHERE vector_id IS NOT NULL AND vector_id != ''")
    existing_vector_ids = {row[0] for row in cur.fetchall()}

    SQL = """
        INSERT INTO places (
            name, description, category, address, city,
            latitude, longitude, average_rating, price_range,
            features, photo_url, opening_time, closing_time, vector_id
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s, %s, %s
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
    """

    eklenen = 0
    atlanan = 0

    for m in mekanlar:
        google_id = m.get("google_id", "")

        if google_id and google_id in existing_vector_ids:
            atlanan += 1
            continue

        # Features olustur
        features = _build_features(m)

        try:
            cur.execute(SQL, (
                m["ad"],
                m["aciklama"],
                m["kategori"],
                m["adres"],
                m["sehir"],
                m["enlem"],
                m["boylam"],
                m["puan"],
                m["price_level"],
                json.dumps(features, ensure_ascii=False),
                m.get("foto"),
                m["opening_time"],
                m["closing_time"],
                google_id,
            ))
            result = cur.fetchone()
            if result:
                new_id = result[0]
                existing_vector_ids.add(google_id)
                eklenen += 1
                print(f"  [+] id={new_id:5d} | {m['ad'][:45]:<45} | {m['kategori'][:18]:<18} | {m['sehir']} | ⭐{m['puan']}")
        except Exception as e:
            print(f"  [!] Hata ({m['ad'][:30]}): {e}")
            conn.rollback()

    try:
        conn.commit()
        cur.execute("SELECT COUNT(*) FROM places")
        total = cur.fetchone()[0]
        print(f"\n  PostgreSQL toplam: {total} mekan")
    except Exception as e:
        conn.rollback()
    finally:
        conn.close()

    return eklenen


def _build_features(m: dict) -> list:
    """Mekan icin feature listesi olustur"""
    features = []
    k = (m.get("kategori", "") or "").lower()
    a = (m.get("aciklama", "") or "").lower()

    cats = {
        "kafe": ["wifi", "oturma_alani", "icecek"],
        "bar": ["alkol", "icecek", "gece"],
        "restoran": ["yemek", "aile_dostu"],
        "kahvalti": ["kahvalti", "sabah", "aile_dostu"],
        "deniz": ["deniz_manzarasi", "yemek"],
        "rooftop": ["teras", "sehir_manzarasi", "romantik"],
        "muzik": ["canli_muzik", "eglence"],
        "calisma": ["wifi", "sessiz", "calisma_ortami"],
    }
    for key, vals in cats.items():
        if key in k:
            features.extend(vals)

    kw = {
        "wifi": "wifi", "w-fi": "wifi", "manzara": "manzarali",
        "teras": "teras", "bahce": "bahce", "romantik": "romantik",
        "vegan": "vegan", "boğaz": "bogaz_manzarasi",
        "deniz": "deniz_manzarasi", "çocuk": "cocuk_dostu",
    }
    for k2, tag in kw.items():
        if k2 in a and tag not in features:
            features.append(tag)

    if m.get("puan", 0) >= 4.7:
        features.append("cok_populer")
    elif m.get("puan", 0) >= 4.4:
        features.append("populer")

    if m.get("website"):
        features.append("web_sitesi_var")
    if m.get("telefon"):
        features.append("telefon_var")

    return list(set(features))


# ── Ana fonksiyon ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Google Maps Places -> Qdrant + PostgreSQL")
    parser.add_argument("--api-key", default=settings.GOOGLE_MAPS_API_KEY)
    parser.add_argument("--db", default=settings.DATABASE_URL)
    parser.add_argument("--dry-run", action="store_true", help="Ekleme yapma, goster")
    parser.add_argument("--only-qdrant", action="store_true")
    parser.add_argument("--only-postgres", action="store_true")
    parser.add_argument("--limit", type=int, default=len(SORGULAR),
                        help="Kac sorgu calistirilsin")
    args = parser.parse_args()

    if not args.api_key or args.api_key == "":
        print("HATA: GOOGLE_MAPS_API_KEY tanimli degil!")
        sys.exit(1)

    print(f"\n{'='*65}")
    print("  GOOGLE MAPS PLACES API -> MEKAN YUKLEYICI")
    print(f"{'='*65}")
    print(f"  Sorgu sayisi : {min(args.limit, len(SORGULAR))}")
    print(f"  Qdrant URL   : {settings.QDRANT_URL}")
    print(f"  PostgreSQL   : {args.db.split('@')[-1] if args.db else 'KAPALI'}")
    print(f"  Mod          : {'DRY-RUN' if args.dry_run else 'CANLI'}")
    print(f"{'='*65}\n")

    # ── Veri topla ──
    all_places = []
    seen_google_ids = set()
    sorgular = SORGULAR[:args.limit]

    for sorgu in sorgular:
        print(f"\n[Google] Araniyor: \"{sorgu}\"")
        result = search_places(sorgu, args.api_key)
        places = result.get("places", [])

        yeni = 0
        for p in places:
            gid = p.get("id", "")
            if gid not in seen_google_ids:
                seen_google_ids.add(gid)
                normalized = normalize_place(p)
                if normalized["ad"]:
                    all_places.append(normalized)
                    yeni += 1

        print(f"  +{yeni} yeni mekan (toplam: {len(all_places)})")
        time.sleep(0.3)  # Rate limiting

    print(f"\n{'='*40}")
    print(f"Toplam benzersiz mekan: {len(all_places)}")

    if not all_places:
        print("Hic mekan bulunamadi!")
        sys.exit(1)

    # ── JSON kaydet ──
    out_path = os.path.join(os.path.dirname(__file__), "..", "data", "google_maps_places.json")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_places, f, ensure_ascii=False, indent=2)
    print(f"JSON kaydedildi: {out_path}")

    if args.dry_run:
        print("\n--- DRY RUN: Ilk 3 mekan ---")
        for m in all_places[:3]:
            print(f"\n  Ad      : {m['ad']}")
            print(f"  Kategori: {m['kategori']}")
            print(f"  Adres   : {m['adres']}")
            print(f"  Puan    : {m['puan']} ({m['yorum_sayisi']} yorum)")
            print(f"  Fiyat   : {'$'*m['price_level']}")
            print(f"  Saat    : {m['opening_time']} - {m['closing_time']}")
            print(f"  Foto    : {m['foto'][:60] if m['foto'] else 'Yok'}...")
        return

    # ── Qdrant'a yukle ──
    if not args.only_postgres:
        print("\n[Qdrant] Yukleniyor...")
        q_count = yukle_qdrant(all_places)
        print(f"[Qdrant] {q_count} mekan eklendi")

    # ── PostgreSQL'e yukle ──
    if not args.only_qdrant and args.db:
        print("\n[PostgreSQL] Yukleniyor...")
        pg_count = yukle_postgres(all_places, args.db)
        print(f"[PostgreSQL] {pg_count} yeni mekan eklendi")

    print(f"\n{'='*65}")
    print("  TAMAMLANDI")
    print(f"{'='*65}\n")


if __name__ == "__main__":
    main()
