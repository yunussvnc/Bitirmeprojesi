import { Platform } from 'react-native';

/** app.json → expo.scheme */
export const APP_SCHEME = 'asemos';

/** app.json → expo.owner / expo.slug */
export const EXPO_OWNER = 'icardiii';
export const EXPO_SLUG = 'asemos';

/**
 * Google Cloud Console → Web client → Authorized redirect URIs.
 * Must match exactly (registered as https://auth.expo.io/@icardiii/asemos).
 */
export const GOOGLE_EXPO_AUTH_REDIRECT_URI = `https://auth.expo.io/@${EXPO_OWNER}/${EXPO_SLUG}`;

/**
 * OAuth redirect URI for expo-auth-session + Google Web client.
 */
export function getGoogleRedirectUri(): string {
  return GOOGLE_EXPO_AUTH_REDIRECT_URI;
}

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const FALLBACK_GOOGLE_CLIENT_ID =
  '398883081062-uqa0hbpbo6nhjcbigltircbbg3ngr7oi.apps.googleusercontent.com';

const fallbackWebClientId = GOOGLE_WEB_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID;

/**
 * Web client owns the auth.expo.io redirect URI — prefer EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
 * for OAuth on every platform so redirect_uri matches Google Console.
 */
export const googleAuthRequestConfig = {
  webClientId: fallbackWebClientId,
  iosClientId: GOOGLE_WEB_CLIENT_ID || GOOGLE_IOS_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID,
  androidClientId: GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'] as const,
  redirectUri: getGoogleRedirectUri(),
};

export function hasGoogleClientIdForPlatform(): boolean {
  const { webClientId, iosClientId, androidClientId } = googleAuthRequestConfig;
  if (Platform.OS === 'ios') return Boolean(iosClientId || webClientId);
  if (Platform.OS === 'android') return Boolean(androidClientId || webClientId);
  return Boolean(webClientId);
}

/** @deprecated Use hasGoogleClientIdForPlatform — kept for call-site compatibility */
export function isGoogleSignInConfigured(): boolean {
  return hasGoogleClientIdForPlatform();
}

/** Kullanıcıya gösterilecek yapılandırma hatası (EAS / .env.local) */
export function getGoogleClientIdConfigError(): string {
  if (Platform.OS === 'ios') {
    return (
      'Google giriş için EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
      'Yerel: apps/mobile/.env.local — production: EAS Secrets (redirect: auth.expo.io/@icardiii/asemos).'
    );
  }
  if (Platform.OS === 'android') {
    return (
      'Google giriş için EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
      'Yerel: apps/mobile/.env.local — production: EAS Secrets (redirect: auth.expo.io/@icardiii/asemos).'
    );
  }
  return (
    'Google giriş için EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
    'Yerel: apps/mobile/.env.local — production: EAS Secrets (redirect: auth.expo.io/@icardiii/asemos).'
  );
}
