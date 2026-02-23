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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { lightImpact } from "@/src/utils/haptics";
import { useAppStore } from "@/src/store/useAppStore";
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    seen?: boolean; // Mesajın görülüp görülmediği
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

/* ── Dummy Messages ── */
const DUMMY_MESSAGES: Message[] = [
    { id: "1", text: "Selam! Nasılsın?", isMine: false, timestamp: "14:20" },
    { id: "2", text: "İyiyim, sen nasılsın?", isMine: true, timestamp: "14:21" },
    {
        id: "3",
        text: "Dün harika bir mekan keşfettim, sana da önermek istedim!",
        isMine: false,
        timestamp: "14:22",
    },
    {
        id: "4",
        text: "",
        isMine: false,
        timestamp: "14:22",
        placeCard: {
            name: "Sortie - Kuruçeşme",
            address: "Kuruçeşme, İstanbul",
            image: "https://picsum.photos/400/200?random=42",
        },
    },
    { id: "5", text: "Vay be çok güzel görünüyor! Boğaz manzarası varmış 😍", isMine: true, timestamp: "14:25" },
    { id: "6", text: "Evet, köprü manzaralı. Bu akşam gidelim mi?", isMine: false, timestamp: "14:26" },
    {
        id: "7",
        text: "",
        isMine: true,
        timestamp: "14:28",
        placeCard: {
            name: "Fakülte Teras - Beyoğlu",
            address: "Beyoğlu, İstanbul",
            image: "https://picsum.photos/400/200?random=88",
        },
    },
    { id: "8", text: "Ben de burası güzel olur dedim, ne dersin? 🎵", isMine: true, timestamp: "14:28" },
    { id: "9", text: "Olur ikisine de bakalım! Haritada kaydediyorum 📌", isMine: false, timestamp: "14:30" },
];

export default function ChatScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { chatId } = useLocalSearchParams<{ chatId: string }>();
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState(DUMMY_MESSAGES);
    const [lastSeenId, setLastSeenId] = useState<string | null>(null);
    const flatListRef = useRef<FlatList>(null);

    const contact = CONTACTS[chatId || "1"] || CONTACTS["1"];

    useEffect(() => {
        // Mesaj ekranı açıldığında en son mesajı seen olarak işaretle
        if (messages.length > 0) {
            setLastSeenId(messages[messages.length - 1].id);
            // TODO: Backend'e seen bilgisi gönder
        }
    }, []);

    const sendMessage = () => {
        if (!inputText.trim()) return;
        lightImpact();
        const newMsg: Message = {
            id: String(Date.now()),
            text: inputText.trim(),
            isMine: true,
            timestamp: new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        // Mekan kartı mesajı
        if (item.placeCard) {
            return (
                <View style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
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
                            styles.placeCardBubble,
                            {
                                backgroundColor: item.isMine ? colors.accent.primary : colors.surface.elevated,
                                borderColor: item.isMine ? "transparent" : colors.surface.border,
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
                                    color={item.isMine ? "#fff" : colors.accent.primary}
                                />
                                <Text
                                    style={[
                                        styles.placeCardName,
                                        { color: item.isMine ? "#fff" : colors.text.primary },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.placeCard.name}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.placeCardAddr,
                                    { color: item.isMine ? "rgba(255,255,255,0.7)" : colors.text.tertiary },
                                ]}
                                numberOfLines={1}
                            >
                                {item.placeCard.address}
                            </Text>
                            <Text style={[styles.placeCardHint, { color: item.isMine ? "rgba(255,255,255,0.5)" : colors.accent.primary }]}>
                                Keşfet'te aç →
                            </Text>
                        </View>
                        <Text
                            style={[
                                styles.msgTime,
                                { color: item.isMine ? "rgba(255,255,255,0.6)" : colors.text.tertiary, paddingHorizontal: 12, paddingBottom: 8 },
                            ]}
                        >
                            {item.timestamp}
                        </Text>
                    </TouchableOpacity>
                </View>
            );
        }

        // Son mesaj ise ve benim değilse altında "Görüldü" göstergesi
        const isLast = messages[messages.length - 1]?.id === item.id;

        // Tik durumu: sadece kendi mesajlarında
        let tickIcon = null;
        if (item.isMine) {
            if (isLast && lastSeenId === item.id) {
                // Çift tik (görüldü)
                tickIcon = <MaterialCommunityIcons name="check-all" size={18} color={colors.accent.primary} style={{ marginLeft: 4 }} />;
            } else {
                // Tek tik (gönderildi)
                tickIcon = <MaterialCommunityIcons name="check" size={18} color={colors.text.tertiary} style={{ marginLeft: 4 }} />;
            }
        }

        return (
            <View style={[styles.messageBubbleRow, item.isMine ? styles.myRow : styles.theirRow]}>
                <View
                    style={[
                        styles.bubble,
                        item.isMine
                            ? [styles.myBubble, { backgroundColor: colors.accent.primary }]
                            : [styles.theirBubble, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }],
                    ]}
                >
                    <Text
                        style={[
                            styles.msgText,
                            { color: item.isMine ? "#fff" : colors.text.primary },
                        ]}
                    >
                        {item.text}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                        <Text
                            style={[
                                styles.msgTime,
                                { color: item.isMine ? "rgba(255,255,255,0.6)" : colors.text.tertiary },
                            ]}
                        >
                            {item.timestamp}
                        </Text>
                        {tickIcon}
                    </View>
                </View>
            </View>
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
                    <TouchableOpacity hitSlop={8} activeOpacity={0.7}>
                        <IconSymbol name="info.circle" size={22} color={colors.text.primary} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Messages ── */}
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
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
                    <TouchableOpacity style={styles.cameraBtn} activeOpacity={0.7}>
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
        marginBottom: 6,
    },
    myRow: {
        alignItems: "flex-end",
    },
    theirRow: {
        alignItems: "flex-start",
    },
    bubble: {
        maxWidth: "78%",
        borderRadius: 18,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 6,
    },
    myBubble: {
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        borderBottomLeftRadius: 4,
        borderWidth: 1,
    },
    msgText: {
        fontSize: 15,
        lineHeight: 21,
    },
    msgTime: {
        fontSize: 11,
        marginTop: 4,
        alignSelf: "flex-end",
    },

    /* Place Card */
    placeCardBubble: {
        maxWidth: "78%",
        borderRadius: 16,
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
});
