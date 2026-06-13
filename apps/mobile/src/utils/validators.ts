/**
 * validators.ts — Merkezi Form Validasyon Utility
 *
 * Tüm uygulama genelinde tek kaynak validasyon fonksiyonları.
 * Her fonksiyon { valid: boolean, error?: string } döner.
 * Backend schemas.py ile tam uyumlu kurallar.
 */

// ─── E-POSTA ────────────────────────────────────────────────────────────────

/**
 * RFC 5322 uyumlu e-posta validasyonu.
 * - Max 254 karakter
 * - Geçerli domain yapısı zorunlu
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return { valid: false, error: 'E-posta adresi zorunludur.' };
  if (trimmed.length > 254) return { valid: false, error: 'E-posta adresi çok uzun (max 254 karakter).' };

  // RFC 5322 uyumlu regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Geçerli bir e-posta adresi giriniz. (örn: ad@gmail.com)' };
  }
  return { valid: true };
}

// ─── TELEFON ────────────────────────────────────────────────────────────────

/**
 * Türkiye ve uluslararası numara validasyonu.
 * Kabul edilen formatlar:
 *   - +905551234567  (E.164 Türkiye)
 *   - 05551234567    (Türkiye yerel)
 *   - 5551234567     (Türkiye operatör kodu ile)
 *   - +1234567890    (Uluslararası, diğer ülkeler)
 *
 * Boşluk ve tire karakterleri otomatik temizlenir.
 */
export function validatePhone(phone: string): { valid: boolean; error?: string; normalized?: string } {
  // Boşluk, tire, parantez temizle
  const cleaned = phone.replace(/[\s\-().]/g, '');

  if (!cleaned) return { valid: false, error: 'Telefon numarası zorunludur.' };

  // Türkiye numarası: 05xx veya 5xx ile başlamalı, toplam 10 veya 11 hane
  const turkeyLocal = /^(0?5[0-9]{9})$/;
  // Türkiye E.164: +90 5xx
  const turkeyE164 = /^\+905[0-9]{9}$/;
  // Uluslararası: + ile başlar, toplam 8-15 hane
  const international = /^\+[1-9]\d{7,14}$/;

  if (turkeyLocal.test(cleaned)) {
    // Normalize to E.164
    const digits = cleaned.replace(/^0/, '');
    return { valid: true, normalized: `+90${digits}` };
  }

  if (turkeyE164.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  if (international.test(cleaned)) {
    return { valid: true, normalized: cleaned };
  }

  return {
    valid: false,
    error: 'Geçerli bir telefon numarası giriniz. (örn: 05551234567 veya +905551234567)',
  };
}

// ─── ŞİFRE ──────────────────────────────────────────────────────────────────

export type PasswordStrength = 'weak' | 'medium' | 'strong';

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
  strength: PasswordStrength;
  /** 0-4 arası puan — güç göstergesi barı için */
  score: number;
  /** Kullanıcıya gösterilecek eksiklikler */
  missing: string[];
}

/**
 * Şifre gücü ve geçerlilik kontrolü.
 * Minimum kurallar (backend ile birebir uyumlu):
 *   - Min 8 karakter
 *   - En az 1 büyük harf
 *   - En az 1 küçük harf
 *   - En az 1 rakam
 *   - En az 1 özel karakter (!@#$%^&* vb.)
 *   - Max 128 karakter
 */
export function validatePassword(password: string): PasswordValidationResult {
  const missing: string[] = [];
  let score = 0;

  if (!password) {
    return { valid: false, error: 'Şifre zorunludur.', strength: 'weak', score: 0, missing: [] };
  }

  if (password.length < 8) missing.push('En az 8 karakter');
  if (password.length > 128) {
    return { valid: false, error: 'Şifre çok uzun (max 128 karakter).', strength: 'weak', score: 0, missing: [] };
  }
  if (!/[A-Z]/.test(password)) missing.push('En az 1 büyük harf');
  if (!/[a-z]/.test(password)) missing.push('En az 1 küçük harf');
  if (!/\d/.test(password)) missing.push('En az 1 rakam');
  if (!/[^a-zA-Z0-9]/.test(password)) missing.push('En az 1 özel karakter (!@#$%^&*)');

  // Puan hesapla
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const strength: PasswordStrength = score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
  const valid = missing.length === 0;

  if (!valid) {
    return {
      valid: false,
      error: `Şifre gereksinimleri karşılanmıyor: ${missing[0]}`,
      strength,
      score,
      missing,
    };
  }

  return { valid: true, strength, score, missing: [] };
}

