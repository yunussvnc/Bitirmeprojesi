import React, { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { apiPost } from '@/src/utils/apiClient';
import { useAuthStore } from '@/src/store/useAuthStore';
import { startGeofencing, stopGeofencing } from '@/src/services/geofenceService';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

import { getSavedPlaces } from '@/src/services/savedService';
import { useGeofenceStore } from '@/src/store/useGeofenceStore';

export const PushNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const setWatchedPlaces = useGeofenceStore(s => s.setWatchedPlaces);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          apiPost('/auth/device-token', {
            token: token,
            platform: Platform.OS,
            device_id: Device.osBuildId || 'unknown'
          }).catch((err: any) => console.log('Push token register error:', err));
        }
      });
      
      // Kaydedilmiş mekanları al ve Geofence izlemeye ekle
      getSavedPlaces(1, 100)
        .then((res) => {
          const watched = res.items
            .filter(p => p.latitude && p.longitude)
            .map(p => ({
              id: Number(p.id),
              name: p.name,
              latitude: p.latitude as number,
              longitude: p.longitude as number,
              radiusMeters: 500, // 500 metre varsayılan
              campaignText: p.campaign_text
            }));
          setWatchedPlaces(watched);
          // İzlemeyi başlat
          startGeofencing().catch(err => console.log('Geofence start error:', err));
        })
        .catch(err => console.log('Geofence sync error:', err));

    } else {
      setWatchedPlaces([]);
      stopGeofencing().catch(err => console.log('Geofence stop error:', err));
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
      } else if (data && (data.type === 'new_message' || data.type === 'message') && data.conversation_id) {
        // Mesaj bildirimine tıklandı → o sohbete git
        router.push(`/chat/${data.conversation_id}` as any);
      } else if (data && data.type === 'geofence' && data.placeId) {
        // Bölgesel bildirime (Mekan Yakınında) tıklandı → mekana git
        router.push(`/place/${data.placeId}` as any);
      } else if (data && data.type === 'new_follower' && data.actor_id) {
        // Sosyal etkileşim: Takipçi
        router.push(`/profile/${data.actor_id}` as any);
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
