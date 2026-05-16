/**
 * Create Post / Reels Screen (Premium UI)
 *
 * Architecture references:
 *  - Novu: Background upload pipeline — user returns to feed instantly
 *  - Munia: Payload sanitization before API call
 *  - Dummygram: Clean single-state PostMeta management
 *  - react-insta-stories: Fluid full-screen preview experience
 *
 * ContentCreationFlow: MediaPicker -> EditCanvas -> PostShareStep
 */

import React, { useState, useEffect, useCallback } from "react";
import type { Place } from "@/src/services/mekanService";
import { PlacePickerSheet } from "@/src/components/domain/place/PlacePickerSheet";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Switch,
  FlatList,
} from "react-native";
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing, radius } from "@/src/constants/design";
import { ContentCreationFlow } from "@/src/components/domain/contentCreation";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useUploadPipelineStore } from "@/src/store/useUploadPipelineStore";
import { lightImpact, mediumImpact, success } from "@/src/utils/haptics";
import { useTranslation } from "react-i18next";
import { sanitizeCaption } from "@/src/contentCreation/mediaValidation";
import type { PostMeta, TaggedUser, MediaItem } from "@/src/contentCreation/types";
import { apiGet } from "@/src/utils/apiClient";
import { Avatar } from "@/src/components/ui/Avatar";

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ placeId?: string; placeName?: string; preSelect?: string }>();
  const { t } = useTranslation();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => {
    if (params.placeId && params.placeName) {
      return { id: parseInt(params.placeId, 10), name: params.placeName } as Place;
    }
    return null;
  });
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);
  const enqueuePost = useUploadPipelineStore((s) => s.enqueuePost);

  const handleClose = useCallback(() => {
    lightImpact();
    Alert.alert(t("content_creation.cancel"), t("content_creation.cancel_post_desc"), [
      { text: t("content_creation.give_up"), style: "cancel" },
      { text: t("content_creation.exit"), style: "destructive", onPress: () => { lightImpact(); router.back(); } },
    ]);
  }, [t]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose]);

  /**
   * Novu-inspired: Enqueue upload and immediately navigate to feed.
   * The upload continues in the background via useUploadPipelineStore.
   */
  const handleShare = useCallback(
    async (shareParams: {
      mediaUri: string;
      isVideo: boolean;
      placeId?: number;
      placeName?: string;
      caption?: string;
      disableComments?: boolean;
      likesHidden?: boolean;
      taggedUserIds?: number[];
      mediaItems?: MediaItem[];
    }) => {
      lightImpact();

      const mediaItems: MediaItem[] = shareParams.mediaItems && shareParams.mediaItems.length > 0
        ? shareParams.mediaItems
        : [{ uri: shareParams.mediaUri, type: shareParams.isVideo ? 'video' : 'image' }];

      // Enqueue to pipeline (Novu pattern: fire and forget)
      enqueuePost(
        {
          caption: shareParams.caption,
          placeId: shareParams.placeId,
          isVideo: shareParams.isVideo,
          mediaItems,
          commentsDisabled: shareParams.disableComments,
          likesHidden: shareParams.likesHidden,
          taggedUserIds: shareParams.taggedUserIds,
        },
        mediaItems
      );

      success();
      // Instagram-style: Return to feed immediately
      router.replace("/(tabs)/feed");
    },
    [enqueuePost]
  );

  const quality = uploadQuality === "data_saver" ? 0.5 : 0.9;
  const placeId = selectedPlace ? Number(selectedPlace.id) : undefined;
  const placeName = selectedPlace?.name || "";
  const contentType = params.preSelect === "reels" ? "reels" : "post";

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ContentCreationFlow
        contentType={contentType}
        initialPlaceId={placeId}
        initialPlaceName={placeName}
        quality={quality}
        onShare={(flowParams) => handleShare(flowParams as any)}
        onClose={handleClose}
        renderShareStep={({ mediaUri, isVideo, onShare, onBack }) => (
          <PostShareStep
            mediaUri={mediaUri}
            isVideo={isVideo}
            selectedPlace={selectedPlace}
            onPlaceChange={setSelectedPlace}
            onPlacePickerOpen={() => setPlacePickerOpen(true)}
            onShare={({ placeId, placeName, caption, commentsDisabled, likesHidden, taggedUserIds }) =>
              handleShare({ mediaUri, isVideo, placeId, placeName, caption, disableComments: commentsDisabled, likesHidden, taggedUserIds })
            }
            onBack={onBack}
            onClose={handleClose}
          />
        )}
      />

      <PlacePickerSheet visible={placePickerOpen} onClose={() => setPlacePickerOpen(false)} onSelect={(place) => setSelectedPlace(place)} />
    </View>
  );
}

// ─── Premium PostShareStep (Dummygram-inspired state) ─────────────────

interface PostShareStepProps {
  mediaUri: string;
  isVideo: boolean;
  selectedPlace: Place | null;
  onPlaceChange: (place: Place | null) => void;
  onPlacePickerOpen: () => void;
  onShare: (payload: {
    placeId?: number;
    placeName?: string;
    caption?: string;
    commentsDisabled?: boolean;
    likesHidden?: boolean;
    taggedUserIds?: number[];
  }) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}

