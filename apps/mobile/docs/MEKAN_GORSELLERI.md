# Mekan Görselleri

## Uygulama davranışı

- **API'de `photo_url` varsa:** Bu URL kullanılır (gerçek mekan görseli olmalı).
- **`photo_url` yoksa:** Uygulama **"Görsel eklenmedi"** placeholder’ı gösterir; rastgele/yanlış görsel gösterilmez.

## Gerçek mekana ait görsel nasıl eklenir?

1. **Backend:** Her mekan için `places` tablosundaki `photo_url` alanına **o mekana ait** görsel URL’si yazılmalı.
2. Görsel adresi:
   - Kendi sunucunuzdaki dosya (örn. `/media/places/xyz.jpg`),
   - veya güvenilir bir CDN/link olabilir.
3. `add_chain_media.py` gibi script’ler şu an **örnek** Unsplash linkleri atıyor; bunlar genel stok görseller. Gerçek mekan fotoğrafı için bu URL’leri, ilgili mekanın kendi fotoğrafı ile değiştirmeniz gerekir.

## Özet

| photo_url          | Uygulamada ne görünür?        |
|--------------------|------------------------------|
| Dolu (geçerli URL) | O mekana ait görsel          |
| Boş / yok          | "Görsel eklenmedi" placeholder |

Mekanların doğru görünmesi için backend’de her mekan için doğru `photo_url` atanmalıdır.
