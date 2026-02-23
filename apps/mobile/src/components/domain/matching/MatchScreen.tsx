import React, { useEffect, useState, useCallback, useRef } from "react";
import {
    View,
    StyleSheet,
    Dimensions,
    Animated,
    PanResponder,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Platform,
    Modal,
    Pressable,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { ThemedText } from "@/src/components/themed-text";
import { useTheme } from "@/src/hooks/useTheme";
import { useMatchStore } from "@/src/store/useMatchStore";
import { usePresence } from "@/src/store/presence";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const ACCENT = "#1DB954";

// Mock data — seni beğenen kişiler (Bumble style rich profiles)
const richProfile = {
    location: "Kağıthane",
    bio: "ig hottiebutacryinone",
    about: [
        { icon: "ruler.fill", text: "171 cm" },
        { icon: "graduationcap.fill", text: "Üniversite" },
        { icon: "wineglass.fill", text: "Nadiren" },
        { icon: "smoke.fill", text: "Evet" },
        { icon: "person.fill", text: "Kadın" },
        { icon: "figure.child", text: "Çocuk istemiyor" },
        { icon: "star.fill", text: "Yay" }
    ],
    looking_for: "Uzun süreli ilişki",
    interests: [
        { icon: "paintpalette.fill", text: "Sanat" },
        { icon: "figure.dance", text: "Dans" },
        { icon: "leaf.fill", text: "Bahçe" },
        { icon: "cup.and.saucer.fill", text: "Kahve" }
    ],
    prompt: { q: "Hiçbir şey yapmamayı en çok sevdiğim yol", a: "rastgele telefon oyunları oynamak" }
};

const MOCK_LIKES = [
    { id: 1, name: "Ceren", age: 22, photo: "https://i.pravatar.cc/600?img=1", photos: ["https://i.pravatar.cc/600?img=1", "https://i.pravatar.cc/600?img=2", "https://i.pravatar.cc/600?img=3"], ...richProfile },
    { id: 2, name: "Zeynep", age: 25, photo: "https://i.pravatar.cc/600?img=5", photos: ["https://i.pravatar.cc/600?img=5", "https://i.pravatar.cc/600?img=6"], ...richProfile },
    { id: 3, name: "Ayşe", age: 22, photo: "https://i.pravatar.cc/600?img=9", photos: ["https://i.pravatar.cc/600?img=9"], ...richProfile },
    { id: 4, name: "Selin", age: 24, photo: "https://i.pravatar.cc/600?img=16", photos: ["https://i.pravatar.cc/600?img=16", "https://i.pravatar.cc/600?img=17"], ...richProfile },
    { id: 5, name: "Deniz", age: 26, photo: "https://i.pravatar.cc/600?img=20", photos: ["https://i.pravatar.cc/600?img=20"], ...richProfile },
    { id: 6, name: "Merve", age: 21, photo: "https://i.pravatar.cc/600?img=25", photos: ["https://i.pravatar.cc/600?img=25"], ...richProfile },
];

export default function MatchScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const {
        hasProfile,
        candidates,
        candidatesLoading,
        currentIndex,
        fetchMyProfile,
        fetchCandidates,
        likeCandidate,
        passCandidate,
        nextCandidate,
        profileLoading,
        myProfile,
    } = useMatchStore();

    const { activePlaceId, activePlaceName, qrVerified, isSessionActive } = usePresence();
    const [matchPopup, setMatchPopup] = useState<{ name: string } | null>(null);
    const [scrollMode, setScrollMode] = useState(false);
    const [activeTab, setActiveTab] = useState<"swipe" | "likes">("swipe");
    const [selectedLike, setSelectedLike] = useState<typeof MOCK_LIKES[number] | null>(null);

    // Pan animation for swipe
    const pan = useRef(new Animated.ValueXY()).current;
    const cardOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        fetchMyProfile();
    }, []);

    useEffect(() => {
        if (hasProfile && activeTab === "swipe") {
            const placeId = activePlaceId ? parseInt(activePlaceId) : undefined;
            fetchCandidates(placeId);
        }
    }, [hasProfile, activePlaceId, activeTab]);

    const currentCandidate = candidates[currentIndex];

    const handleSwipe = useCallback(
        async (direction: "left" | "right") => {
            if (!currentCandidate) return;

            const toValue = direction === "right" ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

            Animated.parallel([
                Animated.timing(pan.x, {
                    toValue,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(cardOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start(async () => {
                const placeId = activePlaceId ? parseInt(activePlaceId) : undefined;

                if (direction === "right") {
                    const result = await likeCandidate(currentCandidate.user_id, placeId);
                    if (result.matched) {
                        setMatchPopup({ name: currentCandidate.display_name });
                        setTimeout(() => setMatchPopup(null), 3000);
                    }
                } else {
                    await passCandidate(currentCandidate.user_id, placeId);
                }

                pan.setValue({ x: 0, y: 0 });
                cardOpacity.setValue(1);
                nextCandidate();
            });
        },
        [currentCandidate, activePlaceId]
    );

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => !scrollMode,
            onMoveShouldSetPanResponder: (_, gs) => {
                if (scrollMode) return false;
                return Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 10;
            },
            onPanResponderGrant: () => {
                pan.setOffset({ x: (pan.x as any)._value, y: 0 });
            },
            onPanResponderMove: Animated.event([null, { dx: pan.x }], {
                useNativeDriver: false,
            }),
            onPanResponderRelease: (_, gs) => {
                pan.flattenOffset();
                if (gs.dx > SWIPE_THRESHOLD) {
                    handleSwipe("right");
                } else if (gs.dx < -SWIPE_THRESHOLD) {
                    handleSwipe("left");
                } else {
                    Animated.spring(pan, {
                        toValue: { x: 0, y: 0 },
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    const rotate = pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ["-10deg", "0deg", "10deg"],
        extrapolate: "clamp",
    });

    const likeOpacity = pan.x.interpolate({
        inputRange: [0, SCREEN_WIDTH / 4],
        outputRange: [0, 1],
        extrapolate: "clamp",
    });

    const passOpacity = pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 4, 0],
        outputRange: [1, 0],
        extrapolate: "clamp",
    });

    // --- RENDER HELPERS ---

    const renderEmptyStateProfile = () => (
        <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]}>
                <Image source={require("@/assets/images/icon.png")} style={{ width: 48, height: 48, opacity: 0.5, tintColor: colors.text.secondary }} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: colors.text.primary }]}>
                Eşleşmeye Hazır mısın?
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
                Hemen bir eşleşme profili oluştur ve mekandaki insanlarla tanışmaya başla.
            </ThemedText>
            <TouchableOpacity
                style={styles.bumbleBtn}
                activeOpacity={0.85}
                onPress={() => router.push("/match-profile-setup")}
            >
                <ThemedText style={styles.bumbleBtnText}>Profil Oluştur</ThemedText>
            </TouchableOpacity>
        </View>
    );

    const renderLikesTab = () => {
        if (!hasProfile) {
            return renderEmptyStateProfile();
        }

        return (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120, paddingTop: 24 }}>
                <ThemedText style={[styles.likesHeader, { color: colors.text.primary }]}>
                    Seni Beğedenler
                </ThemedText>
                <ThemedText style={[styles.likesSubHeader, { color: colors.text.secondary }]}>
                    Şu anda seni {MOCK_LIKES.length} kişi beğendi. Eşleşmek için profillerini incele.
                </ThemedText>

                <View style={styles.likesGrid}>
                    {MOCK_LIKES.map((person) => (
                        <Pressable
                            key={person.id}
                            style={({ pressed }) => [
                                styles.likeCard,
                                { transform: [{ scale: pressed ? 0.96 : 1 }] }
                            ]}
                            onPress={() => setSelectedLike(person)}
                        >
                            <Image source={{ uri: person.photos?.[0] || person.photo }} style={styles.likeCardImage} />
                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.85)"]}
                                style={styles.likeCardOverlay}
                            >
                                <ThemedText style={styles.likeCardName}>
                                    {person.name}, {person.age}
                                </ThemedText>
                                <View style={styles.likeCardLocationRow}>
                                    <IconSymbol name="mappin.and.ellipse" size={12} color="rgba(255,255,255,0.7)" />
                                    <ThemedText style={styles.likeCardLocationText}>{person.location}</ThemedText>
                                </View>
                            </LinearGradient>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderSwipeTab = () => {
        if (!hasProfile) {
            return renderEmptyStateProfile();
        }

        if (profileLoading || candidatesLoading) {
            return (
                <View style={[styles.center, { flex: 1 }]}>
                    <ActivityIndicator size="large" color={ACCENT} />
                    <ThemedText style={[styles.loadingText, { color: colors.text.secondary }]}>
                        Yakındakiler aranıyor...
                    </ThemedText>
                </View>
            );
        }

        if (!qrVerified && !isSessionActive()) {
            return (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]}>
                        <IconSymbol name="qrcode.viewfinder" size={48} color={ACCENT} />
                    </View>
                    <ThemedText style={[styles.emptyTitle, { color: colors.text.primary }]}>
                        Neredesin?
                    </ThemedText>
                    <ThemedText style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
                        Eşleşmek için bir mekana git ve QR kodunu okutarak giriş yap.
                    </ThemedText>
                    <TouchableOpacity
                        style={[styles.bumbleBtn]}
                        activeOpacity={0.85}
                        onPress={() => router.push("/scan")}
                    >
                        <ThemedText style={styles.bumbleBtnText}>QR Okut</ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!currentCandidate) {
            return (
                <View style={styles.emptyState}>
                    <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }]}>
                        <IconSymbol name="eye.slash.fill" size={40} color={colors.text.tertiary} />
                    </View>
                    <ThemedText style={[styles.emptyTitle, { color: colors.text.primary }]}>
                        Şu An Göz Alıcı Kimse Yok
                    </ThemedText>
                    <ThemedText style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
                        {activePlaceName
                            ? `${activePlaceName} mekanında tüm profilleri gördün. Birazdan tekrar kontrol et!`
                            : "Yakınlarda eşleşme profili bulunamadı."}
                    </ThemedText>
                </View>
            );
        }

        return (
            <View style={styles.cardContainer}>
                <Animated.View
                    style={[
                        styles.card,
                        {
                            transform: [{ translateX: pan.x }, { rotate }],
                            opacity: cardOpacity,
                        },
                    ]}
                    {...panResponder.panHandlers}
                >
                    {/* Overlays */}
                    <Animated.View style={[styles.swipeOverlay, styles.likeOverlay, { opacity: likeOpacity }]}>
                        <View style={[styles.swipeLabelContainer, { borderColor: ACCENT }]}>
                            <ThemedText style={[styles.swipeLabel, { color: ACCENT }]}>BEĞENDİM</ThemedText>
                        </View>
                    </Animated.View>
                    <Animated.View style={[styles.swipeOverlay, styles.passOverlay, { opacity: passOpacity }]}>
                        <View style={[styles.swipeLabelContainer, { borderColor: "#E22134" }]}>
                            <ThemedText style={[styles.swipeLabel, { color: "#E22134" }]}>GEÇ</ThemedText>
                        </View>
                    </Animated.View>

                    <ScrollView
                        style={styles.cardScroll}
                        showsVerticalScrollIndicator={false}
                        onScrollBeginDrag={() => setScrollMode(true)}
                        onScrollEndDrag={() => setScrollMode(false)}
                        scrollEventThrottle={16}
                    >
                        {/* Dynamic Photos View - Bumble style */}
                        <View style={styles.photoContainer}>
                            {currentCandidate.photo_urls && currentCandidate.photo_urls.length > 0 ? (
                                <Image
                                    source={{ uri: currentCandidate.photo_urls[0] }}
                                    style={styles.cardImageFixed}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.cardImageFixed, { backgroundColor: isDark ? "#2A2A2A" : "#E5E5E7", justifyContent: "center", alignItems: "center" }]}>
                                    <IconSymbol name="person.fill" size={100} color={colors.text.tertiary} />
                                </View>
                            )}

                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.8)"]}
                                style={styles.nameOverlay}
                            >
                                <ThemedText style={styles.cardName}>
                                    {currentCandidate.display_name}, {currentCandidate.age}
                                </ThemedText>
                                {currentCandidate.active_place_name && (
                                    <View style={styles.cardPlaceRow}>
                                        <View style={{ backgroundColor: ACCENT, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 4 }}>
                                            <IconSymbol name="mappin.and.ellipse" size={12} color="#FFF" />
                                            <ThemedText style={[styles.cardPlaceText, { color: "#FFF", fontWeight: "700" }]}>
                                                {currentCandidate.active_place_name}
                                            </ThemedText>
                                        </View>
                                    </View>
                                )}
                            </LinearGradient>
                        </View>

                        {/* White/Dark card bottom area */}
                        <View style={[styles.cardDetails, { backgroundColor: colors.background.primary }]}>
                            {/* Bio */}
                            {currentCandidate.bio && (
                                <View style={styles.section}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.text.primary }]}>Hakkımda</ThemedText>
                                    <ThemedText style={[styles.bioText, { color: colors.text.secondary }]}>
                                        {currentCandidate.bio}
                                    </ThemedText>
                                </View>
                            )}

                            {/* Tags / Badges */}
                            <View style={styles.section}>
                                <View style={styles.badgeContainer}>
                                    {currentCandidate.height && (
                                        <View style={[styles.badge, { backgroundColor: isDark ? "#2A2A2A" : "#F0F0F0" }]}>
                                            <ThemedText style={[styles.badgeText, { color: colors.text.primary }]}>📏 {currentCandidate.height} cm</ThemedText>
                                        </View>
                                    )}
                                    {currentCandidate.education && (
                                        <View style={[styles.badge, { backgroundColor: isDark ? "#2A2A2A" : "#F0F0F0" }]}>
                                            <ThemedText style={[styles.badgeText, { color: colors.text.primary }]}>🎓 {currentCandidate.education}</ThemedText>
                                        </View>
                                    )}
                                    {currentCandidate.smoking && (
                                        <View style={[styles.badge, { backgroundColor: isDark ? "#2A2A2A" : "#F0F0F0" }]}>
                                            <ThemedText style={[styles.badgeText, { color: colors.text.primary }]}>🚬 {currentCandidate.smoking}</ThemedText>
                                        </View>
                                    )}
                                    {currentCandidate.star_sign && (
                                        <View style={[styles.badge, { backgroundColor: isDark ? "#2A2A2A" : "#F0F0F0" }]}>
                                            <ThemedText style={[styles.badgeText, { color: colors.text.primary }]}>⭐ {currentCandidate.star_sign}</ThemedText>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {/* Interests */}
                            {currentCandidate.interests && currentCandidate.interests.length > 0 && (
                                <View style={styles.section}>
                                    <ThemedText style={[styles.sectionTitle, { color: colors.text.primary }]}>İlgi Alanları</ThemedText>
                                    <View style={styles.badgeContainer}>
                                        {currentCandidate.interests.map((interest, idx) => (
                                            <View key={idx} style={[styles.badge, { backgroundColor: ACCENT + "30", borderColor: ACCENT, borderWidth: 1 }]}>
                                                <ThemedText style={[styles.badgeText, { color: colors.text.primary }]}>{interest}</ThemedText>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}
                            <View style={{ height: 160 }} />
                        </View>
                    </ScrollView>

                    {/* Action Buttons Overlay */}
                    <View style={styles.actionBarOverlay}>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.passBtn, { backgroundColor: isDark ? "#2A2A2A" : "#FFF" }]}
                            activeOpacity={0.8}
                            onPress={() => handleSwipe("left")}
                        >
                            <IconSymbol name="xmark" size={32} color={colors.text.secondary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionBtn, styles.likeBtn, { backgroundColor: ACCENT }]}
                            activeOpacity={0.8}
                            onPress={() => handleSwipe("right")}
                        >
                            <IconSymbol name="heart.fill" size={32} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.secondary }]}>
            {/* Header with tabs + profile icon */}
            <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => router.push("/(tabs)/messages")}
                    hitSlop={12}
                >
                    <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
                </TouchableOpacity>

                <View style={styles.topTabs}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === "swipe" && styles.tabBtnActive]}
                        onPress={() => setActiveTab("swipe")}
                    >
                        <ThemedText style={[styles.tabText, activeTab === "swipe" ? { color: colors.text.primary } : { color: colors.text.tertiary }]}>
                            Eşleşme
                        </ThemedText>
                    </TouchableOpacity>

                    <ThemedText style={[styles.tabText, { color: colors.text.tertiary, opacity: 0.5 }]}>/</ThemedText>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === "likes" && styles.tabBtnActive]}
                        onPress={() => setActiveTab("likes")}
                    >
                        <ThemedText style={[styles.tabText, activeTab === "likes" ? { color: colors.text.primary } : { color: colors.text.tertiary }]}>
                            Beğeni
                        </ThemedText>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.profileIcon}
                    onPress={() => router.push("/match-profile-setup")}
                    hitSlop={12}
                >
                    <IconSymbol name="person.crop.circle.fill" size={32} color={ACCENT} />
                </TouchableOpacity>
            </View>

            {activeTab === "swipe" ? renderSwipeTab() : renderLikesTab()}

            {/* Match Popup */}
            {matchPopup && (
                <View style={[styles.matchPopup, { backgroundColor: isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)" }]}>
                    <View style={styles.matchPopupContent}>
                        <IconSymbol name="heart.text.square.fill" size={80} color={ACCENT} />
                        <ThemedText style={[styles.matchPopupTitle, { color: colors.text.primary, marginTop: 20 }]}>ITS A MATCH!</ThemedText>
                        <ThemedText style={[styles.matchPopupText, { color: colors.text.secondary }]}>
                            {matchPopup.name} de seni beğendi. Hemen yazışmaya başla!
                        </ThemedText>
                        <TouchableOpacity
                            style={[styles.bumbleBtn, { marginTop: 30 }]}
                            onPress={() => {
                                setMatchPopup(null);
                                router.push("/(tabs)/messages");
                            }}
                        >
                            <ThemedText style={styles.bumbleBtnText}>Mesaj Gönder</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Liked Person Detail Modal */}
            {/* Liked Person Detail Modal - Bumble Style */}
            <Modal
                visible={!!selectedLike}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setSelectedLike(null)}
            >
                {selectedLike && (
                    <View style={[styles.detailContainer, { backgroundColor: isDark ? "#000" : "#F4F4F4" }]}>
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                            {/* Main Photo */}
                            <Image source={{ uri: selectedLike.photos[0] }} style={styles.detailMainImage} />

                            {/* Close Button overlay */}
                            <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setSelectedLike(null)}>
                                <IconSymbol name="chevron.down" size={24} color="#000" />
                            </TouchableOpacity>

                            {/* Name & Age overlaid on first photo bottom */}
                            <LinearGradient
                                colors={["transparent", "rgba(0,0,0,0.8)"]}
                                style={styles.detailNameOverlay}
                            >
                                <ThemedText style={styles.detailNameText}>
                                    {selectedLike.name}, {selectedLike.age}
                                </ThemedText>
                            </LinearGradient>

                            {/* Location Card */}
                            <View style={[styles.detailInfoCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                                <ThemedText style={[styles.detailCardTitle, { color: colors.text.secondary }]}>Benim konumum</ThemedText>
                                <View style={styles.detailRow}>
                                    <IconSymbol name="mappin.and.ellipse" size={18} color={colors.text.primary} />
                                    <ThemedText style={[styles.detailCardText, { color: colors.text.primary, marginLeft: 8 }]}>
                                        {selectedLike.location}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Second Photo if exists */}
                            {selectedLike.photos[1] && (
                                <Image source={{ uri: selectedLike.photos[1] }} style={styles.detailInlineImage} />
                            )}

                            {/* Prompt Card */}
                            <View style={[styles.detailInfoCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                                <ThemedText style={[styles.detailCardTitle, { color: colors.text.secondary }]}>{selectedLike.prompt.q}</ThemedText>
                                <ThemedText style={[styles.detailCardText, { color: colors.text.primary, marginTop: 4 }]}>
                                    {selectedLike.prompt.a}
                                </ThemedText>
                            </View>

                            {/* Bio Card */}
                            <View style={[styles.detailInfoCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                                <ThemedText style={[styles.detailCardTitle, { color: colors.text.secondary }]}>Biyografim</ThemedText>
                                <ThemedText style={[styles.detailCardText, { color: colors.text.primary, marginTop: 4 }]}>
                                    {selectedLike.bio}
                                </ThemedText>
                            </View>

                            {/* About Me Chips */}
                            <View style={[styles.detailInfoCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                                <ThemedText style={[styles.detailCardTitle, { color: colors.text.secondary }]}>Hakkımda</ThemedText>
                                <View style={styles.detailChipsRow}>
                                    {selectedLike.about.map((item, idx) => (
                                        <View key={idx} style={[styles.detailChip, { backgroundColor: isDark ? "#2C2C2E" : "#F0F0F0" }]}>
                                            <IconSymbol name={item.icon as any} size={14} color={colors.text.secondary} />
                                            <ThemedText style={[styles.detailChipText, { color: colors.text.primary }]}>{item.text}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Looking For */}
                            <View style={[styles.detailInfoCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                                <ThemedText style={[styles.detailCardTitle, { color: colors.text.secondary }]}>Ne Arıyorum</ThemedText>
                                <View style={[styles.detailChip, { backgroundColor: isDark ? "#2C2C2E" : "#F0F0F0", alignSelf: "flex-start", marginTop: 8 }]}>
                                    <IconSymbol name="magnifyingglass" size={14} color={colors.text.secondary} />
                                    <ThemedText style={[styles.detailChipText, { color: colors.text.primary }]}>{selectedLike.looking_for}</ThemedText>
                                </View>
                            </View>

                            {/* Interests */}
                            <View style={[styles.detailInfoCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                                <ThemedText style={[styles.detailCardTitle, { color: colors.text.secondary }]}>İlgi Alanlarım</ThemedText>
                                <View style={styles.detailChipsRow}>
                                    {selectedLike.interests.map((item, idx) => (
                                        <View key={idx} style={[styles.detailChip, { backgroundColor: isDark ? "#2C2C2E" : "#F0F0F0" }]}>
                                            <IconSymbol name={item.icon as any} size={14} color={colors.text.secondary} />
                                            <ThemedText style={[styles.detailChipText, { color: colors.text.primary }]}>{item.text}</ThemedText>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Third Photo if exists */}
                            {selectedLike.photos[2] && (
                                <Image source={{ uri: selectedLike.photos[2] }} style={styles.detailInlineImage} />
                            )}
                        </ScrollView>

                        {/* Floating Action Button - Yellow/Green Heart */}
                        <TouchableOpacity
                            style={[styles.floatingLikeBtn, { elevation: 8 }]}
                            onPress={() => {
                                const matchedPerson = selectedLike.name;
                                setSelectedLike(null);
                                setMatchPopup({ name: matchedPerson });
                            }}
                        >
                            <View style={styles.floatingLikeInner}>
                                <IconSymbol name="heart.fill" size={32} color="#000" />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },

    // Top Header
    topHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 16,
        paddingBottom: 8,
        position: "relative",
    },
    backBtn: {
        position: "absolute",
        left: 16,
        bottom: 4,
        padding: 8,
    },
    topTabs: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        marginTop: 4,
    },
    profileIcon: {
        position: "absolute",
        right: 16,
        bottom: 2,
        padding: 4,
    },
    tabBtn: {
        paddingVertical: 8,
        borderBottomWidth: 4,
        borderBottomColor: "transparent",
    },
    tabBtnActive: {
        borderBottomColor: ACCENT,
    },
    tabText: {
        fontSize: 18,
        fontWeight: "700",
    },

    // Empty States / Defaults
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 16,
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: "center",
        lineHeight: 24,
        marginBottom: 40,
    },
    bumbleBtn: {
        backgroundColor: ACCENT,
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 32,
        alignItems: "center",
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
    },
    bumbleBtnText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        fontWeight: "600",
    },

    // Likes Tab Premium
    likesHeader: {
        fontSize: 32,
        fontWeight: "900",
        marginBottom: 8,
    },
    likesSubHeader: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 32,
    },
    likesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: 12,
    },
    likeCard: {
        width: "47.5%",
        aspectRatio: 0.75, // Taller card to show more photo
        borderRadius: 24, // Soft premium corners
        overflow: "hidden",
        backgroundColor: "#1A1A1A",
        // Soft premium shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
    },
    likeCardImage: {
        width: "100%",
        height: "100%",
    },
    likeCardOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        justifyContent: "flex-end",
        padding: 16,
    },
    likeCardName: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "800",
        marginBottom: 4,
    },
    likeCardLocationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    likeCardLocationText: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        fontWeight: "600",
    },

    // --- Detail Modal Styles ---
    detailContainer: {
        flex: 1,
    },
    detailMainImage: {
        width: SCREEN_WIDTH - 16,
        height: SCREEN_HEIGHT * 0.65,
        borderRadius: 16,
        marginHorizontal: 8,
        marginTop: 8,
    },
    detailCloseBtn: {
        position: "absolute",
        top: 24,
        left: 24,
        backgroundColor: "rgba(255,255,255,0.7)",
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    detailNameOverlay: {
        position: "absolute",
        top: SCREEN_HEIGHT * 0.65 - 80 + 8, // bottom of main image
        left: 8,
        right: 8,
        height: 80,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        justifyContent: "flex-end",
        padding: 16,
    },
    detailNameText: {
        color: "#FFF",
        fontSize: 28,
        fontWeight: "800",
    },
    detailInfoCard: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    detailCardTitle: {
        fontSize: 13,
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    detailCardText: {
        fontSize: 18,
        fontWeight: "500",
    },
    detailInlineImage: {
        width: SCREEN_WIDTH - 32,
        height: SCREEN_HEIGHT * 0.5,
        borderRadius: 16,
        marginHorizontal: 16,
        marginTop: 12,
    },
    detailChipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
    },
    detailChip: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        gap: 6,
    },
    detailChipText: {
        fontSize: 13,
        fontWeight: "600",
    },
    floatingLikeBtn: {
        position: "absolute",
        bottom: 30,
        right: 30,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#FFC629", // Bumble Yellow 
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    floatingLikeInner: {
        alignItems: "center",
        justifyContent: "center",
    },
    likeCardBlur: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.35)",
        justifyContent: "center",
        alignItems: "center",
    },

    // Cards Swipe View
    cardContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 8,
        paddingBottom: Platform.OS === "ios" ? 100 : 70,
    },
    card: {
        width: SCREEN_WIDTH - 16,
        flex: 1,
        borderRadius: 20,
        backgroundColor: "#000", // Will be covered by photo or scroll
        overflow: "hidden",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
    },
    cardScroll: {
        flex: 1,
    },
    photoContainer: {
        position: "relative",
    },
    cardImageFixed: {
        width: "100%",
        height: SCREEN_HEIGHT * 0.65, // Taller image for premium feel
    },
    nameOverlay: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 24,
        paddingTop: 80,
    },
    cardName: {
        fontSize: 34,
        fontWeight: "900",
        color: "#FFFFFF",
        marginBottom: 8,
        textShadowColor: "rgba(0,0,0,0.5)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    cardPlaceRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    cardPlaceText: {
        fontSize: 14,
    },

    cardDetails: {
        paddingTop: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        marginTop: -20, // Overlap the image smoothly
    },

    // Swipe Overlays
    swipeOverlay: {
        position: "absolute",
        top: 60,
        zIndex: 10,
    },
    likeOverlay: {
        left: 24,
        transform: [{ rotate: "-15deg" }],
    },
    passOverlay: {
        right: 24,
        transform: [{ rotate: "15deg" }],
    },
    swipeLabelContainer: {
        borderWidth: 4,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    swipeLabel: {
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: 2,
    },

    // Sections (Bio, etc.)
    section: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 12,
        opacity: 0.5,
    },
    bioText: {
        fontSize: 17,
        lineHeight: 26,
        fontWeight: "500",
    },

    // Badges
    badgeContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    badge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    badgeText: {
        fontSize: 14,
        fontWeight: "600",
    },

    // Action Bar Overlay (floating over the card bottom)
    actionBarOverlay: {
        position: "absolute",
        bottom: 24,
        left: 0,
        right: 0,
        flexDirection: "row",
        justifyContent: "center",
        gap: 32,
        zIndex: 100,
    },
    actionBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
    },
    passBtn: {},
    likeBtn: {},

    // Match Popup
    matchPopup: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 200,
        justifyContent: "center",
        alignItems: "center",
    },
    matchPopupContent: {
        alignItems: "center",
        padding: 40,
    },
    matchPopupTitle: {
        fontSize: 36,
        fontWeight: "900",
        fontStyle: "italic",
    },
    matchPopupText: {
        fontSize: 16,
        textAlign: "center",
        marginTop: 12,
        lineHeight: 24,
    },
});
