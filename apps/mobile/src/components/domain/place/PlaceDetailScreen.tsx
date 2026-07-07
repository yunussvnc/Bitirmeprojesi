/**
 * Place Detail Screen
 *
 * Immersive place detail experience inspired by TrendyolGo/Yemeksepeti.
 * Premium dark-first design with rich information architecture.
 */

import { getTranslatedCategory, normalizePlaceCategory } from '@/src/utils/categories';
import { router, useLocalSearchParams, Stack } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  PanResponder,
  Animated as RNAnimated,
  Share,
  ActivityIndicator,
} from "react-native";
import { useScrollToTop } from '@react-navigation/native';
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/hooks/useTheme";
import { Screen, Section, type ScreenRef } from "@/src/components/layout";
import { PlaceCard } from "@/src/components/domain/place/PlaceCard";
import { Button, Card, ReviewForm, RatingStars } from "@/src/components/ui";

import { handleApiError } from '@/src/utils/errorHandler';
import { useTranslation } from 'react-i18next';
import { useAppStore } from "@/src/store/useAppStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getPlaceImageSource, hasPlaceImage } from "@/src/utils/placeImages";
import { spacing, createTextStyle } from "@/src/constants/design";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { calculateDistance, getCurrentLocation, type PlaceLocation } from "@/src/utils/location";
import { getPlaceById, getAllPlaces, togglePlaceFollow, getPlacePosts, getPlaceStories, recordPlaceInteraction, logInteraction } from "@/src/services/mekanService";
import { lightImpact, success, warning } from "@/src/utils/haptics";
import { logger } from "@/src/utils/logger";
import { apiGet, apiPost } from "@/src/utils/apiClient";
import { FlatList } from "react-native";
import { StoryViewerModal } from "../explore/StoryViewerModal";
import { ReviewCard, type ReviewItemType } from "./ReviewCard";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

