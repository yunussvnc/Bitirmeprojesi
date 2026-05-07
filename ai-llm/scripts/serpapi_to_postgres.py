"""
scripts/serpapi_to_postgres.py
================================
SerpAPI/Qdrant mekanlarini PostgreSQL places tablosuna aktar.

- data/loaded_places.json dosyasini okur
- Kategori, sehir, ozellikleri akillica parse eder
- price_range otomatik belirlenir
- features JSON array olarak yazilir
- vector_id olarak Qdrant id kaydedilir
- ON CONFLICT ile ayni mekan 2 kez eklenmez

Kullanim:
    python scripts/serpapi_to_postgres.py
    python scripts/serpapi_to_postgres.py --db "postgresql://user:pass@host/db"
    python scripts/serpapi_to_postgres.py --dry-run   # ekleme yapma, sadece goster
"""

import sys
import os
import json
import re
import argparse
from datetime import datetime
from typing import Optional

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()
from src.config import settings


# ── Sabitler ─────────────────────────────────────────────────────────────────

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "loaded_places.json")

# Istanbul semtlerinden sehir cikar
ISTANBUL_SEMTLERI = [
    "Kadikoy", "Besiktas", "Beyoglu", "Sisli", "Fatih", "Uskudar",
    "Bakirkoy", "Maltepe", "Kartal", "Pendik", "Umraniye", "Sariyer",
    "Kagithane", "Gaziosmanpasa", "Eyup", "Bayrampasa", "Avcilar",
    "Buyukcekmece", "Catalca", "Silivri", "Arnavutkoy", "Basaksehir",
    "Esenyurt", "Bagcilar", "Bahcelievler", "Esenler", "Gungoren",
    "Sultangazi", "Adalar", "Atasehir", "Cekmekoy", "Sancaktepe",
    "Sultanbeyli", "Tuzla", "Beykoz", "Sile", # sic
    # Semtler
    "Karakoy", "Taksim", "Galata", "Ortakoy", "Bebek", "Etiler",
    "Nisantasi", "Cihangir", "Balat", "Fener", "Moda", "Kuzguncuk",
    "Eminonu", "Sultanahmet", "Kapalicarsı", "Bogazici",
]

# Kategori → price_range (1=ucuz, 2=orta, 3=pahali, 4=lüks)
KATEGORI_FIYAT = {
    "Kafe": 1, "kahvalti": 1, "Fastfood": 1, "Sokak yemegi": 1,
    "Restoran": 2, "Bar": 2, "Canli muzik": 2, "Ortak calisma": 1,
    "Deniz mahsulleri": 3, "Steakhouse": 3, "Japon": 3,
    "Fine dining": 4, "Roof": 3, "Rooftop": 3, "Lüks": 4,
}

# Kategori → özellik etiketleri
KATEGORI_OZELLIKLER = {
    "Kafe": ["wifi", "oturma_alani", "icecek"],
    "Bar": ["alkol", "canli_muzik", "gece_hayati"],
    "Restoran": ["yemek", "rezervasyon", "aile_dostu"],
    "Kahvalti": ["sabah_acik", "kahvalti", "aile_dostu"],
    "Deniz mahsulleri": ["taze_balik", "deniz_manzarasi", "yemek"],
    "Ortak Calisma": ["wifi", "sessiz", "calisma_ortami", "priz"],
    "Rooftop": ["teras", "sehir_manzarasi", "romantik"],
    "Canli muzik": ["canli_muzik", "eglence", "bar"],
    "default": ["mekan"],
}


# ── Yardımcı Fonksiyonlar ─────────────────────────────────────────────────────

def parse_city(adres: str) -> str:
    """Adresten sehir/semt cikar"""
    if not adres:
        return "Istanbul"
    adres_upper = adres.upper()
    for semt in ISTANBUL_SEMTLERI:
        if semt.upper() in adres_upper:
            return semt
    if "ISTANBUL" in adres_upper or "İSTANBUL" in adres_upper:
        return "Istanbul"
    return "Istanbul"


