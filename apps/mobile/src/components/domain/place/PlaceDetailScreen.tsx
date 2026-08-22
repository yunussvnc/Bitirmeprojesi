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
  Linking,
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
import { Image as ExpoImage } from 'expo-image';
import { useTheme } from "@/src/hooks/useTheme";
import { Screen, Section, type ScreenRef } from "@/src/components/layout";
import { PlaceCard } from "@/src/components/domain/place/PlaceCard";
import { Button, Card } from "@/src/components/ui";
import { useTranslation } from 'react-i18next';
import { useAppStore } from "@/src/store/useAppStore";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { getPlaceImageSource, hasPlaceImage } from "@/src/utils/placeImages";
import { spacing, createTextStyle } from "@/src/constants/design";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { getPlaceById, togglePlaceFollow, getPlacePosts, getPlaceStories, recordPlaceInteraction, logInteraction } from "@/src/services/mekanService";
import { lightImpact, success } from "@/src/utils/haptics";
import { logger } from "@/src/utils/logger";
import { apiGet } from "@/src/utils/apiClient";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { PlaceDetailOverlays, type Review, type ReviewGalleryData } from './place-detail/PlaceDetailOverlays';
import { styles } from './place-detail/styles';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const REVIEW_SHEET_COLLAPSED = Math.min(SCREEN_HEIGHT * 0.55, 520);
const REVIEW_SHEET_EXPANDED = SCREEN_HEIGHT * 0.72;

export default function PlaceDetailScreen({
  providedId,
  isVenueDashboard = false
}: {
  providedId?: string,
  isVenueDashboard?: boolean
} = {}) {
  const { colors } = useTheme();
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
  const [showHeroImage, setShowHeroImage] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [reviewsLoadingMore, setReviewsLoadingMore] = useState(false);
  const [similarPlaces, setSimilarPlaces] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewGalleryData, setReviewGalleryData] = useState<ReviewGalleryData | null>(null);

  // Takip & Sosyal İçerik
  // null = henüz API'den yüklenmedi → buton disabled görünür, "Takip Et" flash'ı önlenir
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [placePosts, setPlacePosts] = useState<any[]>([]);
  const [placeStories, setPlaceStories] = useState<any[]>([]);
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
  }, []);

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
    try {
      const [postsData, storiesData] = await Promise.all([
        getPlacePosts(id, 1, 18),
        getPlaceStories(id),
      ]);
      if (!cancelled.current) {
        setPlacePosts(postsData?.items || []);
        setPlaceStories(storiesData?.items || []);
      }
    } catch (error) {
      if (!cancelled.current) logger.error("Error loading social content:", error);
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
    // Benzer mekanları hemen yükle (gecikme kaldırıldı — performans optimizasyonu)
    loadSimilarPlaces(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [place?.id, place?.category]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

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

        <View style={styles.imageContainer}>
          {hasPlaceImage(place) ? (
            <Pressable onPress={() => {
              lightImpact();
              setShowHeroImage(true);
            }} style={[{ backgroundColor: colors.surface.elevated, flex: 1 }]}>
              <ExpoImage 
                source={heroSource} 
                style={styles.placeImage} 
                contentFit="cover"
                cachePolicy="memory-disk"
                priority="high"
                transition={{ duration: 200 }}
              />
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
                      <ExpoImage source={{ uri: place.photo_url }} style={{ width: 60, height: 60, borderRadius: 30 }} cachePolicy="memory-disk" />
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
            <View style={styles.placeMetaRow} />
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
                    <ExpoImage source={{ uri: item.img }} style={{ width: 48, height: 48, borderRadius: 12, marginRight: 12, backgroundColor: colors.surface.elevated }} cachePolicy="memory-disk" />
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
                <ExpoImage source={{ uri: place.menu_items[0].uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
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
                        <ExpoImage source={{ uri: postImg }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
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
                      placeId={similarPlace.id}
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
      <PlaceDetailOverlays
        showReviews={showReviews}
        onCloseReviews={() => setShowReviews(false)}
        reviewSheetHeight={reviewSheetHeight}
        reviewPanHandlers={handleAreaPanResponder.panHandlers}
        reviewScrollOffsetRef={reviewScrollOffsetRef}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        reviewsError={reviewsError}
        averageRating={averageRating}
        hasMoreReviews={hasMoreReviews}
        reviewsLoadingMore={reviewsLoadingMore}
        onLoadMoreReviews={() => loadReviews(reviewsPage + 1, true)}
        reviewGalleryData={reviewGalleryData}
        setReviewGalleryData={setReviewGalleryData}
        showHeroImage={showHeroImage}
        heroSource={heroSource}
        onCloseHeroImage={() => setShowHeroImage(false)}
        screenWidth={SCREEN_WIDTH}
        screenHeight={SCREEN_HEIGHT}
        showMenu={showMenu}
        onCloseMenu={() => setShowMenu(false)}
        menuSheetHeight={menuSheetHeight}
        menuPanHandlers={handleMenuPanResponder.panHandlers}
        place={place}
        placeStories={placeStories}
        selectedStoryIndex={selectedStoryIndex}
        showStoriesModal={showStoriesModal}
        onCloseStories={() => setShowStoriesModal(false)}
        currentUserId={currentUser?.id}
      />
    </Animated.View>
  );
}
