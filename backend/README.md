# AsEmOs — Backend API Servisi

İstanbul Yapay Zeka Destekli Mekan Öneri & Sosyal Platformu'nun (AsEmOs) merkezî backend API servisidir. FastAPI kullanılarak modüler, yüksek performanslı, asenkron ve ölçeklenebilir standartlara uygun şekilde geliştirilmiştir.

---

## 🚀 Teknolojik Mimari ve Altyapı

*   **Çatı (Framework):** Python 3.11 & FastAPI (Asenkron istek işleme ve yüksek performans).
*   **İlişkisel Veritabanı:** PostgreSQL (Production ortamı) & SQLite (Yerel geliştirme ve test suite fallback).
*   **Veritabanı ORM & Göçler:** SQLAlchemy (2.0 tarzı modern asenkron sorgular) ve Alembic (Veritabanı şema göç yönetimi).
*   **Önbellek & Pub/Sub:** Redis (API caching, rate limiting ve WebSocket mesaj dağıtımı).
*   **Kimlik Doğrulama:** JWT (JSON Web Tokens) & Google OAuth 2.0 (Mobil standalone APK yönlendirmelerine uyumlu sosyal giriş).
*   **Medya Yönetimi:** Cloudinary CDN entegrasyonu & yerel disk depolama fallback'i.
*   **Hata İzleme & Loglama:** Yapılandırılmış istek/hata loglama middleware'leri ve özel log çıktıları.
*   **Görsel Önizleme:** Blurhash kodlama (mobil tarafta resim yüklenene kadar anında bulanık önizleme sunmak için sunucuda üretilir).

---

## 📂 Dizin Yapısı

```text
backend/
├── app/
│   ├── core/                 # Redis istemcisi, JWT güvenlik ayarları, genel yapılandırma (config.py)
│   ├── middleware/           # Hata yakalama, rate limiting ve detaylı istek günlüğü (request logging)
│   ├── repositories/         # Veritabanı veri erişim soyutlamaları
│   ├── routers/              # Modüler API uç noktaları (13 adet bağımsız router)
│   ├── services/             # Push bildirimleri, asenkron arka plan işleri (scheduler, moderation)
│   └── websocket/            # WebSocket bağlantı yöneticisi ve Redis Pub/Sub dağıtım katmanı
├── db_revision_history/      # Alembic migrasyon dosyaları ve veritabanı şema geçmişi
├── tests/                    # Entegrasyon, birim ve stres test suite'i
├── config.py                 # Pydantic tabanlı çevre değişkenleri yönetimi
├── crud.py                   # SQLAlchemy ORM sorguları ve gelişmiş filtreleme/arama mantığı
├── database.py               # SQL bağlantı motoru ve oturum (session) yapılandırması
├── llm_client.py             # Groq/OpenAI bulut API'leri ve yerel model entegrasyon adaptörü
├── llm_recommend.py          # Kategori cezaları, Groq niyet kontrolü ve konum ağırlıklı AI öneri motoru
├── main.py                   # FastAPI uygulaması başlangıç noktası (lifespan olayları)
├── models.py                 # SQLAlchemy ORM modelleri (User, Place, Review, Story, Message, vb.)
├── schemas.py                # Veri doğrulama ve serialization için Pydantic şemaları
└── requirements.txt          # Python bağımlılık listesi
```

---

## 🛠️ Temel Sistem Bileşenleri & Gelişmiş Özellikler

### 1. Kategori Cezalandırma Sistemi (Semantik Doğruluk)
Semantik arama modellerindeki en büyük problemlerden biri olan kavramsal sapmalar (örn: "ders çalışmak" veya "kitap okumak" aratıldığında, açıklamasında bu kelimeler geçen gürültülü bir konser/etkinlik salonunun veya yüksek sesli eğlence merkezinin üst sıralarda listelenmesi anomalisi) akıllı bir ceza mekanizması ile çözülmüştür:
*   Kullanıcı sorgusunda sakin çalışma veya gündüz aktivitesi belirten anahtar kelimeler (`kahvalti`, `kahve`, `kafe`, `tatli`, `calismak` vb.) tespit edilirse;
*   Önerilen mekanın kategorisi yüksek sesli eğlence veya hareketli etkinlik sınıfına giriyorsa;
*   İlgili mekanın semantik eşleşme skoruna **`-5.0` ceza puanı** uygulanır. Bu sayede sakin aramalarda alakasız gürültülü mekanların zirveye yerleşmesi engellenmiş olur.

