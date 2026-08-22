/**
 * Chat Screen
 *
 * Bireysel sohbet ekranı — mekan paylaşımı odaklı mesajlaşma.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
    Keyboard,
} from "react-native";
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { MessageBubble } from "./MessageBubble";
import { lightImpact, success } from "@/src/utils/haptics";
import { useAppStore } from "@/src/store/useAppStore";
import { useMessagesStore } from "@/src/store/useMessagesStore";
import { useChatMessagesStore } from "@/src/store/useChatMessagesStore";
import * as ImagePicker from 'expo-image-picker';
import { toggleBlockUser, createReport } from "@/src/services/moderationService";
import { getMessages as fetchBackendMessages, sendMessage as backendSendMessage, markMessagesRead, getConversationPermission, type ConversationPermission } from "@/src/services/messageService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { logger } from "@/src/utils/logger";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "@/src/constants/api";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { useIslandStore } from '@/src/store/useIslandStore';
import { ChatActionModals } from './chat-screen/ChatActionModals';
import { ChatImageViewerModal } from './chat-screen/ChatImageViewerModal';
import { styles } from './chat-screen/styles';

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
    const { chatId, name: nameParam, avatar: avatarParam, targetUserId: targetUserIdParam } = useLocalSearchParams<{ chatId: string; name?: string; avatar?: string; targetUserId?: string }>();
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

    const openImageViewer = useCallback((uri: string) => {
        setSelectedImageUri(uri);
    }, []);

    const resolvedChatId = chatId || "1";
    const currentUser = useAuthStore((s) => s.user);
    const accessToken = useAuthStore((s) => s.accessToken);
    const { t, i18n } = useTranslation();
    const currentLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';
    // Polling guard: son görülen mesaj ID'sini tutarak gereksiz store güncellemesini önler
    const lastStoredMsgIdRef = useRef<string | null>(null);

    // BUG-14: Sadece "match_xxx_userId" formatındaki ID'ler ya da sayısal olmayan ID'ler dummy sayılır.
    // Sayısal ID'ler artık her zaman backend conversation ID'si olarak işlenir.
    const numericConvId = parseInt(resolvedChatId, 10);
    const isNumeric = !isNaN(numericConvId) && resolvedChatId === String(numericConvId);
    const isBackendConv = isNumeric;

    // Store'dan mesajları mount anında bir kere oku (subscribe etme — hydration loop'u önler)
    const [messages, setMessages] = useState<Message[]>(() => {
        const initial: Message[] = [];
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
                            } catch { return m.timestamp; }
                        })(),
                        imageUri: m.imageUri,
                        status: m.status,
                        sharedPostId: m.sharedPostId,
                    }));
                return [...initial, ...newFromStore];
            }
        } catch { /* ignore */ }
        return initial;
    });

    const storeConversation = useMessagesStore((state) => state.conversations.find(c => c.id === resolvedChatId));

    // Contact bilgisini store veya navigasyon parametrelerinden kararlı biçimde türet.
    const contact = React.useMemo(() => storeConversation ? {
        name: storeConversation.name,
        avatar: storeConversation.avatar,
        isOnline: storeConversation.isOnline,
        targetUserId: storeConversation.targetUserId,
    } : nameParam ? {
        name: decodeURIComponent(nameParam),
        avatar: avatarParam ? decodeURIComponent(avatarParam) : `https://ui-avatars.com/api/?name=${encodeURIComponent(nameParam)}&background=random`,
        isOnline: false,
        targetUserId: targetUserIdParam ? parseInt(targetUserIdParam, 10) : undefined,
    } : {
        name: "Kullanıcı",
        avatar: "https://ui-avatars.com/api/?name=K&background=random",
        isOnline: false,
        targetUserId: undefined,
    }, [avatarParam, nameParam, storeConversation, targetUserIdParam]);

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
        const wsUrl = `${WS_BASE}/api/v1/ws/chat/${numericConvId}?token=${accessToken}`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
        };

        ws.onerror = (e) => {
            console.warn(`❌ Chat WS error:`, e);
        };

        ws.onclose = () => {
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

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
                        
                        // Gerçek bir mesaj geldiğinde Dynamic Island tetikle!
                        useIslandStore.getState().showIsland({
                            title: contact?.name || "Kullanıcı",
                            subtitle: msg.content || "Yeni mesaj",
                            icon: (contact.avatar ? { uri: contact.avatar } : "message") as any,
                            color: "#00C6FF",
                            duration: 4000
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
    }, [accessToken, contact.avatar, contact.name, currentLocale, currentUser?.id, isBackendConv, numericConvId]);

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
                        const backendIdSet = new Set(backendMsgs.map(m => m.id));

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

                        // Henüz backend'de olmayan optimistic (geçici ID'li) mesajları koru.
                        // Bu mesajlar Date.now() ile oluşturulduğundan sayısal ama çok büyük ID'ye sahiptir.
                        // Backend'den onay gelene kadar (polling) bu mesajlar ekrandan kaybolmamalı.
                        const pendingOptimistic = prev.filter(m => {
                            if (backendIdSet.has(m.id)) return false; // Backend zaten biliyor
                            if (!m.isMine) return false;              // Sadece kendi mesajlarımız
                            // Geçici ID kontrolü: "temp_" prefix'i veya çok büyük sayısal ID (Date.now())
                            const isTemp = m.id.startsWith('temp_') || (Number(m.id) > 1_700_000_000_000);
                            return isTemp && m.status === 'sent';
                        });

                        const finalMsgs = pendingOptimistic.length > 0
                            ? [...mergedMsgs, ...pendingOptimistic]
                            : mergedMsgs;

                        // Liste uzunlukları veya statüleri değişmişse listeyi güncelle
                        const isSame = prev.length === finalMsgs.length && prev.every((m, i) =>
                            m.id === finalMsgs[i].id && m.status === finalMsgs[i].status
                        );

                        return isSame ? prev : finalMsgs;
                    });

                    // Store'u render sonrasında güncelle (render sırasında state güncelleme hatasını önler)
                    const latestMsg = backendMsgs[backendMsgs.length - 1];
                    if (latestMsg && backendMsgs.length > 0) {
                        const textToSave = latestMsg.text || (latestMsg.imageUri ? t('chat.photo', 'Fotoğraf 📷') : '');
                        const sender = latestMsg.isMine ? 'me' : contact.name || 'Kullanıcı';
                        // Gerçek backend timestamp'ini kullan — Date.now() kullanma! (sıralama bozulur)
                        const latestItem = res.items[res.items.length - 1];
                        const realTimestamp = latestItem?.created_at ? new Date(latestItem.created_at).getTime() : undefined;

                        setTimeout(() => {
                            const freshConvs = useMessagesStore.getState().conversations;
                            if (!freshConvs.some(c => c.id === chatId)) {
                                useMessagesStore.getState().addConversation({
                                    id: chatId,
                                    name: contact.name || 'Kullanıcı',
                                    username: '',
                                    avatar: contact.avatar || '',
                                    lastMessage: textToSave,
                                    lastMessageSender: sender as any,
                                    timestamp: new Date(latestMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                    unread: !latestMsg.isMine,
                                    isOnline: contact.isOnline || false,
                                    lastMessageAt: realTimestamp ?? Date.now(),
                                });
                                lastStoredMsgIdRef.current = latestMsg.id;
                            } else {
                                const c = freshConvs.find(c => c.id === chatId);
                                const existingTs = c?.lastMessageAt ?? 0;
                                // Sadece yeni bir mesaj geldiyse store'u güncelle
                                // (polling sırasında aynı mesaj tekrar tekrar işlenirse sıralama bozulur)
                                if (lastStoredMsgIdRef.current !== latestMsg.id) {
                                    lastStoredMsgIdRef.current = latestMsg.id;
                                    if (realTimestamp === undefined || realTimestamp >= existingTs) {
                                        useMessagesStore.getState().updateLastMessageAt(
                                            chatId,
                                            textToSave,
                                            new Date(latestMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            sender as any,
                                            undefined,
                                            realTimestamp,
                                        );
                                    }
                                }
                                if (c?.isArchived) useMessagesStore.getState().unarchiveConversation(chatId);
                            }
                        }, 0);
                    }
                }

                // Sadece karşı taraftan gelen ve henüz okunmamış mesaj varsa "okundu" bildirimi at.
                // Polling'de sürekli boş yere POST atılmasını engeller.
                const hasUnreadFromOther = res.items.some((m: any) => m.sender_id !== myId && !m.is_read);
                if (hasUnreadFromOther) {
                    markMessagesRead(numericConvId).catch(() => { });
                }
            } catch {
                if (__DEV__) logger.warn("[ChatScreen] Could not load messages for conv", numericConvId);
            }
        };

        // İlk yükleme
        loadMessages();

        // Arka plan güvenlik ağı polling'i (3 saniye çok agresif, 30 saniyeye çekiyoruz)
        // Çünkü WebSocket zaten anlık mesajları getiriyor.
        const pollInterval = setInterval(loadMessages, 30000);

        return () => clearInterval(pollInterval);
    }, [chatId, contact.avatar, contact.isOnline, contact.name, currentLocale, currentUser?.id, isBackendConv, numericConvId, t]);

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
        // İzin kontrolünü de agresif yapmaya gerek yok, 30 saniye iyidir.
        const permInterval = setInterval(loadPerm, 30000);
        return () => clearInterval(permInterval);

    }, [isBackendConv, numericConvId]);

    const initialMessagesRef = useRef(messages);
    useEffect(() => {
        const initialMessages = initialMessagesRef.current;
        if (initialMessages.length > 0) {
            setLastSeenId(initialMessages[initialMessages.length - 1].id);
        }
    }, []);

    const handleBlock = async () => {
        setIsOptionsVisible(false);
        // BUG-13: Parse user id — prioritize contact.targetUserId
        const targetId = contact.targetUserId || _parseTargetUserId(resolvedChatId);
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
        // BUG-13: Parse user id — prioritize contact.targetUserId
        const targetId = contact.targetUserId || _parseTargetUserId(resolvedChatId);
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
            const blockedMsg = t("chat.blocked_cannot_send");
            const body =
                msgPermission.reason === "blocked"
                    ? blockedMsg
                    : msgPermission.reason === "awaiting_reply"
                        ? t("chat.awaiting_reply")
                        : t("chat.cannot_send");
            Alert.alert(t("chat.restricted_title"), body);
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
        // İzin sayacını optimistik olarak artır (Sadece karşılıklı takip değilse kısıtla)
        if (msgPermission) {
            setMsgPermission(prev => {
                if (!prev) return prev;
                if (prev.reason === "mutual_follow") {
                    return { ...prev, messages_sent_count: prev.messages_sent_count + 1 };
                }
                return { ...prev, messages_sent_count: prev.messages_sent_count + 1, can_send: false, awaiting_reply: true };
            });
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
                    timestamp: new Date(newMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    unread: false,
                    isOnline: contact.isOnline || false,
                    lastMessageAt: Date.now(),
                });
            } else {
                useMessagesStore.getState().updateLastMessageAt(chatId, newMsg.text, new Date(newMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), "me");
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
                        } catch {
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
                        } catch {
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
                useMessagesStore.getState().updateLastMessageAt(chatId, textToSave, new Date(optimisticMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 'me');
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
        
        return (
            <MessageBubble 
                item={item}
                isLast={isLast}
                lastSeenId={lastSeenId}
                colors={colors}
                t={t}
                handleDeleteMessage={handleDeleteMessage}
                openImageViewer={openImageViewer}
                useAppStore={useAppStore}
                router={router}
            />
        );
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={0}
        >
            <Stack.Screen 
                options={{ 
                    gestureEnabled: true, 
                    fullScreenGestureEnabled: true,
                    animation: "slide_from_right" 
                }} 
            />
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

            <ChatActionModals
                contactName={contact.name}
                optionsVisible={isOptionsVisible}
                onCloseOptions={() => setIsOptionsVisible(false)}
                onBlock={handleBlock}
                onOpenReport={() => {
                    setIsOptionsVisible(false);
                    setTimeout(() => setIsReportVisible(true), 300);
                }}
                reportVisible={isReportVisible}
                onCloseReport={() => {
                    setIsReportVisible(false);
                    setReportText('');
                }}
                reportText={reportText}
                onReportTextChange={handleReportTextChange}
                onSubmitReport={handleReport}
                previewUri={previewUri}
                onClosePreview={() => setPreviewUri(null)}
                onSendPreview={sendImageMessage}
                caption={inputText}
                onCaptionChange={setInputText}
            />

            <ChatImageViewerModal
                imageUri={selectedImageUri}
                onDismiss={() => setSelectedImageUri(null)}
            />
        </KeyboardAvoidingView>
    );
}
