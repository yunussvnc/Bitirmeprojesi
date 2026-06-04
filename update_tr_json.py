import json

file_path = "apps/mobile/src/locales/tr.json"

with open(file_path, "r", encoding="utf-8") as f:
    data = json.load(f)

terms_body = """# ASEMOS Kullanım Koşulları

Son Güncelleme Tarihi: [Tarih]

ASEMOS uygulamasını kullanarak aşağıdaki kullanım koşullarını kabul etmiş sayılırsınız. Bu koşulları kabul etmiyorsanız uygulamayı kullanmamanız gerekmektedir.

## 1. Hizmet Tanımı

ASEMOS, kullanıcıların sosyal etkileşim kurmasını, içerik paylaşmasını ve yapay zeka destekli mekan önerileri almasını sağlayan bir dijital platformdur.

Platform üzerinden sunulan öneriler yalnızca bilgilendirme amacı taşımaktadır ve kesin doğruluk veya uygunluk garantisi verilmemektedir.

## 2. Hesap Oluşturma ve Güvenlik

- Kullanıcılar kayıt sırasında doğru ve güncel bilgiler vermekle yükümlüdür.
- Hesap güvenliğinin korunmasından kullanıcı sorumludur.
- Şifre paylaşımı, hesap devri veya üçüncü kişilerin hesabı kullanmasına izin verilmesi yasaktır.
- Şüpheli hesap hareketleri tespit edildiğinde platform ilgili hesabı geçici veya kalıcı olarak askıya alabilir.

## 3. Kullanıcı İçerikleri

Kullanıcılar tarafından yüklenen gönderiler, yorumlar, fotoğraflar ve diğer içeriklerin sorumluluğu tamamen ilgili kullanıcıya aittir.

Aşağıdaki içeriklerin paylaşılması yasaktır:

- Hukuka aykırı içerikler
- Hakaret, tehdit veya nefret söylemi içeren paylaşımlar
- Şiddeti teşvik eden içerikler
- Başkalarının fikri mülkiyet haklarını ihlal eden içerikler
- Spam veya yanıltıcı içerikler

ASEMOS gerekli gördüğü durumlarda içerikleri kaldırma veya erişimi sınırlandırma hakkını saklı tutar.

## 4. Yapay Zeka Destekli Öneriler

ASEMOS tarafından sunulan mekan önerileri çeşitli algoritmalar ve kullanıcı tercihlerine dayalı olarak oluşturulmaktadır.

Sunulan öneriler:

- Tavsiye niteliğindedir.
- Ticari bir garanti oluşturmaz.
- Kullanıcı beklentilerini her durumda karşılayamayabilir.

Platform, önerilerin doğruluğu veya kullanıcı memnuniyeti konusunda garanti vermez.

## 5. Fikri Mülkiyet Hakları

ASEMOS markası, tasarımı, yazılımı, arayüzü ve sistem bileşenleri ilgili fikri mülkiyet mevzuatı kapsamında korunmaktadır.

Kullanıcılar;

- Sistemi kopyalayamaz,
- Tersine mühendislik yapamaz,
- İzinsiz çoğaltamaz,
- Ticari amaçla kullanamaz.

## 6. Hizmet Değişiklikleri

Platform, hizmetleri önceden bildirimde bulunmaksızın güncelleme, değiştirme veya sonlandırma hakkını saklı tutar.

## 7. Sorumluluğun Sınırlandırılması

ASEMOS;

- Sistem kesintileri,
- Teknik arızalar,
- Veri kayıpları,
- Üçüncü taraf hizmetlerden kaynaklanan sorunlar,
- Kullanıcılar arası anlaşmazlıklar

nedeniyle oluşabilecek zararlardan yasal sınırlar içerisinde sorumlu tutulamaz.

## 8. Hesabın Sonlandırılması

Kullanıcı dilediği zaman hesabını silebilir.

Kullanım koşullarının ihlal edilmesi durumunda ASEMOS ilgili hesabı askıya alma veya tamamen kapatma hakkına sahiptir.

## 9. Uygulanacak Hukuk

Bu kullanım koşulları Türkiye Cumhuriyeti mevzuatına tabidir. Taraflar arasında doğabilecek uyuşmazlıklarda Türkiye Cumhuriyeti Mahkemeleri ve İcra Daireleri yetkilidir.

## 10. İletişim

Sorularınız için:

E-posta: destek@asemos.com

veya uygulama içindeki iletişim kanalları üzerinden bizimle iletişime geçebilirsiniz."""

