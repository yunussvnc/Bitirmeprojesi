import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Pressable,
  ActivityIndicator,
  Share,
  InteractionManager,
  Dimensions
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from "expo-router";
import { API_BASE_URL } from "@/src/constants/api";
import { Screen } from "@/src/components/layout";
import { Avatar, LoadingState, ErrorState } from "@/src/components/ui";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import {
  getUserProfile,
  getUserPosts,
  getUserStats,
  toggleFollow,
  type UserProfile,
  type UserStats,
} from "@/src/services/userService";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useNotificationStore } from "@/src/store/useNotificationStore";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact, success } from "@/src/utils/haptics";
import { toggleBlockUser, createReport } from "@/src/services/moderationService";
import { openConversation } from '@/src/services/messageService';
import { useAppStore } from '@/src/store/useAppStore';
import { useTranslation } from 'react-i18next';
import { ProfileOptionsSheet } from "./components/ProfileOptionsSheet";
import { NotificationSettingsSheet } from "./components/NotificationSettingsSheet";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';
import { styles } from './UserProfileScreen.styles';
import { LottieEmptyState } from "@/src/components/ui/LottieEmptyState";
import { ContactSyncPromptCard } from '../explore/ContactSyncPromptCard';

const GRID_GAP = 14;
const GRID_COLS = 2;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const currentUser = useAuthStore((s) => s.user);
  const { width: screenWidth } = useWindowDimensions();
  const { t } = useTranslation();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [posts, setPosts] = useState<
    { id: number; place_id?: number; thumbnail?: string; media_type?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const isNavigating = useRef(false);
  const [optionsSheetVisible, setOptionsSheetVisible] = useState(false);
  const [notificationSheetVisible, setNotificationSheetVisible] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "tagged">("posts");

  const userId = id ? parseInt(id, 10) : NaN;
  const isOwnProfile = currentUser && currentUser.id === userId;

  const cellSize = (screenWidth - 32 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

  const load = useCallback(
    async (refresh = false) => {
      if (isNaN(userId)) return;
      try {
        if (!refresh) setLoading(true);
        const [p, statsRes, postsRes] = await Promise.all([
          getUserProfile(userId),
          getUserStats(userId),
          getUserPosts(userId, 1, 30),
        ]);
        setProfile(p);
        setStats(statsRes);
        setPosts(
          postsRes.items.map((post) => {
            const sortedMedia = [...(post.media || [])].sort(
              (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
            );
            const firstMedia = sortedMedia[0];
            return {
              id: post.id,
              place_id: post.place_id,
              thumbnail: firstMedia?.thumbnail_url || firstMedia?.media_url,
              media_type: firstMedia?.media_type,
            };
          })
        );
      } catch (e) {
        handleApiError(e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      load();
    });
    return () => task.cancel();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      setActiveTab("posts");
    }, [])
  );

  const handleRefresh = useCallback(() => {
    lightImpact();
    setRefreshing(true);
    load(true);
  }, [load]);

  const profileRef = React.useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const handleFollow = useCallback(async () => {
    const currentProfile = profileRef.current;
    if (!currentProfile || !currentUser) return;
    
    lightImpact();
    
    // Optimistic update
      const prevProfile = { ...currentProfile };
      const willFollow = !currentProfile.is_following;
      const optimisticProfile: UserProfile = {
        ...currentProfile,
        is_following: willFollow,
        follow_status: willFollow ? ('accepted' as any) : null,
        followers_count: currentProfile.followers_count + (willFollow ? 1 : -1),
      };

      setProfile(optimisticProfile);

      // Async API Call
      try {
        const res = await toggleFollow(currentProfile.id);
        setProfile((p) => {
          if (!p) return p;
          return {
            ...p,
            is_following: res.status === 'accepted',
            follow_status: res.status as 'pending' | 'accepted' | null,
            followers_count: res.followers_count,
            friends_count: res.friends_count,
          };
        });
        
        // After follow succeeds, refresh notifications to ensure follow notification appears
        if (res.status === 'accepted') {
          try {
            const store = useNotificationStore.getState();
            setTimeout(() => {
              store.loadNotifications(1);
            }, 500);
          } catch {
            // Silently fail — notifications are nice-to-have
          }
        }
      } catch (e) {
        // Revert on error
        setProfile(prevProfile);
        handleApiError(e);
      }
  }, [currentUser]);

  const reportUser = useCallback(async (reason: "spam" | "inappropriate" | "harassment" | "other") => {
    try {
      await createReport({ target_type: "user", target_id: userId, reason });
      Alert.alert(t("user_profile.reported") + " ✅", t("user_profile.report_thanks"));
    } catch {
      Alert.alert(t("user_profile.reported"), t("user_profile.report_saved"));
    }
  }, [t, userId]);

  const handleMessagePress = useCallback(async () => {
    if (!profile) return;
    if (isNavigating.current) return;
    isNavigating.current = true;
    
    lightImpact();
    setMessageLoading(true);
    try {
      const res = await openConversation(profile.id);
      const name = encodeURIComponent(res.name);
      const avatar = encodeURIComponent(res.avatar_url || '');
      router.push(`/chat/${res.conversation_id}?name=${name}&avatar=${avatar}&targetUserId=${profile.id}` as any);
      
      setTimeout(() => {
        isNavigating.current = false;
      }, 1000);
    } catch (e) {
      handleApiError(e);
      isNavigating.current = false;
    } finally {
      setMessageLoading(false);
    }
  }, [profile, router]);

  const handlePostTap = useCallback((postId: number) => {
    lightImpact();
    router.push(`/p/post/${postId}` as any);
  }, [router]);

  // Apple Private Relay e-postalarını asla başka kullanıcıların profilinde gösterme
  const isRelayEmail = profile?.email?.includes('@privaterelay.appleid.com');
  const safeEmail = isRelayEmail ? null : profile?.email;
  const displayName =
    profile?.first_name || profile?.username || safeEmail || t('profile.user');
  const username = profile?.username || safeEmail || t('profile.user');
  const postCount = stats?.post_count ?? 0;

  if (loading && !profile) {
    return (
      <Screen withTabBar>
        <LoadingState message={t('profile.loading')} />
      </Screen>
    );
  }

  if (!profile || isNaN(userId)) {
    return (
      <Screen withTabBar>
        <ErrorState title={t('profile.not_found')} onRetry={() => router.back()} />
      </Screen>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <Stack.Screen 
        options={{ 
          gestureEnabled: true, 
          fullScreenGestureEnabled: true,
          animation: "slide_from_right" 
        }} 
      />
      {/* ── Modern Header ── */}
      <View style={styles.header}>
        {/* Ortadaki Username (Absolute) */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 26, zIndex: 0 }]}>
          <Text style={{ color: colors.text.primary, fontSize: 16, fontWeight: "600" }}>{username}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
          hitSlop={12}
          activeOpacity={0.7}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerRight}>
          {/* Bell Icon (Only show if not own profile and they are a friend/following? For now show if not own profile) */}
          {!isOwnProfile && (
            <TouchableOpacity 
              style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]} 
              activeOpacity={0.7}
              onPress={() => {
                lightImpact();
                setNotificationSheetVisible(true);
              }}
            >
              <IconSymbol name="bell.fill" size={18} color={colors.text.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
            activeOpacity={0.7}
            onPress={() => {
              lightImpact();
              if (isOwnProfile) return;
              setOptionsSheetVisible(true);
            }}
          >
            <IconSymbol name="ellipsis" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentScroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent.primary}
          />
        }
      >
        {/* ── Hero Section (Avatar, Name, Bio) ── */}
        <View style={styles.heroSection}>
          <View style={[styles.avatarRing, { borderColor: colors.surface.border }]}>
            <Avatar
              source={profile.avatar_url ? { uri: profile.avatar_url } : undefined}
              name={displayName}
              size={86}
            />
          </View>

          <View style={styles.heroInfo}>
            <Text style={[styles.heroName, { color: colors.text.primary }]} numberOfLines={1}>{displayName}</Text>

            {profile?.bio ? (
              <Text style={[styles.bioText, { color: colors.text.secondary }]}>{profile.bio}</Text>
            ) : null}
          </View>
        </View>

        {/* ── Action Buttons ── */}
        {!isOwnProfile && currentUser && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.primaryBtn,
                profile.is_following || profile.follow_status === 'pending'
                  ? { backgroundColor: colors.surface.elevated, borderWidth: 1, borderColor: colors.surface.border }
                  : { backgroundColor: colors.accent.primary, borderWidth: 1, borderColor: colors.accent.primary },
              ]}
              onPress={handleFollow}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.primaryBtnText,
                  {
                    color: profile.is_following || profile.follow_status === 'pending'
                      ? colors.text.primary
                      : '#fff',
                  },
                ]}
              >
                {profile.is_following
                  ? t('profile.following_btn')
                  : profile.follow_status === 'pending'
                    ? t('profile.requested_btn')
                    : t('profile.follow_btn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: colors.surface.elevated, borderWidth: 1, borderColor: colors.surface.border }
              ]}
              onPress={handleMessagePress}
              activeOpacity={0.8}
              disabled={messageLoading}
            >
              <Text style={[styles.primaryBtnText, { color: colors.text.primary }]}>
                {messageLoading ? '...' : t('profile.message_btn')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ContactSyncPromptCard />

        {/* ── Stats Card ── */}
        <View style={[styles.statsContainer, { backgroundColor: colors.surface.elevated, shadowColor: colors.text.primary }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{postCount}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{t('profile.posts')}</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => {
              lightImpact();
              router.push(`/network?id=${profile.id}&type=followers` as any);
            }}
          >
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.followers_count}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{t('profile.followers')}</Text>
          </TouchableOpacity>
          <View style={[styles.statDivider, { backgroundColor: colors.surface.border }]} />
          <TouchableOpacity
            style={styles.statItem}
            activeOpacity={0.7}
            onPress={() => {
              lightImpact();
              router.push(`/network?id=${profile.id}&type=following` as any);
            }}
          >
            <Text style={[styles.statNumber, { color: colors.text.primary }]}>{profile.following_count + (profile.place_follow_count || 0)}</Text>
            <Text style={[styles.statLabel, { color: colors.text.tertiary }]}>{t('profile.following')}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Modern Tabs ── */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "posts"
                ? { backgroundColor: colors.text.primary, borderColor: colors.text.primary }
                : { backgroundColor: "transparent", borderColor: colors.surface.border }
            ]}
            onPress={() => setActiveTab("posts")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === "posts" ? colors.background.primary : colors.text.secondary }]}>
              {t('profile.tab_posts')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabItem,
              activeTab === "tagged"
                ? { backgroundColor: colors.text.primary, borderColor: colors.text.primary }
                : { backgroundColor: "transparent", borderColor: colors.surface.border }
            ]}
            onPress={() => setActiveTab("tagged")}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === "tagged" ? colors.background.primary : colors.text.secondary }]}>
              {t('profile.tab_tagged')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Post Grid ── */}
        {activeTab === "posts" && (
          posts.length > 0 ? (
            <View style={styles.grid}>
              {posts.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.gridCell,
                    {
                      width: cellSize,
                      height: cellSize * 1.25,
                      marginRight: (idx + 1) % GRID_COLS !== 0 ? GRID_GAP : 0,
                      marginBottom: GRID_GAP,
                      backgroundColor: colors.surface.elevated
                    },
                  ]}
                  onPress={() => handlePostTap(item.id)}
                  activeOpacity={0.9}
                >
                  {item.thumbnail ? (
                    <Image
                      source={{ uri: item.thumbnail.startsWith('/') ? `${API_BASE_URL}${item.thumbnail}` : item.thumbnail }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                  ) : (
                    <View style={styles.gridPlaceholder}>
                      <IconSymbol
                        name={item.media_type === "video" ? "play.fill" : "photo.fill"}
                        size={28}
                        color={colors.text.tertiary}
                      />
                    </View>
                  )}
                  {item.media_type === "video" && item.thumbnail && (
                    <View style={styles.videoBadge}>
                      <IconSymbol name="play.fill" size={12} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ) : !loading && (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.surface.elevated }]}>
                <IconSymbol name="camera.fill" size={32} color={colors.text.tertiary} />
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t('profile.no_posts')}</Text>
                <Text style={[styles.emptyDesc, { color: colors.text.tertiary }]}>
                  {t('profile.no_posts_user_desc')}
                </Text>
              </View>
            </View>
          )
        )}

        {activeTab === "tagged" && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.surface.elevated }]}>
              <IconSymbol name="person.crop.square.fill" size={32} color={colors.text.tertiary} />
            </View>
            <View style={{ alignItems: "center", gap: 6 }}>
              <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>{t('profile.no_tagged_user')}</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Profile Options Sheet */}
      <ProfileOptionsSheet
        visible={optionsSheetVisible}
        displayName={displayName}
        onClose={() => setOptionsSheetVisible(false)}
        onBlock={async () => {
          try {
            await toggleBlockUser(userId);
            useAppStore.getState().addBlockedUserId(userId);
            success();
            Alert.alert(t("user_profile.blocked") + " ✅", t("user_profile.blocked_with_name", { name: displayName }));
            router.back();
          } catch { 
            Alert.alert(t("common.error"), t("user_profile.action_failed")); 
          }
        }}
        onReport={() => {
          Alert.alert(t("user_profile.report_title"), t("user_profile.report_reason"), [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("user_profile.report_spam"), onPress: () => reportUser("spam") },
            { text: t("user_profile.report_inappropriate"), onPress: () => reportUser("inappropriate") },
            { text: t("user_profile.report_other"), onPress: () => reportUser("harassment") },
          ]);
        }}
      />

      {/* Notification Settings Sheet */}
      {!isOwnProfile && (
        <NotificationSettingsSheet
          visible={notificationSheetVisible}
          onClose={() => setNotificationSheetVisible(false)}
          targetUserId={userId}
          targetUsername={username}
        />
      )}
    </View>
  );
}

