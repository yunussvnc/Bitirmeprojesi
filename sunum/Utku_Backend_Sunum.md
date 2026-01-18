# Backend API Sunumu
**Sunan:** Utku Gülrek  
**Bölüm:** Backend Service  
**Süre:** 5-7 dakika

---

## 1. Giriş ve Proje Hakkında

Merhaba, ben Utku Gülrek. Projemizin backend servisinden sorumluyum.

**Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu** projesinde, tüm sistemin arka planında çalışan, veritabanı yönetimi, API endpoint'leri ve iş mantığını içeren backend servisini geliştirdim.

---

## 2. Teknoloji Stack

Backend servisimizde kullandığımız teknolojiler:

- **FastAPI**: Modern, hızlı Python web framework'ü
- **SQLite**: Geliştirme aşamasında hızlı prototipleme için ilişkisel veritabanı
- **SQLAlchemy**: Gelişmiş Python ORM kütüphanesi
- **Pydantic**: Veri validasyonu ve ayarları
- **Passlib (Bcrypt)**: Güvenli şifreleme ve kimlik doğrulama
- **Uvicorn**: ASGI web server

---

## 3. Proje Yapısı

Backend servisimiz şu dosyalardan oluşuyor:

```
backend/
├── main.py          # API endpoint'leri ve FastAPI başlatıcı
├── models.py        # SQLAlchemy veritabanı modelleri
├── schemas.py       # Pydantic (Veri transfer) modelleri
├── crud.py          # Veritabanı CRUD işlemleri
├── database.py      # Veritabanı bağlantı ayarları
├── llm_client.py    # LLM client entegrasyonu
└── llm_recommend.py # LLM tabanlı öneri sistemi
```

---

## 4. Veritabanı Modelleri

### 4.1. User (Kullanıcı)

- **id**: Kullanıcı ID
- **email**: E-posta adresi (unique)
- **hashed_password**: Bcrypt ile hash'lenmiş şifre
- **is_student**: Öğrenci durumu (QR kod doğrulama için)
- **created_at**: Kayıt tarihi

### 4.2. Place (Mekan)

- **id**: Mekan ID
- **name**: Mekan adı
- **description**: Mekan açıklaması (RAG için önemli)
- **category**: Kategori (Kafe, Restoran, Bar vb.)
- **latitude, longitude**: Konum bilgileri
- **price_range**: Fiyat aralığı (1-3)
- **features**: Özellikler (WiFi, bahçe, deniz manzarası vb.)
- **vector_id**: Qdrant vektör veritabanı ID'si
- **is_verified**: Doğrulanmış mekan durumu
- **is_featured**: Öne çıkan mekan durumu

### 4.3. Review (Yorum)

- **id**: Yorum ID
- **user_id**: Kullanıcı ID
- **place_id**: Mekan ID
- **rating**: Değerlendirme (1-5)
- **comment**: Yorum metni
- **is_verified**: QR kod ile doğrulanmış yorum
- **created_at**: Yorum tarihi

---

## 5. API Endpoints

### 5.1. Kimlik Doğrulama (Authentication)

**POST** `/auth/register`
- Yeni kullanıcı kaydı
- Şifre bcrypt ile hash'lenir
- E-posta kontrolü yapılır

**POST** `/auth/login`
- Kullanıcı girişi
- Mock JWT token döner (gelecekte gerçek JWT)

### 5.2. Mekan İşlemleri

**GET** `/places/`
- Tüm mekanları listeler
- Sayfalama desteği
- Filtreleme seçenekleri

**POST** `/places/`
- Yeni mekan ekler
- Admin/İşletme yetkisi için hazır yapı

**GET** `/places/{place_id}`
- Belirli bir mekanın detaylarını getirir

### 5.3. Yorum ve Değerlendirme

**GET** `/places/{place_id}/reviews`
- Belirli bir mekana ait yorumları getirir
- Doğrulanmış yorumlar öncelikli

**POST** `/reviews/`
- Mekana yorum ekler
- QR kod doğrulama desteği (`is_verified`)

### 5.4. Öneri Sistemi

**POST** `/recommend`
- Kullanıcı tercihlerine göre mekan önerir
- LLM entegrasyonu ile akıllı sıralama
- Açıklama metni üretir

**Request Örneği:**
```json
{
  "queryText": "Sakin bir kafe arıyorum",
  "latitude": 41.0082,
  "longitude": 28.9784,
  "vibe": "quiet",
  "purpose": "work",
  "budget": "mid",
  "category": "Kafe"
}
```

