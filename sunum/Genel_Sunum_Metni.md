# Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu
**Genel Sunum Metni**  
**Süre:** 10-15 dakika

---

## 1. Proje Tanıtımı

Merhaba, bugün sizlere **Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu** projemizi sunacağız.

Bu proje, kullanıcıların doğal dil ile mekan araması yapabilmesini, kişiselleştirilmiş öneriler almasını ve öğrenci indirimlerinden yararlanmasını sağlayan kapsamlı bir platformdur.

---

## 2. Proje Ekibi

Projemiz üç ana bileşenden oluşuyor ve her biri farklı bir ekip üyesi tarafından geliştirildi:

- **Yunusemre Sevinç** - AI/LLM Service (RAG mimarisi, vektör veritabanı, LLM entegrasyonu)
- **Utku Gülrek** - Backend Service (API, veritabanı, iş mantığı)
- **Ulaş Can Demirtaş** - Mobile App & Frontend (UI/UX, mobil uygulama)

---

## 3. Problem Tanımı

### 3.1. Mevcut Durum

Günümüzde mekan arama platformları:
- ❌ Sadece anahtar kelime bazlı arama yapıyor
- ❌ Kullanıcı tercihlerini anlamıyor
- ❌ Öğrenci indirimlerini otomatik uygulamıyor
- ❌ Doğrulanmış yorumlar yok
- ❌ Türkçe doğal dil desteği sınırlı

### 3.2. Çözüm

Bizim platformumuz:
- ✅ Doğal dil ile arama (AI destekli)
- ✅ Kişiselleştirilmiş öneriler (RAG mimarisi)
- ✅ QR kod ile öğrenci doğrulama ve indirim
- ✅ Doğrulanmış yorumlar (QR kod ile)
- ✅ Tam Türkçe NLP desteği

---

## 4. Sistem Mimarisi

### 4.1. Genel Mimari

Platformumuz üç ana bileşenden oluşuyor:

1. **AI/LLM Service** (Port 8001)
   - RAG mimarisi
   - Vektör veritabanı (Qdrant)
   - LLM (Gemma 2)

2. **Backend Service** (Port 8000)
   - FastAPI
   - SQLite veritabanı
   - API endpoint'leri

3. **Mobile App**
   - React Native
   - Expo
   - Cross-platform

### 4.2. Veri Akışı

```
Kullanıcı → Mobile App → Backend API → AI/LLM Service
                                    ↓
                              Qdrant (Vektör DB)
                                    ↓
                              LLM (Gemma 2)
                                    ↓
                              Öneriler → Backend → Mobile App → Kullanıcı
```

---

## 5. Teknoloji Stack

### 5.1. AI/LLM Service

- FastAPI
- PyTorch
- Qdrant (Vektör DB)
- Sentence Transformers
- Gemma 2 (Google LLM)
- HuggingFace Transformers

### 5.2. Backend Service

- FastAPI
- SQLite / SQLAlchemy
- Pydantic
- Bcrypt
- Uvicorn

### 5.3. Mobile App

- React Native
- TypeScript
- Expo
- React Navigation
- Axios

---

## 6. Özellikler

### 6.1. AI Destekli Öneri Sistemi

✅ **RAG (Retrieval-Augmented Generation) Mimarisi**
- Kullanıcı sorgusu vektöre dönüştürülür
- Vektör veritabanında benzer mekanlar bulunur
- LLM ile kişiselleştirilmiş öneri metni üretilir

✅ **Doğal Dil İşleme**
- Türkçe sorgu anlama
- Semantik arama (anlam bazlı)
- Duygu ve ruh hali anlama

### 6.2. Kişiselleştirme

✅ **Konum Bazlı**
- GPS ile kullanıcı konumu
- Yakın mekanlar öncelikli
- Mesafe hesaplama

✅ **Tercih Bazlı**
- Ruh hali (sakin, canlı)
- Amaç (çalışma, arkadaşlar, romantik)
- Bütçe (düşük, orta, yüksek)

### 6.3. Öğrenci Özellikleri

✅ **QR Kod Doğrulama**
- Öğrenci kartı QR kod ile doğrulanır
- Otomatik indirim uygulanır
- Doğrulanmış yorum yetkisi

✅ **Öğrenci İndirimleri**
- %10-50 arası indirimler
- Kampüs yakını özel fırsatlar
- Dönem başı kampanyalar

### 6.4. Yorum Sistemi

✅ **Doğrulanmış Yorumlar**
- QR kod ile mekan ziyareti doğrulama
- Güvenilir içerik
- Öncelikli gösterim

✅ **Detaylı Değerlendirme**
- 1-5 yıldız rating
- Yorum metni
- Fotoğraf ekleme (planlanan)

---

## 7. Kullanım Senaryoları

### Senaryo 1: Öğrenci Kullanıcı

1. Kullanıcı uygulamaya giriş yapar
2. "Sakin bir kafe arıyorum, wifi olmalı" diye arama yapar
3. AI sistemi öneriler üretir
4. Kullanıcı bir mekanı seçer
5. Mekana gider ve QR kodu tarar
6. Öğrenci indirimi otomatik uygulanır
7. Yorum yapma yetkisi kazanır

### Senaryo 2: Genel Kullanıcı

1. Kullanıcı konumunu paylaşır
2. "Romantik bir restoran" diye arama yapar
3. Yakın, romantik restoranlar listelenir
4. Kullanıcı bir restoranı seçer
5. Detay sayfasında yorumları okur
6. Navigasyon başlatır

---

## 8. Test Sonuçları

### 8.1. AI/LLM Service

