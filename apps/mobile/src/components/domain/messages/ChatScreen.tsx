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
import { toggleFollow } from "@/src/services/userService";

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
            Alert.alert("Bekleniyor", "Karşı tarafın da sizi beğenmesi bekleniyor.");
            return;
        }

        useMessagesStore.getState().toggleRevealRequest(resolvedChatId);
        success();

        // Gerçek ID ise API'ye de bildir:
        const maybeConvId = parseInt(resolvedChatId, 10);
        if (!isNaN(maybeConvId)) {
            revealProfile(maybeConvId).catch(console.log);
        }

        // 3 saniye sonra karşı tarafın da beğendiğini simüle edelim (MOCK)
        setTimeout(() => {
            const currentConv = useMessagesStore.getState().conversations.find(c => c.id === resolvedChatId);
            if (currentConv && currentConv.revealRequestedByMe && !currentConv.revealRequestedByThem) {
                useMessagesStore.getState().mockOtherPersonReveal(resolvedChatId);

                // Eğer MOCK Eşleşme ise veya Backend henüz Follow'u yansıtmadıysa Frontend Testini Kurtarmak İçin:
                // `resolvedChatId` örn: "match_123456_5" -> buradaki "5" karşı tarafın user_id'sidir.
                const parts = resolvedChatId.split('_');
                const targetIdStr = parts[parts.length - 1];
                const targetId = parseInt(targetIdStr, 10);

                if (!isNaN(targetId)) {
                    // Backend'e manuel follow the target user.
                    // (Normalde mutual follow backend revealProfile içinden yapılır ama local/mock için garantiye alıyoruz)
                    toggleFollow(targetId).catch(console.log);
                }

                Alert.alert(
                    "Eşleşme Tamamlandı! 🎉",
                    "İki taraf da profilleri beğendi. Gerçek profilleriniz görünür oldu ve artık takipleşiyorsunuz!"
                );
            }
        }, 3000);
    };

    useEffect(() => {
        if (messages.length > 0) {
            setLastSeenId(messages[messages.length - 1].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleBlock = () => {
        setIsOptionsVisible(false);
        // Backend TODO: Engelleme isteği gönder
        success();
        Alert.alert("Başarılı", `${contact.name} engellendi.`, [
            { text: "Tamam", onPress: () => router.replace("/settings/blocked-users" as any) }
        ]);
    };

    const handleReport = () => {
        const charCount = reportText.trim().length;
        if (charCount === 0) {
            Alert.alert("Hata", "Lütfen şikayet nedeninizi yazın.");
            return;
        }
        if (charCount > 500) {
            Alert.alert("Hata", "Şikayet nedeni en fazla 500 harf olabilir.");
            return;
        }

        setIsReportVisible(false);
        // Backend TODO: Şikayet ve kısıtlama isteği gönder
        success();
        Alert.alert("Başarılı", `Şikayetiniz alındı ve ${contact.name} engellendi.`, [
            { text: "Tamam", onPress: () => router.replace("/settings/blocked-users" as any) }
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
        setInputText("");
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleCameraPress = () => {
        Alert.alert(
            "Fotoğraf Gönder",
            "Lütfen bir seçenek belirleyin:",
            [
                {
                    text: "Kamera",
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestCameraPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert("Hata", "Kamera izni gerekiyor.");
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
                            Alert.alert("Hata", "Kamera başlatılamadı (Simülatör kullanıyor olabilirsiniz).");
                        }
                    }
                },
                {
                    text: "Galeri",
                    onPress: async () => {
                        try {
                            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                            if (status !== 'granted') {
                                Alert.alert("Hata", "Galeri izni gerekiyor.");
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
                            Alert.alert("Hata", "Galeri başlatılamadı.");
                        }
                    }
                },
                {
                    text: "İptal",
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
                text: newMsg.text || "Fotoğraf 📷",
                isMine: true,
                timestamp: new Date().toISOString(),
                imageUri: uri,
                status: "sent",
            });
            useMessagesStore.getState().updateLastMessageAt(chatId, newMsg.text || "Fotoğraf 📷", newMsg.timestamp, "me");
        }
        setInputText("");
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const handleDeleteMessage = (msgId: string) => {
        lightImpact();
        Alert.alert(
            "Mesajı Sil",
            "Bu mesajı silmek istediğinize emin misiniz?",
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Sil",
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
                                    Keşfet'te aç →
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
                                    Gönderiyi aç →
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
                            {contact.isOnline ? "Çevrimiçi" : "Son görülme: bugün"}
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
                        placeholder="Mesaj yaz..."
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
                                    <Text style={[styles.optionText, { color: "#e74c3c" }]}>Engelle</Text>
                                </TouchableOpacity>
                                <View style={[styles.separator, { backgroundColor: colors.surface.border }]} />
                                <TouchableOpacity
                                    style={styles.optionBtn}
                                    onPress={() => {
                                        setIsOptionsVisible(false);
                                        setTimeout(() => setIsReportVisible(true), 300); // Wait for modal fade out
                                    }}
                                >
                                    <Text style={[styles.optionText, { color: "#e74c3c" }]}>Şikayet Et ve Kısıtla</Text>
                                </TouchableOpacity>
                                <View style={[styles.separator, { backgroundColor: colors.surface.border }]} />
                                <TouchableOpacity style={styles.optionBtn} onPress={() => setIsOptionsVisible(false)}>
                                    <Text style={[styles.optionText, { color: colors.text.primary, fontWeight: "500" }]}>İptal</Text>
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
                            <View style={styles.reportHeader}>
                                <Text style={[styles.reportTitle, { color: colors.text.primary }]}>Şikayet Nedeni</Text>
                                <TouchableOpacity onPress={() => {
                                    setIsReportVisible(false);
                                    setReportText("");
                                }}>
                                    <IconSymbol name="xmark" size={24} color={colors.text.tertiary} />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.reportDesc, { color: colors.text.secondary }]}>
                                {contact.name} adlı kullanıcıyı neden şikayet etmek istiyorsunuz? (Maksimum 500 harf)
                            </Text>
                            <View style={[styles.reportInputWrapper, { borderColor: colors.surface.border, backgroundColor: colors.background.primary }]}>
                                <TextInput
                                    style={[styles.reportInput, { color: colors.text.primary }]}
                                    placeholder="Lütfen detaylıca açıklayın..."
                                    placeholderTextColor={colors.text.tertiary}
                                    multiline
                                    value={reportText}
                                    onChangeText={handleReportTextChange}
                                    textAlignVertical="top"
                                    cursorColor={colors.accent.primary}
                                />
                            </View>
                            <Text style={[
                                styles.wordCount,
                                { color: reportText.length >= 500 ? "#e74c3c" : colors.text.secondary }
                            ]}>
                                {reportText.length} / 500 harf
                            </Text>

                            <TouchableOpacity
                                style={[styles.submitReportBtn, { backgroundColor: colors.accent.primary }]}
                                activeOpacity={0.8}
                                onPress={handleReport}
                            >
                                <Text style={styles.submitReportText}>Gönder ve Engelle</Text>
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
