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

const STORY_RING_SIZE = 82;
const STORY_GRADIENT: [string, string, ...string[]] = ["#4ade80", "#22c55e", "#16a34a", "#15803d"];

type StoryGroup = {
  groupKey: string;
  label?: string;
  thumbnailUrl: string;
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
  const [viewedGroupIds, setViewedGroupIds] = useState<Set<string>>(new Set());
  const [storyViewerIndex, setStoryViewerIndex] = useState<number | null>(null);
  const viewerStoriesRef = useRef<Story[]>([]);
  const storyPausedRef = useRef(false);
  const [storyVisible, setStoryVisible] = useState(true);
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

  const loadStories = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    setStories([
      {
        id: 1,
        user_id: 1,
        place_id: 101,
        place: { id: 101, name: "Cafe Luna", category: "Cafe" },
        author: { id: 1, username: "ahmet_k", first_name: "Ahmet", avatar_url: "https://i.pravatar.cc/100?img=11" },
        media_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
      {
        id: 2,
        user_id: 2,
        place_id: 102,
        place: { id: 102, name: "Sunset Beach", category: "Beach" },
        author: { id: 2, username: "elif_d", first_name: "Elif", avatar_url: "https://i.pravatar.cc/100?img=5" },
        media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 5 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
      {
        id: 3,
        user_id: 3,
        place_id: 103,
        place: { id: 103, name: "Mountain View", category: "Nature" },
        author: { id: 3, username: "can_y", first_name: "Can", avatar_url: "https://i.pravatar.cc/100?img=12" },
        media_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
      {
        id: 4,
        user_id: 4,
        place_id: 104,
        place: { id: 104, name: "City Lights", category: "Restaurant" },
        author: { id: 4, username: "zeynep_a", first_name: "Zeynep", avatar_url: "https://i.pravatar.cc/100?img=9" },
        media_url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 8 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
      {
        id: 5,
        user_id: 5,
        place_id: 105,
        place: { id: 105, name: "Art Gallery", category: "Culture" },
        author: { id: 5, username: "mehmet_b", first_name: "Mehmet", avatar_url: "https://i.pravatar.cc/100?img=33" },
        media_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 12 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
      {
        id: 6,
        user_id: 6,
        place_id: 106,
        place: { id: 106, name: "Park Central", category: "Park" },
        author: { id: 6, username: "selin_k", first_name: "Selin", avatar_url: "https://i.pravatar.cc/100?img=23" },
        media_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 3 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
      {
        id: 7,
        user_id: 7,
        place_id: 107,
        place: { id: 107, name: "Rooftop Bar", category: "Bar" },
        author: { id: 7, username: "burak_t", first_name: "Burak", avatar_url: "https://i.pravatar.cc/100?img=15" },
        media_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
        media_type: "image",
        created_at: new Date(now.getTime() - 6 * 3600000).toISOString(),
        expires_at: expiresAt,
        is_close_friends: false,
      },
    ]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadStories();
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
        const groupStoryIds = stories.filter((st) => getGroupKey(st) === key).map((st) => st.id);
        groups.push({
          groupKey: key,
          label: s.place?.name || s.author?.first_name || s.author?.username,
          thumbnailUrl: s.media_type === "video" ? s.thumbnail_url || s.media_url : s.media_url,
          isVideo: s.media_type === "video",
          storyIds: groupStoryIds,
        });
      }
    }
    return groups;
  }, [stories, getGroupKey]);

  const sortedGroups = useMemo(() => {
    const unseen = storyGroups.filter((g) => !viewedGroupIds.has(g.groupKey));
    const seen = storyGroups.filter((g) => viewedGroupIds.has(g.groupKey));
    return [...unseen, ...seen];
  }, [storyGroups, viewedGroupIds]);

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
        setViewedGroupIds((prev) => new Set(prev).add(key));
      }
    },
    [stories, getGroupKey]
  );

  if (loading && stories.length === 0) {
    return (
      <View style={[styles.wrap, styles.loadingWrap]}>
        <ActivityIndicator size="small" color={colors.accent.primary} />
        <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>Hikayeler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.wrap, { borderBottomColor: colors.surface.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {sortedGroups.map((g, idx) => {
            const seen = viewedGroupIds.has(g.groupKey);
            return (
              <TouchableOpacity key={g.groupKey} style={styles.ringWrap} onPress={() => handleGroupTap(g.groupKey, idx)} activeOpacity={0.8}>
                {seen ? (
                  <View style={[styles.ringSeen, { borderColor: colors.surface.border }]}>
                    <View style={styles.ringInner}>
                      <Image source={{ uri: g.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      {g.isVideo && (
                        <View style={styles.videoIcon}>
                          <IconSymbol name="play.fill" size={10} color="#fff" />
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <LinearGradient colors={STORY_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientRing}>
                    <View style={[styles.ringGap, { backgroundColor: colors.background.primary }]}>
                      <View style={styles.ringInner}>
                        <Image source={{ uri: g.thumbnailUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                        {g.isVideo && (
                          <View style={styles.videoIcon}>
                            <IconSymbol name="play.fill" size={10} color="#fff" />
                          </View>
                        )}
                      </View>
                    </View>
                  </LinearGradient>
                )}
                <Text style={[styles.placeLabel, { color: seen ? colors.text.tertiary : colors.text.secondary }]} numberOfLines={1}>
                  {g.label ?? "Kullanıcı"}
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
            setStoryVisible(true);
          }}
          onStoryViewed={handleStoryViewed}
          onAuthorNavigate={handleStoryNavigateRequest}
          onPlaceNavigate={handleStoryNavigateRequest}
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
  loadingOverlay: {
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
});
