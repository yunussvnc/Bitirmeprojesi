# Mülakat Koçu — CV ve İş İlanına Özel Hazırlık Sistemi

## Genel Bakış

**Mülakat Koçu**, kullanıcının CV içeriğini hedef iş ilanıyla karşılaştıran, kanıta dayalı güçlü yön ve yetkinlik açığı analizi üreten, şirkete ve pozisyona özel mülakat soruları hazırlayan ve verilen cevapları puanlayarak hazırbulunuşluk skorunu güncelleyen uçtan uca bir hazırlık modülüdür.

Sistem, genel bir soru bankası sunmak yerine her hazırlık planını dört bağlama göre kişiselleştirir: **CV'deki gerçek deneyimler**, **iş ilanının gereksinimleri**, **hedef pozisyon** ve **hedef şirket**. Model erişilemediğinde özellik tamamen kullanılamaz hâle gelmez; kural tabanlı analiz ve değerlendirme motoruna otomatik olarak geçer.

## Kullanıcı Akışı

1. Kullanıcı ana sayfadaki **Mülakat Koçu** kartını açar.
2. Hedef şirketi ve pozisyonu girer.
3. İş ilanının tamamını yapıştırır.
4. CV'sini PDF, DOCX veya TXT olarak yükler ya da metin olarak yapıştırır.
5. Sistem CV–ilan eşleşme skoru, güçlü yönler, açıklar, şirket araştırma başlıkları, 60 saniyelik tanıtım taslağı, olası görüşme aşamaları ve beş günlük çalışma planı üretir.
6. Kullanıcı CV derinleşmesi, davranışsal, teknik, role özel, şirket, stres ve kapanış kategorilerindeki kişisel soruları yanıtlar.
7. Her cevap 100 üzerinden puanlanır; güçlü noktalar, geliştirme alanları, STAR geri bildirimi, daha güçlü cevap yapısı ve sonraki prova görevi sunulur.
8. Hazırbulunuşluk skoru, ilan eşleşmesi ve tamamlanan prova performansına göre güncellenir.

## Üretilen Hazırlık İçeriği

| Bileşen | Açıklama |
|---|---|
| İlan eşleşme skoru | CV'deki kanıtların ilan gereksinimlerini karşılama düzeyi |
| Güçlü yönler | CV kanıtı ve mülakatta nasıl kullanılacağıyla birlikte güçlü taraflar |
| Yetkinlik açıkları | Öncelik, risk ve uygulanabilir kapatma aksiyonları |
| Anahtar kelimeler | İlanın teknik ve davranışsal odakları |
| Olası görüşme aşamaları | İK, teknik, vaka ve yönetici görüşmesi gibi muhtemel adımlar |
| 60 saniyelik tanıtım | Role göre yapılandırılmış kişisel sunum taslağı |
| Kişisel sorular | CV, ilan, rol ve şirkete göre 10–12 soru |
| Beş günlük plan | Günlük görevler ve ölçülebilir başarı kriterleri |
| Şirkete sorular | Adayın seviye ve hazırlığını gösterecek nitelikli sorular |
| Son kontrol listesi | Görüşme öncesi operasyonel ve içerik kontrolleri |

## Hazırbulunuşluk Puanı

İlk plan oluşturulduğunda hazırbulunuşluk skoru, ilan eşleşme puanının yüzde 60'ı ile başlangıç hazırlık tabanının yüzde 40'ından oluşur. Kullanıcı prova cevapları verdikçe skor dinamik olarak yeniden hesaplanır:

```text
hazırbulunuşluk = ilan eşleşmesi × 0,35 + cevap puanı ortalaması × 0,65
```

Bu yaklaşım, yalnızca CV'si ilana uyan fakat cevap provası yapmayan adayla, deneyimini net ve kanıtlı biçimde anlatabilen adayı birbirinden ayırır.

## Backend Mimarisi

