# AsEmOs — Tanıtım Web Sitesi (Vite Landing Page)

İstanbul Yapay Zeka Destekli Mekan Öneri & Sosyal Platformu'nun (AsEmOs) web tabanlı tanıtım ve jüri sunum açılış (Landing) sayfasıdır. Vite, React 19, TypeScript, Framer Motion ve Three.js (React Three Fiber) kullanılarak premium standartlarda, dinamik ve akıcı animasyonlarla tasarlanmıştır.

---

## 🎨 Tasarım Felsefesi ve Görsel Estetik

*   **Zengin Estetik & Modern Web:** Arayüz, modern web tasarımının en son trendleri (karanlık mod odaklılık, neon degrade renk tonları, glassmorphism kart tasarımları ve akıcı mikro animasyonlar) ile oluşturulmuştur.
*   **3D Parçacık Arka Planı (`ParticleBackground.tsx`):** Kullanıcı etkileşimine ve fare (mouse) hareketlerine duyarlı, canvas üzerinde çalışan estetik 3D parçacık sistemi ile dinamik bir derinlik hissi yaratılmıştır.
*   **Akıcı Kaydırma Deneyimi:** Framer Motion tabanlı yumuşak geçiş efektleri ile sayfa aşağı kaydırıldıkça arayüz bileşenleri şık animasyonlarla belirir.

---

## 📂 Dizin Yapısı

```text
frontend/
├── public/                    # Statik dosyalar ve logolar
├── src/
│   ├── assets/                # Projede kullanılan görseller ve sunum ekran görüntüleri
│   ├── components/
│   │   └── ParticleBackground.tsx # 3D Canvas tabanlı interaktif parçacık arka planı
│   ├── App.tsx                # Tüm sayfa yapısı, Framer Motion animasyonları ve responsive arayüz kodları
│   ├── index.css              # Vanilla CSS tabanlı tasarım token'ları ve küresel CSS tanımları
│   └── main.tsx               # React 19 uygulama başlangıç noktası
├── index.html                 # Ana HTML5 şablonu (SEO meta etiketleri ve başlık ayarları yapılmış)
├── package.json               # Bağımlılıklar ve npm script'leri
├── vite.config.ts             # Vite konfigürasyonu
└── tsconfig.json              # TypeScript yapılandırması
```

---

## ✨ Sayfa İçeriği ve Bölümleri

1.  **Giriş (Hero Section):** Projenin sloganı, 3D etkileşimli arka plan ve mobil uygulamanın ekran görüntülerini içeren premium giriş alanı.
2.  **Özellikler (Features):** Yapay zeka ile semantik mekan arama, doğrulanmış konum bazlı yorum yapma, gerçek zamanlı sosyal akış/hikayeler ve anlık mesajlaşma gibi projenin temel yeteneklerinin şık kartlarla sunumu.
3.  **Proje Mimarisi:** FastAPI backend, AI-LLM servisi, Next.js admin paneli ve Expo mobil uygulamanın nasıl haberleştiğini gösteren şematik ve interaktif mimari şablonu.
4.  **Uygulama Ekran Görüntüleri:** Uygulamadan alınan canlı ekran görüntülerinin (harita, chat, yapay zeka arama) sergilendiği estetik galeri alanı.
5.  **Geliştirici & Jüri Bilgileri:** Bitirme projesinin künye ve geliştirici bilgileri alanı.

---

## ⚙️ Yerel Kurulum ve Çalıştırma

### 1. Bağımlılıkları Kurma
Web projesinin kök dizinine geçin ve gerekli npm paketlerini yükleyin:
```bash
cd frontend
npm install
```

### 2. Geliştirme Sunucusunu Başlatma
Tanıtım sitesini yerelinizde çalıştırmak için:
```bash
npm run dev
```
Uygulama tarayıcınızda otomatik olarak `http://localhost:5173/` portunda açılacaktır.

### 3. Production Derlemesi Alma
Eğer uygulamanın optimize edilmiş dağıtım paketini (bundle) oluşturmak isterseniz:
```bash
npm run build
```
Oluşan çıktılar `dist/` dizini altında yer alacaktır ve statik web barındırma servislerinde (Vercel, Netlify vb.) doğrudan yayınlanabilir.
