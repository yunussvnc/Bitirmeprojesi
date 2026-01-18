# AI/LLM Servisi Sunumu
**Sunan:** Yunusemre Sevinç  
**Bölüm:** AI/LLM Service  
**Süre:** 5-7 dakika

---

## 1. Giriş ve Proje Hakkında

Merhaba, ben Yunusemre Sevinç. Projemizin AI ve LLM servisinden sorumluyum.

**Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu** projesinde, kullanıcıların doğal dil ile mekan araması yapabilmesini ve kişiselleştirilmiş öneriler almasını sağlayan AI servisini geliştirdim.

---

## 2. Teknoloji Stack

Projemizde kullandığımız ana teknolojiler:

- **FastAPI**: Modern, hızlı Python web framework'ü
- **PyTorch**: Deep learning framework
- **Qdrant**: Vektör veritabanı (semantik arama için)
- **Sentence Transformers**: Türkçe metinleri vektörlere dönüştüren embedding modelleri
- **Gemma 2**: Google'ın açık kaynak LLM'i (2B parametreli model)
- **HuggingFace Transformers**: Model inference için

---

## 3. RAG (Retrieval-Augmented Generation) Mimarisi

Projemizin kalbi olan RAG mimarisi, iki aşamalı bir süreç izliyor:

### 3.1. Retrieval (Arama) Aşaması

1. **Kullanıcı Sorgusu**: Kullanıcı "Sakin bir kafe arıyorum, wifi olmalı" gibi doğal dil ile sorgu yapar
2. **Embedding Dönüşümü**: Sorgu, Türkçe destekli embedding modeli ile vektöre dönüştürülür
3. **Vektör Arama**: Qdrant vektör veritabanında, mekan açıklamalarının embedding'leri ile benzerlik araması yapılır
4. **İlgili Mekanlar**: En yüksek benzerlik skoruna sahip mekanlar bulunur

### 3.2. Generation (Üretim) Aşaması

1. **Context Oluşturma**: Bulunan mekanlar, LLM'e context olarak sağlanır
2. **Kişiselleştirme**: Kullanıcı tercihleri ve konum bilgisi eklenir
3. **Metin Üretimi**: Gemma 2 LLM modeli, kişiselleştirilmiş öneri metni üretir
4. **Gerekçe**: Her öneri için neden o mekanın önerildiği açıklanır

---

## 4. Sistem Bileşenleri

### 4.1. Embedding Model

- **Model**: `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2`
- **Özellik**: Türkçe metinleri 384 boyutlu vektörlere dönüştürür
- **Kullanım**: Hem kullanıcı sorgularını hem de mekan açıklamalarını vektörleştirir

### 4.2. Vector Database (Qdrant)

- **Görev**: Mekan açıklamalarının embedding'lerini saklar
- **Avantaj**: Hızlı semantik arama yapılmasını sağlar
- **Özellik**: 25 mekanın embedding'leri şu anda veritabanında

### 4.3. LLM (Gemma 2)

- **Model**: Google Gemma 2 (2B parametre)
- **Özellik**: Açık kaynak, yerel çalıştırılabilir
- **Görev**: Kişiselleştirilmiş öneri metinleri üretir

### 4.4. RAG Pipeline

- **Retriever**: İlgili mekanları bulur
- **Generator**: Öneri metinleri üretir
- **Pipeline**: İki bileşeni birleştirir

---

## 5. Özellikler ve Yetenekler

### 5.1. Doğal Dil İşleme

✅ **Türkçe Sorgu Anlama**
- "Sakin bir kafe arıyorum"
- "Romantik bir restoran"
- "Deniz manzaralı mekan"

✅ **Semantik Arama**
- Kelime eşleşmesi değil, anlam bazlı arama
- "Sessiz" ve "sakin" aynı anlamda algılanır

### 5.2. Kişiselleştirme

✅ **Konum Bazlı Öneriler**
- Kullanıcının konumuna göre yakın mekanlar önceliklendirilir
- Mesafe hesaplaması yapılır

✅ **Duygu ve Ruh Hali Anlama**
- "Stresliyim" → Rahatlatıcı mekanlar
- "Neşeli" → Canlı mekanlar
- "Romantik" → Romantik atmosfer

