# Proje Akış Diyagramları

Bu doküman, Yapay Zeka Destekli Konum Bazlı Kişiselleştirilmiş Mekan Öneri Platformu'nun tüm akış diyagramlarını içermektedir.

---

## 1. Genel Sistem Akışı

```mermaid
graph TB
    Start([Kullanıcı Uygulamayı Açar]) --> Login{Kullanıcı Giriş Yaptı mı?}
    Login -->|Hayır| Register[Kayıt Ol]
    Login -->|Evet| MainScreen[Ana Ekran]
    Register --> MainScreen
    MainScreen --> Search[Mekan Ara]
    MainScreen --> Explore[Keşfet]
    MainScreen --> Saved[Kaydedilenler]
    Search --> Query[Doğal Dil Sorgusu Girişi]
    Query --> BackendAPI[Backend API]
    BackendAPI --> AIService[AI/LLM Service]
    AIService --> Results[Öneriler Listesi]
    Results --> Detail[Mekan Detayı]
    Detail --> Review[Yorum Yap]
    Detail --> Like[Beğen]
    Detail --> QRScan[QR Kod Okut]
    QRScan --> Verify[Yorum Doğrula]
    Review --> Verify
    Verify --> SaveReview[Yorumu Kaydet]
```

---

## 2. RAG Pipeline Akışı

```mermaid
sequenceDiagram
    participant User as Kullanıcı
    participant Mobile as Mobil Uygulama
    participant Backend as Backend API
    participant AI as AI/LLM Service
    participant Embedding as Embedding Model
    participant Qdrant as Qdrant DB
    participant LLM as Gemma 2 LLM

    User->>Mobile: "Sessiz bir kafe arıyorum"
    Mobile->>Backend: POST /recommend
    Backend->>AI: Öneri İsteği
    AI->>Embedding: Sorguyu vektöre çevir
    Embedding-->>AI: Query Vector
    AI->>Qdrant: Semantik Arama (Query Vector)
    Qdrant-->>AI: İlgili Mekanlar (Top-K)
    AI->>LLM: Context + Prompt
    LLM-->>AI: Kişiselleştirilmiş Öneri Metni
    AI-->>Backend: Öneriler + Açıklama
    Backend-->>Mobile: JSON Response
    Mobile-->>User: Önerileri Göster
```

---

## 3. Kullanıcı Kayıt ve Giriş Akışı

```mermaid
flowchart TD
    Start([Kullanıcı Kayıt/Giriş Ekranı]) --> Choice{İşlem Seç}
    Choice -->|Kayıt| RegisterForm[Kayıt Formu]
    Choice -->|Giriş| LoginForm[Giriş Formu]
    
    RegisterForm --> RegisterAPI[POST /auth/register]
    RegisterAPI --> HashPassword[Şifreyi Hashle Bcrypt]
    HashPassword --> SaveUser[Kullanıcıyı DB'ye Kaydet]
    SaveUser --> Success1[Kayıt Başarılı]
    Success1 --> MainApp[Ana Uygulamaya Git]
    
    LoginForm --> LoginAPI[POST /auth/login]
    LoginAPI --> VerifyPassword[Şifreyi Doğrula]
    VerifyPassword -->|Hatalı| Error1[Hata Mesajı]
    VerifyPassword -->|Doğru| GenerateJWT[JWT Token Oluştur]
    GenerateJWT --> Success2[Giriş Başarılı]
    Success2 --> MainApp
    Error1 --> LoginForm
```

---

## 4. QR Kod Doğrulama Akışı

```mermaid
sequenceDiagram
    participant User as Kullanıcı
    participant Mobile as Mobil Uygulama
    participant Camera as Kamera
    participant Backend as Backend API
    participant DB as Veritabanı

    User->>Mobile: QR Kod Okut Butonuna Bas
    Mobile->>Camera: Kamera Aç
    Camera->>Mobile: QR Kod Okundu
    Mobile->>Backend: POST /qr/verify
    Note over Mobile,Backend: QR Data: {place_id, timestamp, signature}
    Backend->>Backend: QR Kodu Doğrula
    Backend->>DB: Kullanıcı Mekana Gitti mi Kontrol Et
    alt İlk Ziyaret
        DB-->>Backend: Yeni Ziyaret
        Backend->>DB: Ziyaret Kaydı Oluştur
        Backend->>DB: Öğrenci İndirimi Uygula
        Backend-->>Mobile: Doğrulama Başarılı + İndirim
    else Tekrar Ziyaret
        DB-->>Backend: Daha Önce Ziyaret Edilmiş
        Backend-->>Mobile: Zaten Doğrulanmış
    end
    Mobile-->>User: Sonucu Göster
```

---

## 5. Yorum ve Beğeni Sistemi Akışı

```mermaid
flowchart LR
    A[Mekan Detay Sayfası] --> B{Yorum Yap}
    A --> C{Beğen}
    
    B --> D[Yorum Formu]
    D --> E{QR Kod Doğrulandı mı?}
    E -->|Evet| F[Doğrulanmış Yorum]
    E -->|Hayır| G[Doğrulanmamış Yorum]
    F --> H[POST /reviews/ is_verified=true]
    G --> I[POST /reviews/ is_verified=false]
    H --> J[Yorum Kaydedildi]
    I --> J
    
    C --> K[Beğeni Butonu]
    K --> L{Beğenildi mi?}
    L -->|Evet| M[POST /places/{id}/like]
    L -->|Hayır| N[DELETE /places/{id}/like]
    M --> O[Beğeni Sayısı Artır]
    N --> P[Beğeni Sayısı Azalt]
    O --> Q[Güncelle]
    P --> Q
```

---

## 6. Google Maps Entegrasyonu Akışı

