# Backend Scripts

Backend için yardımcı scriptler.

## Mekan Ekleme Scripti

İstanbul'daki tüm büyük zincirleri veritabanına eklemek için kullanılır.

### Kullanım

1. Backend'in çalıştığından emin olun:
```bash
cd backend
uvicorn main:app --reload
```

2. Script'i çalıştırın:
```bash
cd backend/scripts
python add_istanbul_places.py
```

### Eklenen Mekanlar

#### Kafeler (12 zincir, ~60 şube)
- **Espresso Lab**: 5 şube
- **Starbucks**: 5 şube
- **Kahve Dünyası**: 3 şube
- **Gloria Jeans**: 3 şube
- **Nero**: 3 şube
- **Caffè Nero**: 3 şube
- **Mado**: 3 şube
- **Simit Sarayı**: 3 şube
- **The House Café**: 3 şube
- **BigChefs**: 3 şube
- **Midpoint**: 3 şube
- **Happy Moon's**: 3 şube

#### Fast Food (10 zincir, ~50 şube)
- **McDonald's**: 6 şube
- **Burger King**: 6 şube
- **KFC**: 4 şube
- **Domino's Pizza**: 4 şube
- **Pizza Hut**: 4 şube
- **Sbarro**: 4 şube
- **Popeyes**: 4 şube
- **Subway**: 4 şube
- **Baydoner**: 4 şube
- **Köfteci Yusuf**: 4 şube

#### Restoranlar (8 zincir, ~20 şube)
- **Nusr-Et**: 4 şube
- **Günaydın**: 4 şube
- **Saray Muhallebicisi**: 2 şube
- **Emirgan Sütiş**: 2 şube
- **Çiya Sofrası**: 2 şube
- **Zübeyir Ocakbaşı**: 2 şube
- **Hacı Dayı**: 2 şube
- **Konyalı Lokantası**: 2 şube

#### Barlar (9 zincir, ~12 şube)
- **360 Bar**: 2 şube
- **5. Kat**: 2 şube
- **Leb-i Derya**: 2 şube
- **Sortie**: 1 şube
- **Reina**: 1 şube
- **Anjelique**: 1 şube
- **Ruby**: 1 şube
- **29**: 1 şube
- **Mikla Bar**: 1 şube

#### Fine Dining (5 mekan)
- **Mikla**: 1 şube
- **Sunset Grill & Bar**: 1 şube
- **360 Istanbul**: 1 şube
- **Ulus 29**: 1 şube
- **Bebek Balıkçı**: 1 şube

**Toplam: ~150+ mekan**

### Yeni Mekan Ekleme

Script'teki zincir listelerine yeni zincirler ekleyebilirsiniz:

```python
# Kafeler için
CAFE_CHAINS.append((
    "Zincir Adı",
    "Kafe",
    "Açıklama",
    2,  # price_range
    "Özellikler"
))

# Fast Food için
FAST_FOOD_CHAINS.append((
    "Zincir Adı",
    "Fast Food",
    "Açıklama",
    2,
    "Özellikler"
))
```

### Notlar

- Script, backend API'nin `POST /places/` endpoint'ini kullanır
- Her mekan için RAG uyumlu açıklama eklenir
- Koordinatlar İstanbul bölgelerine göre otomatik atanır
- `description` alanı AI öneri sistemi için kritiktir
- Her zincir için farklı sayıda şube eklenir (popülerlik bazlı)
