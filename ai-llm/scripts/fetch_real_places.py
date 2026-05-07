# -*- coding: utf-8 -*-
"""
fetch_real_places.py
=====================
SerpAPI Google Maps ile Istanbul'un gercek populer mekanlarini cekip
PostgreSQL places tablosuna kaydeder.

Kullanim:
    python scripts/fetch_real_places.py
"""

import sys, os, json, time, re, uuid
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import psycopg2
import psycopg2.extras
import requests

# ── Config ────────────────────────────────────────────────────────────────────
SERPAPI_KEY  = os.getenv("SERPAPI_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")
SERPAPI_URL  = "https://serpapi.com/search.json"

# ── Aranacak populer kategoriler ve sorgular ──────────────────────────────────
# Her sorgu → (query, kategori, sehir)
QUERIES = [
    # KAFELER
    ("en iyi kafe Kadıköy İstanbul",         "Kafe",             "Kadıköy"),
    ("en iyi kafe Beşiktaş İstanbul",         "Kafe",             "Beşiktaş"),
    ("en iyi kafe Beyoğlu İstanbul",          "Kafe",             "Beyoğlu"),
    ("en iyi kafe Nişantaşı İstanbul",        "Kafe",             "Nişantaşı"),
    ("en iyi kafe Karaköy İstanbul",          "Kafe",             "Karaköy"),

    # RESTORANLAR
    ("en iyi restoran Kadıköy İstanbul",      "Restoran",         "Kadıköy"),
    ("en iyi restoran Beşiktaş İstanbul",     "Restoran",         "Beşiktaş"),
    ("en iyi restoran Beyoğlu İstanbul",      "Restoran",         "Beyoğlu"),
    ("en iyi balık restoran İstanbul",        "Balık Restoran",   "İstanbul"),
    ("en iyi Türk mutfağı restoran İstanbul", "Türk Mutfağı",     "İstanbul"),

    # BARLAR / GECE HAYATI
    ("en iyi bar Beyoğlu İstanbul",           "Bar",              "Beyoğlu"),
    ("en iyi bar Kadıköy İstanbul",           "Bar",              "Kadıköy"),
    ("en iyi rooftop bar İstanbul",           "Rooftop Bar",      "İstanbul"),
    ("en iyi canlı müzik mekan İstanbul",     "Canlı Müzik",      "İstanbul"),

    # KAHVALTI
    ("en iyi kahvaltı yeri İstanbul",         "Kahvaltı",         "İstanbul"),
    ("en iyi kahvaltı Kadıköy İstanbul",      "Kahvaltı",         "Kadıköy"),

    # ÖZEL KATEGORİLER
    ("en iyi steakhouse İstanbul",            "Steakhouse",       "İstanbul"),
    ("en iyi brunch yeri İstanbul",           "Brunch",           "İstanbul"),
    ("en iyi vegan restoran İstanbul",        "Vegan Restoran",   "İstanbul"),
    ("en iyi tatlı dükkan İstanbul",          "Tatlı & Pastane",  "İstanbul"),
    ("en iyi dondurmacı İstanbul",            "Dondurma",         "İstanbul"),
    ("en iyi burger İstanbul",                "Burger",           "İstanbul"),
    ("en iyi pizza İstanbul",                 "Pizza",            "İstanbul"),
    ("en iyi sushi İstanbul",                 "Japon Mutfağı",    "İstanbul"),

    # SEMTLER
    ("populer mekan Ortaköy İstanbul",        "Eğlence",          "Ortaköy"),
    ("populer mekan Bebek İstanbul",          "Kafe",             "Bebek"),
    ("populer mekan Balat İstanbul",          "Kafe",             "Balat"),
    ("populer mekan Moda Kadıköy İstanbul",   "Kafe",             "Moda"),
    ("populer mekan Cihangir İstanbul",       "Bar",              "Cihangir"),
    ("populer mekan Arnavutköy İstanbul",     "Restoran",         "Arnavutköy"),
]

# ── Yardımcı ──────────────────────────────────────────────────────────────────

