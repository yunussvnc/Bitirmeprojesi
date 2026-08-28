/**
 * Akış (Feed) Screen
 *
 * Sosyal akış - mekan deneyimi paylaşımları.
 */
import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Screen } from "@/src/components/layout";
import { FeedCard } from "./components/FeedCard";
import { PremiumRefreshControl } from "@/src/components/ui/PremiumRefreshControl";
import { CommentBottomSheet } from "./components/CommentBottomSheet";
import { SharePostSheet } from "./components/SharePostSheet";
import { EmptyState } from "@/src/components/ui";
import { FeedCardSkeleton } from "./components/FeedCardSkeleton";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { CreateTypeSheet } from "./components/CreateTypeSheet";
import { FeedStoriesRow } from "./components/FeedStoriesRow";
import { PostOptionsSheet } from "./components/PostOptionsSheet";
import { FeedMiniBar } from "./components/FeedMiniBar";
import { spacing } from "@/src/constants/design";
import { lightImpact } from "@/src/utils/haptics";
import type { Post } from "@/src/services/feedService";
import { SuggestedUsersCarousel } from '../explore/SuggestedUsersCarousel';
import { ContactSyncPromptCard } from '../explore/ContactSyncPromptCard';
import { useFeedScreen } from "./useFeedScreen";
import styles from "./FeedScreen.styles";

