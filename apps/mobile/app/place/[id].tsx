/**
 * Place Detail Screen
 * 
 * Immersive place detail experience inspired by TrendyolGo/Yemeksepeti.
 * Premium dark-first design with rich information architecture.
 * 
 * @module app/place/[id]
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, Modal, Pressable, Platform, Dimensions, PanResponder, Animated as RNAnimated, Share } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Screen, Section } from '@/components/layout';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Button, Card, ReviewForm, RatingStars } from '@/components/ui';
import { useAppStore } from '@/src/store/useAppStore';
import { getPlaceImageSource, hasPlaceImage } from '@/src/utils/placeImages';
import { spacing } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { calculateDistance, getCurrentLocation, type PlaceLocation } from '@/src/utils/location';
import { getPlaceById, getAllPlaces } from '@/src/services/mekanService';
import { lightImpact, success, warning } from '@/src/utils/haptics';
import { logger } from '@/src/utils/logger';
import { apiGet, apiPost } from '@/src/utils/apiClient';

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
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const REVIEW_SHEET_COLLAPSED = Math.min(SCREEN_HEIGHT * 0.55, 520);
const REVIEW_SHEET_EXPANDED = SCREEN_HEIGHT * 0.72;

export default function PlaceDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const id = String(params?.id ?? '');

  const savedIds = useAppStore((s) => s.savedIds);
  const toggleSaved = useAppStore((s) => s.toggleSave);
  const saved = savedIds.includes(id);

  const [place, setPlace] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<PlaceLocation | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [lastDistance, setLastDistance] = useState<number | null>(null);
  const [similarPlaces, setSimilarPlaces] = useState<any[]>([]);
  const [showReviews, setShowReviews] = useState(false);
  const [reviewGalleryData, setReviewGalleryData] = useState<{ reviews: Review[]; reviewIndex: number; imageIndex: number } | null>(null);

  const reviewSheetHeight = useRef(new RNAnimated.Value(REVIEW_SHEET_COLLAPSED)).current;
  const reviewStartHeightRef = useRef(REVIEW_SHEET_COLLAPSED);
  const reviewScrollOffsetRef = useRef(0);

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

  useEffect(() => {
    if (showReviews) {
      reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
      reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
    } else {
      reviewSheetHeight.setValue(REVIEW_SHEET_COLLAPSED);
      reviewStartHeightRef.current = REVIEW_SHEET_COLLAPSED;
    }
  }, [showReviews, reviewSheetHeight]);

  // Load place data
  useEffect(() => {
    const cancelled = { current: false };
    loadPlaceData(cancelled);
    loadReviews(cancelled);
    return () => { cancelled.current = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps -- loadPlaceData/loadReviews stable by design

  const loadPlaceData = async (cancelled: { current: boolean } = { current: false }) => {
    try {
      const foundPlace = await getPlaceById(id);
      if (!cancelled.current && foundPlace) setPlace(foundPlace);
    } catch (error) {
      if (!cancelled.current) logger.error('Error loading place:', error);
    }
  };

  const loadReviews = async (cancelled: { current: boolean } = { current: false }) => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const data = await apiGet<Review[]>(`/places/${id}/reviews`);
      if (!cancelled.current) {
        setReviews(data || []);
      }
    } catch (error) {
      if (!cancelled.current) {
        logger.error('Error loading reviews:', error);
        setReviewsError('Yorumlar yüklenirken bir hata oluştu.');
      }
    } finally {
      if (!cancelled.current) setReviewsLoading(false);
    }
  };

  const loadSimilarPlaces = async (cancelled: { current: boolean } = { current: false }) => {
    try {
      const places = await getAllPlaces();
      if (cancelled.current) return;
      const filtered = places
        .filter((p) => String(p.id) !== id && p.category === place?.category)
        .slice(0, 5);
      setSimilarPlaces(filtered);
    } catch (error) {
      if (!cancelled.current) logger.error('Error loading similar places:', error);
    }
  };

  useEffect(() => {
    if (!place) return;
    const cancelled = { current: false };
    loadSimilarPlaces(cancelled);
    return () => { cancelled.current = true; };
  }, [place?.id, place?.category]); // eslint-disable-line react-hooks/exhaustive-deps -- loadSimilarPlaces uses place in closure

  const checkUserLocation = async () => {
    if (!place?.latitude || !place?.longitude) return;

    setCheckingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (!location) {
        Alert.alert(
          'Konum İzni Gerekli',
          'Yorum yapabilmek için konum izni vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
        return;
      }

      setUserLocation(location);

      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        place.latitude,
        place.longitude
      );
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
      logger.error('Error checking location:', error);
      Alert.alert('Hata', 'Konumun kontrol edilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setCheckingLocation(false);
    }
  };

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!isNearby) {
      Alert.alert('Uyarı', 'Bu mekanda yorum yapabilmek için mekanın yakınında olmalısınız.');
      return;
    }

    setSubmittingReview(true);
    try {
      await apiPost('/reviews/', {
        place_id: Number(id),
        comment_text: comment || 'Yorum yapılmadı',
        rating: rating,
        user_lat: userLocation?.latitude,
        user_lng: userLocation?.longitude,
      });

      Alert.alert('Başarılı', 'Yorumunuz gönderildi!', [
        { text: 'Tamam', onPress: () => setShowReviewForm(false) },
      ]);

      await loadReviews();
    } catch (error) {
      Alert.alert('Hata', 'Yorum gönderilirken bir hata oluştu.');
      logger.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleNavigate = () => {
    if (place?.latitude != null && place?.longitude != null) {
      const lat = place.latitude;
      const lng = place.longitude;
      const url =
        Platform.OS === 'ios'
          ? `maps://maps.apple.com/?daddr=${lat},${lng}`
          : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Hata', 'Harita uygulaması açılamadı.');
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place?.name || 'Mekan'} - ${place?.address || ''}`,
        url: `asemos://place/${id}`,
      });
    } catch (error) {
      logger.error('Error sharing:', error);
    }
  };

  const handleCall = () => {
    // TODO: Mekan telefon numarası eklenmeli
    Alert.alert('Bilgi', 'Bu mekanın telefon numarası henüz eklenmedi.');
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

  const distanceText = useMemo(() => {
    if (!userLocation || !place?.latitude || !place?.longitude) return null;
    const dist = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      place.latitude,
      place.longitude
    );
    if (dist < 1000) {
      return `${Math.round(dist)} m uzakta`;
    }
    return `${(dist / 1000).toFixed(1)} km uzakta`;
  }, [userLocation, place]);

  // Typography styles - inline to avoid type issues
  const h1Style = { fontSize: 24, fontWeight: '700' as const, color: colors.text.primary };
  const h2Style = { fontSize: 20, fontWeight: '700' as const, color: colors.text.primary };
  const bodyStyle = { fontSize: 15, fontWeight: '400' as const, color: colors.text.primary };
  const bodySmallStyle = { fontSize: 14, fontWeight: '400' as const, color: colors.text.secondary };
  const captionStyle = { fontSize: 12, fontWeight: '400' as const, color: colors.text.tertiary };

  return (
    <Animated.View entering={FadeIn.duration(280)} style={{ flex: 1 }}>
    <Screen scrollable>
        {/* Header with Back and Save */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              router.back();
            }}
            style={[styles.headerButton, { backgroundColor: colors.surface.elevated }]}
          >
            <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
          </TouchableOpacity>
          
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
                if (saved) lightImpact(); else success();
                toggleSaved({
                  id,
                  name: place?.name || `Mekan #${id}`,
                  subtitle: place?.subtitle || place?.description || 'Detay ekranı',
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
                name={saved ? 'heart.fill' : 'heart'}
                size={20}
                color={saved ? colors.text.inverse : colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          {hasPlaceImage(place) ? (
            <Image source={heroSource} style={styles.placeImage} resizeMode="cover" />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="mappin.and.ellipse" size={48} color={colors.text.tertiary} />
              <Text style={[bodySmallStyle, { color: colors.text.tertiary, marginTop: 8 }]}>
                Görsel eklenmedi
              </Text>
            </View>
          )}
        </View>

        {/* Title and Meta */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[h1Style, { fontSize: 24, marginBottom: spacing.sm, flex: 1 }]}>
              {place?.name || `Mekan #${id}`}
            </Text>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                setShowReviews(true);
              }}
              style={[styles.reviewButton, { borderColor: colors.surface.border }]}
            >
              <Text style={[bodySmallStyle, { color: colors.text.secondary }]}>
                Yorumlar
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.metaRow}>
            {place?.category && (
              <Text style={[bodySmallStyle, { color: colors.text.secondary }]}>
                {place.category}
              </Text>
            )}
            {place?.city && place?.category && (
              <Text style={[bodySmallStyle, { color: colors.text.tertiary }]}> • </Text>
            )}
            {place?.city && (
              <Text style={[bodySmallStyle, { color: colors.text.secondary }]}>
                {place.city}
              </Text>
            )}
          </View>

          {/* Tags */}
        </View>

        {/* Content */}
        <View style={styles.content}>
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
                <Text style={[h2Style, { fontSize: 18, marginLeft: 8 }]}>Kampanya</Text>
              </View>
              <Text style={[bodyStyle, { lineHeight: 22, color: colors.text.secondary }]}>
                {place.campaign_text}
              </Text>
            </Card>
          )}

          {/* Atmosphere Section */}
          {place?.description && (
            <Card style={styles.sectionCard}>
              <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>
                Atmosfer & Deneyim
              </Text>
              <Text style={[bodyStyle, { lineHeight: 24, marginBottom: spacing.sm }]}>
                {place.description}
              </Text>
              <View style={styles.atmosphereTags}>
                <View style={[styles.atmosphereTag, { backgroundColor: colors.surface.default }]}>
                  <FontAwesome5 name="volume-mute" size={14} color={colors.text.secondary} solid={false} />
                  <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                    {place.tags?.includes('quiet') ? 'Sessiz' : 'Canlı'} ortam
                  </Text>
                </View>
                <View style={[styles.atmosphereTag, { backgroundColor: colors.surface.default }]}>
                  <IconSymbol name="person.fill" size={20} color={colors.text.secondary} />
                  <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                    {place.tags?.includes('work') ? 'Çalışma' : 'Sosyal'} için ideal
                  </Text>
                </View>
              </View>
              <Text style={[h2Style, { fontSize: 18, marginTop: spacing.lg, marginBottom: spacing.base }]}>
                Özellikler
              </Text>
              <View style={styles.highlightsGrid}>
                {[
                  { fa5: 'wifi' as const, fa5Unavailable: 'wifi-slash' as const, label: 'Wi-Fi', available: true },
                  { fa5: 'plug' as const, fa5Unavailable: 'plug' as const, label: 'Priz', available: true },
                  { fa5: 'volume-mute' as const, fa5Unavailable: 'volume-mute' as const, label: 'Sessiz', available: place?.tags?.includes('quiet') },
                  { fa5: 'umbrella' as const, fa5Unavailable: 'umbrella' as const, label: 'Terasta\nOturma', available: false },
                ].map((item, idx) => {
                  const iconName = item.available ? item.fa5 : item.fa5Unavailable;
                  const iconColor = item.available ? colors.text.primary : colors.text.tertiary;
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      style={[
                        styles.highlightItem,
                        item.label === 'Terasta\nOturma' && styles.highlightItemLowered,
                      ]}
                    >
                      <FontAwesome5
                        name={iconName}
                        size={20}
                        color={iconColor}
                        solid={false}
                      />
                      <Text
                        style={[
                          bodySmallStyle,
                          {
                            marginTop: 6,
                          textAlign: 'center',
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

          {/* Location Preview */}
          {place?.address && (
            <Card style={styles.sectionCard}>
              <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>
                Konum
              </Text>
              <View style={styles.locationPreview}>
                <View style={styles.locationAddress}>
                  <IconSymbol name="location.fill" size={20} color={colors.text.secondary} />
                  <Text style={[bodyStyle, { marginLeft: 8, flex: 1 }]}>{place.address}</Text>
                </View>
                {place?.city && (
                  <Text style={[bodySmallStyle, { marginTop: 4, marginLeft: 28 }]}>
                    {place.city}
                  </Text>
                )}
                <View style={styles.locationButtons}>
                  <Button
                    variant="secondary"
                    onPress={handleNavigate}
                    style={{ flex: 1, marginRight: spacing.xs }}
                  >
                    Yol Tarifi Al
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

          {/* Similar Places */}
          {similarPlaces.length > 0 && (
            <Section title="Benzer Mekanlar" style={{ marginTop: spacing.xl }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarScrollContent}
              >
                {similarPlaces.map((similarPlace) => (
                  <View key={similarPlace.id} style={styles.similarCardWrapper}>
                    <PlaceCard
                      image={getPlaceImageSource(similarPlace)}
                      imagePlaceholder={!hasPlaceImage(similarPlace)}
                      title={similarPlace.name}
                      subtitle={similarPlace.subtitle || similarPlace.description}
                      tags={similarPlace.tags}
                      onPress={() => router.push({ pathname: '/place/[id]', params: { id: String(similarPlace.id) } })}
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
        <View style={{ width: '100%' }}>
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
                <Text style={[h2Style, { fontSize: 20 }]}>Yorumlar</Text>
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
              <Text style={[bodySmallStyle]}>Yorumlar yükleniyor...</Text>
            ) : reviewsError ? (
              <Text style={[bodySmallStyle]}>{reviewsError}</Text>
            ) : !reviews.length ? (
              <Text style={[bodySmallStyle]}>
                Bu mekanda henüz yorum yok. Buradayken ilk yorumu sen bırakabilirsin.
              </Text>
            ) : (
              <>
                <View style={[styles.reviewsSummaryCard, { borderColor: colors.surface.border }]}>
                  <View style={[styles.ratingBadge, { backgroundColor: colors.accent.primary }]}>
                    <IconSymbol name="star.fill" size={18} color={colors.accent.onPrimary} />
                    <Text style={[styles.ratingBadgeText, { color: colors.accent.onPrimary }]}>
                      {averageRating}
                    </Text>
                  </View>
                  <View style={styles.ratingDetails}>
                    {[
                      { label: 'Servis' },
                      { label: 'Lezzet' },
                      { label: 'Ambiyans' },
                    ].map((item) => (
                      <View key={item.label} style={styles.ratingRow}>
                        <Text style={[bodySmallStyle, { width: 70 }]}>
                          {item.label}:
                        </Text>
                        <RatingStars value={Number(averageRating)} disabled size={14} />
                        <Text style={[bodySmallStyle, { marginLeft: spacing.xs }]}>
                          {averageRating}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={{ marginTop: spacing.lg }}>
                  <View style={styles.reviewsMetaRow}>
                    <View style={styles.reviewsMetaItem}>
                      <IconSymbol name="star.fill" size={16} color={colors.text.tertiary} />
                      <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                        {reviews.length} değerlendirme
                      </Text>
                    </View>
                    <View style={styles.reviewsMetaDivider} />
                    <View style={styles.reviewsMetaItem}>
                      <IconSymbol name="text.bubble.fill" size={16} color={colors.text.tertiary} />
                      <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                        {reviews.length} yorum
                      </Text>
                    </View>
                  </View>
                  {reviews.map((review) => (
                    <View key={review.id} style={[styles.reviewItem, { borderBottomColor: colors.surface.border }]}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewHeaderLeft}>
                          <Text style={[bodyStyle, { fontWeight: '600' }]}>
                            Kullanıcı #{review.user_id}
                          </Text>
                          {review.is_verified && (
                            <View
                              style={[
                                styles.verifiedBadge,
                                {
                                  borderColor: colors.accent.primary,
                                  backgroundColor: colors.accent.primary + '22',
                                },
                              ]}
                            >
                              <IconSymbol
                                name="checkmark.seal.fill"
                                size={12}
                                color={colors.accent.primary}
                              />
                              <Text
                                style={[
                                  styles.verifiedBadgeText,
                                  { color: colors.accent.primary },
                                ]}
                              >
                                Verified
                              </Text>
                            </View>
                          )}
                        </View>
                        <RatingStars value={review.rating} disabled size={16} />
                      </View>
                      <Text style={[bodySmallStyle, { marginTop: 8, lineHeight: 20 }]}>
                        {review.comment_text}
                      </Text>
                      {review.media_url && (
                        <Pressable
                          onPress={() => {
                            lightImpact();
                            const mediaReviews = reviews.filter(r => r.media_url);
                            const rIdx = mediaReviews.findIndex(r => r.id === review.id);
                            setReviewGalleryData({ reviews: mediaReviews, reviewIndex: rIdx, imageIndex: 0 });
                          }}
                          hitSlop={8}
                          style={({ pressed }) => [
                            styles.reviewImageContainer,
                            pressed && { opacity: 0.8 },
                          ]}
                        >
                          <Image
                            source={{ uri: review.media_url }}
                            style={styles.reviewImage}
                            resizeMode="cover"
                          />
                          {(review.media_urls?.length ?? 0) > 1 && (
                            <View style={styles.reviewImageBadge}>
                              <Text style={styles.reviewImageBadgeText}>
                                {review.media_urls!.length}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              </>
            )}
          </ScrollView>
          </RNAnimated.View>
        </View>
      </View>
      {/* Review Image Gallery Overlay */}
      {reviewGalleryData && (() => {
        const currentReview = reviewGalleryData.reviews[reviewGalleryData.reviewIndex];
        const currentImages = currentReview.media_urls?.length ? currentReview.media_urls : [currentReview.media_url!];
        const currentImageUrl = currentImages[reviewGalleryData.imageIndex];
        const hasNextImage = reviewGalleryData.imageIndex < currentImages.length - 1;
        const hasPrevImage = reviewGalleryData.imageIndex > 0;
        const hasNextReview = reviewGalleryData.reviewIndex < reviewGalleryData.reviews.length - 1;
        const hasPrevReview = reviewGalleryData.reviewIndex > 0;

        return (
          <View style={styles.imageModalOverlay}>
            <Pressable
              style={styles.imageModalBackdrop}
              onPress={() => setReviewGalleryData(null)}
            />
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
              <Image
                source={{ uri: currentImageUrl }}
                style={styles.galleryImage}
                resizeMode="contain"
              />

              {/* Image left arrow */}
              {hasPrevImage && (
                <TouchableOpacity
                  style={[styles.galleryArrow, styles.galleryArrowLeft]}
                  onPress={() => {
                    lightImpact();
                    setReviewGalleryData(prev => prev ? { ...prev, imageIndex: prev.imageIndex - 1 } : null);
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
                    setReviewGalleryData(prev => prev ? { ...prev, imageIndex: prev.imageIndex + 1 } : null);
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
                      style={[
                        styles.imageDot,
                        dIdx === reviewGalleryData.imageIndex && styles.imageDotActive,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>

            {/* Review info overlay */}
            <View style={styles.galleryReviewOverlay}>
              <View style={styles.galleryReviewHeader}>
                <Text style={styles.galleryReviewAuthor}>
                  Kullanıcı #{currentReview.user_id}
                </Text>
                {currentReview.is_verified && (
                  <View style={styles.galleryVerifiedBadge}>
                    <IconSymbol name="checkmark.seal.fill" size={12} color="#4ade80" />
                    <Text style={styles.galleryVerifiedText}>Verified</Text>
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
                    setReviewGalleryData(prev => prev ? { ...prev, reviewIndex: prev.reviewIndex - 1, imageIndex: 0 } : null);
                  }}
                  disabled={!hasPrevReview}
                  style={[styles.galleryNavButton, !hasPrevReview && { opacity: 0.3 }]}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="chevron.left" size={18} color="#fff" />
                  <Text style={styles.galleryNavText}>Önceki Yorum</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    lightImpact();
                    setReviewGalleryData(prev => prev ? { ...prev, reviewIndex: prev.reviewIndex + 1, imageIndex: 0 } : null);
                  }}
                  disabled={!hasNextReview}
                  style={[styles.galleryNavButton, !hasNextReview && { opacity: 0.3 }]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.galleryNavText}>Sonraki Yorum</Text>
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
    
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  placeImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    marginBottom: spacing.base,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reviewButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  reviewBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  reviewBackdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  reviewSheet: {
    width: '100%',
    alignSelf: 'stretch',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
    overflow: 'hidden',
  },
  reviewHandleRow: {
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    marginBottom: spacing.base,
  },
  reviewsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.base,
  },
  reviewsMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewsMetaDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#00000022',
    marginHorizontal: spacing.base,
  },
  reviewScrollContent: {
    paddingBottom: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  content: {
    paddingTop: spacing.base,
  },
  placeMetaSection: {
    marginBottom: spacing.md,
  },
  placeMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ratingContainer: {
    flex: 1,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sectionCard: {
    marginBottom: spacing.xl,
  },
  campaignCard: {
    marginBottom: spacing.lg,
  },
  campaignHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  atmosphereTags: {
    flexDirection: 'row',
    gap: spacing.base,
    marginTop: spacing.base,
  },
  atmosphereTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
  },
  highlightItem: {
    flex: 1,
    minWidth: 0,
    maxWidth: '25%',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewsSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  ratingBadgeText: {
    fontSize: 20,
    fontWeight: '700',
  },
  ratingDetails: {
    flex: 1,
    gap: spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviewItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: spacing.xs,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  reviewImageContainer: {
    marginTop: spacing.sm,
    borderRadius: 12,
    overflow: 'hidden',
    width: 200,
    height: 150,
  },
  reviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  reviewImageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewImageBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  imageModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: '#000',
  },
  imageModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  galleryTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: spacing.sm,
    zIndex: 10,
  },
  galleryImageArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  galleryArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  galleryArrowLeft: {
    left: 12,
  },
  galleryArrowRight: {
    right: 12,
  },
  imageDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  imageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  imageDotActive: {
    backgroundColor: '#fff',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  galleryReviewOverlay: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.base,
    paddingBottom: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  galleryReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  galleryReviewAuthor: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  galleryVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  galleryVerifiedText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
  },
  galleryReviewText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
  },
  galleryReviewNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.base,
  },
  galleryNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  galleryNavText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  similarScrollContent: {
    paddingRight: spacing.screenPadding,
  },
  similarCardWrapper: {
    width: 280,
    marginRight: spacing.base,
  },
});