def get_price_range(kategori: str, puan: float) -> int:
    """Kategori ve puana gore fiyat araligi (1-4)"""
    if not kategori:
        return 2
    for key, val in KATEGORI_FIYAT.items():
        if key.lower() in kategori.lower():
            return val
    # Yüksek puanli mekanlar genellikle daha pahali
    if puan >= 4.7:
        return 3
    if puan >= 4.3:
        return 2
    return 1


def get_features(mekan: dict) -> list:
    """Mekan icin özellik listesi olustur"""
    kategori = mekan.get("kategori", "")
    aciklama = (mekan.get("aciklama", "") or "").lower()
    features = []

    # Kategoriye gore temel ozellikler
    for key, vals in KATEGORI_OZELLIKLER.items():
        if key.lower() in kategori.lower():
            features.extend(vals)
            break
    else:
        features.extend(KATEGORI_OZELLIKLER["default"])

    # Açiklamadan ek özellikler çikar
    kelime_map = {
        "wifi": "wifi",
        "wi-fi": "wifi",
        "manzara": "manzarali",
        "teras": "teras",
        "bahce": "bahce",
        "rezervasyon": "rezervasyon",
        "vegan": "vegan",
        "vegetarian": "vejetaryen",
        "gluten": "glutensiz",
        "canlı müzik": "canli_muzik",
        "canli muzik": "canli_muzik",
        "nargile": "nargile",
        "kahvaltı": "kahvalti",
        "boğaz": "bogaz_manzarasi",
        "bogaz": "bogaz_manzarasi",
        "deniz": "deniz_manzarasi",
        "çocuk": "cocuk_dostu",
        "cocuk": "cocuk_dostu",
        "otopark": "otopark",
        "paket": "paket_servis",
        "teslimat": "teslimat",
        "temiz": "temiz",
        "romantik": "romantik",
    }
    for kelime, etiket in kelime_map.items():
        if kelime in aciklama and etiket not in features:
            features.append(etiket)

    # Yüksek puan etiketleri
    puan = mekan.get("puan", 0) or 0
    if puan >= 4.7:
        features.append("cok_populer")
    elif puan >= 4.4:
        features.append("populer")

    return list(set(features))  # deduplicate


def make_opening_hours(kategori: str) -> tuple:
    """Kategoriye gore tahmini calisma saatleri"""
    k = (kategori or "").lower()
    if any(x in k for x in ["bar", "canli", "gece", "kulup"]):
        return "18:00", "02:00"
    if any(x in k for x in ["kahvalti", "kafe"]):
        return "07:00", "22:00"
    if any(x in k for x in ["restoran", "deniz"]):
        return "11:00", "23:00"
    return "09:00", "22:00"


# ── Ana Script ────────────────────────────────────────────────────────────────

def load_places_from_json(json_path: str) -> list:
    """JSON dosyasindan mekanlari oku"""
    if not os.path.exists(json_path):
        print(f"HATA: {json_path} bulunamadi!")
        print("Once 'python scripts/load_data.py --source serpapi --save-json' calistirin")
        return []
    with open(json_path, encoding="utf-8") as f:
        data = json.load(f)
    print(f"JSON'dan {len(data)} mekan okundu")
    return data


