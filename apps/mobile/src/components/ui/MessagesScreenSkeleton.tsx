/**
 * Messages Screen Skeleton
 * 
 * WhatsApp/Telegram style message list shimmer loading state.
 * Uses Reanimated-powered Skeleton component.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/src/components/ui/Skeleton';

function MessageRowSkeleton({ isLong = false }: { isLong?: boolean }) {
  return (
    <View style={styles.messageRow}>
      <Skeleton width={52} height={52} borderRadius={26} />
      <View style={styles.messageText}>
        <Skeleton width={isLong ? 150 : 100} height={14} borderRadius={4} />
        <Skeleton width={isLong ? 200 : 160} height={11} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <View style={styles.messageRight}>
        <Skeleton width={40} height={10} borderRadius={4} />
        <Skeleton width={20} height={20} borderRadius={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function MessagesScreenSkeleton() {
  return (
    <View style={styles.container}>
      {/* Search bar skeleton */}
      <View style={styles.searchBar}>
        <Skeleton width="100%" height={40} borderRadius={12} />
      </View>
      {/* Message rows */}
      <MessageRowSkeleton />
      <MessageRowSkeleton isLong />
      <MessageRowSkeleton />
      <MessageRowSkeleton isLong />
      <MessageRowSkeleton />
      <MessageRowSkeleton isLong />
      <MessageRowSkeleton />
      <MessageRowSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
  },
  searchBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  messageText: {
    flex: 1,
  },
  messageRight: {
    alignItems: 'flex-end',
  },
});
