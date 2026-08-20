# Mülakat Koçu — Windows Yerel Kurulum ve Test Rehberi

**Yazar:** Manus AI  
**Hedef ortam:** Windows 10/11, PowerShell, Docker Desktop, Python 3.11, Node.js 22

## 1. Amaç ve çalışma şekli

Bu rehber, AsEmOs reposundaki **Mülakat Koçu** özelliğini yerel bilgisayarda çalıştırmak ve hem mobil arayüzden hem de doğrudan API üzerinden test etmek için hazırlanmıştır. Mülakat Koçu için ayrı `ai-llm` servisini çalıştırmak zorunlu değildir. Özellik, ana FastAPI backend içinde çalışır ve PostgreSQL kullanır. Redis, backendin rate limit ve gerçek zamanlı altyapısının yerelde eksiksiz açılması için önerilir.

Sistemi iki modda test edebilirsiniz. **Kural tabanlı mod** API anahtarı gerektirmez ve ilk doğrulama için en hızlı seçenektir. **Gerçek AI modu** ise Groq veya OpenAI anahtarıyla kişiselleştirilmiş analiz ve cevap değerlendirmesi üretir. AI sağlayıcısı kapalı veya erişilemez olduğunda sistem otomatik olarak kural tabanlı moda geçer.

> **Güvenlik notu:** Reponun daha önceki sürümlerinde gerçek görünümlü servis kimlik bilgileri bulunuyordu. Şablon ve veri dosyaları temizlendi; ancak bu anahtarların Git geçmişinde bulunmuş olabileceğini varsayarak ilgili Groq, SerpAPI, SMTP ve Google anahtarlarını sağlayıcı panellerinden **iptal edip yenilemeniz** gerekir. Yeni anahtarları yalnızca yerel `.env` dosyanıza yazın ve Git'e göndermeyin.

## 2. Ön koşullar

| Araç | Önerilen sürüm | Kontrol komutu | Açıklama |
|---|---:|---|---|
| Git | Güncel | `git --version` | Repoyu klonlamak ve özellik dalına geçmek için |
| Docker Desktop | Güncel | `docker --version` | PostgreSQL ve Redis'i çalıştırmak için |
| Docker Compose | Docker Desktop ile gelir | `docker compose version` | Yerel servisleri yönetmek için |
| Python | 3.11.x | `py -3.11 --version` | Backendin repo sürümü 3.11.9'dur |
| Node.js | 22.x | `node --version` | Expo SDK 54 mobil uygulaması için |
| npm | Node ile gelir | `npm --version` | Mobil bağımlılıkları için |

Docker Desktop kurulumu için resmi Docker rehberini [1], Python 3.11 kurulumu için Python indirme sayfasını [2], Node.js kurulumu için resmi Node.js sayfasını [3] kullanabilirsiniz.

## 3. Repoyu indirme ve doğru dala geçme

PowerShell açın ve çalışma klasörünüze geçin:

```powershell
cd $HOME\Documents
git clone https://github.com/yunussvnc/Bitirmeprojesi.git
cd Bitirmeprojesi
```

Mülakat Koçu PR'ı henüz `main` dalına birleştirilmediyse özellik dalına geçin:

```powershell
git fetch origin
git switch --track origin/feature/interview-coach
```

Dal daha önce yerelde oluşturulduysa şu komut yeterlidir:

```powershell
git switch feature/interview-coach
git pull
```

PR `main` dalına birleştirildikten sonra bunun yerine aşağıdaki akışı kullanın:

```powershell
git switch main
git pull
```

Doğru kodun geldiğini şu dosyayla kontrol edin:

```powershell
Test-Path .\apps\mobile\app\interview-coach.tsx
```

Komutun `True` döndürmesi gerekir.

## 4. PostgreSQL ve Redis'i Docker ile başlatma

Docker Desktop'ın çalıştığından emin olun. Repo kökünde şu komutu çalıştırın:

```powershell
docker compose up -d db redis
```

Servis durumlarını kontrol edin:

```powershell
docker compose ps
```

Beklenen yerel bağlantılar aşağıdaki gibidir:

| Servis | Host adresi | Kullanıcı/Parola | Veritabanı |
|---|---|---|---|
| PostgreSQL | `localhost:5433` | `postgres` / `123` | `ai_mekan_oneri_db` |
| Redis | `localhost:6379` | Parolasız | DB `0` |

Konteyner loglarını gerektiğinde şu komutlarla görebilirsiniz:

```powershell
docker compose logs -f db
docker compose logs -f redis
```

## 5. Backend ortamını hazırlama

Backend dizinine geçin, ortam dosyasını oluşturun ve Python sanal ortamını kurun:

```powershell
cd .\backend
Copy-Item .env.example .env
py -3.11 -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

`backend\.env` dosyasını açın. İlk test için aşağıdaki değerler yeterlidir:

```env
DATABASE_URL=postgresql://postgres:123@localhost:5433/ai_mekan_oneri_db
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
ALLOWED_ORIGINS=*
JWT_SECRET_KEY=local-only-change-this-secret
PLACES_SYNC_ON_STARTUP=false
DEV_SKIP_EMAIL_VERIFICATION=true
LLM_ENABLED=false
LLM_PROVIDER=groq
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant
```

`DEV_SKIP_EMAIL_VERIFICATION=true`, kayıt doğrulama kodunu gerçek e-posta göndermek yerine backend terminaline yazdırır. `PLACES_SYNC_ON_STARTUP=false`, Mülakat Koçu testi sırasında mekan verisi senkronizasyonunu atlar. `LLM_ENABLED=false` ise harici model çağrısı yapmadan kural tabanlı sistemi test etmenizi sağlar.

Veritabanı tablolarını oluşturun:

```powershell
python migrate.py
```

Başarılı çalışmada terminalde `Tablolar ve şema yamaları hazır` ve `Migration bitti` mesajlarını görmelisiniz.

## 6. Backend'i çalıştırma

Aynı etkin sanal ortamda şu komutu çalıştırın:

```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend kontrolleri:

```powershell
Invoke-RestMethod http://localhost:8000/health
Invoke-RestMethod http://localhost:8000/health/ready | ConvertTo-Json -Depth 5
```

İlk komut `status: ok` dönmelidir. İkinci komut PostgreSQL ve Redis durumlarını gösterir. Swagger arayüzü `http://localhost:8000/docs` adresindedir.

> Backend terminalini açık bırakın. Mobil uygulama ve API testleri sırasında istekleri ve geliştirme doğrulama kodunu burada göreceksiniz.

## 7. Mobil uygulamayı çalıştırma

Yeni bir PowerShell penceresi açın ve mobil dizine geçin:

```powershell
cd $HOME\Documents\Bitirmeprojesi\apps\mobile
npm install
```

`apps\mobile\.env.local` dosyasını test hedefinize göre oluşturun:

| Test hedefi | `EXPO_PUBLIC_API_URL` değeri |
|---|---|
| Web tarayıcı | `http://localhost:8000` |
| Android Studio emülatörü | `http://10.0.2.2:8000` |
| Fiziksel Android/iPhone | `http://BILGISAYARIN_LAN_IP_ADRESI:8000` |

Web için örnek:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000
```

Fiziksel cihaz için bilgisayarınızın IP adresini `ipconfig` komutuyla bulun. Örneğin bilgisayarın IPv4 adresi `192.168.1.50` ise dosya şöyle olmalıdır:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.50:8000
```

`.env.local` içindeki adresi web, emülatör veya fiziksel cihaz arasında değiştirdiğinizde çalışan Expo sürecini durdurun ve `npx expo start -c` ile yeniden başlatın; aksi hâlde eski adres Metro önbelleğinde kalabilir.

En hızlı ilk test, web sürümüdür:

```powershell
npm run web
```

Mobil cihaz/emülatör için Metro'yu temiz önbellekle başlatın:

