import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderHandlers,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { RatingStars } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { spacing } from '@/src/constants/design';
import { useTheme } from '@/src/hooks/useTheme';
import { lightImpact } from '@/src/utils/haptics';
import { StoryViewerModal } from '../../explore/StoryViewerModal';
import { HeroImageViewer } from '../HeroImageViewer';
import { PlaceDetailMenuSheet } from '../PlaceDetailMenuSheet';
import { ReviewGalleryModal } from '../ReviewGalleryModal';

import { styles } from './styles';

export interface Review {
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
}

export interface ReviewGalleryData {
  reviews: Review[];
  reviewIndex: number;
  imageIndex: number;
}

interface PlaceDetailOverlaysProps {
  showReviews: boolean;
  onCloseReviews: () => void;
  reviewSheetHeight: RNAnimated.Value;
  reviewPanHandlers: GestureResponderHandlers;
  reviewScrollOffsetRef: MutableRefObject<number>;
  reviews: Review[];
  reviewsLoading: boolean;
  reviewsError: string | null;
  averageRating: string | null;
  hasMoreReviews: boolean;
  reviewsLoadingMore: boolean;
  onLoadMoreReviews: () => void;
  reviewGalleryData: ReviewGalleryData | null;
  setReviewGalleryData: Dispatch<SetStateAction<ReviewGalleryData | null>>;
  showHeroImage: boolean;
  heroSource: any;
  onCloseHeroImage: () => void;
  screenWidth: number;
  screenHeight: number;
  showMenu: boolean;
  onCloseMenu: () => void;
  menuSheetHeight: RNAnimated.Value;
  menuPanHandlers: GestureResponderHandlers;
  place: any;
  placeStories: any[];
  selectedStoryIndex: number;
  showStoriesModal: boolean;
  onCloseStories: () => void;
  currentUserId?: number;
}

