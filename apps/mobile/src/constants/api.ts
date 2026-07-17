import Constants from "expo-constants";
import { Platform } from "react-native";

/** Dev fallback when expoHost unavailable â€“ override via EXPO_PUBLIC_DEV_API_HOST */
const DEV_API_FALLBACK = "192.168.1.9:8000";
const PROD_API_DEFAULT = "http://167.233.219.55:8000";

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

export const API_V1 = `${API_BASE_URL}/api/v1`;
