/**
 * Görsel üstü metin (image overlay) – tek standart.
 * Tüm ekranlarda "görseldeki yazı okunur" için: scrim + text shadow.
 */
export const imageOverlay = {
  /** Scrim gradient – üst şeffaf, alt koyu (metin her zaman okunur) */
  gradient: {
    colors: ['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)'] as const,
    locations: [0.25, 0.6, 1] as const,
    /** Scrim yüksekliği (görselin yüzdesi, 0–1) */
    heightRatio: 0.75,
  },
  /** Başlık metni gölgesi – açık görsellerde bile okunaklı */
  textShadow: {
    title: {
      textShadowColor: 'rgba(0,0,0,0.9)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 10,
    },
    subtitle: {
      textShadowColor: 'rgba(0,0,0,0.85)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 5,
    },
  },
  /** Overlay içeriği alt padding (safe area + kesilme yok) */
  contentPaddingBottom: 36,
} as const;