KATEGORI_OZELLIK = {
    "Kafe":           ["wifi", "oturma_alani", "icecek", "rahatsiz_ortam"],
    "Restoran":       ["yemek", "rezervasyon", "aile_dostu"],
    "Türk Mutfağı":   ["yemek", "geleneksel", "aile_dostu", "rezervasyon"],
    "Balık Restoran": ["taze_balik", "deniz_manzarasi", "yemek", "rezervasyon"],
    "Bar":            ["alkol", "gece_hayati", "eglence"],
    "Rooftop Bar":    ["teras", "sehir_manzarasi", "alkol", "romantik"],
    "Canlı Müzik":    ["canli_muzik", "eglence", "bar", "gece_hayati"],
    "Kahvaltı":       ["sabah_acik", "kahvalti", "aile_dostu"],
    "Brunch":         ["kahvalti", "aile_dostu", "hafta_sonu"],
    "Steakhouse":     ["et_yemekleri", "rezervasyon", "premium"],
    "Vegan Restoran": ["vegan", "vejetaryen", "saglikli"],
    "Tatlı & Pastane":["tatli", "kafe", "aile_dostu"],
    "Dondurma":       ["tatli", "aile_dostu", "cocuk_dostu"],
    "Burger":         ["fastfood", "paket_servis", "ucuz"],
    "Pizza":          ["italyan", "paket_servis", "aile_dostu"],
    "Japon Mutfağı":  ["sushi", "japon", "premium", "rezervasyon"],
    "Eğlence":        ["eglence", "gece_hayati", "populer"],
    "default":        ["mekan"],
}

KATEGORI_FIYAT = {
    "Kafe": 1, "Kahvaltı": 1, "Brunch": 2, "Burger": 1, "Dondurma": 1,
    "Restoran": 2, "Türk Mutfağı": 2, "Bar": 2, "Canlı Müzik": 2,
    "Balık Restoran": 3, "Steakhouse": 3, "Rooftop Bar": 3, "Japon Mutfağı": 3,
    "Pizza": 1, "Vegan Restoran": 2, "Tatlı & Pastane": 1,
    "Eğlence": 2,
}

KATEGORI_SAAT = {
    "Bar": ("18:00", "02:00"),
    "Rooftop Bar": ("17:00", "01:00"),
    "Canlı Müzik": ("20:00", "03:00"),
    "Kahvaltı": ("07:00", "13:00"),
    "Brunch": ("09:00", "15:00"),
    "Kafe": ("08:00", "22:00"),
    "Dondurma": ("10:00", "23:00"),
    "default": ("10:00", "22:00"),
}


def get_features(kategori: str, rating: float, description: str = "") -> list:
    feats = list(KATEGORI_OZELLIK.get(kategori, KATEGORI_OZELLIK["default"]))
    desc_lower = (description or "").lower()
    extras = {
        "wifi": "wifi", "wi-fi": "wifi",
        "manzara": "manzarali", "boğaz": "bogaz_manzarasi",
        "teras": "teras", "bahçe": "bahce", "bahce": "bahce",
        "rezervasyon": "rezervasyon", "vegan": "vegan",
        "nargile": "nargile", "otopark": "otopark",
        "romantik": "romantik", "çocuk": "cocuk_dostu",
    }
    for k, v in extras.items():
        if k in desc_lower and v not in feats:
            feats.append(v)
    if rating >= 4.7:
        feats.append("cok_populer")
    elif rating >= 4.4:
        feats.append("populer")
    return list(set(feats))


def get_price(kategori: str, rating: float) -> int:
    p = KATEGORI_FIYAT.get(kategori, 2)
    if rating >= 4.8 and p < 3:
        p = min(p + 1, 4)
    return p


def get_saat(kategori: str):
    return KATEGORI_SAAT.get(kategori, KATEGORI_SAAT["default"])


def parse_city(address: str, fallback: str) -> str:
    semtler = [
        "Kadıköy", "Beşiktaş", "Beyoğlu", "Şişli", "Fatih", "Üsküdar",
        "Bakırköy", "Sarıyer", "Kağıthane", "Eyüp", "Avcılar", "Bağcılar",
        "Karaköy", "Taksim", "Galata", "Ortaköy", "Bebek", "Etiler",
        "Nişantaşı", "Cihangir", "Balat", "Moda", "Arnavutköy",
        "Eminönü", "Sultanahmet",
    ]
    addr_up = (address or "").upper()
    for s in semtler:
        if s.upper() in addr_up:
            return s
    return fallback


