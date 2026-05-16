import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { apiPost } from '@/src/utils/apiClient';
import { useAuthStore } from '@/src/store/useAuthStore';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          // Backend'e token'ı kaydet
          apiPost('/auth/device-token', {
            token: token,
            platform: Platform.OS,
            device_id: Device.osBuildId || 'unknown'
          }).catch((err: any) => console.log('Push token register error:', err));
        }
      });
    } else {
      // Çıkış yapıldıysa token temizliği logout fonksiyonunda hallediliyor
    }

    // Uygulama açıkken gelen bildirim (Foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Foreground notification received:', notification.request.content.title);
    });

    // Bildirime tıklandığında (Background & Kill State Deep Linking)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log('Notification tapped!', data);

      if (data && data.url) {
        // Deep linking yönlendirmesi
        router.push(data.url as any);
      } else if (data && data.type === 'message' && data.conversation_id) {
        router.push(`/dm/${data.conversation_id}` as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  return <>{children}</>;
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification izni verilmedi!');
      return null;
    }
    
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      // Expo Push Token al (FCM/APNs'i soyutlar)
      token = (await Notifications.getExpoPushTokenAsync({
        projectId,
      })).data;
    } catch (e) {
      console.log('Expo Push Token alınamadı', e);
    }
  } else {
    console.log('Push bildirimleri için fiziksel cihaz gerekiyor.');
  }

  return token;
}