def serpapi_to_postgres(db_url: str, dry_run: bool = False):
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        print("HATA: pip install psycopg2-binary")
        sys.exit(1)

    # ── Veri yukle ──
    mekanlar = load_places_from_json(JSON_PATH)
    if not mekanlar:
        sys.exit(1)

    print(f"\n{'='*65}")
    print("  SERPAPI → POSTGRESQL AKTARIM")
    print(f"{'='*65}")
    print(f"  Toplam mekan  : {len(mekanlar)}")
    print(f"  Veritabani    : {db_url.split('@')[-1]}")
    print(f"  Mod           : {'DRY-RUN (ekleme yapilmaz)' if dry_run else 'CANLI'}")
    print(f"{'='*65}\n")

    if dry_run:
        print("--- DRY RUN ORNEKLERI (ilk 5 mekan) ---\n")
        for m in mekanlar[:5]:
            city = parse_city(m.get("adres", ""))
            price = get_price_range(m.get("kategori", ""), m.get("puan", 0))
            feats = get_features(m)
            open_t, close_t = make_opening_hours(m.get("kategori", ""))
            print(f"  Ad       : {m.get('ad')}")
            print(f"  Kategori : {m.get('kategori')}")
            print(f"  Adres    : {m.get('adres')}")
            print(f"  Sehir    : {city}")
            print(f"  Puan     : {m.get('puan')}  |  Fiyat: {'$'*price}")
            print(f"  Features : {feats}")
            print(f"  Saat     : {open_t} - {close_t}")
            print()
        return

    # ── DB baglantisi ──
    try:
        conn = psycopg2.connect(db_url, connect_timeout=5)
        conn.autocommit = False
        cur = conn.cursor()
        print("PostgreSQL baglantisi OK\n")
    except Exception as e:
        print(f"HATA: PostgreSQL baglanamadi: {e}")
        sys.exit(1)

    # ── Mevcut mekan adlarini cek (duplicate atlama icin) ──
    cur.execute("SELECT LOWER(name) FROM places;")
    existing_names = {row[0] for row in cur.fetchall()}
    print(f"Mevcut kayit sayisi: {len(existing_names)}")

    # ── Mekanlari donustur ve ekle ──
    eklenen = 0
    atlanan = 0
    hatali  = 0

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

    for m in mekanlar:
        ad = (m.get("ad") or "").strip()
        if not ad:
            atlanan += 1
            continue

        # Zaten var mi?
        if ad.lower() in existing_names:
            print(f"  [ATLA] Zaten var: {ad}")
            atlanan += 1
            continue

        # Donustur
        category     = m.get("kategori") or "Diger"
        description  = (m.get("aciklama") or "").strip()
        address      = (m.get("adres") or "").strip()
        city         = parse_city(address)
        lat          = m.get("enlem") or 0.0
        lng          = m.get("boylam") or 0.0
        avg_rating   = m.get("puan") or 0.0
        photo_url    = m.get("foto") or None
        vector_id    = str(m.get("data_id") or m.get("id") or "")
        price_range  = get_price_range(category, avg_rating)
        features     = json.dumps(get_features(m), ensure_ascii=False)
        opening_time, closing_time = make_opening_hours(category)

        try:
            cur.execute(SQL, (
                ad, description, category, address, city,
                lat, lng, avg_rating,
                features, photo_url, price_range,
                opening_time, closing_time, vector_id
            ))
            result = cur.fetchone()
            if result:
                new_id = result[0]
                existing_names.add(ad.lower())
                eklenen += 1
                print(f"  [+] id={new_id:5d} | {ad[:45]:<45} | {category[:20]:<20} | {city}")
            else:
                atlanan += 1
        except Exception as e:
            print(f"  [!] HATA ({ad}): {e}")
            hatali += 1
            conn.rollback()

    # ── Kaydet ──
    try:
        conn.commit()
        print(f"\n{'='*65}")
        print(f"  TAMAMLANDI")
        print(f"{'='*65}")
        print(f"  Eklenen  : {eklenen}")
        print(f"  Atlanan  : {atlanan} (zaten mevcut veya bos)")
        print(f"  Hatali   : {hatali}")

        # Son kontrol
        cur.execute("SELECT COUNT(*) FROM places;")
        total = cur.fetchone()[0]
        print(f"  Toplam   : {total} mekan PostgreSQL'de")
        print(f"{'='*65}\n")
    except Exception as e:
        print(f"Commit hatasi: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="SerpAPI mekanlarini PostgreSQL'e aktar")
    parser.add_argument(
        "--db",
        default=settings.DATABASE_URL,
        help="PostgreSQL baglanti URL (varsayilan: config'den)"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Sadece goster, veritabanina yazma"
    )
    args = parser.parse_args()

    serpapi_to_postgres(args.db, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
