/**
 * Messages Screen
 *
 * Arkadaşlarla mesajlaşma ve beğenilen mekanlarla ilgili yer paylaşımı.
 * Özgün ASEMOS tasarım dili ile.
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import { useAuthStore } from "@/src/store/useAuthStore";

/* ── Types ── */
interface Conversation {
    id: string;
    name: string;
    username: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    isOnline: boolean;
    sharedPlace?: string; // son paylaşılan mekan adı
}

/* ── Dummy Data ── */
const DUMMY_CONVERSATIONS: Conversation[] = [
    {
        id: "1",
        name: "Ahmet Yılmaz",
        username: "ahmetyilmaz",
        avatar: "https://i.pravatar.cc/150?img=1",
        lastMessage: "Sortie harika bir yermiş, Boğaz manzaralı! 🌉",
        timestamp: "2dk",
        unread: true,
        isOnline: true,
        sharedPlace: "Sortie - Kuruçeşme",
    },
    {
        id: "2",
        name: "Elif Kaya",
        username: "elifkaya",
        avatar: "https://i.pravatar.cc/150?img=5",
        lastMessage: "Bir mekan paylaştı 📍",
        timestamp: "15dk",
        unread: true,
        isOnline: false,
        sharedPlace: "Kastel - Beyoğlu",
    },
    {
        id: "3",
        name: "Burak Demir",
        username: "burakdemir",
        avatar: "https://i.pravatar.cc/150?img=3",
        lastMessage: "Oraya bu hafta sonu gidelim mi?",
        timestamp: "1sa",
        unread: false,
        isOnline: true,
    },
    {
        id: "4",
        name: "Zeynep Toprak",
        username: "zeyneptoprak",
        avatar: "https://i.pravatar.cc/150?img=9",
        lastMessage: "Teşekkürler, harika bir yermiş 🤩",
        timestamp: "3sa",
        unread: false,
        isOnline: false,
    },
    {
        id: "5",
        name: "Can Aydın",
        username: "canaydin",
        avatar: "https://i.pravatar.cc/150?img=8",
        lastMessage: "Sen de kaydettin mi orayı?",
        timestamp: "5sa",
        unread: false,
        isOnline: false,
    },
    {
        id: "6",
        name: "Selin Arslan",
        username: "selinarslan",
        avatar: "https://i.pravatar.cc/150?img=10",
        lastMessage: "Mekan önerisini yolladım 📍",
        timestamp: "Dün",
        unread: false,
        isOnline: true,
        sharedPlace: "Oligark - Kuruçeşme",
    },
    {
        id: "7",
        name: "Mert Özkan",
        username: "mertozkan",
        avatar: "https://i.pravatar.cc/150?img=11",
        lastMessage: "Pop-up restorandan geldim, anlatacaklarım var",
        timestamp: "Dün",
        unread: false,
        isOnline: false,
    },
    {
        id: "8",
        name: "Deniz Güneş",
        username: "denizgunes",
        avatar: "https://i.pravatar.cc/150?img=12",
        lastMessage: "Haritada işaretledim sana 📌",
        timestamp: "2g",
        unread: false,
        isOnline: false,
        sharedPlace: "Fakülte Teras - Beyoğlu",
    },
];

