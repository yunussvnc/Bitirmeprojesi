/**
 * Chat Screen
 *
 * Bireysel sohbet ekranı — mekan paylaşımı odaklı mesajlaşma.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Modal,
    TouchableWithoutFeedback,
    Alert,
    Keyboard,
    Dimensions,
} from "react-native";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact, success } from "@/src/utils/haptics";
import { useAppStore } from "@/src/store/useAppStore";
import { useMessagesStore } from "@/src/store/useMessagesStore";
import { useChatMessagesStore } from "@/src/store/useChatMessagesStore";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { revealProfile } from "@/src/services/matchService";
import { toggleBlockUser, createReport } from "@/src/services/moderationService";
import { getMessages as fetchBackendMessages, sendMessage as backendSendMessage, markMessagesRead, getConversationPermission, type ConversationPermission } from "@/src/services/messageService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { logger } from "@/src/utils/logger";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/src/constants/api";

/* ── Types ── */
interface Message {
    id: string;
    text: string;
    isMine: boolean;
    timestamp: string;
    placeCard?: {
        name: string;
        address: string;
        image: string;
    };
    imageUri?: string;
    seen?: boolean;
    status?: "sent" | "delivered" | "read";
    sharedPostId?: number;
    /** story_reply mesajı için: yanıtlanan hikayenin thumbnail URL'si (null = hikaye silindi/süresi doldu) */
    storySnapshotUrl?: string | null;
    isStoryReply?: boolean;
    /** Yanıtlanan hikayenin ID'si (derin bağ linkleme için) */
    parentStoryId?: number | null;
}

/* ── Dummy Contact Data ── */
const CONTACTS: Record<string, { name: string; avatar: string; isOnline: boolean; targetUserId?: number }> = {
    "1": { name: "Ahmet Yılmaz", avatar: "https://i.pravatar.cc/150?img=1", isOnline: true },
    "2": { name: "Elif Kaya", avatar: "https://i.pravatar.cc/150?img=5", isOnline: false },
    "3": { name: "Burak Demir", avatar: "https://i.pravatar.cc/150?img=3", isOnline: true },
    "4": { name: "Zeynep Toprak", avatar: "https://i.pravatar.cc/150?img=9", isOnline: false },
    "5": { name: "Can Aydın", avatar: "https://i.pravatar.cc/150?img=8", isOnline: false },
    "6": { name: "Selin Arslan", avatar: "https://i.pravatar.cc/150?img=10", isOnline: true },
    "7": { name: "Mert Özkan", avatar: "https://i.pravatar.cc/150?img=11", isOnline: false },
    "8": { name: "Deniz Güneş", avatar: "https://i.pravatar.cc/150?img=12", isOnline: false },
};

/* ── Dummy Messages (per chatId) ── */
const DUMMY_MESSAGES_BY_CHAT: Record<string, Message[]> = {
    "1": [
        { id: "1-1", text: "Selam! Nasılsın?", isMine: false, timestamp: "14:20" },
        { id: "1-2", text: "İyiyim, sen nasılsın?", isMine: true, timestamp: "14:21", status: "read" },
        {
            id: "1-3",
            text: "Dün harika bir mekan keşfettim, sana da önermek istedim!",
            isMine: false,
            timestamp: "14:22",
        },
        {
            id: "1-4",
            text: "",
            isMine: false,
            timestamp: "14:22",
            placeCard: {
                name: "Sortie - Kuruçeşme",
                address: "Kuruçeşme, İstanbul",
                image: "https://picsum.photos/400/200?random=42",
            },
        },
        { id: "1-5", text: "Vay be çok güzel görünüyor! Boğaz manzarası varmış 😍", isMine: true, timestamp: "14:25", status: "read" },
        { id: "1-6", text: "Evet, köprü manzaralı. Bu akşam gidelim mi?", isMine: false, timestamp: "14:26" },
        {
            id: "1-7",
            text: "",
            isMine: true,
            timestamp: "14:28",
            status: "read",
            placeCard: {
                name: "Fakülte Teras - Beyoğlu",
                address: "Beyoğlu, İstanbul",
                image: "https://picsum.photos/400/200?random=88",
            },
        },
        { id: "1-8", text: "Ben de burası güzel olur dedim, ne dersin? 🎵", isMine: true, timestamp: "14:28", status: "delivered" },
        { id: "1-9", text: "Olur ikisine de bakalım! Haritada kaydediyorum 📌", isMine: false, timestamp: "14:30" },
    ],
    "2": [
        { id: "2-1", text: "Merhaba Elif! Bu hafta sonu plan var mı?", isMine: true, timestamp: "10:05", status: "read" },
        { id: "2-2", text: "Henüz yok, bir fikrin mi var?", isMine: false, timestamp: "10:08" },
        {
            id: "2-3",
            text: "",
            isMine: false,
            timestamp: "10:10",
            placeCard: {
                name: "Kastel - Beyoğlu",
                address: "Beyoğlu, İstanbul",
                image: "https://picsum.photos/400/200?random=55",
            },
        },
        { id: "2-4", text: "Burası yeni açılmış, gidelim mi? 🎉", isMine: false, timestamp: "10:10" },
        { id: "2-5", text: "Çok güzel görünüyor! Cumartesi akşamı olur mu?", isMine: true, timestamp: "10:15", status: "read" },
    ],
    "3": [
        { id: "3-1", text: "Burak, dün akşam nasıldı?", isMine: true, timestamp: "09:00", status: "read" },
        { id: "3-2", text: "Efsaneydi! Bir daha gitmemiz lazım 🔥", isMine: false, timestamp: "09:05" },
        { id: "3-3", text: "Bu hafta sonu gidelim mi tekrar?", isMine: false, timestamp: "09:06" },
        { id: "3-4", text: "Olur, Cuma akşamı uyar bana", isMine: true, timestamp: "09:10", status: "read" },
    ],
    "4": [
        { id: "4-1", text: "Zeynep önerdiğin mekanı denedim!", isMine: true, timestamp: "16:30", status: "read" },
        { id: "4-2", text: "Nasıldı, beğendin mi? 😊", isMine: false, timestamp: "16:35" },
        { id: "4-3", text: "Teşekkürler, harika bir yermiş 🤩", isMine: true, timestamp: "16:40", status: "read" },
        { id: "4-4", text: "Ne güzel! Bir sonraki sefere ben de geleyim", isMine: false, timestamp: "16:42" },
    ],
    "5": [
        { id: "5-1", text: "Can, şu yeni açılan yeri gördün mü?", isMine: false, timestamp: "11:00" },
        { id: "5-2", text: "Hangisini kastediyorsun?", isMine: true, timestamp: "11:05", status: "read" },
        { id: "5-3", text: "Kadıköy'deki teras mekan", isMine: false, timestamp: "11:06" },
        { id: "5-4", text: "Sen de kaydettin mi orayı?", isMine: false, timestamp: "11:07" },
        { id: "5-5", text: "Evet kaydettim, çok iyi görünüyor!", isMine: true, timestamp: "11:10", status: "read" },
    ],
    "6": [
        { id: "6-1", text: "Selin, akşam için bir yer önerir misin?", isMine: true, timestamp: "18:00", status: "read" },
        {
            id: "6-2",
            text: "",
            isMine: false,
            timestamp: "18:05",
            placeCard: {
                name: "Oligark - Kuruçeşme",
                address: "Kuruçeşme, İstanbul",
                image: "https://picsum.photos/400/200?random=77",
            },
        },
        { id: "6-3", text: "Mekan önerisini yolladım 📍", isMine: false, timestamp: "18:05" },
        { id: "6-4", text: "Süpermiş! Teşekkürler 🙏", isMine: true, timestamp: "18:10", status: "delivered" },
    ],
    "7": [
        { id: "7-1", text: "Mert, pop-up restoran nasıldı?", isMine: true, timestamp: "20:00", status: "read" },
        { id: "7-2", text: "Efsaneydi! Şef bizzat servis yaptı", isMine: false, timestamp: "20:10" },
        { id: "7-3", text: "Pop-up restorandan geldim, anlatacaklarım var", isMine: false, timestamp: "20:15" },
        { id: "7-4", text: "Vay be, detay ver! 🍽️", isMine: true, timestamp: "20:20", status: "read" },
    ],
    "8": [
        { id: "8-1", text: "Deniz, o mekanın adresi neydi?", isMine: true, timestamp: "12:00", status: "read" },
        { id: "8-2", text: "Haritada işaretledim sana 📌", isMine: false, timestamp: "12:10" },
        {
            id: "8-3",
            text: "",
            isMine: false,
            timestamp: "12:11",
            placeCard: {
                name: "Fakülte Teras - Beyoğlu",
                address: "Beyoğlu, İstanbul",
                image: "https://picsum.photos/400/200?random=99",
            },
        },
        { id: "8-4", text: "Teşekkürler! Hemen kaydediyorum", isMine: true, timestamp: "12:15", status: "read" },
    ],
};

