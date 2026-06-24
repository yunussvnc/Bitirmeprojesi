# 🎤 AsEmOs — Bitirme Projesi Sunum Konuşma Metni (AI & Backend Odaklı)

Bu konuşma metni, projenin **Yapay Zeka (AI/LLM/RAG)** ve **Backend Mühendisliği** kısımlarını sunacak ekip üyesinin anlatım diliyle hazırlanmıştır. Slayt slayt ne konuşacağınız, hangi teknik detayları vurgulayacağınız ve jüriye karşı kendinizi nasıl savunacağınız belirtilmiştir.

---

### 🎚️ SLAYT 1: Giriş ve Proje Başlığı
**Söylenecek Sözler:**
> "Saygıdeğer jüri üyeleri ve hocalarım, bugün sizlere bitirme projemiz olan **AsEmOs** platformunun **Backend Mimarisini ve Yapay Zeka/RAG Motoru** altyapısını sunacağım. AsEmOs; kullanıcıların konumuna, bütçesine, anlık niyetine ve en önemlisi aradığı atmosfer moduna (yani vibe'ına) göre kişiselleştirilmiş mekan ve yemek önerileri sunan, sosyal ağ dinamiklerine sahip bir Full-Stack ekosistemdir. Sunumum boyunca, bu sistemin arkasında çalışan asenkron API mimarisini, semantik arama algoritmalarımızı, veri tabanı kararlarımızı ve sunucu üzerinde yaptığımız bellek optimizasyonlarını sizlerle paylaşacağım."

---

### 🎚️ SLAYT 2: Problem Tanımı ve Mevcut Durum
**Söylenecek Sözler:**
> "Projemizi tasarlarken odaklandığımız en temel sektörel problem, geleneksel harita ve arama motorlarının **kelime tabanlı (keyword-matching) çalışmasıdır**. Örneğin, bir kullanıcı Google Maps'e 'ders çalışılacak sakin bir kafe' yazdığında, sistem sadece içerisinde 'ders', 'sakin' veya 'kafe' kelimelerinin geçtiği yerleri eşleştirmeye çalışır. Kullanıcının aradığı gerçek atmosfer modunu (vibe) yakalayamaz. 
> İkinci olarak, kullanıcılar yüzlerce mekan yorumu arasında boğulmakta ve özetlenmiş, güvenilir bilgiye ulaşmakta zorluk çekmektedir. 
> Son olarak, semantik çelişkiler ciddi bir anomali oluşturur. Örneğin; açıklamasında sadece 'hafta sonu kahvaltısı sunuyoruz' yazan bir 'gece kulübü veya meyhane', sabah kahvaltı arayan bir kullanıcının karşısına çıkabilmektedir. AsEmOs bu semantik problemleri çözmek üzere kurgulanmıştır."

---

### 🎚️ SLAYT 3: Projenin Amacı ve Hedefleri
**Söylenecek Sözler:**
> "Bu doğrultuda hedeflerimiz üç ana başlıkta toplanıyor:
> Birincisi; kullanıcının doğal dil sorgularından niyet ve vibe analizi yaparak kişiselleştirilmiş öneriler sunmak.
> İkincisi; mesafe, bütçe ve kullanıcı geçmiş etkileşimlerini harmanlayan **hibrit bir puanlama algoritması** kurmak.
> Üçüncüsü ise; kullanıcıların gönderi ve hikaye paylaşabildiği, ancak bu paylaşımların yapay zeka moderasyonuyla arka planda asenkron olarak denetlendiği güvenli bir sosyal ekosistem oluşturmaktır. Şimdi bu hedefleri gerçekleştirmek için kurduğumuz teknolojik mimariye göz atalım."

---

### 🎚️ SLAYT 4: Sistem Mimarisi (System Architecture)
**Söylenecek Sözler:**
> "Sistemimiz, servis odaklı asenkron bir mimariye sahiptir. 
> **İstemci katmanında:** Mobil tarafta React Native (Expo Router), web tarafında ise mekan sahipleri ve yöneticiler için Next.js 15 kullandık. Harita entegrasyonunu ise Leaflet JS ile WebView sarmalayarak maliyetsiz ve performanslı bir şekilde çözdük.
> **Backend katmanında:** Python tabanlı, asenkron yapısıyla yüksek eşzamanlı istekleri yönetebilen **FastAPI** framework'ünü tercih ettik. Veritabanı olarak ilişkisel tarafta PostgreSQL (SQLAlchemy ORM ile) kullanırken, semantik arama için **Qdrant Vektör Veritabanını** konumlandırdık.
> **AI Katmanında:** PyTorch tabanlı SentenceTransformers modeli ile embedding üretiyoruz. Akıllı yeniden sıralama (Reranking) ve niyet sınıflandırmada ise Groq Cloud üzerinden Llama 3.1 modelini çalıştırıyoruz. Önbelleklemede ise veri tutarlılığını korumak için Redis (Valkey) devrededir."

