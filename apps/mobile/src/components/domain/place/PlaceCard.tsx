/**
 * Place Card Component
 * 
 * Large place card for listings and recommendations.
 * Spotify-inspired design with image, title, subtitle, and tags.
 * 
 * @module components/place/PlaceCard
 */

import React, { useState } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ImageSourcePropType,
  type TextStyle,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks/useTheme';
import { Chip } from '@/src/components/ui/Chip';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { createTextStyle, spacing as designSpacing, radius, PLACE_CARD_ASPECT, PLACE_CARD_IMAGE_MAX_HEIGHT } from '@/src/constants/design';
import { mediumImpact, lightImpact } from '@/src/utils/haptics';
import { useTranslation } from 'react-i18next';
import { analyzeReviews } from '@/src/services/aiService';
import type { AnalyzeReviewResponse } from '@/src/types/ai';

export interface PlaceCardProps {
  image: ImageSourcePropType;
  title: string;
  subtitle?: string;
  tags?: string[];
  imagePlaceholder?: boolean;
  location?: string;
  explanation?: string;
  distance_m?: number;
  isRecommended?: boolean;
  hasMenu?: boolean;
  data_id?: string;
  onPress: () => void;
  testID?: string;
}

/**
 * Place Card Component
 * 
 * Large card component for displaying places.
 * Features image with gradient overlay, title, subtitle, and tags.
 * 
 * @example
 * ```tsx
 * <PlaceCard
 *   image={require('@/assets/places/place-1.jpg')}
 *   title="Café Luna"
 *   subtitle="Sessiz, çalışmalık"
 *   tags={['quiet', 'work', 'cafe']}
 *   rank={1}
 *   onPress={() => navigateToPlace(placeId)}
 * />
 * ```
 */