export default function FeedScreen() {
  const {
    t, colors, insets,
    posts, loading, refreshing, savedPostIds, viewableIds,
    filter, setFilter,
    commentPostId, setCommentPostId,
    optionsPost, setOptionsPost,
    unreadCount,
    createSheetOpen, setCreateSheetOpen,
    filterDropdownOpen, setFilterDropdownOpen,
    isCardZooming, setIsCardZooming,
    sharePost, setSharePost,
    headerHeight, setHeaderHeight,
    storyHeight, setStoryHeight,
    chromeHidden, storyHidden, miniBarVisible,
    flatListRef,
    visiblePosts,
    onViewableItemsChanged, viewabilityConfig,
    handleCreateSelect, handleRefresh, handleLoadMore,
    handleLike, handleCommentAdded, handleSavePost,
    handleOptionSelect, handleScroll, refreshUnread,
    fadeIn,
    headerOpacity, storyOpacity, miniBarOpacity, miniBarTranslateY,
    titleStyle,
  } = useFeedScreen();

  const renderItem = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <View style={{ overflow: "hidden" }}>
        <FeedCard
          post={item}
          isSaved={savedPostIds.includes(String(item.id))}
          isViewable={viewableIds.has(item.id)}
          onSave={() => handleSavePost(item)}
          onPress={() => item.place_id && router.push(`/place/${item.place_id}` as any)}
          onAuthorPress={() => router.push(`/user/${item.user_id}` as any)}
          onPlacePress={() => item.place_id && router.push(`/place/${item.place_id}` as any)}
          onLike={() => handleLike(item)}
          onComment={() => setCommentPostId(item.id)}
          onShare={() => setSharePost(item)}
          onOptionsPress={() => setOptionsPost(item)}
          onZoomChange={setIsCardZooming}
        />
        {index === 0 && (
          <>
            <ContactSyncPromptCard />
            <SuggestedUsersCarousel />
          </>
        )}
      </View>
    ),
    [handleLike, handleSavePost, savedPostIds, viewableIds]
  );

  const listEmpty = () => {
    if (loading) {
      return (
        <View style={styles.listEmpty}>
          <FeedCardSkeleton count={3} />
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <EmptyState
          variant="feed"
          title={t("feed.empty_title")}
          description={t("feed.empty_desc")}
          actionLabel={t("feed.empty_action")}
          onAction={() => setCreateSheetOpen(true)}
        />
      </View>
    );
  };

  const listHeader = (
    <View style={{ zIndex: 20 }}>
      <Animated.View
        style={[
          styles.headerWrap,
          {
            opacity: headerOpacity,
          },
        ]}
        pointerEvents={chromeHidden ? "none" : "auto"}
      >
        <View
          style={styles.header}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h !== headerHeight) setHeaderHeight(h);
          }}
        >
          <Text style={[titleStyle, styles.title]}>{t("feed.title")}</Text>

          {/* Dropdown filter — header ortası */}
          <View style={styles.dropdownWrap}>
            <TouchableOpacity
              style={[styles.dropdownTrigger]}
              onPress={() => {
                lightImpact();
                setFilterDropdownOpen((o) => !o);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.dropdownLabel, { color: colors.text.primary }]}>
                {filter === "all" ? t("feed.filter_all") : t("feed.filter_following")}
              </Text>
              <IconSymbol name={filterDropdownOpen ? "chevron.up" : "chevron.down"} size={12} color={colors.text.secondary} />
            </TouchableOpacity>

          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface.elevated }]}
              onPress={() => {
                lightImpact();
                router.push("/notifications" as any);
                refreshUnread();
              }}
            >
              <IconSymbol name="bell.fill" size={20} color={colors.text.primary} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.semantic.error }]}>
                  <Text style={[styles.badgeText, { color: colors.accent.onPrimary }]}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, { backgroundColor: colors.accent.primary }]}
              onPress={() => {
                lightImpact();
                setCreateSheetOpen(true);
              }}
            >
              <IconSymbol name="plus" size={20} color={colors.accent.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {filter === "all" && (
        <Animated.View
          style={[
            styles.topWrap,
            {
              opacity: storyOpacity,
            },
          ]}
          pointerEvents={storyHidden ? "none" : "auto"}
        >
          <View
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h !== storyHeight) setStoryHeight(h);
            }}
          >
            <FeedStoriesRow filter={filter} />
          </View>
        </Animated.View>
      )}
    </View>
  );

  return (
    <Screen scrollable={false} withTabBar contentContainerStyle={{ paddingHorizontal: 0 }}>
      <View style={styles.container}>
        <FlashList
          ref={flatListRef}
          style={styles.list}
          data={visiblePosts}
          extraData={[savedPostIds, viewableIds]}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={listEmpty}
          ListHeaderComponent={listHeader}
          contentContainerStyle={posts.length === 0 ? styles.listEmpty : styles.listContent}
          scrollEnabled={!isCardZooming}
          refreshControl={
            <PremiumRefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onScroll={(e) => handleScroll(e.nativeEvent.contentOffset.y)}
          onScrollBeginDrag={() => fadeIn()}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          // @ts-ignore: Typings mismatch
          estimatedItemSize={500}
        />

        {/* Filter dropdown overlay — FlatList dışında, her zaman üstte */}
        {filterDropdownOpen && (
          <>
            <TouchableOpacity
              style={styles.dropdownBackdrop}
              activeOpacity={1}
              onPress={() => setFilterDropdownOpen(false)}
            />
            <View
              style={[
                styles.dropdownMenu,
                {
                  backgroundColor: colors.surface.elevated,
                  borderColor: colors.surface.border,
                  top: insets.top + headerHeight,
                },
              ]}
            >
              {(["all", "following"] as const).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownItem, filter === opt && { backgroundColor: colors.accent.primary + "18" }]}
                  onPress={() => {
                    lightImpact();
                    setFilter(opt);
                    setFilterDropdownOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  {filter === opt && <IconSymbol name="checkmark" size={13} color={colors.accent.primary} />}
                  <Text style={[styles.dropdownItemText, { color: filter === opt ? colors.accent.primary : colors.text.primary }]}>
                    {opt === "all" ? t("feed.filter_all") : t("feed.filter_following")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <FeedMiniBar
          visible={miniBarVisible}
          opacity={miniBarOpacity}
          translateY={miniBarTranslateY}
          unreadCount={unreadCount}
          onCreatePress={() => setCreateSheetOpen(true)}
          onNotificationsPress={() => {
            router.push("/notifications" as any);
            refreshUnread();
          }}
        />

        <CommentBottomSheet
          visible={!!commentPostId}
          onClose={() => setCommentPostId(null)}
          postId={commentPostId ?? 0}
          onCommentAdded={() => commentPostId && handleCommentAdded(commentPostId)}
        />

        <PostOptionsSheet
          visible={!!optionsPost}
          onClose={() => setOptionsPost(null)}
          showFollowActions={!!optionsPost?.author?.is_following}
          onSelect={handleOptionSelect}
        />

        <CreateTypeSheet
          visible={createSheetOpen}
          onClose={() => setCreateSheetOpen(false)}
          onSelect={handleCreateSelect}
        />

        <SharePostSheet
          visible={!!sharePost}
          onClose={() => setSharePost(null)}
          post={sharePost}
        />
      </View>
    </Screen>
  );
}
