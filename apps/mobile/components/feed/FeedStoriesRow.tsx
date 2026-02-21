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

const STORY_RING_SIZE = 82;
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
    // Geçici olarak mock data kullan
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    setStories([
      {
        id: 1,
        user_id: 1,
        place_id: 101,
        place: { id: 101, name: "Cafe Luna", category: "Cafe" },
        media_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
      {
        id: 2,
        user_id: 2,
        place_id: 102,
        place: { id: 102, name: "Sunset Beach", category: "Beach" },
        media_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
      {
        id: 3,
        user_id: 3,
        place_id: 103,
        place: { id: 103, name: "Mountain View", category: "Nature" },
        media_url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
      {
        id: 4,
        user_id: 4,
        place_id: 104,
        place: { id: 104, name: "City Lights", category: "Restaurant" },
        media_url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
      {
        id: 5,
        user_id: 5,
        place_id: 105,
        place: { id: 105, name: "Art Gallery", category: "Culture" },
        media_url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
      {
        id: 6,
        user_id: 6,
        place_id: 106,
        place: { id: 106, name: "Park Central", category: "Park" },
        media_url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
      {
        id: 7,
        user_id: 7,
        place_id: 107,
        place: { id: 107, name: "Rooftop Bar", category: "Bar" },
        media_url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400",
        media_type: "image",
        created_at: now.toISOString(),
        expires_at: expiresAt,
      },
    ]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

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
                <View style={[styles.ringGap, { backgroundColor: colors.background.primary }]}>
                  <View style={styles.ringInner}>
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