def serpapi_search(query: str) -> list:
    """SerpAPI Google Maps araması yapar, local_results döner."""
    params = {
        "engine": "google_maps",
        "q": query,
        "hl": "tr",
        "gl": "tr",
        "api_key": SERPAPI_KEY,
        "num": 20,
    }
    try:
        r = requests.get(SERPAPI_URL, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        results = data.get("local_results", [])
        print(f"    -> {len(results)} sonuc geldi")
        return results
    except Exception as e:
        print(f"    -> SerpAPI HATA: {e}")
        return []


# ── Ana Script ────────────────────────────────────────────────────────────────

def main():
    if not SERPAPI_KEY:
        print("HATA: SERPAPI_KEY bulunamadi!")
        sys.exit(1)
    if not DATABASE_URL:
        print("HATA: DATABASE_URL bulunamadi!")
        sys.exit(1)

    print("=" * 65)
    print("  GERCEK POPULER MEKAN IMPORT")
    print("=" * 65)
    print(f"  DB: {DATABASE_URL.split('@')[-1]}")
    print(f"  Toplam sorgu: {len(QUERIES)}")
    print("=" * 65)

    # DB bağlan
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        conn.autocommit = False
        cur = conn.cursor()
        print("\nPostgreSQL baglantisi OK")
    except Exception as e:
        print(f"DB HATA: {e}")
        sys.exit(1)

    # Mevcut mekan adları (duplicate kontrolü)
    cur.execute("SELECT LOWER(name) FROM places")
    existing = {r[0] for r in cur.fetchall()}
    print(f"Mevcut kayit: {len(existing)}\n")

    SQL = """
        INSERT INTO places (
            name, description, category, address, city,
            latitude, longitude, average_rating,
            features, photo_url, price_range,
            opening_time, closing_time, vector_id
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s,
            %s, %s, %s
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
    """

    eklenen = 0
    atlanan = 0
    hatali  = 0

    for i, (query, kategori, sehir) in enumerate(QUERIES, 1):
        print(f"\n[{i}/{len(QUERIES)}] {query}")
        results = serpapi_search(query)

        for res in results:
            ad = (res.get("title") or "").strip()
            if not ad:
                atlanan += 1
                continue

            # Rating filtresi: sadece 4.0+ mekanlar
            rating = res.get("rating") or 0
            if isinstance(rating, str):
                try:
                    rating = float(rating)
                except:
                    rating = 0.0

            if rating < 4.0:
                atlanan += 1
                continue

            # Duplicate kontrolü
            if ad.lower() in existing:
                atlanan += 1
                continue

            address  = (res.get("address") or "").strip()
            gps      = res.get("gps_coordinates") or {}
            lat      = gps.get("latitude")  or 0.0
            lng      = gps.get("longitude") or 0.0
            photo    = None

            # Fotoğraf
            thumbnail = res.get("thumbnail")
            if thumbnail and thumbnail.startswith("http"):
                photo = thumbnail

            # Açıklama: type veya extensions'dan oluştur
            type_label = res.get("type") or ""
            extensions = res.get("extensions") or []
            if isinstance(extensions, list):
                ext_parts = []
                for ex in extensions:
                    if isinstance(ex, str):
                        ext_parts.append(ex)
                    elif isinstance(ex, dict):
                        ext_parts.extend(str(v) for v in ex.values() if v)
                ext_str = ", ".join(ext_parts)
            else:
                ext_str = str(extensions) if extensions else ""
            reviews    = res.get("reviews") or 0

            description = f"{type_label}. {ext_str}".strip(". ")
            if reviews:
                description += f" | {reviews} değerlendirme"

            city       = parse_city(address, sehir)
            feats      = get_features(kategori, rating, description)
            price      = get_price(kategori, rating)
            open_t, close_t = get_saat(kategori)
            vector_id  = str(res.get("data_id") or res.get("place_id") or uuid.uuid4())

            try:
                cur.execute(SQL, (
                    ad, description, kategori, address, city,
                    lat, lng, rating,
                    json.dumps(feats, ensure_ascii=False), photo, price,
                    open_t, close_t, vector_id
                ))
                result = cur.fetchone()
                if result:
                    eklenen += 1
                    existing.add(ad.lower())
                    stars = "*" * int(rating) if rating else ""
                    print(f"    [+] {ad[:45]:<45} | {rating} {stars} | {city}")
                else:
                    atlanan += 1
            except Exception as e:
                hatali += 1
                conn.rollback()
                print(f"    [!] HATA ({ad}): {str(e)[:80]}")

        # Her sorgu sonrası commit
        try:
            conn.commit()
        except Exception as e:
            print(f"    Commit hatasi: {e}")
            conn.rollback()

        # Rate limit - SerpAPI'ye saygı
        time.sleep(1.5)

    # Final
    cur.execute("SELECT COUNT(*) FROM places")
    total = cur.fetchone()[0]

    print("\n" + "=" * 65)
    print("  TAMAMLANDI")
    print("=" * 65)
    print(f"  Eklenen   : {eklenen}")
    print(f"  Atlanan   : {atlanan} (duplicate / dusuk puan)")
    print(f"  Hatali    : {hatali}")
    print(f"  DB Toplam : {total} mekan")
    print("=" * 65)

    cur.close()
    conn.close()


if __name__ == "__main__":
    main()
