/**
 * Place Detail Screen
 * 
 * Comprehensive place information screen with location-based reviews and ratings.
 * Spotify-inspired dark theme design.
 * 
 * @module app/place/[id]
 */

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useTheme';
import { Screen, Section } from '@/components/layout';
import { PlaceCard } from '@/components/place/PlaceCard';
import { Button, Chip, Card, ReviewForm } from '@/components/ui';
import { useSavedPlaces } from '@/src/state/savedPlaces';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { createTextStyle } from '@/constants/design';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getCurrentLocation, isWithinPlaceRadius, type PlaceLocation } from '@/src/utils/location';
import { getPlaces } from '@/src/services/mekanService';
import { lightImpact, success, warning } from '@/src/utils/haptics';
import { apiPost } from '@/src/utils/apiClient';

export default function PlaceDetailScreen() {
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams();
  const id = String(params?.id ?? '');

  const savedIds = useSavedPlaces((s) => s.ids);
  const toggleSaved = useSavedPlaces((s) => s.toggle);
  const saved = savedIds.includes(id);

  const [place, setPlace] = useState<any>(null);
  const [userLocation, setUserLocation] = useState<PlaceLocation | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load place data
  useEffect(() => {
    loadPlaceData();
  }, [id]);

  // Check location when place data is loaded
  useEffect(() => {
    if (place?.latitude && place?.longitude) {
      checkUserLocation();
    }
  }, [place]);

  const loadPlaceData = async () => {
    try {
      const places = await getPlaces();
      const foundPlace = places.find((p) => String(p.id) === id);
      if (foundPlace) {
        setPlace(foundPlace);
      }
    } catch (error) {
      console.error('Error loading place:', error);
    }
  };

  const checkUserLocation = async () => {
    if (!place?.latitude || !place?.longitude) return;

    setCheckingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        setUserLocation(location);
        const nearby = isWithinPlaceRadius(
          location,
          { latitude: place.latitude, longitude: place.longitude },
          200 // 200 meter radius
        );
        setIsNearby(nearby);
        if (nearby) {
          success();
        } else {
          warning();
        }
      } else {
        Alert.alert(
          'Konum İzni Gerekli',
          'Yorum yapabilmek için konum izni vermeniz gerekiyor.',
          [{ text: 'Tamam' }]
        );
      }
    } catch (error) {
      console.error('Error checking location:', error);
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
      // TODO: Replace with actual API call
      await apiPost('/reviews/', {
        place_id: Number(id),
        comment_text: comment || 'Yorum yapılmadı',
        rating: rating,
      });

      Alert.alert('Başarılı', 'Yorumunuz gönderildi!', [
        { text: 'Tamam', onPress: () => setShowReviewForm(false) },
      ]);
      
      // Reload place data to show new review
      await loadPlaceData();
    } catch (error) {
      Alert.alert('Hata', 'Yorum gönderilirken bir hata oluştu.');
      console.error('Error submitting review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  const heroSource = useMemo(() => getPlaceImageSource(place || id), [place, id]);

  const alternatives = useMemo(() => {
    const current = Number(id);
    const candidates = [1, 2, 3, 4, 5, 6].filter(
      (x) => String(x) !== id && (!Number.isFinite(current) || x !== current)
    );
    return candidates.slice(0, 3).map(String);
  }, [id]);

  const titleStyle = createTextStyle('title', colors.text.primary);
  const subtitleStyle = createTextStyle('bodySmall', colors.text.secondary);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={heroSource} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={styles.heroGradient}
          />
          <View style={styles.heroHeader}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[
                styles.iconButton,
                {
                  backgroundColor: colors.surface.default + 'CC',
                  borderColor: colors.surface.border,
                },
              ]}
            >
              <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.saveButtonContainer}>
              <BlurView intensity={80} style={styles.saveButtonBlur}>
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
                    styles.saveButton,
                    {
                      backgroundColor: saved
                        ? colors.accent.primary
                        : 'rgba(255, 255, 255, 0.15)',
                    },
                  ]}
                >
                  <IconSymbol
                    name={saved ? 'heart.fill' : 'heart'}
                    size={18}
                    color={saved ? colors.text.inverse : colors.text.primary}
                  />
                </TouchableOpacity>
              </BlurView>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
          {/* Place Info */}
          <View style={[styles.placeInfo, { marginTop: spacing.xl, marginBottom: spacing.base }]}>
            <Text style={[titleStyle, styles.placeName]}>
              {place?.name || `Mekan #${id}`}
            </Text>
            <Text style={[subtitleStyle, styles.placeSubtitle]}>
              {place?.subtitle || place?.description || 'Mekan detayları'}
            </Text>
            {place?.address && (
              <View style={styles.addressContainer}>
                <IconSymbol name="location.fill" size={16} color={colors.text.secondary} />
                <Text style={[subtitleStyle, { marginLeft: 8 }]}>{place.address}</Text>
              </View>
            )}
            <View style={styles.tagsContainer}>
              {place?.category && <Chip label={place.category} />}
              {place?.tags?.slice(0, 3).map((tag: string, idx: number) => (
                <Chip key={idx} label={tag} />
              ))}
            </View>
          </View>

          {/* Actions */}
          <View style={[styles.actions, { marginBottom: spacing.xl }]}>
            <Button
              variant="primary"
              onPress={() => {
                // TODO: Implement maps integration
                if (place?.latitude && place?.longitude) {
                  // Linking.openURL(`maps://maps.apple.com/?daddr=${place.latitude},${place.longitude}`);
                }
              }}
              style={styles.actionButton}
            >
              Yol Tarifi Al
            </Button>
            <Button
              variant="secondary"
              onPress={() => {
                // TODO: Implement phone call
              }}
              style={styles.actionButton}
            >
              Ara
            </Button>
          </View>

          {/* Location Status */}
          <Card style={[styles.sectionCard, { marginBottom: spacing.base }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                Konum Durumu
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: isNearby
                      ? colors.accent.primary + '20'
                      : colors.surface.default,
                    borderColor: isNearby ? colors.accent.primary : colors.surface.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    {
                      color: isNearby ? colors.accent.primary : colors.text.secondary,
                    },
                  ]}
                >
                  {checkingLocation
                    ? 'Kontrol ediliyor...'
                    : isNearby
                    ? '✓ Yakındasınız'
                    : 'Mekan yakınında değilsiniz'}
                </Text>
              </View>
            </View>
            <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
              {isNearby
                ? 'Bu mekanın yakınındasınız. Yorum ve puan verebilirsiniz.'
                : 'Yorum ve puan verebilmek için mekanın 200 metre yakınında olmalısınız.'}
            </Text>
            <Button
              variant="secondary"
              onPress={checkUserLocation}
              loading={checkingLocation}
              style={styles.checkLocationButton}
            >
              Konumu Kontrol Et
            </Button>
          </Card>

          {/* Review Section */}
          {isNearby && (
            <Card style={[styles.sectionCard, { marginBottom: spacing.base }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                  Yorum Yap
                </Text>
              </View>
              {!showReviewForm ? (
                <>
                  <Text style={[styles.sectionDescription, { color: colors.text.secondary }]}>
                    Bu mekan hakkında düşüncelerinizi paylaşın. 1-5 yıldız arası puan verebilirsiniz.
                  </Text>
                  <Button
                    variant="primary"
                    onPress={() => {
                      lightImpact();
                      setShowReviewForm(true);
                    }}
                    style={styles.reviewButton}
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
              )}
            </Card>
          )}

          {/* Similar Places */}
          {alternatives.length > 0 && (
            <Section title="Benzer Mekanlar" style={styles.similarSection}>
              {alternatives.map((altId) => (
                <PlaceCard
                  key={altId}
                  image={getPlaceImageSource(altId)}
                  title={`Mekan #${altId}`}
                  subtitle="Benzer vibe/purpose/budget"
                  onPress={() => router.push({ pathname: '/place/[id]', params: { id: altId } })}
                />
              ))}
            </Section>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  saveButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  saveButtonBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingTop: 0,
  },
  placeInfo: {
    // Spacing handled by marginTop/marginBottom
  },
  placeName: {
    marginBottom: 8,
  },
  placeSubtitle: {
    marginBottom: 12,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  sectionCard: {
    // Card styling
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  checkLocationButton: {
    // Button styling
  },
  reviewButton: {
    // Button styling
  },
  similarSection: {
    marginTop: 24,
  },
});
