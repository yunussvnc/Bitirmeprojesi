import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Dev fallback when Expo hostUri is unavailable (physical device on LAN).
 * Override in .env.local: EXPO_PUBLIC_DEV_API_HOST=YOUR_LAN_IP:8000
 */
const DEV_API_FALLBACK = "localhost:8000";
/** Production / release builds (EAS production profile sets EXPO_PUBLIC_API_URL) */
const PROD_API_DEFAULT = "https://api.asemos.com";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];

function resolveBaseUrl(): string {
  // Explicit override for staging/production builds (EAS Build: EXPO_PUBLIC_* in eas.json)
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override && override.startsWith("http")) {
    return override.replace(/\/$/, "");
  }
  if (__DEV__) {
    if (Platform.OS === "web") return "http://localhost:8000";
    if (expoHost) return `http://${expoHost}:8000`;
    const devHost = process.env.EXPO_PUBLIC_DEV_API_HOST ?? DEV_API_FALLBACK;
    return `http://${devHost}`;
  }
  return PROD_API_DEFAULT;
}

export const API_BASE_URL = resolveBaseUrl();

export const API_V1 = API_BASE_URL;
