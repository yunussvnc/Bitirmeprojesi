/**
 * Create Post Screen
 *
 * Adım 1: Medya seç → İleri
 * Adım 2: Açıklama + Konum + Paylaş (Instagram tarzı)
 */

import React, { useState, useEffect, useCallback } from "react";
import type { Place } from "@/src/services/mekanService";
import { PlacePickerSheet } from "@/src/components/domain/place/PlacePickerSheet";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing, radius } from "@/src/constants/design";
import { createPost, uploadImage, uploadVideo } from "@/src/services/feedService";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { lightImpact } from "@/src/utils/haptics";

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ placeId?: string; placeName?: string; preSelect?: string }>();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(params.preSelect === "reels");
  const [caption, setCaption] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => {
    if (params.placeId && params.placeName) {
      return { id: parseInt(params.placeId, 10), name: params.placeName } as Place;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const placeId = selectedPlace ? Number(selectedPlace.id) : undefined;
  const placeName = selectedPlace?.name || "";
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);

  const handleClose = useCallback(() => {
    lightImpact();
    if (mediaUri || caption.trim()) {
      Alert.alert("Gönderiyi iptal et", "Yaptığınız değişiklikler kaybolacak. Çıkmak istiyor musunuz?", [
        { text: "Vazgeç", style: "cancel" },
        { text: "Çık", style: "destructive", onPress: () => { lightImpact(); router.replace("/(tabs)/feed"); } },
      ]);
    } else {
      router.replace("/(tabs)/feed");
    }
  }, [mediaUri, caption]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      handleClose();
      return true;
    });
    return () => sub.remove();
  }, [handleClose]);

  const pickMedia = async (pickVideo: boolean) => {
    lightImpact();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin gerekli", "Medya seçmek için galeri erişimine izin verin.");
      return;
    }
    const quality = uploadQuality === "data_saver" ? 0.5 : 0.9;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: pickVideo ? ["videos"] : ["images"],
      allowsEditing: true,
      aspect: pickVideo ? [9, 16] : [1, 1],
      quality,
    });
    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setIsVideo(pickVideo);
    }
  };

  const handleShare = async () => {
    if (!mediaUri) {
      Alert.alert("Medya gerekli", isVideo ? "Lütfen bir video seçin." : "Lütfen bir fotoğraf seçin.");
      return;
    }
    lightImpact();
    setLoading(true);
    try {
      const uploadRes = isVideo
        ? await uploadVideo({
          uri: mediaUri,
          type: "video/mp4",
          name: "reel.mp4",
        })
        : await uploadImage({
          uri: mediaUri,
          type: "image/jpeg",
          name: "photo.jpg",
        });
      const mediaUrl = uploadRes?.url;
      if (!mediaUrl) throw new Error("Yükleme başarısız.");

      await createPost({
        caption: caption.trim() || undefined,
        place_id: placeId,
        post_type: isVideo ? "reel" : "photo",
        media: [
          {
            media_type: isVideo ? "video" : "image",
            media_url: mediaUrl,
            order_index: 0,
          },
        ],
      });
      router.replace("/(tabs)/feed");
    } catch (e: any) {
      Alert.alert("Hata", e?.message || "Paylaşım başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const titleStyle = createTextStyle("title", colors.text.primary);

  const goNext = () => {
    lightImpact();
    setStep(2);
  };

  const goBack = () => {
    lightImpact();
    setStep(1);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.surface.border }]}>
        {step === 1 ? (
          <>
            <Pressable onPress={handleClose} style={({ pressed }) => [styles.closeBtnArea, pressed && { opacity: 0.6 }]}>
              <IconSymbol name="xmark" size={24} color={colors.text.primary} />
            </Pressable>
            <Text style={[titleStyle, styles.title]}>Yeni Gönderi</Text>
            {mediaUri ? (
              <TouchableOpacity onPress={goNext} style={styles.headerAction}>
                <Text style={[styles.headerActionText, { color: colors.accent.primary }]}>İleri</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.closeBtnArea} />
            )}
          </>
        ) : (
          <>
            <Pressable onPress={goBack} style={({ pressed }) => [styles.closeBtnArea, pressed && { opacity: 0.6 }]}>
              <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
            </Pressable>
            <Text style={[titleStyle, styles.title]}>Yeni Gönderi</Text>
            <TouchableOpacity onPress={handleShare} disabled={loading} style={styles.headerAction}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.accent.primary} />
              ) : (
                <Text style={[styles.headerActionText, { color: colors.accent.primary }]}>Paylaş</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>

      {step === 1 ? (
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.mediaPickerRow}>
            <TouchableOpacity
              style={[
                styles.mediaOption,
                { borderColor: !isVideo ? colors.accent.primary : colors.surface.border, borderWidth: !isVideo ? 2 : 1 },
              ]}
              onPress={() => {
                lightImpact();
                setIsVideo(false);
                setMediaUri(null);
              }}
            >
              <IconSymbol name="photo" size={24} color={!isVideo ? colors.accent.primary : colors.text.tertiary} />
              <Text style={[styles.mediaOptionText, { color: !isVideo ? colors.accent.primary : colors.text.secondary }]}>
                Fotoğraf
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.mediaOption,
                { borderColor: isVideo ? colors.accent.primary : colors.surface.border, borderWidth: isVideo ? 2 : 1 },
              ]}
              onPress={() => {
                lightImpact();
                setIsVideo(true);
                setMediaUri(null);
              }}
            >
              <IconSymbol name="video.fill" size={24} color={isVideo ? colors.accent.primary : colors.text.tertiary} />
              <Text style={[styles.mediaOptionText, { color: isVideo ? colors.accent.primary : colors.text.secondary }]}>Reel</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.preview, { backgroundColor: colors.surface.elevated }]} onPress={() => pickMedia(isVideo)}>
            {mediaUri ? (
              <Image source={{ uri: mediaUri }} style={styles.image} resizeMode="cover" />
            ) : (
              <View style={styles.placeholder}>
                <IconSymbol name={isVideo ? "video.fill" : "photo"} size={64} color={colors.text.tertiary} />
                <Text style={[styles.placeholderText, { color: colors.text.tertiary }]}>
                  {isVideo ? "Video seç" : "Fotoğraf seç"}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.shareRow}>
              <Image source={{ uri: mediaUri! }} style={styles.thumbnail} resizeMode="cover" />
              <TextInput
                style={[styles.captionInput, { color: colors.text.primary }]}
                placeholder="Ne düşünüyorsun?"
                placeholderTextColor={colors.text.tertiary}
                value={caption}
                onChangeText={setCaption}
                multiline
              />
            </View>
            <TouchableOpacity
              style={[styles.locationRow, { borderTopColor: colors.surface.border }]}
              onPress={() => {
                lightImpact();
                setPlacePickerOpen(true);
              }}
              activeOpacity={0.7}
            >
              <IconSymbol name="mappin.circle.fill" size={22} color={colors.text.secondary} />
              <Text style={[styles.locationText, { color: placeName ? colors.text.primary : colors.text.tertiary }]}>
                {placeName || "Konum ekle"}
              </Text>
              <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
            {selectedPlace && (
              <TouchableOpacity
                onPress={() => {
                  lightImpact();
                  setSelectedPlace(null);
                }}
                style={styles.clearLocation}
              >
                <Text style={[styles.clearLocationText, { color: colors.text.tertiary }]}>Konumu kaldır</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <PlacePickerSheet visible={placePickerOpen} onClose={() => setPlacePickerOpen(false)} onSelect={(place) => setSelectedPlace(place)} />
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
  closeBtnArea: {
    minWidth: 56,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerAction: {
    minWidth: 56,
    minHeight: 48,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 4,
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  shareRow: {
    flexDirection: "row",
    padding: spacing.lg,
    gap: spacing.base,
    alignItems: "flex-start",
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  captionInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 80,
    padding: 0,
    textAlignVertical: "top",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  locationText: { flex: 1, fontSize: 16 },
  clearLocation: { padding: spacing.md, paddingTop: 0 },
  clearLocationText: { fontSize: 14 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  title: { fontSize: 18, fontWeight: "700" },
  mediaPickerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: spacing.lg,
  },
  mediaOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  mediaOptionText: { fontSize: 15, fontWeight: "600" },
  preview: {
    aspectRatio: 1,
    marginBottom: spacing.lg,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  placeholderText: { fontSize: 16, fontWeight: "600" },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: "600", marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  placeTag: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  placeName: { fontSize: 15, fontWeight: "600" },
  submit: { marginTop: spacing.lg },
});
