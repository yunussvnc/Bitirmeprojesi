/**
 * Secure Storage — Donanım Seviyesinde Token Saklama
 *
 * expo-secure-store ile iOS Keychain / Android Keystore kullanarak
 * auth token'larını güvenli şekilde saklar.
 *
 * MMKV'den farkı: Jailbreak/root cihazlarda bile okunamaz.
 *
 * @module utils/secureStorage
 */

import * as SecureStore from "expo-secure-store";
import { logger } from "./logger";

const ACCESS_TOKEN_KEY = "asemos_access_token";
const REFRESH_TOKEN_KEY = "asemos_refresh_token";

/**
 * Token'ları güvenli depoya kaydet.
 */
export async function saveTokens(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    logger.error("[SecureStorage] Token kaydetme hatası:", error);
  }
}

/**
 * Token'ları güvenli depodan oku.
 */
export async function getTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  try {
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error("[SecureStorage] Token okuma hatası:", error);
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Token'ları güvenli depodan sil.
 */
export async function clearTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    logger.error("[SecureStorage] Token silme hatası:", error);
  }
}
