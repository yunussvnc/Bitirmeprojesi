import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Platform,
  Linking,
  Share,
  Dimensions,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { normalizePlaceCategory } from '@/src/utils/categories';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { getPlaceById, togglePlaceFollow, getPlacePosts, getPlaceStories, recordPlaceInteraction, logInteraction } from '@/src/services/mekanService';
import { lightImpact, success } from '@/src/utils/haptics';
import { logger } from '@/src/utils/logger';
import { apiGet } from '@/src/utils/apiClient';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import type { Review } from './PlaceDetailOverlays';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const REVIEW_SHEET_COLLAPSED = Math.min(SCREEN_HEIGHT * 0.55, 520);
const REVIEW_SHEET_EXPANDED = SCREEN_HEIGHT * 0.72;

export function usePlaceDetail({ providedId }: { providedId?: string }) {
  const params = useLocalSearchParams();
  const id = providedId || String(params?.id ?? '');
  const { t } = useTranslation();

  const [place, setPlace] = useState<any>(() => {
    if (params && (params as any).name || (params as any).title) {
      return {
        id: Number(id),
        name: (params as any).name || (params as any).title || '',
        category: (params as any).category || '',
        photo_url: (params as any).photo_url || (params as any).image || '',
        description: (params as any).description || '',
        subtitle: (params as any).subtitle || '',
        address: (params as any).address || '',
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

  // Follow & Social Content
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [placePosts, setPlacePosts] = useState<any[]>([]);
  const [placeStories, setPlaceStories] = useState<any[]>([]);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [showStoriesModal, setShowStoriesModal] = useState(false);

  // Navigation guard for place card taps
  const navGuard = useRef(false);
  const navigateToPlace = useCallback((placeData: Record<string, string>) => {
    if (navGuard.current) return;
    navGuard.current = true;
    router.push({ pathname: '/place/[id]', params: placeData } as any);
    setTimeout(() => { navGuard.current = false; }, 600);
  }, []);

  // Review Sheet
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
        onPanResponderMove: (_: any, g: any) => {
          const nextH = reviewStartHeightRef.current - g.dy;
          const clamped = Math.max(0, Math.min(REVIEW_SHEET_EXPANDED, nextH));
          reviewSheetHeight.setValue(clamped);
        },
        onPanResponderRelease: (_: any, g: any) => {
          const currentH = reviewStartHeightRef.current - g.dy;

          if (currentH < REVIEW_SHEET_COLLAPSED * 0.3 || (g.dy > 50 && g.vy > 0.5)) {
            setShowReviews(false);
            setTimeout(() => {
              reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
              reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
            }, 50);
            return;
          }

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
        onPanResponderMove: (_: any, g: any) => {
          const nextH = menuStartHeightRef.current - g.dy;
          const clamped = Math.max(0, Math.min(REVIEW_SHEET_EXPANDED, nextH));
          menuSheetHeight.setValue(clamped);
        },
        onPanResponderRelease: (_: any, g: any) => {
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
    reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
    reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
  }, [showReviews, reviewSheetHeight]);

  useEffect(() => {
    menuSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
    menuStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
  }, [showMenu, menuSheetHeight]);

  const loadPlaceData = useCallback(async (cancelled: { current: boolean } = { current: false }) => {
    try {
      const foundPlace = await getPlaceById(id);
      if (!cancelled.current && foundPlace) {
        const normalizedCat = normalizePlaceCategory(foundPlace.category);
        setPlace({
          ...foundPlace,
          category: normalizedCat || foundPlace.category,
        });
        if (typeof foundPlace.is_following === 'boolean') {
          setIsFollowing(foundPlace.is_following);
        }
        if (typeof foundPlace.follower_count === 'number') {
          setFollowerCount(foundPlace.follower_count);
        }
      }
      recordPlaceInteraction(id, 'view').catch(() => {});
      logInteraction(id, 'CARD_VIEW', 3).catch(() => {});
    } catch (err) {
      console.error('Error loading place detail:', err);
    }
  }, [id]);

  const loadSocialContent = useCallback(async (cancelled: { current: boolean } = { current: false }) => {
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
      if (!cancelled.current) logger.error('Error loading social content:', error);
    }
  }, [id]);

  const handleFollow = useCallback(async () => {
    if (followLoading || isFollowing === null) return;

    const prevFollowing = isFollowing;
    const prevCount = followerCount ?? 0;
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    setFollowerCount(prev => newFollowing ? (prev ?? 0) + 1 : Math.max(0, (prev ?? 0) - 1));
    lightImpact();
    if (newFollowing) success();

    setFollowLoading(true);
    try {
      const result = await togglePlaceFollow(id);
      setIsFollowing(result.followed);
      setFollowerCount(result.follower_count);
    } catch (error) {
      setIsFollowing(prevFollowing);
      setFollowerCount(prevCount);
      logger.error('Error toggling follow:', error);
    } finally {
      setFollowLoading(false);
    }
  }, [followLoading, isFollowing, followerCount, id]);

  const loadReviews = useCallback(async (pageToLoad = 1, append = false, cancelled: { current: boolean } = { current: false }) => {
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
        logger.error('Error loading reviews:', error);
        if (pageToLoad === 1) setReviewsError(t('explore.no_comments'));
      }
    } finally {
      if (!cancelled.current) {
        setReviewsLoading(false);
        setReviewsLoadingMore(false);
      }
    }
  }, [id, t]);

  useEffect(() => {
    const cancelled = { current: false };
    loadPlaceData(cancelled);
    loadReviews(1, false, cancelled);
    loadSocialContent(cancelled);
    return () => {
      cancelled.current = true;
    };
  }, [id, loadPlaceData, loadReviews, loadSocialContent]);

  const loadSimilarPlaces = useCallback(async (cancelled: { current: boolean } = { current: false }) => {
    if (!place?.category) return;
    try {
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
      if (!cancelled.current) logger.error('Error loading similar places:', error);
    }
  }, [place?.category, id]);

  useEffect(() => {
    if (!place?.category) return;
    const cancelled = { current: false };
    loadSimilarPlaces(cancelled);
    return () => { cancelled.current = true; };
  }, [place?.id, place?.category, loadSimilarPlaces]);

  const handleNavigate = useCallback(() => {
    if (place?.latitude != null && place?.longitude != null) {
      const lat = place.latitude;
      const lng = place.longitude;
      const url =
        Platform.OS === 'ios'
          ? `maps://maps.apple.com/?daddr=${lat},${lng}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url).catch(() => {
        Alert.alert(t('common.error'), t('place_extra.map_app_err'));
      });
    }
  }, [place, t]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `${place?.name || 'Mekan'} - ${place?.address || ''}`,
        url: `asemos://place/${id}`,
      });
    } catch (error) {
      logger.error('Error sharing:', error);
    }
  }, [place, id]);

  const handleCall = useCallback(() => {
    Alert.alert(t('place_extra.info'), t('place_detail.phone_not_added'));
  }, [t]);

  const heroSource = useMemo(() => {
    if (place?.photo_url) {
      return { uri: place.photo_url } as const;
    }
    return getPlaceImageSource(place || id) as any;
  }, [place, id]);

  const averageRating = useMemo(() => {
    if (!reviews.length) return null as null | string;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  // Proper onLoadMoreReviews using current state
  const onLoadMoreReviewsStable = useCallback(() => {
    loadReviews(reviewsPage + 1, true);
  }, [loadReviews, reviewsPage]);

  return {
    id,
    place,
    showHeroImage,
    setShowHeroImage,

    reviews,
    reviewsLoading,
    reviewsError,
    hasMoreReviews,
    reviewsLoadingMore,
    onLoadMoreReviews: onLoadMoreReviewsStable,
    averageRating,

    similarPlaces,

    showReviews,
    setShowReviews,
    reviewSheetHeight,
    reviewPanHandlers: handleAreaPanResponder.panHandlers,
    reviewScrollOffsetRef,

    showMenu,
    setShowMenu,
    menuSheetHeight,
    menuPanHandlers: handleMenuPanResponder.panHandlers,

    isFollowing,
    followerCount,
    followLoading,
    handleFollow,

    placePosts,
    placeStories,
    selectedStoryIndex,
    setSelectedStoryIndex,
    showStoriesModal,
    setShowStoriesModal,

    navigateToPlace,
    handleNavigate,
    handleShare,
    handleCall,
    heroSource,
  } as const;
}
