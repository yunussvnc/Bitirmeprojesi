/**
 * Create Post / Reels Screen (Premium UI)
 *
 * ContentCreationFlow kullanır: MediaPicker -> EditCanvas -> PostShareStep
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
  KeyboardAvoidingView,
  Platform,
  BackHandler,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Image as ExpoImage } from 'expo-image';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { createTextStyle, spacing, radius } from "@/src/constants/design";
import { ContentCreationFlow } from "@/src/components/domain/contentCreation";
import { createPost, uploadImage, uploadVideo } from "@/src/services/feedService";
import { useSettingsStore } from "@/src/store/useSettingsStore";
import { lightImpact, mediumImpact } from "@/src/utils/haptics";

export default function CreatePostScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ placeId?: string; placeName?: string; preSelect?: string }>();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(() => {
    if (params.placeId && params.placeName) {
      return { id: parseInt(params.placeId, 10), name: params.placeName } as Place;
    }
    return null;
  });
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const uploadQuality = useSettingsStore((s) => s.uploadQuality);

  const handleClose = useCallback(() => {
    lightImpact();
    Alert.alert("İptal Et", "Gönderi oluşturmayı iptal etmek istiyor musunuz? Yaptığınız değişiklikler silinecek.", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çık", style: "destructive", onPress: () => { lightImpact(); router.back(); } },
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
    async (shareParams: { mediaUri: string; isVideo: boolean; placeId?: number; placeName?: string; caption?: string; disableComments?: boolean; likesHidden?: boolean }) => {
      const { mediaUri, isVideo, placeId, caption, disableComments, likesHidden } = shareParams;
      lightImpact();
      
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
      if (!mediaUrl) throw new Error("Dosya yüklenemedi.");

      await createPost({
        caption: caption?.trim() || undefined,
        place_id: placeId,
        post_type: isVideo ? "reel" : "photo",
        comments_disabled: disableComments ?? false,
        likes_hidden: likesHidden ?? false,
        media: [
          {
            media_type: isVideo ? "video" : "image",
            media_url: mediaUrl,
            order_index: 0,
          },
        ],
      });
      router.replace("/(tabs)/feed");
    },
    []
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
        onShare={(flowParams) => handleShare(flowParams as any)} // will be handled by our custom generic
        onClose={handleClose}
        renderShareStep={({ mediaUri, isVideo, onShare, onBack }) => (
          <PostShareStep
            mediaUri={mediaUri}
            isVideo={isVideo}
            selectedPlace={selectedPlace}
            onPlaceChange={setSelectedPlace}
            onPlacePickerOpen={() => setPlacePickerOpen(true)}
            onShare={({ placeId, placeName, caption, commentsDisabled }) => 
              handleShare({ mediaUri, isVideo, placeId, placeName, caption, disableComments: commentsDisabled })
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

// ─── Premium PostShareStep ─────────────────────────────────────────────

interface PostShareStepProps {
  mediaUri: string;
  isVideo: boolean;
  selectedPlace: Place | null;
  onPlaceChange: (place: Place | null) => void;
  onPlacePickerOpen: () => void;
  onShare: (payload: { placeId?: number; placeName?: string; caption?: string; commentsDisabled?: boolean }) => Promise<void>;
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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [caption, setCaption] = useState("");
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);

  const handleShareClick = async () => {
    setLoading(true);
    try {
      await onShare({
        placeId: selectedPlace ? Number(selectedPlace.id) : undefined,
        placeName: selectedPlace?.name,
        caption,
        commentsDisabled
      });
    } catch (e: any) {
      Alert.alert("Hata", e.message || "Paylaşım başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const titleStyle = createTextStyle("title", colors.text.primary);

  return (
    <View style={[styles.flex, { backgroundColor: colors.background.primary }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md, borderBottomColor: colors.surface.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBtn} hitSlop={12}>
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[titleStyle, styles.headerTitle]}>Yeni Gönderi</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* Caption & Thumbnail Row */}
          <View style={[styles.captionRow, { borderBottomColor: colors.surface.border }]}>
            <ExpoImage source={{ uri: mediaUri }} style={styles.thumbnail} contentFit="cover" />
            <TextInput
              style={[styles.captionInput, { color: colors.text.primary }]}
              placeholder="Bir açıklama yaz..."
              placeholderTextColor={colors.text.tertiary}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={2200}
            />
          </View>

          {/* Action Rows */}
          <View style={styles.actionGroup}>
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
                  {selectedPlace?.name || "Konum Ekle"}
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

            <TouchableOpacity style={[styles.actionRow, { borderBottomColor: colors.surface.border }]} onPress={() => lightImpact()} activeOpacity={0.7}>
              <View style={styles.actionIconWrap}>
                <IconSymbol name="person.crop.circle.badge.plus" size={22} color={colors.text.secondary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text.secondary }]}>Kişileri Etiketle</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionRow, { borderBottomColor: colors.surface.border }]} onPress={() => lightImpact()} activeOpacity={0.7}>
              <View style={styles.actionIconWrap}>
                <IconSymbol name="music.note" size={22} color={colors.text.secondary} />
              </View>
              <View style={styles.actionTextWrap}>
                <Text style={[styles.actionLabel, { color: colors.text.secondary }]}>Müzik Ekle</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Advanced Settings */}
          <View style={styles.advancedSection}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Gelişmiş Ayarlar</Text>
            
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Yorumları Kapat</Text>
                <Text style={[styles.settingDesc, { color: colors.text.tertiary }]}>Bu gönderi için yorum yapmayı devre dışı bırakabilirsiniz.</Text>
              </View>
              <Switch
                value={commentsDisabled}
                onValueChange={(val) => { lightImpact(); setCommentsDisabled(val); }}
                trackColor={{ false: colors.surface.border, true: colors.accent.primary }}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingLabel, { color: colors.text.primary }]}>Beğeni Sayısını Gizle</Text>
                <Text style={[styles.settingDesc, { color: colors.text.tertiary }]}>Sadece siz bu gönderideki toplam beğeni sayısını görebilirsiniz.</Text>
              </View>
              <Switch
                value={hideLikes}
                onValueChange={(val) => { lightImpact(); setHideLikes(val); }}
                trackColor={{ false: colors.surface.border, true: colors.accent.primary }}
              />
            </View>
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Share Footbar */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: colors.surface.elevated, borderTopColor: colors.surface.border }]}>
        <TouchableOpacity style={styles.draftBtn} onPress={onClose} disabled={loading}>
          <Text style={[styles.draftText, { color: colors.text.primary }]}>Taslak Olarak Kaydet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.accent.primary }]} onPress={handleShareClick} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={styles.shareText}>Paylaş</Text>
          )}
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
