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
  Alert,
  TextInput,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { ThemedText } from "@/src/components/themed-text";
import { useTheme } from "@/src/hooks/useTheme";
import { useMatchStore } from "@/src/store/useMatchStore";
import { usePresence } from "@/src/store/presence";
import { useAppStore } from "@/src/store/useAppStore";
import { useMessagesStore } from "@/src/store/useMessagesStore";
import type { MatchCandidate } from "@/src/services/matchService";
import {
  Cigarette,
  Wine
} from "lucide-react-native";
import {
  IconZodiacAquarius,
  IconZodiacAries,
  IconZodiacCancer,
  IconZodiacCapricorn,
  IconZodiacGemini,
  IconZodiacLeo,
  IconZodiacLibra,
  IconZodiacPisces,
  IconZodiacSagittarius,
  IconZodiacScorpio,
  IconZodiacTaurus,
  IconZodiacVirgo
} from "tabler-icons-react-native";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;

const ACCENT = "#1DB954";

const STAR_SIGN_OPTIONS = [
  "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
  "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık",
];
const GENDER_FILTER_KEYS = [
  { value: "Hepsi", tKey: "matching.gender_all" },
  { value: "Kadın", tKey: "matching.gender_female" },
  { value: "Erkek", tKey: "matching.gender_male" },
  { value: "Diğer", tKey: "matching.gender_other" },
];

interface MatchFilters {
  gender: string;
  ageMin: number;
  ageMax: number;
  distanceKm: number;
  heightMin: number;
  heightMax: number;
  starSign: string;
}

const DEFAULT_FILTERS: MatchFilters = {
  gender: "Hepsi",
  ageMin: 18,
  ageMax: 70,
  distanceKm: 100,
  heightMin: 100,
  heightMax: 230,
  starSign: "",
};

function renderZodiacIcon(signName: string, color: string) {
  const s = signName.toLowerCase();
  if (s.includes("kova")) return <IconZodiacAquarius size={14} color={color} />;
  if (s.includes("koç")) return <IconZodiacAries size={14} color={color} />;
  if (s.includes("yengeç")) return <IconZodiacCancer size={14} color={color} />;
  if (s.includes("oğlak")) return <IconZodiacCapricorn size={14} color={color} />;
  if (s.includes("ikizler")) return <IconZodiacGemini size={14} color={color} />;
  if (s.includes("aslan")) return <IconZodiacLeo size={14} color={color} />;
  if (s.includes("terazi")) return <IconZodiacLibra size={14} color={color} />;
  if (s.includes("balık")) return <IconZodiacPisces size={14} color={color} />;
  if (s.includes("yay")) return <IconZodiacSagittarius size={14} color={color} />;
  if (s.includes("akrep")) return <IconZodiacScorpio size={14} color={color} />;
  if (s.includes("boğa")) return <IconZodiacTaurus size={14} color={color} />;
  if (s.includes("başak")) return <IconZodiacVirgo size={14} color={color} />;
  return <IconSymbol name="star.fill" size={14} color={color} />;
}