export function PlaceDetailOverlays({
  showReviews,
  onCloseReviews,
  reviewSheetHeight,
  reviewPanHandlers,
  reviewScrollOffsetRef,
  reviews,
  reviewsLoading,
  reviewsError,
  averageRating,
  hasMoreReviews,
  reviewsLoadingMore,
  onLoadMoreReviews,
  reviewGalleryData,
  setReviewGalleryData,
  showHeroImage,
  heroSource,
  onCloseHeroImage,
  screenWidth,
  screenHeight,
  showMenu,
  onCloseMenu,
  menuSheetHeight,
  menuPanHandlers,
  place,
  placeStories,
  selectedStoryIndex,
  showStoriesModal,
  onCloseStories,
  currentUserId,
}: PlaceDetailOverlaysProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const h2Style = { fontSize: 20, fontWeight: '700' as const, color: colors.text.primary };
  const bodyStyle = { fontSize: 15, fontWeight: '400' as const, color: colors.text.primary };
  const bodySmallStyle = { fontSize: 14, fontWeight: '400' as const, color: colors.text.secondary };
  const captionStyle = { fontSize: 12, fontWeight: '400' as const, color: colors.text.tertiary };
  const totalReviewCount = reviews.length;

  return (
    <>
      <Modal
        visible={showReviews}
        transparent
        animationType="none"
        onRequestClose={onCloseReviews}
        statusBarTranslucent
      >
        {showReviews && (
          <>
            <View style={styles.reviewBackdrop}>
              <Pressable
                style={[styles.reviewBackdropPressable, { backgroundColor: colors.overlay.medium }]}
                onPress={onCloseReviews}
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
                    <View style={styles.reviewDragArea} {...reviewPanHandlers}>
                      <View style={styles.reviewHandleRow}>
                        <View style={[styles.reviewHandle, { backgroundColor: colors.surface.border }]} />
                      </View>
                      <View style={styles.reviewHeaderRow}>
                        <Text style={[h2Style, { fontSize: 20 }]}>{t('place_detail.reviews')}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            lightImpact();
                            onCloseReviews();
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
                    onScroll={(event) => {
                      reviewScrollOffsetRef.current = event.nativeEvent.contentOffset.y;
                    }}
                    scrollEventThrottle={16}
                  >
                    {reviewsLoading ? (
                      <Text style={bodySmallStyle}>{t('place_detail.reviews_loading')}</Text>
                    ) : reviewsError ? (
                      <Text style={bodySmallStyle}>{reviewsError}</Text>
                    ) : !reviews.length ? (
                      <Text style={bodySmallStyle}>{t('place_detail.reviews_empty')}</Text>
                    ) : (
                      <>
                        {averageRating && (
                          <View style={[styles.reviewsSummaryCard, { borderColor: colors.surface.border }]}>
                            <View style={[styles.ratingBadge, { backgroundColor: colors.accent.primary }]}>
                              <IconSymbol name="star.fill" size={18} color={colors.accent.onPrimary} />
                              <Text style={[styles.ratingBadgeText, { color: colors.accent.onPrimary }]}>
                                {averageRating}
                              </Text>
                            </View>
                            <View style={styles.ratingDetails}>
                              {[
                                { label: t('explore.rating_service') },
                                { label: t('explore.rating_taste') },
                                { label: t('explore.rating_ambiance') },
                              ].map((item) => (
                                <View key={item.label} style={styles.ratingRow}>
                                  <Text style={[bodySmallStyle, { width: 70 }]}>{item.label}:</Text>
                                  <RatingStars value={Number(averageRating)} disabled size={14} />
                                  <Text style={[bodySmallStyle, { marginLeft: spacing.xs }]}>
                                    {averageRating}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}

                        <View style={{ marginTop: spacing.lg }}>
                          <View style={styles.reviewsMetaRow}>
                            <View style={styles.reviewsMetaItem}>
                              <IconSymbol name="star.fill" size={16} color={colors.text.tertiary} />
                              <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                                {t('explore.rating_count', { count: totalReviewCount })}
                              </Text>
                            </View>
                            <View style={styles.reviewsMetaDivider} />
                            <View style={styles.reviewsMetaItem}>
                              <IconSymbol name="text.bubble.fill" size={16} color={colors.text.tertiary} />
                              <Text style={[bodySmallStyle, { marginLeft: 6 }]}>
                                {t('explore.comment_count', { count: totalReviewCount })}
                              </Text>
                            </View>
                          </View>

                          {reviews.map((review) => (
                            <View
                              key={review.id}
                              style={[styles.reviewItem, { borderBottomColor: colors.surface.border }]}
                            >
                              <View style={styles.reviewHeader}>
                                <View style={[styles.reviewHeaderLeft, { alignItems: 'center' }]}>
                                  {review.user?.avatar_url ? (
                                    <ExpoImage
                                      source={{ uri: review.user.avatar_url }}
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        marginRight: 8,
                                        backgroundColor: colors.surface.default,
                                      }}
                                      cachePolicy="memory-disk"
                                    />
                                  ) : (
                                    <View
                                      style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        marginRight: 8,
                                        backgroundColor: colors.surface.default,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                      }}
                                    >
                                      <IconSymbol name="person.fill" size={16} color={colors.text.tertiary} />
                                    </View>
                                  )}
                                  <Text style={[bodyStyle, { fontWeight: '600' }]}>
                                    {review.user?.username ||
                                      review.user?.first_name ||
                                      t('explore.user_id', { id: review.user_id })}
                                  </Text>
                                  {review.is_verified && (
                                    <View
                                      style={[
                                        styles.verifiedBadge,
                                        {
                                          borderColor: colors.accent.primary,
                                          backgroundColor: `${colors.accent.primary}22`,
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
                                        {t('explore.verified')}
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
                                    const mediaReviews = reviews.filter((item) => item.media_url);
                                    const reviewIndex = mediaReviews.findIndex((item) => item.id === review.id);
                                    setReviewGalleryData({
                                      reviews: mediaReviews,
                                      reviewIndex,
                                      imageIndex: 0,
                                    });
                                  }}
                                  hitSlop={8}
                                  style={({ pressed }) => [
                                    styles.reviewImageContainer,
                                    pressed && { opacity: 0.8 },
                                  ]}
                                >
                                  <ExpoImage
                                    source={{ uri: review.media_url }}
                                    style={styles.reviewImage}
                                    contentFit="cover"
                                    cachePolicy="memory-disk"
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
                          {hasMoreReviews && reviews.length > 0 && (
                            <TouchableOpacity
                              style={{ paddingVertical: 16, alignItems: 'center', marginTop: 8 }}
                              onPress={onLoadMoreReviews}
                              disabled={reviewsLoadingMore}
                            >
                              <Text
                                style={[
                                  bodyStyle,
                                  { color: colors.accent.primary, fontWeight: '600' },
                                ]}
                              >
                                {reviewsLoadingMore
                                  ? t('place_detail.loading', { defaultValue: 'Yükleniyor...' })
                                  : 'Daha Fazla Yükle'}
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
            {reviewGalleryData && (
              <ReviewGalleryModal
                reviewGalleryData={reviewGalleryData}
                setReviewGalleryData={setReviewGalleryData}
                t={t}
              />
            )}
          </>
        )}
      </Modal>

      <Modal
        visible={showHeroImage}
        transparent
        animationType="fade"
        onRequestClose={onCloseHeroImage}
        statusBarTranslucent
      >
        <HeroImageViewer
          heroSource={heroSource}
          insetTop={insets.top || 44}
          onClose={onCloseHeroImage}
          screenWidth={screenWidth}
          screenHeight={screenHeight}
          t={t}
        />
      </Modal>

      <Modal
        visible={showMenu}
        transparent
        animationType="none"
        onRequestClose={onCloseMenu}
        statusBarTranslucent
      >
        {showMenu && (
          <View style={styles.reviewBackdrop}>
            <Pressable
              style={[styles.reviewBackdropPressable, { backgroundColor: colors.overlay.medium }]}
              onPress={onCloseMenu}
            />
            <View style={{ width: '100%' }}>
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
                  <View style={styles.reviewDragArea} {...menuPanHandlers}>
                    <View style={styles.reviewHandleRow}>
                      <View style={[styles.reviewHandle, { backgroundColor: colors.surface.border }]} />
                    </View>
                    <View style={styles.reviewHeaderRow}>
                      <Text style={[h2Style, { fontSize: 20 }]}>{t('explore.menu')}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          lightImpact();
                          onCloseMenu();
                        }}
                        activeOpacity={0.7}
                      >
                        <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <PlaceDetailMenuSheet
                  place={place}
                  t={t}
                  colors={colors}
                  spacing={spacing}
                  h2Style={h2Style}
                  bodyStyle={bodyStyle}
                  captionStyle={captionStyle}
                  bodySmallStyle={bodySmallStyle}
                  SCREEN_WIDTH={screenWidth}
                />
              </RNAnimated.View>
            </View>
          </View>
        )}
      </Modal>

      {placeStories.length > 0 && (
        <StoryViewerModal
          stories={placeStories}
          initialIndex={selectedStoryIndex}
          visible={showStoriesModal}
          onClose={onCloseStories}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
