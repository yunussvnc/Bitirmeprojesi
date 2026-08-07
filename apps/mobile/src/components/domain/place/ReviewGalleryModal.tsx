import React from 'react';
import { View, Text, TouchableOpacity, Image, Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { RatingStars } from '@/src/components/ui/RatingStars';
import { lightImpact } from '@/src/utils/haptics';

export function ReviewGalleryModal({
  reviewGalleryData,
  setReviewGalleryData,
  t,
}: {
  reviewGalleryData: { reviews: any[]; reviewIndex: number; imageIndex: number } | null;
  setReviewGalleryData: React.Dispatch<React.SetStateAction<{ reviews: any[]; reviewIndex: number; imageIndex: number } | null>>;
  t: (key: string, options?: any) => string;
}) {
  if (!reviewGalleryData) return null;

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
            {currentImages.map((_: any, dIdx: number) => (
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
}

const styles = StyleSheet.create({
  imageModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 999,
  },
  imageModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  galleryTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  galleryImageArea: {
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
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
  },
  galleryArrowLeft: {
    left: 16,
  },
  galleryArrowRight: {
    right: 16,
  },
  imageDotsRow: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  imageDotActive: {
    backgroundColor: '#fff',
  },
  galleryReviewOverlay: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  galleryReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  galleryReviewAuthor: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  galleryVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  galleryVerifiedText: {
    color: '#4ade80',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  galleryReviewText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  galleryReviewNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  galleryNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  galleryNavText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
});
