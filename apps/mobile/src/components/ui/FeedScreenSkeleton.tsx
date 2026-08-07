/**
 * Feed Screen Skeleton
 * 
 * Instagram/TikTok style feed loading shimmer.
 * Uses Reanimated-powered Skeleton component.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/src/components/ui/Skeleton';
import { useTheme } from '@/src/hooks/useTheme';

function FeedCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface.default }]}>
      {/* Header: Avatar + Username */}
      <View style={styles.header}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.headerText}>
          <Skeleton width={120} height={14} borderRadius={4} />
          <Skeleton width={80} height={10} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} style={{ marginLeft: 'auto' }} />
      </View>
      {/* Image area */}
      <Skeleton width="100%" height={300} borderRadius={0} style={{ marginTop: 12 }} />
      {/* Action bar */}
      <View style={styles.actions}>
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width={28} height={28} borderRadius={14} />
        <Skeleton width={28} height={28} borderRadius={14} style={{ marginLeft: 'auto' }} />
      </View>
      {/* Likes + Caption */}
      <View style={styles.footer}>
        <Skeleton width={100} height={12} borderRadius={4} />
        <Skeleton width="90%" height={12} borderRadius={4} style={{ marginTop: 8 }} />
        <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function FeedScreenSkeleton() {
  return (
    <View style={styles.container}>
      {/* Stories row skeleton */}
      <View style={styles.storiesRow}>
        {[...Array(6)].map((_, i) => (
          <View key={i} style={styles.storyItem}>
            <Skeleton width={64} height={64} borderRadius={32} />
            <Skeleton width={48} height={8} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        ))}
      </View>
      {/* Feed cards */}
      <FeedCardSkeleton />
      <FeedCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  storiesRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  storyItem: {
    alignItems: 'center',
    gap: 4,
  },
  card: {
    marginBottom: 8,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  footer: {
    paddingHorizontal: 16,
    gap: 4,
  },
});
