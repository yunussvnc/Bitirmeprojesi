# Detaylı Proje Gereksinimleri

**Proje:** Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu  
**Versiyon:** 1.0  
**Tarih:** Ocak 2025  
**Durum:** Geliştirme Aşaması

---

## İçindekiler

1. [Giriş](#giriş)
2. [Fonksiyonel Gereksinimler](#fonksiyonel-gereksinimler)
3. [Teknik Gereksinimler](#teknik-gereksinimler)
4. [Performans Gereksinimleri](#performans-gereksinimleri)
5. [Güvenlik Gereksinimleri](#güvenlik-gereksinimleri)
6. [Kullanılabilirlik Gereksinimleri](#kullanılabilirlik-gereksinimleri)
7. [Entegrasyon Gereksinimleri](#entegrasyon-gereksinimleri)

---

## Giriş

Bu doküman, Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu'nun tüm gereksinimlerini detaylı olarak açıklamaktadır. Gereksinimler, resimdeki mesajlardan, mevcut proje yapısından ve pazar araştırmasından çıkarılmıştır.

---

## Fonksiyonel Gereksinimler

### 1. Kullanıcı Yönetimi

#### 1.1 Kullanıcı Kaydı (FR-001)
- **Açıklama:** Kullanıcılar email ve şifre ile kayıt olabilmelidir.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Email formatı doğrulanmalı
  - Şifre minimum 8 karakter olmalı
  - Şifre hash'lenerek saklanmalı (Bcrypt)
  - Duplicate email kontrolü yapılmalı
- **API Endpoint:** `POST /auth/register`
- **Atanan:** Utku Gülrek

#### 1.2 Kullanıcı Girişi (FR-002)
- **Açıklama:** Kullanıcılar email ve şifre ile giriş yapabilmelidir.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı (Mock token)
- **Detaylar:**
  - JWT token döndürülmeli
  - Token expiration süresi: 30 dakika
  - Hatalı giriş denemeleri loglanmalı
- **API Endpoint:** `POST /auth/login`
- **Atanan:** Utku Gülrek
- **Not:** Şu an mock token dönüyor, gerçek JWT implementasyonu yapılacak

#### 1.3 JWT Token Doğrulama (FR-003)
- **Açıklama:** API isteklerinde JWT token doğrulaması yapılmalıdır.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Token expiration kontrolü
  - Token signature doğrulama
  - Refresh token mekanizması
- **Atanan:** Utku Gülrek

### 2. Mekan Yönetimi

#### 2.1 Mekan Listeleme (FR-004)
- **Açıklama:** Tüm mekanları listeleme (sayfalama ile).
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Sayfalama desteği (skip, limit)
  - Kategori bazlı filtreleme
  - Şehir bazlı filtreleme
- **API Endpoint:** `GET /places/`
- **Atanan:** Utku Gülrek

#### 2.2 Mekan Ekleme (FR-005)
- **Açıklama:** Yeni mekan ekleme (Admin/İşletme yetkisiyle).
- **Öncelik:** Orta
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Admin veya işletme rolü kontrolü
  - Mekan bilgileri validasyonu
  - Vektör veritabanına otomatik ekleme
- **API Endpoint:** `POST /places/`
- **Atanan:** Utku Gülrek

#### 2.3 Mekan Detayı (FR-006)
- **Açıklama:** Mekan detay bilgilerini görüntüleme.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Mekan bilgileri
  - Yorumlar listesi
  - Beğeni sayısı
  - Harita görünümü
- **Atanan:** Ulaş Can Demirtaş

### 3. Öneri Sistemi

#### 3.1 Doğal Dil Sorgusu (FR-007)
- **Açıklama:** Kullanıcılar doğal dilde sorgu yazabilmelidir.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Örnekler:**
  - "Sessiz bir kafe arıyorum"
  - "Stresliyim, huzurlu bir yer istiyorum"
  - "Arkadaşlarla eğlenebileceğimiz bir mekan"
- **Teknoloji:** RAG Pipeline
- **Atanan:** Yunusemre Sevinç

#### 3.2 Semantik Arama (FR-008)
- **Açıklama:** Vektör veritabanında anlam bazlı arama yapabilme.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Sentence Transformers ile embedding
  - Qdrant vektör veritabanı
  - Cosine similarity ile benzerlik hesaplama
  - Minimum benzerlik skoru: 0.4
- **Atanan:** Yunusemre Sevinç

#### 3.3 Konum Bazlı Filtreleme (FR-009)
- **Açıklama:** Kullanıcı konumuna göre yakın mekanları bulma.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Latitude/longitude ile mesafe hesaplama
  - Haversine formülü kullanımı
  - Maksimum mesafe filtresi (opsiyonel)
- **Atanan:** Yunusemre Sevinç

#### 3.4 Kişiselleştirilmiş Öneri (FR-010)
- **Açıklama:** LLM ile kişiselleştirilmiş öneri metinleri üretme.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Gemma 2-2B-IT modeli
  - Context-aware öneri metinleri
  - Türkçe dil desteği
- **Atanan:** Yunusemre Sevinç

#### 3.5 Çoklu Özellik Eşleştirme (FR-011)
- **Açıklama:** Fiziksel, duygusal ve sosyal kriterleri birlikte değerlendirme.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Test Sonucu:** %83.3 başarı oranı
- **Atanan:** Yunusemre Sevinç

### 4. Yorum Sistemi

#### 4.1 Yorum Ekleme (FR-012)
- **Açıklama:** Kullanıcılar mekanlara yorum ekleyebilmelidir.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Yorum metni (1-500 karakter)
  - Rating (1-5 yıldız)
  - Yorum tarihi
- **API Endpoint:** `POST /reviews/`
- **Atanan:** Utku Gülrek

#### 4.2 Yorum Listeleme (FR-013)
- **Açıklama:** Bir mekana ait tüm yorumları görüntüleme.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Detaylar:**
  - Doğrulanmış yorumlar öncelikli
  - Tarihe göre sıralama (yeni önce)
  - Sayfalama desteği
- **API Endpoint:** `GET /places/{id}/reviews`
- **Atanan:** Utku Gülrek

#### 4.3 QR Kod Doğrulama (FR-014)
- **Açıklama:** QR kod okutarak yorum doğrulama.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - QR kod okutma (mobil uygulama)
  - Mekan doğrulama
  - `is_verified` flag'i set etme
  - Doğrulanmış yorumlar öncelikli gösterim
- **Atanan:** Utku Gülrek (Backend), Ulaş Can Demirtaş (Mobile)

### 5. Beğeni Sistemi

#### 5.1 Beğeni Ekleme (FR-015)
- **Açıklama:** Kullanıcılar mekanları beğenebilmelidir.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Beğeni/beğenmeme toggle
  - Kullanıcı başına tek beğeni
  - Beğeni sayısı güncelleme
- **API Endpoint:** `POST /places/{id}/like`, `DELETE /places/{id}/like`
- **Atanan:** Utku Gülrek

#### 5.2 Beğeni Sayısı (FR-016)
- **Açıklama:** Beğeni sayısını görüntüleme.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Real-time beğeni sayısı
  - Beğenilen mekanlar listesi
- **Atanan:** Ulaş Can Demirtaş

### 6. QR Kod Sistemi

#### 6.1 QR Kod Okutma (FR-017)
- **Açıklama:** Mekanlarda QR kod okutarak doğrulama yapma.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Kamera ile QR kod okuma
  - QR kod formatı: JSON {place_id, timestamp, signature}
  - QR kod doğrulama (signature kontrolü)
  - Ziyaret kaydı oluşturma
- **Atanan:** Ulaş Can Demirtaş

#### 6.2 Öğrenci İndirimi (FR-018)
- **Açıklama:** Öğrenci kullanıcılar için QR kod ile indirim/bedava mantığı.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - User.role = 'student' kontrolü
  - İlk ziyaret: Bedava veya %50 indirim
  - Tekrar ziyaret: Standart fiyat
  - İndirim tipi işletme tarafından belirlenebilir
- **Atanan:** Utku Gülrek

#### 6.3 İşletme QR Yönetimi (FR-019)
- **Açıklama:** İşletmeler kendi QR kodlarını yönetebilmelidir.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - QR kod oluşturma
  - QR kod yazdırma
  - QR kod istatistikleri
  - Admin paneli gerekli
- **Atanan:** Utku Gülrek

### 7. Harita Entegrasyonu

#### 7.1 Google Maps Entegrasyonu (FR-020)
- **Açıklama:** Google Maps API ile harita görüntüleme.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - React Native Maps kütüphanesi
  - Google Maps API key gereksinimi
  - Harita görünümü
  - Marker'lar ile mekan gösterimi
- **Atanan:** Ulaş Can Demirtaş

#### 7.2 Yakın Konum Bulma (FR-021)
- **Açıklama:** Google Maps'teki gibi yakın konumları bulma.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - GPS konum alma
  - Yakın mekanları listeleme
  - Mesafe gösterimi
  - Navigasyon başlatma
- **Atanan:** Ulaş Can Demirtaş

#### 7.3 Kullanıcı Yorumları (FR-022)
- **Açıklama:** Google Maps'teki gibi gerçek kullanıcı yorumlarını gösterme.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - QR kod doğrulanmış yorumlar öncelikli
  - Yorum sayısı gösterimi
  - Ortalama rating gösterimi
  - Yorum detaylarına gitme
- **Atanan:** Ulaş Can Demirtaş

### 8. İşletme Özellikleri

#### 8.1 Trendyol Öne Çıkarma (FR-023)
- **Açıklama:** İşletmeler öne çıkarma özelliği satın alabilmelidir (Premium).
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Premium üyelik sistemi
  - Place.is_featured flag'i
  - Öne çıkan mekanlar öncelikli gösterim
  - Ödeme entegrasyonu (gelecekte)
- **Atanan:** Utku Gülrek

#### 8.2 Öne Çıkan Mekanlar (FR-024)
- **Açıklama:** Öne çıkan mekanları öncelikli gösterme.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Öneri algoritmasında öncelik
  - "Öne Çıkan" badge'i
  - Arama sonuçlarında üst sıralarda gösterim
- **Atanan:** Yunusemre Sevinç

### 9. Mobil Uygulama

#### 9.1 Cross-Platform Destek (FR-025)
- **Açıklama:** iOS ve Android platformlarında çalışabilme.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Teknoloji:** React Native + Expo
- **Atanan:** Ulaş Can Demirtaş

#### 9.2 Offline Destek (FR-026)
- **Açıklama:** Temel özellikler offline çalışabilmelidir.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - AsyncStorage ile cache
  - Son görüntülenen mekanlar
  - Offline modda uyarı mesajı
- **Atanan:** Ulaş Can Demirtaş

#### 9.3 Push Notification (FR-027)
- **Açıklama:** Bildirim gönderme.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:**
  - Expo Notifications
  - Yeni öneriler bildirimi
  - İndirim bildirimleri
- **Atanan:** Ulaş Can Demirtaş

---

## Teknik Gereksinimler

### 1. Backend

#### 1.1 Database Migration (TR-001)
- **Açıklama:** Alembic ile database migration yönetimi.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

#### 1.2 API Versioning (TR-002)
- **Açıklama:** API versiyonlama (v1, v2).
- **Öncelik:** Düşük
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

#### 1.3 Error Handling (TR-003)
- **Açıklama:** Merkezi hata yönetimi ve custom exception handler.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

#### 1.4 Logging (TR-004)
- **Açıklama:** Loglama mekanizması.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

#### 1.5 Rate Limiting (TR-005)
- **Açıklama:** API rate limiting.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

### 2. AI/LLM Service

#### 2.1 Cache Mekanizması (TR-006)
- **Açıklama:** LLM yanıtlarını cache'leme.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Yunusemre Sevinç

#### 2.2 Model Optimizasyonu (TR-007)
- **Açıklama:** LLM model optimizasyonu (quantization).
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Detaylar:** 4-bit quantization düşünülüyor
- **Atanan:** Yunusemre Sevinç

#### 2.3 Konum Ağırlıklandırma (TR-008)
- **Açıklama:** Mesafe faktörünü benzerlik skoruna dahil etme.
- **Öncelik:** Yüksek
- **Durum:** 🔄 Planlandı
- **Atanan:** Yunusemre Sevinç

### 3. Mobile App

#### 3.1 State Management (TR-009)
- **Açıklama:** Zustand veya Redux ile state yönetimi.
- **Öncelik:** Orta
- **Durum:** ✅ Tamamlandı
- **Teknoloji:** Zustand
- **Atanan:** Ulaş Can Demirtaş

#### 3.2 Type Safety (TR-010)
- **Açıklama:** TypeScript ile tip güvenliği.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Atanan:** Ulaş Can Demirtaş

#### 3.3 API Integration (TR-011)
- **Açıklama:** Axios ile API entegrasyonu.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Atanan:** Ulaş Can Demirtaş

### 4. Test

#### 4.1 Unit Tests (TR-012)
- **Açıklama:** Backend için unit testler.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Framework:** Pytest
- **Atanan:** Utku Gülrek

#### 4.2 Integration Tests (TR-013)
- **Açıklama:** Entegrasyon testleri.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Tüm Ekip

#### 4.3 AI/LLM Tests (TR-014)
- **Açıklama:** AI servisi test suite.
- **Öncelik:** Yüksek
- **Durum:** ✅ Tamamlandı
- **Sonuç:** 5 test dosyası, %83.3 başarı
- **Atanan:** Yunusemre Sevinç

### 5. Deployment

#### 5.1 CI/CD Pipeline (TR-015)
- **Açıklama:** Continuous Integration/Deployment.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Tüm Ekip

#### 5.2 Production Environment (TR-016)
- **Açıklama:** Production ortamı kurulumu.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Tüm Ekip

#### 5.3 Monitoring (TR-017)
- **Açıklama:** Monitoring ve logging sistemi.
- **Öncelik:** Orta
- **Durum:** 🔄 Planlandı
- **Atanan:** Tüm Ekip

---

## Performans Gereksinimleri

### 1. API Response Time (NFR-001)
- **Hedef:** API yanıt süresi < 500ms
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

### 2. LLM Response Time (NFR-002)
- **Hedef:** LLM yanıt süresi < 3 saniye
- **Durum:** ✅ Tamamlandı (Ortalama: 2.1 saniye)
- **Atanan:** Yunusemre Sevinç

### 3. Database Query Performance (NFR-003)
- **Hedef:** Database sorgu performansı optimizasyonu
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

---

## Güvenlik Gereksinimleri

### 1. Password Hashing (NFR-004)
- **Durum:** ✅ Tamamlandı (Bcrypt)
- **Atanan:** Utku Gülrek

### 2. JWT Security (NFR-005)
- **Durum:** 🔄 Planlandı
- **Atanan:** Utku Gülrek

### 3. HTTPS (NFR-006)
- **Durum:** 🔄 Planlandı
- **Atanan:** Tüm Ekip

---

## Kullanılabilirlik Gereksinimleri

### 1. Responsive Design (NFR-009)
- **Durum:** ✅ Tamamlandı
- **Atanan:** Ulaş Can Demirtaş

### 2. Accessibility (NFR-010)
- **Durum:** 🔄 Planlandı
- **Atanan:** Ulaş Can Demirtaş

---

## Entegrasyon Gereksinimleri

### 1. Google Maps API
- **Açıklama:** Harita görüntüleme ve konum servisleri
- **Durum:** 🔄 Planlandı

### 2. Payment Gateway (Gelecek)
- **Açıklama:** Premium üyelik ödemeleri için
- **Durum:** Planlanmadı

---

## Gereksinim Özeti

| Kategori | Toplam | Tamamlandı | Planlandı | İptal Edildi |
|----------|--------|------------|-----------|--------------|
| Fonksiyonel | 27 | 14 | 13 | 0 |
| Teknik | 17 | 3 | 14 | 0 |
| Performans | 3 | 1 | 2 | 0 |
| Güvenlik | 3 | 1 | 2 | 0 |
| Kullanılabilirlik | 2 | 1 | 1 | 0 |
| **TOPLAM** | **52** | **20** | **32** | **0** |

**Tamamlanma Oranı:** %38.5  
**Planlanan:** %61.5

---

## Son Güncelleme

**Tarih:** 17 Ocak 2025  
**Güncelleyen:** AI Assistant  
**Versiyon:** 1.0
