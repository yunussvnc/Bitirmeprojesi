import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
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
import { useTranslation } from "react-i18next";
import { captureException } from "@/src/services/sentryService";
import { validateUsername, validateName, validateBio, BIO_MAX_LENGTH } from "@/src/utils/validators";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(authUser?.first_name || "");
  const [lastName, setLastName] = useState((authUser as any)?.last_name || "");
  const [username, setUsername] = useState(authUser?.username || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [avatarUri, setAvatarUri] = useState<string | null>(authUser?.avatar_url || null);
  const [avatarSize, setAvatarSize] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Anlık validasyon hataları
  const [fieldErrors, setFieldErrors] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    bio?: string;
  }>({});

  // Hesaplanmış validasyon sonuçları (kaydet butonu için)
  const validationState = useMemo(() => {
    const firstNameOk = !firstName.trim() || validateName(firstName).valid;
    const lastNameOk = !lastName.trim() || validateName(lastName).valid;
    const usernameOk = !username.trim() || validateUsername(username).valid;
    const bioOk = validateBio(bio).valid;
    return { firstNameOk, lastNameOk, usernameOk, bioOk, allOk: firstNameOk && lastNameOk && usernameOk && bioOk };
  }, [firstName, lastName, username, bio]);

  const bioValidation = validateBio(bio);

  useEffect(() => {
    if (authUser) {
      setFirstName(authUser.first_name || "");
      setLastName((authUser as any).last_name || "");
      setUsername(authUser.username || "");
      setBio(authUser.bio || "");
      setAvatarUri(authUser.avatar_url || null);
    }
  }, [authUser?.id]);

  const pickAvatar = async () => {
    try {
      // Önce mevcut izin durumunu kontrol et
      const permission = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (!permission.granted && !permission.canAskAgain) {
        Alert.alert(t("edit_profile.error", "Hata"), "Fotoğraf erişimine izin vermeniz gerekiyor. Ayarlar > İzinler");
        return;
      }
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(t("edit_profile.perm_req"), t("edit_profile.perm_desc"));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        // Dosya boyutu kontrolü (5MB limit)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert(t("edit_profile.error", "Hata"), "Dosya boyutu 5MB'dan küçük olmalıdır.");
          return;
        }
        setAvatarUri(asset.uri);
        setAvatarSize(asset.fileSize || null);
      }
    } catch (e) {
      const err = handleApiError(e);
      Alert.alert(t("edit_profile.error", "Hata"), `Beklenmeyen bir hata oluştu. (Kod: ${err.code || "UNKNOWN_ERROR"})`);
    }
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    lightImpact();
    if (!authUser) return;
    if (!validationState.allOk) return; // Güvenlik önlemi
    setLoading(true);
    try {
      let avatarUrl = authUser.avatar_url;
      if (avatarUri && avatarUri !== authUser.avatar_url) {
        // Kayıt öncesi ek boyut kontrolü
        if (avatarSize && avatarSize > 5 * 1024 * 1024) {
          Alert.alert(t("edit_profile.error", "Hata"), "Dosya boyutu 5MB'dan küçük olmalıdır.");
          setLoading(false);
          return;
        }
        let uploadRes;
        try {
          uploadRes = await uploadImage({
            uri: avatarUri,
            type: "image/jpeg",
            name: "avatar.jpg",
          });
        } catch (uploadError: any) {
          captureException(uploadError, {
            userId: authUser?.id,
            fileSize: avatarSize,
            mimeType: "image/jpeg",
            platform: Platform.OS,
          });
          const err = handleApiError(uploadError);
          let errorMsg = `Beklenmeyen bir hata oluştu. (Kod: ${err.code || "UNKNOWN_ERROR"})`;
          if (err.code === "NETWORK_ERROR") errorMsg = "Bağlantı hatası. İnternet bağlantınızı kontrol edin.";
          else if (err.code === "PERMISSION_DENIED") errorMsg = "Fotoğraf erişimine izin vermeniz gerekiyor.";
          Alert.alert(t("edit_profile.error", "Hata"), errorMsg);
          setLoading(false);
          return;
        }
        avatarUrl = uploadRes?.url || avatarUrl;
      }
      const updated = await updateMe({
        first_name: (firstName || "").trim() || undefined,
        last_name: (lastName || "").trim() || undefined,
        username: (username || "").trim() || undefined,
        bio: (bio || "").trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });
      setUser(updated);
      router.back();
    } catch (e) {
      const err = handleApiError(e);
      Alert.alert(t("edit_profile.error"), err.userMessage || t("edit_profile.error_desc"));
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
            {t("edit_profile.title")}
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            hitSlop={12}
            style={[
              styles.headerBtn,
              {
                backgroundColor: validationState.allOk ? colors.surface.elevated : colors.surface.border,
                opacity: loading ? 0.5 : 1,
              }
            ]}
            disabled={loading || !validationState.allOk}
          >
            {loading ? (
              <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.accent.primary} />
            ) : (
              <IconSymbol name="checkmark" size={20} color={colors.accent.primary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
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
            <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated, borderColor: fieldErrors.firstName ? '#FF6B6B' : 'transparent', borderWidth: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>{t("edit_profile.first_name")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder={t("edit_profile.first_name_ph")}
                placeholderTextColor={colors.text.tertiary}
                value={firstName}
                onChangeText={(v) => {
                  setFirstName(v);
                  const res = validateName(v);
                  setFieldErrors(prev => ({ ...prev, firstName: v.trim() && !res.valid ? res.error : undefined }));
                }}
                autoCorrect={false}
              />
              {fieldErrors.firstName ? (
                <Text style={styles.fieldError}>{fieldErrors.firstName}</Text>
              ) : null}
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated, borderColor: fieldErrors.lastName ? '#FF6B6B' : 'transparent', borderWidth: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>{t("edit_profile.last_name", "SOYAD")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder={t("edit_profile.last_name_ph", "Soyadınız")}
                placeholderTextColor={colors.text.tertiary}
                value={lastName}
                onChangeText={(v) => {
                  setLastName(v);
                  const res = validateName(v);
                  setFieldErrors(prev => ({ ...prev, lastName: v.trim() && !res.valid ? res.error : undefined }));
                }}
                autoCorrect={false}
              />
              {fieldErrors.lastName ? (
                <Text style={styles.fieldError}>{fieldErrors.lastName}</Text>
              ) : null}
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated, borderColor: fieldErrors.username ? '#FF6B6B' : 'transparent', borderWidth: 1 }]}>
              <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>{t("edit_profile.username")}</Text>
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                placeholder={t("edit_profile.username_ph")}
                placeholderTextColor={colors.text.tertiary}
                value={username}
                onChangeText={(v) => {
                  setUsername(v);
                  const res = validateUsername(v);
                  setFieldErrors(prev => ({ ...prev, username: v.trim() && !res.valid ? res.error : undefined }));
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {fieldErrors.username ? (
                <Text style={styles.fieldError}>{fieldErrors.username}</Text>
              ) : null}
            </View>

            <View style={[styles.inputGroup, { backgroundColor: colors.surface.elevated, borderColor: fieldErrors.bio ? '#FF6B6B' : 'transparent', borderWidth: 1 }]}>
              <View style={styles.bioHeader}>
                <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>{t("edit_profile.bio")}</Text>
                <Text style={[
                  styles.bioCounter,
                  { color: bioValidation.remaining < 20 ? (bioValidation.remaining < 0 ? '#FF6B6B' : '#FF9500') : colors.text.tertiary }
                ]}>
                  {bio.length}/{BIO_MAX_LENGTH}
                </Text>
              </View>
              <TextInput
                style={[styles.input, styles.bioInput, { color: colors.text.primary }]}
                placeholder={t("edit_profile.bio_ph")}
                placeholderTextColor={colors.text.tertiary}
                value={bio}
                onChangeText={(v) => {
                  setBio(v);
                  const res = validateBio(v);
                  setFieldErrors(prev => ({ ...prev, bio: !res.valid ? res.error : undefined }));
                }}
                multiline
                maxLength={BIO_MAX_LENGTH + 10} // +10 ile kullanıcı sınırı görür ama kaydedilemez
              />
              {fieldErrors.bio ? (
                <Text style={styles.fieldError}>{fieldErrors.bio}</Text>
              ) : null}
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
                <Text style={[styles.settingsBtnText, { color: colors.text.primary }]}>{t("edit_profile.personal_details")}</Text>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
            </TouchableOpacity>
          </View>
            </View>
          </TouchableWithoutFeedback>
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
    bioHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    bioCounter: {
      fontSize: 12,
      fontWeight: '600',
    },
    fieldError: {
      fontSize: 12,
      color: '#FF6B6B',
      fontWeight: '500',
      marginTop: 4,
      marginBottom: 2,
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