function PostShareStep({
  mediaUri,
  selectedPlace,
  onPlaceChange,
  onPlacePickerOpen,
  onShare,
  onBack,
  onClose,
}: PostShareStepProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Dummygram-inspired: Single state object for all post metadata
  const [postMeta, setPostMeta] = useState<PostMeta>({
    caption: '',
    place: selectedPlace ? { id: Number(selectedPlace.id), name: selectedPlace.name } : null,
    taggedUsers: [],
    commentsDisabled: false,
    likesHidden: false,
  });

  // Dummygram pattern: single dispatch-like updater
  const updateMeta = useCallback(<K extends keyof PostMeta>(key: K, value: PostMeta[K]) => {
    setPostMeta((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Tagging state
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState<TaggedUser[]>([]);
  const [tagSearching, setTagSearching] = useState(false);

  // Sync place changes
  useEffect(() => {
    if (selectedPlace) {
      updateMeta('place', { id: Number(selectedPlace.id), name: selectedPlace.name });
    } else {
      updateMeta('place', null);
    }
  }, [selectedPlace, updateMeta]);

  // Tag search with debounce
  useEffect(() => {
    if (!tagSearch.trim() || tagSearch.length < 2) {
      setTagResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setTagSearching(true);
      try {
        const results = await apiGet<{ items: { id: number; username: string; avatar_url?: string }[] }>(
          `/users/search?q=${encodeURIComponent(tagSearch.trim())}&page_size=10`
        );
        setTagResults(
          (results.items || []).map((u) => ({
            id: u.id,
            username: u.username,
            avatar_url: u.avatar_url,
          }))
        );
      } catch {
        setTagResults([]);
      } finally {
        setTagSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [tagSearch]);

  const handleTagUser = useCallback((user: TaggedUser) => {
    lightImpact();
    setPostMeta((prev) => {
      if (prev.taggedUsers.some((u) => u.id === user.id)) return prev;
      return { ...prev, taggedUsers: [...prev.taggedUsers, user] };
    });
    setTagSearch('');
    setTagResults([]);
  }, []);

  const handleUntagUser = useCallback((userId: number) => {
    lightImpact();
    setPostMeta((prev) => ({
      ...prev,
      taggedUsers: prev.taggedUsers.filter((u) => u.id !== userId),
    }));
  }, []);

  const handleShareClick = async () => {
    const sanitizedCaption = sanitizeCaption(postMeta.caption);
    await onShare({
      placeId: postMeta.place?.id,
      placeName: postMeta.place?.name,
      caption: sanitizedCaption || undefined,
      commentsDisabled: postMeta.commentsDisabled,
      likesHidden: postMeta.likesHidden,
      taggedUserIds: postMeta.taggedUsers.map((u) => u.id),
    });
  };

  const titleStyle = createTextStyle("title", colors.text.primary);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background.primary }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.surface.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[titleStyle, styles.headerTitle]}>{t("content_creation.new_post")}</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Caption & Thumbnail Row */}
          <View style={[styles.captionRow, { borderBottomColor: colors.surface.border }]}>
            <ExpoImage source={{ uri: mediaUri }} style={styles.thumbnail} contentFit="cover" />
            <TextInput
              style={[styles.captionInput, { color: colors.text.primary }]}
              placeholder={t("content_creation.caption_ph")}
              placeholderTextColor={colors.text.tertiary}
              value={postMeta.caption}
              onChangeText={(text) => updateMeta('caption', text)}
              multiline
              maxLength={2200}
            />
          </View>

          {/* Action Rows */}
          <View style={styles.actionGroup}>
            {/* Location */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); onPlacePickerOpen(); }}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <IconSymbol name="mappin.circle.fill" size={24} color={selectedPlace ? colors.accent.primary : colors.text.secondary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: selectedPlace ? colors.text.primary : colors.text.secondary }]}>
                  {selectedPlace?.name || t("content_creation.add_location")}
                </Text>
              </View>
              {selectedPlace ? (
                <TouchableOpacity onPress={() => { lightImpact(); onPlaceChange(null); }} hitSlop={12}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={colors.text.tertiary} />
                </TouchableOpacity>
              ) : (
                <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>

            {/* Tag People */}
            <TouchableOpacity
              style={[styles.actionRow, { borderBottomColor: colors.surface.border }]}
              onPress={() => { lightImpact(); setShowTagPicker(!showTagPicker); }}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconWrap}>
                <IconSymbol
                  name="person.crop.circle.badge.plus"
                  size={22}
                  color={postMeta.taggedUsers.length > 0 ? colors.accent.primary : colors.text.secondary}
                />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: postMeta.taggedUsers.length > 0 ? colors.text.primary : colors.text.secondary }]}>
                  {postMeta.taggedUsers.length > 0
                    ? t("content_creation.tagged_count", { count: postMeta.taggedUsers.length })
                    : t("content_creation.tag_people")}
                </Text>
              </View>
              {postMeta.taggedUsers.length > 0 ? (
                <View style={[styles.tagCountBadge, { backgroundColor: colors.accent.primary }]}>
                  <Text style={styles.tagCountText}>{postMeta.taggedUsers.length}</Text>
                </View>
              ) : (
                <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>

            {/* Tag Picker Inline */}
            {showTagPicker && (
              <View style={[styles.tagSection, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]}>
                {/* Tagged Users */}
                {postMeta.taggedUsers.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.taggedScroll} contentContainerStyle={styles.taggedRow}>
                    {postMeta.taggedUsers.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[styles.tagChip, { backgroundColor: colors.accent.primary + '15', borderColor: colors.accent.primary + '30' }]}
                        onPress={() => handleUntagUser(user.id)}
                        activeOpacity={0.7}
                      >
                        <Avatar name={user.username} source={user.avatar_url ? { uri: user.avatar_url } : undefined} size={22} />
                        <Text style={[styles.tagChipText, { color: colors.text.primary }]}>@{user.username}</Text>
                        <IconSymbol name="xmark" size={10} color={colors.text.tertiary} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Search Input */}
                <View style={[styles.tagSearchWrap, { borderColor: colors.surface.border }]}>
                  <IconSymbol name="magnifyingglass" size={16} color={colors.text.tertiary} />
                  <TextInput
                    style={[styles.tagSearchInput, { color: colors.text.primary }]}
                    placeholder={t("content_creation.search_users", "Search users...")}
                    placeholderTextColor={colors.text.tertiary}
                    value={tagSearch}
                    onChangeText={setTagSearch}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Search Results */}
                {tagResults.length > 0 && (
                  <View style={styles.tagResultsList}>
                    {tagResults.map((user) => {
                      const isTagged = postMeta.taggedUsers.some((u) => u.id === user.id);
                      return (
                        <TouchableOpacity
                          key={user.id}
                          style={[styles.tagResultRow, { borderBottomColor: colors.surface.border }]}
                          onPress={() => !isTagged && handleTagUser(user)}
                          activeOpacity={isTagged ? 1 : 0.7}
                          disabled={isTagged}
                        >
                          <Avatar name={user.username} source={user.avatar_url ? { uri: user.avatar_url } : undefined} size={36} />
                          <Text style={[styles.tagResultName, { color: colors.text.primary, opacity: isTagged ? 0.5 : 1 }]}>
                            @{user.username}
                          </Text>
                          {isTagged && <IconSymbol name="checkmark.circle.fill" size={18} color={colors.accent.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* Music */}
            <TouchableOpacity style={[styles.actionRow, { borderBottomColor: colors.surface.border }]} onPress={() => lightImpact()} activeOpacity={0.7}>
              <View style={styles.actionIconWrap}>
                <IconSymbol name="music.note" size={22} color={colors.text.secondary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text.secondary }]}>{t("content_creation.add_music")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Advanced Settings */}
          <View style={styles.advancedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{t("content_creation.adv_settings")}</Text>

            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>{t("content_creation.disable_comments")}</Text>
                <Text style={[styles.settingDesc, { color: colors.text.tertiary }]}>{t("content_creation.disable_comments_desc")}</Text>
              </View>
              <Switch
                value={postMeta.commentsDisabled}
                onValueChange={(val) => { lightImpact(); updateMeta('commentsDisabled', val); }}
                trackColor={{ false: colors.surface.border, true: colors.accent.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>{t("content_creation.hide_likes")}</Text>
                <Text style={[styles.settingDesc, { color: colors.text.tertiary }]}>{t("content_creation.hide_likes_desc")}</Text>
              </View>
              <Switch
                value={postMeta.likesHidden}
                onValueChange={(val) => { lightImpact(); updateMeta('likesHidden', val); }}
                trackColor={{ false: colors.surface.border, true: colors.accent.primary }}
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Share Footbar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface.elevated, borderTopColor: colors.surface.border }]}>
        <TouchableOpacity style={styles.draftBtn} onPress={onClose}>
          <Text style={[styles.draftText, { color: colors.text.primary }]}>{t("content_creation.save_draft")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.accent.primary }]} onPress={handleShareClick}>
          <Text style={styles.shareText}>{t("content_creation.share")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: spacing.xl * 3,
  },
  captionRow: {
    flexDirection: "row",
    padding: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "flex-start",
    gap: spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 92,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  captionInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    minHeight: 86,
    paddingTop: 4,
    textAlignVertical: "top",
  },
  actionGroup: {
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionIconWrap: {
    width: 32,
    alignItems: "flex-start",
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  // Tag styles
  tagCountBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagCountText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  tagSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  taggedScroll: {
    marginBottom: 10,
  },
  taggedRow: {
    gap: 8,
    paddingRight: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  tagResultsList: {
    marginTop: 8,
  },
  tagResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tagResultName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  advancedSection: {
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: spacing.lg,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  draftBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  draftText: {
    fontSize: 15,
    fontWeight: "600",
  },
  shareBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shareText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
});
