# AsEmOs — Yönetim Paneli (Next.js 15 Admin Dashboard)

İstanbul Yapay Zeka Destekli Mekan Öneri & Sosyal Platformu'nun (AsEmOs) web tabanlı yönetim ve denetim panelidir. Next.js 15, TailwindCSS, TypeScript ve Shadcn UI kütüphaneleri kullanılarak geliştirilmiş, modern ve premium bir arayüze sahiptir.

---

## 🚀 Teknolojik Mimari ve Altyapı

*   **Çatı (Framework):** Next.js 15 (App Router mimarisi).
*   **Programlama Dili:** TypeScript.
*   **Stil Kütüphanesi:** TailwindCSS & Shadcn UI (Aesthetic dark mode, modern grid yerleşimleri).
*   **Durum Yönetimi:** Zustand & React Context.
*   **Kimlik Doğrulama:** JWT tabanlı güvenli oturum yönetimi (Yalnızca `ADMIN` rolündeki kullanıcıların erişimine izin veren `middleware.ts` koruması).

---

## 📂 Dizin Yapısı

```text
admin/
├── app/
│   ├── (auth)/                # Yönetici giriş ekranı rotaları
│   ├── (dashboard)/           # Korunan Dashboard panelleri
│   │   ├── ai/                # Yapay Zeka ayarları ve log izleme paneli
│   │   ├── content/           # İçerik moderasyon (Post, Hikaye, Yorum) paneli
│   │   ├── system/            # Sistem istatistikleri ve servis sağlık izleme paneli
│   │   ├── users/             # Kullanıcı listeleme, arama ve rol güncelleme paneli
│   │   ├── venues/            # Mekan CRUD ve önbellek temizleme paneli
│   │   ├── layout.tsx         # Dashboard kenar menüsü (Sidebar) ve ortak tasarım şablonu
│   │   └── page.tsx           # Dashboard ana sayfası (Genel istatistik kartları ve grafikler)
│   ├── favicon.ico
│   ├── globals.css            # Tailwind stilleri ve özel cam morfolojisi (glassmorphic) tanımları
│   └── layout.tsx             # Global HTML yapısı ve Root Provider'lar
├── components/                # Yeniden kullanılabilir arayüz bileşenleri (Modals, Charts, Tables vb.)
├── lib/                       # API istemcisi, yardımcı fonksiyonlar ve utils
├── middleware.ts              # ADMIN rolü yetkilendirme katmanı (Auth guard)
├── store/                     # Zustand Admin global store'ları
└── tsconfig.json              # TypeScript yapılandırması
```

---

## ✨ Ana Modüller ve Yönetim Ekranları

### 1. Genel İnceleme (Ana Sayfa)
*   Toplam aktif kullanıcı, kayıtlı mekan, aktif hikaye ve sistem genelindeki etkileşim sayılarını gösteren dinamik istatistik kartları.
*   Sistem yük durumunu ve veritabanı aktif bağlantı sayılarını gösteren mini grafikler.

### 2. Mekan Yönetimi (`/venues`)
*   Sistemde yer alan mekanların CRUD (Ekleme, Düzenleme, Silme) operasyonlarının yürütüldüğü alan.
*   **Önbellek (Cache) Temizleme Kontrolü:** Sunucudaki mekan listesi cache'ini sıfırlayan tetikleme butonu.
*   Mekan konumlarının (Enlem/Boylam) harita üzerinde doğruluk kontrolleri.

### 3. Kullanıcı Yönetimi (`/users`)
*   Kullanıcı arama, e-posta filtreleme ve hesap durumlarını inceleme alanı.
*   Kullanıcı yetki yönetimi: Roller arası geçiş yapabilme (`USER`, `VENUE_OWNER`, `ADMIN`).
*   Topluluk kurallarını ihlal eden hesapları engelleme veya tamamen silme.

### 4. Yapay Zeka Yapılandırması (`/ai`)
*   Semantik arama benzerlik eşleşme eşikleri (Similarity Threshold) ve maksimum dönecek sonuç sayısı parametrelerinin anlık değiştirilmesi.
*   **Groq Prompt Editörü:** Öneri asistanının kullandığı sistem prompt'larının doğrudan panel üzerinden güncellenebilmesi.
*   Niyet sınıflandırma logları: Kullanıcıların yaptığı aramalar ve sistemin niyet sınıflandırma başarı metriklerinin takibi.

### 5. İçerik Denetimi & Moderasyon (`/content`)
*   Kullanıcılar tarafından şikayet edilen/raporlanan gönderilerin (Post) ve hikayelerin (Stories) incelenmesi.
*   Mekanlara yapılan yorumlar arasından geofence doğrulaması başarısız olan veya spam niteliğindeki yorumların moderasyonu ve silinmesi.

### 6. Sistem Durumu & Sağlık İzleme (`/system`)
*   FastAPI backend ve AI-LLM servislerinin `/health` uç noktalarının durum durumları.
*   Redis bellek tüketim oranları ve PostgreSQL veritabanı havuz sağlığı.
*   Sunucu loglarının (Logs) gerçek zamanlı terminal ekranı simülasyonuyla izlenmesi.

---

## ⚙️ Yerel Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleme
Admin panelinin kök dizinine geçip npm paketlerini kurun:
```bash
cd admin
npm install
```

### 2. Çevre Değişkenleri Yapılandırması
`admin/` dizini altında bir `.env.local` dosyası oluşturun:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Geliştirme Sunucusunu Başlatma
```bash
npm run dev
```
Yönetici paneli `http://localhost:3000` adresinde çalışmaya başlayacaktır.
Yönetici paneline giriş yapabilmek için sisteme kayıtlı ve veritabanında `role = 'ADMIN'` olarak tanımlanmış bir kullanıcı hesabı gerekmektedir.
