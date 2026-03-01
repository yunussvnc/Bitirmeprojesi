import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Avatar } from "@/src/components/ui";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { useTheme } from "@/src/hooks/useTheme";
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

  const [firstName, setFirstName] = useState(authUser?.first_name || "");
  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(authUser?.avatar_url || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.first_name || "");
      setUsername(authUser.username || "");
      setBio(authUser.bio || "");
      setAvatarUri(authUser.avatar_url || null);
    }
  }, [authUser?.id]);

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
    Keyboard.dismiss();
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
        first_name: (firstName || "").trim() || undefined,
        username: (username || "").trim() || undefined,
        bio: (bio || "").trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });
      setUser(updated);
      router.back();
    } catch (e) {
      const err = handleApiError(e);
      Alert.alert("Hata", err.userMessage || "Profil güncellenirken bir hata oluştu.");
      console.error("Profile update error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!authUser) {
    router.replace("/login");
    return null;
  }

  const displayName = authUser.first_name || authUser.username || authUser.email;

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background.primary }]}>
      {/* ── Modern Header ── */}
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 10 : 40 }]}>
        <TouchableOpacity
          onPress={() => {
            lightImpact();
            router.back();
          }}
          hitSlop={12}
          style={[styles.headerBtn, { backgroundColor: colors.surface.elevated }]}
        >
          <IconSymbol name="chevron.left" size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Düzenle
        </Text>

        <TouchableOpacity
          onPress={handleSave}
          hitSlop={12}
          style={[styles.headerBtn, { backgroundColor: colors.surface.elevated, opacity: loading ? 0.5 : 1 }]}
          disabled={loading}
        >
          {loading ? (
            <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.accent.primary} />
          ) : (
            <IconSymbol name="checkmark" size={20} color={colors.accent.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
        {/* ── Avatar Section ── */}
        <View style={styles.avatarWrap}>
          <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} style={styles.avatarTouchable}>
            <View style={[styles.avatarRing, { borderColor: colors.surface.border }]}>
              <Avatar source={avatarUri ? { uri: avatarUri } : undefined} name={displayName} size={110} />
            </View>
            <View style={[styles.cameraBadge, { backgroundColor: colors.accent.primary, borderColor: colors.background.primary }]}>
              <IconSymbol name="camera.fill" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Forms Section ── */}
        <View style={styles.formContainer}>
          <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Ad</Text>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              placeholder="Adın"
              placeholderTextColor={colors.text.tertiary}
              value={firstName}
              onChangeText={setFirstName}
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Kullanıcı Adı</Text>
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

          <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated }]}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>Biyografi</Text>
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

        {/* ── More Settings ── */}
        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: colors.surface.elevated }]}
            activeOpacity={0.7}
            onPress={() => {
              lightImpact();
              router.push("/settings/personal" as any);
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <IconSymbol name="person.text.rectangle" size={20} color={colors.text.primary} />
              <Text style={[styles.settingsBtnText, { color: colors.text.primary }]}>Kişisel Bilgi Ayarları</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  container: {
    flex: 1,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  avatarTouchable: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarRing: {
    padding: 4,
    borderRadius: 60,
    borderWidth: 2,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 24,
  },
  inputGroup: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 4,
  },
  bioInput: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: 8,
  },
  settingsContainer: {
    paddingHorizontal: 20,
  },
  settingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  settingsBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