### 2. Groq Llama 3.1 Niyet Sınıflandırıcı & Sohbet (Chit-chat) Bypass
Uygulamadaki yapay zeka arama çubuğunun sadece mekan aramalarında değil, genel sohbet sorgularında da doğru tepki vermesi sağlanmıştır:
*   **Akıllı Yönlendirme:** Kullanıcı sorgusu alındığında, Groq (`openai/gpt-oss-20b`) modeli kullanılarak sorgunun bir mekan/yemek arayışı mı yoksa genel sohbet/soru (chit-chat) mu olduğu sınıflandırılır.
*   **Sohbet Fallback'i:** Sorgu mekan dışı bir sohbet ise (`is_venue_related = false`), boş mekan listesi döndürmek yerine kullanıcıya samimi bir rehberlik mesajı (örneğin: *"Merhaba! Ben senin yapay zeka asistanınım. Beşiktaş'ta deniz manzaralı sakin bir kafe önerisi gibi mekan aramalarında yardımcı olabilirim..."*) sunulur.
*   **Hızlı Fallback:** Groq API'sinde bir gecikme veya hata yaşanırsa, sistem otomatik olarak yerel Regex/kelime eşleme fallback kontrolüne geçerek kesintisiz yanıt garantisi sunar.

### 3. Redis Caching & Cache Invalidation (Mekan Keşfi)
Keşfet ve mekan listeleme uç noktaları (`/places/`), sayfalama (pagination) ve filtre parametrelerini içeren benzersiz anahtarlar ile Redis üzerinde cache'lenir (15 dakika TTL).
*   Mekan verileri doğrudan Redis'ten dönerek yanıt sürelerini milisaniyeler seviyesine indirir.
*   Yönetici veya işletme sahibi yeni bir mekan eklediğinde (`POST /places/`), `BackgroundTasks` asenkron iş mantığı devreye girerek `invalidate_places_cache()` fonksiyonunu çalıştırır ve `cache:places:*` altındaki tüm cache anahtarlarını silerek anında veri tutarlılığı sağlar.

### 4. WebSocket Sohbet & Polling Mesaj Senkronizasyonu
Kullanıcıların anlık mesajlaşmalarında (DM) hiçbir mesajın kaybolmaması veya mükerrer görünmemesi için hibrit bir senkronizasyon altyapısı kurulmuştur:
*   Kullanıcı bir mesaj gönderdiğinde istemcide optimistic (geçici) bir yerel ID oluşturulur.
*   Mesaj sunucuya ulaşıp veritabanına yazıldığında, üretilen kalıcı veritabanı ID'si (`id`) ve istemcinin geçici ID'si (`temporaryId`) WebSocket veya Polling HTTP yanıtı ile istemciye bildirilir.
*   İstemci tarafında `backendIdSet` mekanizması kullanılarak geçici ID, gerçek sunucu ID'siyle güncellenir. Bu sayede mesajın mükerrer render edilmesi veya senkron dışı kalması engellenir.
*   Çoklu sunucu mimarisinde WebSocket mesajlarının doğru kullanıcılara dağıtılması için Redis Pub/Sub mekanizması entegre edilmiştir.

### 5. PostGIS Geofence Fallback (Doğrulanmış Yorumlar)
Bir mekana yorum yapabilmek için kullanıcının o mekana fiziksel olarak gitmiş olması istenir.
*   **PostGIS Desteği:** PostgreSQL üzerinde PostGIS uzantısı aktifse `ST_DWithin` ve `ST_MakePoint` uzantıları ile 100 metrelik bir coğrafi sınır (geofencing) sorgulanır.
*   **Matematiksel Fallback:** SQLite veya PostGIS barındırmayan hafif veritabanı kurulumlarında, SQLAlchemy ORM katmanında Haversine mesafe formülü (`sin`, `cos`, `acos`) kullanılarak 100 metrelik sınır kontrolü matematiksel olarak simüle edilir ve sistemin kesintisiz çalışması korunur.

