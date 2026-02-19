import Constants from "expo-constants";
import { Platform } from "react-native";

const expoHost = Constants.expoConfig?.hostUri?.split(":")[0];

function resolveBaseUrl(): string {
  if (__DEV__) {
    if (Platform.OS === "web") return "http://localhost:8000";
    if (expoHost) return `http://${expoHost}:8000`;
    return "http://192.168.1.9:8000";
  }
  return "https://api.asemos.com";
}

export const API_BASE_URL = resolveBaseUrl();

export const API_V1 = API_BASE_URL;