export default function MessagesScreen() {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const authUser = useAuthStore((s) => s.user);
    const [searchQuery, setSearchQuery] = useState("");
    const [conversations, setConversations] = useState(DUMMY_CONVERSATIONS);
    const [searchFocused, setSearchFocused] = useState(false);
    const searchInputRef = React.useRef<TextInput>(null);

    const username = authUser?.username || authUser?.email || "Kullanıcı";

    const filteredConversations = conversations.filter((c) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            c.username.toLowerCase().includes(q) ||
            c.lastMessage.toLowerCase().includes(q)
        );
    });

    const markAsRead = (id: string) => {
        setConversations((prev) =>
            prev.map((c) =>
                c.id === id ? { ...c, unread: false } : c
            )
        );
        // TODO: Send read status to backend
    };

    const renderConversation = React.useCallback(({ item }: { item: Conversation }) => (
        <TouchableOpacity
            style={styles.conversationCard}
            activeOpacity={0.7}
            onPress={() => {
                lightImpact();
                markAsRead(item.id);
                router.push(`/chat/${item.id}` as any);
            }}
        >
            <View style={styles.cardInner}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Image source={{ uri: item.avatar }} style={styles.avatar} contentFit="cover" />
                    {item.isOnline && (
                        <View style={[styles.onlineDot, { borderColor: colors.background.primary }]} />
                    )}
                </View>

                {/* İçerik */}
                <View style={styles.cardContent}>
                    <View style={styles.cardTopRow}>
                        <Text
                            style={[styles.name, { color: colors.text.primary }, item.unread && styles.boldText]}
                            numberOfLines={1}
                        >
                            {item.name}
                        </Text>
                        <Text style={[styles.time, { color: colors.text.tertiary }]}>{item.timestamp}</Text>
                    </View>

                    <Text
                        style={[
                            styles.message,
                            { color: item.unread ? colors.text.primary : colors.text.secondary },
                            item.unread && styles.boldText,
                        ]}
                        numberOfLines={1}
                    >
                        {item.lastMessage}
                    </Text>

                    {/* Paylaşılan mekan etiketi */}
                    {item.sharedPlace && (
                        <View style={[styles.placeTag, { backgroundColor: colors.accent.primary + "18" }]}>
                            <IconSymbol name="mappin.and.ellipse" size={12} color={colors.accent.primary} />
                            <Text style={[styles.placeTagText, { color: colors.accent.primary }]} numberOfLines={1}>
                                {item.sharedPlace}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Sağ taraf */}
                {item.unread && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.accent.primary }]} />
                )}
            </View>
        </TouchableOpacity>
    ), [colors, router]);

    const listHeader = React.useMemo(() => (
        <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Sohbetler</Text>
            <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.requestsLink, { color: colors.accent.primary }]}>İstekler</Text>
            </TouchableOpacity>
        </View>
    ), [colors]);

    const listEmpty = React.useMemo(() => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { borderColor: colors.accent.primary + "40" }]}>
                <IconSymbol name="paperplane" size={32} color={colors.accent.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>Henüz sohbet yok</Text>
            <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                Arkadaşlarınla beğendiğin mekanları paylaş, birlikte keşfet.
            </Text>
            <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.accent.primary }]}
                activeOpacity={0.8}
                onPress={() => lightImpact()}
            >
                <Text style={styles.startBtnText}>Sohbet Başlat</Text>
            </TouchableOpacity>
        </View>
    ), [colors]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            {/* ── Header ── */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: insets.top + 8,
                        borderBottomColor: colors.surface.border,
                        backgroundColor: colors.background.primary,
                    },
                ]}
            >
                <Text style={[styles.headerTitle, { color: colors.text.primary }]} numberOfLines={1}>
                    {username}
                </Text>

                <TouchableOpacity
                    style={styles.headerBtn}
                    hitSlop={8}
                    activeOpacity={0.7}
                    onPress={() => lightImpact()}
                >
                    <IconSymbol name="square.and.pencil" size={22} color={colors.text.primary} />
                </TouchableOpacity>
            </View>

            {/* ── Search (FlatList dışında, klavye kapanma sorunu çözüldü) ── */}
            <View style={styles.searchSection}>
                <View style={[styles.searchBar, { backgroundColor: colors.surface.elevated, borderColor: searchFocused ? colors.accent.primary : colors.surface.border }]}>
                    <IconSymbol name="magnifyingglass" size={18} color={colors.text.tertiary} />
                    <TextInput
                        ref={searchInputRef}
                        style={[styles.searchInput, { color: colors.text.primary }]}
                        placeholder="Kişi veya mekan ara..."
                        placeholderTextColor={colors.text.tertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize="none"
                        cursorColor={colors.accent.primary}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                    />
                </View>
            </View>

            {/* ── List ── */}
            <FlatList
                data={filteredConversations}
                keyExtractor={(item) => item.id}
                renderItem={renderConversation}
                ListHeaderComponent={listHeader}
                ListEmptyComponent={listEmpty}
                contentContainerStyle={{
                    paddingBottom: insets.bottom + (Platform.OS === "ios" ? 100 : 72),
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            />
        </View>
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
        justifyContent: "center", // Center the username
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: -0.3,
        textAlign: "center", // Ensure text is centered
        flex: 1,
    },
    headerBtn: {
        position: "absolute",
        right: 16,
        padding: 4,
    },

    /* Search */
    searchSection: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        height: 38,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
    },

    /* Section Header */
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
    },
    requestsLink: {
        fontSize: 14,
        fontWeight: "600",
    },

    /* Conversation Card */
    conversationCard: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    cardInner: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    avatarContainer: {
        position: "relative",
        marginRight: 14,
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
    },
    onlineDot: {
        position: "absolute",
        bottom: 1,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#2ecc71",
        borderWidth: 2.5,
    },
    cardContent: {
        flex: 1,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 3,
    },
    name: {
        fontSize: 15,
        fontWeight: "500",
        flex: 1,
        marginRight: 8,
    },
    time: {
        fontSize: 13,
        fontWeight: "400",
    },
    message: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 19,
    },
    boldText: {
        fontWeight: "700",
    },

    /* Place Tag */
    placeTag: {
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",
        marginTop: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    placeTagText: {
        fontSize: 12,
        fontWeight: "600",
    },

    /* Unread */
    unreadDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        marginLeft: 10,
    },

    /* Empty State */
    emptyState: {
        alignItems: "center",
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
        marginBottom: 28,
    },
    startBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 10,
    },
    startBtnText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
});
