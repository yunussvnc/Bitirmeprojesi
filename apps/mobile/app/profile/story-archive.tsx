/**
 * /app/profile/story-archive.tsx
 * Kullanıcının arşivlenmiş hikayelerini grid biçiminde gösterir.
 * Profil ekranından "Hikaye Arşivi" butonuyla açılır.
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Dimensions, Platform, RefreshControl,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { getMyStoryArchive, type Story } from '@/src/services/storyService';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { StoryViewerModal } from '@/src/components/domain/explore/StoryViewerModal';
import { useAuthStore } from '@/src/store/useAuthStore';
import { timeAgo } from '@/src/utils/timeAgo';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN = 3;
const ITEM_SIZE = Math.floor((SCREEN_WIDTH - 4) / COLUMN);

export default function StoryArchiveScreen() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const currentUser = useAuthStore((s) => s.user);

  const load = useCallback(async (p = 1, reset = false) => {
    if (p > 1 && !hasMore) return;
    try {
      const res = await getMyStoryArchive(p, 30);
      const newItems = res.items;
      setStories((prev) => reset ? newItems : [...prev, ...newItems]);
      setHasMore(newItems.length >= 30);
      setPage(p);
    } catch (e) {
      console.warn('[StoryArchive] Load failed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [hasMore]);

  useEffect(() => { load(1, true); }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    load(1, true);
  }, [load]);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore) load(page + 1);
  }, [loading, hasMore, page, load]);

  const renderItem = ({ item, index }: { item: Story; index: number }) => {
    const thumb = item.thumbnail_url || item.media_url;
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => setViewerIndex(index)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: thumb }}
          style={styles.gridThumb}
          contentFit="cover"
        />
        {item.media_type === 'video' && (
          <View style={styles.videoBadge}>
            <IconSymbol name="play.fill" size={10} color="#fff" />
          </View>
        )}
        <View style={styles.gridOverlay}>
          <Text style={styles.gridTime}>{timeAgo(item.created_at)}</Text>
          {(item.view_count ?? 0) > 0 && (
            <View style={styles.viewCountRow}>
              <IconSymbol name="eye.fill" size={10} color="rgba(255,255,255,0.9)" />
              <Text style={styles.viewCountText}>{item.view_count}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Hikaye Arşivi',
          headerStyle: { backgroundColor: '#0a0a0a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <View style={styles.container}>
        {loading && stories.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#a78bfa" />
          </View>
        ) : stories.length === 0 ? (
          <View style={styles.centered}>
            <IconSymbol name="archivebox" size={48} color="rgba(255,255,255,0.3)" />
            <Text style={styles.emptyTitle}>Arşiv Boş</Text>
            <Text style={styles.emptySubtitle}>
              Süresi dolan hikayeleriniz burada görünür.
            </Text>
          </View>
        ) : (
          <FlatList
            data={stories}
            numColumns={COLUMN}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#a78bfa"
              />
            }
            ListFooterComponent={
              hasMore && !loading ? (
                <ActivityIndicator style={{ marginVertical: 16 }} color="#a78bfa" />
              ) : null
            }
            contentContainerStyle={styles.grid}
            ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
          />
        )}
      </View>

      {viewerIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={viewerIndex}
          visible
          onClose={() => setViewerIndex(null)}
          currentUserId={currentUser?.id}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  grid: {
    paddingBottom: 40,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE * 1.5,
    margin: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  gridThumb: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 8,
    padding: 4,
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  viewCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  viewCountText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
});
