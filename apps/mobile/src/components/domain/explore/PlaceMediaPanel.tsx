/**
 * PlaceMediaPanel – Haritada mekan seçildiğinde gösterilen panel.
 * Instagram tarzı: Hero cover, gradient story ring'ler, featured strip, zengin grid.
 */

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
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
import { lightImpact } from '@/src/utils/haptics';
import { handleApiError } from '@/src/utils/errorHandler';
import type { Place } from '@/src/services/mekanService';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { StoryViewerModal } from './StoryViewerModal';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { useAppStore } from '@/src/store/useAppStore';
import { FeedCard, CommentBottomSheet, SharePostSheet } from '@/src/components/domain/feed';
import { getPlaceStatus } from '@/src/utils/placeStatus';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HORIZ_MARGIN = 12;
const PANEL_CONTENT_WIDTH = SCREEN_WIDTH - PANEL_HORIZ_MARGIN * 2;
const GRID_COLS = 3;
const GAP = 2;
const PADDING = 16;
const CELL_SIZE = (PANEL_CONTENT_WIDTH - PADDING * 2 - (GRID_COLS - 1) * GAP) / GRID_COLS;
const PANEL_COLLAPSED = Math.min(SCREEN_HEIGHT * 0.62, 520);
const PANEL_EXPANDED = SCREEN_HEIGHT * 0.72;
const HERO_HEIGHT = 140;
const STRIP_ITEM_SIZE = 88;
const STORY_RING_SIZE = 64;
const PLACE_STORY_SIZE = 82;

// Instagram story ring gradient
const STORY_GRADIENT: [string, string, ...string[]] = ['#4ade80', '#22c55e', '#16a34a', '#15803d'];

