# AI Arama — Konum Önceliği Testleri

## Mantık

| Durum | `location` API | Koordinatlar |
|--------|----------------|--------------|
| Sorguda ilçe/il yok, UI: İstanbul + Kadıköy | `Kadıköy` | Kadıköy lat/lng |
| Sorguda ilçe/il yok, UI: sadece İstanbul | `Istanbul` | İstanbul merkez |
| Sorguda `beşiktaş hamburger`, UI: Kadıköy | `Beşiktaş` (prompt) | Beşiktaş lat/lng |

Backend (`ai-llm`) zaten `parse_natural_query` ile sorgudaki ilçeyi önceliklendirir; mobil taraf istek gövdesini aynı kuralla hazırlar.

## Otomatik test

```bash
node apps/mobile/scripts/test-ai-search-location.mjs
```

## Manuel (uygulama)

1. AI sekmesi → İstanbul + Kadıköy → `hamburgerci` → sonuçların Kadıköy çevresinde olması beklenir.
2. Aynı seçim → `beşiktaş hamburger` → Beşiktaş ağırlıklı sonuç (Kadıköy seçimi yok sayılır).
3. İlçe: Tümü → `kafe` → genel İstanbul.
4. Şehir: Ankara → ilçe şeridi görünmez; arama Ankara merkezli.

## curl (AI servisi `localhost:8080`)

```bash
# UI benzeri: Kadıköy
curl -s -X POST http://localhost:8080/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"hamburgerci\",\"location\":\"Kadıköy\",\"user_lat\":40.982,\"user_lng\":29.027,\"limit\":3}"

# Prompt önceliği: Beşiktaş sorguda
curl -s -X POST http://localhost:8080/api/smart-search-v2 \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"beşiktaş hamburger\",\"location\":\"Kadıköy\",\"user_lat\":40.982,\"user_lng\":29.027,\"limit\":3}"
```

İkinci istekte backend `parsed.district` = Beşiktaş kullanır (`location` alanı yedek kalır).
