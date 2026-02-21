# AsEmOs Ayarlar Mimarisi

Instagram referans alınarak, hikaye ve harita özellikleri için gerekli ayar gereksinimleri.

---

## 1. Genel Yapı

### Ana Ayarlar Kategorileri (Profil → Ayarlar)

| Kategori | Açıklama |
|----------|----------|
| **Hesabın** | Şifre, güvenlik, profil düzenleme |
| **Hikaye ve Konum** | Hikaye gizliliği, konum paylaşımı, harita görünürlüğü |
| **İçerik tercihleri** | Haritada gösterilecek içerik türleri |
| **Uygulama** | Bildirimler, tema, medya kalitesi |
| **Yardım & Destek** | Yardım, gizlilik, versiyon |

---

## 2. Hikaye Ayarları

### 2.1 Görüntüleyenler (Mevcut MVP'de basitleştirilmiş)

| Ayar | Açıklama | Öncelik |
|------|----------|---------|
| Hikayeyi şu kişilerden gizle | Belirli kullanıcılardan hikaye gizleme | Gelecek |
| Yakın Arkadaşlar | Sadece seçili kişilere hikaye paylaşma | Gelecek |

### 2.2 Kaydetme (Uygulandı)

| Ayar | Açıklama | Backend/Mobile |
|------|----------|----------------|
| **Hikayeyi arşive kaydet** | 24 saat sonra silinen hikayeleri arşive taşı | Backend: StoryArchive tablosu; Mobile: toggle ✅ |
| **Hikayeyi film rulosuna kaydet** | Fotoğraf/videoları paylaşırken cihaza kaydet | useSettingsStore + expo-media-library ✅ |

### 2.3 Yanıt ve Yorum (Gelecek)

| Ayar | Açıklama |
|------|----------|
| Mesaj yanıtlarına izin ver | Takipçiler / Takip ettiklerin / Kapalı |
| Yorumlara izin ver | Hikaye üzerinde yorum |

---

## 3. Konum ve Harita Ayarları

### 3.1 Konum Paylaşımı

| Ayar | Açıklama | Mevcut |
|------|----------|--------|
| Haritada konumumu göster | Keşfet haritasında kullanıcı pin'i | Var |
| Mekan etiketlemelerinde konum kullan | Gönderi/hikaye paylaşırken konum | Var (place_id) |

### 3.2 Harita Görünürlüğü

| Ayar | Açıklama | Uygulanacak |
|------|----------|-------------|
| **Hesap gizliliği** | Gizli hesapta mekan içerikleri sadece takipçilere | Backend + Mobile |
| Haritada hikayeleri göster | Mekan panellerinde hikaye ring'lerini göster/gizle | useSettingsStore |
| Haritada gönderileri göster | Mekan panellerinde post grid'ini göster/gizle | useSettingsStore |

---

## 4. İçerik Tercihleri

### 4.1 Harita / Keşfet

| Ayar | Açıklama | Varsayılan |
|------|----------|------------|
| Mekanda hikayeleri göster | PlaceMediaPanel'de hikaye ring'leri | Açık |
| Mekanda gönderileri göster | PlaceMediaPanel'de post grid | Açık |

### 4.2 Medya Kalitesi (Uygulandı)

| Ayar | Açıklama | Durum |
|------|----------|-------|
| **Yükleme kalitesi** | Yüksek / Veri tasarrufu (hikaye ve gönderi paylaşımında) | useSettingsStore ✅ |
| Önizleme kalitesi | Hızlı / Kaliteli | Gelecek |

---

## 5. Cihaz ve Kamera (Uygulandı)

| Ayar | Açıklama | Durum |
|------|----------|-------|
| **Ön kamerayı varsayılan yap** | Hikaye/video kaydederken ön kamera ile başla | useSettingsStore ✅ |
| **Kamera araç çubuğu** | Sol / Sağ taraf | useSettingsStore ✅ |
| Film rulosu erişimi | Konum, kalite verileri için izin bilgisi | Açıklama metni mevcut |

---

## 6. Veri Modeli Önerileri

### 6.1 UserPreferences (Backend - gelecek)

```python
class UserPreferences(Base):
    user_id: int
    story_save_to_archive: bool = True
    map_show_stories: bool = True
    map_show_posts: bool = True
    account_private: bool = False
```

### 6.2 useSettingsStore (Mobile - uygulandı)

```typescript
{
  // Hikaye
  storySaveToArchive: boolean;
  storySaveToCameraRoll: boolean;

  // Harita
  mapShowStories: boolean;
  mapShowPosts: boolean;

  // Medya
  uploadQuality: 'high' | 'data_saver';

  // Kamera (gelecekte uygulama içi kamera için)
  cameraDefaultFront: boolean;
  cameraToolbarSide: 'left' | 'right';
}
```

---

## 7. Uygulama Sırası

1. ✅ **useSettingsStore** – AsyncStorage ile tercih saklama
2. ✅ **Hikaye ayarları ekranı** – Arşive kaydet, film rulosuna kaydet, görüntüleyenler/yanıt placeholder
3. ✅ **İçerik tercihleri ekranı** – Haritada hikaye/gönderi toggle, medya kalitesi
4. ✅ **Kamera ayarları ekranı** – Ön kamera, araç çubuğu
5. ✅ **Profil entegrasyonu** – "Hikaye, konum ve kamera" bölümü (Hikaye, İçerik, Kamera ayarları)
6. ✅ **PlaceMediaPanel** – Tercihlere göre hikaye/gönderi gösterimi
7. ✅ **create-story** – uploadQuality (ImagePicker), storySaveToCameraRoll (expo-media-library)
8. **Backend UserPreferences** – Sunucu tarafı tercih senkronizasyonu (gelecek)