```powershell
npx expo start -c
```

Terminalde `w` web'i, `a` Android emülatörünü açar. Fiziksel cihazda Expo Go ile QR kodu okutabilirsiniz. Uygulamadaki yerel native modüllerden biri Expo Go'da desteklenmezse Android Studio kurulu ortamda development build kullanın:

```powershell
npx expo run:android
```

Expo'nun yerel geliştirme akışları için resmi dokümana bakabilirsiniz [4].

## 8. Mobil arayüzden uçtan uca test

Önce uygulamada yeni bir hesap oluşturun. `.env` içinde `DEV_SKIP_EMAIL_VERIFICATION=true` olduğu için altı haneli kod backend terminalinde `Bulunan Kod:` satırında görünür. Kodu uygulamaya girip oturum açın.

Ana ekranda **Mülakat Koçu** kartına dokunun. Yeni plan formunda şirket ve pozisyon adını girin. İş ilanı ve CV metinlerinin her biri en az 80 karakter olmalıdır. CV'yi PDF, DOCX veya TXT olarak yükleyebilir ya da metin alanına yapıştırabilirsiniz. AI veri işleme onayını işaretleyip planı oluşturun.

Başarılı bir uçtan uca testte şu sonuçları görmelisiniz:

| Kontrol | Beklenen sonuç |
|---|---|
| Plan oluşturma | Eşleşme ve hazırbulunuşluk skorları görünür |
| Genel bakış | Güçlü yönler, açıklar ve 60 saniyelik tanıtım oluşur |
| Prova | Kişiselleştirilmiş sorular listelenir |
| Cevap değerlendirme | En az 20 karakterlik cevaba puan ve STAR geri bildirimi gelir |
| Çalışma planı | Günlük görevler ve başarı kriterleri görünür |
| Plan geçmişi | Uygulamadan çıkıp dönünce plan listede kalır |
| Silme | Plan silindiğinde ilişkili sorular da kaybolur |

Kural tabanlı modda sonuçların daha şablonlu olması normaldir. Bu mod, API, veritabanı, dosya çıkarımı, kullanıcı izolasyonu ve mobil akışın doğru çalıştığını doğrulamak için tasarlanmıştır.

## 9. Gerçek AI modunu açma

Kural tabanlı test başarılı olduktan sonra backend'i durdurun ve `backend\.env` dosyasını güncelleyin:

```env
LLM_ENABLED=true
LLM_PROVIDER=groq
GROQ_API_KEY=KENDI_GROQ_ANAHTARINIZ
GROQ_MODEL=llama-3.1-8b-instant
```

Backend'i yeniden başlatın:

```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Yeni bir plan oluşturun. API yanıtındaki `generation_mode` alanı `llm` ise gerçek model çıktısı kullanılmıştır. Alan `rule_based` ise anahtar, ağ erişimi, kota veya model çıktısı doğrulaması nedeniyle güvenli fallback devreye girmiştir.

OpenAI kullanmak isterseniz:

```env
LLM_ENABLED=true
LLM_PROVIDER=openai
OPENAI_API_KEY=KENDI_OPENAI_ANAHTARINIZ
OPENAI_MODEL=gpt-4o-mini
```

## 10. Doğrudan API ile test

### 10.1 Test hesabı oluşturma

Backend çalışırken PowerShell'de kayıt isteğini gönderin:

```powershell
$registerBody = @{
  email = "local.interview@example.com"
  username = "localinterview"
  first_name = "Local"
  last_name = "Tester"
  password = "LocalTest1!"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:8000/api/v1/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $registerBody
```

Backend terminalindeki altı haneli kodu alın:

```powershell
$code = "BACKEND_TERMINALINDEKI_6_HANELI_KOD"
$verifyBody = @{
  email = "local.interview@example.com"
  code = $code
} | ConvertTo-Json

$tokens = Invoke-RestMethod `
  -Uri "http://localhost:8000/api/v1/auth/verify-register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $verifyBody

$token = $tokens.access_token
$headers = @{ Authorization = "Bearer $token" }
```

Kullanıcı daha önce oluşturulduysa doğrudan giriş yapabilirsiniz:

```powershell
$loginBody = @{
  email = "local.interview@example.com"
  password = "LocalTest1!"
} | ConvertTo-Json

$tokens = Invoke-RestMethod `
  -Uri "http://localhost:8000/api/v1/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody

$token = $tokens.access_token
$headers = @{ Authorization = "Bearer $token" }
```

### 10.2 Plan oluşturma

```powershell
$jobDescription = @'
Backend Developer olarak Python, FastAPI, PostgreSQL, REST API, Docker, test otomasyonu ve güvenli yazılım geliştirme deneyimi aranıyor. Adayın ekip çalışmasına yatkın, problem çözme becerisi güçlü ve teknik kararlarını açıkça anlatabilen biri olması bekleniyor.
'@

$cvText = @'
Python ve FastAPI ile REST servisleri geliştirdim. PostgreSQL veri modelleri, Docker tabanlı yerel ortamlar ve pytest otomasyonları üzerinde çalıştım. Bir ekip projesinde API yanıt sürelerini iyileştirdim ve hata oranını ölçerek azaltmak için izleme mekanizmaları kurdum.
'@

$planBody = @{
  role_title = "Backend Developer"
  company_name = "Ornek Teknoloji"
  job_description = $jobDescription
  cv_text = $cvText
  interview_language = "tr"
  consent_ai_processing = $true
} | ConvertTo-Json -Depth 10

$plan = Invoke-RestMethod `
  -Uri "http://localhost:8000/api/v1/interview-coach/plans" `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $planBody

$plan | ConvertTo-Json -Depth 10
```

### 10.3 İlk soruyu cevaplama

```powershell
$questionId = $plan.questions[0].id
$answerBody = @{
  answer_text = "Projede yavaşlayan bir endpointi analiz ettim. Sorgu planını inceleyip eksik indeksi ekledim, gereksiz sorguları azalttım ve testlerle davranışı korudum. Sonuçta yanıt süresi belirgin şekilde düştü ve ekip aynı yöntemi diğer endpointlere de uyguladı."
} | ConvertTo-Json

$evaluation = Invoke-RestMethod `
  -Uri "http://localhost:8000/api/v1/interview-coach/plans/$($plan.id)/questions/$questionId/evaluate" `
  -Method Post `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $answerBody

$evaluation | ConvertTo-Json -Depth 10
```

### 10.4 CV dosyası çıkarımını test etme

PowerShell'de gerçek `curl.exe` kullanın:

```powershell
curl.exe -X POST `
  "http://localhost:8000/api/v1/interview-coach/cv/extract" `
  -H "Authorization: Bearer $token" `
  -F "file=@C:\Users\KULLANICI\Documents\cv.pdf"
```

Dosya en fazla 5 MB ve PDF en fazla 40 sayfa olmalıdır. Taranmış, yalnızca görüntü içeren PDF yerine metin seçilebilen PDF kullanın.

Windows'ta belge ayrıştırma yine ayrı bir süreçte ve 10 saniye zaman aşımıyla çalışır. Linux üretim ortamındaki POSIX bellek/CPU limitleri Windows'ta bulunmadığı için yerel testte özellikle güvenilir ve küçük CV dosyaları kullanın; dosya boyutu, PDF sayfa sayısı, DOCX arşiv ve çıkarılan metin sınırları her iki platformda da uygulanır.

## 11. Otomatik testler

Backend Mülakat Koçu testleri:

```powershell
cd $HOME\Documents\Bitirmeprojesi\backend
.\.venv\Scripts\Activate.ps1
python -m pytest -q tests\test_interview_coach.py
```

Tüm backend regresyon paketi:

```powershell
python -m pytest -q
```

Mobil tip ve odaklı lint kontrolleri:

```powershell
cd $HOME\Documents\Bitirmeprojesi\apps\mobile
npm run typecheck
npx eslint app/interview-coach.tsx src/services/interviewCoachService.ts
```

Repo ayrıca yenileme kuyruğu için ayrı bir Node testi içerir:

```powershell
npm run test:refresh-queue
```

## 12. Sık karşılaşılan sorunlar

| Belirti | Muhtemel neden | Çözüm |
|---|---|---|
| `connection refused` veya PostgreSQL hatası | DB konteyneri kapalı ya da yanlış port | `docker compose up -d db`; `DATABASE_URL` içinde portun `5433` olduğunu kontrol edin |
| `/health/ready` `degraded` | Redis kapalı | `docker compose up -d redis` ve `REDIS_URL=redis://localhost:6379/0` kullanın |
| Mobilde `Network request failed` | Fiziksel cihaz `localhost` kullanıyor veya LAN erişimi engelli | Bilgisayarın LAN IP'sini yazın, cihazla aynı Wi-Fi'da olun, Windows Firewall'da Python/8000'e izin verin; iPhone'da uygulamanın Yerel Ağ iznini açın ve router istemci izolasyonunun kapalı olduğunu kontrol edin |
| Android emülatörü backend'e ulaşamıyor | Emülatörde `localhost` emülatörün kendisidir | `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000` kullanın |
| `401 Giriş yapmanız gerekiyor` | JWT yok veya süresi doldu | Uygulamadan tekrar giriş yapın ya da PowerShell'de yeni token alın |
| Plan `rule_based` dönüyor | LLM kapalı, anahtar eksik, kota dolu veya çıktı şeması geçersiz | Önce bunun fallback testinde normal olduğunu doğrulayın; sonra anahtarı ve backend logunu kontrol edin |
| PDF'den yeterli metin çıkarılamıyor | PDF taranmış görüntü içeriyor | Metin seçilebilen PDF/DOCX/TXT kullanın veya CV metnini forma yapıştırın |
| `Cannot find native module` | Expo Go ilgili native modülü içermiyor | Android Studio ile `npx expo run:android` development build kullanın |
| PowerShell sanal ortamı çalıştırmıyor | Execution Policy | Aynı terminalde `Set-ExecutionPolicy -Scope Process Bypass` çalıştırın |
| `ModuleNotFoundError: resource` | Eski özellik dalı Windows uyumlu değil | `git pull` ile son `feature/interview-coach` değişikliklerini alın |
| 429 yanıtı | Plan veya değerlendirme kotası | Günlük en fazla 5 plan, toplam en fazla 20 plan ve soru başına en fazla 5 değerlendirme sınırını dikkate alın |

## 13. Servisleri durdurma ve veriyi sıfırlama

Backend ve Expo terminallerinde `Ctrl+C` ile süreçleri durdurun. Docker servislerini durdurup verileri korumak için:

```powershell
cd $HOME\Documents\Bitirmeprojesi
docker compose down
```

PostgreSQL ve Redis verilerini tamamen silerek temiz başlangıç yapmak için:

```powershell
docker compose down -v
```

> `-v` seçeneği yerel veritabanını ve kayıtlı bütün planları kalıcı olarak siler.

## 14. Önerilen doğrulama sırası

En hızlı ve hata ayıklaması en kolay sıra şudur: önce Docker servislerini açın, backend migration ve health kontrollerini tamamlayın, kural tabanlı modda doğrudan API testini çalıştırın, ardından mobil web arayüzünü test edin. Son olarak gerçek cihaz/emülatör ve Groq/OpenAI moduna geçin. Bu sıra, ağ, kimlik doğrulama, veritabanı ve LLM sorunlarını birbirinden ayırmanızı sağlar.

## References

[1]: https://docs.docker.com/desktop/setup/install/windows-install/ "Install Docker Desktop on Windows"
[2]: https://www.python.org/downloads/windows/ "Python Releases for Windows"
[3]: https://nodejs.org/en/download "Download Node.js"
[4]: https://docs.expo.dev/get-started/start-developing/ "Expo — Start developing"
