/**
 * PlaceMediaPanel – Haritada mekan seçildiğinde gösterilen panel.
 * Instagram tarzı: Hero cover, gradient story ring'ler, featured strip, zengin grid.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getTranslatedCategory } from '@/src/utils/categories';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  PanResponder,
  type ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { getPlacePosts, toggleLike, type Post } from '@/src/services/feedService';
import { getPlaceStories, type Story } from '@/src/services/storyService';
import { lightImpact, success } from '@/src/utils/haptics';
import { handleApiError } from '@/src/utils/errorHandler';
import type { Place } from '@/src/services/mekanService';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { StoryViewerModal } from './StoryViewerModal';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { useAppStore } from '@/src/store/useAppStore';
import { useAuthStore } from '@/src/store/useAuthStore';
import { FeedCard, CommentBottomSheet, SharePostSheet } from '@/src/components/domain/feed';
import { getPlaceStatus } from '@/src/utils/placeStatus';
import { useStoreReview } from '@/src/hooks/useStoreReview';
import styles, {
  SCREEN_HEIGHT,
  CELL_SIZE,
  PANEL_COLLAPSED,
  PANEL_EXPANDED,
  STORY_GRADIENT,
} from './PlaceMediaPanel.styles';

/** Tüm post'lardan media URL'lerini topla */
function collectMediaItems(posts: Post[]): { url: string; isVideo: boolean; postId: number }[] {
  const items: { url: string; isVideo: boolean; postId: number }[] = [];
  for (const post of posts) {
    for (const m of post.media) {
      items.push({
        url: m.media_url,
        isVideo: m.media_type === 'video',
        postId: post.id,
      });
    }
  }
  return items;
}

export interface PlaceMediaPanelProps {
  place: Place;
  onClose?: () => void;
}