```mermaid
graph TD
    Start([Harita Görünümü]) --> GetLocation[Kullanıcı Konumunu Al]
    GetLocation --> LoadMap[Google Maps Yükle]
    LoadMap --> FetchPlaces[Yakın Mekanları Getir]
    FetchPlaces --> BackendAPI[GET /places/nearby]
    BackendAPI --> Filter[Konum Bazlı Filtreleme]
    Filter --> Markers[Haritada İşaretle]
    Markers --> UserClick{Kullanıcı Marker'a Tıkladı}
    UserClick --> ShowInfo[Mekan Bilgilerini Göster]
    ShowInfo --> ShowReviews[Kullanıcı Yorumlarını Göster]
    ShowReviews --> Navigate[Navigasyon Başlat]
    ShowReviews --> Detail[Mekan Detayına Git]
```

---

## 7. Trendyol Öne Çıkarma Sistemi Akışı

```mermaid
sequenceDiagram
    participant Business as İşletme
    participant Admin as Admin Panel
    participant Backend as Backend API
    participant AI as AI/LLM Service
    participant User as Kullanıcı

    Business->>Admin: Premium Üyelik Satın Al
    Admin->>Backend: POST /business/premium
    Backend->>Backend: Place.is_featured = true
    Backend->>Backend: Premium Özellikleri Aktif Et
    
    User->>Backend: Mekan Ara
    Backend->>AI: Öneri İsteği
    AI->>AI: Featured Mekanları Önceliklendir
    AI-->>Backend: Öneriler (Featured önce)
    Backend-->>User: Öne Çıkan Mekanlar İlk Sırada
```

---

## 8. Öğrenci İndirim Sistemi Akışı

```mermaid
flowchart TD
    A[Kullanıcı Profili] --> B{Öğrenci mi?}
    B -->|Evet| C[User.role = 'student']
    B -->|Hayır| D[Normal Kullanıcı]
    
    C --> E[QR Kod Okut]
    E --> F{İlk Ziyaret mi?}
    F -->|Evet| G[İndirim Uygula]
    F -->|Hayır| H[Standart Fiyat]
    
    G --> I{İndirim Tipi}
    I -->|Bedava| J[%100 İndirim]
    I -->|İndirim| K[%20-50 İndirim]
    
    J --> L[Fiyat = 0 TL]
    K --> M[İndirimli Fiyat Hesapla]
    L --> N[Ödeme Ekranı]
    M --> N
    H --> N
    D --> N
```

---

## 9. Veri Akış Diyagramı

```mermaid
graph TB
    subgraph "Veri Kaynakları"
        A1[Mekan Verileri]
        A2[Kullanıcı Yorumları]
        A3[Kullanıcı Profilleri]
    end
    
    subgraph "Backend API"
        B1[SQLite/PostgreSQL]
        B2[CRUD İşlemleri]
    end
    
    subgraph "AI/LLM Service"
        C1[Embedding Model]
        C2[Qdrant Vector DB]
        C3[Gemma 2 LLM]
    end
    
    subgraph "Mobil Uygulama"
        D1[AsyncStorage Cache]
        D2[UI Components]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B2 --> C1
    C1 --> C2
    C2 --> C3
    C3 --> D1
    D1 --> D2
    B2 --> D1
```

---

## 10. Öneri Algoritması Detaylı Akışı

```mermaid
flowchart TD
    Start([Kullanıcı Sorgusu]) --> Preprocess[Metni Ön İşle]
    Preprocess --> Embed[Embedding Oluştur]
    Embed --> VectorSearch[Qdrant'ta Vektör Araması]
    VectorSearch --> Filter1{Konum Filtresi Var mı?}
    Filter1 -->|Evet| LocationFilter[Konum Bazlı Filtreleme]
    Filter1 -->|Hayır| Score[Benzerlik Skoru Hesapla]
    LocationFilter --> Score
    Score --> Filter2{Kategori Filtresi Var mı?}
    Filter2 -->|Evet| CategoryFilter[Kategori Filtreleme]
    Filter2 -->|Hayır| Rank[Sıralama]
    CategoryFilter --> Rank
    Rank --> Featured{Öne Çıkan Mekan Var mı?}
    Featured -->|Evet| Boost[Öne Çıkanları Önceliklendir]
    Featured -->|Hayır| TopK[Top-K Mekanları Seç]
    Boost --> TopK
    TopK --> Context[Context Oluştur]
    Context --> LLM[LLM'e Gönder]
    LLM --> Generate[Öneri Metni Üret]
    Generate --> Response[Kullanıcıya Döndür]
```

---

## 11. Pazar Araştırması - Rekabet Analizi

```mermaid
graph LR
    A[Bizim Platform] --> B[Özellikler]
    B --> C[RAG ile AI Önerileri]
    B --> D[QR Kod Doğrulama]
    B --> E[Öğrenci İndirimleri]
    
    F[Trendyol] --> G[Öne Çıkarma]
    F --> H[Premium Özellikler]
    
    I[Yemeksepeti] --> J[Sipariş Sistemi]
    I --> K[Restoran Yorumları]
    
    L[Google Maps] --> M[Yakın Konum]
    L --> N[Kullanıcı Yorumları]
    L --> O[Harita Görünümü]
    
    A -.->|Öğreniyor| F
    A -.->|Öğreniyor| I
    A -.->|Öğreniyor| L
```

---

## Notlar

- Tüm diyagramlar Mermaid formatındadır ve GitHub, GitLab veya Mermaid destekleyen platformlarda otomatik render edilir.
- Diyagramlar proje geliştikçe güncellenecektir.
- Detaylı teknik dokümantasyon için ilgili kod dosyalarına bakınız.
