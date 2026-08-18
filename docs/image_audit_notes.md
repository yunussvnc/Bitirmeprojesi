# Mekan görsel audit notları

## Canlı kapsam

Doğru repo `yunussvnc/Bitirmeprojesi`, canlı backend `https://api.asemos.tr`. `GET /api/v1/places/lite?limit=6000` ile toplam **4.735** mekan kaydı okundu. Kayıtların **1** tanesinde `photo_url` boş: mekan ID 854, Nezahat Nurettin Ege Köşkü. Bunun yanında **3.540** kayıt `google_photo_ref:` biçiminde referans taşıyor ve **1.194** kayıt HTTPS URL taşıyor.

| Görsel durumu | Kayıt sayısı | İlk doğrulama |
|---|---:|---|
| `google_photo_ref:` | 3.540 | Canlı fotoğraf proxy’si örneklerde HTTP 403 döndü |
| HTTPS URL | 1.194 | `lh3.googleusercontent.com` örneği HTTP 403 döndü; doğrudan hotlink güvenilmez |
| Boş | 1 | ID 854, Nezahat Nurettin Ege Köşkü |

## Kök nedenler

Canlı backend’in Google Places fotoğraf proxy’si `Fotoğraf Google'dan alınamadı.` yanıtıyla 403 dönüyor. Yerel `backend/.env.production` içindeki Cloudinary bilgileri şablon değer (`BURAYA_API_KEY`) olduğu için Cloudinary’ye yükleme henüz yapılamadı. Aynı dosyadaki `DATABASE_URL` de `${DATABASE_URL}` placeholder’ı; doğrudan üretim veritabanı bağlantısı bu çalışma alanından kullanılamıyor. Google Places API anahtarı da geçersiz veya yetkisiz, SerpAPI anahtarı ise tanımlı değil.

## Onaylanan ilk görsel

Kullanıcı, `https://www.instagram.com/p/B4rlr4EJ580/` gönderisindeki Nezahat Nurettin Ege Köşkü görselinin kullanılmasını onayladı. Görsel indirildi ve `frontend/src/assets/venues/nezahat-nurettin-ege-kosku.jpg ve apps/mobile/assets/places/nezahat-nurettin-ege-kosku.jpg` olarak saklandı; JPEG, 1440x1800 px. Görselin alt metni `Photo by Özcan Türkakın on November 10, 2019.` olarak doğrulandı. Cloudinary yükleme denemesi yapıldı ancak repodaki şablon kimlik bilgileri nedeniyle yükleme reddedildi; yerel web ve mobil varlıklarına ekleme tamamlandı.

## Alternatif kaynak doğrulaması

Google Maps halka açık SushiCo Zorlu Center sayfasında görsellerin mevcut olduğu görüldü; dolayısıyla 3.540 referanslı kaydın bir bölümü için alternatif görselleri Google Maps sayfalarından yeniden keşfetmek mümkün olabilir. Ancak 4.735 kaydı tek tek web kazımasıyla düzeltmek yerine önce geçerli bir Cloudinary hesabı ve geçerli Google Places/Google Maps API kimlik bilgileri sağlanmalı; ardından toplu ve kontrollü taşıma yapılmalı.

## Google Maps görsel keşfi

Google Maps’ın halka açık SushiCo Zorlu Center sayfasında mekan görselleri DOM içinde doğrudan `lh3.googleusercontent.com/gps-cs-s/...` URL’leriyle yüklendi. Sayfada 408x277 kapak ve çeşitli 112px/224px/447px görseller görüldü. Bu, Google referansları için tarayıcı tabanlı yeniden keşif yapılabileceğini gösteriyor; ancak bunu 3.540 kayıt için toplu uygulamak yerine önce kaynak URL’lerin kalıcılığı, kullanım şartları ve Cloudinary taşıma kimlik bilgileri çözülmeli.