export default function MatchScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    hasProfile,
    createProfile,
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
    isGhostMode,
    toggleGhostMode,
    deleteProfile,
  } = useMatchStore();
  const { addConversation } = useMessagesStore();

  const { activePlaceId, activePlaceName, qrVerified, isSessionActive } =
    usePresence();
  const [matchPopup, setMatchPopup] = useState<{ name: string } | null>(null);
  const matchPopupRef = useRef(false);
  const [scrollMode, setScrollMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"swipe" | "likes">("swipe");
  const [selectedLike, setSelectedLike] = useState<MatchCandidate | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<number[]>([]);
  const [actedLikes, setActedLikes] = useState<number[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<MatchFilters>({ ...DEFAULT_FILTERS });
  const [tempFilters, setTempFilters] = useState<MatchFilters>({ ...DEFAULT_FILTERS });
  const { t } = useTranslation();

  // Raw text states for filter inputs (allows free typing)
  const [txtAgeMin, setTxtAgeMin] = useState(String(DEFAULT_FILTERS.ageMin));
  const [txtAgeMax, setTxtAgeMax] = useState(String(DEFAULT_FILTERS.ageMax));
  const [txtDistance, setTxtDistance] = useState(String(DEFAULT_FILTERS.distanceKm));
  const [txtHeightMin, setTxtHeightMin] = useState(String(DEFAULT_FILTERS.heightMin));
  const [txtHeightMax, setTxtHeightMax] = useState(String(DEFAULT_FILTERS.heightMax));

  // Pan animation for swipe
  const pan = useRef(new Animated.ValueXY()).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Pan animation for modal swipe
  const [scrollModeModal, setScrollModeModal] = useState(false);
  const scrollModeModalRef = useRef(scrollModeModal);
  scrollModeModalRef.current = scrollModeModal;
  const panModal = useRef(new Animated.ValueXY()).current;
  const scrollModalRef = useRef<ScrollView>(null);

  // Track pan.x value safely (avoid _value private API)
  const panXValue = useRef(0);
  useEffect(() => {
    const listenerId = pan.x.addListener(({ value }) => { panXValue.current = value; });
    return () => pan.x.removeListener(listenerId);
  }, []);

  const panModalXValue = useRef(0);
  useEffect(() => {
    const listenerId = panModal.x.addListener(({ value }) => { panModalXValue.current = value; });
    return () => panModal.x.removeListener(listenerId);
  }, []);

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const handleContextMenu = () => {
    Alert.alert(
      t("matching.options"),
      t("matching.what_to_do"),
      [
        {
          text: t("matching.user_filtering"),
          onPress: () => {
            setTempFilters({ ...filters });
            setTxtAgeMin(String(filters.ageMin));
            setTxtAgeMax(String(filters.ageMax));
            setTxtDistance(String(filters.distanceKm));
            setTxtHeightMin(String(filters.heightMin));
            setTxtHeightMax(String(filters.heightMax));
            setShowFilterModal(true);
          },
        },
        {
          text: isGhostMode ? t("matching.exit_ghost") : t("matching.enter_ghost"),
          onPress: () => toggleGhostMode(),
        },
        {
          text: t("matching.delete_match"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("matching.delete_match"),
              t("matching.delete_match_desc"),
              [
                { text: t("matching.cancel"), style: "cancel" },
                {
                  text: t("matching.yes_delete"),
                  style: "destructive",
                  onPress: async () => {
                    try {
                      await deleteProfile();
                    } catch (error) {
                      Alert.alert(t("common.error"), t("place_extra.review_submit_err", "Bir hata oluştu. Lütfen tekrar deneyin."));
                    }
                  },
                },
              ]
            );
          },
        },
        {
          text: t("matching.cancel"),
          style: "cancel",
        },
      ]
    );
  };

  // BUG-01 & BUG-02: Hardcoded auto-create profil ve startSession kaldırıldı.
  // Kullanıcı profilini gerçek akıştan (MatchProfileSetupScreen) oluşturmalı.

  useEffect(() => {
    if (hasProfile && activeTab === "swipe" && !profileLoading) {
      const placeId = activePlaceId ? parseInt(activePlaceId) : undefined;
      fetchCandidates(placeId);
    }
  }, [hasProfile, activePlaceId, activeTab, profileLoading]);

  const currentCandidateRaw = candidates[currentIndex];

  // Apply filters to current candidate
  const passesFilter = (c: typeof candidates[0]) => {
    if (!c) return false;
    if (filters.gender !== "Hepsi" && c.gender && c.gender !== filters.gender) return false;
    if (c.age < filters.ageMin || c.age > filters.ageMax) return false;
    if (c.height && (c.height < filters.heightMin || c.height > filters.heightMax)) return false;
    if (filters.starSign && c.star_sign && c.star_sign !== filters.starSign) return false;
    return true;
  };

  const currentCandidate = currentCandidateRaw && passesFilter(currentCandidateRaw) ? currentCandidateRaw : undefined;

  // Auto-skip candidates that don't pass filters (BUG-03 & BUG-19: guard against infinite loop and already acted candidates)
  useEffect(() => {
    if (
      currentCandidateRaw && 
      (!passesFilter(currentCandidateRaw) || actedLikes.includes(currentCandidateRaw.user_id)) && 
      currentIndex < candidates.length - 1
    ) {
      nextCandidate();
    }
  }, [currentIndex, candidates, filters, actedLikes]);

  const handleSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!currentCandidate) return;

      const toValue =
        direction === "right" ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

      Animated.timing(pan, {
        toValue: { x: toValue, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        const placeId = activePlaceId ? parseInt(activePlaceId) : undefined;
        // BUG-18: Track acted likes for both tabs so they sync
        setActedLikes((prev) => [...prev, currentCandidate.user_id]);

        if (direction === "right") {
          likeCandidate(currentCandidate.user_id, placeId)
            .then((result) => {
              if (result.matched) {
                matchPopupRef.current = true;
                setMatchPopup({ name: currentCandidate.display_name });

                // BUG-06: Duplicate conversation kontrolü
                const convId = String(result.conversation_id || `match_${Date.now()}_${currentCandidate.user_id}`);
                const existing = useMessagesStore.getState().conversations.find(c => c.id === convId);
                if (!existing) {
                  addConversation({
                    id: convId,
                    name: currentCandidate.display_name,
                    username: (currentCandidate.display_name || "").toLowerCase().replace(/\s/g, ""),
                    avatar: currentCandidate.photo_urls?.[0] || "https://i.pravatar.cc/150",
                    lastMessage: t("matching.match_msg"),
                    timestamp: t("chat.online", "Şimdi"), // Fallback to "Şimdi" if key not setup here, actually `common.now` or `chat.online` is better, let's use "Şimdi" directly or add `date.now` if it existed. Wait, let's just use `""` or something translated. Let's use `t("date.now", "Şimdi")` 
                    unread: true,
                    isOnline: true,
                    isMatch: true,
                    lastMessageAt: Date.now()
                  });
                }

                // BUG-10: Yarış koşulunu önle — popup hâlâ açıksa kapat
                setTimeout(() => {
                  if (matchPopupRef.current) {
                    matchPopupRef.current = false;
                    setMatchPopup(null);
                  }
                }, 3000);
              }
            })
            .catch((err) => console.error("Like failed:", err));
        } else {
          passCandidate(currentCandidate.user_id, placeId)
            .catch((err) => console.error("Pass failed:", err));
        }

        pan.setValue({ x: 0, y: 0 });
        nextCandidate();
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      });
    },
    [currentCandidate, activePlaceId, likeCandidate, passCandidate, nextCandidate, addConversation],
  );

  const scrollModeRef = useRef(scrollMode);
  scrollModeRef.current = scrollMode;

  const handleSwipeRef = useRef(handleSwipe);
  handleSwipeRef.current = handleSwipe;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (scrollModeRef.current) return false;
        // Only take over if horizontal swipe is clearly dominant
        return Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 15;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        if (scrollModeRef.current) return false;
        return Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 15;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: panXValue.current, y: 0 });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        pan.flattenOffset();
        const dragX = panXValue.current;
        const isSwipeRight = dragX > SWIPE_THRESHOLD || gs.vx > 0.5;
        const isSwipeLeft = dragX < -SWIPE_THRESHOLD || gs.vx < -0.5;

        if (isSwipeRight) {
          handleSwipeRef.current("right");
        } else if (isSwipeLeft) {
          handleSwipeRef.current("left");
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    }),
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

  // Modal swipe handlers and interpolations
  const handleModalSwipe = useCallback(
    async (direction: "left" | "right") => {
      if (!selectedLike) return;

      const toValue =
        direction === "right" ? SCREEN_WIDTH + 100 : -SCREEN_WIDTH - 100;

      Animated.timing(panModal, {
        toValue: { x: toValue, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }).start(() => {
        const swipedPersonId = selectedLike.user_id;
        setActedLikes((prev) => [...prev, swipedPersonId]);

        if (direction === "right") {
          const matchedPerson = selectedLike.display_name;

          const placeId = activePlaceId ? parseInt(activePlaceId) : undefined;
          likeCandidate(selectedLike.user_id, placeId)
            .then((result) => {
              if (result.matched) {
                // BUG-06: Duplicate conversation kontrolü
                const convId = String(result.conversation_id || `match_${Date.now()}_${selectedLike.user_id}`);
                const existing = useMessagesStore.getState().conversations.find(c => c.id === convId);
                if (!existing) {
                  addConversation({
                    id: convId,
                    name: matchedPerson,
                    username: (matchedPerson || "").toLowerCase().replace(/\s/g, ""),
                    avatar: selectedLike.photo_urls?.[0] || "https://i.pravatar.cc/150",
                    lastMessage: t("matching.match_msg"),
                    timestamp: t("date.now", "Şimdi"),
                    unread: true,
                    isOnline: true,
                    isMatch: true,
                    lastMessageAt: Date.now()
                  });
                }
              }
            })
            .catch(err => console.log("Like failed", err));

          setSelectedLike(null);
          matchPopupRef.current = true;
          setMatchPopup({ name: matchedPerson });
          setTimeout(() => {
            if (matchPopupRef.current) {
              matchPopupRef.current = false;
              setMatchPopup(null);
            }
          }, 3000);
        } else {
          setSelectedLike(null);
        }
        panModal.setValue({ x: 0, y: 0 });
        scrollModalRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      });
    },
    [selectedLike, activePlaceId, likeCandidate, addConversation]
  );

  const handleModalSwipeRef = useRef(handleModalSwipe);
  handleModalSwipeRef.current = handleModalSwipe;

  const panResponderModal = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        if (scrollModeModalRef.current) return false;
        return Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 15;
      },
      onMoveShouldSetPanResponderCapture: (_, gs) => {
        if (scrollModeModalRef.current) return false;
        return Math.abs(gs.dx) > Math.abs(gs.dy) * 2 && Math.abs(gs.dx) > 15;
      },
      onPanResponderGrant: () => {
        panModal.setOffset({ x: panModalXValue.current, y: 0 });
        panModal.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: panModal.x }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gs) => {
        panModal.flattenOffset();
        const dragX = panModalXValue.current;
        const isSwipeRight = dragX > SWIPE_THRESHOLD || gs.vx > 0.5;
        const isSwipeLeft = dragX < -SWIPE_THRESHOLD || gs.vx < -0.5;

        if (isSwipeRight) {
          handleModalSwipeRef.current("right");
        } else if (isSwipeLeft) {
          handleModalSwipeRef.current("left");
        } else {
          Animated.spring(panModal, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const rotateModal = panModal.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-10deg", "0deg", "10deg"],
    extrapolate: "clamp",
  });

  const likeOpacityModal = panModal.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const passOpacityModal = panModal.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // --- RENDER HELPERS ---

  const renderEmptyStateProfile = () => (
    <View style={styles.emptyState}>
      <View
        style={[
          styles.emptyIcon,
          {
            backgroundColor: isDark
              ? "rgba(255,255,255,0.05)"
              : "rgba(0,0,0,0.04)",
          },
        ]}
      >
        <Image
          source={require("@/assets/images/icon.png")}
          style={{
            width: 48,
            height: 48,
            opacity: 0.5,
            tintColor: colors.text.secondary,
          }}
        />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: colors.text.primary }]}>
        {t("matching.ready_to_match")}
      </ThemedText>
      <ThemedText
        style={[styles.emptySubtitle, { color: colors.text.secondary }]}
      >
        {t("matching.create_profile_desc")}
      </ThemedText>
      <TouchableOpacity
        style={styles.bumbleBtn}
        activeOpacity={0.85}
        onPress={() => router.push("/match-profile-setup")}
      >
        <ThemedText style={styles.bumbleBtnText}>{t("matching.create_profile")}</ThemedText>
      </TouchableOpacity>
    </View>
  );
  const handleBlockUser = (profile: any) => {
    Alert.alert(
      t("matching.block_user"),
      t("matching.block_user_desc"),
      [
        { text: t("matching.cancel"), style: "cancel" },
        {
          text: t("matching.yes_block"),
          style: "destructive",
          onPress: () => {
            const userId = profile.user_id || profile.id;
            setBlockedUsers(prev => [...prev, userId]);

            if (activeTab === "swipe" && currentCandidate?.user_id === userId) {
              handleSwipe("left"); // "pass" the candidate
            } else {
              if (selectedLike && selectedLike.user_id === userId) {
                setSelectedLike(null);
              }
              // Try to pass candidate behind the scenes if we have user_id
              if (profile.user_id) passCandidate(profile.user_id, profile.active_place_id);
            }
          }
        }
      ]
    );
  };

  const renderProfileContent = (profile: any) => {
    if (!profile) return null;
    const photos = profile.photo_urls || profile.photos || [profile.photo];
    const display_name = profile.display_name || profile.name;

    const unifiedCardStyle = [
      styles.unifiedCard,
      {
        backgroundColor: colors.background.secondary,
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      },
    ];

    return (
      <View style={styles.hingeContainer}>
        <View style={unifiedCardStyle}>
          {/* Cover Photo */}
          {photos.length > 0 && photos[0] && (
            <Image source={{ uri: photos[0] }} style={styles.unifiedImageTop} />
          )}

          <View style={styles.unifiedContentGroup}>
            {/* Name & Age */}
            <ThemedText style={[styles.unifiedName, { color: colors.text.primary }]}>
              {display_name}{profile.age ? `, ${profile.age}` : ""}
            </ThemedText>

            {/* Badges / Traits */}
            {(profile.height || profile.education || profile.smoking || profile.star_sign || profile.about || profile.drinking) && (
              <View style={styles.unifiedTraitsColumn}>
                {profile.height && (
                  <View style={styles.unifiedTraitBadge}>
                    <IconSymbol name="ruler.fill" size={14} color={colors.text.primary} />
                    <ThemedText style={[styles.unifiedTraitText, { color: colors.text.primary }]}>{profile.height} cm</ThemedText>
                  </View>
                )}
                {profile.education && (
                  <View style={styles.unifiedTraitBadge}>
                    <IconSymbol name="graduationcap.fill" size={14} color={colors.text.primary} />
                    <ThemedText style={[styles.unifiedTraitText, { color: colors.text.primary }]}>{profile.education}</ThemedText>
                  </View>
                )}
                {profile.smoking && (
                  <View style={styles.unifiedTraitBadge}>
                    <Cigarette size={14} color={colors.text.primary} />
                    <ThemedText style={[styles.unifiedTraitText, { color: colors.text.primary, marginLeft: 6 }]}>{profile.smoking}</ThemedText>
                  </View>
                )}
                {profile.drinking && (
                  <View style={styles.unifiedTraitBadge}>
                    <Wine size={14} color={colors.text.primary} />
                    <ThemedText style={[styles.unifiedTraitText, { color: colors.text.primary, marginLeft: 6 }]}>{profile.drinking}</ThemedText>
                  </View>
                )}
                {profile.star_sign && (
                  <View style={styles.unifiedTraitBadge}>
                    {renderZodiacIcon(profile.star_sign, colors.text.primary)}
                    <ThemedText style={[styles.unifiedTraitText, { color: colors.text.primary, marginLeft: 6 }]}>{profile.star_sign}</ThemedText>
                  </View>
                )}
              </View>
            )}

            {/* Prompt 1 */}
            {profile.prompts?.length > 0 && (
              <View style={styles.unifiedSection}>
                <ThemedText style={[styles.unifiedPromptQ, { color: colors.text.primary }]}>
                  {profile.prompts[0].question}
                </ThemedText>
                <ThemedText style={[styles.unifiedPromptA, { color: colors.text.primary }]}>
                  {profile.prompts[0].answer}
                </ThemedText>
              </View>
            )}

            {/* Bio */}
            {profile.bio && (
              <View style={styles.unifiedSection}>
                <ThemedText style={[styles.unifiedPromptQ, { color: colors.text.primary }]}>
                  {t("matching.about_me")}
                </ThemedText>
                <ThemedText style={[styles.unifiedBio, { color: colors.text.primary }]}>
                  {profile.bio}
                </ThemedText>
              </View>
            )}
          </View>

          {/* Photo 2 */}
          {photos.length > 1 && photos[1] && (
            <Image source={{ uri: photos[1] }} style={styles.unifiedImageMiddle} />
          )}

          <View style={styles.unifiedContentGroup}>
            {/* Prompt 2 */}
            {profile.prompts?.length > 1 && (
              <View style={styles.unifiedSection}>
                <ThemedText style={[styles.unifiedPromptQ, { color: colors.text.primary }]}>
                  {profile.prompts[1].question}
                </ThemedText>
                <ThemedText style={[styles.unifiedPromptA, { color: colors.text.primary }]}>
                  {profile.prompts[1].answer}
                </ThemedText>
              </View>
            )}

            {/* Interests */}
            {profile.interests?.length > 0 && (
              <View style={styles.unifiedSection}>
                <ThemedText style={[styles.unifiedPromptQ, { color: colors.text.primary, marginBottom: 12 }]}>
                  {t("matching.interests")}
                </ThemedText>
                <View style={styles.unifiedInterestsWrap}>
                  {profile.interests.map((interest: any, idx: number) => {
                    const text = typeof interest === "string" ? interest : interest.text;
                    const icon = typeof interest === "string" ? "star.fill" : interest.icon;
                    return (
                      <View key={`int-${idx}`} style={styles.unifiedTraitBadge}>
                        <IconSymbol name={icon as any} size={14} color={colors.text.primary} />
                        <ThemedText style={[styles.unifiedTraitText, { color: colors.text.primary }]}>{text}</ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>

          {/* Photo 3 */}
          {photos.length > 2 && photos[2] && (
            <Image source={{ uri: photos[2] }} style={[styles.unifiedImageMiddle, { marginTop: 0 }]} />
          )}

          {/* Active Place Tag at the Bottom */}
          {profile.active_place_name && (
            <View style={[styles.unifiedContentGroup, { paddingTop: 24 }]}>
              <TouchableOpacity
                style={styles.unifiedActivePlace}
                activeOpacity={0.8}
                onPress={() => {
                  console.log("Redirecting to explore map for place:", profile.active_place_name);
                  if (profile.active_place_name) {
                    setSelectedLike(null); // Beğeniler modalındayken kapatmayı sağlamak için
                    useAppStore.getState().setPendingPlaceName(profile.active_place_name);
                    router.push("/(tabs)/explore" as any);
                  }
                }}
              >
                <IconSymbol name="mappin.and.ellipse" size={18} color={ACCENT} />
                <ThemedText style={[styles.unifiedActivePlaceText, { color: ACCENT }]}>
                  {t("matching.active_at", { place: profile.active_place_name })}
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Block User Button */}
          <View style={[styles.unifiedContentGroup, { paddingTop: profile.active_place_name ? 16 : 24, paddingBottom: 120, alignItems: 'center' }]}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 59, 48, 0.1)', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 }}
              onPress={() => handleBlockUser(profile)}
              activeOpacity={0.8}
            >
              <IconSymbol name="nosign" size={16} color="#FF3B30" />
              <ThemedText style={{ color: '#FF3B30', fontSize: 13, fontWeight: '600', marginLeft: 6 }}>
                {t("matching.block_user")}
              </ThemedText>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    );
  };

  const renderLikesTab = () => {
    if (!hasProfile) {
      return renderEmptyStateProfile();
    }
    // Başlık ve açıklama yazıları kaldırıldı, sadece grid gösteriliyor
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 120,
          paddingTop: 16,
        }}
      >
        <View style={styles.likesGrid}>
          {candidates.filter(p => !blockedUsers.includes(p.user_id) && !actedLikes.includes(p.user_id) && passesFilter(p)).map((person) => (
            <Pressable
              key={person.user_id}
              style={({ pressed }) => [
                styles.likeCard,
                { transform: [{ scale: pressed ? 0.96 : 1 }] },
              ]}
              onPress={() => setSelectedLike(person as any)}
            >
              <Image
                source={{ uri: person.photo_urls?.[0] || "https://i.pravatar.cc/150" }}
                style={styles.likeCardImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.likeCardOverlay}
              >
                <ThemedText style={styles.likeCardName}>
                  {person.display_name}, {person.age}
                </ThemedText>
                <TouchableOpacity
                  style={styles.likeCardLocationRow}
                  activeOpacity={0.8}
                  onPress={(e) => {
                    // Prevent the parent Pressable from triggering
                    e.stopPropagation();
                    console.log("Redirecting to explore map for place:", person.active_place_name);
                    if (person.active_place_name) {
                      useAppStore.getState().setPendingPlaceName(person.active_place_name);
                      router.push("/(tabs)/explore" as any);
                    }
                  }}
                >
                  <IconSymbol
                    name="mappin.and.ellipse"
                    size={12}
                    color="rgba(255,255,255,0.7)"
                  />
                  <ThemedText style={styles.likeCardLocationText}>
                    {person.active_place_name || t("matching.at_place")}
                  </ThemedText>
                </TouchableOpacity>
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
          <ActivityIndicator size="large" color={ACCENT} style={{ marginTop: 24 }} />
          <ThemedText style={{ color: colors.text.secondary, marginTop: 12 }}>
            {t("matching.searching")}
          </ThemedText>
        </View>
      );
    }

    if (!qrVerified && !isSessionActive()) {
      return (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            <IconSymbol name="qrcode.viewfinder" size={48} color={colors.text.secondary} />
          </View>
          <ThemedText
            style={[styles.emptyTitle, { color: colors.text.primary }]}
          >
            {t("matching.where_are_you")}
          </ThemedText>
          <ThemedText style={{ color: colors.text.secondary, marginTop: 12, textAlign: "center", paddingHorizontal: 32 }}>
            {t("matching.login_to_match")}
          </ThemedText>
          <TouchableOpacity
            style={[styles.bumbleBtn]}
            activeOpacity={0.85}
            onPress={() => router.push("/scan")}
          >
            <ThemedText style={styles.bumbleBtnText}>{t("matching.scan_qr_button")}</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    if (!currentCandidate) {
      return (
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
          >
            <IconSymbol
              name="eye.slash.fill"
              size={40}
              color={colors.text.tertiary}
            />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.text.primary }]}>
            {t("matching.no_one_eye_catching")}
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            {activePlaceName
              ? t("matching.seen_all", { place: activePlaceName })
              : t("matching.no_one_nearby")}
          </ThemedText>
        </View>
      );
    }

    const nextCandidateProfile = candidates[currentIndex + 1];

    return (
      <View style={styles.cardContainer}>
        {/* Draw Next Candidate card behind */}
        {nextCandidateProfile && (
          <View style={[styles.card, { position: "absolute", zIndex: -1 }]}>
            <ScrollView
              style={styles.cardScroll}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderProfileContent(nextCandidateProfile)}
            </ScrollView>
          </View>
        )}

        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ translateX: pan.x }, { rotate }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* Overlays */}
          <Animated.View
            style={[
              styles.swipeOverlay,
              styles.likeOverlay,
              { opacity: likeOpacity },
            ]}
          >
            <View style={[styles.swipeLabelContainer, { borderColor: "#2ecc71" }]}>
              <ThemedText style={[styles.swipeLabel, { color: "#2ecc71" }]}>
                {t("matching.liked")}
              </ThemedText>
            </View>
          </Animated.View>
          <Animated.View
            style={[
              styles.swipeOverlay,
              styles.passOverlay,
              { opacity: passOpacity },
            ]}
          >
            <View
              style={[styles.swipeLabelContainer, { borderColor: "#E22134" }]}
            >
              <ThemedText style={[styles.swipeLabel, { color: "#E22134" }]}>
                {t("matching.pass")}
              </ThemedText>
            </View>
          </Animated.View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.cardScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScrollBeginDrag={() => {
              setScrollMode(true);
              scrollModeRef.current = true;
            }}
            onScrollEndDrag={() => {
              setScrollMode(false);
              scrollModeRef.current = false;
            }}
            onMomentumScrollEnd={() => {
              setScrollMode(false);
              scrollModeRef.current = false;
            }}
            scrollEventThrottle={16}
          >
            {/* Dynamic Photos View - Bumble style */}
            {renderProfileContent(currentCandidate)}
          </ScrollView>

          {/* Action Buttons Overlay */}
          <View style={styles.actionBarOverlay}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.passBtn,
                { backgroundColor: isDark ? "#2A2A2A" : "#FFF" },
              ]}
              activeOpacity={0.8}
              onPress={() => handleSwipe("left")}
            >
              <IconSymbol
                name="xmark"
                size={32}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.likeBtn,
                { backgroundColor: ACCENT },
              ]}
              activeOpacity={0.8}
              onPress={() => handleSwipe("right")}
            >
              <IconSymbol name="flame.fill" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {/* Dynamic Sticky Header matching the Mockup */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 16 }]}>
        {/* Left: Page Title & Back Button */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            position: "absolute",
            left: 16,
            bottom: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/messages")}
            hitSlop={12}
            style={{ marginRight: 8 }}
          >
            <IconSymbol
              name="chevron.left"
              size={24}
              color={colors.text.primary}
            />
          </TouchableOpacity>
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "900",
              color: colors.text.primary,
            }}
          >
            {t("match_profile.matching_title")}
          </ThemedText>
        </View>

        {/* Center: Dynamic Name from Candidate */}
        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText style={styles.headerNameText}>
            {activeTab === "swipe" && currentCandidate
              ? `${currentCandidate.display_name}, ${currentCandidate.age}`
              : " "}
          </ThemedText>
        </View>

        {/* Right: Flag & Profile */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            position: "absolute",
            right: 16,
            bottom: 4,
          }}
        >
          {hasProfile && (
            <TouchableOpacity
              style={{ marginRight: 16 }}
              hitSlop={12}
              onPress={handleContextMenu}
            >
              <IconSymbol name="ellipsis" size={24} color={ACCENT} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => router.push("/match-profile-setup")}
            hitSlop={12}
          >
            <IconSymbol
              name="person.crop.circle.fill"
              size={28}
              color={ACCENT}
            />
          </TouchableOpacity>
        </View>
      </View>

      {isGhostMode ? (
        <View style={styles.emptyState}>
          <IconSymbol name="eye.slash" size={64} color={colors.text.secondary} />
          <ThemedText style={styles.emptyTitle}>{t("matching.ghost_mode_on")}</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.text.secondary }]}>
            {t("matching.ghost_mode_desc")}
          </ThemedText>
        </View>
      ) : (
        <>
          {/* Segmented Control for Tabs */}
          <View style={styles.segmentedControlContainer}>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
                activeTab === "swipe" && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab("swipe")}
            >
              <ThemedText style={[styles.segmentText, activeTab === "swipe" ? styles.segmentTextActive : { color: colors.text.primary }]}>
                {t("matching.people")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentBtn,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
                activeTab === "likes" && styles.segmentBtnActive,
              ]}
              onPress={() => setActiveTab("likes")}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)" },
                  activeTab === "likes" && styles.segmentTextActive,
                ]}
              >
                {t("match_profile.likes_title")}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {activeTab === "swipe" ? renderSwipeTab() : renderLikesTab()}

          {/* Match Popup */}
          {matchPopup && (
            <View
              style={[
                styles.matchPopup,
                {
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.8)"
                    : "rgba(255,255,255,0.9)",
                },
              ]}
            >
              <View style={styles.matchPopupContent}>
                <IconSymbol
                  name="heart.text.square.fill"
                  size={80}
                  color={ACCENT}
                />
                <ThemedText style={[styles.matchPopupTitle, { color: ACCENT }]}>{t("matching.match")}</ThemedText>
                <ThemedText style={[styles.matchPopupText, { color: colors.text.primary }]}>
                  {t("matching.liked_you", { name: matchPopup.name })}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.bumbleBtn, { marginTop: 24, width: '100%' }]}
                  onPress={() => router.push("/messages")}
                >
                  <ThemedText style={styles.bumbleBtnText}>{t("matching.send_message")}</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Liked Person Detail Overlay */}
          {selectedLike && (
            <View
              style={[
                StyleSheet.absoluteFillObject,
                styles.container,
                { backgroundColor: colors.background.secondary, zIndex: 1000, elevation: 100 },
              ]}
            >
              {/* Header matching the swipe tab */}
              <View style={[styles.topHeader, { paddingTop: insets.top + 16 }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    position: "absolute",
                    left: 16,
                    bottom: 8,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedLike(null)}
                    hitSlop={12}
                    style={{ paddingVertical: 4, paddingRight: 16 }}
                  >
                    <IconSymbol
                      name="chevron.left"
                      size={28}
                      color={colors.text.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View style={{ flex: 1, alignItems: "center" }}>
                  <ThemedText style={styles.headerNameText}>
                    {selectedLike.display_name},{" "}
                    {selectedLike.age}
                  </ThemedText>
                </View>

                {hasProfile && (
                  <TouchableOpacity
                    style={{ position: "absolute", right: 16, bottom: 8 }}
                    hitSlop={12}
                    onPress={handleContextMenu}
                  >
                    <IconSymbol name="ellipsis" size={24} color={ACCENT} />
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.cardContainer, { paddingTop: 16 }]}>
                <Animated.View
                  style={[
                    styles.card,
                    {
                      transform: [
                        { translateX: panModal.x },
                        { translateY: panModal.y },
                        { rotate: rotateModal },
                      ],
                    }
                  ]}
                  {...panResponderModal.panHandlers}
                >
                  {/* Overlays */}
                  <Animated.View
                    style={[
                      styles.swipeOverlay,
                      styles.likeOverlay,
                      { opacity: likeOpacityModal },
                    ]}
                  >
                    <View style={[styles.swipeLabelContainer, { borderColor: "#2ecc71" }]}>
                      <ThemedText style={[styles.swipeLabel, { color: "#2ecc71" }]}>
                        {t("matching.liked")}
                      </ThemedText>
                    </View>
                  </Animated.View>
                  <Animated.View
                    style={[
                      styles.swipeOverlay,
                      styles.passOverlay,
                      { opacity: passOpacityModal },
                    ]}
                  >
                    <View style={[styles.swipeLabelContainer, { borderColor: "#e74c3c" }]}>
                      <ThemedText style={[styles.swipeLabel, { color: "#e74c3c" }]}>
                        {t("matching.passed")}
                      </ThemedText>
                    </View>
                  </Animated.View>

                  <ScrollView
                    ref={scrollModalRef}
                    style={styles.cardScroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onScrollBeginDrag={() => {
                      setScrollModeModal(true);
                      scrollModeModalRef.current = true;
                    }}
                    onScrollEndDrag={() => {
                      setScrollModeModal(false);
                      scrollModeModalRef.current = false;
                    }}
                    onMomentumScrollEnd={() => {
                      setScrollModeModal(false);
                      scrollModeModalRef.current = false;
                    }}
                    scrollEventThrottle={16}
                  >
                    {renderProfileContent(selectedLike)}
                  </ScrollView>

                  {/* Match Action Buttons exactly like Kişiler tab */}
                  <View style={styles.actionBarOverlay}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.passBtn,
                        { backgroundColor: isDark ? "#2A2A2A" : "#FFF" },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleModalSwipeRef.current("left")}
                    >
                      <IconSymbol
                        name="xmark"
                        size={32}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        styles.likeBtn,
                        { backgroundColor: ACCENT },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleModalSwipeRef.current("right")}
                    >
                      <IconSymbol name="flame.fill" size={32} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
            </View>
          )}
        </>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            backgroundColor: isDark ? "#1C1C1E" : "#FFF",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
            maxHeight: SCREEN_HEIGHT * 0.85,
          }}>
            {/* Handle */}
            <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
            </View>

            {/* Header */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <ThemedText style={{ color: colors.text.secondary, fontSize: 16 }}>{t("matching.cancel")}</ThemedText>
              </TouchableOpacity>
              <ThemedText style={{ fontSize: 18, fontWeight: "800", color: colors.text.primary }}>{t("matching.filtering")}</ThemedText>
              <TouchableOpacity onPress={() => {
                // Validate & clamp all raw inputs before applying
                const ageMin = Math.max(18, Math.min(parseInt(txtAgeMin) || 18, 70));
                const ageMax = Math.min(70, Math.max(parseInt(txtAgeMax) || 70, ageMin));
                const distanceKm = Math.max(1, Math.min(100, parseInt(txtDistance) || 100));
                const heightMin = Math.max(100, Math.min(parseInt(txtHeightMin) || 100, 230));
                const heightMax = Math.min(230, Math.max(parseInt(txtHeightMax) || 230, heightMin));

                const validated: MatchFilters = {
                  ...tempFilters,
                  ageMin, ageMax, distanceKm, heightMin, heightMax,
                };

                // Sync text inputs to validated values
                setTxtAgeMin(String(ageMin));
                setTxtAgeMax(String(ageMax));
                setTxtDistance(String(distanceKm));
                setTxtHeightMin(String(heightMin));
                setTxtHeightMax(String(heightMax));

                setTempFilters(validated);
                setFilters(validated);
                setShowFilterModal(false);
              }}>
                <ThemedText style={{ color: ACCENT, fontSize: 16, fontWeight: "700" }}>{t("matching.apply")}</ThemedText>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
              {/* Gender */}
              <ThemedText style={{ color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{t("matching.gender_title")}</ThemedText>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                {GENDER_FILTER_KEYS.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    onPress={() => setTempFilters(f => ({ ...f, gender: g.value }))}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                      backgroundColor: tempFilters.gender === g.value ? ACCENT : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                    }}
                  >
                    <ThemedText style={{ fontSize: 14, fontWeight: "600", color: tempFilters.gender === g.value ? "#000" : colors.text.primary }}>{t(g.tKey)}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Age Range */}
              <ThemedText style={{ color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{t("matching.age_range")}</ThemedText>
              <ThemedText style={{ color: colors.text.primary, fontSize: 15, fontWeight: "700", marginBottom: 10 }}>{tempFilters.ageMin} – {tempFilters.ageMax}</ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <ThemedText style={{ color: colors.text.tertiary, fontSize: 12 }}>{t("matching.min")}</ThemedText>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={txtAgeMin}
                    onChangeText={(t: string) => setTxtAgeMin(t.replace(/[^0-9]/g, ""))}
                    onBlur={() => {
                      const v = Math.max(18, Math.min(parseInt(txtAgeMin) || 18, tempFilters.ageMax));
                      setTxtAgeMin(String(v));
                      setTempFilters(f => ({ ...f, ageMin: v }));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, color: colors.text.primary, textAlign: "center", fontSize: 16, fontWeight: "700" }}
                  />
                </View>
                <ThemedText style={{ color: colors.text.tertiary, fontSize: 14 }}>—</ThemedText>
                <ThemedText style={{ color: colors.text.tertiary, fontSize: 12 }}>{t("matching.max")}</ThemedText>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={txtAgeMax}
                    onChangeText={(t: string) => setTxtAgeMax(t.replace(/[^0-9]/g, ""))}
                    onBlur={() => {
                      const v = Math.min(70, Math.max(parseInt(txtAgeMax) || 70, tempFilters.ageMin));
                      setTxtAgeMax(String(v));
                      setTempFilters(f => ({ ...f, ageMax: v }));
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, color: colors.text.primary, textAlign: "center", fontSize: 16, fontWeight: "700" }}
                  />
                </View>
              </View>

              {/* Distance */}
              <ThemedText style={{ color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{t("matching.distance")}</ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={txtDistance}
                    onChangeText={(t: string) => setTxtDistance(t.replace(/[^0-9]/g, ""))}
                    onBlur={() => {
                      const v = Math.max(1, Math.min(100, parseInt(txtDistance) || 100));
                      setTxtDistance(String(v));
                      setTempFilters(f => ({ ...f, distanceKm: v }));
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, color: colors.text.primary, textAlign: "center", fontSize: 16, fontWeight: "700" }}
                  />
                </View>
                <ThemedText style={{ color: colors.text.primary, fontSize: 15, fontWeight: "600" }}>{t("matching.km")}</ThemedText>
              </View>

              {/* Height Range */}
              <ThemedText style={{ color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{t("matching.height_range")}</ThemedText>
              <ThemedText style={{ color: colors.text.primary, fontSize: 15, fontWeight: "700", marginBottom: 10 }}>{tempFilters.heightMin} – {tempFilters.heightMax} cm</ThemedText>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <ThemedText style={{ color: colors.text.tertiary, fontSize: 12 }}>{t("matching.min")}</ThemedText>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={txtHeightMin}
                    onChangeText={(t: string) => setTxtHeightMin(t.replace(/[^0-9]/g, ""))}
                    onBlur={() => {
                      const v = Math.max(100, Math.min(parseInt(txtHeightMin) || 100, tempFilters.heightMax));
                      setTxtHeightMin(String(v));
                      setTempFilters(f => ({ ...f, heightMin: v }));
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, color: colors.text.primary, textAlign: "center", fontSize: 16, fontWeight: "700" }}
                  />
                </View>
                <ThemedText style={{ color: colors.text.tertiary, fontSize: 14 }}>—</ThemedText>
                <ThemedText style={{ color: colors.text.tertiary, fontSize: 12 }}>{t("matching.max")}</ThemedText>
                <View style={{ flex: 1 }}>
                  <TextInput
                    value={txtHeightMax}
                    onChangeText={(t: string) => setTxtHeightMax(t.replace(/[^0-9]/g, ""))}
                    onBlur={() => {
                      const v = Math.min(230, Math.max(parseInt(txtHeightMax) || 230, tempFilters.heightMin));
                      setTxtHeightMax(String(v));
                      setTempFilters(f => ({ ...f, heightMax: v }));
                    }}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={{ backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, color: colors.text.primary, textAlign: "center", fontSize: 16, fontWeight: "700" }}
                  />
                </View>
              </View>

              {/* Star Sign */}
              <ThemedText style={{ color: colors.text.secondary, fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{t("matching.sign")}</ThemedText>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <TouchableOpacity
                  onPress={() => setTempFilters(f => ({ ...f, starSign: "" }))}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
                    backgroundColor: tempFilters.starSign === "" ? ACCENT : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                  }}
                >
                  <ThemedText style={{ fontSize: 13, fontWeight: "600", color: tempFilters.starSign === "" ? "#000" : colors.text.primary }}>{t("matching.gender_all")}</ThemedText>
                </TouchableOpacity>
                {STAR_SIGN_OPTIONS.map((s, idx) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setTempFilters(f => ({ ...f, starSign: f.starSign === s ? "" : s }))}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
                      backgroundColor: tempFilters.starSign === s ? ACCENT : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                    }}
                  >
                    <ThemedText style={{ fontSize: 13, fontWeight: "600", color: tempFilters.starSign === s ? "#000" : colors.text.primary }}>{t(`zodiac.sign_${idx}`, s)}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Reset Button */}
              <TouchableOpacity
                onPress={() => {
                  setTempFilters({ ...DEFAULT_FILTERS });
                  setTxtAgeMin(String(DEFAULT_FILTERS.ageMin));
                  setTxtAgeMax(String(DEFAULT_FILTERS.ageMax));
                  setTxtDistance(String(DEFAULT_FILTERS.distanceKm));
                  setTxtHeightMin(String(DEFAULT_FILTERS.heightMin));
                  setTxtHeightMax(String(DEFAULT_FILTERS.heightMax));
                }}
                style={{ alignItems: "center", paddingVertical: 14, marginTop: 8, marginBottom: 16 }}
              >
                <ThemedText style={{ color: "#FF3B30", fontSize: 15, fontWeight: "600" }}>{t("matching.reset_filters")}</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
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
    width: (SCREEN_WIDTH - 32 - 12) / 2, // 32 total padding (16 left/right), 12 inner gap
    aspectRatio: 0.75,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#1A1A1A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 12, // Add margin to prevent overlap
  },
  likeCardImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.75,
    resizeMode: "cover",
  },
  likeCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    justifyContent: "flex-end",
    padding: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    borderRadius: 24,
    backgroundColor: "transparent",
    overflow: "hidden",
    elevation: 0,
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
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Action Bar Overlay (floating over the card bottom)
  actionBarOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    zIndex: 100,
  },
  actionBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  passBtn: {},
  likeBtn: {},

  // Match Popup
  matchPopup: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 200,
  },
  matchPopupContent: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  matchPopupTitle: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 8,
  },
  matchPopupText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
  },
  // Prompt Cards
  promptCard: {
    width: "100%",
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  promptQuestion: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  promptAnswer: {
    fontSize: 24,
    fontWeight: "700",
    fontStyle: "italic",
  },

  hingeContainer: {
    padding: 16,
    paddingTop: 8,
  },
  hingeHeader: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: 8,
  },
  hingeName: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  hingeLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  hingeLocationText: {
    fontSize: 15,
    marginLeft: 6,
    opacity: 0.7,
  },
  hingeCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 3,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  hingePadding: {
    padding: 24,
  },
  hingeImage: {
    width: "100%",
    aspectRatio: 0.8,
    resizeMode: "cover",
  },
  hingePromptQ: {
    fontSize: 13,
    fontWeight: "600",
    opacity: 0.6,
    marginBottom: 12,
  },
  hingePromptA: {
    fontSize: 26,
    fontWeight: "800",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  hingeTraitRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  hingeTraitText: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },

  headerNameText: {
    fontSize: 20,
    fontWeight: "900",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
  },
  segmentedControlContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  segmentBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  segmentBtnActive: {
    backgroundColor: ACCENT,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: "#FFF",
  },
  profileBtn: {
    position: "absolute",
    right: 16,
  },

  // Unified Feed-like Card Styles
  unifiedCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 24,
  },
  unifiedImageTop: {
    width: "100%",
    aspectRatio: 3 / 4,
    resizeMode: "cover",
  },
  unifiedImageMiddle: {
    width: "100%",
    aspectRatio: 1, // square for inner photos
    resizeMode: "cover",
  },
  unifiedContentGroup: {
    padding: 24,
    paddingTop: 16,
    gap: 16,
  },
  unifiedName: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    lineHeight: 36,
    paddingTop: 4,
  },
  unifiedTraitsColumn: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unifiedInterestsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  unifiedActivePlace: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(29, 185, 84, 0.15)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: "center",
    marginTop: -4,
  },
  unifiedActivePlaceText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "800",
  },
  unifiedSection: {
    marginTop: 8,
  },
  unifiedPromptQ: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
    lineHeight: 28,
  },
  unifiedPromptA: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    opacity: 0.85,
  },
  unifiedBio: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
    opacity: 0.85,
  },
  unifiedTraitBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(150, 150, 150, 0.2)",
    width: "48%", // 2 columns
  },
  unifiedTraitText: {
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
});
