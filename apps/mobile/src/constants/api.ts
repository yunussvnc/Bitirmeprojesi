import Constants from "expo-constants";
import { Platform } from "react-native";

/** Dev fallback when expoHost unavailable – override via EXPO_PUBLIC_DEV_API_HOST */
const DEV_API_FALLBACK = "192.168.1.36:8000";
const PROD_API_DEFAULT = "https://api.asemos.com";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];

function resolveBaseUrl(): string {
  // Explicit override — her zaman önce buna bak
  const override = process.env.EXPO_PUBLIC_API_URL;
  if (override && override.startsWith("http")) {
    return override.replace(/\/$/, "");
  }
  if (__DEV__) {
    if (Platform.OS === "web") return "http://localhost:8000";
    // Sadece gerçek LAN IP kullan — tunnel URL'lerini (exp.direct) atla
    if (expoHost && !expoHost.includes('exp.direct') && !expoHost.includes('ngrok')) {
      return `http://${expoHost}:8000`;
    }
    const devHost = process.env.EXPO_PUBLIC_DEV_API_HOST ?? DEV_API_FALLBACK;
    return `http://${devHost}`;
  }
  return PROD_API_DEFAULT;
}

export const API_BASE_URL = resolveBaseUrl();

export const API_V1 = API_BASE_URL;
