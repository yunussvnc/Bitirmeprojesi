/**
 * Create Story Screen
 *
 * Content Creation Flow: Medya seç → Düzenle → Konum + Paylaş
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
  ScrollView,
  Alert,
  Pressable,
  BackHandler,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { Button } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing, radius } from "@/src/constants/design";
import { ContentCreationFlow } from "@/src/components/domain/contentCreation";
import { createStory } from "@/src/services/storyService";
import { uploadImage, uploadVideo } from "@/src/services/feedService";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { lightImpact } from "@/src/utils/haptics";

export default function CreateStoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  const handleClose = useCallback(() => {
    lightImpact();
    Alert.alert("Hikayeyi iptal et", "Çıkmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Çık",
        style: "destructive",
        onPress: () => {
          lightImpact();
          router.back();
        },
      },
    ]);
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose]);

  const handleShare = useCallback(
    async (params: { mediaUri: string; isVideo: boolean; placeId?: number; placeName?: string }) => {
      const { mediaUri, isVideo, placeId } = params;
      lightImpact();
      const uploadRes = isVideo
        ? await uploadVideo({
            uri: mediaUri,
            type: "video/mp4",
            name: "story.mp4",
          })
        : await uploadImage({
            uri: mediaUri,
            type: "image/jpeg",
            name: "story.jpg",
          });
      const mediaUrl = uploadRes?.url;
      if (mediaUrl == null) throw new Error("Yükleme başarısız.");

      await createStory({
        place_id: placeId ?? undefined,
        media_type: isVideo ? "video" : "image",
        media_url: mediaUrl,
      });
      if (storySaveToCameraRoll) {
        try {
          const MediaLibrary = await import("expo-media-library");
          const { status } = await MediaLibrary.requestPermissionsAsync();
          if (status === "granted") {
            await MediaLibrary.saveToLibraryAsync(mediaUri);
          }
        } catch {
          // İzin reddedildi veya paket yok
        }
      }
      router.back();
    },
    [storySaveToCameraRoll]
  );

  const quality = uploadQuality === "data_saver" ? 0.5 : 0.9;
  const titleStyle = createTextStyle("title", colors.text.primary);
  const placeId = selectedPlace != null ? Number(selectedPlace.id) : undefined;
  const placeName = selectedPlace?.name ?? "";

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing.md,
            borderBottomColor: colors.surface.border,
          },
        ]}
      >
        <Pressable onPress={handleClose} style={({ pressed }) => [styles.closeBtnArea, pressed && { opacity: 0.6 }]}>
          <IconSymbol name="xmark" size={24} color={colors.text.primary} />
        </Pressable>
        <Text style={[titleStyle, styles.title]}>Hikaye Paylaş</Text>
        <View style={styles.closeBtnArea} />
      </View>

      <ContentCreationFlow
        contentType="story"
        initialPlaceId={placeId}
        initialPlaceName={placeName}
        quality={quality}
        onShare={handleShare}
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
          />
        )}
      />

      <PlacePickerSheet visible={placePickerOpen} onClose={() => setPlacePickerOpen(false)} onSelect={(place) => setSelectedPlace(place)} />
    </View>
  );
}

interface StoryShareStepProps {
  mediaUri: string;
  isVideo: boolean;
  selectedPlace: Place | null;
  onPlaceChange: (place: Place | null) => void;
  onPlacePickerOpen: () => void;
  onShare: (placeId?: number, placeName?: string) => Promise<void>;
  onBack: () => void;
}

function StoryShareStep({
  mediaUri,
  isVideo,
  selectedPlace,
  onPlaceChange,
  onPlacePickerOpen,
  onShare,
  onBack,
}: StoryShareStepProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleShare = useCallback(async () => {
    setLoading(true);
    try {
      await onShare(selectedPlace != null ? Number(selectedPlace.id) : undefined, selectedPlace?.name);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Hikaye paylaşımı başarısız.";
      Alert.alert("Hata", msg);
    } finally {
      setLoading(false);
    }
  }, [onShare, selectedPlace]);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.previewSection}>
        <View style={[styles.preview, { backgroundColor: colors.surface.elevated }]}>
          {isVideo ? (
            <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
          )}
        </View>
      </View>

      <View style={[styles.placeTag, { backgroundColor: colors.surface.elevated }]}>
        <TouchableOpacity
          style={styles.placeTagInner}
          onPress={() => {
            lightImpact();
            onPlacePickerOpen();
          }}
          activeOpacity={0.8}
        >
          <IconSymbol name="mappin.circle.fill" size={24} color={colors.accent.primary} />
          <Text style={[styles.placeName, { color: colors.text.primary }]} numberOfLines={1}>
            {selectedPlace?.name ?? "Konum ekle"}
          </Text>
          <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
        </TouchableOpacity>
        {selectedPlace != null && (
          <TouchableOpacity
            onPress={() => {
              lightImpact();
              onPlaceChange(null);
            }}
            hitSlop={8}
            style={styles.clearPlace}
          >
            <IconSymbol name="xmark" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.hint, { color: colors.text.tertiary }]}>24 saat sonra hikaye otomatik silinecek</Text>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.surface.elevated }]} onPress={onBack}>
          <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
          <Text style={[styles.backBtnText, { color: colors.text.primary }]}>Düzenle</Text>
        </TouchableOpacity>
        <Button variant="primary" size="large" onPress={handleShare} loading={loading} disabled={loading} style={styles.submit}>
          Hikaye Paylaş
        </Button>
      </View>
    </ScrollView>
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
  closeBtnArea: {
    minWidth: 56,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700" },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  previewSection: { marginBottom: spacing.lg },
  preview: {
    aspectRatio: 9 / 16,
    maxHeight: 360,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  previewImage: { width: "100%", height: "100%" },
  placeTag: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    paddingRight: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  placeTagInner: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  placeName: { flex: 1, fontSize: 16, fontWeight: "600" },
  clearPlace: { padding: 4 },
  hint: { fontSize: 13, textAlign: "center", marginBottom: spacing.lg },
  actions: { gap: spacing.base },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  backBtnText: { fontSize: 16, fontWeight: "600" },
  submit: { marginTop: spacing.sm },
});
