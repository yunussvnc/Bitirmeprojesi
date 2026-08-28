/**
 * NotificationsScreen — Novu Inbox + Munia Rich Payload + Dummygram Optimistic
 *
 * Features:
 *  - Segmented tabs: "Tümü" | "Takip İstekleri"
 *  - Munia: Avatar, post thumbnail, comment preview
 *  - Novu digest: "X, Y ve 3 kişi daha beğendi"
 *  - Dummygram: Optimistic accept/reject with animated removal
 *  - Full i18n localization
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Swipeable, FlatList } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '@/src/hooks/useTheme';
import { Avatar, LottieEmptyState } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { SuggestedUsersCarousel } from '../explore/SuggestedUsersCarousel';
import { Screen } from '@/src/components/layout';
import { useNotificationStore } from '@/src/store/useNotificationStore';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '@/src/constants/api';
import { lightImpact, success as hapticSuccess } from '@/src/utils/haptics';
import type { Notification } from '@/src/services/notificationService';

// ── Helpers ─────────────────────────────────────────────────

function timeAgo(dateStr: string, t: any): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return t('time_ago.just_now');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t('time_ago.minutes_ago', { val: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time_ago.hours_ago', { val: hours });
  const days = Math.floor(hours / 24);
  return t('time_ago.days_ago', { val: days });
}

function getNotifIcon(type: string): { name: string; color: string } {
  switch (type) {
    case 'like': return { name: 'heart.fill', color: '#FF4D67' };
    case 'comment': return { name: 'bubble.left.fill', color: '#5B9BD5' };
    case 'follow': return { name: 'person.badge.plus', color: '#4ECE8D' };
    case 'follow_request': return { name: 'person.crop.circle.badge.questionmark', color: '#FFB347' };
    case 'follow_accepted': return { name: 'person.badge.check.fill', color: '#4ECE8D' };
    case 'tag': return { name: 'at', color: '#AF52DE' };
    case 'mention': return { name: 'at', color: '#5856D6' };
    case 'campaign': return { name: 'megaphone.fill', color: '#FF9500' };
    case 'story_reaction': return { name: 'heart.fill', color: '#FF6B9D' };
    default: return { name: 'bell.fill', color: '#999' };
  }
}

function getNotifMessage(n: Notification, t: any): string {
  const user = n.actor_username || t('notifications.someone');

  // Novu digest: gruplama varsa
  if (n.group_count && n.group_count > 1) {
    const othersCount = n.group_count - 1;
    if (n.type === 'like') return t('notifications.digest_like', { user, count: othersCount });
    if (n.type === 'comment') return t('notifications.digest_comment', { user, count: othersCount });
  }

  switch (n.type) {
    case 'like': return t('notifications.like', { user });
    case 'comment': return t('notifications.comment', { user });
    case 'follow': return t('notifications.follow', { user });
    case 'follow_request': return t('notifications.follow_request_msg', { user });
    case 'follow_accepted': return t('notifications.follow_accepted_msg', { user });
    case 'tag': return t('notifications.tag', { user });
    case 'story_reaction': {
      try {
        if (n.payload) {
          const p = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
          const emoji = p.emoji || '❤️';
          return t('notifications.story_reaction', { user, emoji, defaultValue: `${user} hikayene ${emoji} tepki verdi` });
        }
      } catch { /* ignore */ }
      return t('notifications.story_reaction', { user, emoji: '❤️', defaultValue: `${user} hikayene tepki verdi` });
    }
    case 'campaign': {
      let campaign_text = '';
      try {
        if (n.payload) {
          const parsed = typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload;
          campaign_text = parsed.campaign_text || '';
        }
      } catch (e) {
        console.warn('Failed to parse campaign notification payload:', e);
      }
      return t('notifications.campaign', { user, campaign_text });
    }
    default: return t('notifications.default', { user });
  }
}

// ── Tab Types ───────────────────────────────────────────────

type TabId = 'all' | 'requests';

