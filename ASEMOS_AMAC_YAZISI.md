# ASEMOS — YAPAY ZEKA DESTEKLİ MEKAN ÖNERİ VE SOSYAL PLATFORMU PROJESİ AMAÇ YAZISI

**Hazırlayanlar:** Yunus Emre Sevinç & Ulaş Can Demirtaş  
**Proje Adı:** AsEmOs (Aktivite ve Semantik Arama Tabanlı Mekan Öneri & Sosyal Platform)

---

### Giriş: Kent Yaşamı, Sosyalleşme ve Mekanik Arama Çıkmazı
Şehirler, yalnızca barınma alanları olmaktan öte, beşerî etkileşimin ve sosyal paylaşımın merkezî sahneleridir. Ancak metropollerdeki sosyalleşme ihtiyacı, günümüzde katı anahtar kelime eşleşmelerine ve ticari puanlama algoritmalarına hapsolmuştur. Bireylerin o an aradıkları "atmosfer moduna" (vibe) veya ruh hallerine göre bir mekan keşfetme arzusu, geleneksel arama motorlarının soğuk arayüzleri arasında kaybolmaktadır. Kentteki özgün mekanlar, kendilerini hissedecek doğru insanlarla buluşamadıkları için durağan nesnelere dönüşmekte, bu da kentsel keşif pratiklerini monotonlaştırmaktadır.

### Paylaşım ve Deneyim Odaklı Mekan Keşfi
Deneyim ekonomisi yaklaşımları doğrultusunda kentsel mekanlar, mülkiyet ya da salt ticari işlemler üzerinden değil; orada yaşanan deneyimler ve kurulan sosyal bağlar üzerinden değer kazanır. Bireyin bir mekanı keşfetmesi, kendi zihinsel durumu ile o mekanın yaydığı frekansı (vibe) eşleştirmesidir. Sorun, kentsel yaşamdaki bu doğal ve duygusal keşif arzusunun; semantik anlam çıkarma gücüne ve gerçek zamanlı sosyal etkileşime sahip dijital rehberlerden yoksun kalmasıdır. Geleneksel rehberler bireyi sadece bir "müşteri" olarak konumlandırırken, kentsel mekanları da soğuk koordinatlardan ibaret görmektedir.

### Mevcut Platformların Sınırları ve Semantik Çelişkiler
Mevcut arama ve harita platformları (Google Maps, Foursquare vb.) tamamen anahtar kelime eşleşmesi ve reklam bütçelerine göre sıralama sunarak semantik çelişkilere yol açmaktadır. Örneğin, açıklamasında sadece "canlı müzik performansı öncesi akşam yemeği servisi sunuyoruz" yazan yüksek sesli bir konser/eğlence mekanı, gündüz saatlerinde sessizce ders çalışmak veya kitap okumak için sakin çalışma alanı arayan bir kullanıcının karşısına ilk sıralarda çıkabilmektedir. Sorun mekan eksikliği değil; kullanıcının doğal dil sorgusundaki gerçek niyeti ile mekanların semantik ruhunu buluşturacak akıllı bir kentsel ekosistemin olmayışıdır.

### Bireysel Boyut: Kent Yalnızlığı ve Güvenli Sosyalleşme
Bireysel düzeyde bu sorunun somut yansıması, büyük şehirlerin kalabalığında yalnızlaşan ve kendi ilgi alanlarına uygun sosyal ortamlara erişemeyen modern kent insanıdır. Bireyler; yeni insanlar tanıma (takipleşme, konum ve ilgi alanı tabanlı eşleşme), dinamik anları paylaşma (post/hikaye gönderileri) ve özgün mekanlar keşfetme arzusuna sahip olsalar da, güvenlik endişeleri sebebiyle bunlardan uzak durmaktadır. Bu bariyeri aşmanın yolu; konum tabanlı harita, yapay zeka denetimli sosyal akış, semantik niyet analizi ve gerçek zamanlı güvenli mesajlaşma odalarıyla şeffaf ve güvenli bir dijital sosyal zemin sunmaktır.

### Toplumsal Katkı: Kentsel Keşfin Demokratikleşmesi
Toplumsal ölçekte ise kentsel hareketlilik popüler kültürün etkisiyle belirli merkezlerde yoğunlaşmakta; bu durum yerel, özgün ve kaliteli küçük işletmelerin görünmez kalmasına neden olmaktadır. Sürdürülebilirlik ve yerel ekonomiyi destekleme prensipleri doğrultusunda, bir kullanıcının kendi doğal diliyle yaptığı sorgu sayesinde arka sokaktaki gizli bir kütüphane-kafeyi keşfedebilmesi kentsel keşfi demokratikleştirir. Geliştirilen bu platformun, kentsel keşifteki fırsat eşitliğini artırıcı ve yerel esnafı destekleyici rolü, teknik bir yazılım olmaktan öte toplumsal bir dayanışma tercihidir.

### Teknik Gerçekleştirim ve Sistemin Amacı
Geliştirilen **AsEmOs** sisteminin amacı, doğal dil işleme ve semantik arama teorilerini gündelik insanın şehir hayatında işlevsel kılmaktır. Sistem bileşenleri bu amaca yönelik olarak tasarlanmıştır:
*   **Mobil İstemci & Harita (Expo SDK 54):** WebView tabanlı Leaflet JS entegrasyonuyla konumsal doğruluk ve zoom duyarlı etiketler sağlar.
*   **Akıllı Yapay Zeka Servisi (FastAPI & Qdrant):** Sentence Transformers tabanlı vektör araması, Groq niyet analizi ve sakin aramada yüksek sesli mekanları filtreleyen `-5.0` kategori cezası sunar.
*   **Konumsal Eşleşme & Sosyal Akış:** Kullanıcıların yakınlık ve ilgi alanlarına göre anlık eşleşmesi; fotoğraf/video gönderileri, 24 saatlik hikayeler ve takipleşme altyapısı.
*   **WebSocket Sohbet & optimistic Sync:** optimistic yerel mesaj yönetimi ve veritabanı ID eşleşmesi (`backendIdSet`) ile kesintisiz anlık mesajlaşma sağlar.

### Sonuç ve Ortak Vizyon
Şehirlerdeki yabancılaşma ve mekan keşfindeki ticari tekelleşme, yapay zekanın semantik ve sosyal doğasıyla aşılabilir. Bireyler, sadece popüler olanı değil; kendi ruhsal durumlarına en uygun olanı güvenle keşfedip paylaşabildiklerinde kentsel yaşamı içselleştirirler. Bu keşif ve sosyalleşme anını şeffaf, sürdürülebilir ve güvenli kılmak; kentsel keşfi demokratikleştirmeyi, sosyal dayanışmayı artırmayı ve bunu yaparken teknolojiyi ticari bir araç olmaktan çıkarıp toplumsal fayda üreten bir zemin haline getirmeyi hedefleyen projemizin nihai amacıdır.
