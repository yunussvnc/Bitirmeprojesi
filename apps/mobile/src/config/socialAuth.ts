import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';

/** app.json → expo.scheme */
export const APP_SCHEME = 'asemos';

/** app.json → expo.owner / expo.slug */
export const EXPO_OWNER = 'icardiii';
export const EXPO_SLUG = 'asemos';

/**
 * Expo SDK 54 / expo-auth-session v7 artık auth.expo.io proxy'sini
 * desteklemiyor.  AuthSession.makeRedirectUri() ile oluşturulan native
 * redirect URI kullanılmalı.
 *
 * Expo Go'da:  exp://192.168.x.x:8081/--/  (veya tunnel adresi)
 * Dev-client / standalone'da:  asemos://  (scheme tabanlı)
 *
 * Google Console → Web Client → Authorized redirect URIs listesine
 * https://auth.expo.io/@icardiii/asemos zaten ekli olabilir ama
 * artık önemli değil; yeni yöntem native redirect kullanıyor.
 */
export function getGoogleRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    // path: 'auth' — isteğe bağlı; genelde boş bırakılır
  });
}

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

/**
 * Google OAuth akışında Web client ID redirect URI'yi yönetir.
 * Bu nedenle tüm platformlarda webClientId mutlaka Web client olmalı.
 *
 * iosClientId ve androidClientId platforma özel native client ID olmalıdır
 * ama Expo Go ortamında çalışmadıkları için webClientId fallback olarak da kullanılır.
 */
export const googleAuthRequestConfig = {
  webClientId: GOOGLE_WEB_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'] as const,
  redirectUri: getGoogleRedirectUri(),
};

export function hasGoogleClientIdForPlatform(): boolean {
  // Web client ID yeterli — Expo Go'da her platformda Web client kullanılır
  if (GOOGLE_WEB_CLIENT_ID) return true;
  if (Platform.OS === 'ios') return Boolean(GOOGLE_IOS_CLIENT_ID);
  if (Platform.OS === 'android') return Boolean(GOOGLE_ANDROID_CLIENT_ID);
  return false;
}

/** @deprecated Use hasGoogleClientIdForPlatform — kept for call-site compatibility */
export function isGoogleSignInConfigured(): boolean {
  return hasGoogleClientIdForPlatform();
}

/** Kullanıcıya gösterilecek yapılandırma hatası (EAS / .env.local) */
export function getGoogleClientIdConfigError(): string {
  if (Platform.OS === 'ios') {
    return (
      'Google girişi için EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
      'Yerel: apps/mobile/.env.local — production: EAS Secrets.'
    );
  }
  if (Platform.OS === 'android') {
    return (
      'Google girişi için EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
      'Yerel: apps/mobile/.env.local — production: EAS Secrets.'
    );
  }
  return (
    'Google girişi için EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
    'Yerel: apps/mobile/.env.local — production: EAS Secrets.'
  );
}
