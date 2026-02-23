import React, { useState, useEffect } from "react";
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
    Alert,
    KeyboardAvoidingView,
    Image,
    ActivityIndicator,
    Pressable,
    Keyboard,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { ThemedText } from "@/src/components/themed-text";
import { useTheme } from "@/src/hooks/useTheme";
import { useMatchStore } from "@/src/store/useMatchStore";
import { apiUploadFile } from "@/src/utils/apiClient";
import { API_BASE_URL } from "@/src/constants/api";
import { logger } from "@/src/utils/logger";
import type { MatchProfileCreate } from "@/src/services/matchService";

/** Turn /uploads/foo.jpg into http://host:8000/uploads/foo.jpg */
const resolvePhotoUrl = (url: string) =>
    url.startsWith("/") ? `${API_BASE_URL}${url}` : url;

const ACCENT = "#1DB954";
const ACCENT_DARK = "#1AA34A";

const GENDER_OPTIONS = ["Erkek", "Kadın", "Diğer"];
const LOOKING_FOR_OPTIONS = [
    "Uzun süreli ilişki",
    "Kısa süreli ilişki",
    "Arkadaşlık",
    "Henüz bilmiyorum",
];
const SMOKING_OPTIONS = ["Evet", "Hayır", "Bazen"];
const DRINKING_OPTIONS = ["Evet", "Hayır", "Bazen"];
const EXERCISE_OPTIONS = ["Düzenli", "Bazen", "Hiç"];
const STAR_SIGN_OPTIONS = [
    "Koç", "Boğa", "İkizler", "Yengeç", "Aslan", "Başak",
    "Terazi", "Akrep", "Yay", "Oğlak", "Kova", "Balık",
];
const INTEREST_OPTIONS = [
    "Müzik", "Spor", "Seyahat", "Yemek", "Sinema", "Kitap",
    "Doğa", "Dans", "Fotoğrafçılık", "Yoga", "Kahve", "Oyun",
    "Teknoloji", "Sanat", "Moda", "Şarap",
];

const MAX_PHOTOS = 6;

