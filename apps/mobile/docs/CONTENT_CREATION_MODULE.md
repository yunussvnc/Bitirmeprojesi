# Content Creation Module

Instagram seviyesinde içerik oluşturma modülü. Hikaye Paylaş ekranı bu modülü kullanır.

## Dosya Yapısı

```
apps/mobile/
├── src/contentCreation/
│   ├── config.ts          # Limitler, aspect ratio
│   └── types.ts           # MediaItem, ContentType, FilterPreset, TextOverlay
├── components/contentCreation/
│   ├── MediaPicker.tsx    # Kamera + galeri, çoklu seçim, doğrulama
│   ├── EditCanvas.tsx     # Fullscreen düzenleme (metin, filtre)
│   ├── ContentCreationFlow.tsx  # Akış orkestratörü
│   └── index.ts
├── app/
│   └── create-story.tsx   # Hikaye paylaş – ContentCreationFlow entegrasyonu
└── docs/
    └── CONTENT_CREATION_MODULE.md  # Bu dosya
```

## Akış

1. **Medya seç** (MediaPicker): Kamera veya galeriden foto/video
2. **Düzenle** (EditCanvas): Metin ekleme, filtre (warm, cool, vintage, dramatic)
3. **Paylaş** (StoryShareStep): Konum seçimi, paylaş butonu

## MediaPicker Layer

- Kamera ile çekim (foto/video)
- Galeriden seçim (Story: tek, Post: çoklu)
- Video süre limiti (Story: 15sn)
- Dosya boyutu doğrulama (max 100MB)

## Editing Layer

- Metin ekleme (renk paleti)
- Filtre preseti (none, warm, cool, vintage, dramatic)

## Teknik Notlar

- Business logic değişmedi (createStory, uploadImage, uploadVideo)
- API endpointleri aynı
- Navigation yapısı korundu
- TypeScript strict uyumlu