**Response Örneği:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Sakin Kafe",
      "score": 95,
      "explanation": "Sakin ortam ve güçlü wifi bağlantısı ile çalışma için ideal."
    }
  ],
  "explanation": "Size sakin bir ortamda çalışabileceğiniz kafeler öneriyoruz."
}
```

---

## 6. Öne Çıkan Özellikler

### 6.1. RAG Hazırlığı

✅ **Vector ID Entegrasyonu**
- `Place` modelindeki `vector_id` alanı ile Qdrant entegrasyonu
- `description` alanı RAG sistemi için optimize edildi

✅ **Doğrulanmış Yorumlar**
- `Review` modelindeki `is_verified` alanı
- QR kod kontrolü ile gerçek kullanıcı deneyimleri

### 6.2. Güvenlik

✅ **Şifre Hash'leme**
- Kullanıcı şifreleri bcrypt ile hash'lenir
- Veritabanında asla düz metin olarak tutulmaz

✅ **Veri Validasyonu**
- Pydantic ile tüm giriş verileri validate edilir
- SQL injection koruması (SQLAlchemy ORM)

### 6.3. LLM Entegrasyonu

✅ **Akıllı Sıralama**
- LLM ile öneriler yeniden sıralanır
- Her öneri için açıklama metni üretilir

✅ **Opsiyonel Entegrasyon**
- LLM servisi yoksa bile backend çalışır
- Graceful degradation

---

## 7. Öneri Algoritması

Backend'de geliştirdiğim öneri algoritması şu adımları izler:

### 7.1. Normalizasyon

- **Vibe**: "sakin", "canlı" → "quiet", "lively"
- **Purpose**: "çalışma", "arkadaşlar" → "work", "friends"
- **Budget**: "düşük", "orta", "yüksek" → "low", "mid", "high"

### 7.2. Skorlama

Her mekan için skor hesaplanır:

1. **Query Match**: Kullanıcı sorgusu ile mekan eşleşmesi
2. **Vibe Match**: Ruh hali eşleşmesi
3. **Purpose Match**: Amaç eşleşmesi
4. **Budget Match**: Bütçe eşleşmesi
5. **Category Match**: Kategori eşleşmesi
6. **Feature Match**: Özellik eşleşmesi

### 7.3. Sıralama

- Skorlara göre sıralama
- LLM ile yeniden sıralama (opsiyonel)
- Açıklama metni üretimi

---

## 8. CRUD İşlemleri

`crud.py` dosyasında şu fonksiyonlar bulunur:

### 8.1. Kullanıcı İşlemleri

- `get_user_by_email()`: E-posta ile kullanıcı bulma
- `create_user()`: Yeni kullanıcı oluşturma
- `authenticate_user()`: Kullanıcı doğrulama

### 8.2. Mekan İşlemleri

- `get_places()`: Mekanları listeleme
- `get_place_by_id()`: ID ile mekan bulma
- `create_place()`: Yeni mekan oluşturma
- `update_place_vector_id()`: Vector ID güncelleme

### 8.3. Yorum İşlemleri

- `get_reviews_by_place()`: Mekan yorumlarını getirme
- `create_review()`: Yeni yorum oluşturma

---

## 9. LLM Entegrasyonu

### 9.1. LLM Client

`llm_client.py` dosyasında:
- HuggingFace model entegrasyonu
- Token generation
- Error handling

### 9.2. LLM Recommendation

`llm_recommend.py` dosyasında:
- `llm_rerank_and_explain()`: Önerileri yeniden sıralama ve açıklama üretme
- Context oluşturma
- Prompt engineering

---

## 10. Zorluklar ve Çözümler

### 10.1. Veritabanı Tasarımı

**Zorluk**: RAG sistemi ile uyumlu veri yapısı

**Çözüm**: `vector_id` ve `description` alanları eklendi

### 10.2. LLM Entegrasyonu

**Zorluk**: LLM servisi opsiyonel olmalı

**Çözüm**: Try-except bloğu ile graceful degradation

### 10.3. Performans

**Zorluk**: Çoklu kriter skorlama

**Çözüm**: Etkili skorlama algoritması geliştirildi

---

## 11. Gelecek Geliştirmeler

### 11.1. JWT Authentication

- Gerçek JWT token implementasyonu
- Token refresh mekanizması
- Role-based access control

### 11.2. Database Migration

- Alembic ile migration sistemi
- PostgreSQL'e geçiş (production)

### 11.3. Caching

- Redis ile caching
- API response caching
- Query optimization

### 11.4. Testing

- Unit testler
- Integration testler
- API testleri

---

## 12. Sonuç

Backend servisi, projemizin temelini oluşturuyor:

✅ Güvenli kullanıcı yönetimi
✅ Esnek mekan yönetimi
✅ Doğrulanmış yorum sistemi
✅ Akıllı öneri algoritması
✅ LLM entegrasyonu

**Teşekkürler!**

---

## Sorular ve Cevaplar

*Sunum sonrası sorular için hazır olun*