type Review = {
  id: number;
  user_id: number;
  place_id: number;
  comment_text: string;
  rating: number;
  is_verified: boolean;
  created_at: string;
  media_url?: string;
  media_urls?: string[];
  user?: {
    username?: string;
    first_name?: string;
    avatar_url?: string;
  };
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const REVIEW_SHEET_COLLAPSED = Math.min(SCREEN_HEIGHT * 0.55, 520);
const REVIEW_SHEET_EXPANDED = SCREEN_HEIGHT * 0.72;

/** Menü öğelerini kategoriye göre gruplar */
function groupMenuByCategory(items: any[], t: any): { category: string; items: any[] }[] {
  const map = new Map<string, any[]>();
  for (const item of items) {
    if (item.type === 'image') continue; // image tipli öğeleri atla
    const cat = getTranslatedCategory(item.category, t) || t("place_detail.menu");
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return Array.from(map.entries()).map(([category, catItems]) => ({ category, items: catItems }));
}


/** Swipe-down-to-close fullscreen image viewer */
function HeroImageViewer({
  heroSource, insetTop, onClose, screenWidth, screenHeight, t,
}: {
  heroSource: any;
  insetTop: number;
  onClose: () => void;
  screenWidth: number;
  screenHeight: number;
  t: (key: string) => string;
}) {
  const translateY = useRef(new RNAnimated.Value(0)).current;
  const opacity = useRef(new RNAnimated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          translateY.setValue(g.dy);
          opacity.setValue(Math.max(0.3, 1 - g.dy / 300));
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) {
          // Threshold aşıldı — kapat
          RNAnimated.parallel([
            RNAnimated.timing(translateY, { toValue: screenHeight, duration: 220, useNativeDriver: true }),
            RNAnimated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          ]).start(() => onClose());
        } else {
          // Geri döndür
          RNAnimated.parallel([
            RNAnimated.spring(translateY, { toValue: 0, useNativeDriver: true }),
            RNAnimated.spring(opacity, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;

  return (
    <RNAnimated.View
      style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center", opacity }}
      {...panResponder.panHandlers}
    >
      {/* Kapat butonu */}
      <View style={{ flexDirection: "row", justifyContent: "flex-end", position: "absolute", top: insetTop, width: "100%", paddingHorizontal: 20, zIndex: 10 }}>
        <TouchableOpacity onPress={onClose} style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 }}>
          <IconSymbol name="xmark" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>{t('explore.close')}</Text>
        </TouchableOpacity>
      </View>

      {/* Görsel + sürükleme geri bildirimi */}
      <RNAnimated.View style={{ transform: [{ translateY }] }}>
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          bouncesZoom
          centerContent
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}
          style={{ width: screenWidth, height: screenHeight }}
        >
          <Pressable>
            <Image source={heroSource} style={{ width: screenWidth, height: screenHeight * 0.8 }} resizeMode="contain" />
          </Pressable>
        </ScrollView>
      </RNAnimated.View>

      {/* Swipe ipucu */}
      <View style={{ position: "absolute", bottom: 40, alignItems: "center", gap: 4 }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.4)" }} />
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>Kapatmak için aşağı kaydırın</Text>
      </View>
    </RNAnimated.View>
  );
}

export default function PlaceDetailScreen({
  providedId,
  isVenueDashboard = false
}: {
  providedId?: string,
  isVenueDashboard?: boolean
} = {}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const id = providedId || String(params?.id ?? "");
  const { t } = useTranslation();
  const settings = useSettingsStore();

  const savedIds = useAppStore((s) => s.savedIds);
  const toggleSaved = useAppStore((s) => s.toggleSave);
  const saved = savedIds.includes(id);
  const currentUser = useAuthStore((s) => s.user);

  const [place, setPlace] = useState<any>(() => {
    if (params && (params.name || params.title)) {
      return {
        id: Number(id),
        name: params.name || params.title || "",
        category: params.category || "",
        photo_url: params.photo_url || params.image || "",
        description: params.description || "",
        subtitle: params.subtitle || "",
        address: params.address || "",
        gallery_urls: [],
        menu_items: [],
        review_count: 0,
        saved_count: 0,
        follower_count: 0,
        is_following: false,
      };
    }
    return null;
  });
  const [userLocation, setUserLocation] = useState<PlaceLocation | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showHeroImage, setShowHeroImage] = useState(false);

  const [activeTab, setActiveTab] = useState<'info' | 'menu' | 'reviews'>('info');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [similarPlaces, setSimilarPlaces] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewGalleryData, setReviewGalleryData] = useState<{ reviews: Review[]; reviewIndex: number; imageIndex: number } | null>(null);

  // Takip & Sosyal İçerik
  // null = henüz API'den yüklenmedi → buton disabled görünür, "Takip Et" flash'ı önlenir
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [placePosts, setPlacePosts] = useState<any[]>([]);
  const [placeStories, setPlaceStories] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showPostsSection, setShowPostsSection] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showStoriesModal, setShowStoriesModal] = useState(false);

  const screenRef = useRef<ScreenRef>(null);
  useScrollToTop(screenRef as any);

  // Çift tıklama koruması — 600ms içinde tekrar navigasyona izin vermez
  const navGuard = useRef(false);
  const navigateToPlace = useCallback((placeData: Record<string, string>) => {
    if (navGuard.current) return;
    navGuard.current = true;
    router.push({ pathname: "/place/[id]", params: placeData } as any);
    setTimeout(() => { navGuard.current = false; }, 600);
  }, [router]);

  const reviewSheetHeight = useRef(new RNAnimated.Value(REVIEW_SHEET_COLLAPSED)).current;
  const reviewStartHeightRef = useRef(REVIEW_SHEET_COLLAPSED);
  const reviewScrollOffsetRef = useRef(0);

  const [showMenu, setShowMenu] = useState(false);
  const menuSheetHeight = useRef(new RNAnimated.Value(REVIEW_SHEET_COLLAPSED)).current;
  const menuStartHeightRef = useRef(REVIEW_SHEET_COLLAPSED);

  const handleAreaPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => {
          const nextH = reviewStartHeightRef.current - g.dy;
          const clamped = Math.max(0, Math.min(REVIEW_SHEET_EXPANDED, nextH));
          reviewSheetHeight.setValue(clamped);
        },
        onPanResponderRelease: (_, g) => {
          const currentH = reviewStartHeightRef.current - g.dy;

          // Eğer çok aşağı çekildiyse veya hızlı aşağı çekildiyse, kapat
          if (currentH < REVIEW_SHEET_COLLAPSED * 0.3 || (g.dy > 50 && g.vy > 0.5)) {
            setShowReviews(false);
            setTimeout(() => {
              reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
              reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
            }, 50);
            return;
          }

          // Yukarı çekme: eğer genişletilmiş sınıra yakınsa, tam genişlet
          if (g.dy < -30 && currentH > REVIEW_SHEET_COLLAPSED + 50) {
            reviewStartHeightRef.current = REVIEW_SHEET_EXPANDED;
            RNAnimated.spring(reviewSheetHeight, {
              toValue: REVIEW_SHEET_EXPANDED,
              useNativeDriver: false,
              friction: 10,
              tension: 60,
            }).start();
            return;
          }

          // Diğer durumlarda, mevcut konumda kal
          const clampedH = Math.max(REVIEW_SHEET_COLLAPSED, Math.min(REVIEW_SHEET_EXPANDED, currentH));
          reviewStartHeightRef.current = clampedH;
          RNAnimated.spring(reviewSheetHeight, {
            toValue: clampedH,
            useNativeDriver: false,
            friction: 10,
            tension: 60,
          }).start();
        },
      }),
    [reviewSheetHeight]
  );

  const handleMenuPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => {
          const nextH = menuStartHeightRef.current - g.dy;
          const clamped = Math.max(0, Math.min(REVIEW_SHEET_EXPANDED, nextH));
          menuSheetHeight.setValue(clamped);
        },
        onPanResponderRelease: (_, g) => {
          const currentH = menuStartHeightRef.current - g.dy;
          if (currentH < REVIEW_SHEET_COLLAPSED * 0.3 || (g.dy > 50 && g.vy > 0.5)) {
            setShowMenu(false);
            setTimeout(() => {
              menuSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
              menuStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
            }, 50);
            return;
          }
          if (g.dy < -30 && currentH > REVIEW_SHEET_COLLAPSED + 50) {
            menuStartHeightRef.current = REVIEW_SHEET_EXPANDED;
            RNAnimated.spring(menuSheetHeight, {
              toValue: REVIEW_SHEET_EXPANDED,
              useNativeDriver: false,
              friction: 10,
              tension: 60,
            }).start();
            return;
          }
          const clampedH = Math.max(REVIEW_SHEET_COLLAPSED, Math.min(REVIEW_SHEET_EXPANDED, currentH));
          menuStartHeightRef.current = clampedH;
          RNAnimated.spring(menuSheetHeight, {
            toValue: clampedH,
            useNativeDriver: false,
            friction: 10,
            tension: 60,
          }).start();
        },
      }),
    [menuSheetHeight]
  );

  useEffect(() => {
    if (showReviews) {
      reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
      reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
    } else {
      reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
      reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
    }
  }, [showReviews, reviewSheetHeight]);

  useEffect(() => {
    if (!showReviews || !id) return;
  }, [showReviews, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (showMenu) {
      menuSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
      menuStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
    } else {
      menuSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
      menuStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
    }
  }, [showMenu, menuSheetHeight]);

  // Load place data
  useEffect(() => {
    const cancelled = { current: false };
    loadPlaceData(cancelled);
    loadReviews(1, false, cancelled);
    loadSocialContent(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps -- loadPlaceData/loadReviews stable by design

  const loadPlaceData = async (cancelled: { current: boolean } = { current: false }) => {
    try {
      const foundPlace = await getPlaceById(id);
      if (!cancelled.current && foundPlace) {
        const normalizedCat = normalizePlaceCategory(foundPlace.category);
        setPlace({
          ...foundPlace,
          category: normalizedCat || foundPlace.category,
        });
        // Takip durumunu place verisiyle al (is_following zaten enrich'de geliyor)
        if (typeof foundPlace.is_following === 'boolean') {
          setIsFollowing(foundPlace.is_following);
        }
        if (typeof foundPlace.follower_count === 'number') {
          setFollowerCount(foundPlace.follower_count);
        }
      }
      // Etkileşimi arka planda kaydet (algoritmik boost)
        // Analitik ve Öneri Motoru için etkileşimi kaydet
        recordPlaceInteraction(id, 'view').catch(() => {});
        logInteraction(id, 'CARD_VIEW', 3).catch(() => {});
      } catch (err) {
        console.error("Error loading place detail:", err);
    }
  };

  const loadSocialContent = async (cancelled: { current: boolean } = { current: false }) => {
    if (!id) return;
    setSocialLoading(true);
    try {
      const [postsData, storiesData] = await Promise.all([
        getPlacePosts(id, 1, 18),
        getPlaceStories(id),
      ]);
      if (!cancelled.current) {
        setPlacePosts(postsData?.items || []);
        setPlaceStories(storiesData?.items || []);
        if ((postsData?.items?.length || 0) > 0 || (storiesData?.items?.length || 0) > 0) {
          setShowPostsSection(true);
        }
      }
    } catch (error) {
      if (!cancelled.current) logger.error("Error loading social content:", error);
    } finally {
      if (!cancelled.current) setSocialLoading(false);
    }
  };

  const handleFollow = async () => {
    if (followLoading || isFollowing === null) return;

    // ──── OPTİMİSTİK GÜNCELLEME ────
    // UI'ı hemen güncelle — API cevabı bekleme
    const prevFollowing = isFollowing;
    const prevCount = followerCount ?? 0;
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowerCount(prev => newFollowing ? (prev ?? 0) + 1 : Math.max(0, (prev ?? 0) - 1));
    lightImpact();
    if (newFollowing) success();
    // ──────────────────────────────

    setFollowLoading(true);
    try {
      const result = await togglePlaceFollow(id);
      // API'den gelen gerçek değeri uygula (sayı tutarsızlığı olmaması için)
      setIsFollowing(result.followed);
      setFollowerCount(result.follower_count);
    } catch (error) {
      // Hata durumunda eski duruma geri dön (rollback)
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
      logger.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };


  const loadReviews = async (pageToLoad = 1, append = false, cancelled: { current: boolean } = { current: false }) => {
    if (!id) return;
    if (pageToLoad === 1) {
      setReviewsLoading(true);
    } else {
      setReviewsLoadingMore(true);
    }
    setReviewsError(null);
    try {
      const data = await apiGet<Review[]>(`/places/${id}/reviews?page=${pageToLoad}&page_size=20`);
      if (!cancelled.current) {
        if (append) {
          setReviews(prev => [...prev, ...(data || [])]);
        } else {
          setReviews(data || []);
        }
        setHasMoreReviews((data?.length || 0) === 20);
        setReviewsPage(pageToLoad);
      }
    } catch (error) {
      if (!cancelled.current) {
        logger.error("Error loading reviews:", error);
        if (pageToLoad === 1) setReviewsError(t("explore.no_comments"));
      }
    } finally {
      if (!cancelled.current) {
        setReviewsLoading(false);
        setReviewsLoadingMore(false);
      }
    }
  };



  const loadSimilarPlaces = async (cancelled: { current: boolean } = { current: false }) => {
    if (!place?.category) return;
    try {
      // Sadece aynı kategorideki 6 mekanu çek — minimal=true ile enrich atlanır
      const data = await apiGet<any>(`/places/search?category=${encodeURIComponent(place.category)}&page_size=6&minimal=true`);
      if (cancelled.current) return;
      const items: any[] = data?.items ?? [];
      const filtered = items.filter((p: any) => String(p.id) !== id).slice(0, 5);
      setSimilarPlaces(filtered.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        photo_url: p.photo_url,
        average_rating: p.average_rating,
        address: p.address,
      })));
    } catch (error) {
      if (!cancelled.current) logger.error("Error loading similar places:", error);
    }
  };

  useEffect(() => {
    if (!place?.category) return;
    const cancelled = { current: false };
    // Benzer mekanları biraz geciktirerek yükle (ana veri yüklenmesin diye)
    const timer = setTimeout(() => loadSimilarPlaces(cancelled), 300);
    return () => {
      cancelled.current = true;
      clearTimeout(timer);
    };
  }, [place?.id, place?.category]); // eslint-disable-line react-hooks/exhaustive-deps

  const checkUserLocation = async () => {
    if (!place?.latitude || !place?.longitude) return;

    setCheckingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert(t("place_extra.location_perm_title"), t("place_extra.location_perm_desc"), [{ text: t("common.ok") }]);
        return;
      }

      setUserLocation(location);

      const distance = calculateDistance(location.latitude, location.longitude, place.latitude, place.longitude);
      setLastDistance(distance);

      const unlockRadius = 100;
      const relockRadius = 120;

      let nearby = isNearby;
      if (!isNearby) {
        nearby = distance <= unlockRadius;
      } else {
        nearby = distance <= relockRadius;
      }

      setIsNearby(nearby);
      if (nearby) {
        success();
      } else {
        warning();
      }
    } catch (error) {
      logger.error("Error checking location:", error);
      Alert.alert(t("common.error"), t("place_extra.location_check_err"));
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!isNearby) {
      Alert.alert(t("review.warning"), t("place_extra.not_nearby"));
      return;
    }

    setSubmittingReview(true);
    try {
      await apiPost("/reviews/", {
        place_id: Number(id),
        comment_text: comment || "Yorum yapılmadı",
        rating: rating,
        user_lat: userLocation?.latitude,
        user_lng: userLocation?.longitude,
      });

      Alert.alert(t("common.success"), t("place_extra.review_sent"), [{ text: t("common.ok"), onPress: () => setShowReviewForm(false) }]);

      await loadReviews();
    } catch (error) {
      Alert.alert(t("common.error"), t("place_extra.review_submit_err"));
      logger.error("Error submitting review:", error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleNavigate = () => {
    if (place?.latitude != null && place?.longitude != null) {
      const lat = place.latitude;
      const lng = place.longitude;
      const url =
        Platform.OS === "ios"
          ? `maps://maps.apple.com/?daddr=${lat},${lng}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url).catch(() => {
        Alert.alert(t("common.error"), t("place_extra.map_app_err"));
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place?.name || "Mekan"} - ${place?.address || ""}`,
        url: `asemos://place/${id}`,
      });
    } catch (error) {
      logger.error("Error sharing:", error);
    }
  };

  const handleCall = () => {
    // TODO: Mekan telefon numarası eklenmeli
    Alert.alert(t("place_extra.info"), t("place_detail.phone_not_added"));
  };

  const heroSource = useMemo(() => {
    // API'den gelen photo_url'yi öncelikle kullan
    if (place?.photo_url) {
      return { uri: place.photo_url };
    }
    // Yoksa default place image generator kullan
    return getPlaceImageSource(place || id);
  }, [place, id]);

  const menuGroups = useMemo(() => {
    if (!place?.menu_items) return [];
    return groupMenuByCategory(place.menu_items, t);
  }, [place?.menu_items, t]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const totalReviewCount = reviews.length;

  const distanceText = useMemo(() => {
    if (!userLocation || !place?.latitude || !place?.longitude) return null;
    const dist = calculateDistance(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude);
    if (dist < 1000) {
      return `${Math.round(dist)} m uzakta`;
    }
    return `${(dist / 1000).toFixed(1)} km uzakta`;
  }, [userLocation, place]);

  // Typography styles - inline to avoid type issues
  const h1Style = { fontSize: 24, fontWeight: "700" as const, color: colors.text.primary };
  const h2Style = { fontSize: 20, fontWeight: "700" as const, color: colors.text.primary };
  const bodyStyle = { fontSize: 15, fontWeight: "400" as const, color: colors.text.primary };
  const bodySmallStyle = { fontSize: 14, fontWeight: "400" as const, color: colors.text.secondary };
  const captionStyle = { fontSize: 12, fontWeight: "400" as const, color: colors.text.tertiary };

  if (!place) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background?.primary || '#fff', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent?.primary || '#000'} />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(280)} style={{ flex: 1 }}>
      <Stack.Screen 
        options={{ 
          gestureEnabled: true, 
          fullScreenGestureEnabled: true,
          animation: "slide_from_right" 
        }} 
      />
      <Screen ref={screenRef} scrollable withTabBar={isVenueDashboard}>
        {/* Header with Back and Save */}
        <View style={[styles.header, isVenueDashboard && { justifyContent: "space-between", paddingHorizontal: spacing.sm }]}>
          {isVenueDashboard && (
            <Text style={[h2Style, { fontSize: 18, fontWeight: '700' }]}>Mekan Paneli</Text>
          )}
          {!isVenueDashboard && (
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                router.back();
              }}
              style={[styles.headerButton, { backgroundColor: colors.surface.elevated }]}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
            </TouchableOpacity>
          )}

          {isVenueDashboard ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Hikaye Paylaş */}
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  router.push({
                    pathname: "/create-story",
                    params: { isVenue: "true", placeId: String(place?.id), placeName: place?.name }
                  });
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(240, 148, 51, 0.15)',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(240, 148, 51, 0.3)'
                }}
              >
                <IconSymbol name="camera.fill" size={14} color="#f09433" />
                <Text style={{ fontSize: 12, color: '#f09433', fontWeight: '600' }}>Hikaye</Text>
              </TouchableOpacity>
              
              {/* Gönderi Paylaş */}
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  router.push({
                    pathname: "/create-post",
                    params: { isVenue: "true", placeId: String(place?.id), placeName: place?.name }
                  });
                }}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.accent.primary + '22',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.accent.primary + '44'
                }}
              >
                <IconSymbol name="plus" size={14} color={colors.accent.primary} />
                <Text style={{ fontSize: 12, color: colors.accent.primary, fontWeight: '600' }}>Gönderi</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  handleShare();
                }}
                style={[styles.headerButton, { backgroundColor: colors.surface.elevated, marginRight: spacing.sm }]}
              >
                <IconSymbol name="square.and.arrow.up" size={20} color={colors.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (saved) lightImpact();
                  else success();
                  toggleSaved({
                    id,
                    name: place?.name || `Mekan #${id}`,
                    subtitle: place?.subtitle || place?.description || "Detay ekranı",
                    photo_url: place?.photo_url,
                    category: place?.category,
                    tags: place?.tags,
                  });
                }}
                style={[
                  styles.headerButton,
                  {
                    backgroundColor: saved ? colors.accent.primary : colors.surface.elevated,
                  },
                ]}
              >
                <IconSymbol
                  name={saved ? "heart.fill" : "heart"}
                  size={20}
                  color={saved ? colors.text.inverse : colors.text.primary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          {hasPlaceImage(place) ? (
            <Pressable onPress={() => {
              lightImpact();
              setShowHeroImage(true);
            }} style={[{ backgroundColor: colors.surface.elevated, flex: 1 }]}>
              <Image source={heroSource} style={styles.placeImage} resizeMode="contain" />
            </Pressable>
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="mappin.and.ellipse" size={48} color={colors.text.tertiary} />
              <Text style={[bodySmallStyle, { color: colors.text.tertiary, marginTop: 8 }]}>{t("place_detail.no_image")}</Text>
            </View>
          )}
        </View>

        {/* Title and Meta */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[h1Style, { fontSize: 24, marginBottom: spacing.sm, flex: 1 }]}>{place?.name || `Mekan #${id}`}</Text>
            <View style={{ alignItems: "flex-end", gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  setShowReviews(true);
                }}
                style={[styles.reviewButton, { borderColor: "#22c55e", backgroundColor: "rgba(34, 197, 94, 0.1)" }]}
              >
                <Text style={{ fontSize: 14, color: "#22c55e", fontWeight: "600" }}>{t("place_detail.reviews")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reviewButton, { borderColor: "#10b981", backgroundColor: "rgba(16, 185, 129, 0.1)" }]}
                onPress={() => {
                  lightImpact();
                  setShowMenu(true);
                }}
              >
                <View style={[styles.reviewIconContainer, { backgroundColor: "transparent" }]}>
                  <IconSymbol name="list.bullet.clipboard.fill" size={14} color="#10b981" />
                  <Text style={{ fontSize: 14, color: "#10b981", fontWeight: "600", marginLeft: 4 }}>{t("place_detail.menu")}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.metaRow}>
            {place?.category && <Text style={[bodySmallStyle, { color: colors.text.secondary }]}>{getTranslatedCategory(place.category, t)}</Text>}
            {place?.city && place?.category && <Text style={[bodySmallStyle, { color: colors.text.tertiary }]}> • </Text>}
            {place?.city && <Text style={[bodySmallStyle, { color: colors.text.secondary }]}>{place.city}</Text>}
          </View>

          {/* Takip Et Butonu + Takipçi Sayısı */}
          {!isVenueDashboard && isFollowing !== null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 12 }}>
              <TouchableOpacity
                onPress={handleFollow}
                disabled={followLoading}
                style={[
                  {
                    paddingHorizontal: 20,
                    paddingVertical: 9,
                    borderRadius: 22,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: followLoading ? 0.7 : 1,
                  },
                  isFollowing
                    ? { backgroundColor: colors.surface.elevated, borderWidth: 1, borderColor: colors.surface.border }
                    : { backgroundColor: colors.accent.primary },
                ]}
              >
                <IconSymbol
                  name={isFollowing ? 'checkmark' : 'plus'}
                  size={14}
                  color={isFollowing ? colors.text.primary : colors.text.inverse}
                />
                <Text style={[
                  { fontSize: 14, fontWeight: '600' },
                  isFollowing ? { color: colors.text.primary } : { color: colors.text.inverse },
                ]}>
                  {isFollowing ? 'Takiptesin' : 'Takip Et'}
                </Text>
              </TouchableOpacity>
              {followerCount != null && followerCount > 0 && (
                <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                  {followerCount >= 1000
                    ? `${(followerCount / 1000).toFixed(1)}B`
                    : followerCount} takipçi
                </Text>
              )}
            </View>
          )}

          {/* Tags */}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Mekanın Aktif Hikayeleri */}
          {settings.mapShowStories && placeStories && placeStories.length > 0 && (
            <View style={{ paddingHorizontal: spacing.base, marginBottom: spacing.md }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                <TouchableOpacity
                  onPress={() => {
                    lightImpact();
                    setSelectedStoryIndex(0);
                    setShowStoriesModal(true);
                  }}
                  activeOpacity={0.8}
                  style={{ alignItems: 'center' }}
                >
                  <View style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    borderWidth: 2,
                    borderColor: '#f09433',
                    padding: 3,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    {place?.photo_url ? (
                      <Image source={{ uri: place.photo_url }} style={{ width: 60, height: 60, borderRadius: 30 }} />
                    ) : (
                      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface.elevated, justifyContent: 'center', alignItems: 'center' }}>
                        <IconSymbol name="camera.fill" size={24} color={colors.text.secondary} />
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.text.primary, marginTop: 4, fontWeight: '600' }}>Hikayeler</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
          {/* Place Meta Section */}
          <View style={styles.placeMetaSection}>
            <View style={styles.placeMetaRow}>
              {distanceText && (
                <View style={styles.distanceContainer}>
                  <IconSymbol name="location.fill" size={18} color={colors.text.secondary} />
                  <Text style={[bodySmallStyle, { marginLeft: 4 }]}>{distanceText}</Text>
                </View>
              )}
            </View>
          </View>

          {place?.campaign_text && (
            <Card style={styles.campaignCard}>
              <View style={styles.campaignHeader}>
                <IconSymbol name="sparkles" size={18} color={colors.accent.primary} />
                <Text style={[h2Style, { fontSize: 18, marginLeft: 8 }]}>{t("place_detail.campaign")}</Text>
              </View>
              <Text style={[bodyStyle, { lineHeight: 22, color: colors.text.secondary }]}>{place.campaign_text}</Text>
            </Card>
          )}

          {/* Atmosphere Section – only when description exists and is not identical to address */}
          {place?.description && place.description !== place.address && (
            <Card style={styles.sectionCard}>
              <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>{t("place_detail.atmosphere")}</Text>
              <Text style={[bodyStyle, { lineHeight: 24, marginBottom: spacing.sm }]}>{place.description}</Text>
              <View style={styles.atmosphereTags}>
                <View style={[styles.atmosphereTag, { backgroundColor: colors.surface.default }]}>
                  <FontAwesome5 name="volume-mute" size={14} color={colors.text.secondary} solid={false} />
                  <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                    {place.tags?.includes("quiet") ? t("place_extra.quiet_vibe") : t("place_extra.lively_vibe")} {t("place_extra.vibe_label")}
                  </Text>
                </View>
                <View style={[styles.atmosphereTag, { backgroundColor: colors.surface.default }]}>
                  <IconSymbol name="person.fill" size={20} color={colors.text.secondary} />
                  <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                    {place.tags?.includes("work") ? t("place_extra.work_ideal") : t("place_extra.social_ideal")} {t("place_extra.ideal_for")}
                  </Text>
                </View>
              </View>
              <Text style={[h2Style, { fontSize: 18, marginTop: spacing.lg, marginBottom: spacing.base }]}>{t("place_detail.features")}</Text>
              <View style={styles.highlightsGrid}>
                {[
                  { fa5: "wifi" as const, fa5Unavailable: "wifi-slash" as const, label: t("place_detail.feature_wifi"), available: true },
                  { fa5: "plug" as const, fa5Unavailable: "plug" as const, label: t("place_detail.feature_plug"), available: true },
                  {
                    fa5: "volume-mute" as const,
                    fa5Unavailable: "volume-mute" as const,
                    label: t("place_detail.feature_quiet"),
                    available: place?.tags?.includes("quiet"),
                  },
                  { fa5: "umbrella" as const, fa5Unavailable: "umbrella" as const, label: t("place_detail.feature_terrace"), available: false },
                ].map((item, idx) => {
                  const iconName = item.available ? item.fa5 : item.fa5Unavailable;
                  const iconColor = item.available ? colors.text.primary : colors.text.tertiary;
                  return (
                    <TouchableOpacity key={idx} activeOpacity={0.8} style={[styles.highlightItem, item.label === "Terasta\nOturma" && styles.highlightItemLowered]}>
                      <FontAwesome5 name={iconName} size={20} color={iconColor} solid={false} />
                      <Text
                        style={[
                          bodySmallStyle,
                          {
                            marginTop: 6,
                            textAlign: "center",
                            color: item.available ? colors.text.primary : colors.text.tertiary,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}

          {/* Inline Menu Preview */}
          {place?.menu_items && place.menu_items.length > 0 && place.menu_items[0]?.type !== 'image' && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <IconSymbol name="list.bullet.clipboard.fill" size={22} color="#10b981" />
                  <Text style={[h1Style, { fontSize: 20 }]}>{t("place_detail.menu")}</Text>
                </View>
                {place.menu_items?.length > 4 && (
                  <TouchableOpacity 
                    onPress={() => setShowMenu(true)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}
                  >
                    <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '600' }}>{t("place_detail.see_all")}</Text>
                    <IconSymbol name="chevron.right" size={14} color="#10b981" />
                  </TouchableOpacity>
                )}
              </View>
              {place.menu_items.slice(0, 3).map((item: any, idx: number) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: idx < Math.min(place.menu_items.length, 3) - 1 ? 1 : 0,
                    borderBottomColor: colors.surface.border,
                  }}
                >
                  {item.img ? (
                    <Image source={{ uri: item.img }} style={{ width: 48, height: 48, borderRadius: 12, marginRight: 12, backgroundColor: colors.surface.elevated }} />
                  ) : (
                    <View style={{ width: 48, height: 48, borderRadius: 12, marginRight: 12, backgroundColor: colors.surface.elevated, justifyContent: 'center', alignItems: 'center' }}>
                      <IconSymbol name="fork.knife" size={20} color={colors.text.tertiary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[bodyStyle, { fontWeight: '600' }]} numberOfLines={1}>{item.name}</Text>
                    {item.desc ? <Text style={[captionStyle, { marginTop: 2 }]} numberOfLines={1}>{item.desc}</Text> : null}
                  </View>
                  {item.price ? (
                    <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#10b981' }}>{item.price}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
              {place.menu_items.length > 3 && (
                <Text style={[createTextStyle('caption', colors.text.secondary), styles.moreItemsText]}>
                  {t('place_detail.more_items', { count: place.menu_items.length - 3 })}
                </Text>
              )}
            </Card>
          )}

          {/* Inline Menu Preview — Image Type */}
          {place?.menu_items && place.menu_items.length > 0 && place.menu_items[0]?.type === 'image' && (
            <Card style={styles.sectionCard}>
              <View style={[styles.sectionBox, { marginTop: spacing.md }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <IconSymbol name="doc.text.image" size={22} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 2 }}>{t("place_detail.menu")}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowMenu(true)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 13, color: '#10b981', fontWeight: '600' }}>{t("place_detail.open_menu")}</Text>
                    <IconSymbol name="chevron.right" size={14} color="#10b981" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ borderRadius: 16, overflow: 'hidden', height: 180, backgroundColor: colors.surface.elevated }}>
                <Image source={{ uri: place.menu_items[0].uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                  <IconSymbol name="doc.text.magnifyingglass" size={32} color="#fff" />
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginTop: 8 }}>
                    {t('place_detail.pages_menu', { count: place.menu_items.length })}
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Location Preview */}
          {place?.address && (
            <Card style={styles.sectionCard}>
              <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>{t("place_detail.location")}</Text>
              <View style={styles.locationPreview}>
                <View style={styles.locationAddress}>
                  <IconSymbol name="location.fill" size={20} color={colors.text.secondary} />
                  <Text style={[bodyStyle, { marginLeft: 8, flex: 1 }]}>{place.address}</Text>
                </View>
                {place?.city && <Text style={[bodySmallStyle, { marginTop: 4, marginLeft: 28 }]}>{place.city}</Text>}
                <View style={styles.locationButtons}>
                  <Button variant="secondary" onPress={handleNavigate} style={{ flex: 1, marginRight: spacing.xs }}>
                    {t("place_detail.get_directions")}
                  </Button>
                  <TouchableOpacity
                    onPress={() => {
                      lightImpact();
                      handleCall();
                    }}
                    style={[styles.callButton, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
                    activeOpacity={0.7}
                  >
                    <IconSymbol name="phone.fill" size={20} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}

          {/* Mekan Gönderileri Grid */}
          {settings.mapShowPosts && placePosts && placePosts.length > 0 && (
            <Card style={{ ...StyleSheet.flatten(styles.sectionCard), padding: spacing.base, marginBottom: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md }}>
                <IconSymbol name="square.grid.3x3.fill" size={20} color={colors.text.primary} />
                <Text style={[h2Style, { fontSize: 20 }]}>Gönderiler</Text>
                <View style={{
                  backgroundColor: colors.surface.elevated,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                  marginLeft: 4
                }}>
                  <Text style={{ fontSize: 12, color: colors.text.secondary, fontWeight: '600' }}>{placePosts.length}</Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {placePosts.map((post, idx) => {
                  const postImg = post.media?.[0]?.media_url || post.media_url;
                  return (
                    <TouchableOpacity
                      key={post.id || idx}
                      onPress={() => {
                        lightImpact();
                        router.push(`/p/post/${post.id}`);
                      }}
                      activeOpacity={0.8}
                      style={{
                        width: (SCREEN_WIDTH - spacing.base * 2 - 32 - 8) / 3,
                        height: (SCREEN_WIDTH - spacing.base * 2 - 32 - 8) / 3,
                        borderRadius: 8,
                        overflow: 'hidden',
                        backgroundColor: colors.surface.elevated
                      }}
                    >
                      {postImg ? (
                        <Image source={{ uri: postImg }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                      ) : (
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                          <IconSymbol name="photo" size={24} color={colors.text.tertiary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Card>
          )}

          {/* Similar Places */}
          {!isVenueDashboard && similarPlaces.length > 0 && (
            <Section title={t("place_detail.similar_places")} style={{ marginTop: spacing.xl }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarScrollContent}>
                {similarPlaces.map((similarPlace) => (
                  <View key={similarPlace.id} style={styles.similarCardWrapper}>
                    <PlaceCard
                      image={getPlaceImageSource(similarPlace)}
                      imagePlaceholder={!hasPlaceImage(similarPlace)}
                      title={similarPlace.name}
                      subtitle={similarPlace.subtitle || similarPlace.description}
                      address={similarPlace.address}
                      tags={similarPlace.tags}
                      hasMenu={!!(similarPlace.menu_items && similarPlace.menu_items.length > 0)}
                      onPress={() => navigateToPlace({
                        id: String(similarPlace.id),
                        name: similarPlace.name || "",
                        category: similarPlace.category || "",
                        photo_url: similarPlace.photo_url || "",
                        subtitle: similarPlace.subtitle || similarPlace.description || "",
                        description: similarPlace.description || "",
                        address: similarPlace.address || "",
                      })}
                    />
                  </View>
                ))}
              </ScrollView>
            </Section>
          )}
        </View>
      </Screen>
      <Modal
        visible={showReviews}
        transparent
        animationType="none"
        onRequestClose={() => setShowReviews(false)}
        statusBarTranslucent
      >
        {showReviews && (
          <>
            <View style={styles.reviewBackdrop}>
              <Pressable
                style={[styles.reviewBackdropPressable, { backgroundColor: colors.overlay.medium }]}
                onPress={() => setShowReviews(false)}
              />
              <View style={{ width: "100%" }}>
                <RNAnimated.View
                  style={[
                    styles.reviewSheet,
                    {
                      backgroundColor: colors.background.primary,
                      paddingBottom: insets.bottom || spacing.base,
                      height: reviewSheetHeight,
                    },
                  ]}
                >
                  <View>
                    <View style={styles.reviewDragArea} {...handleAreaPanResponder.panHandlers}>
                      <View style={styles.reviewHandleRow}>
                        <View style={[styles.reviewHandle, { backgroundColor: colors.surface.border }]} />
                      </View>
                      <View style={styles.reviewHeaderRow}>
                        <Text style={[h2Style, { fontSize: 20 }]}>{t("place_detail.reviews")}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            lightImpact();
                            setShowReviews(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <ScrollView
                    contentContainerStyle={styles.reviewScrollContent}
                    showsVerticalScrollIndicator={false}
                    onScroll={(e) => {
                      reviewScrollOffsetRef.current = e.nativeEvent.contentOffset.y;
                    }}
                    scrollEventThrottle={16}
                  >
                    {reviewsLoading ? (
                      <Text style={[bodySmallStyle]}>{t('place_detail.reviews_loading')}</Text>
                    ) : reviewsError ? (
                      <Text style={[bodySmallStyle]}>{reviewsError}</Text>
                    ) : !reviews.length ? (
                      <Text style={[bodySmallStyle]}>
                        {t('place_detail.reviews_empty')}
                      </Text>
                    ) : (
                      <>
                        {averageRating && (
                        <View style={[styles.reviewsSummaryCard, { borderColor: colors.surface.border }]}>
                          <View style={[styles.ratingBadge, { backgroundColor: colors.accent.primary }]}>
                            <IconSymbol name="star.fill" size={18} color={colors.accent.onPrimary} />
                            <Text style={[styles.ratingBadgeText, { color: colors.accent.onPrimary }]}>{averageRating}</Text>
                          </View>
                          <View style={styles.ratingDetails}>
                            {[{ label: t('explore.rating_service') }, { label: t('explore.rating_taste') }, { label: t('explore.rating_ambiance') }].map((item) => (
                              <View key={item.label} style={styles.ratingRow}>
                                <Text style={[bodySmallStyle, { width: 70 }]}>{item.label}:</Text>
                                <RatingStars value={Number(averageRating)} disabled size={14} />
                                <Text style={[bodySmallStyle, { marginLeft: spacing.xs }]}>{averageRating}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        )}

                        <View style={{ marginTop: spacing.lg }}>
                          <View style={styles.reviewsMetaRow}>
                            <View style={styles.reviewsMetaItem}>
                              <IconSymbol name="star.fill" size={16} color={colors.text.tertiary} />
                              <Text style={[bodySmallStyle, { marginLeft: 6 }]}>{t('explore.rating_count', { count: totalReviewCount })}</Text>
                            </View>
                            <View style={styles.reviewsMetaDivider} />
                            <View style={styles.reviewsMetaItem}>
                              <IconSymbol name="text.bubble.fill" size={16} color={colors.text.tertiary} />
                              <Text style={[bodySmallStyle, { marginLeft: 6 }]}>{t('explore.comment_count', { count: totalReviewCount })}</Text>
                            </View>
                          </View>

                          {reviews.map((review) => (
                            <View key={review.id} style={[styles.reviewItem, { borderBottomColor: colors.surface.border }]}>
                              <View style={styles.reviewHeader}>
                                <View style={[styles.reviewHeaderLeft, { alignItems: 'center' }]}>
                                  {review.user?.avatar_url ? (
                                    <Image source={{ uri: review.user.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.surface.default }} />
                                  ) : (
                                    <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.surface.default, justifyContent: 'center', alignItems: 'center' }}>
                                      <IconSymbol name="person.fill" size={16} color={colors.text.tertiary} />
                                    </View>
                                  )}
                                  <Text style={[bodyStyle, { fontWeight: "600" }]}>{review.user?.username || review.user?.first_name || t('explore.user_id', { id: review.user_id })}</Text>
                                  {review.is_verified && (
                                    <View
                                      style={[
                                        styles.verifiedBadge,
                                        {
                                          borderColor: colors.accent.primary,
                                          backgroundColor: colors.accent.primary + "22",
                                        },
                                      ]}
                                    >
                                      <IconSymbol name="checkmark.seal.fill" size={12} color={colors.accent.primary} />
                                      <Text style={[styles.verifiedBadgeText, { color: colors.accent.primary }]}>
                                        {t('explore.verified')}
                                      </Text>
                                    </View>
                                  )}
                                </View>
                                <RatingStars value={review.rating} disabled size={16} />
                              </View>
                              <Text style={[bodySmallStyle, { marginTop: 8, lineHeight: 20 }]}>{review.comment_text}</Text>
                              {review.media_url && (
                                <Pressable
                                  onPress={() => {
                                    lightImpact();
                                    const mediaReviews = reviews.filter((r) => r.media_url);
                                    const rIdx = mediaReviews.findIndex((r) => r.id === review.id);
                                    setReviewGalleryData({ reviews: mediaReviews, reviewIndex: rIdx, imageIndex: 0 });
                                  }}
                                  hitSlop={8}
                                  style={({ pressed }) => [styles.reviewImageContainer, pressed && { opacity: 0.8 }]}
                                >
                                  <Image source={{ uri: review.media_url }} style={styles.reviewImage} resizeMode="cover" />
                                  {(review.media_urls?.length ?? 0) > 1 && (
                                    <View style={styles.reviewImageBadge}>
                                      <Text style={styles.reviewImageBadgeText}>{review.media_urls!.length}</Text>
                                    </View>
                                  )}
                                </Pressable>
                              )}
                            </View>
                          ))}
                          {hasMoreReviews && reviews.length > 0 && (
                            <TouchableOpacity
                              style={{ paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
                              onPress={() => loadReviews(reviewsPage + 1, true)}
                              disabled={reviewsLoadingMore}
                            >
                              <Text style={[bodyStyle, { color: colors.accent.primary, fontWeight: '600' }]}>
                                {reviewsLoadingMore ? t('place_detail.loading', { defaultValue: 'Yükleniyor...' }) : "Daha Fazla Yükle"}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}
                  </ScrollView>
                </RNAnimated.View>
              </View>
            </View>
            {/* Review Image Gallery Overlay */}
            {reviewGalleryData &&
              (() => {
                const currentReview = reviewGalleryData.reviews[reviewGalleryData.reviewIndex];
                const currentImages = currentReview.media_urls?.length ? currentReview.media_urls : [currentReview.media_url!];
                const currentImageUrl = currentImages[reviewGalleryData.imageIndex];
                const hasNextImage = reviewGalleryData.imageIndex < currentImages.length - 1;
                const hasPrevImage = reviewGalleryData.imageIndex > 0;
                const hasNextReview = reviewGalleryData.reviewIndex < reviewGalleryData.reviews.length - 1;
                const hasPrevReview = reviewGalleryData.reviewIndex > 0;

                return (
                  <View style={styles.imageModalOverlay}>
                    <Pressable style={styles.imageModalBackdrop} onPress={() => setReviewGalleryData(null)} />
                    {/* Top bar: close + counter */}
                    <View style={styles.galleryTopBar}>
                      <TouchableOpacity
                        onPress={() => {
                          lightImpact();
                          setReviewGalleryData(null);
                        }}
                        activeOpacity={0.8}
                        hitSlop={12}
                      >
                        <IconSymbol name="xmark.circle.fill" size={32} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.imageCounterText}>
                        {reviewGalleryData.reviewIndex + 1} / {reviewGalleryData.reviews.length}
                      </Text>
                    </View>

                    {/* Image area */}
                    <View style={styles.galleryImageArea}>
                      <Image source={{ uri: currentImageUrl }} style={styles.galleryImage} resizeMode="contain" />

                      {/* Image left arrow */}
                      {hasPrevImage && (
                        <TouchableOpacity
                          style={[styles.galleryArrow, styles.galleryArrowLeft]}
                          onPress={() => {
                            lightImpact();
                            setReviewGalleryData((prev) => (prev ? { ...prev, imageIndex: prev.imageIndex - 1 } : null));
                          }}
                          activeOpacity={0.7}
                        >
                          <IconSymbol name="chevron.left" size={28} color="#fff" />
                        </TouchableOpacity>
                      )}

                      {/* Image right arrow */}
                      {hasNextImage && (
                        <TouchableOpacity
                          style={[styles.galleryArrow, styles.galleryArrowRight]}
                          onPress={() => {
                            lightImpact();
                            setReviewGalleryData((prev) => (prev ? { ...prev, imageIndex: prev.imageIndex + 1 } : null));
                          }}
                          activeOpacity={0.7}
                        >
                          <IconSymbol name="chevron.right" size={28} color="#fff" />
                        </TouchableOpacity>
                      )}

                      {/* Image dots */}
                      {currentImages.length > 1 && (
                        <View style={styles.imageDotsRow}>
                          {currentImages.map((_, dIdx) => (
                            <View
                              key={dIdx}
                              style={[styles.imageDot, dIdx === reviewGalleryData.imageIndex && styles.imageDotActive]}
                            />
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Review info overlay */}
                    <View style={styles.galleryReviewOverlay}>
                      <View style={styles.galleryReviewHeader}>
                        <Text style={styles.galleryReviewAuthor}>{t('explore.user_id', { id: currentReview.user_id })}</Text>
                        {currentReview.is_verified && (
                          <View style={styles.galleryVerifiedBadge}>
                            <IconSymbol name="checkmark.seal.fill" size={12} color="#4ade80" />
                            <Text style={styles.galleryVerifiedText}>{t('explore.verified')}</Text>
                          </View>
                        )}
                        <View style={{ flex: 1 }} />
                        <RatingStars value={currentReview.rating} disabled size={14} />
                      </View>
                      <Text style={styles.galleryReviewText} numberOfLines={3}>
                        {currentReview.comment_text}
                      </Text>

                      {/* Review navigation */}
                      <View style={styles.galleryReviewNav}>
                        <TouchableOpacity
                          onPress={() => {
                            lightImpact();
                            setReviewGalleryData((prev) => (prev ? { ...prev, reviewIndex: prev.reviewIndex - 1, imageIndex: 0 } : null));
                          }}
                          disabled={!hasPrevReview}
                          style={[styles.galleryNavButton, !hasPrevReview && { opacity: 0.3 }]}
                          activeOpacity={0.7}
                        >
                          <IconSymbol name="chevron.left" size={18} color="#fff" />
                          <Text style={styles.galleryNavText}>{t('explore.prev_comment')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            lightImpact();
                            setReviewGalleryData((prev) => (prev ? { ...prev, reviewIndex: prev.reviewIndex + 1, imageIndex: 0 } : null));
                          }}
                          disabled={!hasNextReview}
                          style={[styles.galleryNavButton, !hasNextReview && { opacity: 0.3 }]}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.galleryNavText}>{t('explore.next_comment')}</Text>
                          <IconSymbol name="chevron.right" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })()}
          </>
        )}
      </Modal>

      {/* Hero Image Fullscreen Modal — swipe down to close */}
      <Modal
        visible={showHeroImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHeroImage(false)}
        statusBarTranslucent
      >
        <HeroImageViewer
          heroSource={heroSource}
          insetTop={insets.top || 44}
          onClose={() => setShowHeroImage(false)}
          screenWidth={SCREEN_WIDTH}
          screenHeight={SCREEN_HEIGHT}
          t={t}
        />
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="none"
        onRequestClose={() => setShowMenu(false)}
        statusBarTranslucent
      >
        {showMenu && (
          <View style={styles.reviewBackdrop}>
            <Pressable
              style={[styles.reviewBackdropPressable, { backgroundColor: colors.overlay.medium }]}
              onPress={() => setShowMenu(false)}
            />
            <View style={{ width: "100%" }}>
              <RNAnimated.View
                style={[
                  styles.reviewSheet,
                  {
                    backgroundColor: colors.background.primary,
                    paddingBottom: insets.bottom || spacing.base,
                    height: menuSheetHeight,
                  },
                ]}
              >
                <View>
                  <View style={styles.reviewDragArea} {...handleMenuPanResponder.panHandlers}>
                    <View style={styles.reviewHandleRow}>
                      <View style={[styles.reviewHandle, { backgroundColor: colors.surface.border }]} />
                    </View>
                    <View style={styles.reviewHeaderRow}>
                      <Text style={[h2Style, { fontSize: 20 }]}>{t('explore.menu')}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          lightImpact();
                          setShowMenu(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <ScrollView
                  contentContainerStyle={[styles.reviewScrollContent, { paddingHorizontal: spacing.sm }]}
                  showsVerticalScrollIndicator={false}
                >
                  {place?.menu_items && place.menu_items.length > 0 ? (
                    place.menu_items[0]?.type === 'image' ? (
                      /* ===== IMAGE MENU ===== */
                      <View style={{ gap: spacing.lg }}>
                        {place.menu_items.map((imgItem: any, idx: number) => (
                          <View key={idx} style={{
                            width: SCREEN_WIDTH - 40,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 12 },
                            shadowOpacity: 0.6,
                            shadowRadius: 16,
                            elevation: 12,
                            borderRadius: 20,
                            overflow: 'hidden',
                            backgroundColor: colors.surface.elevated,
                          }}>
                            <Image
                              source={{ uri: imgItem.uri }}
                              style={{ width: '100%', height: (SCREEN_WIDTH - 40) * 1.4 }}
                              resizeMode="cover"
                            />
                            <View style={{
                              position: 'absolute', bottom: 0, left: 0, right: 0,
                              paddingVertical: 10, paddingHorizontal: 16,
                              backgroundColor: 'rgba(0,0,0,0.5)',
                            }}>
                              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                                {t('place_detail.page_x_of_y', { current: idx + 1, total: place.menu_items.length })}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      /* ===== TEXT MENU — PREMIUM CATEGORIZED ===== */
                      <View style={{ paddingBottom: spacing.lg }}>
                        {groupMenuByCategory(place.menu_items, t).map((group, gIdx) => (
                          <View key={gIdx} style={{ marginBottom: spacing.xl }}>
                            {/* Category Header */}
                            <View style={{ 
                              paddingVertical: 12, 
                              borderBottomWidth: 2, borderBottomColor: '#10b98130',
                              flexDirection: 'row', alignItems: 'center', marginBottom: 12 
                            }}>
                              <View style={{ width: 4, height: 22, borderRadius: 2, backgroundColor: '#10b981', marginRight: 10 }} />
                              <Text style={[h2Style, { fontSize: 18, color: '#10b981', letterSpacing: 0.3 }]}>
                                {group.category}
                              </Text>
                              <Text style={[captionStyle, { marginLeft: 8 }]}>{group.items.length} ürün</Text>
                            </View>
                            {/* Menu Items */}
                            <View style={{ gap: 10 }}>
                              {group.items.map((item: any, idx: number) => (
                                <View
                                  key={idx}
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.surface.elevated,
                                    padding: 14,
                                    borderRadius: 18,
                                    borderWidth: 0.5,
                                    borderColor: colors.surface.border,
                                  }}
                                >
                                  {item.img ? (
                                    <Image
                                      source={{ uri: item.img }}
                                      style={{ width: 56, height: 56, borderRadius: 14, marginRight: 14, backgroundColor: colors.surface.default }}
                                    />
                                  ) : (
                                    <View style={{
                                      width: 56, height: 56, borderRadius: 14, marginRight: 14,
                                      backgroundColor: colors.surface.default,
                                      justifyContent: 'center', alignItems: 'center',
                                    }}>
                                      <IconSymbol name="fork.knife" size={22} color={colors.text.tertiary} />
                                    </View>
                                  )}
                                  <View style={{ flex: 1 }}>
                                    <Text style={[bodyStyle, { fontWeight: '700', fontSize: 16, marginBottom: 2 }]}
                                      numberOfLines={1}
                                    >
                                      {item.name}
                                    </Text>
                                    {item.desc ? (
                                      <Text style={{ fontSize: 13, color: colors.text.tertiary, lineHeight: 18 }} numberOfLines={2}>
                                        {item.desc}
                                      </Text>
                                    ) : null}
                                  </View>
                                  {item.price ? (
                                    <View style={{
                                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                      paddingHorizontal: 14,
                                      paddingVertical: 7,
                                      borderRadius: 12,
                                      marginLeft: 10,
                                    }}>
                                      {item.price && (
                                        <Text style={{ fontWeight: '800', color: '#10b981', fontSize: 15 }}>
                                          {item.price}
                                        </Text>
                                      )}
                                    </View>
                                  ) : null}
                                </View>
                              ))}
                            </View>
                          </View>
                        ))}
                      </View>
                    )
                  ) : (
                    /* ===== EMPTY STATE ===== */
                    <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                      <IconSymbol name="list.bullet.clipboard" size={48} color={colors.text.tertiary} />
                      <Text style={[bodySmallStyle, { textAlign: 'center', marginTop: spacing.base }]}>
                        {t("place_detail.no_menu", "Bu mekan henüz menü eklememiş.")}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </RNAnimated.View>
            </View>
          </View>
        )}
      </Modal>

      {/* Story Viewer Modal */}
      {placeStories && placeStories.length > 0 && (
        <StoryViewerModal
          stories={placeStories}
          initialIndex={selectedStoryIndex}
          visible={showStoriesModal}
          onClose={() => setShowStoriesModal(false)}
          currentUserId={currentUser?.id}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  placeImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  titleSection: {
    marginBottom: spacing.base,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  reviewButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-end",
  },
  reviewBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  reviewBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  reviewSheet: {
    width: "100%",
    alignSelf: "stretch",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
    overflow: "hidden",
  },
  reviewHandleRow: {
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  reviewDragArea: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  reviewHandle: {
    width: 44,
    height: 4,
    borderRadius: 999,
  },
  reviewHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  reviewsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.base,
  },
  reviewsMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewsMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: "#00000022",
    marginHorizontal: spacing.base,
  },
  reviewScrollContent: {
    paddingBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  content: {
    paddingTop: spacing.base,
  },
  placeMetaSection: {
    marginBottom: spacing.md,
  },
  placeMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  ratingContainer: {
    flex: 1,
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  sectionCard: {
    marginBottom: spacing.xl,
  },
  campaignCard: {
    marginBottom: spacing.lg,
  },
  campaignHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  atmosphereTags: {
    flexDirection: "row",
    gap: spacing.base,
    marginTop: spacing.base,
  },
  atmosphereTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  highlightsGrid: {
    flexDirection: "row",
    flexWrap: "nowrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 0,
  },
  highlightItem: {
    flex: 1,
    minWidth: 0,
    maxWidth: "25%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  highlightItemLowered: {
    marginTop: spacing.lg,
  },
  locationPreview: {
    // Spacing handled by children
  },
  locationAddress: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.base,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewsSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.base,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.lg,
    gap: spacing.base,
  },
  ratingBadge: {
    minWidth: 84,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  ratingBadgeText: {
    fontSize: 20,
    fontWeight: "700",
  },
  ratingDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: spacing.xs,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  reviewImageContainer: {
    marginTop: spacing.sm,
    borderRadius: 12,
    overflow: "hidden",
    width: 200,
    height: 150,
  },
  reviewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  reviewImageBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewImageBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  imageModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: "#000",
  },
  imageModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  galleryTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  galleryImageArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  galleryArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  galleryArrowLeft: {
    left: 12,
  },
  galleryArrowRight: {
    right: 12,
  },
  imageDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  imageDotActive: {
    backgroundColor: "#fff",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  galleryReviewOverlay: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  galleryReviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  galleryReviewAuthor: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  galleryVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  galleryVerifiedText: {
    color: "#4ade80",
    fontSize: 11,
    fontWeight: "600",
  },
  galleryReviewText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
  },
  galleryReviewNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.base,
  },
  galleryNavButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  galleryNavText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  similarScrollContent: {
    paddingRight: spacing.screenPadding,
  },
  similarCardWrapper: {
    width: 280,
    marginRight: spacing.base,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.base,
  },
  reviewIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionBox: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: 16,
    padding: spacing.base,
  },
  menuItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  moreItemsText: {
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
});