export default function MatchProfileSetupScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { myProfile, createProfile, profileLoading, hasProfile } = useMatchStore();

    const nameRef = React.useRef<TextInput>(null);
    const ageRef = React.useRef<TextInput>(null);
    const bioRef = React.useRef<TextInput>(null);
    const heightRef = React.useRef<TextInput>(null);
    const eduRef = React.useRef<TextInput>(null);
    const jobRef = React.useRef<TextInput>(null);

    // photos: each entry is either a remote URL (already uploaded) or a local URI (pending)
    const [photos, setPhotos] = useState<string[]>(myProfile?.photo_urls || []);
    const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    const [displayName, setDisplayName] = useState(myProfile?.display_name || "");
    const [age, setAge] = useState(myProfile?.age?.toString() || "");
    const [bio, setBio] = useState(myProfile?.bio || "");
    const [height, setHeight] = useState(myProfile?.height?.toString() || "");
    const [gender, setGender] = useState(myProfile?.gender || "");
    const [education, setEducation] = useState(myProfile?.education || "");
    const [locationText, setLocationText] = useState(myProfile?.location_text || "");
    const [smoking, setSmoking] = useState(myProfile?.smoking || "");
    const [drinking, setDrinking] = useState(myProfile?.drinking || "");
    const [lookingFor, setLookingFor] = useState(myProfile?.looking_for || "");
    const [interests, setInterests] = useState<string[]>(myProfile?.interests || []);
    const [starSign, setStarSign] = useState(myProfile?.star_sign || "");
    const [exercise, setExercise] = useState(myProfile?.exercise || "");

    const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
    const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)";
    const textColor = colors.text.primary;

    const toggleInterest = (interest: string) => {
        if (interests.includes(interest)) {
            setInterests(interests.filter((i) => i !== interest));
        } else {
            setInterests([...interests, interest]);
        }
    };

    const isLocalUri = (uri: string) => uri.startsWith("file://") || uri.startsWith("ph://") || uri.startsWith("content://");

    const handlePickImage = async (slotIndex: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("İzin Gerekli", "Fotoğraf yüklemek için galeri iznine ihtiyacımız var.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: true,
            aspect: [4, 5],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const localUri = result.assets[0].uri;
            // Immediately show the local preview
            const newPhotos = [...photos];
            if (slotIndex < newPhotos.length) {
                newPhotos[slotIndex] = localUri;
            } else {
                newPhotos.push(localUri);
            }
            setPhotos(newPhotos);
        }
    };

    const uploadAllLocalPhotos = async (): Promise<string[]> => {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i];
            if (isLocalUri(photo)) {
                setUploadingIndex(i);
                try {
                    const res = await apiUploadFile<{ url: string }>("/upload/image", {
                        uri: photo,
                        type: "image/jpeg",
                        name: `match_photo_${Date.now()}_${i}.jpg`,
                    });
                    if (res.url) {
                        uploadedUrls.push(resolvePhotoUrl(res.url));
                    } else {
                        throw new Error("Upload returned no URL");
                    }
                } catch (error) {
                    logger.error(`[MatchProfile] Photo ${i} upload failed:`, error);
                    throw error;
                } finally {
                    setUploadingIndex(null);
                }
            } else {
                // Already a remote URL
                uploadedUrls.push(photo);
            }
        }
        return uploadedUrls;
    };

    const removePhoto = (index: number) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert("Eksik Bilgi", "Lütfen ismini gir.");
            return;
        }
        if (!age.trim() || isNaN(Number(age)) || Number(age) < 18 || Number(age) > 99) {
            Alert.alert("Geçersiz Yaş", "Lütfen geçerli bir yaş gir (18-99).");
            return;
        }

        setSaving(true);
        try {
            // Upload any local photos first
            let photoUrls: string[] = [];
            if (photos.length > 0) {
                photoUrls = await uploadAllLocalPhotos();
                setPhotos(photoUrls); // Update to remote URLs
            }

            const data: MatchProfileCreate = {
                display_name: displayName.trim(),
                age: Number(age),
                bio: bio.trim() || undefined,
                photo_urls: photoUrls.length > 0 ? photoUrls : undefined,
                height: height ? Number(height) : undefined,
                gender: gender || undefined,
                education: education.trim() || undefined,
                location_text: locationText.trim() || undefined,
                smoking: smoking || undefined,
                drinking: drinking || undefined,
                looking_for: lookingFor || undefined,
                interests: interests.length > 0 ? interests : undefined,
                star_sign: starSign || undefined,
                exercise: exercise || undefined,
            };

            await createProfile(data);
            router.back();
        } catch (error: any) {
            const msg = error?.message || "Bilinmeyen hata";
            Alert.alert("Hata", `Profil kaydedilemedi: ${msg}`);
            logger.error("[MatchProfile] Save failed:", error);
        } finally {
            setSaving(false);
        }
    };

    const renderPhotoBox = (slotIndex: number) => {
        const photoUri = photos[slotIndex];
        const isUploading = uploadingIndex === slotIndex;

        return (
            <TouchableOpacity
                key={slotIndex}
                style={[
                    styles.photoBox,
                    {
                        backgroundColor: photoUri ? "transparent" : (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"),
                        borderColor: photoUri ? "transparent" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
                        borderStyle: photoUri ? "solid" : "dashed",
                    },
                ]}
                onPress={() => (photoUri ? undefined : handlePickImage(slotIndex))}
                activeOpacity={photoUri ? 1 : 0.7}
                disabled={isUploading || saving}
            >
                {photoUri ? (
                    <>
                        <Image source={{ uri: photoUri }} style={styles.photoImage} resizeMode="cover" />
                        <LinearGradient
                            colors={["rgba(0,0,0,0.4)", "transparent"]}
                            style={styles.photoGradientTop}
                        />
                        <TouchableOpacity
                            style={styles.premiumRemoveIcon}
                            onPress={() => removePhoto(slotIndex)}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <View style={styles.premiumRemoveInner}>
                                <IconSymbol name="xmark" size={14} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        {isUploading && (
                            <View style={styles.photoUploadOverlay}>
                                <ActivityIndicator color="#FFF" />
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.addPhotoPlaceholder}>
                        <IconSymbol name="plus" size={24} color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const isFormBusy = profileLoading || saving;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background.primary }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} hitSlop={8} disabled={isFormBusy}>
                    <IconSymbol name="xmark" size={24} color={textColor} />
                </TouchableOpacity>
                <ThemedText style={[styles.headerTitle, { color: textColor }]}>
                    {hasProfile ? "Profili Düzenle" : "Eşleşme Profili"}
                </ThemedText>
                <TouchableOpacity onPress={handleSave} disabled={isFormBusy}>
                    <ThemedText style={[styles.headerSave, { color: ACCENT, opacity: isFormBusy ? 0.5 : 1 }]}>
                        {isFormBusy ? "..." : "Bitti"}
                    </ThemedText>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
            >
                <Pressable onPress={Keyboard.dismiss}>
                    {/* Photo Grid */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionLabel, { color: colors.text.secondary }]}>
                            Fotoğraflar
                        </ThemedText>
                    </View>
                    <View style={styles.photoGrid}>
                        {Array.from({ length: MAX_PHOTOS }).map((_, i) => renderPhotoBox(i))}
                    </View>

                    {/* Required Fields */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            Temel Bilgiler
                        </ThemedText>
                    </View>

                    <Pressable
                        onPress={() => nameRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "name" ? ACCENT : inputBorder },
                            focusedInput === "name" && styles.inputGlow
                        ]}
                    >
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "name" ? ACCENT : colors.text.secondary }]}>İSİM</ThemedText>
                        <TextInput
                            ref={nameRef}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Görünecek ismin"
                            placeholderTextColor={colors.text.tertiary}
                            style={[styles.floatingInput, { color: textColor }]}
                            onFocus={() => setFocusedInput("name")}
                            onBlur={() => setFocusedInput(null)}
                            editable={true}
                            autoCorrect={false}
                        />
                    </Pressable>

                    <Pressable
                        onPress={() => ageRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "age" ? ACCENT : inputBorder },
                            focusedInput === "age" && styles.inputGlow
                        ]}
                    >
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "age" ? ACCENT : colors.text.secondary }]}>YAŞ</ThemedText>
                        <TextInput
                            ref={ageRef}
                            value={age}
                            onChangeText={setAge}
                            placeholder="Örn: 25"
                            placeholderTextColor={colors.text.tertiary}
                            keyboardType="number-pad"
                            style={[styles.floatingInput, { color: textColor }]}
                            onFocus={() => setFocusedInput("age")}
                            onBlur={() => setFocusedInput(null)}
                            editable={true}
                        />
                    </Pressable>

                    {/* Bio */}
                    <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            Kendinden Bahset
                        </ThemedText>
                    </View>

                    <Pressable
                        onPress={() => bioRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "bio" ? ACCENT : inputBorder, paddingVertical: 12 },
                            focusedInput === "bio" && styles.inputGlow
                        ]}
                    >
                        <TextInput
                            ref={bioRef}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Hobilerin, sevdiğin şeyler, ilginç bir özelliğin..."
                            placeholderTextColor={colors.text.tertiary}
                            multiline
                            numberOfLines={4}
                            style={[styles.floatingInput, { color: textColor, minHeight: 80, marginTop: 0 }]}
                            textAlignVertical="top"
                            onFocus={() => setFocusedInput("bio")}
                            onBlur={() => setFocusedInput(null)}
                            editable={true}
                        />
                    </Pressable>

                    {/* About You */}
                    <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            Hakkında (İsteğe Bağlı)
                        </ThemedText>
                    </View>

                    {/* Gender */}
                    <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary }]}>Cinsiyet</ThemedText>
                    <View style={styles.chipRow}>
                        {GENDER_OPTIONS.map((opt) => {
                            const isSelected = gender === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => setGender(isSelected ? "" : opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>
                                        {opt}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Height */}
                    <Pressable
                        onPress={() => heightRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "height" ? ACCENT : inputBorder, marginTop: 16 },
                            focusedInput === "height" && styles.inputGlow
                        ]}
                    >
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "height" ? ACCENT : colors.text.secondary }]}>BOY (CM)</ThemedText>
                        <TextInput
                            ref={heightRef}
                            value={height}
                            onChangeText={setHeight}
                            placeholder="Örn: 180"
                            placeholderTextColor={colors.text.tertiary}
                            keyboardType="number-pad"
                            style={[styles.floatingInput, { color: textColor }]}
                            onFocus={() => setFocusedInput("height")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </Pressable>

                    {/* Education */}
                    <Pressable
                        onPress={() => eduRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "education" ? ACCENT : inputBorder },
                            focusedInput === "education" && styles.inputGlow
                        ]}
                    >
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "education" ? ACCENT : colors.text.secondary }]}>EĞİTİM</ThemedText>
                        <TextInput
                            ref={eduRef}
                            value={education}
                            onChangeText={setEducation}
                            placeholder="Üniversite, lise vb."
                            placeholderTextColor={colors.text.tertiary}
                            style={[styles.floatingInput, { color: textColor }]}
                            onFocus={() => setFocusedInput("education")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </Pressable>

                    {/* Working Location/Job */}
                    <Pressable
                        onPress={() => jobRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "job" ? ACCENT : inputBorder },
                            focusedInput === "job" && styles.inputGlow
                        ]}
                    >
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "job" ? ACCENT : colors.text.secondary }]}>MESLEK / ÇALIŞMA YERİ</ThemedText>
                        <TextInput
                            ref={jobRef}
                            value={locationText}
                            onChangeText={setLocationText}
                            placeholder="Örn: Yazılım Mühendisi"
                            placeholderTextColor={colors.text.tertiary}
                            style={[styles.floatingInput, { color: textColor }]}
                            onFocus={() => setFocusedInput("job")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </Pressable>

                    {/* Looking For */}
                    <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary }]}>Ne Arıyorum</ThemedText>
                    <View style={styles.chipRow}>
                        {LOOKING_FOR_OPTIONS.map((opt) => {
                            const isSelected = lookingFor === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => setLookingFor(isSelected ? "" : opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>
                                        {opt}
                                    </ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Lifestyle */}
                    <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary }]}>Sigara</ThemedText>
                    <View style={styles.chipRow}>
                        {SMOKING_OPTIONS.map((opt) => {
                            const isSelected = smoking === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => setSmoking(isSelected ? "" : opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary }]}>İçki</ThemedText>
                    <View style={styles.chipRow}>
                        {DRINKING_OPTIONS.map((opt) => {
                            const isSelected = drinking === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => setDrinking(isSelected ? "" : opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary }]}>Egzersiz</ThemedText>
                    <View style={styles.chipRow}>
                        {EXERCISE_OPTIONS.map((opt) => {
                            const isSelected = exercise === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => setExercise(isSelected ? "" : opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary }]}>Burç</ThemedText>
                    <View style={styles.chipRow}>
                        {STAR_SIGN_OPTIONS.map((opt) => {
                            const isSelected = starSign === opt;
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => setStarSign(isSelected ? "" : opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Interests */}
                    <View style={styles.sectionHeader}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            İlgi Alanları
                        </ThemedText>
                        <ThemedText style={[styles.sectionHint, { color: colors.text.tertiary }]}>
                            Seni en iyi yansıtanları seç
                        </ThemedText>
                    </View>
                    <View style={styles.chipRow}>
                        {INTEREST_OPTIONS.map((opt) => {
                            const isSelected = interests.includes(opt);
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    style={[
                                        styles.pillChip,
                                        { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                        isSelected && styles.pillChipActiveGlow
                                    ]}
                                    onPress={() => toggleInterest(opt)}
                                >
                                    <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Save Button inside ScrollView to ensure no occlusion */}
                    <View style={{ marginTop: 32, paddingBottom: 40 }}>
                        <TouchableOpacity
                            style={[styles.premiumSaveBtn, { opacity: isFormBusy ? 0.7 : 1 }]}
                            activeOpacity={0.85}
                            onPress={handleSave}
                            disabled={isFormBusy}
                        >
                            <LinearGradient
                                colors={[ACCENT, ACCENT_DARK]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.premiumSaveBtnInside}
                            >
                                {isFormBusy ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <ThemedText style={styles.premiumSaveBtnText}>
                                        {hasProfile ? "Profili Güncelle" : "Profili Yarat"}
                                    </ThemedText>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "800",
    },
    headerSave: {
        fontSize: 16,
        fontWeight: "700",
    },
    scroll: {
        flex: 1,
        paddingHorizontal: 16,
    },

    // Premium Photo Grid
    photoGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    photoBox: {
        width: "31.8%",
        aspectRatio: 3 / 4,
        borderRadius: 12, // Slightly sharper for tighter grid
        borderWidth: 1.5,
        overflow: "hidden",
        justifyContent: "center",
        alignItems: "center",
    },
    photoImage: {
        width: "100%",
        height: "100%",
    },
    photoGradientTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 40,
    },
    addPhotoPlaceholder: {
        justifyContent: "center",
        alignItems: "center",
    },
    premiumRemoveIcon: {
        position: "absolute",
        top: 8,
        right: 8,
    },
    premiumRemoveInner: {
        backgroundColor: "rgba(0,0,0,0.5)",
        borderRadius: 12,
        padding: 4,
    },
    photoUploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },

    // Premium Section Headers
    sectionHeader: {
        marginTop: 4,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: 0.2,
    },
    sectionHint: {
        fontSize: 13,
        marginTop: 4,
        fontWeight: "500",
    },

    // Premium Inputs (Floating Label Style)
    floatingInputContainer: {
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 4,
        marginBottom: 16,
    },
    floatingLabel: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.8,
    },
    floatingInput: {
        fontSize: 17,
        fontWeight: "600",
        paddingVertical: 8,
        marginTop: 2,
        minHeight: 44,
    },
    inputGlow: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },

    // Premium Chips (Pills)
    chipGroupLabel: {
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    chipRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 8,
    },
    pillChip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 30, // Full pill shape
    },
    pillChipActiveGlow: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    pillChipText: {
        fontSize: 14,
        fontWeight: "700",
    },

    // Premium Floating Save Button
    floatingSaveContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        backgroundColor: "transparent",
    },
    premiumSaveBtn: {
        width: "100%",
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    premiumSaveBtnInside: {
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
    },
    premiumSaveBtnText: {
        color: "#000", // High contrast dark text on neon green
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: 0.5,
    },
});
