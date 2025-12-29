# 🤖 İnteraktif Chatbot Kullanım Kılavuzu

## Başlatma

```bash
cd d:\BitirmeProjesi\ai-llm
python chatbot_interaktif.py
```

## Özellikler

✅ **Semantik Arama** - Doğal dil ile mekan arama
✅ **Konum Bazlı** - Farklı konumlar için arama
✅ **Mesafe Hesaplama** - Size en yakın mekanları gösterir
✅ **Benzerlik Skoru** - En uygun mekanları sıralar
✅ **Örnek Sorgular** - Hazır sorgu örnekleri

## Kullanılabilir Komutlar

| Komut | Açıklama |
|-------|----------|
| Metin gir | Mekan aramak için sorgunuzu yazın |
| `ornek` | Örnek sorgular gösterir |
| `konum` | Konumunuzu değiştirin |
| `yardim` | Yardım menüsü |
| `cikis` | Chatbot'tan çıkın |

## Örnek Kullanım

### 1. Basit Arama
```
[Siz] > kahve icmek istiyorum
```

**Sonuç:**
- Kahve Durağı (Skor: 0.681, Mesafe: 4.40 km)
- Espresso Bar (Skor: 0.449, Mesafe: 4.68 km)

### 2. Duygusal Arama
```
[Siz] > yorgunum sessiz dinlenmek istiyorum
```

**Sonuç:**
- Huzur Köşesi (Skor: 0.502, "Sessiz, huzurlu ortam")
- Sakin Köşe Kafe (Skor: 0.469, "Rahat, huzurlu")

### 3. Sosyal Durum
```
[Siz] > ailecek gidebilecegimiz cocuk oyun alani olan
```

**Sonuç:**
- Çocuk Parkı Restaurant (Skor: 0.472, "Büyük oyun parkı olan aile restoran")

### 4. Karmaşık Sorgu
```
[Siz] > deniz manzarali romantik aksam yemegi
```

**Sonuç:**
- Kumsal Restaurant (Skor: 0.642, "Kumsal üzerinde romantik restoran")
- Deniz Yıldızı Cafe (Skor: 0.600, "Deniz manzaralı, gün batımı")

## Konum Değiştirme

```
[Siz] > konum

[i] Populer Konumlar:
  1. Taksim (41.0370, 28.9850)
  2. Kadikoy (40.9903, 29.0250)
  3. Besiktas (41.0427, 29.0089)
  4. Sultanahmet (41.0082, 28.9784)
  5. Nisantasi (41.0477, 28.9955)

  0. Manuel konum girin

[?] Seciminiz (0-5): 2
```

## Örnek Sorgular Gösterme

```
[Siz] > ornek
```

Sistem size 4 kategoride örnek sorgular gösterecektir:
1. Fiziksel Özellikler
2. Duygular & Ruh Hali
3. Sosyal Durum
4. Karmaşık Sorgular

## Test Edilmiş Sorgu Türleri

### ✅ Fiziksel Özellikler
- "deniz manzarali wifi olan"
- "bahce acik hava terasta"
- "park icinde yesil alan"

### ✅ Duygular
- "huzurlu sakin rahat ortam"
- "romantik ozel gun"
- "neseli eglenceli"

### ✅ Ruh Hali
- "stresli rahatlamak istiyorum"
- "yorgunum dinlenmek"
- "mutlu kutlama"

### ✅ Sosyal
- "ailecek cocuk oyun alani"
- "sevgilimle romantik"
- "arkadaslarla eglenceli"

## Çıktı Formatı

Her mekan için gösterilen bilgiler:

```
[1] Mekan Adı
    Kategori       : Kafe/Restoran
    Benzerlik Skoru: 0.XXXX (ne kadar yüksekse o kadar uygun)
    Mesafe         : X.XX km
    Aciklama       : Mekan açıklaması...
    Adres          : Adres bilgisi
    Koordinat      : (enlem, boylam)
```

## LLM Analizi (Opsiyonel)

Eğer OpenAI API key tanımlıysa, her aramadan sonra AI analizi de gösterilir:

```
[AI] Sorgu Analizi:
     Kullanıcı sakin ve huzurlu bir ortamda dinlenmek istiyor...
```

## Notlar

- ⚡ İlk arama 8-10 saniye sürebilir (model yükleme)
- ⚡ Sonraki aramalar 50-100ms sürer
- 📊 Minimum benzerlik skoru: 0.4
- 📊 Maksimum sonuç sayısı: 5 mekan
- 🗄️ Toplam veritabanı: 25 mekan

## Hata Durumları

### "Uygun mekan bulunamadi"
- Daha genel bir sorgu deneyin
- Farklı kelimeler kullanın
- Konum değiştirmeyi deneyin

### "LLM analizi devre disi"
- Normal! Sistem yine de çalışır
- Sadece AI analizi olmaz
- OpenAI API key eklerseniz aktif olur

## İpuçları

1. 💡 Doğal dil kullanın: "kahve icmek istiyorum" şeklinde yazın
2. 💡 Duygularınızı belirtin: "yorgunum", "mutluyum", "stresli"
3. 💡 Fiziksel özellikleri ekleyin: "wifi", "bahçe", "deniz manzarası"
4. 💡 Sosyal durumu belirtin: "ailecek", "sevgilimle", "arkadaşlarla"
5. 💡 Çoklu özellik ekleyin: "sessiz wifi olan çalışma mekanı"

## Çıkış

```
[Siz] > cikis
[+] Gorusmek uzere! Iyi gunler :)
```

---

**Keyifli Aramalar! 🎉**