export function PlaceMediaPanel({ place, onClose }: PlaceMediaPanelProps) {
  const { colors } = useTheme();
  const mapShowStories = useSettingsStore((s) => s.mapShowStories);
  const mapShowPosts = useSettingsStore((s) => s.mapShowPosts);
  const savedIds = useAppStore((s) => s.savedIds);
  const toggleSaved = useAppStore((s) => s.toggleSave);
  const saved = savedIds.includes(String(place.id));
  const currentUser = useAuthStore((s) => s.user);
  const { triggerReviewAction } = useStoreReview();

  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const [viewedStoryIds, setViewedStoryIds] = useState<Set<number>>(new Set());
  const viewerStoriesRef = useRef<Story[]>([]);
  const storyPausedRef = useRef(false);
  const [storyVisible, setStoryVisible] = useState(true);
  const [showHeroImage, setShowHeroImage] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [sharePost, setSharePost] = useState<Post | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleStoryNavigateRequest = useCallback((route: string, _currentIndex: number) => {
    storyPausedRef.current = true;
    router.push(route as any);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setStoryVisible(false), 400);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (storyPausedRef.current) {
        storyPausedRef.current = false;
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setStoryVisible(true);
      }
    }, [])
  );

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('transitionStart', (e: { data?: { closing?: boolean } }) => {
      if (e?.data?.closing && storyPausedRef.current) {
        storyPausedRef.current = false;
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        setStoryVisible(true);
      }
    });
    return unsubscribe;
  }, [navigation]);



  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const placeId = Number(place.id);
    Promise.all([
      getPlacePosts(placeId, 1, 36),
      getPlaceStories(placeId, 1, 24),
    ])
      .then(([postsRes, storiesRes]) => {
        if (!cancelled) {
          setPosts(postsRes.items);
          setTotal(postsRes.total);
          setStories(storiesRes.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([]);
          setStories([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [place.id]);

  const mediaItems = collectMediaItems(posts);
  const photoPosts = posts.filter((p) => p.post_type !== 'reel');
  const gridItems = collectMediaItems(photoPosts);

  const rawStories = useMemo(() => {
    return stories;
  }, [stories]);
  const selectedPost = useMemo(
    () => (selectedPostId ? posts.find((p) => p.id === selectedPostId) || null : null),
    [posts, selectedPostId]
  );
  const sortedStories = useMemo(() => {
    const unseen = rawStories.filter((s) => !viewedStoryIds.has(s.id));
    const seen = rawStories.filter((s) => viewedStoryIds.has(s.id));
    return [...unseen, ...seen];
  }, [rawStories, viewedStoryIds]);
  const heroImage: ImageSourcePropType =
    place.photo_url
      ? { uri: place.photo_url }
      : mediaItems[0]?.url
        ? { uri: mediaItems[0].url }
        : stories[0]?.media_url
          ? { uri: stories[0].media_type === 'video' ? (stories[0].thumbnail_url || stories[0].media_url) : stories[0].media_url }
          : getPlaceImageSource(place);

  const navigatingRef = useRef(false);
  const goToPlaceDetail = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    lightImpact();
    router.push({
      pathname: '/place/[id]',
      params: {
        id: String(place.id),
        name: place.name || '',
        category: place.category || '',
        photo_url: place.photo_url || '',
        subtitle: place.subtitle || '',
        description: place.description || '',
        address: place.address || '',
      }
    } as any);
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleSave = () => {
    success();
    triggerReviewAction(); // Store review tetikleyici
    toggleSaved({
      id: String(place.id),
      name: place.name || '',
      subtitle: place.subtitle,
      photo_url: place.photo_url,
      category: getTranslatedCategory(place.category, t),
      tags: place.tags,
    });
  };

  const pendingLikesRef = useRef<Set<number>>(new Set());

  const handleLike = useCallback(async (post: Post) => {
    if (pendingLikesRef.current.has(post.id)) return;
    pendingLikesRef.current.add(post.id);

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
            ...p,
            is_liked: !p.is_liked,
            like_count: p.like_count + (p.is_liked ? -1 : 1),
          }
          : p
      )
    );
    try {
      const res = await toggleLike(post.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_liked: res.liked, like_count: res.like_count } : p
        )
      );
    } catch (e) {
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, is_liked: post.is_liked, like_count: post.like_count } : p))
      );
      handleApiError(e);
    } finally {
      pendingLikesRef.current.delete(post.id);
    }
  }, []);

  const handleCommentAdded = useCallback((postId: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p))
    );
  }, []);

  const closePostModal = useCallback(() => {
    setSelectedPostId(null);
    setCommentPostId(null);
  }, []);

  const panelHeight = useRef(new Animated.Value(PANEL_COLLAPSED)).current;
  const dismissTranslateY = useRef(new Animated.Value(0)).current;
  const expandedRef = useRef(false);
  const startHeightRef = useRef(PANEL_COLLAPSED);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const panResponder = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx) * 1.5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => { },
      onPanResponderMove: (_, g) => {
        if (!expandedRef.current && g.dy > 0) {
          dismissTranslateY.setValue(g.dy);
        } else {
          dismissTranslateY.setValue(0);
          const newH = startHeightRef.current - g.dy;
          const clamped = Math.max(PANEL_COLLAPSED, Math.min(PANEL_EXPANDED, newH));
          panelHeight.setValue(clamped);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (!expandedRef.current && (g.dy > 100 || g.vy > 0.5)) {
          Animated.timing(dismissTranslateY, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            onCloseRef.current?.();
          });
        } else if (g.dy > 30 || g.vy > 0.3) {
          Animated.spring(dismissTranslateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
          expandedRef.current = false;
          startHeightRef.current = PANEL_COLLAPSED;
          Animated.spring(panelHeight, {
            toValue: PANEL_COLLAPSED,
            useNativeDriver: false,
            friction: 9,
            tension: 60,
          }).start();
        } else {
          Animated.spring(dismissTranslateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
          const currentH = Math.max(PANEL_COLLAPSED, Math.min(PANEL_EXPANDED, startHeightRef.current - g.dy));
          expandedRef.current = currentH > PANEL_COLLAPSED + 20;
          startHeightRef.current = currentH;
        }
      },
    }),
    [panelHeight, dismissTranslateY]);

  return (
    <Animated.View
      style={[styles.panel, { transform: [{ translateY: dismissTranslateY }] }]}
    >
      <Animated.View style={{ height: panelHeight, backgroundColor: colors.background.primary }}>
        {/* Drag Handle + Hero — swipe area */}
        <View {...panResponder.panHandlers}>
          <View style={styles.dragHandleWrap}>
            <View style={[styles.dragHandle, { backgroundColor: colors.text.tertiary }]} />
          </View>
          {/* Hero Cover */}
          <TouchableOpacity
            style={[styles.heroWrap, { backgroundColor: colors.surface.elevated }]}
            onPress={goToPlaceDetail}
            activeOpacity={0.9}
          >
            <Animated.Image
              source={heroImage as any}
              style={styles.heroImage}
              resizeMode="cover"
              // @ts-ignore
              sharedTransitionTag={`place-image-${place.id}`}
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={StyleSheet.absoluteFill}
              locations={[0.3, 1]}
            />
            <View style={styles.heroContent}>
              <View style={styles.heroText}>
                <Text style={styles.heroPlaceName} numberOfLines={2}>
                  {place.name}
                </Text>
                {(() => {
                  const status = getPlaceStatus(place.opening_time, place.closing_time);
                  return status.hoursText ? (
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                        <Text style={styles.statusBadgeText}>{status.label}</Text>
                      </View>
                      <Text style={[styles.heroMeta, { color: 'rgba(255,255,255,0.85)' }]}>
                        {status.hoursText}
                      </Text>
                    </View>
                  ) : null;
                })()}
                <Text style={[styles.heroMeta, { color: 'rgba(255,255,255,0.85)' }]}>
                  {[
                    mapShowPosts && t('explore.post_count', { count: total }),
                    mapShowStories && stories.length > 0 && t('explore.story_count', { count: stories.length }),
                  ]
                    .filter(Boolean)
                    .join(' · ') || (getTranslatedCategory(place.category, t) ?? '')}
                </Text>
              </View>
              <View style={styles.heroActions}>
                <TouchableOpacity
                  onPress={handleSave}
                  hitSlop={12}
                  style={styles.heroSaveBtn}
                  activeOpacity={0.8}
                >
                  <View style={[styles.closeBtnBg, { backgroundColor: saved ? colors.accent.primary : 'rgba(0,0,0,0.4)' }]}>
                    <IconSymbol name={saved ? 'heart.fill' : 'heart'} size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
                {onClose && (
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={12}
                    style={styles.closeBtn}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.closeBtnBg, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
                      <IconSymbol name="xmark" size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Mekan Hikayeleri */}
        {!loading && mapShowStories && (
          <View style={styles.placeStoriesSection}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.surface.border }]}>
              <IconSymbol name="camera.fill" size={18} color={colors.text.secondary} />
              <Text style={[styles.sectionHeaderLabel, { color: colors.text.secondary }]}>{t('explore.place_stories')}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.placeStoriesRow}
            >
              {sortedStories.map((story, idx) => {
                const seen = viewedStoryIds.has(story.id);
                return (
                  <TouchableOpacity
                    key={story.id}
                    style={styles.placeStoryItem}
                    onPress={() => {
                      lightImpact();
                      // Sort chronologically (oldest first)
                      viewerStoriesRef.current = sortedStories
                        .slice(0, idx + 1)
                        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                      setStoryViewerIndex(viewerStoriesRef.current.length - 1);
                    }}
                    activeOpacity={0.85}
                  >
                    {seen ? (
                      <View style={[styles.placeStoryRingSeen, { borderColor: colors.surface.border }]}>
                        <View style={styles.placeStoryInner}>
                          <Image
                            source={{ uri: story.media_type === 'video' ? (story.thumbnail_url || story.media_url) : story.media_url }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                          />
                          {story.media_type === 'video' && (
                            <View style={styles.storyVideoIcon}>
                              <IconSymbol name="play.fill" size={10} color="#fff" />
                            </View>
                          )}
                        </View>
                      </View>
                    ) : (
                      <LinearGradient
                        colors={STORY_GRADIENT}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.placeStoryRing}
                      >
                        <View style={[styles.placeStoryGap, { backgroundColor: colors.background.primary }]}>
                          <View style={styles.placeStoryInner}>
                            <Image
                              source={{ uri: story.media_type === 'video' ? (story.thumbnail_url || story.media_url) : story.media_url }}
                              style={StyleSheet.absoluteFill}
                              contentFit="cover"
                            />
                            {story.media_type === 'video' && (
                              <View style={styles.storyVideoIcon}>
                                <IconSymbol name="play.fill" size={10} color="#fff" />
                              </View>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    )}
                    <Text style={[styles.placeStoryName, { color: seen ? colors.text.tertiary : colors.text.secondary }]} numberOfLines={1}>
                      {story.author?.first_name || t('explore.user')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Gönderiler */}
        {mapShowPosts && (
          <>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.surface.border }]}>
              <IconSymbol name="square.grid.2x2.fill" size={18} color={colors.text.secondary} />
              <Text style={[styles.sectionHeaderLabel, { color: colors.text.secondary }]}>{t('explore.place_posts')}</Text>
            </View>

            <ScrollView
              style={styles.gridScroll}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator size="small" color={colors.accent.primary} />
                </View>
              ) : photoPosts.length > 0 ? (
                <View style={styles.grid}>
                  {gridItems.slice(0, 12).map((item, idx) => (
                    <TouchableOpacity
                      key={`${item.postId}-${idx}`}
                      style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                      onPress={() => {
                        lightImpact();
                        const post = posts.find((p) => p.id === item.postId);
                        if (post) setSelectedPostId(post.id);
                      }}
                      activeOpacity={0.9}
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                      {item.isVideo && (
                        <View style={styles.videoBadge}>
                          <IconSymbol name="play.fill" size={14} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyWrap}>
                  <IconSymbol name="photo.on.rectangle.angled" size={48} color={colors.text.tertiary} />
                  <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                    {t('explore.no_posts_here')}
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}

        {storyViewerIndex !== null && (
          <StoryViewerModal
            stories={viewerStoriesRef.current}
            initialIndex={storyViewerIndex}
            visible={storyVisible}
            onClose={() => { setStoryViewerIndex(null); setStoryVisible(false); }}
            onStoryViewed={(id) => setViewedStoryIds((prev) => new Set(prev).add(id))}
            onPlaceNavigate={handleStoryNavigateRequest}
            onAuthorNavigate={posts.length > 0 ? handleStoryNavigateRequest : undefined}
            currentUserId={currentUser?.id}
          />
        )}

        {showHeroImage && (() => {
          const uri = typeof heroImage === 'object' && heroImage !== null && 'uri' in heroImage
            ? (heroImage as { uri: string }).uri
            : null;
          if (!uri) return null;
          return (
            <Modal
              visible
              transparent
              animationType="fade"
              onRequestClose={() => setShowHeroImage(false)}
              statusBarTranslucent
            >
              <Pressable
                style={styles.heroImageModalOverlay}
                onPress={() => setShowHeroImage(false)}
              >
                <Pressable
                  style={styles.heroImageModalClose}
                  onPress={() => {
                    lightImpact();
                    setShowHeroImage(false);
                  }}
                >
                  <IconSymbol name="xmark" size={22} color="#fff" />
                </Pressable>
                <Image
                  source={{ uri }}
                  style={styles.heroImageModalImage}
                  contentFit="contain"
                />
              </Pressable>
            </Modal>
          );
        })()}

        {selectedPost && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={closePostModal}
            statusBarTranslucent
          >
            <Pressable
              style={[styles.postModalOverlay, { backgroundColor: colors.overlay.dark }]}
              onPress={closePostModal}
            >
              <Pressable
                style={[styles.postModalContent, { backgroundColor: colors.background.primary }]}
                onPress={(e) => e.stopPropagation()}
              >
                <TouchableOpacity
                  style={styles.postModalClose}
                  onPress={() => {
                    lightImpact();
                    closePostModal();
                  }}
                  activeOpacity={0.8}
                  hitSlop={8}
                >
                  <View style={[styles.postModalCloseBg, { backgroundColor: colors.background.secondary }]}>
                    <IconSymbol name="xmark" size={16} color={colors.text.primary} />
                  </View>
                </TouchableOpacity>
                <FeedCard
                  post={selectedPost}
                  onAuthorPress={() => router.push(`/user/${selectedPost.user_id}` as any)}
                  onPlacePress={() => selectedPost.place_id && router.push(`/place/${selectedPost.place_id}` as any)}
                  onLike={() => handleLike(selectedPost)}
                  onComment={() => setCommentPostId(selectedPost.id)}
                  onShare={() => setSharePost(selectedPost)}
                />
              </Pressable>
              <CommentBottomSheet
                visible={commentPostId != null}
                postId={commentPostId ?? 0}
                onClose={() => setCommentPostId(null)}
                onCommentAdded={() => commentPostId != null ? handleCommentAdded(commentPostId) : undefined}
              />
            </Pressable>
          </Modal>
        )}

        <SharePostSheet
          visible={!!sharePost}
          onClose={() => setSharePost(null)}
          post={sharePost}
        />
      </Animated.View>
    </Animated.View>
  );
}