// ── Component ───────────────────────────────────────────────

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();

  // Store
  const {
    notifications,
    followRequests,
    loading,
    followRequestsLoading,
    loadNotifications,
    loadFollowRequests,
    acceptRequest,
    rejectRequest,
    hasMore,
    loadMoreNotifications
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Load data on mount / focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
      loadFollowRequests();
    }, [loadNotifications, loadFollowRequests])
  );

  const onRefresh = useCallback(async () => {
    lightImpact();
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadFollowRequests()]);
    setRefreshing(false);
  }, [loadNotifications, loadFollowRequests]);

  const handleNotifPress = useCallback((n: Notification) => {
    lightImpact();
    // story_reaction → hikaye izleyicileri ekranına git
    if (n.type === 'story_reaction') {
      try {
        const p = n.payload ? (typeof n.payload === 'string' ? JSON.parse(n.payload) : n.payload) : {};
        if (p.story_id) {
          // Kullanıcının kendi hikayesindeki izleyen listesini aç
          router.push(`/story-viewers/${p.story_id}` as any);
          return;
        }
      } catch { /* ignore */ }
    }
    // Navigate based on notification type
    if (n.post_id && (n.type === 'like' || n.type === 'comment' || n.type === 'tag')) {
      // Could navigate to post detail — for now navigate to actor profile
    }
    if (n.actor_id) {
      router.push(`/user/${n.actor_id}` as any);
    }
  }, [router]);

  const handleAccept = useCallback(async (n: Notification) => {
    hapticSuccess();
    await acceptRequest(n.actor_id, n.id);
  }, [acceptRequest]);

  const handleReject = useCallback(async (n: Notification) => {
    lightImpact();
    await rejectRequest(n.actor_id, n.id);
  }, [rejectRequest]);

  // ── Render Notification Row ───────────────────────────────

  const renderNotification = useCallback(({ item: n }: { item: Notification }) => {
    const icon = getNotifIcon(n.type);
    const message = getNotifMessage(n, t);
    const ago = timeAgo(n.created_at, t);
    const isFollowRequest = n.type === 'follow_request';

    // Munia: Avatar URL resolution
    const avatarUri = n.actor_avatar
      ? n.actor_avatar.startsWith('/') ? `${API_BASE_URL}${n.actor_avatar}` : n.actor_avatar
      : undefined;

    // Munia: Post thumbnail
    const thumbUri = n.post_thumbnail
      ? n.post_thumbnail.startsWith('/') ? `${API_BASE_URL}${n.post_thumbnail}` : n.post_thumbnail
      : undefined;

    return (
      <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
        <TouchableOpacity
          style={[
            styles.notifRow,
            !n.is_read && { backgroundColor: isDark ? 'rgba(99,179,237,0.06)' : 'rgba(99,179,237,0.04)' },
          ]}
          onPress={() => handleNotifPress(n)}
          activeOpacity={0.7}
        >
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Avatar
              source={avatarUri ? { uri: avatarUri } : undefined}
              name={n.actor_username || '?'}
              size={48}
            />
            {/* Type badge */}
            <View style={[styles.typeBadge, { backgroundColor: icon.color }]}>
              <IconSymbol name={icon.name as any} size={10} color="#fff" />
            </View>
          </View>

          {/* Content */}
          <View style={styles.contentWrap}>
            <Text style={[styles.notifText, { color: colors.text.primary }]} numberOfLines={2}>
              {message}
            </Text>
            <Text style={[styles.timeText, { color: colors.text.tertiary }]}>{ago}</Text>

            {/* Follow Request Actions (Dummygram optimistic) */}
            {isFollowRequest && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.acceptBtn, { backgroundColor: colors.accent.primary }]}
                  onPress={() => handleAccept(n)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.acceptText}>{t('notifications.accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                    borderColor: colors.surface.border,
                  }]}
                  onPress={() => handleReject(n)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.rejectText, { color: colors.text.secondary }]}>
                    {t('notifications.reject')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Follow accepted inline */}
            {n.type === 'follow_accepted' && (
              <View style={styles.acceptedPill}>
                <IconSymbol name="checkmark.circle.fill" size={12} color="#4ECE8D" />
                <Text style={styles.acceptedText}>{t('notifications.accepted')}</Text>
              </View>
            )}
          </View>

          {/* Post Thumbnail (Munia) */}
          {thumbUri && (
            <View style={styles.thumbWrap}>
              <Image
                source={{ uri: thumbUri }}
                style={styles.thumbnail}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }, [colors, isDark, t, handleNotifPress, handleAccept, handleReject]);

  // ── Data for current tab ──────────────────────────────────

  const data = activeTab === 'requests' ? followRequests : notifications;
  const isLoading = activeTab === 'requests' ? followRequestsLoading : loading;

  const emptyTitle = activeTab === 'requests'
    ? t('notifications.empty_requests')
    : t('notifications.empty_title');
  const emptyDesc = activeTab === 'requests'
    ? t('notifications.empty_requests_desc')
    : t('notifications.empty_desc');

  return (
    <Screen withTabBar scrollable={false}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              lightImpact();
              router.back();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('notifications.title')}
          </Text>
        </View>

        {/* Segmented Tabs (Novu Inbox channels) */}
        <View style={styles.tabBar}>
          {(['all', 'requests'] as TabId[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabBtn,
                  isActive
                    ? { backgroundColor: colors.text.primary }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.surface.border },
                ]}
                onPress={() => {
                  lightImpact();
                  setActiveTab(tab);
                  if (tab === 'requests') loadFollowRequests();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: isActive ? colors.background.primary : colors.text.secondary },
                  ]}
                >
                  {tab === 'all' ? t('notifications.tab_all') : t('notifications.tab_requests')}
                </Text>
                {tab === 'requests' && followRequests.length > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: '#FF4D67' }]}>
                    <Text style={styles.tabBadgeText}>{followRequests.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* List */}
        {isLoading && data.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent.primary} />
            <Text style={[styles.loadingText, { color: colors.text.tertiary }]}>
              {t('notifications.loading')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => `notif-${item.id}`}
            renderItem={renderNotification}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent.primary}
              />
            }
            ListEmptyComponent={
              <LottieEmptyState title={emptyTitle} description={emptyDesc} />
            }
            ListFooterComponent={
              <View>
                {hasMore && (
                  <TouchableOpacity 
                    style={styles.loadMoreBtn} 
                    onPress={loadMoreNotifications}
                    disabled={loading}
                  >
                    <Text style={[styles.loadMoreText, { color: colors.text.primary }]}>
                      {loading ? 'Yükleniyor...' : 'Devamını gör...'}
                    </Text>
                  </TouchableOpacity>
                )}
                <SuggestedUsersCarousel />
              </View>
            }
          />
        )}
      </View>
    </Screen>
  );
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8, // biraz sola yasla
  },
  loadMoreBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 100,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentWrap: {
    flex: 1,
    gap: 4,
  },
  notifText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '400',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  acceptBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  acceptText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  rejectBtn: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  rejectText: {
    fontSize: 13,
    fontWeight: '600',
  },
  acceptedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  acceptedText: {
    color: '#4ECE8D',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDesc: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
});