const PlaceCardComponent = function PlaceCard({
  image,
  title,
  subtitle,
  tags,
  imagePlaceholder = false,
  location,
  explanation,
  distance_m,
  isRecommended = false,
  hasMenu = false,
  data_id,
  onPress,
  testID,
}: PlaceCardProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const titleStyle = createTextStyle('heading', colors.text.primary);
  const subtitleColor = colors.text.primary + 'CC'; // %80 opacity
  
  // Review analysis state
  const [analysisModalVisible, setAnalysisModalVisible] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalyzeReviewResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handlePress = () => {
    mediumImpact();
    onPress();
  };

  const handleAnalyzePress = async () => {
    if (!data_id) return;
    
    lightImpact();
    setAnalysisModalVisible(true);
    setAnalysisLoading(true);
    setAnalysisError(null);
    
    try {
      const result = await analyzeReviews({ data_id, place_name: title });
      setAnalysisData(result);
    } catch (error) {
      setAnalysisError(error instanceof Error ? error.message : t('place_card.analysis_error'));
    } finally {
      setAnalysisLoading(false);
    }
  };

  const closeAnalysisModal = () => {
    lightImpact();
    setAnalysisModalVisible(false);
  };

  // 3D depth colors derived from theme
  const depthEdgeColor = isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.12)';
  const depthHighlightColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)';

  return (
    <View style={styles.animatedWrapper}>
      {/* 3D depth layer — sits behind the card to simulate thickness */}
      <View style={[styles.depthLayer]} />
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.95}
        style={[styles.card]}
        testID={testID}
      >
        <View style={styles.imageContainer}>
          {imagePlaceholder ? (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="mappin.and.ellipse" size={32} color={colors.text.tertiary} />
              <Text style={[styles.placeholderLabel, { color: colors.text.tertiary }]} numberOfLines={1}>
                {t('explore.no_image')}
              </Text>
            </View>
          ) : (
            <>
              <Image source={image as any} style={[styles.image, { backgroundColor: colors.surface.elevated }]} contentFit="contain" cachePolicy="memory-disk" />
              <LinearGradient
                colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.82)']}
                locations={[0.2, 0.55, 1]}
                style={styles.gradient}
              />
            </>
          )}
          {location ? (
            <View
              style={[
                styles.locationBadge,
                {
                  backgroundColor: 'rgba(0,0,0,0.4)',
                },
              ]}
            >
              <IconSymbol name="mappin.circle.fill" size={11} color="rgba(255,255,255,0.95)" />
              <Text style={styles.locationBadgeText} numberOfLines={1}>{location}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.content, {
          backgroundColor: colors.background.secondary,
        }]}>
          {isRecommended && (
            <View style={[styles.recommendedBadge, { backgroundColor: colors.accent.primary + '18' }]}>
              <IconSymbol name="sparkles" size={11} color={colors.accent.primary} />
              <Text style={[styles.recommendedText, { color: colors.accent.primary }]}>{t('explore.recommended')}</Text>
            </View>
          )}
          <View style={styles.titleRow}>
            <Text style={[titleStyle as TextStyle, styles.title]} numberOfLines={2}>
              {title}
            </Text>
            {distance_m != null && (
              <Text style={[styles.distanceText, { color: colors.text.tertiary }]}>
                {distance_m < 1000 ? `${distance_m}m` : `${(distance_m / 1000).toFixed(1)}km`}
              </Text>
            )}
          </View>
          {explanation && (
            <Text style={[styles.explanation, { color: colors.text.secondary }]} numberOfLines={3}>
              {explanation}
            </Text>
          )}
          {!explanation && subtitle && (
            <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={2}>
              {subtitle}
            </Text>
          )}
          {tags && tags.length > 0 && (
            <View style={styles.tags}>
              {hasMenu && (
                <View style={styles.menuBadge}>
                  <IconSymbol name="list.bullet.clipboard.fill" size={10} color="#10b981" />
                  <Text style={styles.menuBadgeText}>{t('explore.menu')}</Text>
                </View>
              )}
              {tags.slice(0, 3).map((tag, index) => (
                <Chip key={index} label={tag} size="small" />
              ))}
            </View>
          )}
          {!tags?.length && hasMenu && (
            <View style={styles.tags}>
              <View style={styles.menuBadge}>
                <IconSymbol name="list.bullet.clipboard.fill" size={10} color="#10b981" />
                <Text style={styles.menuBadgeText}>{t('explore.menu')}</Text>
              </View>
            </View>
          )}
          {data_id && (
            <TouchableOpacity
              onPress={handleAnalyzePress}
              style={[styles.analyzeButton, { backgroundColor: colors.accent.primary + '15', borderColor: colors.accent.primary + '30' }]}
              activeOpacity={0.7}
            >
              <IconSymbol name="sparkles" size={13} color={colors.accent.primary} />
              <Text style={[styles.analyzeButtonText, { color: colors.accent.primary }]}>
                {t('place_card.analyze_reviews')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* Analysis Modal */}
      <Modal
        visible={analysisModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeAnalysisModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.surface.border }]}>
            <View style={styles.modalHeaderContent}>
              <IconSymbol name="sparkles" size={20} color={colors.accent.primary} />
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
                {t('place_card.review_analysis')}
              </Text>
            </View>
            <TouchableOpacity onPress={closeAnalysisModal} style={styles.modalCloseButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentInner}>
            {analysisLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent.primary} />
                <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                  {t('place_card.analyzing')}
                </Text>
              </View>
            )}

            {analysisError && !analysisLoading && (
              <View style={[styles.errorContainer, { backgroundColor: colors.surface.elevated }]}>
                <IconSymbol name="exclamationmark.triangle.fill" size={32} color="#ef4444" />
                <Text style={[styles.errorText, { color: colors.text.primary }]}>
                  {analysisError}
                </Text>
              </View>
            )}

            {analysisData && !analysisLoading && !analysisError && (
              <>
                {/* Summary */}
                <View style={[styles.summaryCard, { backgroundColor: colors.surface.elevated }]}>
                  <Text style={[styles.summaryText, { color: colors.text.primary }]}>
                    {analysisData.summary}
                  </Text>
                  {analysisData.sentiment_score !== undefined && (
                    <View style={styles.sentimentRow}>
                      <Text style={[styles.sentimentLabel, { color: colors.text.secondary }]}>
                        {t('place_card.sentiment')}:
                      </Text>
                      <Text style={[styles.sentimentScore, { color: getSentimentColor(analysisData.sentiment_score) }]}>
                        {(analysisData.sentiment_score * 100).toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </View>

                {/* Analysis Text */}
                {analysisData.analysis_text && (
                  <View style={[styles.analysisCard, { backgroundColor: colors.surface.elevated }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                      {t('place_card.detailed_analysis')}
                    </Text>
                    <Text style={[styles.analysisText, { color: colors.text.secondary }]}>
                      {analysisData.analysis_text}
                    </Text>
                  </View>
                )}

                {/* Highlight Tags */}
                {analysisData.highlight_tags && analysisData.highlight_tags.length > 0 && (
                  <View style={[styles.tagsCard, { backgroundColor: colors.surface.elevated }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                      {t('place_card.highlights')}
                    </Text>
                    <View style={styles.highlightTags}>
                      {analysisData.highlight_tags.map((tag, index) => (
                        <View key={index} style={[styles.highlightTag, { backgroundColor: colors.accent.primary + '18', borderColor: colors.accent.primary + '30' }]}>
                          <Text style={[styles.highlightTagText, { color: colors.accent.primary }]}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Specialties */}
                {analysisData.specialties && analysisData.specialties.length > 0 && (
                  <View style={[styles.specialtiesCard, { backgroundColor: colors.surface.elevated }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
                      {t('place_card.specialties')}
                    </Text>
                    {analysisData.specialties.map((specialty, index) => (
                      <View key={index} style={[styles.specialtyItem, { borderColor: colors.surface.border }]}>
                        <View style={styles.specialtyHeader}>
                          <Text style={styles.specialtyEmoji}>{specialty.emoji}</Text>
                          <Text style={[styles.specialtyLabel, { color: colors.text.primary }]}>
                            {specialty.label}
                          </Text>
                        </View>
                        {specialty.example_review && (
                          <Text style={[styles.specialtyExample, { color: colors.text.tertiary }]} numberOfLines={2}>
                            {`"${specialty.example_review}"`}
                          </Text>
                        )}
                        <View style={styles.specialtyStats}>
                          <Text style={[styles.specialtyStat, { color: colors.text.secondary }]}>
                            {specialty.mention_count} {t('place_card.mentions')}
                          </Text>
                          <Text style={[styles.specialtyConfidence, { color: colors.accent.primary }]}>
                            {(specialty.confidence * 100).toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Review Count */}
                <View style={styles.reviewCountContainer}>
                  <Text style={[styles.reviewCount, { color: colors.text.tertiary }]}>
                    {t('place_card.analyzed_reviews', { count: analysisData.review_count })}
                  </Text>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

function getSentimentColor(score: number): string {
  if (score >= 0.7) return '#10b981'; // green
  if (score >= 0.4) return '#f59e0b'; // amber
  return '#ef4444'; // red
}

export const PlaceCard = React.memo(PlaceCardComponent);

const styles = StyleSheet.create({
  animatedWrapper: {
    // 3D multi-layer shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  depthLayer: {
    // Fake 3D thickness layer behind the card
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: -4,
    height: 8,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    // Subtle border for 3D edge
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  topHighlight: {
    // Top edge light reflection for 3D feel
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    zIndex: 10,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  bottomEdge: {
    // Bottom dark edge for 3D thickness illusion
    height: 3,
    marginTop: -1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: PLACE_CARD_ASPECT,
    maxHeight: PLACE_CARD_IMAGE_MAX_HEIGHT,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: designSpacing.sm,
  },
  placeholderLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  locationBadge: {
    position: 'absolute',
    bottom: designSpacing.sm,
    left: designSpacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  locationBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    maxWidth: 120,
  },
  content: {
    paddingVertical: designSpacing.base,
    paddingHorizontal: designSpacing.md,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  recommendedText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
    flex: 1,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  explanation: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
    justifyContent: 'flex-end',
  },
  menuBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    letterSpacing: 0.3,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  analyzeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalContentInner: {
    padding: 20,
    gap: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 12,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  summaryText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  sentimentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sentimentLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  sentimentScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  analysisCard: {
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 21,
  },
  tagsCard: {
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  highlightTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  highlightTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  highlightTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  specialtiesCard: {
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  specialtyItem: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  specialtyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  specialtyEmoji: {
    fontSize: 20,
  },
  specialtyLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  specialtyExample: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    marginLeft: 28,
  },
  specialtyStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 28,
    marginTop: 4,
  },
  specialtyStat: {
    fontSize: 12,
  },
  specialtyConfidence: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewCountContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  reviewCount: {
    fontSize: 12,
  },
});
