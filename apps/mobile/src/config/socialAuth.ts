import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

/** app.json → expo.scheme */
export const APP_SCHEME = 'asemos';

/** Google Cloud Console → Authorized redirect URIs (Web client) */
export const GOOGLE_OAUTH_REDIRECT_PATH = 'oauthredirect';

/**
 * OAuth redirect URI — Google Console'da birebir kayıtlı olmalı.
 * Örnek: asemos://oauthredirect
 */
export function getGoogleRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: GOOGLE_OAUTH_REDIRECT_PATH,
  });
}

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const FALLBACK_GOOGLE_CLIENT_ID =
  '398883081062-uqa0hbpbo6nhjcbigltircbbg3ngr7oi.apps.googleusercontent.com';

export const googleAuthRequestConfig = {
  clientId: GOOGLE_WEB_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'] as const,
  redirectUri: getGoogleRedirectUri(),
};

export function hasGoogleClientIdForPlatform(): boolean {
  if (Platform.OS === 'ios') return Boolean(GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  if (Platform.OS === 'android') return Boolean(GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

/** Kullanıcıya gösterilecek yapılandırma hatası (EAS / .env.local) */
export function getGoogleClientIdConfigError(): string {
  if (Platform.OS === 'ios') {
    return (
      'Google giriş için EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
      'Yerel: apps/mobile/.env.local — production: EAS Secrets veya eas.json → build.production.env (scheme: asemos).'
    );
  }
  if (Platform.OS === 'android') {
    return (
      'Google giriş için EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
      'Yerel: apps/mobile/.env.local — production: EAS Secrets veya eas.json → build.production.env (scheme: asemos).'
    );
  }
  return (
    'Google giriş için EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tanımlı değil. ' +
    'Yerel: apps/mobile/.env.local — production: EAS Secrets veya eas.json → build.production.env.'
  );
}
