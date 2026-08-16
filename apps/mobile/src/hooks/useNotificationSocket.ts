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
 * - Reconnect with exponential backoff (max 10 deneme)
 * - Token expire olduğunda reconnect loop'u engelle
 * - Periyodik ping ile bağlantıyı canlı tut (25 saniyede bir)
 */

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { useMessagesStore } from '@/src/store/useMessagesStore';
import { API_BASE_URL } from '@/src/constants/api';

// WebSocket URL'sini HTTP URL'sinden üret (http:// -> ws://, https:// -> wss://)
const WS_URL = API_BASE_URL.replace(/^http/, 'ws') + '/api/v1/notifications/ws';

// Sabitler
const MAX_RECONNECT_ATTEMPTS = 10;
const MIN_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30000;
const PING_INTERVAL = 15000; // 15s (Sunucu kapanmasını engellemek için)

export function useNotificationSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  // Ping interval'ı temizle
  const clearPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Ping interval'ı başlat
  const startPingInterval = useCallback(() => {
    clearPingInterval();
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // Gönderilemezse bir sonraki denenecek
        }
      }
    }, PING_INTERVAL);
  }, [clearPingInterval]);

  const connect = useCallback(() => {
    // Guard: sadece auth durumu aktifse bağlan
    if (!isAuthenticatedRef.current || !accessTokenRef.current || isConnecting.current || wsRef.current) return;

    // Max reconnect limiti aşıldıysa dur
    if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
      console.warn(`🔌 Notification WebSocket: ${MAX_RECONNECT_ATTEMPTS} deneme sonra durdu. Uygulama ön plana gelince tekrar deneyecek.`);
      return;
    }

    isConnecting.current = true;

    // Auth token'ı query parameter olarak ekle
    const wsUrl = `${WS_URL}?token=${accessTokenRef.current}`;
    const ws = new WebSocket(wsUrl);

    // Timeout id for stable connection
    let stableConnectionTimeout: ReturnType<typeof setTimeout> | null = null;

    ws.onopen = () => {
      console.log('✅ Notification WebSocket connected');
      isConnecting.current = false;
      
      // Ping interval başlat
      startPingInterval();

      // Bağlantı başarılıysa, gecikmeli yeniden bağlanmayı temizle
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Bağlantı hemen kapanıp 1001 döngüsüne girmemesi için 
      // reconnect sayacını sıfırlamayı geciktir (Bağlantı 15sn stabil kalırsa sıfırla)
      stableConnectionTimeout = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            reconnectAttemptRef.current = 0; // Reset backoff
        }
      }, 15000); // 15 saniye açık kalırsa stabil kabul et

      syncUnreadCount();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Sunucu ping'ine sessizce cevap ver (log spam'i önle)
        if (data.type === 'ping' || data.type === 'pong') {
          return;
        }

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

        } else {
          // Novu real-time: Store'a bildir — store unreadCount + notifications listesini günceller
          handleWebSocketMessage(data);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    ws.onerror = (error: any) => {
      // Avoid spamming terminal with generic connection dropped messages
      isConnecting.current = false;
    };

    ws.onclose = (event) => {
      if (event.code !== 1006) {
        console.log(`🔌 Notification WebSocket closed. Code: ${event.code}`);
      }
      isConnecting.current = false;
      wsRef.current = null;
      clearPingInterval();
      if (stableConnectionTimeout) {
        clearTimeout(stableConnectionTimeout);
        stableConnectionTimeout = null;
      }

      // Kasıtlı kapanmamışsa VE hâlâ authenticate ise yeniden bağlanmayı dene
      // 1000 = normal kapanma (kullanıcı kasıtlı kapattı)
      // 4001 = geçersiz/expired token (yeniden bağlanma anlamsız)
      if (isAuthenticatedRef.current && event.code !== 1000 && event.code !== 4001) {
        const attempt = reconnectAttemptRef.current;

        if (attempt >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('🔌 Max reconnect denemesi aşıldı. Durduruluyor.');
          return;
        }

        const delay = Math.min(MIN_RECONNECT_DELAY * Math.pow(1.5, attempt), MAX_RECONNECT_DELAY);
        reconnectAttemptRef.current = attempt + 1;
        console.log(`🔌 Reconnect denemesi ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} — ${Math.round(delay / 1000)}s sonra...`);
        reconnectTimeoutRef.current = setTimeout(() => {
          // Reconnect sırasında auth durumunu bir kez daha kontrol et
          if (isAuthenticatedRef.current) {
            connect();
          }
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [handleWebSocketMessage, startPingInterval, clearPingInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    clearPingInterval();
    if (wsRef.current) {
      wsRef.current.close(1000, "User disconnected");
      wsRef.current = null;
    }
    isConnecting.current = false;
    reconnectAttemptRef.current = 0;
  }, [clearPingInterval]);

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
          // Uygulama öne geldiğinde reconnect sayacını sıfırla (kullanıcı aktif demektir)
          reconnectAttemptRef.current = 0;
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