// ─── KULLANICI ADI ───────────────────────────────────────────────────────────

/**
 * Kullanıcı adı validasyonu.
 * - 3-30 karakter
 * - Sadece harf, rakam, alt çizgi (_)
 * - Harf ile başlamalı (rakam veya _ ile başlayamaz)
 * - Backend ile uyumlu
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim();
  if (!trimmed) return { valid: false, error: 'Kullanıcı adı zorunludur.' };
  if (trimmed.length < 3) return { valid: false, error: 'Kullanıcı adı en az 3 karakter olmalıdır.' };
  if (trimmed.length > 30) return { valid: false, error: 'Kullanıcı adı en fazla 30 karakter olabilir.' };
  if (!/^[a-zA-Z]/.test(trimmed)) return { valid: false, error: 'Kullanıcı adı harf ile başlamalıdır.' };
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
    return { valid: false, error: 'Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir.' };
  }
  return { valid: true };
}

// ─── AD / SOYAD ─────────────────────────────────────────────────────────────

/**
 * Ad ve soyad validasyonu.
 * - 2-50 karakter
 * - Sadece Unicode harfler, boşluk, tire, apostrof
 * - Rakam içeremez
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Ad zorunludur.' };
  if (trimmed.length < 2) return { valid: false, error: 'Ad en az 2 karakter olmalıdır.' };
  if (trimmed.length > 50) return { valid: false, error: 'Ad en fazla 50 karakter olabilir.' };
  if (/\d/.test(trimmed)) return { valid: false, error: 'Ad rakam içeremez.' };
  // Unicode harf, boşluk, tire, apostrof
  if (!/^[\p{L}\p{M}'\-\s]+$/u.test(trimmed)) {
    return { valid: false, error: 'Ad yalnızca harf, tire ve apostrof içerebilir.' };
  }
  return { valid: true };
}

// ─── BİYOGRAFİ ──────────────────────────────────────────────────────────────

const BIO_MAX_LENGTH = 160;

/**
 * Biyografi validasyonu.
 * - Opsiyonel ama max 160 karakter (Twitter standardı)
 */
export function validateBio(bio: string): { valid: boolean; error?: string; remaining: number } {
  const remaining = BIO_MAX_LENGTH - bio.length;
  if (bio.length > BIO_MAX_LENGTH) {
    return {
      valid: false,
      error: `Biyografi en fazla ${BIO_MAX_LENGTH} karakter olabilir.`,
      remaining,
    };
  }
  return { valid: true, remaining };
}

export { BIO_MAX_LENGTH };

// ─── DOĞUM TARİHİ ───────────────────────────────────────────────────────────

const MIN_BIRTH_YEAR = 1940;
const MAX_BIRTH_YEAR = 2006; // 18+ zorunluluğu: 2024 - 18 = 2006

/**
 * Doğum tarihi validasyonu.
 * - 1940-2006 aralığı (18 yaş minimum, backend ile uyumlu)
 * - Geçerli tarih formatı kontrolü
 */
export function validateBirthDate(dateStr: string): { valid: boolean; error?: string } {
  if (!dateStr) return { valid: false, error: 'Doğum tarihi zorunludur.' };

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Geçersiz tarih formatı. (YYYY-AA-GG)' };
  }

  const year = date.getFullYear();
  if (year < MIN_BIRTH_YEAR) {
    return { valid: false, error: `Doğum yılı ${MIN_BIRTH_YEAR} veya sonrası olmalıdır.` };
  }
  if (year > MAX_BIRTH_YEAR) {
    return { valid: false, error: '18 yaşından küçükler kayıt olamaz.' };
  }
  return { valid: true };
}
