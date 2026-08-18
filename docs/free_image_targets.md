# Ücretsiz görsel toplama hedefleri

Canlı veri kümesinde toplam **4.735 mekan** bulunuyor. Ücretsiz ve doğrulanabilir kaynaklardan görsel aranacak hedefler aşağıdaki şekilde sınıflandırıldı.

| Hedef grubu | Kayıt sayısı | Uygulanacak yöntem |
|---|---:|---|
| `photo_url` boş | 1 | Mekan adı ve adresiyle kamuya açık kurum/işletme sayfası veya doğrulanmış sosyal medya görseli |
| `google_photo_ref:` | 3.540 | Önce işletmenin resmi sitesi, sonra kamuya açık Google Maps sayfası; yalnızca ad–adres eşleşmesi kesin olan görseller |
| HTTPS URL’si başarısız | 1.152 | 1.134 adet HTTP 403, 8 adet HTTP 404 ve 10 adet biçim/yanıt anomalisi; URL yenileme veya yeni kamuya açık kaynak |
| HTTPS URL’si çalışan | 42 | Şimdilik korunacak |

Aynı kaydın birden fazla sorun kategorisine girmemesi için toplu hedef listesinde mekan ID’si tekilleştirilecektir. Rastgele Unsplash/Picsum veya yalnızca kategori görselleri gerçek mekan fotoğrafı sayılmayacak; bunlar üretim verisine yazılmayacaktır. Eşleşmesi kesin doğrulanamayan kayıtlar `unmatched` listesine alınacak ve görselsiz bırakılacaktır.

## Kaynak önceliği

Birinci tercih işletmenin resmi web sitesi ve işletmeye ait açık sosyal medya hesabıdır. İkinci tercih belediye, kültür kurumu, etkinlik mekanı veya doğrulanabilir haber sayfası gibi kurumsal kaynaklardır. Üçüncü tercih, mekan adı ve adresi birlikte doğrulanan kamuya açık Google Maps görselidir. Her eşleşme için kaynak URL’si, görsel URL’si, mekan ID’si ve doğrulama notu saklanacaktır.

## Sınır

Bu çalışma API anahtarı, ücretli SerpAPI veya Cloudinary hesabı gerektirmeden yürütülecektir. Bulunan görseller önce yerel olarak indirilecek ve boyut/format kontrolünden geçirilecektir. Bulut depolama kimlik bilgisi olmadığı için ilk teslimat repodaki varlık dosyaları veya güvenilir kalıcı kaynak URL’leriyle sınırlı kalabilir; gerçek Cloudinary taşıması ancak proje sahibinin kendi üretim ortamında yapılabilir.

## İlk doğrulanan aday: SushiCo Zorlu Center