✅ **Sosyal Durum Anlama**
- "Ailecek" → Geniş alan, çocuk oyun alanı
- "Arkadaşlarla" → Sosyal mekanlar
- "Çalışmak için" → WiFi, sessiz ortam

### 5.3. Fiziksel Özellikler

✅ **Mekan Özelliklerini Anlama**
- Deniz, bahçe, WiFi, priz erişimi
- Fiziksel özellikler vektöre çevrilir ve aramada kullanılır

---

## 6. Teknik Detaylar

### 6.1. API Endpoint

**POST** `/api/v1/recommend`

**Request Örneği:**
```json
{
  "kullanici_metni": "Sakin bir kafe arıyorum, wifi olmalı",
  "enlem": 41.0082,
  "boylam": 28.9784,
  "kategori": "Kafe",
  "kullanici_id": 1
}
```

**Response Örneği:**
```json
{
  "sorgu_analizi": "Kullanıcı sakin bir ortamda wifi bağlantısı olan bir kafe arıyor.",
  "oneriler": [
    {
      "mekan_id": 123,
      "ad": "Sakin Kafe",
      "benzerlik_skoru": 0.92,
      "gerekce": "Sakin ortam ve güçlü wifi bağlantısı ile öne çıkıyor."
    }
  ]
}
```

### 6.2. Performans

- **Ortalama Yanıt Süresi**: 2-3 saniye
- **Benzerlik Skoru**: 0.4-0.9 arası
- **Başarı Oranı**: Test senaryolarında %90+ başarı

---

## 7. Test Sonuçları

Sistemin farklı senaryolarda test edilmesi:

✅ **5/5 test başarılı**
- Toplam 22 mekan bulundu
- Ortalama benzerlik skoru: 0.548
- En yüksek skor: 0.826 (Deniz manzaralı cafe)

**Test Senaryoları:**
1. ☕ Sultanahmet - "kahve icmek istiyorum" → Kahve Durağı (0.681)
2. 💻 Taksim - "sessiz calisma mekani" → Sakin Köşe Kafe (0.494)
3. 🍳 Kadıköy - "guzel kahvalti" → Meyhane Sofrası (0.468)
4. 🍽️ Nişantaşı - "sik restoran romantic" → Şato Restaurant (0.723)
5. 🌊 Beşiktaş - "deniz manzarali cafe" → Deniz Yıldızı Cafe (0.826)

---

## 8. Zorluklar ve Çözümler

### 8.1. Türkçe NLP

**Zorluk**: Türkçe için hazır modeller sınırlı

**Çözüm**: Multilingual embedding modeli kullanarak Türkçe desteği sağladık

### 8.2. Yerel LLM Kullanımı

**Zorluk**: OpenAI API maliyeti ve bağımlılık

**Çözüm**: Google Gemma 2 açık kaynak modelini yerel olarak çalıştırdık

### 8.3. Vektör Veritabanı

**Zorluk**: Qdrant API değişiklikleri

**Çözüm**: API güncellemelerini takip edip kodumuzu güncelledik

---

## 9. Gelecek Geliştirmeler

### 9.1. Model İyileştirmeleri

- Fine-tuning ile modeli Türkçe mekan önerilerine özelleştirme
- Daha büyük embedding modelleri (768 boyut)

### 9.2. Özellik Geliştirmeleri

- Kullanıcı geçmişi bazlı kişiselleştirme
- Çoklu kriter arama (fiyat, rating, mesafe)
- Gerçek zamanlı öneri güncellemeleri

### 9.3. Performans İyileştirmeleri

- Caching mekanizması
- Paralel işleme
- Model optimizasyonu

---

## 10. Sonuç

AI/LLM servisi, projemizin en önemli farklılaştırıcı özelliğidir. RAG mimarisi sayesinde:

✅ Doğal dil ile mekan araması yapılabiliyor
✅ Kişiselleştirilmiş öneriler üretiliyor
✅ Türkçe dil desteği sağlanıyor
✅ Açık kaynak teknolojiler kullanılıyor

**Teşekkürler!**

---

## Sorular ve Cevaplar

*Sunum sonrası sorular için hazır olun*