✅ **5/5 test başarılı**
- Ortalama benzerlik skoru: 0.548
- En yüksek skor: 0.826
- Ortalama yanıt süresi: 2-3 saniye

**Test Senaryoları:**
- ☕ "kahve icmek istiyorum" → Kahve Durağı (0.681)
- 💻 "sessiz calisma mekani" → Sakin Köşe Kafe (0.494)
- 🍳 "guzel kahvalti" → Meyhane Sofrası (0.468)
- 🍽️ "sik restoran romantic" → Şato Restaurant (0.723)
- 🌊 "deniz manzarali cafe" → Deniz Yıldızı Cafe (0.826)

### 8.2. Backend API

✅ **Tüm endpoint'ler çalışıyor**
- Authentication: ✅
- Place CRUD: ✅
- Review System: ✅
- Recommendation: ✅

### 8.3. Mobile App

✅ **Tüm ekranlar çalışıyor**
- Login: ✅
- Home: ✅
- Explore: ✅
- Place Detail: ✅
- QR Scan: ✅

---

## 9. Rekabet Analizi

### 9.1. Rekabet Avantajlarımız

| Özellik | Bizim Platform | Google Maps | Yemeksepeti | Trendyol |
|---------|---------------|-------------|-------------|----------|
| AI Öneri Sistemi | ✅ RAG + LLM | ❌ | ❌ | ❌ |
| Doğal Dil Sorgusu | ✅ | ⚠️ Kısmi | ❌ | ❌ |
| QR Kod Doğrulama | ✅ | ❌ | ⚠️ Sipariş | ❌ |
| Öğrenci İndirimi | ✅ | ❌ | ❌ | ❌ |
| Türkçe NLP | ✅ | ⚠️ Kısmi | ⚠️ Kısmi | ❌ |

### 9.2. Farklılaştırıcı Özellikler

1. **AI Destekli Öneri Sistemi**: RAG mimarisi ile akıllı öneriler
2. **Öğrenci Odaklı**: QR kod doğrulama ve otomatik indirim
3. **Türkçe NLP**: Tam Türkçe doğal dil desteği
4. **Doğrulanmış Yorumlar**: QR kod ile gerçek kullanıcı deneyimleri

---

## 10. Pazar Analizi

### 10.1. Hedef Kitle

- **Öğrenciler** (%40): 8.5M+ öğrenci
- **Genç Profesyoneller** (%30): 25-35 yaş
- **Aileler** (%20): 30-45 yaş
- **Turistler** (%10): Yerel deneyim arayışı

### 10.2. Pazar Büyüklüğü

- **Türkiye Pazarı**: $2.1B (2024)
- **Yıllık Büyüme**: %18
- **Aktif Mobil Kullanıcı**: 45M+
- **Mobil Uygulama Tercihi**: %72

---

## 11. Gelecek Planları

### 11.1. Kısa Vadeli (1-3 Ay)

- ✅ QR kod sistemi tam implementasyonu
- ✅ Google Maps entegrasyonu
- ✅ Yorum sistemi iyileştirmeleri
- ✅ Öne çıkarma sistemi

### 11.2. Orta Vadeli (3-6 Ay)

- 📱 Kullanıcı kazanımı (sosyal medya, influencer)
- 📊 Mekan verisi artırma (25 → 100+)
- ❤️ Beğeni sistemi
- 🔔 Push notification

### 11.3. Uzun Vadeli (6-12 Ay)

- 🚀 Production deployment
- 💰 Monetizasyon modelleri
- 🌍 Yeni şehirler
- 🤝 Üniversite işbirlikleri

---

## 12. Teknik Başarılar

### 12.1. AI/LLM Service

✅ RAG mimarisi başarıyla implementasyonu
✅ Türkçe NLP desteği
✅ Qdrant vektör veritabanı entegrasyonu
✅ Gemma 2 LLM yerel çalıştırma

### 12.2. Backend Service

✅ FastAPI ile modern API
✅ Güvenli authentication (Bcrypt)
✅ LLM entegrasyonu
✅ Akıllı öneri algoritması

### 12.3. Mobile App

✅ Cross-platform uyumluluk
✅ Modern UI/UX tasarım
✅ QR kod tarama
✅ API entegrasyonu

---

## 13. Öğrenilen Dersler

### 13.1. Teknik

- RAG mimarisinin pratik uygulaması
- Vektör veritabanı kullanımı
- Cross-platform mobil geliştirme
- API tasarımı ve entegrasyonu

### 13.2. Takım Çalışması

- Modüler geliştirme yaklaşımı
- API kontratları ile entegrasyon
- Git workflow ve versiyon kontrolü
- Dokümantasyon önemi

---

## 14. Sonuç

**Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu**, modern teknolojiler kullanarak:

✅ Kullanıcıların doğal dil ile mekan araması yapmasını sağlıyor
✅ Kişiselleştirilmiş öneriler sunuyor
✅ Öğrenci indirimlerini otomatik uyguluyor
✅ Güvenilir yorum sistemi sunuyor
✅ Türkçe dil desteği sağlıyor

Projemiz, AI teknolojilerini pratik bir kullanım senaryosuna uygulayarak, kullanıcı deneyimini iyileştirmeyi hedefliyor.

---

## 15. Teşekkürler

Projemizin geliştirilmesinde emeği geçen herkese teşekkür ederiz.

**Sorularınız için hazırız!**

---

## Ek Bilgiler

- **GitHub Repository**: [Repository URL]
- **Dokümantasyon**: `docs/` klasörü
- **Test Sonuçları**: `sunum/test_sonuclari.md`
- **Pazar Araştırması**: `dökümanlar/Pazar_Arastirmasi.html`
