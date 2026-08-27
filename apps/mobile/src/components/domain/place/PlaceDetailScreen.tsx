/**
 * Place Detail Screen
 *
 * Immersive place detail experience inspired by TrendyolGo/Yemeksepeti.
 * Premium dark-first design with rich information architecture.
 */

import { getTranslatedCategory } from '@/src/utils/categories';
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
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
import { lightImpact, success } from "@/src/utils/haptics";
import { PlaceDetailOverlays, type ReviewGalleryData } from './place-detail/PlaceDetailOverlays';
import { styles } from './place-detail/styles';
import { usePlaceDetail } from './place-detail/usePlaceDetail';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PlaceDetailScreen({
  providedId,
  isVenueDashboard = false
}: {
  providedId?: string,
  isVenueDashboard?: boolean
} = {}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const settings = useSettingsStore();
  const currentUser = useAuthStore((s) => s.user);

  const {
    id,
    place,
    showHeroImage,
    setShowHeroImage,
    reviews,
    reviewsLoading,
    reviewsError,
    hasMoreReviews,
    reviewsLoadingMore,
    onLoadMoreReviews,
    averageRating,
    similarPlaces,

    showReviews,
    setShowReviews,
    reviewSheetHeight,
    reviewPanHandlers,
    reviewScrollOffsetRef,

    showMenu,
    setShowMenu,
    menuSheetHeight,
    menuPanHandlers,

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
  } = usePlaceDetail({ providedId });

  const savedIds = useAppStore((s) => s.savedIds);
  const toggleSaved = useAppStore((s) => s.toggleSave);
  const saved = savedIds.includes(id);
  const [reviewGalleryData, setReviewGalleryData] = useState<ReviewGalleryData | null>(null);

  const screenRef = useRef<ScreenRef>(null);
  useScrollToTop(screenRef as any);

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
                <View style={[styles.reviewIconContainer, { backgroundColor: "transparent" }] }>
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
        reviewPanHandlers={reviewPanHandlers}
        reviewScrollOffsetRef={reviewScrollOffsetRef}
        reviews={reviews}
        reviewsLoading={reviewsLoading}
        reviewsError={reviewsError}
        averageRating={averageRating}
        hasMoreReviews={hasMoreReviews}
        reviewsLoadingMore={reviewsLoadingMore}
        onLoadMoreReviews={onLoadMoreReviews}
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
        menuPanHandlers={menuPanHandlers}
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