---

### 🎚️ SLAYT 5: Teknolojik Altyapı ve Veri Modeli
**Söylenecek Sözler:**
> "İlişkisel veritabanı şemamızda PostgreSQL üzerinde tanımlanmış modüler bir yapı var. 
> `users` tablomuz standart kullanıcı, mekan sahibi (venue) ve admin rollerini ayırır. 
> `places` tablomuz mekanların koordinatlarını, çalışma saatlerini ve kategorilerini tutarken, **Qdrant vektör tabanına referans veren `vector_id`** sütununu barındırır. Bu sütun, ilişkisel veri ile vektör verisi arasındaki kritik köprümüzdür.
> `posts` ve `stories` tablolarımızda moderasyon süreçlerini yönettiğimiz bir `status` (approved, pending, rejected) alanı bulunur. 
> Son olarak `PlaceInteraction` tablosu, kullanıcıların hangi mekanı kaydettiğini, beğendiğini veya yorum yaptığını tutarak yapay zekanın kişiselleştirme katmanına (RAG telemetrisine) veri sağlar."

---

### 🎚️ SLAYT 6: Vektör Arama Modeli (Semantic Search)
**Söylenecek Sözler:**
> "Semantik arama sürecimiz şu şekilde işliyor: Veritabanındaki mekan açıklamaları ve kullanıcı yorumları, PyTorch üzerinde çalışan **SentenceTransformers** modeliyle 384 boyutlu vektörlere dönüştürülüyor ve Qdrant'a indeksleniyor.
> Kullanıcı doğal dilde bir sorgu girdiğinde (örneğin: 'Kadıköy'de kitap okuyabileceğim huzurlu bir yer'), bu sorgu da anında vektörleştirilir ve Qdrant üzerinde **Kosinüs Benzerliği (Cosine Similarity)** araması tetiklenir.
> Ayrıca Groq LLM tabanlı bir niyet sınıflandırıcı (Intent Classifier) devrededir. Eğer kullanıcı mekan dışı alakasız veya genel sohbet amaçlı bir girdi girerse, yapay zeka bunu algılar ve sistemi yormadan kullanıcıya doğrudan asistan rehberliği sunar."

---

### 🎚️ SLAYT 7: Eşik Değeri (Threshold) Kararı ve Karşılaştırma Analizi
**Söylenecek Sözler:**
> "Vektör benzerlik aramasında en kritik parametrelerden biri benzerlik eşik değeridir (Threshold). En doğru eşik değerini bulmak için deneysel testler gerçekleştirdik.
> Slayttaki tabloda görebileceğiniz üzere:
> - Eşik değerini **0.30** yaptığımızda Recall (yakalama oranı) %96 ile çok yüksekti fakat Precision (duyarlılık) %64'e düşüyordu. Arama sonuçlarına alakasız mekanlar sızıyordu.
> - Eşik değerini **0.50** yaptığımızda Precision %98'e çıksa da Recall %46'ya çakılıyordu. Birçok uygun mekan eleniyordu.
> - Precision ve Recall metriklerinin harmonik ortalaması olan **F1-Skorunun en yüksek çıktığı (0.90) 0.40 değerini** optimum eşik değerimiz (sweet spot) olarak belirledik."

---

### 🎚️ SLAYT 8: Reranking Mimarisi ve LLM Entegrasyonu
**Söylenecek Sözler:**
> "LLM'lerin doğrudan veritabanı sorgulaması maliyetli ve yavaştır. Bu yüzden iki aşamalı bir arama yapısı kurduk:
> **Aşama 1 (Kaba Arama):** Qdrant ve PostgreSQL üzerinden en yüksek hibrit skora sahip ilk 15 aday mekan hızlıca çekilir (Retrieval).
> **Aşama 2 (Hassas Sıralama):** Bu 15 mekanın özellikleri, bütçeleri ve kullanıcı tercihleri Groq API üzerindeki `llama-3.1-8b-instant` modeline gönderilir. Model bunları saniyeler içinde analiz ederek en uygun 5-10 mekanı sıralar ve her biri için Türkçe gerekçeli açıklama metni hazırlar (Reranking).
> **Hata Toleransı (Fallback):** Groq API sınırına ulaşıldığında veya ağ hatası alındığında sistem kilitlenmez; otomatik olarak kural tabanlı ilk aşama skorlamasını (kaba arama sıralamasını) kullanıcıya sunar."

---

### 🎚️ SLAYT 9: Arama Anomali Giderme ve Kategori Cezalandırma
**Söylenecek Sözler:**
> "Doğal dil aramalarında en büyük anomalilerden biri **Meyhane Sofrası Anomalisi** adını verdiğimiz durumdur. Kullanıcı 'Kadıköy'de kahvaltı yapabileceğim yer' aradığında, açıklamasında sadece 'hafta sonu serpme kahvaltımız vardır' yazan bir meyhane, vektör benzerliği yüksek çıktığı için en üst sırada gelebiliyordu.
> Bu semantik kaymayı engellemek için kod seviyesinde **Kategori Cezalandırma Sistemi** geliştirdik.
> Algoritma, sorguda gündüz aktivitelerine ait anahtar kelimeleri (kahvaltı, kahve, kafe, ders çalışma vb.) algıladığı anda, kategorisi gece mekanı (bar, pub, meyhane, gece kulübü) olan adayların skoruna otomatik olarak **`-5.0` ceza puanı** uygular. Bu sayede sistemi yormadan, tamamen deterministik kurallarla semantik anomalileri %100 oranında engelledik."

---

### 🎚️ SLAYT 10: Yapay Zeka Destekli Asenkron Moderasyon
**Söylenecek Sözler:**
> "Kullanıcıların paylaştığı sosyal içeriklerin (gönderi ve hikaye) güvenliğini sağlamak için FastAPI'nin **Background Tasks (Arka Plan İşleri)** yapısını kullandık.
> Kullanıcı post veya story paylaştığında istek saniyeler içinde tamamlanır ve kullanıcı bekletilmez. Arka planda çalışan moderasyon görevi, metin içeriğini asenkron olarak Groq LLM (Llama 3.1) modeline gönderir. Metin argo, şiddet, nefret söylemi veya yasadışı madde özendirme açısından taranır. Uygunsuz bulunan içeriklerin durumu veritabanında anında `rejected` yapılarak yayından kaldırılır ve Redis akış önbelleğinden silinir."

---

### 🎚️ SLAYT 11: Önbellek Yönetimi ve Cache Invalidation
**Söylenecek Sözler:**
> "Sistem performansını ve ölçeklenebilirliğini artırmak için **Redis önbellek katmanını** konumlandırdık.
> Burada iki tür önbellekleme yapıyoruz:
> 1. **Embedding Cache:** Aynı arama sorgularının tekrar tekrar yapay zeka modeline girip CPU tüketmesini engellemek için metin vektörlerini 30 gün boyunca Redis'te önbellekliyoruz.
> 2. **Feed Cache:** Kullanıcıların ana akışlarını (feed) Redis'te tutarak PostgreSQL veritabanı yükünü azaltıyoruz.
> **Veri Tutarlılığı (Cache Invalidation):** Sisteme yeni bir post eklendiğinde veya moderasyon servisi bir gönderiyi engellediğinde, ilgili Redis önbellek anahtarları anında geçersiz kılınarak silinir. Böylece veri tabanı ile önbellek anlık olarak tutarlı kalır."

---

### 🎚️ SLAYT 12: Güvenlik Mimarisi - Kimlik Doğrulama
**Söylenecek Sözler:**
> "Kimlik doğrulama katmanında endüstri standardı olan **JWT (JSON Web Token) HS256** imzalama algoritmasını kullandık.
> Klasik JWT yapılarında, süresi dolmamış bir token çalındığında oturumu sunucu tarafından kapatmak zordur. Bu güvenlik açığını kapatmak için **`token_version`** mekanizmasını entegre ettik.
> Kullanıcı tablosunda bir tam sayı tutulur. Kullanıcı şifresini değiştirdiğinde veya 'tüm oturumları kapat' dediğinde bu sürüm numarası artırılır. API'ye gelen isteklerdeki token sürümü ile veritabanındaki sürüm uyuşmadığında token anında geçersiz sayılır. Bu doğrulama işlemi veritabanına yük bindirmemek için doğrudan Redis bellek katmanında doğrulanır."

---

### 🎚️ SLAYT 13: Güvenlik Mimarisi - API ve Girdi Doğrulama
**Söylenecek Sözler:**
> "API güvenliğimizi katı kurallarla koruyoruz. 
> İlk olarak, FastAPI'nin **Pydantic şemalarını** kullanarak API'ye gelen tüm girdilerin veri tiplerini, sınırlarını ve formatlarını doğruluyoruz. Hatalı istekler daha kod katmanına ulaşmadan HTTP 422 hatasıyla elenir.
> İkinci olarak, SQL Injection saldırılarını engellemek adına ham SQL yazımından tamamen kaçındık. Tüm sorgularımızı **SQLAlchemy ORM parametrik sorguları** ile yürütüyoruz.
> Üçüncü olarak, arama sorgularına yönelik yapılabilecek prompt injection veya manipülasyon girişimlerini özel regex filtreleriyle API katmanında blokluyoruz."

---

### 🎚️ SLAYT 14: Bellek Optimizasyonları ve OOM Çözümleri
**Söylenecek Sözler:**
> "Dağıtım (deployment) aşamasında, kısıtlı kaynaklara sahip bulut sunucumuzda (Render) PyTorch modellerinin yüklenirken 2 GB+ RAM tüketerek Out-of-Memory (OOM) hatası vermesi ve sunucuyu çökertmesi sorunuyla karşılaştık.
> Bu sorunu aşmak için üç kritik optimizasyon yaptık:
> 1. **Model Singleton Yapısı:** SentenceTransformers modelinin belleğe sadece bir kez yüklenmesini sağlayan Singleton tasarım deseni uyguladık.
> 2. **Thread Sınırlandırması:** PyTorch'un varsayılan olarak tüm CPU çekirdekleri için thread açmasını engelleyerek CPU iş parçacığı sınırını `torch.set_num_threads(1)` ile 1'e sabitledik.
> 3. **Worker Optimizasyonu:** Uvicorn worker sayısını 1'e düşürdük.
> Bu adımlar sayesinde sunucu RAM tüketimini **2 GB'dan 500 MB seviyesine indirerek** kararlı ve çökmesiz çalışmayı sağladık."

---

### 🎚️ SLAYT 15: Mobil Uygulama Tasarımı ve Harita Entegrasyonu
**Söylenecek Sözler:**
> "Mobil uygulamamızda harita entegrasyonu için native SDK'ler yerine WebView sarmalaması ile **Leaflet JS ve OpenStreetMap** kullandık. Bu tercih hem harita lisans maliyetlerini sıfırladı hem de her iki platformda (iOS/Android) tutarlı bir görünüm sundu.
> Haritada dark mode uyumluluğunu CartoDB'nin `dark_all` tile'ı ile çözerek sokak etiketlerinin karanlıkta okunabilir olmasını sağladık. 
> Pin kayması sorununu ise divIcon sınıflarını boşaltıp child div olarak `.custom-marker-inner` yerleşimi yaparak çözdük.
> Son olarak, çok sayıda pin olduğunda etiketlerin üst üste binmesini engellemek için **zoom duyarlı etiket gösterme** mantığı kurduk; etiketler sadece zoom seviyesi 14 ve üzerinde aktif olmaktadır."

---

### 🎚️ SLAYT 16: Test ve Sistem Değerlendirme Sonuçları
**Söylenecek Sözler:**
> "Sistemimizi rastgele değil, gerçek kullanıcı senaryolarından derlenen 100 farklı arama sorgusuyla test ettik ve slayttaki metrikleri elde ettik.
> - **Niyet Sınıflandırma Doğruluğumuz (Intent Accuracy):** %98.0
> - **Öneri Hassasiyetimiz (Precision@3):** %92.0 (yani önerdiğimiz ilk 3 mekandan en az biri kullanıcı isteğiyle tam örtüşmektedir)
> - **Duyarlılığımız (Recall@10):** %88.0
> - **Yerel Arama Süremiz:** Ortalama 140 ms (Redis cache devredeyken bu süre 20 ms'ye kadar inmektedir)
> - **Groq LLM Reranking Süremiz:** Groq API ağ gecikmesi dahil ortalama 1.25 saniyedir ve kullanıcı deneyimi açısından oldukça kabul edilebilir bir süredir."

---

### 🎚️ SLAYT 17: Sonuç, Katkılar ve Gelecek Çalışmalar
**Söylenecek Sözler:**
> "Sonuç olarak; semantik arama, yapay zeka sıralaması, asenkron moderasyon ve önbellek tutarlılığına sahip, ölçeklenebilir ve güvenli bir Full-Stack altyapı başarıyla hayata geçirilmiştir.
> Gelecek çalışmalarımızda:
> - Embedding modelini kullanıcıların yorum ve puanlama geçmişine göre daha da özelleştirmek için **Fine-tuning** yapmayı,
> - Harita üzerinde rota çizimleri ve arkadaş grupları için ortak buluşma noktası öneren algoritmalar entegre etmeyi planlıyoruz.
> Dinlediğiniz için teşekkür ederiz. Projemizin backend ve yapay zeka altyapısına dair sorularınızı yanıtlamaktan memnuniyet duyarım."