Resmi SushiCo şube sayfası [`sushico.com.tr/tr/subeler/zorlu-center`](https://www.sushico.com.tr/tr/subeler/zorlu-center), mekanı “Zorlu Center AVM Levazım Mah. Koru Sokak No:2, 34340 Beşiktaş/İstanbul” olarak doğruluyor. Aynı adres ve şube adıyla arama sonuçlarında Mekanlar.com, Yelp, Tripadvisor ve Yandex Maps görsel adayları bulundu. İlk aday görsel SushiCo iç mekanını ve markanın logosunu açıkça gösteriyor; görselin kaynak sayfası Mekanlar.com olarak işaretlendi. Üretim kaydına yazılmadan önce indirilen dosyaya kaynak URL’si ve doğrulama notu eklenecek.

## İlk görsel adayları

Üç hedef için arama sonuçları incelendi. Beykoz/Kavacık Gece Dönercisi adayında “Konum Kavacık Gece Dönercisi” ve “Gece Dönercisi” tabelası açıkça okunuyor; bu eşleşme güçlü. Gönül Bahçesi Cafe & Restaurant için Yandex Maps başlıklı aday, mekanın ahşap iç/dış oturma alanını gösteriyor; ancak görselin üzerinde işletme adı görünmediği için adres ve kaynak sayfası ayrıca doğrulanmadan üretime yazılmayacak. Limonlu Bahçe için bahçe ve restoran içi adayları bulundu; mekan adı ve İstanbul/Beyoğlu adresi birlikte doğrulanırsa kullanılabilir.

## Doğrulanmış üç yeni kaynak

**SushiCo Zorlu Center (mekan ID 7289):** Resmi şube sayfası [`sushico.com.tr/tr/subeler/zorlu-center`](https://www.sushico.com.tr/tr/subeler/zorlu-center) adresi doğruluyor. Görsel adayının kaynağı arama sonuçlarında Mekanlar.com/Yelp/Tripadvisor olarak göründü; seçilen görselde SushiCo iç mekanı ve marka logosu açıkça görülüyor.

**Limonlu Bahçe (mekan ID 7288):** [`Yandex Maps`](https://yandex.com/maps/org/limonlu_bahce/1107110985/) kaydı mekanı İstanbul, Beyoğlu, Yeni Çarşı Cad. 74 adresinde ve 27 fotoğrafla gösteriyor. Seçilen görsel, Limonlu Bahçe’nin bahçesini ve oturma alanını açıkça gösteriyor.

**Beykoz/Kavacık Gece Dönercisi (mekan ID 7287):** [`Corner`](https://www.corner.inc/place/pFFJQWGY9gb7) ve işletmenin [`Instagram hesabı`](https://www.instagram.com/kavacikgecedonercisimahirusta/) Kavacık/Beykoz’daki işletmeyi doğruluyor. Seçilen görselin tabelasında “Konum Kavacık Gece Dönercisi” ve “Gece Dönercisi” yazıları okunuyor.

## İkinci aday grubu

**U/We Coffee Roasters (mekan ID 7285):** Yandex Maps başlıklı görselde “U/WE COFFEE ROASTERS” tabelası açıkça okunuyor ve Beşiktaş Çırağan Caddesi bağlamıyla uyumlu; güçlü eşleşme.

**Merci Baku Cafe Restaurant (mekan ID 7284):** Tripadvisor başlıklı görselde mekanın “Merci Baku” tabelası, yeşil cephe ve iç mekan açıkça görülüyor; mekan adıyla güçlü görsel eşleşmesi var. Adres doğrulaması kaynak sayfasından ayrıca tutulacak.

## Eklenen görsel eşleşmeleri

Aşağıdaki mekanlar için görseller yerel web ve mobil varlıklarına eklendi ve canlı mekan ID’lerine bağlandı: U/We Coffee Roasters (7285), Merci Baku (7284), PizzaLazza Beşiktaş (7282), MasterArt Burger (7281), Beş Bıçak Steak (7280), Sarmaşık Coffee Co. (7279), Pizza Wich Beşiktaş (7278), Isokyo (7277), Dürümcü Esnaf Paşabahçe (7276), Coffee Break Coco Bambu (7275), Koska Beylikdüzü (7274), Kebabım Beylikdüzü (7273), Beşiktaşta Bir Meyhane (7272), Yüce Fırın (7270), PizzaLazza Migros (7269), Hacı Usta Kebap House (7268), Pidemide Beylikdüzü (7267), Pizza Krema Akaretler (7266), Babel Ocakbaşı Nevizade (7265), Senfoni Restoran & Cafe (7264), Ativa Coffee (7262), Simirna Söğüş (7261), Paşam Roma Dondurması (7260), Ala Rasi Restaurant (7256), Anzor Meat Doner (7255), Çıtır Ocakbaşı (7253), Hisar Buselik (7252), Ransserie Cafe House (7251) ve Beşiktaş Çıtır Pide Lahmacun Salonu (7249). Nezahat Nurettin Ege Köşkü (854) önceki onayla eklenmişti. Böylece toplam **33** canlı mekan ID’si için gerçek kaynak görseli override edildi.

## Bilinçli olarak eklenmeyenler

Coffe Street (7271), Mart Coffee Co. (7250), Ottoman Kitchen Sea Food & Kebap Restaurant (7259), Pera Nova Coffee (7258), The Crust (7254), Trois Coffee (7257) ve Ali Baba Balık Evi Restorant (7263) için bulunan sonuçlar ya farklı şube/işletmeye ait ya da görsel–adres eşleşmesi yeterince kesin değildi. Bu kayıtlar yanlış görselle doldurulmadı. Ali Baba kaydı ayrıca kaynaklarda faal değil olarak işaretleniyor.

## Kaynaklar

- SushiCo resmi şube: https://www.sushico.com.tr/tr/subeler/zorlu-center
- Limonlu Bahçe Yandex kaydı: https://yandex.com/maps/org/limonlu_bahce/1107110985/
- Kavacık Gece Dönercisi işletme kaydı: https://www.corner.inc/place/pFFJQWGY9gb7
- PizzaLazza Beşiktaş resmi şube: https://pizzalazza.com.tr/restoranlar/pizzalazza-besiktas
- MasterArt Burger resmi site: https://www.masterartburger.com/
- Beş Bıçak işletme sayfası: https://wanderlog.com/place/details/4084601/be%C5%9F-b%C4%B1%C3%A7ak-steak-restoran%C4%B1-alkent-2000
- Sarmaşık Coffee Co. kayıt: https://yandex.com.tr/maps/org/sarmasik/95579623947/
- Pizza Wich Beşiktaş kayıt: https://yandex.com.tr/maps/org/pizza_wich_besiktas/127938909923/
- Isokyo resmi Accor/Raffles sayfası: https://restaurantsandbars.accor.com/en/restaurant/A5E2_R005
- Babel Ocakbaşı resmi site: https://babelocakbasi.com/
- Hisar Buselik resmi site: https://buselikmeyhane.com/
- Çıtır Ocakbaşı Facebook işletme sayfası: https://www.facebook.com/citirkebap/
- Ala Rasi kaynak kaydı: https://www.zabihah.com/restaurants/de5924e6-86b4-4f6b-8ac0-3656a8d2656d/ala-rasi-sraselviler-cd-no-12-beyogluistanbul
- Anzor Meat Doner Yandex kaydı: https://yandex.com/maps/org/anzor_meat_doner/94551788195/
- Pizza Krema Akaretler kaynak kaydı: https://www.corner.inc/place/pbvq8DKpioLa
- Senfoni Restoran menü/adres kaydı: https://menuharitasi.com/menu/senfoni-restoran
- Paşam Roma Dondurma arama kaydı: https://www.yandex.com.tr/maps/
- Ransserie resmi site: https://www.ransseriecakes.com/
- Beşiktaş Çıtır resmi site: https://besiktascitir.com/

## Eklenen ikinci doğrulama partisi

Aşağıdaki canlı mekan kayıtlarına, ad–adres–işletme tabelası veya resmî kaynak birlikte kontrol edilerek yerel web ve mobil görselleri eklendi: Walter's Coffee Roastery (638), Books & Coffee Yeldeğirmeni (639), Meet Lab Coffee (644), Tilki Coffee (648), E’Lane Coffee Shop & Bakery (652), Les Câlins Compagnie de Café (653), Seven Specialty Coffee (657), V Coffee Kadıköy (658), The Coffee Factory Kadıköy Kızıltoprak (659) ve Story Coffee & Roastery (660).

Kamuya açık kaynak sayfaları ve adres doğrulama notları `docs/free_image_batches/verification_notes.md` dosyasına kaydedildi. Klar Coffee Roastery, VAU Coffee, Remedy Coffee House, İkarus Coffee House ve 23 Society Espresso Bar için şube/adres veya görsel eşleşmesi kesinleşmediğinden görsel eklenmedi.

Eklenen doğrulanmış kayıtlar: Torrefacto Coffee Roastery (661) ve Caffè Semplice (665). Her ikisi için de kaynak sayfası, adres ve görsel üzerindeki işletme işareti kontrol edildi; ayrıntılar `docs/free_image_batches/verification_notes.md` dosyasındadır.

## Eklenen restoran doğrulama partisi

Bu partide Çiya Sofrası (687), Yanyalı Fehmi Lokantası (691), Müdavim Lokantası (695), Kadıköy Midyecisi (697), Adanalı Ümit Usta Ocakbaşı & Kebap (698), The Townhouse (702) ve Nohut Falafel & Humus (706) için doğrulanmış yerel web ve mobil görselleri eklendi. Balıkçı Lokantası, Cafe Neva Breakfast, Hasan Usta, Leylak Kitchen, Nazende Cadde, Adanalı Şehmuz Usta, Sofra Han ve Onur Kebap için görsel/adres eşleşmesi yeterli olmadığı için ekleme yapılmadı.
