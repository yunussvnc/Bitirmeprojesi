import { AppError } from '@/src/utils/errorHandler';
import type { TFunction } from 'i18next';

/** Backend / API metnini kullanıcıya gösterilecek Türkçe auth mesajına çevirir. */
export function getAuthUserMessage(error: unknown, t: TFunction): string {
  if (error instanceof AppError) {
    return mapAuthDetail(error.userMessage, t);
  }
  if (error instanceof Error) {
    return mapAuthDetail(error.message, t);
  }
  return t('auth.err_generic');
}

function mapAuthDetail(raw: string, t: TFunction): string {
  let detail = raw.trim();
  if (!detail) return t('auth.err_generic');

  if (detail.startsWith('API error:')) {
    const sep = detail.indexOf(' - ');
    detail = sep >= 0 ? detail.slice(sep + 3).trim() : detail;
  }

  const lower = detail.toLowerCase();

  if (
    lower.includes('zaten kayıtlı') ||
    lower.includes('already registered') ||
    lower.includes('email already')
  ) {
    return t('auth.err_email_taken');
  }

  if (
    lower.includes('e-posta veya şifre') ||
    lower.includes('şifre hatalı') ||
    lower.includes('mevcut şifreniz hatalı') ||
    lower.includes('wrong password') ||
    lower.includes('incorrect password') ||
    lower.includes('invalid credentials')
  ) {
    return t('auth.err_wrong_password');
  }

  if (
    lower.includes('network request failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network_error') ||
    lower.includes('i̇nternet bağlantı')
  ) {
    return t('auth.err_network');
  }

  if (lower.includes('pending_verification:')) {
    return detail.replace(/pending_verification:\s*/i, '').trim();
  }

  if (lower.includes('google') && (lower.includes('token') || lower.includes('giriş'))) {
    return t('auth.google_login_failed');
  }

  if (lower.includes('apple') && (lower.includes('token') || lower.includes('giriş'))) {
    return t('auth.apple_login_failed');
  }

  if (/[ğüşıöçĞÜŞİÖÇ]/.test(detail)) {
    return detail;
  }

  return t('auth.err_generic');
}
