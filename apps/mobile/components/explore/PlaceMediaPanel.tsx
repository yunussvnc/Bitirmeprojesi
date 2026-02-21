/**
 * PlaceMediaPanel – Haritada mekan seçildiğinde gösterilen panel.
 * Instagram tarzı: Hero cover, gradient story ring'ler, featured strip, zengin grid.
 */

import React, { useEffect, useState } from 'react';
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
  type ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getPlacePosts, type Post } from '@/src/services/feedService';
import { getPlaceStories, type Story } from '@/src/services/storyService';
import { lightImpact } from '@/src/utils/haptics';
import type { Place } from '@/src/services/mekanService';
import { getPlaceImageSource } from '@/src/utils/placeImages';
import { StoryViewerModal } from './StoryViewerModal';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { useAppStore } from '@/src/store/useAppStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HORIZ_MARGIN = 12;
const PANEL_CONTENT_WIDTH = SCREEN_WIDTH - PANEL_HORIZ_MARGIN * 2;
const GRID_COLS = 3;
const GAP = 2;
const PADDING = 16;
const CELL_SIZE = (PANEL_CONTENT_WIDTH - PADDING * 2 - (GRID_COLS - 1) * GAP) / GRID_COLS;
const PANEL_MAX_HEIGHT = Math.min(SCREEN_HEIGHT * 0.62, 520);
const HERO_HEIGHT = 140;
const STRIP_ITEM_SIZE = 88;
const STORY_RING_SIZE = 64;

