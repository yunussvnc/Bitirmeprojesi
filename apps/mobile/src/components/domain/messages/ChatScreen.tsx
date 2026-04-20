/**
 * Chat Screen
 *
 * Bireysel sohbet ekranı — mekan paylaşımı odaklı mesajlaşma.
 */

import React, { useState, useRef, useEffect } from "react";
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
} from "react-native";
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
import { getMessages as fetchBackendMessages, sendMessage as backendSendMessage, markMessagesRead } from "@/src/services/messageService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { logger } from "@/src/utils/logger";
import { useTranslation } from "react-i18next";

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
}

/* ── Dummy Contact Data ── */
const CONTACTS: Record<string, { name: string; avatar: string; isOnline: boolean }> = {
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
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const [inputText, setInputText] = useState("");
    const [lastSeenId, setLastSeenId] = useState<string | null>(null);
    const [isOptionsVisible, setIsOptionsVisible] = useState(false);
    const [isReportVisible, setIsReportVisible] = useState(false);
    const [reportText, setReportText] = useState("");
    const flatListRef = useRef<FlatList>(null);
    const didInitialScrollRef = useRef(false);
    const resolvedChatId = chatId || "1";
    const currentUser = useAuthStore((s) => s.user);
    const { t } = useTranslation();

    // BUG-11: conversation_id, ya tamamen sayısal ya da "match_xxx_userId" formatında olabilir.
    // Sayısal ise doğrudan backend conversation id olarak kullan.
    const numericConvId = parseInt(resolvedChatId, 10);
    const isBackendConv = !isNaN(numericConvId) && resolvedChatId === String(numericConvId);

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
                                return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
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

    // Backend'den mesaj geçmişini yükle (sayısal conversation id ise)
    useEffect(() => {
        if (!isBackendConv) return;
        (async () => {
            try {
                const res = await fetchBackendMessages(numericConvId, 1, 100);
                if (res.items.length > 0) {
                    const myId = currentUser?.id;
                    const backendMsgs: Message[] = res.items.map((m) => ({
                        id: String(m.id),
                        text: m.content,
                        isMine: m.sender_id === myId,
                        timestamp: (() => {
                            try {
                                return new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                            } catch { return ""; }
                        })(),
                        status: m.is_read ? "read" as const : "delivered" as const,
                        sharedPostId: m.shared_post_id ?? undefined,
                        imageUri: m.media_url ?? undefined,
                    }));
                    setMessages(backendMsgs);
                }
                // Okundu bildir
                markMessagesRead(numericConvId).catch(() => { });
            } catch (e) {
                // 403 = conversation belongs to another user (expected for seed data)
                // Only log at debug level to avoid scary console errors
                if (__DEV__) logger.warn("[ChatScreen] Could not load messages for conv", numericConvId);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isBackendConv, numericConvId]);

    const storeConversation = useMessagesStore((state) => state.conversations.find(c => c.id === resolvedChatId));

    const contact = CONTACTS[resolvedChatId] || (storeConversation ? {
        name: storeConversation.name,
        avatar: storeConversation.avatar,
        isOnline: storeConversation.isOnline
    } : CONTACTS["1"]);

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
        lightImpact();
        const newMsg: Message = {
            id: String(Date.now()),
            text: inputText.trim(),
            isMine: true,
            timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
        };
        setMessages((prev) => [...prev, newMsg]);
        // Store'a ve conversations'a yaz
        if (chatId) {
            useChatMessagesStore.getState().addMessage(chatId, {
                id: newMsg.id,
                text: newMsg.text,
                isMine: true,
                timestamp: new Date().toISOString(),
                status: "sent",
            });
            useMessagesStore.getState().updateLastMessageAt(chatId, newMsg.text, newMsg.timestamp, "me");
        }
        // Backend'e fire-and-forget sync
        if (isBackendConv) {
            backendSendMessage(numericConvId, { content: newMsg.text }).catch((e) =>
                logger.warn("[ChatScreen] Backend mesaj gönderilemedi", e)
            );
        }
        setInputText("");
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleCameraPress = () => {
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
                                sendImageMessage(result.assets[0].uri);
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
                                mediaTypes: ['images', 'videos'],
                                quality: 0.8,
                            });
                            if (!result.canceled && result.assets && result.assets.length > 0) {
                                sendImageMessage(result.assets[0].uri);
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

    const sendImageMessage = (uri: string) => {
        const newMsg: Message = {
            id: String(Date.now()),
            text: inputText.trim(),
            imageUri: uri,
            isMine: true,
            timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
            status: "sent",
        };
        setMessages((prev) => [...prev, newMsg]);
        // Store'a ve conversations'a yaz
        if (chatId) {
            useChatMessagesStore.getState().addMessage(chatId, {
                id: newMsg.id,
                text: newMsg.text || t("chat.photo", "Fotoğraf 📷"),
                isMine: true,
                timestamp: new Date().toISOString(),
                imageUri: uri,
                status: "sent",
            });
            useMessagesStore.getState().updateLastMessageAt(chatId, newMsg.text || t("chat.photo", "Fotoğraf 📷"), newMsg.timestamp, "me");
        }
        setInputText("");
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
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
            const tickColor = "#2ecc71";

            if (isRead) {
                tickIcon = <MaterialCommunityIcons name="check-all" size={16} color={tickColor} style={{ marginLeft: 4 }} />;
            } else if (isDelivered) {
                tickIcon = <MaterialCommunityIcons name="check-all" size={16} color={tickColor} style={{ marginLeft: 4 }} />;
            } else {
                tickIcon = <MaterialCommunityIcons name="check" size={16} color={tickColor} style={{ marginLeft: 4 }} />;
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
                <TouchableOpacity style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]} onLongPress={longPressHandler} activeOpacity={0.9}>
                    <View style={[styles.messageContentWrapper, item.isMine ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
                        <View style={[styles.imageBubble, item.isMine ? { backgroundColor: "#ffffff" } : { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border, borderWidth: 1 }]}>
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

                <TouchableOpacity style={styles.headerProfile} activeOpacity={0.8}>
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
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onScrollBeginDrag={() => Keyboard.dismiss()}
                onContentSizeChange={() => {
                    if (!didInitialScrollRef.current) {
                        didInitialScrollRef.current = true;
                        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 50);
                    }
                }}
            />

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
                    <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.7} onPress={handleCameraPress}>
                        <IconSymbol name="camera.fill" size={20} color={colors.accent.primary} />
                    </TouchableOpacity>

                    <TextInput
                        style={[styles.textInput, { color: colors.text.primary }]}
                        placeholder={t("chat.type_message")}
                        placeholderTextColor={colors.text.tertiary}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={1000}
                        cursorColor={colors.accent.primary}
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
                            <View style={[styles.reportHeaderRow, { borderBottomColor: colors.surface.border }]}>
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
                            <Text style={[styles.charCountText, { color: reportText.length > 500 ? colors.semantic.error : colors.text.tertiary }]}>
                                {t("chat.char_left")} {500 - reportText.length}
                            </Text>

                            <TouchableOpacity
                                style={[styles.reportSubmitBtn, { backgroundColor: reportText.trim().length === 0 ? colors.surface.border : colors.accent.primary }]}
                                activeOpacity={0.8}
                                onPress={handleReport}
                                disabled={reportText.trim().length === 0}
                            >
                                <Text style={[styles.reportSubmitText, { color: reportText.trim().length === 0 ? colors.text.tertiary : "#FFFFFF" }]}>
                                    {t("chat.send")}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
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
});