| Dosya | Sorumluluk |
|---|---|
| `backend/app/routers/interview_coach.py` | CV çıkarımı, plan CRUD ve cevap değerlendirme endpointleri |
| `backend/app/services/interview_coach.py` | LLM promptları, JSON normalizasyonu ve kural tabanlı fallback |
| `backend/app/interview_schemas.py` | Girdi ve çıktı doğrulama sözleşmeleri |
| `backend/models.py` | `InterviewPlan` ve `InterviewQuestion` kalıcı veri modelleri |
| `backend/llm_client.py` | Ayarlanabilir token ve sıcaklıkla mevcut Groq/OpenAI/Ollama sağlayıcı zinciri |
| `backend/tests/test_interview_coach.py` | Yetkilendirme, izolasyon, analiz, puanlama, silme ve CV çıkarımı testleri |

### Veri Modeli

`interview_plans` tablosu kullanıcı, şirket, pozisyon, türetilmiş analiz, eşleşme skoru ve hazırbulunuşluk skorunu saklar. `interview_questions` tablosu planın sorularını, cevap çerçevelerini, değerlendirme kriterlerini, puanı ve AI geri bildirimini saklar. **Ham CV, iş ilanı ve aday cevabı veritabanına yazılmaz.** İki tablo da kullanıcı silme ve plan silme işlemlerinde `CASCADE` davranışıyla temizlenir.

Kullanıcı yalnızca kendi planlarını görüntüleyebilir ve silebilir; başka bir kullanıcıya ait plan için kaynak varlığı açığa çıkarılmadan `404` döndürülür. Plan oluşturulmadan önce, CV/ilan/cevap içeriğinin yapılandırılmış AI sağlayıcısında işleneceğine ilişkin açık kullanıcı onayı zorunludur. E-posta, telefon, kimlik numarası ve bağlantı gibi doğrudan tanımlayıcılar sağlayıcı çağrısından önce en iyi çabayla maskelenir. Aynı maskeleme türetilmiş analiz, soru ve geri bildirim çıktılarına da kalıcı kayıt öncesinde özyinelemeli olarak uygulanır; kural tabanlı analiz CV'den doğrudan cümle alıntısı saklamaz.

## API Sözleşmeleri

Tüm endpointler `/api/v1` altında ve JWT kimlik doğrulamasıyla çalışır.

