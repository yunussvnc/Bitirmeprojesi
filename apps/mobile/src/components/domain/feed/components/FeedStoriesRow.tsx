/**
 * FeedStoriesRow – Akış ekranında hikaye halkaları
 * İlk halka "Hikaye Ekle", sonrakiler mekan bazlı hikayeler.
 * Görüntülenen hikayeler sona gider, yeşil ring kaybolur.
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useNavigation } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { StoryViewerModal } from "@/src/components/domain/explore/StoryViewerModal";
import { type Story, type FeedStoriesFilter } from "@/src/services/storyService";
import { lightImpact } from "@/src/utils/haptics";
import { spacing } from "@/src/constants/design";
import { useTranslation } from "react-i18next";
import { useUploadPipelineStore } from "@/src/store/useUploadPipelineStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useAppStore } from "@/src/store/useAppStore";
import { Avatar } from "@/src/components/ui/Avatar";

const STORY_RING_SIZE = 82;
const STORY_GRADIENT: [string, string, ...string[]] = ["#4ade80", "#22c55e", "#16a34a", "#15803d"];

type StoryGroup = {
  groupKey: string;
  label?: string;
  thumbnailUrl?: string;
  avatarUrl?: string;
  isVideo: boolean;
  storyIds: number[];
};

export interface FeedStoriesRowProps {
  filter: FeedStoriesFilter;
}

export function FeedStoriesRow({ filter }: FeedStoriesRowProps) {
  const { colors } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  
  const viewedGroupKeys = useAppStore((s) => s.viewedStoryGroupKeys);
  const addViewedGroupKey = useAppStore((s) => s.addViewedStoryGroupKey);

  const currentUser = useAuthStore((s) => s.user);
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const viewerStoriesRef = useRef<Story[]>([]);
  const storyPausedRef = useRef(false);
  const [storyVisible, setStoryVisible] = useState(true);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleStoryNavigateRequest = useCallback((route: string, _currentIndex: number) => {
    storyPausedRef.current = true;
    router.push(route as any);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setStoryVisible(false), 400);
  }, []);

  // loadStories'i erken tanımla (useFocusEffect onu kullandığı için önce tanımlanmalı)
  const isStoriesLoadingRef = useRef(false);
  const loadStories = useCallback(async () => {
    if (isStoriesLoadingRef.current) return;
    isStoriesLoadingRef.current = true;
    setLoading(true);
    try {
      const res = await import("@/src/services/storyService").then((m) => m.getFeedStories(1, 50, filter));
      setStories(res.items ?? []);
    } catch (e) {
      console.warn('[FeedStoriesRow] Failed to load stories:', e);
      setStories([]);
    } finally {
      setLoading(false);
      isStoriesLoadingRef.current = false;
    }
  }, [filter]);

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
      // Ekrana her dönüşde hikayeler yenilensin
      loadStories();
    }, [loadStories])
  );

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener("transitionStart", (e: { data?: { closing?: boolean } }) => {
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

  // İlk yükleme useFocusEffect tarafından yapılır — ayrı useEffect gereksiz ve duplicate isteğe neden olur

  // Hikaye yükleme pipeline tamamlanınca otomatik yenile
  useEffect(() => {
    const unsub = useUploadPipelineStore.getState().onUploadDone((contentType) => {
      if (contentType === 'story') {
        setTimeout(() => loadStories(), 1000);
      }
    });
    return unsub;
  }, [loadStories]);

  const getGroupKey = useCallback((s: Story) => {
    const pid = s.place_id ?? s.place?.id;
    if (pid) return `place:${pid}`;
    const authorId = s.author?.id ?? s.user_id;
    if (authorId) return `user:${authorId}`;
    return `story:${s.id}`;
  }, []);

  const storyGroups = useMemo(() => {
    const seen = new Set<string>();
    const groups: StoryGroup[] = [];
    for (const s of stories) {
      const key = getGroupKey(s);
      if (!seen.has(key)) {
        seen.add(key);
        // groupStoryIds backend'den en yeni ilk (desc) geliyor,
        // oynatırken en eski ilk (asc) olması için ters çeviriyoruz.
        const groupStoryIds = stories
          .filter((st) => getGroupKey(st) === key)
          .map((st) => st.id)
          .reverse();
        
        let avatarUrl: string | null | undefined;
        if (s.place) {
          avatarUrl = s.place.thumbnail_url || s.place.hero_image_url;
        } else if (s.author) {
          avatarUrl = s.author.avatar_url;
        } else if (s.user_id === useAuthStore.getState().user?.id) {
          avatarUrl = useAuthStore.getState().user?.avatar_url;
        }

        groups.push({
          groupKey: key,
          label: s.place?.name || s.author?.first_name || s.author?.username,
          thumbnailUrl: s.media_type === "video" ? s.thumbnail_url || s.media_url : s.media_url,
          avatarUrl: avatarUrl || undefined,
          isVideo: s.media_type === "video",
          storyIds: groupStoryIds,
        });
      }
    }
    return groups;
  }, [stories, getGroupKey]);

  const sortedGroups = useMemo(() => {
    const unseen = storyGroups.filter((g) => !viewedGroupKeys.includes(g.groupKey));
    const seen = storyGroups.filter((g) => viewedGroupKeys.includes(g.groupKey));
    return [...unseen, ...seen];
  }, [storyGroups, viewedGroupKeys]);

  const handleGroupTap = useCallback(
    (groupKey: string, tapIndex: number) => {
      lightImpact();
      const groupsFromTap = sortedGroups.slice(tapIndex);
      const groupKeysFromTap = new Set(groupsFromTap.map((g) => g.groupKey));
      const filtered = stories.filter((s) => groupKeysFromTap.has(getGroupKey(s)));
      if (filtered.length > 0) {
        viewerStoriesRef.current = filtered;
        setStoryViewerIndex(0);
      }
    },
    [sortedGroups, stories, getGroupKey]
  );

  const handleStoryViewed = useCallback(
    (storyId: number) => {
      const story = stories.find((s) => s.id === storyId);
      if (story) {
        const key = getGroupKey(story);
        addViewedGroupKey(key);
      }
    },
    [stories, getGroupKey, addViewedGroupKey]
  );

  if (loading && stories.length === 0) {
    return (
      <View style={[styles.wrap, styles.loadingWrap]}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
        <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>{t('feed.loading_stories')}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.wrap, { borderBottomColor: colors.surface.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {/* Hikaye Ekle butonu */}
          <TouchableOpacity style={styles.ringWrap} onPress={() => { lightImpact(); router.push('/create-story' as any); }} activeOpacity={0.8}>
            <View style={[styles.addRing, { borderColor: colors.surface.border, backgroundColor: colors.background.secondary }]}>
              {currentUser?.avatar_url ? (
                <Image source={{ uri: currentUser.avatar_url }} style={styles.ringInner} contentFit="cover" />
              ) : (
                <Avatar name={currentUser?.first_name || currentUser?.username || 'U'} size={STORY_RING_SIZE - 6} />
              )}
              {/* Küçük + ikonu */}
              <View style={[styles.miniAddIcon, { backgroundColor: colors.accent.primary, borderColor: colors.background.primary }]}>
                <IconSymbol name="plus" size={12} color="#fff" />
              </View>
            </View>
            <Text style={[styles.placeLabel, { color: colors.text.secondary }]} numberOfLines={1}>
              {t('feed.add_story', { defaultValue: 'Hikaye Ekle' })}
            </Text>
          </TouchableOpacity>

          {sortedGroups.map((g, idx) => {
            const seen = viewedGroupKeys.includes(g.groupKey);
            return (
              <TouchableOpacity key={g.groupKey} style={styles.ringWrap} onPress={() => handleGroupTap(g.groupKey, idx)} activeOpacity={0.8}>
                {seen ? (
                  <View style={[styles.ringSeen, { borderColor: colors.surface.border }]}>
                    <View style={styles.ringInner}>
                      {g.avatarUrl ? (
                        <Image source={{ uri: g.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      ) : (
                        <Avatar name={g.label || 'U'} size={STORY_RING_SIZE - 6} />
                      )}
                    </View>
                  </View>
                ) : (
                  <LinearGradient colors={STORY_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientRing}>
                    <View style={[styles.ringGap, { backgroundColor: colors.background.primary }]}>
                      <View style={styles.ringInner}>
                        {g.avatarUrl ? (
                          <Image source={{ uri: g.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        ) : (
                          <Avatar name={g.label || 'U'} size={STORY_RING_SIZE - 6} />
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                )}
                <Text style={[styles.placeLabel, { color: seen ? colors.text.tertiary : colors.text.secondary }]} numberOfLines={1}>
                  {g.label ?? t('explore.user')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {storyViewerIndex !== null && (
        <StoryViewerModal
          stories={viewerStoriesRef.current}
          initialIndex={storyViewerIndex}
          visible={storyVisible}
          onClose={() => {
            setStoryViewerIndex(null);
            setStoryVisible(false);
          }}
          onStoryViewed={handleStoryViewed}
          onAuthorNavigate={handleStoryNavigateRequest}
          onPlaceNavigate={handleStoryNavigateRequest}
          currentUserId={currentUser?.id}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  loadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
  },
  row: {
    gap: 12,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  ringWrap: {
    alignItems: "center",
    marginRight: 4,
  },
  gradientRing: {
    width: STORY_RING_SIZE + 3,
    height: STORY_RING_SIZE + 3,
    borderRadius: (STORY_RING_SIZE + 3) / 2,
    padding: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSeen: {
    width: STORY_RING_SIZE + 3,
    height: STORY_RING_SIZE + 3,
    borderRadius: (STORY_RING_SIZE + 3) / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  ringGap: {
    padding: 3,
    borderRadius: STORY_RING_SIZE / 2,
  },
  ringInner: {
    width: STORY_RING_SIZE - 6,
    height: STORY_RING_SIZE - 6,
    borderRadius: (STORY_RING_SIZE - 6) / 2,
    overflow: "hidden",
  },
  videoIcon: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  placeLabel: {
    marginTop: 6,
    fontSize: 11,
    maxWidth: STORY_RING_SIZE + 20,
    textAlign: "center",
  },
  addRing: {
    width: STORY_RING_SIZE + 3,
    height: STORY_RING_SIZE + 3,
    borderRadius: (STORY_RING_SIZE + 3) / 2,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: 'relative',
  },
  miniAddIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
