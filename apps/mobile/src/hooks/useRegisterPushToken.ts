/**
 * useRegisterPushToken
 *
 * Kullanıcı giriş yaptığında Expo Push Token'ını alıp backend'e kaydeder.
 * Arka planda push bildirim alabilmek için bu adım zorunludur.
 *
 * Çağrılacağı yer: (tabs)/_layout.tsx içinde, token hazır olduğunda.
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { apiPost } from '@/src/utils/apiClient';
import { logger } from '@/src/utils/logger';

// Bildirim izin isteği ve token alma
async function getExpoPushToken(): Promise<string | null> {
  // Simülatör/emülatörde çalışmaz, sadece fiziksel cihaz
  if (!Device.isDevice) {
    logger.warn('[PushToken] Push token sadece fiziksel cihazda alınabilir.');
    return null;
  }

  // İzin kontrolü
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    logger.warn('[PushToken] Push bildirim izni verilmedi.');
    return null;
  }

  // Android için gerekli kanal oluşturma
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Mesajlar',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
  }

  try {
    // EAS projectId — app.json extra.eas.projectId'den veya sabit değerden alınır
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      'f10d96ca-d411-496e-b091-a71891e7b03c';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err) {
    logger.error('[PushToken] Token alınamadı:', err);
    return null;
  }
}

// Backend'e token kaydı
async function registerTokenWithBackend(token: string) {
  try {
    await apiPost('/auth/device-token', {
      token,
      platform: Platform.OS,
      device_id: null,
    });
    logger.info('[PushToken] Token backend\'e kaydedildi:', token.slice(0, 30) + '...');
  } catch (err) {
    logger.error('[PushToken] Backend kayıt hatası:', err);
  }
}

export function useRegisterPushToken() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const registered = useRef(false);

  useEffect(() => {
    // Giriş yoksa veya zaten kaydettiysek çık
    if (!accessToken || registered.current) return;

    (async () => {
      const token = await getExpoPushToken();
      if (token) {
        await registerTokenWithBackend(token);
        registered.current = true;
      }
    })();
  }, [accessToken]);
}
