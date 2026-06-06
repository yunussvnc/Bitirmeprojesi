/**
 * useNotificationSocket — Novu Real-time WebSocket Hook
 *
 * WebSocket bağlantısını yönetir ve gelen mesajları
 * useNotificationStore ile entegre eder.
 *
 * Özellikler:
 * - Auth durumu değişince otomatik bağlan/kopar
 * - App arka plana geçince kopar, öne gelince yeniden bağlan
 * - Foreground'a dönüşte unread count senkronize et
 * - Reconnect with exponential backoff
 * - Token expire olduğunda reconnect loop'u engelle
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { useMessagesStore } from '@/src/store/useMessagesStore';
import { API_BASE_URL } from '@/src/constants/api';

// WebSocket URL'sini HTTP URL'sinden üret (http:// -> ws://, https:// -> wss://)
const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/notifications/ws';

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const { accessToken, user } = useAuthStore();
  const isAuthenticated = !!user;
  const handleWebSocketMessage = useNotificationStore((s) => s.handleWebSocketMessage);
  const syncUnreadCount = useNotificationStore((s) => s.syncUnreadCount);
  const isConnecting = useRef(false);

  // Ref ile güncel auth durumunu takip et — closure'ların stale değer okumasını engeller
  const isAuthenticatedRef = useRef(isAuthenticated);
  const accessTokenRef = useRef(accessToken);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
    accessTokenRef.current = accessToken;
  }, [isAuthenticated, accessToken]);

  const connect = useCallback(() => {
    // Guard: sadece auth durumu aktifse bağlan
    if (!isAuthenticatedRef.current || !accessTokenRef.current || isConnecting.current || wsRef.current) return;

    isConnecting.current = true;

    // Auth token'ı query parameter olarak ekle
    const wsUrl = `${WS_URL}?token=${accessTokenRef.current}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('✅ Notification WebSocket connected');
      isConnecting.current = false;
      reconnectAttemptRef.current = 0; // Reset backoff

      // Bağlantı başarılıysa, gecikmeli yeniden bağlanmayı temizle
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📬 Notification WS message received:', data.type);

        if (data.type === 'new_message') {
          // DM listesini güncelle (MessagesScreen'de anında görünsün)
          const msg = data.message;
          const senderName = data.sender_name || 'Birisi';
          const content = data.content || 'Yeni bir mesaj gönderdi.';
          const convIdStr = msg.conversation_id.toString();

          const store = useMessagesStore.getState();
          const existingConv = store.conversations.find(c => c.id === convIdStr);

          if (existingConv) {
            // Var olan sohbeti güncelle
            store.updateLastMessageAt(
                convIdStr,
                content,
                "Şimdi",
                senderName,
                true,       // isUnread
                Date.now()  // actualTimestamp
            );
          } else {
            // Listede olmayan yeni bir sohbet geldi — hemen ekle
            store.addConversation({
              id: convIdStr,
              name: senderName,
              username: senderName.toLowerCase().replace(/\s+/g, ''),
              avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=random`,
              lastMessage: content,
              lastMessageSender: senderName,
              timestamp: "Şimdi",
              lastMessageAt: Date.now(),
              unread: true,
              isOnline: false,
            });
          }

          // Sadece uygulamanın içinde dolaşıyorsak In-App Bildirim Gösterilmesi Expo'nun kendi Push handler'ı tarafından (PushNotificationProvider.tsx)
          // otomatik olarak shouldShowAlert: true ile yönetiliyor. 
          // Çift bildirim olmaması için burada manuel olarak scheduleNotificationAsync ÇAĞRILMAZ.

        } else {
          // Novu real-time: Store'a bildir — store unreadCount + notifications listesini günceller
          handleWebSocketMessage(data);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onerror = (error) => {
      console.warn('❌ Notification WebSocket error:', error);
      isConnecting.current = false;
    };

    ws.onclose = (event) => {
      console.log(`🔌 Notification WebSocket closed. Code: ${event.code}`);
      isConnecting.current = false;
      wsRef.current = null;

      // Kasıtlı kapanmamışsa VE hâlâ authenticate ise yeniden bağlanmayı dene
      // isAuthenticatedRef.current kullanılıyor — stale closure'dan kaçınmak için
      if (isAuthenticatedRef.current && event.code !== 1000 && event.code !== 4001) {
        const attempt = reconnectAttemptRef.current;
        const delay = Math.min(3000 * Math.pow(1.5, attempt), 30000); // max 30s
        reconnectAttemptRef.current = attempt + 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          // Reconnect sırasında auth durumunu bir kez daha kontrol et
          if (isAuthenticatedRef.current) {
            connect();
          }
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    isConnecting.current = false;
    reconnectAttemptRef.current = 0;
  }, []);

  // Auth durumu değiştiğinde bağlan/kopar
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [isAuthenticated, connect, disconnect]);

  // App arka plana geçtiğinde kopar, öne geldiğinde yeniden bağlan + sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Sadece auth durumu aktifse bağlan ve sync yap
        if (isAuthenticatedRef.current) {
          connect();
          syncUnreadCount();
        }
      } else if (nextAppState === 'background') {
        disconnect();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [connect, disconnect, syncUnreadCount]);

  return {
    isConnected: !!wsRef.current,
  };
}