### 6. Hikayeler (Stories) ve Asenkron Arka Plan Görevleri
*   24 saatlik süre limiti bulunan görsel/video hikaye paylaşımları desteklenir.
*   FastAPI lifespan olayları (`startup`) ile başlatılan asenkron bir `background_scheduler` görevi, her saat başı arka planda sessizce çalışarak süresi dolmuş hikayeleri veritabanından ve diskten temizler.

---

## 📍 Modüler API Router'ları (`app/routers/`)

Sistem, sorumlulukların ayrılması prensibine uygun olarak 13 modüler router ile yönetilmektedir:

| Router | Dosya | Sorumluluk |
|---|---|---|
| **Kimlik Doğrulama** | `auth.py` | Standart kayıt, JWT giriş, Google OAuth 2.0 sosyal giriş ve şifre yenileme işlemleri. |
| **Kullanıcı İşlemleri**| `users.py` | Profil güncelleme, kullanıcı ayarları ve toplu profil (batch) sorguları. |
| **Mekan Yönetimi** | `places.py` | Mekan CRUD, ilçe/kategori filtreleri ve Redis cache entegrasyonu. |
| **Yorum & Puan** | `reviews.py` | Mekan yorumları, konumsal doğrulama (Geofence) ve puanlama mekanizması. |
| **Sosyal Akış** | `feed.py` | Kullanıcı postları, beğeniler, yorumlar ve cursor tabanlı akış sayfalama. |
| **Hikayeler** | `stories.py` | 24 saatlik hikaye yükleme, listeleme ve görüntüleme. |
| **Bildirimler** | `notifications.py`| Push bildirimleri, kampanya/etkinlik bildirimleri ve bildirim geçmişi. |
| **Eşleşme Motoru** | `match.py` | Konum ve ortak ilgi alanlarına göre gerçek zamanlı kullanıcı eşleşme sistemi. |
| **Medya Yükleme** | `upload.py` | Cloudinary CDN entegrasyonu ve sunucu taraflı Blurhash üretimi. |
| **AI Önerileri** | `recommend.py` | `llm_recommend` katmanıyla kişiselleştirilmiş, akıllı semantik mekan önerileri. |
| **Mesajlaşma** | `messages.py` | Birebir sohbet odaları, WebSocket yönetimi ve mesaj geçmişi. |
| **Kaydedilenler** | `saved.py` | Kullanıcıların favori/kaydedilmiş mekan listelerinin yönetimi. |
| **Topluluk Kontrolü**| `community.py` | Takip etme, engelleme, kısıtlama, raporlama ve içerik moderasyon altyapısı. |

---

## ⚙️ Yerel Kurulum ve Çalıştırma

### 1. Çevre Değişkenleri Yapılandırması
`backend/` dizini altında bir `.env` dosyası oluşturun ve aşağıdaki değişkenleri tanımlayın:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/asemos
# Geliştirme/Test için SQLite fallback: sqlite:///./sqlite.db

REDIS_URL=redis://localhost:6379/0
REDIS_TTL_SECONDS=900

JWT_SECRET_KEY=kendi_guvenli_hex_anahtariniz
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=115200

CLOUDINARY_CLOUD_NAME=cloudinary_hesap_adiniz
CLOUDINARY_API_KEY=cloudinary_api_anahtariniz
CLOUDINARY_API_SECRET=cloudinary_api_sirriniz

GROQ_API_KEY=gsk_...
LLM_PROVIDER=groq
LLM_ENABLED=true

PLACES_SYNC_ON_STARTUP=false
```

### 2. Bağımlılıkların Yüklenmesi & Göçler
```bash
# Sanal ortam oluşturma ve aktif etme
python -m venv .venv
source .venv/bin/activate # Windows için: .venv\Scripts\activate

# Bağımlılıkları yükleme
pip install -r requirements.txt

# Veritabanını güncel şemaya eşleme
alembic upgrade head
```

### 3. API Servisini Çalıştırma
```bash
uvicorn main:app --reload --port 8000
```
API servisiniz `http://localhost:8000` adresinde çalışmaya başlayacaktır.

*   **Swagger UI (Etkileşimli API Testi):** `http://localhost:8000/docs`
*   **ReDoc (Detaylı API Şeması):** `http://localhost:8000/redoc`

### 4. Testleri Çalıştırma
Yazılmış olan entegrasyon ve birim testlerini koşturmak için pytest kullanabilirsiniz:
```bash
pytest
```