// Instagram story ring gradient
const STORY_GRADIENT: [string, string, ...string[]] = ['#4ade80', '#22c55e', '#16a34a', '#15803d'];

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
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [showHeroImage, setShowHeroImage] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');

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
  const reelPosts = posts.filter((p) => p.post_type === 'reel');
  const featuredItems = mediaItems.slice(0, 8);
  const gridItems = activeTab === 'posts' ? collectMediaItems(photoPosts) : collectMediaItems(reelPosts);
  const heroImage: ImageSourcePropType =
    place.photo_url
      ? { uri: place.photo_url }
      : featuredItems[0]?.url
        ? { uri: featuredItems[0].url }
        : stories[0]?.media_url
          ? { uri: stories[0].media_type === 'video' ? (stories[0].thumbnail_url || stories[0].media_url) : stories[0].media_url }
          : getPlaceImageSource(place);

  const goToPlaceDetail = () => {
    lightImpact();
    router.push({ pathname: '/place/[id]', params: { id: String(place.id) } } as any);
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

  const hasContent = (mapShowStories && stories.length > 0) || (mapShowPosts && mediaItems.length > 0);
  const isEmpty = !loading && !hasContent;
  const showPreferencesHint = !mapShowStories && !mapShowPosts;

  return (
    <View style={[styles.panel, { backgroundColor: colors.background.primary }]}>
      {/* Hero Cover */}
      <TouchableOpacity
        style={styles.heroWrap}
        onPress={() => {
          lightImpact();
          setShowHeroImage(true);
        }}
        activeOpacity={1}
      >
        <Image
          source={heroImage}
          style={styles.heroImage}
          contentFit="cover"
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
            <Text style={[styles.heroMeta, { color: 'rgba(255,255,255,0.85)' }]}>
              {[
                mapShowPosts && `${total} gönderi`,
                mapShowStories && stories.length > 0 && `${stories.length} hikaye`,
              ]
                .filter(Boolean)
                .join(' · ') || (place.category ?? '')}
            </Text>
          </View>
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
      </TouchableOpacity>

      {/* Story Rings - Instagram gradient */}
      {mapShowStories && !loading && stories.length > 0 && (
        <View style={styles.storiesSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesRow}
          >
            {stories.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.storyRingWrap}
                onPress={() => {
                  lightImpact();
                  setShowStoryViewer(true);
                }}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={STORY_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.storyGradientRing}
                >
                  <View style={[styles.storyRingInner, { backgroundColor: colors.background.primary }]}>
                    <Image
                      source={{ uri: s.media_type === 'video' ? (s.thumbnail_url || s.media_url) : s.media_url }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                    {s.media_type === 'video' && (
                      <View style={styles.storyVideoIcon}>
                        <IconSymbol name="play.fill" size={10} color="#fff" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Featured Strip - Yatay post önizlemeleri */}
      {mapShowPosts && !loading && featuredItems.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredStrip}
        >
          {featuredItems.slice(0, 6).map((item, idx) => (
            <TouchableOpacity
              key={`${item.postId}-${idx}`}
              style={[styles.featuredItem, { width: STRIP_ITEM_SIZE, height: STRIP_ITEM_SIZE }]}
              onPress={() => {
                lightImpact();
                setSelectedMedia({ url: item.url, isVideo: item.isVideo });
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
                <View style={styles.videoBadgeSmall}>
                  <IconSymbol name="play.fill" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: colors.surface.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'posts' && { borderBottomColor: colors.text.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => {
            lightImpact();
            setActiveTab('posts');
          }}
        >
          <IconSymbol
            name="square.grid.2x2.fill"
            size={18}
            color={activeTab === 'posts' ? colors.accent.primary : colors.text.tertiary}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'posts' ? colors.accent.primary : colors.text.secondary },
            ]}
          >
            Gönderiler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'reels' && { borderBottomColor: colors.text.primary, borderBottomWidth: 2 },
          ]}
          onPress={() => {
            lightImpact();
            setActiveTab('reels');
          }}
        >
          <IconSymbol
            name="play.circle.fill"
            size={18}
            color={activeTab === 'reels' ? colors.accent.primary : colors.text.tertiary}
          />
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'reels' ? colors.accent.primary : colors.text.secondary },
            ]}
          >
            Reels
          </Text>
        </TouchableOpacity>
      </View>

      {/* Grid */}
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
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
            <View style={styles.emptyButtons}>
              <TouchableOpacity
                onPress={handleDirections}
                style={[styles.emptyBtn, { backgroundColor: colors.accent.primary }]}
                activeOpacity={0.8}
              >
                <IconSymbol name="map.fill" size={18} color={colors.accent.onPrimary} />
                <Text style={[styles.emptyBtnText, { color: colors.accent.onPrimary }]}>Yol tarifi al</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToPlaceDetail}
                style={[styles.emptyBtn, { backgroundColor: colors.surface.hover }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyBtnText, { color: colors.text.primary }]}>Detayları gör</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (activeTab === 'posts' ? photoPosts : reelPosts).length > 0 ? (
          <View style={styles.grid}>
            {gridItems.slice(0, 12).map((item, idx) => (
              <TouchableOpacity
                key={`${item.postId}-${idx}`}
                style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
                onPress={() => {
                  lightImpact();
                  setSelectedMedia({ url: item.url, isVideo: item.isVideo });
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
              {activeTab === 'reels' ? 'Bu mekanda henüz Reels yok' : 'Henüz gönderi yok'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer - Instagram tarzı aksiyonlar */}
      <View style={[styles.footer, { borderTopColor: colors.surface.border }]}>
        <TouchableOpacity
          style={styles.footerAction}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <IconSymbol
            name={saved ? 'bookmark.fill' : 'bookmark'}
            size={22}
            color={saved ? colors.accent.primary : colors.text.secondary}
          />
          <Text style={[styles.footerActionLabel, { color: colors.text.secondary }]}>Kaydet</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerBtnPrimary, { backgroundColor: colors.surface.hover }]}
          onPress={handleDirections}
          activeOpacity={0.8}
        >
          <IconSymbol name="map.fill" size={20} color={colors.accent.primary} />
          <Text style={[styles.footerBtnText, { color: colors.accent.primary }]}>Yol tarifi al</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.footerDetailBtn, { flex: 1 }]}
          onPress={goToPlaceDetail}
          activeOpacity={0.8}
        >
          <Text style={[styles.detailBtnText, { color: colors.accent.primary }]}>Detayları gör</Text>
          <IconSymbol name="chevron.right" size={18} color={colors.accent.primary} />
        </TouchableOpacity>
      </View>

      {showStoryViewer && stories.length > 0 && (
        <StoryViewerModal stories={stories} onClose={() => setShowStoryViewer(false)} />
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

      {selectedMedia && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedMedia(null)}
          statusBarTranslucent
        >
          <Pressable
            style={styles.heroImageModalOverlay}
            onPress={() => setSelectedMedia(null)}
          >
            <Pressable
              style={styles.heroImageModalClose}
              onPress={() => {
                lightImpact();
                setSelectedMedia(null);
              }}
            >
              <IconSymbol name="xmark" size={22} color="#fff" />
            </Pressable>
            {selectedMedia.isVideo ? (
              <Video
                source={{ uri: selectedMedia.url }}
                style={styles.heroImageModalImage}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                useNativeControls
              />
            ) : (
              <Image
                source={{ uri: selectedMedia.url }}
                style={styles.heroImageModalImage}
                contentFit="contain"
              />
            )}
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: Platform.OS === 'ios' ? 96 : 80,
    borderRadius: 20,
    maxHeight: PANEL_MAX_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
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
  featuredStrip: {
    paddingHorizontal: PADDING,
    paddingBottom: 12,
    gap: 10,
  },
  featuredItem: {
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 8,
  },
  videoBadgeSmall: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: PADDING,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  gridScroll: {
    maxHeight: 200,
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
