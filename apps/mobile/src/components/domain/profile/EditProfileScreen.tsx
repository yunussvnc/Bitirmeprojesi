/**
 * Profil Düzenleme Ekranı
 * Avatar, username, bio güncelleme
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { Button } from "@/src/components/ui/Button";
import { useTheme } from "@/src/hooks/useTheme";
import { createTextStyle, spacing, radius } from "@/src/constants/design";
import { useAuthStore } from "@/src/store/useAuthStore";
import { updateMe } from "@/src/services/authService";
import { uploadImage } from "@/src/services/feedService";
import { handleApiError } from "@/src/utils/errorHandler";
import { lightImpact } from "@/src/utils/haptics";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(authUser?.avatar_url || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      setUsername(authUser.username || "");
      setBio(authUser.bio || "");
      setAvatarUri(authUser.avatar_url || null);
    }
  }, [authUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- authUser?.id intentional

  const pickAvatar = async () => {
    lightImpact();
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("İzin gerekli", "Profil fotoğrafı seçmek için galeri erişimine izin verin.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    lightImpact();
    if (!authUser) return;
    setLoading(true);
    try {
      let avatarUrl = authUser.avatar_url;
      if (avatarUri && avatarUri !== authUser.avatar_url) {
        const uploadRes = await uploadImage({
          uri: avatarUri,
          type: "image/jpeg",
          name: "avatar.jpg",
        });
        avatarUrl = uploadRes?.url || avatarUrl;
      }
      const updated = await updateMe({
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });
      setUser(updated);
      router.back();
    } catch (e) {
      handleApiError(e);
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const titleStyle = createTextStyle("heading", colors.text.primary);

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background.primary }]}>
      <View style={[styles.header, { backgroundColor: colors.background.primary, borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          hitSlop={12}
          style={styles.backBtn}
        >
          <Text style={[styles.headerActionText, { color: colors.text.primary }]}>İptal</Text>
        </TouchableOpacity>

        <Text style={[createTextStyle("title", colors.text.primary), styles.headerTitle]} numberOfLines={1}>
          Profili Düzenle
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          hitSlop={12}
          style={styles.backBtn}
          disabled={loading}
        >
          <Text style={[styles.headerActionText, { color: colors.accent.primary, fontWeight: '700', opacity: loading ? 0.5 : 1 }]}>
            {loading ? "..." : "Bitti"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap} activeOpacity={0.8}>
          <View style={styles.avatarContainer}>
            <Avatar source={avatarUri ? { uri: avatarUri } : undefined} name={authUser.first_name || authUser.username || authUser.email} size={90} />
            <View style={[styles.cameraBadge, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
              <IconSymbol name="camera.fill" size={14} color={colors.text.primary} />
            </View>
          </View>
          <Text style={[styles.changePhoto, { color: colors.accent.primary }]}>Daha Fazla Seçenek</Text>
        </TouchableOpacity>

        <View style={[styles.section, { backgroundColor: colors.surface.elevated }]}>
          <View style={[styles.fieldRow, { borderBottomColor: colors.surface.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Ad</Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              placeholder="Adın"
              placeholderTextColor={colors.text.tertiary}
              value={authUser.first_name || ""}
              editable={false}
            />
          </View>

          <View style={[styles.fieldRow, { borderBottomColor: colors.surface.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Kullanıcı Adı</Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              placeholder="Kullanıcı Adı"
              placeholderTextColor={colors.text.tertiary}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.fieldRow, { alignItems: 'flex-start', paddingVertical: spacing.md }]}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary }]}>Biyografi</Text>
            <TextInput
              style={[styles.input, styles.bioInput, { color: colors.text.primary }]}
              placeholder="Kendinle ilgili bir şeyler yaz..."
              placeholderTextColor={colors.text.tertiary}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={150}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface.elevated, marginTop: spacing.xl }]}>
          <TouchableOpacity style={styles.fieldRow} activeOpacity={0.7} onPress={() => {
            lightImpact();
            router.push("/settings/personal" as any);
          }}>
            <Text style={[styles.fieldLabel, { color: colors.text.primary, width: '100%' }]}>Kişisel bilgi ayarları</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    minWidth: 60,
    height: 44,
    justifyContent: "center",
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: "400",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  changePhoto: {
    fontSize: 15,
    fontWeight: "600",
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    minHeight: 50,
  },
  fieldLabel: {
    fontSize: 15,
    width: 110,
    fontWeight: "400",
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: spacing.sm,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: 0,
  },
});
