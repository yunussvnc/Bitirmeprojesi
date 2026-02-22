/**
 * Profil Düzenleme Ekranı
 * Avatar, username, bio güncelleme
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Screen } from "@/src/components/layout";
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
    <Screen withTabBar>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          style={styles.backBtn}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[titleStyle, styles.headerTitle]}>Profili Düzenle</Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.container}>
        <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrap} activeOpacity={0.8}>
          <Avatar source={avatarUri ? { uri: avatarUri } : undefined} name={authUser.first_name || authUser.username || authUser.email} size={100} />
          <Text style={[styles.changePhoto, { color: colors.accent.primary }]}>Fotoğrafı değiştir</Text>
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Kullanıcı adı</Text>
          <TextInput
            style={[styles.input, { color: colors.text.primary, borderColor: colors.surface.border }]}
            placeholder="username"
            placeholderTextColor={colors.text.tertiary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput, { color: colors.text.primary, borderColor: colors.surface.border }]}
            placeholder="Kendini tanıt..."
            placeholderTextColor={colors.text.tertiary}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
          />
        </View>

        <Button variant="primary" size="large" onPress={handleSave} loading={loading} style={styles.saveBtn}>
          Kaydet
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  container: {
    padding: spacing.lg,
  },
  avatarWrap: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  changePhoto: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  field: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: spacing.lg,
  },
});
