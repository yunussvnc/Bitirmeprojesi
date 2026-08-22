/**
 * Create Story Screen (Premium UI)
 *
 * Content Creation Flow: Medya seç → Düzenle → Paylaş (Premium Alt Bar)
 * Instagram seviyesinde içerik oluşturma deneyimi
 */

import React, { useState, useEffect, useCallback } from "react";
import type { Place } from "@/src/services/mekanService";
import { PlacePickerSheet } from "@/src/components/domain/place/PlacePickerSheet";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  ActivityIndicator,
} from "react-native";
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { ContentCreationFlow } from "@/src/components/domain/contentCreation";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { useUploadPipelineStore } from "@/src/store/useUploadPipelineStore";
import { lightImpact, success } from "@/src/utils/haptics";
import { Avatar } from "@/src/components/ui/Avatar";
import { useAuthStore } from "@/src/store/useAuthStore";
import { useTranslation } from "react-i18next";
import type { MediaItem } from "@/src/contentCreation/types";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';


export default function CreateStoryScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ placeId?: string; placeName?: string }>();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => {
    if (params.placeId != null && params.placeName != null) {
      return { id: parseInt(String(params.placeId), 10), name: params.placeName } as Place;
    }
    return null;
  });
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);
  const storySaveToCameraRoll = useSettingsStore((s) => s.storySaveToCameraRoll);
  const enqueueStory = useUploadPipelineStore((s) => s.enqueueStory);

  const handleClose = useCallback(() => {
    lightImpact();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/feed");
    }
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose]);

  /**
   * Novu-inspired: Enqueue story upload and immediately navigate back.
   * The upload continues in the background via useUploadPipelineStore.
   */
  const handleShare = useCallback(
    async (shareParams: { mediaUri: string; isVideo: boolean; placeId?: number; placeName?: string; isCloseFriends?: boolean }) => {
      const { mediaUri, isVideo, placeId, isCloseFriends } = shareParams;
      lightImpact();

      const mediaItem: MediaItem = {
        uri: mediaUri,
        type: isVideo ? 'video' : 'image',
      };

      // Enqueue to pipeline (Novu pattern: fire and forget)
      enqueueStory(
        {
          placeId: placeId ?? null,
          isVideo,
          mediaUri,
          isCloseFriends: isCloseFriends ?? false,
        },
        mediaItem
      );

      // Save to camera roll if enabled
      if (storySaveToCameraRoll) {
        try {
          const MediaLibrary = await import("expo-media-library");
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            await MediaLibrary.saveToLibraryAsync(mediaUri);
          }
        } catch {
          // Permission denied or module not available
        }
      }

      success();
      // Instagram-style: Return immediately
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)/feed");
      }
    },
    [storySaveToCameraRoll, enqueueStory]
  );

  const quality = uploadQuality === "data_saver" ? 0.5 : 0.9;
  const placeId = selectedPlace != null ? Number(selectedPlace.id) : undefined;
  const placeName = selectedPlace?.name ?? "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ContentCreationFlow
        contentType="story"
        initialPlaceId={placeId}
        initialPlaceName={placeName}
        quality={quality}
        onShare={(flowParams) => handleShare(flowParams as any)}
        onClose={handleClose}
        renderShareStep={({ mediaUri, isVideo, onShare, onBack }) => (
          <StoryShareStep
            mediaUri={mediaUri}
            isVideo={isVideo}
            selectedPlace={selectedPlace}
            onPlaceChange={setSelectedPlace}
            onPlacePickerOpen={() => setPlacePickerOpen(true)}
            onShare={onShare}
            onBack={onBack}
            onClose={handleClose}
          />
        )}
      />

      <PlacePickerSheet visible={placePickerOpen} onClose={() => setPlacePickerOpen(false)} onSelect={(place) => setSelectedPlace(place)} />
    </View>
  );
}

// ─── Premium StoryShareStep ─────────────────────────────────────────────

interface StoryShareStepProps {
  mediaUri: string;
  isVideo: boolean;
  selectedPlace: Place | null;
  onPlaceChange: (place: Place | null) => void;
  onPlacePickerOpen: () => void;
  onShare: (payload: { placeId?: number; placeName?: string; type?: 'story' }) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
}

function StoryShareStep({
  mediaUri,
  isVideo,
  selectedPlace,
  onPlaceChange,
  onPlacePickerOpen,
  onShare,
  onBack,
  onClose,
}: StoryShareStepProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState<"story" | null>(null);
  const { t } = useTranslation();
  
  const authUser = useAuthStore((s) => s.user);

  const handleShareClick = async (type: "story") => {
    setLoading(type);
    try {
      // NOTE: "close_friends" payload can be added to the backend schema in future
      await onShare({
        placeId: selectedPlace != null ? Number(selectedPlace.id) : undefined,
        placeName: selectedPlace?.name,
        type
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("content_creation.story_failed");
      Alert.alert(t("edit_profile.error"), msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[styles.flex, { backgroundColor: '#000' }]}>
      
      {/* Immersive Preview */}
      <View style={[styles.previewWrap, { borderRadius: 24, marginTop: insets.top }]}>
        <ExpoImage source={{ uri: mediaUri }} style={styles.previewImage} contentFit="cover" />
        
        {/* Bottom gradient over preview for depth */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.previewBottomGradient}
          pointerEvents="none"
        />
        
        {/* Floating Top Header Over Preview */}
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtnFloat} hitSlop={12}>
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { lightImpact(); onPlacePickerOpen(); }} style={styles.stickerPill}>
            <IconSymbol name="mappin.and.ellipse" size={16} color={colors.accent.primary} />
            <Text style={styles.stickerText}>{selectedPlace?.name ?? t("content_creation.location")}</Text>
          </TouchableOpacity>
        </View>

        {selectedPlace && (
           <TouchableOpacity onPress={() => onPlaceChange(null)} style={styles.clearPlaceFloat}>
             <IconSymbol name="xmark.circle.fill" size={24} color="rgba(255,255,255,0.8)" />
           </TouchableOpacity>
        )}
      </View>

      {/* Premium Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.shareOptionsRow}>
          
          <TouchableOpacity
            style={[styles.shareBtnPill, { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }]}
            onPress={() => handleShareClick("story")}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
             {loading === "story" ? (
               <ActivityIndicator size="small" color="#fff" />
              ) : (
               <>
                 <Avatar source={authUser?.avatar_url ? { uri: authUser.avatar_url } : undefined} name={authUser?.username || "A"} size={28} />
                 <Text style={styles.shareBtnText}>{t("content_creation.your_story")}</Text>
               </>
             )}
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.shareBtnCircle, { backgroundColor: '#fff' }]}
            onPress={() => handleShareClick("story")}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
             <IconSymbol name="chevron.right" size={20} color="#000" />
          </TouchableOpacity>
          
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  previewWrap: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#111',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  previewHeader: {
    position: 'absolute',
    top: 16, left: 16, right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  backBtnFloat: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  stickerPill: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  stickerText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  clearPlaceFloat: {
    position: 'absolute',
    top: 66, right: 16,
    zIndex: 10,
  },
  bottomBar: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  shareOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  shareBtnPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
    gap: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  closeFriendsIconWrap: {
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  shareBtnCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
