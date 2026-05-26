import { Platform } from 'react-native';

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const MISSING_GOOGLE_CLIENT_ID = 'missing-google-client-id';

export const googleAuthRequestConfig = {
  clientId: GOOGLE_WEB_CLIENT_ID || MISSING_GOOGLE_CLIENT_ID,
  iosClientId: GOOGLE_IOS_CLIENT_ID,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  scopes: ['openid', 'profile', 'email'],
};

export function hasGoogleClientIdForPlatform(): boolean {
  if (Platform.OS === 'ios') return Boolean(GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  if (Platform.OS === 'android') return Boolean(GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID);
  return Boolean(GOOGLE_WEB_CLIENT_ID);
}

