/**
 * FeedStoriesRow – Akış ekranında hikaye halkaları
 * İlk halka "Hikaye Ekle", sonrakiler mekan bazlı hikayeler.
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { StoryViewerModal } from "@/components/explore/StoryViewerModal";
import {
  getFeedStories,
  getPlaceStories,
  type Story,
  type FeedStoriesFilter,
} from "@/src/services/storyService";
import { lightImpact } from "@/src/utils/haptics";
import { spacing } from "@/constants/design";

const STORY_RING_SIZE = 56;
const STORY_GRADIENT: [string, string, ...string[]] = ["#4ade80", "#22c55e", "#16a34a", "#15803d"];

type PlaceStoryGroup = {
  placeId: number;
  placeName?: string;
  thumbnailUrl: string;
  isVideo: boolean;
};

export interface FeedStoriesRowProps {
  filter: FeedStoriesFilter;
}

export function FeedStoriesRow({ filter }: FeedStoriesRowProps) {
  const { colors } = useTheme();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<number | null>(null);
  const [placeStories, setPlaceStories] = useState<Story[]>([]);
  const [loadingViewer, setLoadingViewer] = useState(false);

  const loadStories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFeedStories(1, 50, filter);
      setStories(res.items);
    } catch {
      setStories([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  /** Tıklanan mekan + sonraki 4 mekanın hikayelerini yükle, sırayla birleştir */
  const handlePlaceTap = useCallback(async (placeId: number, tapIndex: number) => {
    lightImpact();
    setLoadingViewer(true);
    try {
      const toFetch = placeGroups
        .slice(tapIndex, tapIndex + 5)
        .map((g) => g.placeId);
      const results = await Promise.all(
        toFetch.map((id) => getPlaceStories(id, 1, 50))
      );
      const combined = results.flatMap((r) => r.items);
      if (combined.length > 0) {
        setPlaceStories(combined);
        setSelectedPlaceId(placeId);
      }
    } catch {
      // ignore
    } finally {
      setLoadingViewer(false);
    }
  }, [placeGroups]);

  const handleCreateStory = useCallback(() => {
    lightImpact();
    router.push("/create-story" as any);
  }, []);

  // Mekan bazlı grupla – her mekan için en son hikayenin önizlemesi
  const placeGroups = React.useMemo(() => {
    const seen = new Set<number>();
    const groups: PlaceStoryGroup[] = [];
    for (const s of stories) {
      const pid = s.place_id ?? s.place?.id;
      if (pid && !seen.has(pid)) {
        seen.add(pid);
        groups.push({
          placeId: pid,
          placeName: s.place?.name,
          thumbnailUrl: s.media_type === "video" ? (s.thumbnail_url || s.media_url) : s.media_url,
          isVideo: s.media_type === "video",
        });
      }
    }
    return groups;
  }, [stories]);

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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {/* Hikaye Ekle */}
          <TouchableOpacity
            style={styles.ringWrap}
            onPress={handleCreateStory}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.addRing,
                {
                  borderColor: colors.surface.border,
                  backgroundColor: colors.surface.elevated,
                },
              ]}
            >
              <IconSymbol name="plus" size={24} color={colors.accent.primary} />
            </View>
            <Text style={[styles.addLabel, { color: colors.text.secondary }]} numberOfLines={1}>
              Hikaye Ekle
            </Text>
          </TouchableOpacity>

          {/* Mekan hikayeleri */}
          {placeGroups.map((g, idx) => (
            <TouchableOpacity
              key={g.placeId}
              style={styles.ringWrap}
              onPress={() => handlePlaceTap(g.placeId, idx)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={STORY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientRing}
              >
                <View style={[styles.ringInner, { backgroundColor: colors.background.primary }]}>
                  <Image
                    source={{ uri: g.thumbnailUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  {g.isVideo && (
                    <View style={styles.videoIcon}>
                      <IconSymbol name="play.fill" size={10} color="#fff" />
                    </View>
                  )}
                </View>
              </LinearGradient>
              <Text style={[styles.placeLabel, { color: colors.text.secondary }]} numberOfLines={1}>
                {g.placeName ?? "Mekan"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loadingViewer && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay]}>
          <ActivityIndicator size="large" color={colors.accent.primary} />
        </View>
      )}
      {selectedPlaceId !== null && placeStories.length > 0 && (
        <StoryViewerModal
          stories={placeStories}
          onClose={() => {
            setSelectedPlaceId(null);
            setPlaceStories([]);
          }}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
    paddingHorizontal: spacing.lg,
    gap: 16,
    alignItems: "center",
  },
  ringWrap: {
    alignItems: "center",
    marginRight: 4,
  },
  addRing: {
    width: STORY_RING_SIZE + 4,
    height: STORY_RING_SIZE + 4,
    borderRadius: (STORY_RING_SIZE + 4) / 2,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    marginTop: 6,
    fontSize: 11,
    maxWidth: STORY_RING_SIZE + 20,
    textAlign: "center",
  },
  gradientRing: {
    width: STORY_RING_SIZE + 4,
    height: STORY_RING_SIZE + 4,
    borderRadius: (STORY_RING_SIZE + 4) / 2,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    width: STORY_RING_SIZE - 4,
    height: STORY_RING_SIZE - 4,
    borderRadius: (STORY_RING_SIZE - 4) / 2,
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
