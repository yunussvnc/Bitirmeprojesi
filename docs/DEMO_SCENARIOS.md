# AsEmOs Demo Senaryoları

Bitirme tezi sunumu için 3 demo senaryosu.

---

## Senaryo 1: Kadıköy'de sessiz çalışma yeri

**Akış:** LLM önerisi → PlaceDetail → Yorum

1. Uygulamayı aç, Ana Sayfa'da **AI öneri** moduna geç
2. Arama kutusuna yaz: **"Kadıköy'de sessiz çalışma yeri"**
3. AI öneri butonuna tıkla
4. LLM sıralanmış mekan listesi ve kişisel açıklamalar döner
5. Bir mekana tıkla → Place Detail ekranı
6. "Yorum yaz" ile değerlendirme bırak (puan + metin)

**Kontrol edilecek:** LLM pipeline, explanation metni, review formu

---

## Senaryo 2: Arkadaşlarla bar

**Akış:** LLM önerisi → Kaydet → Sosyal akışta paylaş

1. Ana Sayfa'da ara: **"Arkadaşlarla bar"**
2. AI öneri al, bir mekan seç
3. Place Detail'da **Kaydet** butonuna bas
4. **Akış** tab'ına geç
5. **Paylaş** butonu → Create Post ekranı
6. Fotoğraf seç, açıklama yaz, (opsiyonel) mekan etiketle
7. Paylaş → Feed'de görünür

**Kontrol edilecek:** Save, feed, create-post, mekan etiketi

---

## Senaryo 3: Keşfet haritasından mekan bul → geofence review

**Akış:** Harita → Mekan detay → Geofence ile yorum

1. **Keşfet** tab'ına geç
2. Haritadaki pinlerden birine tıkla
3. Alt strip'ten mekanı seç → Place Detail
4. Mekanın **yakınında** ol (veya simülasyon ile koordinat gönder)
5. "Yorum yaz" → konum doğrulama (geofence 150m)
6. Doğrulanmış yorum yeşil badge ile işaretlenir

**Kontrol edilecek:** Harita pinleri, geofence doğrulama, verified badge

---

## Demo Giriş Bilgileri

- **E-posta:** demo1@asemos.app
- **Şifre:** demo123

Diğer demo hesaplar: demo2@asemos.app ... demo7@asemos.app (aynı şifre)

---

## Demo Verisi Hazırlama

```bash
cd backend
source venv/bin/activate
python scripts/seed_real_places.py   # Gerçek İstanbul mekanları
python scripts/add_istanbul_places.py  # Zincir mekanları (opsiyonel)
python scripts/seed_demo.py           # Demo kullanıcılar, gönderiler, takipler
```