/** Her chatId için mesaj listesinin bağımsız bir kopyasını döndürür */
function getInitialMessages(chatId: string): Message[] {
    const msgs = DUMMY_MESSAGES_BY_CHAT[chatId];
    if (msgs) return msgs.map((m) => ({ ...m }));
    // Tanımlanmamış chatId için boş dizi
    return [];
}

/**
 * BUG-13: ChatId'den hedef user_id'yi güvenli şekilde parse et.
 * Formatı: tamamen sayısal ("42") veya "match_timestamp_userId" ("match_1711836000000_5")
 */
function _parseTargetUserId(chatId: string): number | null {
    // "match_xxx_userId" formatı
    if (chatId.startsWith("match_")) {
        const parts = chatId.split("_");
        const lastPart = parts[parts.length - 1];
        const id = parseInt(lastPart, 10);
        return isNaN(id) ? null : id;
    }
    // Tamamen sayısal conversation id
    const num = parseInt(chatId, 10);
    return isNaN(num) ? null : num;
}

export default function ChatScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { chatId, name: nameParam, avatar: avatarParam, viewDeleted } = useLocalSearchParams<{ chatId: string; name?: string; avatar?: string; viewDeleted?: string }>();
    const [inputText, setInputText] = useState("");
    const [lastSeenId, setLastSeenId] = useState<string | null>(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [reportText, setReportText] = useState("");
    // Mesajlaşma izin durumu
    const [msgPermission, setMsgPermission] = useState<ConversationPermission | null>(null);
    // Image viewer
    const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
    // Preview modal: URI seçildi, gönderilmedi — kullanıcı onaylasın
    const [previewUri, setPreviewUri] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);
    const didInitialScrollRef = useRef(false);

    // ── Image Viewer Animations ──
    const imgScale = useSharedValue(1);
    const imgTranslateX = useSharedValue(0);
    const imgTranslateY = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const overlayOpacity = useSharedValue(0);

    const openImageViewer = useCallback((uri: string) => {
        imgScale.value = 1;
        imgTranslateX.value = 0;
        imgTranslateY.value = 0;
        savedScale.value = 1;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        overlayOpacity.value = withTiming(1, { duration: 150 });
        setSelectedImageUri(uri);
    }, []);

    const closeImageViewer = useCallback(() => {
        // Reanimated callback'leri bazen RN JS thread'inde gecikmeye (4-5 sn) yol açar.
        // Bu yüzden animasyonu başlatıp, JS tarafında setTimeout ile kapatıyoruz.
        overlayOpacity.value = withTiming(0, { duration: 150 });
        imgScale.value = withTiming(0.9, { duration: 150 });
        
        setTimeout(() => {
            setSelectedImageUri(null);
        }, 150);
    }, []);

    const pinchGesture = Gesture.Pinch()
        .onUpdate((e) => {
            imgScale.value = Math.max(0.5, Math.min(savedScale.value * e.scale, 6));
        })
        .onEnd(() => {
            if (imgScale.value < 1) {
                imgScale.value = withSpring(1);
                imgTranslateX.value = withSpring(0);
                imgTranslateY.value = withSpring(0);
                savedScale.value = 1;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                savedScale.value = imgScale.value;
            }
        });

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (savedScale.value > 1) {
                imgTranslateX.value = savedTranslateX.value + e.translationX;
                imgTranslateY.value = savedTranslateY.value + e.translationY;
            } else {
                imgTranslateY.value = e.translationY;
                overlayOpacity.value = Math.max(0, 1 - Math.abs(e.translationY) / 400);
            }
        })
        .onEnd((e) => {
            if (savedScale.value <= 1 && Math.abs(e.translationY) > 80) {
                // Kapatırken görselin ekrandan uçup gitmesi için (flash olmaması için)
                imgTranslateY.value = withTiming(e.translationY + Math.sign(e.translationY) * 500, { duration: 150 });
                runOnJS(closeImageViewer)();
            } else if (savedScale.value <= 1) {
                imgTranslateY.value = withSpring(0);
                overlayOpacity.value = withTiming(1);
            } else {
                savedTranslateX.value = imgTranslateX.value;
                savedTranslateY.value = imgTranslateY.value;
            }
        });

    const doubleTapGesture = Gesture.Tap()
        .numberOfTaps(2)
        .onEnd(() => {
            if (imgScale.value > 1) {
                imgScale.value = withSpring(1);
                imgTranslateX.value = withSpring(0);
                imgTranslateY.value = withSpring(0);
                savedScale.value = 1;
                savedTranslateX.value = 0;
                savedTranslateY.value = 0;
            } else {
                imgScale.value = withSpring(2.5);
                savedScale.value = 2.5;
            }
        });

    const combinedGesture = Gesture.Simultaneous(pinchGesture, panGesture);
    const allGestures = Gesture.Race(doubleTapGesture, combinedGesture);

    const animatedImageStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: imgScale.value },
            { translateX: imgTranslateX.value },
            { translateY: imgTranslateY.value },
        ],
    }));

    const animatedOverlayStyle = useAnimatedStyle(() => ({
        opacity: overlayOpacity.value,
    }));

    const resolvedChatId = chatId || "1";
    const currentUser = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    // BUG-14: Sadece "match_xxx_userId" formatındaki ID'ler ya da sayısal olmayan ID'ler dummy sayılır.
    // Sayısal ID'ler artık her zaman backend conversation ID'si olarak işlenir.
    const numericConvId = parseInt(resolvedChatId, 10);
    const isNumeric = !isNaN(numericConvId) && resolvedChatId === String(numericConvId);
    const isDummyConversation = !isNumeric && !resolvedChatId.startsWith("match_");
    const isBackendConv = isNumeric;

    // Store'dan mesajları mount anında bir kere oku (subscribe etme — hydration loop'u önler)
    const [messages, setMessages] = useState<Message[]>(() => {
        const initial = getInitialMessages(resolvedChatId);
        // Store'da paylaşılmış gönderi mesajları varsa ekle
        try {
            const storeData = useChatMessagesStore.getState().messagesByChat[resolvedChatId];
            if (storeData && storeData.length > 0) {
                const seenIds = new Set(initial.map((m) => m.id));
                const newFromStore: Message[] = storeData
                    .filter((m) => !seenIds.has(m.id))
                    .map((m) => ({
                        id: m.id,
                        text: m.text,
                        isMine: m.isMine,
                        timestamp: (() => {
                            try {
                                const d = new Date(m.timestamp);
                                return d.toLocaleTimeString(currentLocale, { hour: "2-digit", minute: "2-digit" });
                            } catch (_e) { return m.timestamp; }
                        })(),
                        imageUri: m.imageUri,
                        status: m.status,
                        sharedPostId: m.sharedPostId,
                    }));
                return [...initial, ...newFromStore];
            }
        } catch (_e) { /* ignore */ }
        return initial;
    });

    const storeConversation = useMessagesStore((state) => state.conversations.find(c => c.id === resolvedChatId));

    // Tüm mesajlar görünür (soft-delete kaldırıldı)
    const visibleMessages = messages;

    useEffect(() => {
        useMessagesStore.getState().setActiveConversation(resolvedChatId);
        return () => {
            useMessagesStore.getState().setActiveConversation(null);
        };
    }, [resolvedChatId]);

    // Anlık "görüldü" güncellemesi için Chat WebSocket listener
    useEffect(() => {
        if (!isBackendConv || !accessToken) return;

        const WS_BASE = API_BASE_URL.replace(/^http/, 'ws');
        const wsUrl = `${WS_BASE}/ws/chat/${numericConvId}?token=${accessToken}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log(`✅ Chat WS connected to: ${wsUrl}`);
        };

        ws.onerror = (e) => {
            console.warn(`❌ Chat WS error:`, e);
        };

        ws.onclose = (e) => {
            console.log(`🔌 Chat WS closed. Code: ${e.code}, Reason: ${e.reason}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(`📬 Chat WS message received:`, data.type);

                if (data.type === 'message:status') {
                    // Karşı taraf mesajları okudu → anlık olarak status'ü "read" yap
                    const messageIds: string[] = (data.message_ids ?? (data.message_id ? [String(data.message_id)] : [])).map(String);
                    if (messageIds.length > 0 && data.status === 'read') {
                        setMessages((prev) =>
                            prev.map((m) =>
                                m.isMine && messageIds.includes(m.id)
                                    ? { ...m, status: 'read' as const }
                                    : m
                            )
                        );
                    }
                } else if (data.type === 'new_message' && data.message) {
                    // Karşı taraftan yeni mesaj geldi → listeye ekle
                    const msg = data.message;
                    if (msg.sender_id !== currentUser?.id) {
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === String(msg.id))) return prev;
                            return [...prev, {
                                id: String(msg.id),
                                text: msg.content ?? '',
                                isMine: false,
                                imageUri: msg.media_url ?? undefined,
                                timestamp: (() => {
                                    try {
                                        return new Date(msg.created_at).toLocaleTimeString(currentLocale, { hour: '2-digit', minute: '2-digit' });
                                    } catch { return ''; }
                                })(),
                            }];
                        });
                    }
                } else if (data.type === 'message:sent') {
                    // Kendi gönderdiğimiz mesajın ID'si backend'den onaylandı
                    const msg = data.message;
                    if (msg) {
                        setMessages((prev) =>
                            prev.map((m) =>
                                (m.status === 'sent' && m.text === msg.content)
                                    ? { ...m, id: String(msg.id), status: 'delivered' as const }
                                    : m
                            )
                        );
                    }
                }
            } catch { /* ignore parse errors */ }
        };

        return () => {
            ws.close(1000, 'Screen unmounted');
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBackendConv, numericConvId, accessToken]);

    // Backend'den mesaj geçmişini yükle ve 3 saniyede bir yeni mesajları kontrol et
    useEffect(() => {
        if (!isBackendConv) return;

        const myId = currentUser?.id;

        const loadMessages = async () => {
            try {
                const res = await fetchBackendMessages(numericConvId, 1, 100);
                if (res.items.length > 0) {
                    const backendMsgs: Message[] = res.items.map((m) => ({
                        id: String(m.id),
                        text: m.content,
                        isMine: m.sender_id === myId,
                        timestamp: (() => {
                            try {
                                return new Date(m.created_at).toLocaleTimeString(currentLocale, { hour: "2-digit", minute: "2-digit" });
                            } catch { return ""; }
                        })(),
                        status: m.sender_id === myId
                            ? (m.is_read ? "read" as const : "sent" as const)
                            : undefined,
                        sharedPostId: m.shared_post_id ?? undefined,
                        imageUri: m.media_url ? (m.media_url.startsWith('/') ? `${API_BASE_URL}${m.media_url}` : m.media_url) : undefined,
                        isStoryReply: m.message_type === 'story_reply',
                        storySnapshotUrl: m.story_snapshot_url ?? undefined,
                        parentStoryId: m.parent_story_id ?? undefined,
                    }));
                    setMessages((prev) => {
                        // Backend verisini önceki mesajlarla birleştir (delivered statüsünü korumak için)
                        const mergedMsgs = backendMsgs.map(newMsg => {
                            const oldMsg = prev.find(m => m.id === newMsg.id);
                            if (oldMsg) {
                                // Eski mesaj 'delivered' ise ve yeni mesaj henüz 'read' değilse ('sent' ise), 'delivered' kalmasını sağla
                                if (oldMsg.status === 'delivered' && newMsg.status === 'sent') {
                                    return { ...newMsg, status: 'delivered' as const };
                                }
                            }
                            return newMsg;
                        });

                        // Liste uzunlukları veya statüleri değişmişse listeyi güncelle
                        const isSame = prev.length === mergedMsgs.length && prev.every((m, i) => 
                            m.id === mergedMsgs[i].id && m.status === mergedMsgs[i].status
                        );
                        
                        return isSame ? prev : mergedMsgs;
                    });

                    // Store'u render sonrasında güncelle (render sırasında state güncelleme hatasını önler)
                    const latestMsg = backendMsgs[backendMsgs.length - 1];
                    if (latestMsg && backendMsgs.length > 0) {
                        const convs = useMessagesStore.getState().conversations;
                        const textToSave = latestMsg.text || (latestMsg.imageUri ? t('chat.photo', 'Fotoğraf 📷') : '');
                        const sender = latestMsg.isMine ? 'me' : contact.name || 'Kullanıcı';

                        setTimeout(() => {
                            if (!convs.some(c => c.id === chatId)) {
                                useMessagesStore.getState().addConversation({
                                    id: chatId,
                                    name: contact.name || 'Kullanıcı',
                                    username: '',
                                    avatar: contact.avatar || '',
                                    lastMessage: textToSave,
                                    lastMessageSender: sender as any,
                                    timestamp: latestMsg.timestamp,
                                    unread: !latestMsg.isMine,
                                    isOnline: contact.isOnline || false,
                                    lastMessageAt: Date.now(),
                                });
                            } else {
                                const c = convs.find(c => c.id === chatId);
                                useMessagesStore.getState().updateLastMessageAt(
                                    chatId,
                                    textToSave,
                                    latestMsg.timestamp,
                                    sender as any,
                                );
                                if (c?.isArchived) useMessagesStore.getState().unarchiveConversation(chatId);
                            }
                        }, 0);
                    }
                }
                // Okundu bildir
                markMessagesRead(numericConvId).catch(() => { });
            } catch (e) {
                if (__DEV__) logger.warn("[ChatScreen] Could not load messages for conv", numericConvId);
            }
        };

        // İlk yükleme
        loadMessages();

        // 3 saniyede bir polling (arka plandaki güvenlik ağı)
        const pollInterval = setInterval(loadMessages, 3000);

        return () => clearInterval(pollInterval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBackendConv, numericConvId]);

    // 🔐 Mesajlaşma iznini yükle (konuşma açılınca + her 10 saniyede bir yenile)
    useEffect(() => {
        if (!isBackendConv) {
            // Dummy konuşma → tam serbest
            setMsgPermission({ can_send: true, can_send_media: true, hide_read_receipt: false, messages_sent_count: 0, awaiting_reply: false });
            return;
        }
        const loadPerm = async () => {
            const perm = await getConversationPermission(numericConvId);
            setMsgPermission(perm);
        };
        loadPerm();
        const permInterval = setInterval(loadPerm, 10000);
        return () => clearInterval(permInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBackendConv, numericConvId]);

    // Contact bilgisini öncelik sırasıyla belirle:
    // 1. Mock CONTACTS (sadece sahte data için)
    // 2. Store'daki konuşma (önceden yüklenmiş)
    // 3. Navigation param'ları (openConversation'dan gelenler) ← YENİ
    // 4. Boş fallback (asla Ahmet Yılmaz değil)
    const contact = CONTACTS[resolvedChatId] || (storeConversation ? {
        name: storeConversation.name,
        avatar: storeConversation.avatar,
        isOnline: storeConversation.isOnline,
        targetUserId: storeConversation.targetUserId,
    } : nameParam ? {
        name: decodeURIComponent(nameParam),
        avatar: avatarParam ? decodeURIComponent(avatarParam) : `https://ui-avatars.com/api/?name=${encodeURIComponent(nameParam)}&background=random`,
        isOnline: false,
        targetUserId: undefined,
    } : {
        name: "Kullanıcı",
        avatar: "https://ui-avatars.com/api/?name=K&background=random",
        isOnline: false,
        targetUserId: undefined,
    });

    const isMatch = storeConversation?.isMatch;
    const revealRequestedByMe = storeConversation?.revealRequestedByMe;
    const isRevealed = storeConversation?.isRevealed;

    const handleRevealToggle = () => {
        if (!resolvedChatId) return;

        if (revealRequestedByMe) {
            Alert.alert(t("chat.waiting"), t("chat.waiting_desc"));
            return;
        }

        useMessagesStore.getState().toggleRevealRequest(resolvedChatId);
        success();

        // Gerçek ID ise API'ye de bildir:
        if (isBackendConv) {
            revealProfile(numericConvId).catch(console.log);
        }

        // BUG-12: Mock auto-reveal kaldırıldı.
        // Production'da karşı tarafın reveal etmesi backend'den gelecek.
        // Backend zaten reveal-profile endpoint'inde her iki taraf da onaylarsa
        // otomatik olarak mutual follow oluşturuyor.
    };

    useEffect(() => {
        if (messages.length > 0) {
            setLastSeenId(messages[messages.length - 1].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBlock = async () => {
        setIsOptionsVisible(false);
        // BUG-13: Parse user id — handle both numeric and 'match_xxx_userId' formats
        const targetId = _parseTargetUserId(resolvedChatId);
        if (targetId !== null) {
            try {
                await toggleBlockUser(targetId);
            } catch { /* ignore */ }
        }
        success();
        Alert.alert(t("common.success"), t("chat.blocked_success", { name: contact.name }), [
            { text: t("common.ok"), onPress: () => router.replace("/settings/blocked-users" as any) }
        ]);
    };

    const handleReport = async () => {
        const charCount = reportText.trim().length;
        if (charCount === 0) {
            Alert.alert(t("common.error"), t("chat.report_empty"));
            return;
        }
        if (charCount > 500) {
            Alert.alert(t("common.error"), t("chat.report_max_chars"));
            return;
        }

        setIsReportVisible(false);
        // BUG-13: Parse user id
        const targetId = _parseTargetUserId(resolvedChatId);
        if (targetId !== null) {
            try {
                await createReport({ target_type: "user", target_id: targetId, reason: "harassment", description: reportText.trim() });
                await toggleBlockUser(targetId);
            } catch { /* ignore */ }
        }
        success();
        Alert.alert(t("common.success"), t("chat.report_success", { name: contact.name }), [
            { text: t("common.ok"), onPress: () => router.replace("/settings/blocked-users" as any) }
        ]);
    };

    const handleReportTextChange = (text: string) => {
        if (text.length <= 500) {
            setReportText(text);
        } else {
            // Eğer 500 harfi geçtiyse, sadece ilk 500 harfi al
            setReportText(text.slice(0, 500));
        }
    };

    const sendMessage = () => {
        if (!inputText.trim()) return;

        // 🔐 Gönderme izni kontrolü
        if (msgPermission && !msgPermission.can_send) {
            Alert.alert(
                t("chat.restricted_title", "Mesaj Gönderilemedi"),
                msgPermission.reason === "awaiting_reply"
                    ? t("chat.awaiting_reply", "Karşı taraf henüz cevap vermedi. Cevap verene kadar yeni mesaj gönderemezsiniz.")
                    : t("chat.cannot_send", "Bu kullanıcıya mesaj gönderme izniniz yok."),
            );
            return;
        }

        lightImpact();
        const newMsg: Message = {
            id: String(Date.now()),
            text: inputText.trim(),
            isMine: true,
            timestamp: new Date().toLocaleTimeString(currentLocale, { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
        };
        setMessages((prev) => [...prev, newMsg]);
        // İzin sayacını optimistik olarak artır
        if (msgPermission) {
            setMsgPermission(prev => prev ? { ...prev, messages_sent_count: prev.messages_sent_count + 1, can_send: false, awaiting_reply: true } : prev);
        }
        // Store'a ve conversations'a yaz
        if (chatId) {
            useChatMessagesStore.getState().addMessage(chatId, {
                id: newMsg.id,
                text: newMsg.text,
                isMine: true,
                timestamp: new Date().toISOString(),
                status: "sent",
            });
            const convs = useMessagesStore.getState().conversations;
            if (!convs.some(c => c.id === chatId)) {
                // Konuşma listede yoksa yeni oluştur
                useMessagesStore.getState().addConversation({
                    id: chatId,
                    name: contact.name || "Kullanıcı",
                    username: "", // Opsiyonel
                    avatar: contact.avatar || "",
                    lastMessage: newMsg.text,
                    lastMessageSender: "me",
                    timestamp: newMsg.timestamp,
                    unread: false,
                    isOnline: contact.isOnline || false,
                    lastMessageAt: Date.now(),
                });
            } else {
                useMessagesStore.getState().updateLastMessageAt(chatId, newMsg.text, newMsg.timestamp, "me");
                const c = convs.find(c => c.id === chatId);
                if (c?.isArchived) useMessagesStore.getState().unarchiveConversation(chatId);
            }
        }
        // Backend'e gönder ve ID'yi gerçek db ID'si ile değiştir
        if (isBackendConv) {
            backendSendMessage(numericConvId, { content: newMsg.text })
                .then((sent) => {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === newMsg.id
                                ? { ...m, id: String(sent.id), status: 'delivered' as const }
                                : m
                        )
                    );
                })
                .catch((e) =>
                    logger.warn("[ChatScreen] Backend mesaj gönderilemedi", e)
                );
        }
        setInputText("");
    };

    const handleCameraPress = () => {
        // 🔐 Medya izni kontrolü
        if (msgPermission && !msgPermission.can_send_media) {
            Alert.alert(
                t("chat.restricted_title", "Medya Gönderilemedi"),
                t("chat.media_restricted", "Bu konuşmada medya gönderebilmek için karşılıklı takipleşmeniz gerekiyor.")
            );
            return;
        }
        Alert.alert(
            t("chat.send_photo", "Fotoğraf Gönder"),
            t("chat.photo_options_desc", "Lütfen bir seçenek belirleyin:"),
            [
                {
                    text: t("chat.camera", "Kamera"),
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert(t("common.error"), t("chat.camera_perm_err"));
                                return;
                            }
                            const result = await ImagePicker.launchCameraAsync({
                                mediaTypes: ['images'],
                                quality: 0.8,
                            });
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                // Önizleme göster — kullanıcı onaylasın
                                setPreviewUri(result.assets[0].uri);
                            }
                        } catch (error) {
                            Alert.alert(t("common.error"), t("chat.camera_err"));
                        }
                    }
                },
                {
                    text: t("chat.gallery", "Galeri"),
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert(t("common.error"), t("chat.gallery_perm_err"));
                                return;
                            }
                            const result = await ImagePicker.launchImageLibraryAsync({
                                mediaTypes: ['images'],
                                quality: 0.8,
                            });
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                // Önizleme göster — kullanıcı onaylasın
                                setPreviewUri(result.assets[0].uri);
                            }
                        } catch (error) {
                            Alert.alert(t("common.error"), t("chat.gallery_err"));
                        }
                    }
                },
                {
                    text: t("common.cancel"),
                    style: "cancel"
                }
            ]
        );
    };

    const sendImageMessage = async (uri: string) => {
        if (!isBackendConv) return;

        // Önizleme modalını kapat
        setPreviewUri(null);

        // Fotoğrafla birlikte yazı gönderilmişse al
        const captionText = inputText.trim();

        // Optimistic UI: hemen göster
        const tempId = `temp_img_${Date.now()}`;
        const optimisticMsg: Message = {
            id: tempId,
            text: captionText,
            imageUri: uri,
            isMine: true,
            timestamp: new Date().toLocaleTimeString(currentLocale, { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        // Store'a kaydet (navigasyon sonrası kaybolmasın)
        if (chatId) {
            useChatMessagesStore.getState().addMessage(chatId, {
                id: tempId,
                text: captionText,
                isMine: true,
                timestamp: new Date().toISOString(),
                imageUri: uri,
                status: "sent",
            });
        }

        setInputText('');

        try {
            // 1. Görseli backend'e upload et
            const filename = uri.split('/').pop() || 'photo.jpg';
            const match = /\.([^.]+)$/.exec(filename);
            const type = match ? `image/${match[1].toLowerCase().replace('jpg', 'jpeg')}` : 'image/jpeg';

            const { apiUploadFile } = await import('@/src/utils/apiClient');
            const uploadResult = await apiUploadFile('/upload/image', { uri, name: filename, type });
            const mediaUrl: string = uploadResult.url;

            // 2. Backend'e mesaj olarak gönder
            const sent = await backendSendMessage(numericConvId, {
                content: captionText || t('chat.photo', '📷 Fotoğraf'),
                message_type: "image",
                media_url: mediaUrl,
            });

            // 3. Optimistic mesajı gerçek ID ile güncelle
            const realId = String(sent.id);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === tempId
                        ? { ...m, id: realId, imageUri: mediaUrl.startsWith('/') ? `${API_BASE_URL}${mediaUrl}` : mediaUrl, status: 'delivered' as const }
                        : m
                )
            );

            // Store'daki temp mesajı da gerçek ID ile güncelle
            if (chatId) {
                const store = useChatMessagesStore.getState();
                const existing = store.messagesByChat[chatId] ?? [];
                const updated = existing.map((m) =>
                    m.id === tempId
                        ? { ...m, id: realId, imageUri: mediaUrl.startsWith('/') ? `${API_BASE_URL}${mediaUrl}` : mediaUrl, status: 'delivered' as const }
                        : m
                );
                useChatMessagesStore.setState({ messagesByChat: { ...store.messagesByChat, [chatId]: updated } });
            }

            // conversations store güncelle
            const textToSave = t('chat.photo', 'Fotoğraf 📷');
            setTimeout(() => {
                useMessagesStore.getState().updateLastMessageAt(chatId, textToSave, optimisticMsg.timestamp, 'me');
            }, 0);
        } catch (err) {
            logger.error('[sendImageMessage] Upload failed:', err);
            // Hatalı optimistic mesajı kaldır
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
            if (chatId) {
                const store = useChatMessagesStore.getState();
                const existing = store.messagesByChat[chatId] ?? [];
                useChatMessagesStore.setState({
                    messagesByChat: { ...store.messagesByChat, [chatId]: existing.filter((m) => m.id !== tempId) }
                });
            }
            Alert.alert(t('common.error', 'Hata'), t('chat.photo_send_err', 'Fotoğraf gönderilemedi.'));
        }
    };

    const handleDeleteMessage = (msgId: string) => {
        lightImpact();
        Alert.alert(
            t("chat.delete_message_title", "Mesajı Sil"),
            t("chat.delete_message_desc", "Bu mesajı silmek istediğinize emin misiniz?"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () => {
                        setMessages((prev) => prev.filter((m) => m.id !== msgId));
                        // Store'dan da sil
                        if (chatId) {
                            const store = useChatMessagesStore.getState();
                            const existing = store.messagesByChat[chatId] ?? [];
                            const filtered = existing.filter((m) => m.id !== msgId);
                            useChatMessagesStore.setState({
                                messagesByChat: {
                                    ...store.messagesByChat,
                                    [chatId]: filtered,
                                },
                            });
                        }
                    },
                },
            ]
        );
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isLast = messages[messages.length - 1]?.id === item.id;

        // Tik durumu: sadece kendi mesajlarında
        let tickIcon = null;
        if (item.isMine) {
            const isRead = item.status === 'read' || item.seen || (isLast && lastSeenId === item.id);
            const isDelivered = item.status === 'delivered';
            const readColor = "#2196F3";     // Mavi → görüldü
            const defaultColor = "rgba(255,255,255,0.6)"; // Soluk → gönderildi/teslim edildi

            if (isRead) {
                // Çift mavi tik → görüldü
                tickIcon = <MaterialCommunityIcons name="check-all" size={16} color={readColor} style={{ marginLeft: 4 }} />;
            } else if (isDelivered) {
                // Çift gri tik → teslim edildi (karşı tarafa ulaştı, okumadı)
                tickIcon = <MaterialCommunityIcons name="check-all" size={16} color={defaultColor} style={{ marginLeft: 4 }} />;
            } else {
                // Tek gri tik → gönderildi (sunucuya ulaştı)
                tickIcon = <MaterialCommunityIcons name="check" size={16} color={defaultColor} style={{ marginLeft: 4 }} />;
            }
        }

        const longPressHandler = () => handleDeleteMessage(item.id);

        // Mekan kartı mesajı
        if (item.placeCard) {
            return (
                <TouchableOpacity style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]} onLongPress={longPressHandler} activeOpacity={0.9}>
                    <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                lightImpact();
                                if (item.placeCard) {
                                    useAppStore.getState().setPendingPlaceName(item.placeCard.name);
                                }
                                router.replace("/(tabs)/explore" as any);
                            }}
                            style={[
                                styles.newPlaceCardBubble,
                                {
                                    backgroundColor: item.isMine ? "#ffffff" : colors.surface.elevated,
                                    borderColor: colors.surface.border,
                                },
                            ]}
                        >
                            <Image
                                source={{ uri: item.placeCard.image }}
                                style={styles.placeCardImage}
                                contentFit="cover"
                            />
                            <View style={styles.placeCardInfo}>
                                <View style={styles.placeCardNameRow}>
                                    <IconSymbol
                                        name="mappin.and.ellipse"
                                        size={14}
                                        color={item.isMine ? "#2ecc71" : colors.accent.primary}
                                    />
                                    <Text
                                        style={[
                                            styles.placeCardName,
                                            { color: item.isMine ? "#000000" : colors.text.primary },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {item.placeCard.name}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.placeCardAddr,
                                        { color: item.isMine ? "rgba(0,0,0,0.6)" : colors.text.tertiary },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.placeCard.address}
                                </Text>
                                <Text style={[styles.placeCardHint, { color: item.isMine ? "#2ecc71" : colors.accent.primary }]}>
                                    {t("chat.open_in_explore", "Keşfet'te aç →")}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                            <Text
                                style={[
                                    styles.newMsgTime,
                                    { color: colors.text.tertiary },
                                ]}
                            >
                                {item.timestamp}
                            </Text>
                            {item.isMine && tickIcon}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // ── Hikayeye Yanıt Mesajı (AŞAMA 5) ──
        if (item.isStoryReply) {
            // Hikayenin süresi dolmuş / silinmiş mi? (snapshot URL yoksa → expired)
            const isStoryExpired = !item.storySnapshotUrl;

            return (
                <TouchableOpacity
                    style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}
                    onLongPress={longPressHandler}
                    activeOpacity={0.9}
                >
                    <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <View
                            style={[
                                styles.storyReplyCard,
                                {
                                    backgroundColor: item.isMine ? "#ffffff" : colors.surface.elevated,
                                    borderColor: item.isMine ? 'rgba(0,0,0,0.08)' : colors.surface.border,
                                    opacity: isStoryExpired ? 0.7 : 1,
                                },
                            ]}
                        >
                            {/* Hikaye Önizleme Bandı */}
                            {isStoryExpired ? (
                                // Hikaye silindi / süresi doldu
                                <View style={[styles.storyReplyThumb, styles.storyReplyThumbExpired]}>
                                    <IconSymbol name="clock.badge.xmark" size={22} color="rgba(255,255,255,0.5)" />
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: item.storySnapshotUrl! }}
                                    style={styles.storyReplyThumb}
                                    contentFit="cover"
                                />
                            )}
                            <View style={styles.storyReplyContent}>
                                <Text
                                    style={[
                                        styles.storyReplyLabel,
                                        { color: item.isMine ? 'rgba(0,0,0,0.45)' : colors.text.tertiary },
                                    ]}
                                >
                                    {isStoryExpired
                                        ? 'Bu hikayeye artık ulaşılamıyor'
                                        : (item.isMine ? 'Hikayeye yanıt verdim' : 'Hikayenize yanıt verdi')
                                    }
                                </Text>
                                <Text
                                    style={[
                                        styles.newMsgText,
                                        { color: item.isMine ? '#000' : colors.text.primary },
                                    ]}
                                >
                                    {item.text}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>
                                {item.timestamp}
                            </Text>
                            {item.isMine && tickIcon}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // Paylaşılan gönderi mesajı
        if (item.sharedPostId && item.imageUri) {
            return (
                <TouchableOpacity style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]} onLongPress={longPressHandler} activeOpacity={0.9}>
                    <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                lightImpact();
                                useAppStore.getState().setPendingSharedPostId(item.sharedPostId!);
                                router.push(`/(tabs)/feed` as any);
                            }}
                            style={[
                                styles.newPlaceCardBubble,
                                {
                                    backgroundColor: item.isMine ? "#ffffff" : colors.surface.elevated,
                                    borderColor: colors.surface.border,
                                },
                            ]}
                        >
                            <Image
                                source={{ uri: item.imageUri }}
                                style={styles.placeCardImage}
                                contentFit="cover"
                            />
                            <View style={styles.placeCardInfo}>
                                <View style={styles.placeCardNameRow}>
                                    <IconSymbol
                                        name="photo.on.rectangle"
                                        size={14}
                                        color={item.isMine ? "#2ecc71" : colors.accent.primary}
                                    />
                                    <Text
                                        style={[
                                            styles.placeCardName,
                                            { color: item.isMine ? "#000000" : colors.text.primary },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {item.text}
                                    </Text>
                                </View>
                                <Text style={[styles.placeCardHint, { color: item.isMine ? "#2ecc71" : colors.accent.primary }]}>
                                    {t("chat.open_post", "Gönderiyi aç →")}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>
                                {item.timestamp}
                            </Text>
                            {item.isMine && tickIcon}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        // Fotoğraflı mesaj
        if (item.imageUri) {
            return (
                <TouchableOpacity
                    style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}
                    onLongPress={longPressHandler}
                    activeOpacity={0.9}
                >
                    <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <TouchableOpacity
                            activeOpacity={0.92}
                            onPress={() => openImageViewer(item.imageUri!)}
                            onLongPress={longPressHandler}
                            style={[styles.imageBubble, item.isMine ? { backgroundColor: "#ffffff" } : { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, borderWidth: 1 }]}
                        >
                            <Image
                                source={{ uri: item.imageUri }}
                                style={styles.messageImage}
                                contentFit="cover"
                            />
                            {item.text ? (
                                <Text style={[styles.newMsgText, { color: item.isMine ? "#000000" : colors.text.primary, marginTop: 8 }]}>
                                    {item.text}
                                </Text>
                            ) : null}
                        </TouchableOpacity>
                        <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                            <Text style={[styles.newMsgTime, { color: colors.text.tertiary }]}>
                                {item.timestamp}
                            </Text>
                            {item.isMine && tickIcon}
                        </View>
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <TouchableOpacity style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]} onLongPress={longPressHandler} activeOpacity={0.9}>
                <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                    <View
                        style={[
                            styles.newBubble,
                            item.isMine
                                ? { backgroundColor: "#ffffff" }
                                : { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, borderWidth: 1 },
                        ]}
                    >
                        <Text
                            style={[
                                styles.newMsgText,
                                { color: item.isMine ? "#000000" : colors.text.primary },
                            ]}
                        >
                            {item.text}
                        </Text>
                    </View>
                    <View style={[styles.newTimeRow, item.isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                        <Text
                            style={[
                                styles.newMsgTime,
                                { color: colors.text.tertiary },
                            ]}
                        >
                            {item.timestamp}
                        </Text>
                        {item.isMine && tickIcon}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
        >
            {/* ── Header ── */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + 4,
                        borderBottomColor: colors.surface.border,
                        backgroundColor: colors.background.primary,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    hitSlop={12}
                    activeOpacity={0.7}
                    onPress={() => {
                        lightImpact();
                        router.back();
                    }}
                >
                    <IconSymbol name="chevron.left" size={26} color={colors.text.primary} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.headerProfile} 
                    activeOpacity={0.8}
                    onPress={() => {
                        // Önce gerçek backend user ID'yi dene, yoksa mock data için fallback kullan
                        const userId = contact.targetUserId || _parseTargetUserId(resolvedChatId);
                        if (userId) {
                            router.push(`/user/${userId}` as any);
                        }
                    }}
                >
                    <Image source={{ uri: contact.avatar }} style={styles.headerAvatar} contentFit="cover" />
                    <View>
                        <Text style={[styles.headerName, { color: colors.text.primary }]} numberOfLines={1}>
                            {contact.name}
                        </Text>
                        <Text style={[styles.headerStatus, { color: contact.isOnline ? "#2ecc71" : colors.text.tertiary }]}>
                            {contact.isOnline ? t("chat.online", "Çevrimiçi") : t("chat.last_seen_today", "Son görülme: bugün")}
                        </Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    {isMatch && !isRevealed && (
                        <TouchableOpacity
                            hitSlop={8}
                            activeOpacity={0.7}
                            onPress={handleRevealToggle}
                            style={{ marginRight: 16 }}
                        >
                            <IconSymbol
                                name={revealRequestedByMe ? "heart.fill" : "heart"}
                                size={24}
                                color={revealRequestedByMe ? colors.semantic.error : colors.text.primary}
                            />
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        hitSlop={8}
                        activeOpacity={0.7}
                        onPress={() => {
                            lightImpact();
                            setIsOptionsVisible(true);
                        }}
                    >
                        <IconSymbol name="ellipsis" size={24} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Messages ── */}
            <FlatList
                ref={flatListRef}
                style={{ flex: 1 }}
                data={[...visibleMessages].reverse()}
                inverted={true}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={[styles.messageList, { paddingTop: 20 }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => Keyboard.dismiss()}
            />

            {/* ── Kısıtlı Mod Bilgi Banner'ı ── */}
            {msgPermission && !msgPermission.can_send_media && isBackendConv && (
                <View style={[styles.restrictionBanner, { backgroundColor: colors.surface.elevated, borderTopColor: colors.surface.border }]}>
                    <IconSymbol name="lock.fill" size={13} color={colors.text.tertiary} />
                    <Text style={[styles.restrictionText, { color: colors.text.tertiary }]}>
                        {msgPermission.awaiting_reply
                            ? t("chat.restriction_awaiting", "Cevap bekleniyor — yeni mesaj gönderilemez")
                            : msgPermission.reason === "private_account_no_mutual"
                            ? t("chat.restriction_private", "Gizli hesap — mesaj göndermek için takipleşin")
                            : t("chat.restriction_limited", "Kısıtlı mod — karşılıklı takipleşince kısıtlamalar kalkar")}
                    </Text>
                </View>
            )}

            {/* ── Input Bar ── */}
            <View
                style={[
                    styles.inputBar,
                    {
                        paddingBottom: insets.bottom || 12,
                        backgroundColor: colors.background.primary,
                        borderTopColor: colors.surface.border,
                    },
                ]}
            >
                <View style={[styles.inputContainer, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
                    {/* Kamera butonu — medya kısıtlıysa soluk göster */}
                    <TouchableOpacity
                        style={[styles.cameraBtn, msgPermission && !msgPermission.can_send_media && { opacity: 0.35 }]}
                        activeOpacity={0.7}
                        onPress={handleCameraPress}
                    >
                        <IconSymbol name="camera.fill" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.textInput, { color: colors.text.primary }]}
                        placeholder={
                            msgPermission && !msgPermission.can_send
                                ? t("chat.input_locked", "Mesaj gönderme kısıtlandı…")
                                : t("chat.type_message")
                        }
                        placeholderTextColor={colors.text.tertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        cursorColor={colors.accent.primary}
                        editable={!msgPermission || msgPermission.can_send}
                    />
                </View>

                {inputText.trim() ? (
                    <TouchableOpacity
                        style={styles.sendButton}
                        activeOpacity={0.7}
                        onPress={sendMessage}
                    >
                        <IconSymbol name="paperplane" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* ── Options Modal ── */}
            <Modal
                visible={isOptionsVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsOptionsVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsOptionsVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={[styles.optionsModal, { backgroundColor: colors.surface.elevated }]}>
                                <TouchableOpacity style={styles.optionBtn} onPress={handleBlock}>
                                    <Text style={[styles.optionText, { color: "#e74c3c" }]}>{t("chat.block")}</Text>
                                </TouchableOpacity>
                                <View style={[styles.separator, { backgroundColor: colors.surface.border }]} />
                                <TouchableOpacity
                                    style={styles.optionBtn}
                                    onPress={() => {
                                        setIsOptionsVisible(false);
                                        setTimeout(() => setIsReportVisible(true), 300);
                                    }}
                                >
                                    <Text style={[styles.optionText, { color: "#e74c3c" }]}>{t("chat.report")}</Text>
                                </TouchableOpacity>
                                <View style={[styles.separator, { backgroundColor: colors.surface.border }]} />
                                <TouchableOpacity style={styles.optionBtn} onPress={() => setIsOptionsVisible(false)}>
                                    <Text style={[styles.optionText, { color: colors.text.primary, fontWeight: "500" }]}>{t("chat.cancel")}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* ── Report Modal ── */}
            <Modal
                visible={isReportVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setIsReportVisible(false);
                    setReportText("");
                }}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={styles.reportModalContainer}>
                        <View style={[styles.reportModalContent, { backgroundColor: colors.surface.elevated }]}>
                            <View style={[styles.reportHeader, { borderBottomColor: colors.surface.border }]}>
                                <Text style={[styles.reportTitle, { color: colors.text.primary }]}>{t("chat.report_user")}</Text>
                                <TouchableOpacity onPress={() => {
                                    setIsReportVisible(false);
                                    setReportText("");
                                }}>
                                    <IconSymbol name="xmark" size={24} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.reportDesc, { color: colors.text.secondary }]}>
                                {t("chat.report_desc", { name: contact.name })}
                            </Text>
                            <View style={[styles.reportInputWrapper, { borderColor: colors.surface.border, backgroundColor: colors.background.primary }]}>
                                <TextInput
                                    style={[styles.reportInput, { backgroundColor: colors.background.secondary, color: colors.text.primary }]}
                                    placeholder={t("chat.report_ph")}
                                    placeholderTextColor={colors.text.tertiary}
                                    multiline
                                    value={reportText}
                                    onChangeText={handleReportTextChange}
                                    textAlignVertical="top"
                                    cursorColor={colors.accent.primary}
                                />
                            </View>
                            <Text style={[styles.wordCount, { color: reportText.length > 500 ? colors.semantic.error : colors.text.tertiary }]}>
                                {t("chat.char_left")} {500 - reportText.length}
                            </Text>

                            <TouchableOpacity
                                style={[styles.submitReportBtn, { backgroundColor: reportText.trim().length === 0 ? colors.surface.border : colors.accent.primary }]}
                                activeOpacity={0.8}
                                onPress={handleReport}
                                disabled={reportText.trim().length === 0}
                            >
                                <Text style={[styles.submitReportText, { color: reportText.trim().length === 0 ? colors.text.tertiary : "#FFFFFF" }]}>
                                    {t("chat.send")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* ── Fotoğraf Önizleme Modalı (gönderilmeden önce) ── */}
            <Modal
                visible={!!previewUri}
                transparent
                animationType="slide"
                onRequestClose={() => setPreviewUri(null)}
            >
                <View style={styles.previewModalOverlay}>
                    <View style={styles.previewModalContent}>
                        {/* Üst bar */}
                        <View style={styles.previewTopBar}>
                            <TouchableOpacity onPress={() => setPreviewUri(null)} hitSlop={12}>
                                <Text style={styles.previewCancel}>İptal</Text>
                            </TouchableOpacity>
                            <Text style={styles.previewTitle}>Fotoğraf Gönder</Text>
                            <TouchableOpacity
                                onPress={() => previewUri && sendImageMessage(previewUri)}
                                hitSlop={12}
                                style={styles.previewSendBtn}
                            >
                                <Text style={styles.previewSendText}>Gönder</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Önizleme Görseli */}
                        {previewUri && (
                            <Image
                                source={{ uri: previewUri }}
                                style={styles.previewImage}
                                contentFit="contain"
                            />
                        )}

                        {/* Caption alanı */}
                        <View style={[styles.previewCaptionBar, { backgroundColor: colors.surface.elevated, borderTopColor: colors.surface.border }]}>
                            <TextInput
                                style={[styles.previewCaptionInput, { color: colors.text.primary }]}
                                placeholder="Açıklama ekle..."
                                placeholderTextColor={colors.text.tertiary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                                cursorColor={colors.accent.primary}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── Tam Ekran Görsel Görüntüleyici ── */}
            <Modal
                visible={!!selectedImageUri}
                transparent={true}
                animationType="none"
                statusBarTranslucent
                onRequestClose={closeImageViewer}
            >
                <Animated.View style={[styles.imageViewerOverlay, animatedOverlayStyle]}>
                    {/* Kapatma Butonu */}
                    <TouchableOpacity
                        style={styles.imageViewerCloseBtn}
                        onPress={closeImageViewer}
                        activeOpacity={0.7}
                        hitSlop={16}
                    >
                        <View style={styles.imageViewerCloseBtnInner}>
                            <Text style={styles.imageViewerCloseX}>✕</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Pinch/Pan/DoubleTap Gesture Alanı */}
                    <GestureDetector gesture={allGestures}>
                        <Animated.View style={[styles.imageViewerContainer, animatedImageStyle]}>
                            {selectedImageUri && (
                                <Image
                                    source={{ uri: selectedImageUri }}
                                    style={styles.imageViewerImage}
                                    contentFit="contain"
                                />
                            )}
                        </Animated.View>
                    </GestureDetector>

                    {/* Alt ipucu */}
                    <View style={styles.imageViewerHint}>
                        <Text style={styles.imageViewerHintText}>Aşağı kaydır: kapat  ·  Kıstır: yakınlaştır  ·  Çift dokun: 2.5×</Text>
                    </View>
                </Animated.View>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    /* Header */
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        paddingRight: 8,
    },
    headerProfile: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    headerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    headerName: {
        fontSize: 16,
        fontWeight: "700",
    },
    headerStatus: {
        fontSize: 12,
        fontWeight: "400",
        marginTop: 1,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
    },

    /* Messages */
    messageList: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 8,
    },
    messageBubbleRow: {
        marginBottom: 16,
    },
    myRow: {
        alignItems: "flex-end",
    },
    theirRow: {
        alignItems: "flex-start",
    },
    messageContentWrapper: {
        maxWidth: "80%",
    },
    newBubble: {
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    newMsgText: {
        fontSize: 15,
        lineHeight: 21,
    },
    newTimeRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    newMsgTime: {
        fontSize: 12,
    },

    /* Image Message */
    imageBubble: {
        borderRadius: 12,
        padding: 4,
        overflow: 'hidden',
    },
    messageImage: {
        width: 220,
        height: 220,
        borderRadius: 8,
    },

    /* Place Card */
    newPlaceCardBubble: {
        width: 260,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
    },
    placeCardImage: {
        width: "100%",
        height: 120,
    },
    placeCardInfo: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 4,
    },
    placeCardNameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 2,
    },
    placeCardName: {
        fontSize: 15,
        fontWeight: "700",
        flex: 1,
    },
    placeCardAddr: {
        fontSize: 13,
    },

    placeCardHint: {
        fontSize: 12,
        fontWeight: "600",
        marginTop: 6,
    },

    /* Input Bar */
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 6,
    },
    inputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "flex-end",
        borderRadius: 24,
        borderWidth: 1,
        paddingRight: 6,
        paddingVertical: 4,
        minHeight: 46,
        maxHeight: 120,
    },
    cameraBtn: {
        padding: 10,
        paddingRight: 4,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        paddingHorizontal: 8,
        paddingTop: Platform.OS === "ios" ? 10 : 8,
        paddingBottom: Platform.OS === "ios" ? 10 : 8,
        maxHeight: 100,
    },
    sendButton: {
        padding: 10,
        marginBottom: 1,
    },

    /* Modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    optionsModal: {
        borderRadius: 16,
        overflow: "hidden",
    },
    optionBtn: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    optionText: {
        fontSize: 17,
        fontWeight: "400",
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        width: "100%",
    },

    /* Report Modal */
    reportModalContainer: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 20,
    },
    reportModalContent: {
        borderRadius: 16,
        padding: 20,
        width: "100%",
    },
    reportHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    reportDesc: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    reportInputWrapper: {
        borderWidth: 1,
        borderRadius: 12,
        height: 150,
        marginBottom: 8,
        padding: 12,
    },
    reportInput: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    wordCount: {
        fontSize: 12,
        alignSelf: "flex-end",
        marginBottom: 20,
    },
    submitReportBtn: {
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    submitReportText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    // ── Story Reply Card ──
    storyReplyCard: {
        flexDirection: "row",
        borderRadius: 18,
        borderWidth: 1,
        overflow: "hidden",
        maxWidth: 280,
    },
    storyReplyThumb: {
        width: 72,
        height: 88,
    },
    storyReplyThumbExpired: {
        backgroundColor: '#3a3a3a',
        alignItems: 'center',
        justifyContent: 'center',
    },
    storyReplyContent: {
        flex: 1,
        padding: 10,
        justifyContent: "center",
        gap: 4,
    },
    storyReplyLabel: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.2,
    },

    // ── Preview Modal ──
    previewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        justifyContent: 'flex-end',
    },
    previewModalContent: {
        flex: 1,
        backgroundColor: '#000',
    },
    previewTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    previewCancel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '500',
    },
    previewTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    previewSendBtn: {
        backgroundColor: '#2ecc71',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    previewSendText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    previewImage: {
        flex: 1,
        width: '100%',
    },
    previewCaptionBar: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    previewCaptionInput: {
        fontSize: 15,
        minHeight: 40,
        maxHeight: 100,
    },

    // ── Image Viewer ──
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerContainer: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerImage: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height,
    },
    imageViewerCloseBtn: {
        position: 'absolute',
        top: 52,
        right: 20,
        zIndex: 100,
    },
    imageViewerCloseBtnInner: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    imageViewerCloseX: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 18,
    },
    imageViewerHint: {
        position: 'absolute',
        bottom: 36,
        alignSelf: 'center',
    },
    imageViewerHintText: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 12,
        textAlign: 'center',
    },
    restrictionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    restrictionText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
});
