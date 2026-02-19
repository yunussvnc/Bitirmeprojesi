/**
 * Place Detail Screen
 * 
 * Immersive place detail experience inspired by TrendyolGo/Yemeksepeti.
 * Premium dark-first design with rich information architecture.
 * 
 * @module app/place/[id]
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Linking, Share } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';
import { Screen, Section } from '@/components/layout';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Button, Chip, Card, ReviewForm, RatingStars } from '@/components/ui';
import { useAppStore } from '@/src/store/useAppStore';
import { getPlaceImageSource, hasPlaceImage } from '@/src/utils/placeImages';
import { createTextStyle, spacing, imageOverlay } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { calculateDistance, getCurrentLocation, type PlaceLocation } from '@/src/utils/location';
import { getPlaceById, getAllPlaces } from '@/src/services/mekanService';
import { lightImpact, success, warning } from '@/src/utils/haptics';
import { apiGet, apiPost } from '@/src/utils/apiClient';

type Review = {
  id: number;
  user_id: number;
  place_id: number;
  comment_text: string;
  rating: number;
  is_verified: boolean;
  created_at: string;
};

export default function PlaceDetailScreen() {
  const { colors, spacing: spacingTokens } = useTheme();
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

  // Load place data
  useEffect(() => {
    loadPlaceData();
    loadReviews();
    loadSimilarPlaces();
  }, [id]);

  const loadPlaceData = async () => {
    try {
      const foundPlace = await getPlaceById(id);
      if (foundPlace) {
        setPlace(foundPlace);
      }
    } catch (error) {
      console.error('Error loading place:', error);
    }
  };

  const loadReviews = async () => {
    if (!id) return;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const data = await apiGet<Review[]>(`/places/${id}/reviews`);
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviewsError('Yorumlar yüklenirken bir hata oluştu.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const loadSimilarPlaces = async () => {
    try {
      const places = await getAllPlaces();
      const filtered = places
        .filter((p) => String(p.id) !== id && p.category === place?.category)
        .slice(0, 5);
      setSimilarPlaces(filtered);
    } catch (error) {
      console.error('Error loading similar places:', error);
    }
  };

  useEffect(() => {
    if (place) {
      loadSimilarPlaces();
    }
  }, [place]);

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
      console.error('Error checking location:', error);
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
      console.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleNavigate = () => {
    if (place?.latitude && place?.longitude) {
      const url = `maps://maps.apple.com/?daddr=${place.latitude},${place.longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Hata', 'Harita uygulaması açılamadı.');
      });
    }
  };

  const handleCall = () => {
    // TODO: Add phone number to Place model
    Alert.alert('Bilgi', 'Telefon numarası henüz eklenmedi.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${place?.name || 'Mekan'} - ${place?.address || ''}`,
        url: `asemos://place/${id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
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

  const ratingDistribution = useMemo(() => {
    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      if (r.rating >= 1 && r.rating <= 5) {
        dist[r.rating] += 1;
      }
    });
    return dist;
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
  const h3Style = { fontSize: 18, fontWeight: '700' as const, color: colors.text.primary };
  const bodyStyle = { fontSize: 15, fontWeight: '400' as const, color: colors.text.primary };
  const bodySmallStyle = { fontSize: 14, fontWeight: '400' as const, color: colors.text.secondary };
  const captionStyle = { fontSize: 12, fontWeight: '400' as const, color: colors.text.tertiary };

  return (
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
          
          <TouchableOpacity
            onPress={() => {
              lightImpact();
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
          <Text style={[h1Style, { fontSize: 24, marginBottom: spacing.sm }]}>
            {place?.name || `Mekan #${id}`}
          </Text>
          
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
              {averageRating && (
                <View style={styles.ratingContainer}>
                  <Text style={[{ fontSize: 32, fontWeight: '700', color: colors.text.primary }]}>
                    {averageRating}
                  </Text>
                  <RatingStars value={Number(averageRating)} onChange={() => {}} />
                  <Text style={[captionStyle, { marginTop: 4 }]}>
                    {reviews.length} yorum
                  </Text>
                </View>
              )}
              {distanceText && (
                <View style={styles.distanceContainer}>
                  <IconSymbol name="location.fill" size={18} color={colors.text.secondary} />
                  <Text style={[bodySmallStyle, { marginLeft: 4 }]}>{distanceText}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Quick Actions Row — outline butonlar, Kaydet basınca dolup yeşil */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                handleNavigate();
              }}
              style={[styles.quickActionButton, styles.quickActionButtonOutline, { borderColor: colors.surface.border }]}
            >
              <FontAwesome5 name="route" size={22} color={colors.accent.primary} solid={false} />
              <Text style={[bodySmallStyle, { marginTop: 4, textAlign: 'center', color: colors.text.primary }]}>
                Yol Tarifi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                handleCall();
              }}
              style={[styles.quickActionButton, styles.quickActionButtonOutline, { borderColor: colors.surface.border }]}
            >
              <FontAwesome5 name="phone" size={22} color={colors.text.secondary} solid={false} />
              <Text style={[bodySmallStyle, { marginTop: 4, textAlign: 'center', color: colors.text.secondary }]}>
                Ara
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                handleShare();
              }}
              style={[styles.quickActionButton, styles.quickActionButtonOutline, { borderColor: colors.surface.border }]}
            >
              <FontAwesome5 name="share-alt" size={22} color={colors.text.secondary} solid={false} />
              <Text style={[bodySmallStyle, { marginTop: 4, textAlign: 'center', color: colors.text.secondary }]}>
                Paylaş
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                lightImpact();
                toggleSaved({
                  id,
                  name: place?.name || `Mekan #${id}`,
                  subtitle: place?.subtitle || place?.description || 'Detay ekranı',
                });
              }}
              style={[
                styles.quickActionButton,
                saved
                  ? { backgroundColor: colors.accent.primary, borderWidth: 1, borderColor: colors.accent.primary }
                  : [styles.quickActionButtonOutline, { borderColor: colors.surface.border }],
              ]}
            >
              <IconSymbol
                name={saved ? 'heart.fill' : 'heart'}
                size={24}
                color={saved ? '#FFFFFF' : colors.text.secondary}
              />
              <Text style={[bodySmallStyle, { marginTop: 4, textAlign: 'center', color: saved ? '#FFFFFF' : colors.text.secondary }]}>
                Kaydet
              </Text>
            </TouchableOpacity>
          </View>

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
                <View style={styles.atmosphereTag}>
                  <FontAwesome5 name="volume-mute" size={14} color={colors.text.secondary} solid={false} />
                  <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                    {place.tags?.includes('quiet') ? 'Sessiz' : 'Canlı'} ortam
                  </Text>
                </View>
                <View style={styles.atmosphereTag}>
                  <IconSymbol name="person.fill" size={16} color={colors.text.secondary} />
                  <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                    {place.tags?.includes('work') ? 'Çalışma' : 'Sosyal'} için ideal
                  </Text>
                </View>
              </View>
            </Card>
          )}

          {/* Highlights Grid */}
          <Card style={styles.sectionCard}>
            <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>
              Özellikler
            </Text>
            <View style={styles.highlightsGrid}>
              {[
                { fa5: 'wifi' as const, fa5Unavailable: 'wifi-slash' as const, label: 'Wi-Fi', available: true },
                { fa5: 'plug' as const, fa5Unavailable: 'plug' as const, label: 'Priz', available: true },
                { fa5: 'volume-mute' as const, fa5Unavailable: 'volume-mute' as const, label: 'Sessiz', available: place?.tags?.includes('quiet') },
                { fa5: 'umbrella' as const, fa5Unavailable: 'umbrella' as const, label: 'Terasta oturma', available: false },
              ].map((item, idx) => {
                const iconName = item.available ? item.fa5 : item.fa5Unavailable;
                const iconColor = item.available ? colors.accent.primary : colors.text.tertiary;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.highlightItem,
                      {
                        backgroundColor: item.available
                          ? colors.accent.primary + '15'
                          : colors.surface.default,
                        borderColor: item.available
                          ? colors.accent.primary + '30'
                          : colors.surface.border,
                      },
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
                          marginTop: 4,
                          color: item.available ? colors.text.primary : colors.text.tertiary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>

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
                <Button
                  variant="secondary"
                  onPress={handleNavigate}
                  style={{ marginTop: spacing.base }}
                >
                  Yol Tarifi Al
                </Button>
              </View>
            </Card>
          )}

          {/* Reviews Summary & List */}
          <Card style={styles.sectionCard}>
            <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>
              Yorumlar & Puanlar
            </Text>

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
                <View style={styles.reviewsSummaryRow}>
                  <View style={styles.reviewsAverage}>
                    <Text style={[h2Style, { fontSize: 36, color: colors.text.primary }]}>
                      {averageRating}
                    </Text>
                    <RatingStars value={Number(averageRating)} onChange={() => {}} />
                    <Text style={[bodySmallStyle, { marginTop: 4 }]}>
                      {reviews.length} yorum
                    </Text>
                  </View>
                  <View style={styles.reviewsDistribution}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = ratingDistribution[star] || 0;
                      const ratio = reviews.length ? count / reviews.length : 0;
                      return (
                        <View key={star} style={styles.distributionRow}>
                          <Text style={[bodySmallStyle, { width: 20 }]}>{star}★</Text>
                          <View style={styles.distributionBarBackground}>
                            <View
                              style={[
                                styles.distributionBarFill,
                                {
                                  width: `${(ratio * 100).toFixed(0)}%` as any,
                                  backgroundColor: colors.accent.primary,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[bodySmallStyle, { marginLeft: 8, minWidth: 20 }]}>
                            {count}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                <View style={{ marginTop: spacing.lg }}>
                  {reviews.slice(0, 5).map((review) => (
                    <View key={review.id} style={styles.reviewItem}>
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
                        <RatingStars value={review.rating} onChange={() => {}} />
                      </View>
                      <Text style={[bodySmallStyle, { marginTop: 8, lineHeight: 20 }]}>
                        {review.comment_text}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>

          {/* Review Composer */}
          <Card style={styles.sectionCard}>
            <Text style={[h2Style, { fontSize: 20, marginBottom: spacing.base }]}>
              Deneyimini paylaş
            </Text>
            {isNearby ? (
              !showReviewForm ? (
                <>
                  <Text style={[bodySmallStyle, { marginBottom: spacing.base }]}>
                    Şu anda bu mekandasın. Deneyimini paylaş, yorumun doğrulanmış olarak işaretlensin.
                  </Text>
                  <Button
                    variant="primary"
                    onPress={() => {
                      lightImpact();
                      setShowReviewForm(true);
                    }}
                  >
                    Yorum Yap
                  </Button>
                </>
              ) : (
                <ReviewForm
                  onSubmit={handleSubmitReview}
                  onCancel={() => {
                    lightImpact();
                    setShowReviewForm(false);
                  }}
                  loading={submittingReview}
                />
              )
            ) : (
              <>
                <Text style={[bodySmallStyle, { marginBottom: spacing.sm }]}>
                  AsEmOs'ta yorumlar, gerçekten mekandayken bırakılabilir. Bu mekanı
                  değerlendirmek için şu anda burada olmalısın.
                </Text>
                {lastDistance != null && (
                  <Text style={[captionStyle, { marginBottom: spacing.base }]}>
                    Tahmini mesafen: ~{Math.round(lastDistance)} m
                  </Text>
                )}
                <Button
                  variant="secondary"
                  onPress={checkUserLocation}
                  loading={checkingLocation}
                  style={{ marginBottom: spacing.sm }}
                >
                  Konumumu Kontrol Et
                </Button>
                <Button variant="secondary" onPress={handleNavigate}>
                  Yol tarifi al
                </Button>
              </>
            )}
          </Card>

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
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
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
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    borderRadius: 16,
  },
  quickActionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  sectionCard: {
    marginBottom: spacing.xl,
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
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  highlightItem: {
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
  },
  locationPreview: {
    // Spacing handled by children
  },
  locationAddress: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reviewsSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  reviewsAverage: {
    flex: 1,
  },
  reviewsDistribution: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  distributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  distributionBarBackground: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: spacing.xs,
    overflow: 'hidden',
  },
  distributionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  reviewItem: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
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
  similarScrollContent: {
    paddingRight: spacing.screenPadding,
  },
  similarCardWrapper: {
    width: 280,
    marginRight: spacing.base,
  },
});