const MOCK_PLACE_STORIES: Story[] = [
  {
    id: 9001, user_id: 1, media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop',
    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    author: { id: 1, username: 'ahmet_k', first_name: 'Ahmet', avatar_url: 'https://i.pravatar.cc/100?img=11' },
    is_close_friends: false,
  },
  {
    id: 9002, user_id: 2, media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop',
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    author: { id: 2, username: 'elif_d', first_name: 'Elif', avatar_url: 'https://i.pravatar.cc/100?img=5' },
    is_close_friends: false,
  },
  {
    id: 9003, user_id: 3, media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400&h=400&fit=crop',
    created_at: new Date(Date.now() - 7 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    author: { id: 3, username: 'can_yilmaz', first_name: 'Can', avatar_url: 'https://i.pravatar.cc/100?img=12' },
    is_close_friends: false,
  },
  {
    id: 9004, user_id: 4, media_type: 'video',
    media_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=400&fit=crop',
    thumbnail_url: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=400&h=400&fit=crop',
    created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    author: { id: 4, username: 'zeynep_a', first_name: 'Zeynep', avatar_url: 'https://i.pravatar.cc/100?img=9' },
    is_close_friends: false,
  },
  {
    id: 9005, user_id: 5, media_type: 'image',
    media_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    author: { id: 5, username: 'mehmet_b', first_name: 'Mehmet', avatar_url: 'https://i.pravatar.cc/100?img=33' },
    is_close_friends: false,
  },
];

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
    if (stories.length > 0) return stories;
    const realAuthors = posts
      .filter((p) => p.author && p.user_id)
      .map((p) => ({ user_id: p.user_id, author: p.author! }));
    return MOCK_PLACE_STORIES.map((s, i) => {
      const real = realAuthors[i % realAuthors.length];
      return {
        ...s,
        place_id: Number(place.id),
        place: { id: Number(place.id), name: place.name || '', category: place.category || '' },
        ...(real ? { user_id: real.user_id, author: real.author } : {}),
      };
    });
  }, [stories, posts, place.id, place.name, place.category]);
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
    router.push({ pathname: '/place/[id]', params: { id: String(place.id) } } as any);
    setTimeout(() => { navigatingRef.current = false; }, 1000);
  };

  const handleDirections = () => {
    if (place?.latitude != null && place?.longitude != null) {
      lightImpact();
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

  const handleSave = () => {
    lightImpact();
    toggleSaved({
      id: String(place.id),
      name: place.name || '',
      subtitle: place.subtitle,
      photo_url: place.photo_url,
      category: place.category,
      tags: place.tags,
    });
  };

  const handleLike = useCallback(async (post: Post) => {
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

  const hasContent = (mapShowStories && stories.length > 0) || (mapShowPosts && mediaItems.length > 0);
  const isEmpty = !loading && !hasContent;
  const showPreferencesHint = !mapShowStories && !mapShowPosts;

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
            <Image
              source={heroImage}
              style={styles.heroImage}
              contentFit="contain"
              cachePolicy="memory-disk"
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
                    mapShowPosts && `${total} gönderi`,
                    mapShowStories && stories.length > 0 && `${stories.length} hikaye`,
                  ]
                    .filter(Boolean)
                    .join(' · ') || (place.category ?? '')}
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
        {!loading && (
          <View style={styles.placeStoriesSection}>
            <View style={[styles.sectionHeader, { borderBottomColor: colors.surface.border }]}>
              <IconSymbol name="camera.fill" size={18} color={colors.text.secondary} />
              <Text style={[styles.sectionHeaderLabel, { color: colors.text.secondary }]}>Hikayeler</Text>
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
                      viewerStoriesRef.current = sortedStories.slice(idx);
                      setStoryViewerIndex(0);
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
                      {story.author?.first_name || 'Kullanıcı'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Gönderiler başlığı */}
        <View style={[styles.sectionHeader, { borderBottomColor: colors.surface.border }]}>
          <IconSymbol name="square.grid.2x2.fill" size={18} color={colors.text.secondary} />
          <Text style={[styles.sectionHeaderLabel, { color: colors.text.secondary }]}>Gönderiler</Text>
        </View>

        {/* Grid */}
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
          ) : showPreferencesHint ? (
            <View style={styles.emptyWrap}>
              <IconSymbol name="photo.on.rectangle.angled" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                İçerik tercihlerinden gönderi veya hikaye gösterimini aç
              </Text>
            </View>
          ) : isEmpty ? (
            <View style={styles.emptyWrap}>
              <IconSymbol name="photo.on.rectangle.angled" size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                Bu mekanda henüz paylaşım yok
              </Text>
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
              <Text style={[styles.emptyText, { color: colors.text.tertiary }]}>
                Henüz gönderi yok
              </Text>
            </View>
          )}
        </ScrollView>

        {storyViewerIndex !== null && (
          <StoryViewerModal
            stories={viewerStoriesRef.current}
            initialIndex={storyViewerIndex}
            visible={storyVisible}
            onClose={() => { setStoryViewerIndex(null); setStoryVisible(true); }}
            onStoryViewed={(id) => setViewedStoryIds((prev) => new Set(prev).add(id))}
            onPlaceNavigate={handleStoryNavigateRequest}
            onAuthorNavigate={posts.length > 0 ? handleStoryNavigateRequest : undefined}
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

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 96 : 80,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  dragHandleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 12,
    zIndex: 30,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    opacity: 0.45,
  },
  heroWrap: {
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING,
    paddingTop: 12,
    paddingBottom: 16,
  },
  heroText: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: '100%',
  },
  heroPlaceName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroMeta: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  heroSaveBtn: {
    padding: 4,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesSection: {
    paddingTop: 12,
  },
  storiesRow: {
    paddingHorizontal: PADDING,
    paddingBottom: 12,
    gap: 14,
  },
  storyRingWrap: {
    marginRight: 10,
  },
  storyGradientRing: {
    width: STORY_RING_SIZE + 4,
    height: STORY_RING_SIZE + 4,
    borderRadius: (STORY_RING_SIZE + 4) / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyRingInner: {
    width: STORY_RING_SIZE - 4,
    height: STORY_RING_SIZE - 4,
    borderRadius: (STORY_RING_SIZE - 4) / 2,
    overflow: 'hidden',
  },
  storyVideoIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeStoriesSection: {
    marginTop: 8,
    paddingBottom: 8,
  },

  placeStoriesRow: {
    marginTop: 15,
    paddingHorizontal: PADDING,
    gap: 14,
  },
  placeStoryItem: {
    alignItems: 'center',
    width: PLACE_STORY_SIZE,
  },
  placeStoryRing: {
    width: PLACE_STORY_SIZE + 3,
    height: PLACE_STORY_SIZE + 3,
    borderRadius: (PLACE_STORY_SIZE + 3) / 2,
    padding: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeStoryRingSeen: {
    width: PLACE_STORY_SIZE + 3,
    height: PLACE_STORY_SIZE + 3,
    borderRadius: (PLACE_STORY_SIZE + 3) / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeStoryGap: {
    padding: 3,
    borderRadius: PLACE_STORY_SIZE / 2,
  },
  placeStoryInner: {
    width: PLACE_STORY_SIZE - 6,
    height: PLACE_STORY_SIZE - 6,
    borderRadius: (PLACE_STORY_SIZE - 6) / 2,
    overflow: 'hidden',
  },
  placeStoryName: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: PLACE_STORY_SIZE + 20,
  },
  postModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  postModalContent: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  postModalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 20,
  },
  postModalCloseBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: PADDING,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridScroll: {
    flex: 1,
  },
  gridContent: {
    padding: PADDING,
    paddingTop: 12,
  },
  loadingWrap: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  emptyButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
  },
  emptyBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  cell: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: PADDING,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  footerActionLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  footerBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerDetailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
  heroImageModalOverlay: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImageModalClose: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroImageModalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});