| Yöntem | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/interview-coach/cv/extract` | PDF, DOCX veya TXT dosyasından güvenli metin çıkarır |
| `POST` | `/interview-coach/plans` | Kişisel hazırlık planı ve soru seti üretir |
| `GET` | `/interview-coach/plans` | Kullanıcının son 30 hazırlık planını listeler |
| `GET` | `/interview-coach/plans/{id}` | Plan analizini ve soruları getirir |
| `POST` | `/interview-coach/plans/{id}/questions/{question_id}/evaluate` | Aday cevabını puanlar ve hazırbulunuşluğu günceller |
| `DELETE` | `/interview-coach/plans/{id}` | Planı, soruları ve cevapları kalıcı olarak siler |

## AI ve Fallback Davranışı

Modül, mevcut backend yapılandırmasındaki `LLM_PROVIDER` değerini kullanır. Desteklenen sağlayıcılar Groq, OpenAI ve Ollama'dır. Üretim çağrısı başarısız olduğunda veya geçerli JSON dönmediğinde sistem otomatik olarak kural tabanlı moda geçer.

Kural tabanlı plan; ilandaki anahtar kelimeleri çıkarır, CV'deki karşılıklarını kontrol eder, eşleşme skoru oluşturur, eksik alanlar için çalışma aksiyonu üretir ve dengeli bir mülakat soru seti sunar. Kural tabanlı cevap değerlendirmesi; cevap uzunluğu, STAR sinyalleri ve ölçülebilir sonuç kullanımını inceler.

Prompt injection riskini azaltmak için CV, ilan ve aday cevabı yalnızca veri olarak işaretlenir; bu içeriklerdeki talimatların uygulanması açıkça yasaklanır. AI'dan adayın vermediği deneyimleri uydurmaması istenir. Model çıktıları iç içe Pydantic şemalarıyla doğrulanır; beklenmeyen tip, eksik alan veya sınır aşımında çıktı kullanılmadan kural tabanlı moda geçilir.

## Dosya Güvenliği

CV yükleme endpointi yalnızca `.pdf`, `.docx` ve `.txt` uzantılarını kabul eder. MIME türü doğrulanır, dosya boyutu 5 MB ile sınırlandırılır ve çıkarılan metin 80.000 karakterde kesilir. PDF dosyaları en fazla 40 sayfa olabilir. DOCX arşivlerinde dosya sayısı, toplam açılmış boyut, şifreleme ve sıkıştırma oranı kontrol edilerek ZIP bombası riski sınırlandırılır. PDF/DOCX ayrıştırma ana API sürecinden ayrı bir işçi süreçte; 256 MB adres alanı, 6 saniye CPU ve 10 saniye duvar saati sınırlarıyla çalışır. Her uygulama worker'ında aynı anda en fazla iki belge ayrıştırılır; kapasite dolduğunda istek hızlı bir `503` yanıtıyla geri çevrilir. Böylece sıkıştırılmış belge akışlarının API sürecinde sınırsız bellek veya CPU tüketmesi engellenir. Metin çıkarımı başarısız veya yetersizse kullanıcıya taranmış PDF yerine metin tabanlı belge kullanması söylenir.

AI ve belge endpointleri IP bazlı özel rate limit ile korunur. Kullanıcı başına en fazla 20 saklanan plan, günde en fazla 5 yeni plan ve soru başına en fazla 5 değerlendirme uygulanır. Plan kotası kullanıcı satırı kilidi ve önce rezervasyon, değerlendirme kotası ise koşullu atomik sayaç güncellemesiyle çoklu worker yarışlarına karşı korunur. Aynı backend sürecindeki pahalı AI çağrıları eşzamanlılık semaforuyla sınırlandırılır.

## Mobil Uygulama

| Dosya | Sorumluluk |
|---|---|
| `apps/mobile/app/interview-coach.tsx` | Oluşturma, analiz, prova ve çalışma planı ekranları |
| `apps/mobile/src/services/interviewCoachService.ts` | Tip güvenli API istemcisi |
| `apps/mobile/src/components/domain/home/HomeScreen.tsx` | Ana sayfadaki özellik giriş kartı |

Mobil ekran; önceki plan listesi, belge seçici, çok satırlı ilan/CV girişleri, analiz skoru, güçlü yön ve açık kartları, soru navigasyonu, cevap değerlendirmesi ve beş günlük zaman çizelgesini içerir. Uzun AI çağrıları için standart API timeout değerinden bağımsız 60–90 saniyelik kontrollü timeout kullanılır.

## Kurulum

Backend bağımlılıklarını güncelleyin:

```bash
cd backend
pip install -r requirements.txt
python migrate.py
```

Mobil bağımlılıkları güncelleyin:

```bash
cd apps/mobile
npm install
```

LLM kullanılacaksa mevcut `.env` yapılandırmasında seçili sağlayıcının anahtarını tanımlayın. Örnek:

```env
LLM_ENABLED=true
LLM_PROVIDER=groq
GROQ_API_KEY=...
GROQ_MODEL=llama-3.1-8b-instant
```

Anahtar tanımlanmadan da kural tabanlı hazırlık ve cevap değerlendirmesi çalışır.

## Testler

```bash
cd backend
python -m pytest -q tests/test_interview_coach.py

cd ../apps/mobile
npm run typecheck
npx eslint app/interview-coach.tsx src/services/interviewCoachService.ts
```

Test paketi; kimlik doğrulama zorunluluğu, plan üretimi, kişisel veri izolasyonu, cevap puanlaması, hazırbulunuşluk güncellemesi, plan silme, TXT çıkarımı, geçersiz uzantı reddi ve Pydantic girdi sınırlarını kapsar.
