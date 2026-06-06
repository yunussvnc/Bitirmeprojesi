import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** app.json ÔåÆ expo.scheme */
export const APP_SCHEME = 'asemos';

/** app.json ÔåÆ expo.owner / expo.slug */
export const EXPO_OWNER = 'icardiii';
export const EXPO_SLUG = 'asemos';

/**
 * Google Cloud Console ÔåÆ Web client ÔåÆ Authorized redirect URIs.
 * Must match exactly (registered as https://auth.expo.io/@icardiii/asemos).
 */
export const GOOGLE_EXPO_AUTH_REDIRECT_URI = `https://auth.expo.io/@${EXPO_OWNER}/${EXPO_SLUG}`;

/**
 * OAuth redirect URI for expo-auth-session + Google Web client.
 * In Expo Go, we use the auth.expo.io proxy.
 * In standalone apps / dev client builds, we return undefined so that
 * expo-auth-session automatically uses the correct native redirect URI.
 */
export function getGoogleRedirectUri(): string | undefined {
  const isExpoGo = Constants.appOwnership === 'expo';
  return isExpoGo ? GOOGLE_EXPO_AUTH_REDIRECT_URI : undefined;
}

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const FALLBACK_GOOGLE_CLIENT_ID =
  '398883081062-uqa0hbpbo6nhjcbigltircbbg3ngr7oi.apps.googleusercontent.com';

const fallbackWebClientId = GOOGLE_WEB_CLIENT_ID || FALLBACK_GOOGLE_CLIENT_ID;

/**
 * Web client owns the auth.expo.io redirect URI ÔÇö prefer EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
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
  if (Platform.OS === 'ios') return Boolean(GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  if (Platform.OS === 'android') return Boolean(GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

/** @deprecated Use hasGoogleClientIdForPlatform ÔÇö kept for call-site compatibility */
export function isGoogleSignInConfigured(): boolean {
  return hasGoogleClientIdForPlatform();
}

/** Kullan─▒c─▒ya g├Âsterilecek yap─▒land─▒rma hatas─▒ (EAS / .env.local) */
export function getGoogleClientIdConfigError(): string {
  if (Platform.OS === 'ios') {
    return (
      'Google giri┼ş i├ğin EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tan─▒ml─▒ de─şil. ' +
      'Yerel: apps/mobile/.env.local ÔÇö production: EAS Secrets (redirect: auth.expo.io/@icardiii/asemos).'
    );
  }
  if (Platform.OS === 'android') {
    return (
      'Google giri┼ş i├ğin EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID veya EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tan─▒ml─▒ de─şil. ' +
      'Yerel: apps/mobile/.env.local ÔÇö production: EAS Secrets (redirect: auth.expo.io/@icardiii/asemos).'
    );
  }
  return (
    'Google giri┼ş i├ğin EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID tan─▒ml─▒ de─şil. ' +
    'Yerel: apps/mobile/.env.local ÔÇö production: EAS Secrets (redirect: auth.expo.io/@icardiii/asemos).'
  );
}