privacy_body = """# ASEMOS Gizlilik Politikası

Son Güncelleme Tarihi: [Tarih]

ASEMOS olarak kullanıcılarımızın gizliliğini korumayı önemsiyoruz. Bu politika, uygulamayı kullanırken hangi bilgilerin toplandığını, nasıl işlendiğini ve nasıl korunduğunu açıklamaktadır.

## 1. Toplanan Bilgiler

Uygulamayı kullanırken aşağıdaki bilgiler toplanabilir:

### Hesap Bilgileri

- Ad ve soyad
- E-posta adresi
- Profil fotoğrafı
- Kullanıcı adı

### Kullanım Verileri

- Uygulama kullanım istatistikleri
- Beğeniler ve etkileşimler
- Arama geçmişi
- Ziyaret edilen sayfalar

### Konum Bilgileri

Kullanıcının açık rızası doğrultusunda:

- Konum verileri
- Yakındaki mekan bilgileri
- Mekan önerilerinin iyileştirilmesi amacıyla gerekli lokasyon bilgileri

işlenebilir.

## 2. Verilerin Kullanım Amaçları

Toplanan veriler aşağıdaki amaçlarla kullanılabilir:

- Hesap oluşturmak ve yönetmek
- Sosyal medya özelliklerini sunmak
- Yapay zeka destekli mekan önerileri oluşturmak
- Kullanıcı deneyimini geliştirmek
- Güvenlik ve dolandırıcılık önleme süreçlerini yürütmek
- Teknik destek sağlamak

## 3. Yapay Zeka ve Analitik Hizmetler

ASEMOS, kullanıcı deneyimini geliştirmek amacıyla yapay zeka teknolojilerinden faydalanabilir.

Yapay zeka sistemleri;

- Kullanıcı tercihlerini analiz edebilir,
- İçerik önerileri sunabilir,
- Mekan tavsiyeleri oluşturabilir.

Bu süreçlerde yalnızca gerekli veriler işlenir.

## 4. Verilerin Saklanması

Kullanıcı verileri:

- Güvenli sunucularda saklanır.
- Yetkisiz erişime karşı korunur.
- Gerektiğinde şifreleme yöntemleri kullanılır.

Veriler yalnızca gerekli süre boyunca muhafaza edilir.

## 5. Verilerin Paylaşılması

ASEMOS kullanıcı verilerini satmaz.

Veriler yalnızca aşağıdaki durumlarda paylaşılabilir:

- Yasal yükümlülüklerin yerine getirilmesi
- Mahkeme veya resmi makam talepleri
- Hizmet sağlayıcı iş ortakları ile teknik hizmetlerin yürütülmesi

## 6. Kullanıcı Hakları

Kullanıcılar;

- Verilerine erişme,
- Verilerini düzeltme,
- Verilerini silme,
- İşleme faaliyetlerine itiraz etme,
- Açık rızalarını geri çekme

haklarına sahiptir.

## 7. Çerezler ve Benzeri Teknolojiler

ASEMOS, kullanıcı deneyimini geliştirmek amacıyla çerezler ve benzeri teknolojiler kullanabilir.

Bu teknolojiler:

- Oturum yönetimi,
- Güvenlik doğrulaması,
- Tercihlerin hatırlanması,
- Analitik ölçümler

amacıyla kullanılabilir.

## 8. Veri Güvenliği

Kullanıcı bilgilerinin korunması amacıyla;

- Güvenli iletişim protokolleri,
- Yetkilendirme mekanizmaları,
- Şifreleme yöntemleri,
- Güvenlik denetimleri

uygulanmaktadır.

## 9. Politika Değişiklikleri

Bu gizlilik politikası gerektiğinde güncellenebilir. Güncel sürüm uygulama içerisinde yayımlandığı anda yürürlüğe girer.

## 10. İletişim

Gizlilik politikasıyla ilgili sorularınız için:

E-posta: destek@asemos.com

üzerinden bizimle iletişime geçebilirsiniz."""

data["legal_documents"]["terms_body"] = terms_body
data["legal_documents"]["privacy_body"] = privacy_body

with open(file_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated tr.json successfully")
