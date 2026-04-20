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
    Modal,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { ThemedText } from "@/src/components/themed-text";
import { useTheme } from "@/src/hooks/useTheme";
import { useMatchStore } from "@/src/store/useMatchStore";
import { useAuthStore } from "@/src/store/useAuthStore";
import { apiUploadFile } from "@/src/utils/apiClient";
import { API_BASE_URL } from "@/src/constants/api";
import { logger } from "@/src/utils/logger";
import type { MatchProfileCreate } from "@/src/services/matchService";
import { useTranslation } from "react-i18next";

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
const PROMPT_OPTIONS = [
    "Mükemmel pazar günüm...",
    "Benimle ilgili bilmediğin bir şey...",
    "Hayatımdaki en büyük başarım...",
    "Gizli yeteneğim...",
    "Bu yılki en büyük hedefim...",
    "Bana mesaj atman için harika bir sebep:",
    "Birlikte yaparsak çok eğleneceğimiz şey:",
];

const UNIVERSITIES = [
    // A
    "Abdullah Gül Üniversitesi",
    "Acıbadem Mehmet Ali Aydınlar Üniversitesi",
    "Ada Kent Üniversitesi",
    "Adana Alparslan Türkeş Bilim ve Teknoloji Üniversitesi",
    "Adıyaman Üniversitesi",
    "Afyon Kocatepe Üniversitesi",
    "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
    "Ağrı İbrahim Çeçen Üniversitesi",
    "Ahi Evran Üniversitesi",
    "Akdeniz Üniversitesi",
    "Akdeniz Karpaz Üniversitesi",
    "Aksaray Üniversitesi",
    "Alanya Alaaddin Keykubat Üniversitesi",
    "Alanya Hamdullah Emin Paşa Üniversitesi",
    "Altınbaş Üniversitesi",
    "Amasya Üniversitesi",
    "Anadolu Üniversitesi",
    "Ankara Hacı Bayram Veli Üniversitesi",
    "Ankara Medipol Üniversitesi",
    "Ankara Müzik ve Güzel Sanatlar Üniversitesi",
    "Ankara Sosyal Bilimler Üniversitesi",
    "Ankara Üniversitesi",
    "Antalya Bilim Üniversitesi",
    "Antalya Medipol Üniversitesi",
    "Antalya Tekstil ve Teknoloji Üniversitesi",
    // B
    "Bahçeşehir Üniversitesi",
    "Balıkesir Üniversitesi",
    "Bandırma Onyedi Eylül Üniversitesi",
    "Bartın Üniversitesi",
    "Başkent Üniversitesi",
    "Batman Üniversitesi",
    "Bayburt Üniversitesi",
    "Bezm-i Alem Vakıf Üniversitesi",
    "Bilecik Şeyh Edebali Üniversitesi",
    "Bingöl Üniversitesi",
    "Biruni Üniversitesi",
    "Bitlis Eren Üniversitesi",
    "Boğaziçi Üniversitesi",
    "Bolu Abant İzzet Baysal Üniversitesi",
    "Burdur Mehmet Akif Ersoy Üniversitesi",
    // C
    "Çağ Üniversitesi",
    "Çanakkale Onsekiz Mart Üniversitesi",
    "Çankaya Üniversitesi",
    "Çukurova Üniversitesi",
    // D
    "Dicle Üniversitesi",
    "Doğuş Üniversitesi",
    "Dokuz Eylül Üniversitesi",
    "Düzce Üniversitesi",
    // E
    "Ege Üniversitesi",
    "Erciyes Üniversitesi",
    // F
    "Fenerbahçe Üniversitesi",
    "Fırat Üniversitesi",
    // G
    "Galatasaray Üniversitesi",
    "Gaziantep Üniversitesi",
    "Gediz Üniversitesi",
    "Gelibolu Üniversitesi",
    "Giresun Üniversitesi",
    "Gümüşhane Üniversitesi",
    // H
    "Hacettepe Üniversitesi",
    "Haliç Üniversitesi",
    "Hasan Kalyoncu Üniversitesi",
    "Hitit Üniversitesi",
    // I - İ
    "Iğdır Üniversitesi",
    "Işık Üniversitesi",
    "İstanbul Arel Üniversitesi",
    "İstanbul Atlas Üniversitesi",
    "İstanbul Aydın Üniversitesi",
    "İstanbul Ayvansaray Üniversitesi",
    "İstanbul Bilgi Üniversitesi",
    "İstanbul Esenyurt Üniversitesi",
    "İstanbul Gedik Üniversitesi",
    "İstanbul Gelişim Üniversitesi",
    "İstanbul Kemerburgaz Üniversitesi",
    "İstanbul Medeniyet Üniversitesi",
    "İstanbul Okan Üniversitesi",
    "İstanbul Sabahattin Zaim Üniversitesi",
    "İstanbul Şehir Üniversitesi",
    "İstanbul Teknik Üniversitesi",
    "İstanbul Ticaret Üniversitesi",
    "İstanbul Üniversitesi",
    "İstanbul Yeni Yüzyıl Üniversitesi",
    "İzmir Bakırçay Üniversitesi",
    "İzmir Demokrasi Üniversitesi",
    "İzmir Katip Çelebi Üniversitesi",
    // K
    "Kahramanmaraş Sütçü İmam Üniversitesi",
    "Karabük Üniversitesi",
    "Karadeniz Teknik Üniversitesi",
    "Kasımpaşa Üniversitesi",
    "Kastamonu Üniversitesi",
    "Kırıkkale Üniversitesi",
    "Kırklareli Üniversitesi",
    "Kilis 7 Aralık Üniversitesi",
    "Kocaeli Üniversitesi",
    "Kocaeli Sağlık ve Teknoloji Üniversitesi",
    "Koç Üniversitesi",
    "Konya Gıda ve Tarım Üniversitesi",
    "KTO Karatay Üniversitesi",
    // M
    "Maltepe Üniversitesi",
    "Manisa Celal Bayar Üniversitesi",
    "Marmara Üniversitesi",
    "Mersin Üniversitesi",
    "Mevlana Üniversitesi",
    "Muğla Sıtkı Koçman Üniversitesi",
    "Mustafa Kemal Üniversitesi",
    // N
    "Namık Kemal Üniversitesi",
    "Necmettin Erbakan Üniversitesi",
    "Nevşehir Hacı Bektaş Veli Üniversitesi",
    "Niğde Ömer Halisdemir Üniversitesi",
    // O
    "Ordu Üniversitesi",
    "Orta Doğu Teknik Üniversitesi",
    "Osmaniye Korkut Ata Üniversitesi",
    // P
    "Pamukkale Üniversitesi",
    "Piri Reis Üniversitesi",
    // R
    "Recep Tayyip Erdoğan Üniversitesi",
    // S - Ş
    "Sakarya Üniversitesi",
    "Selçuk Üniversitesi",
    "Sinop Üniversitesi",
    "Sivas Cumhuriyet Üniversitesi",
    "Süleyman Demirel Üniversitesi",
    "Süleyman Şah Üniversitesi",
    "Şırnak Üniversitesi",
    // T
    "Tekirdağ Namık Kemal Üniversitesi",
    "Trabzon Üniversitesi",
    "Trakya Üniversitesi",
    "TOBB Ekonomi ve Teknoloji Üniversitesi",
    "Toros Üniversitesi",
    "Tunceli Üniversitesi",
    // U - Ü
    "Ufuk Üniversitesi",
    "Uludağ Üniversitesi",
    "Uşak Üniversitesi",
    // Y
    "Yalova Üniversitesi",
    "Yaşar Üniversitesi",
    "Yeditepe Üniversitesi",
    "Yeni Yüzyıl Üniversitesi",
    "Yıldız Teknik Üniversitesi",
    "Yüzüncü Yıl Üniversitesi",
    // Z
    "Zonguldak Bülent Ecevit Üniversitesi",
];

const JOBS = [
    "Yazılım Mühendisi", "Veri Bilimci", "Siber Güvenlik Uzmanı", "Mobil Geliştirici", "Yapay Zeka Uzmanı",
    "Sistem Analisti", "Bulut Bilişim Uzmanı", "Bilgisayar Mühendisi", "Web Tasarımcısı", "UX/UI Tasarımcısı",
    "Oyun Geliştirici", "IT Yöneticisi", "Doktor", "Diş Hekimi", "Eczacı", "Hemşire", "Fizyoterapist", "Psikolog",
    "Diyetisyen", "Veteriner", "Optisyen", "Biyolog", "Genetik Uzmanı", "Avukat", "Hakim", "Savcı", "Noter",
    "Arabulucu", "Hukuk Danışmanı", "İnşaat Mühendisi", "Makine Mühendisi", "Elektrik-Elektronik Mühendisi",
    "Mimarlık", "İç Mimar", "Endüstri Mühendisi", "Kimya Mühendisi", "Havacılık Mühendisi", "Gemi İnşa Mühendisi",
    "Mekatronik Mühendisi", "Pilot", "Kabin Memuru", "Hava Trafik Kontrolörü", "Lojistik Uzmanı", "Gümrük Müşaviri",
    "Kaptan", "Akademisyen", "Öğretmen", "Okul Öncesi Eğitmeni", "Özel Eğitim Öğretmeni", "Antrenör", "Sporcu",
    "Menajer", "Ekonomist", "Muhasebeci", "Mali Müşavir", "Bankacı", "Borsa Analisti", "Yatırım Danışmanı",
    "İnsan Kaynakları Uzmanı", "Pazarlama Uzmanı", "Satış Temsilcisi", "Halkla İlişkiler (PR) Uzmanı", "Reklam Yazarı",
    "Sosyal Medya Yöneticisi", "İçerik Üreticisi", "Gazeteci", "Editör", "Grafik Tasarımcı", "Ressam", "Heykeltıraş",
    "Fotoğrafçı", "Müzisyen", "Oyuncu", "Yönetmen", "Ses Sanatçısı", "Moda Tasarımcısı", "Stilist", "Model", "Aşçı",
    "Gastronomi Uzmanı", "Barista", "Garson", "Sommelier", "Otel İşletmecisi", "Turist Rehberi", "Polis", "Asker",
    "İtfaiyeci", "Güvenlik Görevlisi", "Emlak Danışmanı", "Sigortacı", "Müteahhit", "Çiftçi", "Ziraat Mühendisi",
    "Peyzaj Mimarı", "Marangoz", "Terzi", "Kuyumcu", "Kuaför", "Makyaj Sanatçısı", "Estetisyen", "Kurye", "Şoför",
    "Teknisyen", "İşçi", "Memur", "Girişimci", "Freelancer", "Öğrenci"
];

const MAX_PHOTOS = 6;

export default function MatchProfileSetupScreen() {
    const { colors, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const { myProfile, createProfile, profileLoading, hasProfile } = useMatchStore();
    const { t } = useTranslation();

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

    // Prompt Modal State
    const [isPromptModalVisible, setIsPromptModalVisible] = useState(false);
    const [selectedPromptOption, setSelectedPromptOption] = useState("");
    const [tempPromptAnswer, setTempPromptAnswer] = useState("");
    const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);

    // Selection Modal State
    type SelectionField = "starSign" | "interests" | "education" | "job" | null;
    const [activeSelectionField, setActiveSelectionField] = useState<SelectionField>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const [displayName, setDisplayName] = useState(myProfile?.display_name || "");
    const authUser = useAuthStore((s) => s.user);
    // Calculate age from birth_date
    const calculatedAge = (() => {
        const bd = authUser?.birth_date;
        if (!bd) return "";
        const d = new Date(bd);
        if (isNaN(d.getTime())) return "";
        const today = new Date();
        let a = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) a--;
        return String(a);
    })();
    const age = calculatedAge || (myProfile?.age?.toString() || "");
    const [bio, setBio] = useState(myProfile?.bio || "");
    const [height, setHeight] = useState(myProfile?.height?.toString() || "");
    const [gender, setGender] = useState(myProfile?.gender || "");
    const [education, setEducation] = useState(
        (myProfile?.education || "").replace(" (Mezun)", "")
    );
    const [isGraduated, setIsGraduated] = useState(
        (myProfile?.education || "").includes("(Mezun)")
    );
    const [locationText, setLocationText] = useState(myProfile?.location_text || "");
    const [smoking, setSmoking] = useState(myProfile?.smoking || "");
    const [drinking, setDrinking] = useState(myProfile?.drinking || "");
    const [lookingFor, setLookingFor] = useState(myProfile?.looking_for || "");
    const [interests, setInterests] = useState<string[]>(myProfile?.interests || []);
    const [starSign, setStarSign] = useState(myProfile?.star_sign || "");
    const [exercise, setExercise] = useState(myProfile?.exercise || "");
    const [prompts, setPrompts] = useState<{ question: string; answer: string }[]>(myProfile?.prompts || []);

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

    const handleOpenPromptModal = (index: number | null = null) => {
        setEditingPromptIndex(index);
        if (index !== null) {
            setSelectedPromptOption(prompts[index].question);
            setTempPromptAnswer(prompts[index].answer);
        } else {
            setSelectedPromptOption(PROMPT_OPTIONS[0]);
            setTempPromptAnswer("");
        }
        setIsPromptModalVisible(true);
    };

    const handleSavePrompt = () => {
        if (!tempPromptAnswer.trim()) {
            Alert.alert(t("match_setup.missing_info"), t("match_setup.please_answer"));
            return;
        }

        const newPrompts = [...prompts];
        if (editingPromptIndex !== null) {
            newPrompts[editingPromptIndex] = { question: selectedPromptOption, answer: tempPromptAnswer.trim() };
        } else {
            if (newPrompts.length >= 3) {
                Alert.alert(t("match_setup.limit_exceeded"), t("match_setup.max_q"));
                return;
            }
            newPrompts.push({ question: selectedPromptOption, answer: tempPromptAnswer.trim() });
        }
        setPrompts(newPrompts);
        setIsPromptModalVisible(false);
    };

    const handleRemovePrompt = (index: number) => {
        setPrompts(prompts.filter((_, i) => i !== index));
    };

    const isLocalUri = (uri: string) => uri.startsWith("file://") || uri.startsWith("ph://") || uri.startsWith("content://");

    const handlePickImage = async (slotIndex: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(t("match_setup.perm_required"), t("match_setup.gallery_perm_desc"));
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
            Alert.alert(t("match_setup.missing_info"), t("match_setup.please_enter_name"));
            return;
        }
        if (/\d/.test(displayName)) {
            Alert.alert(t("match_setup.invalid_name"), t("match_setup.no_numbers"));
            return;
        }

        const numAge = Number(age);
        if (!age.trim() || isNaN(numAge) || numAge < 18 || numAge > 70) {
            Alert.alert(t("match_setup.invalid_age"), t("match_setup.age_range"));
            return;
        }

        const numHeight = Number(height);
        if (height.trim() && (isNaN(numHeight) || numHeight < 100 || numHeight > 230)) {
            Alert.alert(t("match_setup.invalid_height"), t("match_setup.height_range"));
            return;
        }

        const trimmedEdu = education.trim();
        if (trimmedEdu && !UNIVERSITIES.includes(trimmedEdu)) {
            Alert.alert(t("match_setup.invalid_edu"), t("match_setup.edu_list"));
            return;
        }
        const finalEducation = trimmedEdu
            ? (isGraduated ? `${trimmedEdu} (Mezun)` : trimmedEdu)
            : undefined;

        const trimmedJob = locationText.trim();
        if (trimmedJob && !JOBS.includes(trimmedJob)) {
            Alert.alert(t("match_setup.invalid_job"), t("match_setup.job_list"));
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
                education: finalEducation,
                location_text: locationText.trim() || undefined,
                smoking: smoking || undefined,
                drinking: drinking || undefined,
                looking_for: lookingFor || undefined,
                interests: interests.length > 0 ? interests : undefined,
                star_sign: starSign || undefined,
                exercise: exercise || undefined,
                prompts: prompts.length > 0 ? prompts : undefined,
            };

            await createProfile(data);
            router.back();
        } catch (error: any) {
            const msg = error?.message || t("common.error");
            Alert.alert(t("common.error"), `${t("match_setup.save_failed")}: ${msg}`);
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

    const renderSelectionRow = (
        icon: any,
        label: string,
        value: string | string[] | undefined,
        field: SelectionField
    ) => {
        let displayValue = "";
        if (Array.isArray(value)) {
            displayValue = value.length > 0 ? value.join(", ") : "Ekle";
        } else {
            displayValue = value || "Ekle";
        }
        const hasValue = Array.isArray(value) ? value.length > 0 : !!value;

        return (
            <TouchableOpacity
                style={[styles.selectionRow, { backgroundColor: inputBg, borderColor: inputBorder }]}
                onPress={() => {
                    setSearchQuery("");
                    setActiveSelectionField(field);
                }}
            >
                <View style={styles.selectionRowLeft}>
                    <IconSymbol name={icon} size={18} color={colors.text.secondary} />
                    <ThemedText style={[styles.selectionRowLabel, { color: textColor }]}>{label}</ThemedText>
                </View>
                <View style={styles.selectionRowRight}>
                    <ThemedText style={[styles.selectionRowValue, { color: hasValue ? textColor : colors.text.tertiary }]} numberOfLines={1}>
                        {displayValue}
                    </ThemedText>
                    <IconSymbol name="chevron.right" size={16} color={colors.text.tertiary} />
                </View>
            </TouchableOpacity>
        );
    };

    const renderInlineSelection = (icon: any, label: string, options: string[], value: string, setValue: (v: string) => void) => {
        return (
            <View style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, paddingHorizontal: 4 }}>
                    <IconSymbol name={icon} size={16} color={colors.text.secondary} />
                    <ThemedText style={{ color: colors.text.secondary, fontSize: 13, fontWeight: "600", marginLeft: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {label}
                    </ThemedText>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, { flexWrap: "nowrap" }]} style={{ paddingHorizontal: 4 }}>
                    {options.map((opt) => {
                        const isSelected = value === opt;
                        return (
                            <TouchableOpacity
                                key={opt}
                                style={[
                                    styles.pillChip,
                                    { backgroundColor: isSelected ? ACCENT : inputBg },
                                    isSelected && styles.pillChipActiveGlow
                                ]}
                                onPress={() => setValue(isSelected ? "" : opt)}
                            >
                                <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
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
                        <View style={styles.photoRow}>
                            {renderPhotoBox(0)}
                            {renderPhotoBox(1)}
                            {renderPhotoBox(2)}
                        </View>
                        <View style={styles.photoRow}>
                            {renderPhotoBox(3)}
                            {renderPhotoBox(4)}
                            {renderPhotoBox(5)}
                        </View>
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
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "name" ? ACCENT : colors.text.secondary }]}>{t("match_setup.name")}</ThemedText>
                        <TextInput
                            ref={nameRef}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder={t("match_setup.name_ph")}
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
                        <ThemedText style={[styles.floatingLabel, { color: colors.text.secondary }]}>{t("match_setup.age")}</ThemedText>
                        <TextInput
                            ref={ageRef}
                            value={age}
                            placeholder={t("match_setup.age_ph")}
                            placeholderTextColor={colors.text.tertiary}
                            keyboardType="number-pad"
                            style={[styles.floatingInput, { color: colors.text.secondary }]}
                            editable={false}
                        />
                    </Pressable>
                    {!calculatedAge && (
                        <ThemedText style={{ color: colors.text.tertiary, fontSize: 11, marginTop: -4, marginBottom: 8, paddingHorizontal: 4 }}>
                            Yaş bilginiz kayıt sırasında girdiğiniz doğum tarihinden otomatik hesaplanır.
                        </ThemedText>
                    )}

                    {/* Bio */}
                    <View style={styles.sectionHeader}>
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
                            placeholder={t("match_setup.bio_ph")}
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

                    {/* Prompts Section */}
                    <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
                        <View>
                            <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                                Sorular
                            </ThemedText>
                            <ThemedText style={[styles.sectionHint, { color: colors.text.tertiary }]}>
                                Profiline kişilik kat
                            </ThemedText>
                        </View>
                        {prompts.length < 3 && (
                            <TouchableOpacity onPress={() => handleOpenPromptModal(null)} style={styles.addPromptBtn}>
                                <IconSymbol name="plus" size={20} color={ACCENT} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {prompts.map((item, index) => (
                        <View key={index} style={[styles.promptCard, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                            <View style={{ flex: 1 }}>
                                <ThemedText style={[styles.promptQuestion, { color: ACCENT }]}>{item.question}</ThemedText>
                                <ThemedText style={[styles.promptAnswer, { color: textColor }]}>{item.answer}</ThemedText>
                            </View>
                            <View style={styles.promptActions}>
                                <TouchableOpacity onPress={() => handleOpenPromptModal(index)} style={styles.promptActionBtn}>
                                    <IconSymbol name="pencil" size={18} color={colors.text.secondary} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleRemovePrompt(index)} style={styles.promptActionBtn}>
                                    <IconSymbol name="trash" size={18} color="#FF3B30" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    {/* About You */}
                    <View style={[styles.sectionHeader, { marginTop: 32, marginBottom: 12 }]}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            Hayat Tarzı & Hakkında
                        </ThemedText>
                    </View>

                    {renderInlineSelection("person.fill", "Cinsiyet", GENDER_OPTIONS, gender, setGender)}
                    {renderInlineSelection("heart.fill", "Ne Arıyorum", LOOKING_FOR_OPTIONS, lookingFor, setLookingFor)}
                    {renderSelectionRow("star.fill", "Burç", starSign, "starSign")}
                    {renderSelectionRow("sparkles", "İlgi Alanları", interests, "interests")}

                    <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }]}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            Alışkanlıklar
                        </ThemedText>
                    </View>

                    {renderInlineSelection("flame.fill", "Sigara", SMOKING_OPTIONS, smoking, setSmoking)}
                    {renderInlineSelection("drop.fill", "İçki", DRINKING_OPTIONS, drinking, setDrinking)}
                    {renderInlineSelection("figure.run", "Egzersiz", EXERCISE_OPTIONS, exercise, setExercise)}

                    {/* Basic Info */}
                    <View style={[styles.sectionHeader, { marginTop: 24, marginBottom: 12 }]}>
                        <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                            Diğer Detaylar
                        </ThemedText>
                    </View>

                    {/* Height */}
                    <Pressable
                        onPress={() => heightRef.current?.focus()}
                        style={[
                            styles.floatingInputContainer,
                            { backgroundColor: inputBg, borderColor: focusedInput === "height" ? ACCENT : inputBorder },
                            focusedInput === "height" && styles.inputGlow
                        ]}
                    >
                        <ThemedText style={[styles.floatingLabel, { color: focusedInput === "height" ? ACCENT : colors.text.secondary }]}>{t("match_setup.height_cm")}</ThemedText>
                        <TextInput
                            ref={heightRef}
                            value={height}
                            onChangeText={setHeight}
                            placeholder={t("match_setup.height_ph")}
                            placeholderTextColor={colors.text.tertiary}
                            keyboardType="number-pad"
                            style={[styles.floatingInput, { color: textColor }]}
                            onFocus={() => setFocusedInput("height")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </Pressable>

                    {/* Education */}
                    {renderSelectionRow("book.fill", "Eğitim (İsteğe Bağlı)", education, "education")}

                    {/* Mezun Toggle */}
                    {education.trim() !== "" && (
                        <TouchableOpacity
                            style={[styles.selectionRow, { backgroundColor: inputBg, borderColor: inputBorder, marginTop: 0 }]}
                            onPress={() => setIsGraduated(!isGraduated)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.selectionRowLeft}>
                                <IconSymbol name="checkmark.seal.fill" size={18} color={isGraduated ? ACCENT : colors.text.secondary} />
                                <ThemedText style={[styles.selectionRowLabel, { color: textColor }]}>{t("match_setup.graduated")}</ThemedText>
                            </View>
                            <View style={[
                                styles.graduateToggle,
                                { backgroundColor: isGraduated ? ACCENT : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)") }
                            ]}>
                                <View style={[
                                    styles.graduateToggleThumb,
                                    { transform: [{ translateX: isGraduated ? 18 : 0 }] }
                                ]} />
                            </View>
                        </TouchableOpacity>
                    )}

                    {/* Working Location/Job */}
                    {renderSelectionRow("briefcase.fill", "Meslek (İsteğe Bağlı)", locationText, "job")}

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

            {/* Prompt Selection & Edit Modal */}
            <Modal
                visible={isPromptModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsPromptModalVisible(false)}
            >
                <KeyboardAvoidingView
                    style={styles.modalOverlay}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                >
                    <View style={[styles.modalContent, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setIsPromptModalVisible(false)}>
                                <ThemedText style={{ color: colors.text.secondary, fontSize: 16 }}>{t("match_setup.cancel")}</ThemedText>
                            </TouchableOpacity>
                            <ThemedText style={styles.modalTitle}>{t("match_setup.add_prompt")}</ThemedText>
                            <TouchableOpacity onPress={handleSavePrompt}>
                                <ThemedText style={{ color: ACCENT, fontSize: 16, fontWeight: "700" }}>{t("match_setup.save")}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                            <ThemedText style={[styles.chipGroupLabel, { color: colors.text.secondary, marginTop: 0 }]}>{t("match_setup.choose_prompt")}</ThemedText>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, { flexWrap: "nowrap" }]} style={{ marginBottom: 20 }}>
                                {PROMPT_OPTIONS.map((opt) => {
                                    const isSelected = selectedPromptOption === opt;
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[
                                                styles.pillChip,
                                                { backgroundColor: isSelected ? ACCENT : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)") },
                                                isSelected && styles.pillChipActiveGlow
                                            ]}
                                            onPress={() => setSelectedPromptOption(opt)}
                                        >
                                            <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>

                            <ThemedText style={[styles.promptQuestion, { color: ACCENT, marginBottom: 12, fontSize: 18 }]}>{selectedPromptOption}</ThemedText>
                            <TextInput
                                style={[styles.promptAnswerInput, { color: textColor, backgroundColor: inputBg, borderColor: inputBorder }]}
                                placeholder={t("match_setup.answer_ph")}
                                placeholderTextColor={colors.text.tertiary}
                                value={tempPromptAnswer}
                                onChangeText={setTempPromptAnswer}
                                multiline
                                autoFocus
                                maxLength={150}
                            />
                            <ThemedText style={{ color: colors.text.tertiary, fontSize: 12, textAlign: "right", marginTop: 8 }}>
                                {tempPromptAnswer.length}/150
                            </ThemedText>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* General Selection Modal */}
            <Modal
                visible={activeSelectionField !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setActiveSelectionField(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: isDark ? "#1C1C1E" : "#FFF", height: "60%" }]}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setActiveSelectionField(null)}>
                                <ThemedText style={{ color: colors.text.secondary, fontSize: 16 }}>{t("match_setup.cancel")}</ThemedText>
                            </TouchableOpacity>
                            <ThemedText style={styles.modalTitle}>
                                {activeSelectionField === "starSign" && "Burç"}
                                {activeSelectionField === "interests" && "İlgi Alanları"}
                                {activeSelectionField === "education" && "Eğitim"}
                                {activeSelectionField === "job" && "Meslek"}
                            </ThemedText>
                            <TouchableOpacity onPress={() => setActiveSelectionField(null)}>
                                <ThemedText style={{ color: ACCENT, fontSize: 16, fontWeight: "700" }}>{t("match_setup.done")}</ThemedText>
                            </TouchableOpacity>
                        </View>

                        {(activeSelectionField === "education" || activeSelectionField === "job") && (
                            <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: inputBg, borderRadius: 10, paddingHorizontal: 12 }}>
                                    <IconSymbol name="magnifyingglass" size={16} color={colors.text.tertiary} />
                                    <TextInput
                                        style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: textColor }}
                                        placeholder="Ara..."
                                        placeholderTextColor={colors.text.tertiary}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>
                        )}

                        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                            <View style={styles.chipRow}>
                                {activeSelectionField === "education" && UNIVERSITIES.filter(u => u.toLowerCase().includes(searchQuery.toLowerCase())).map((opt) => {
                                    const isSelected = education === opt;
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.pillChip, { backgroundColor: isSelected ? ACCENT : inputBg }, isSelected && styles.pillChipActiveGlow]}
                                            onPress={() => { setEducation(isSelected ? "" : opt); setActiveSelectionField(null); }}
                                        >
                                            <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                                {activeSelectionField === "job" && JOBS.filter(j => j.toLowerCase().includes(searchQuery.toLowerCase())).map((opt) => {
                                    const isSelected = locationText === opt;
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.pillChip, { backgroundColor: isSelected ? ACCENT : inputBg }, isSelected && styles.pillChipActiveGlow]}
                                            onPress={() => { setLocationText(isSelected ? "" : opt); setActiveSelectionField(null); }}
                                        >
                                            <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                                {activeSelectionField === "starSign" && STAR_SIGN_OPTIONS.map((opt) => {
                                    const isSelected = starSign === opt;
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.pillChip, { backgroundColor: isSelected ? ACCENT : inputBg }, isSelected && styles.pillChipActiveGlow]}
                                            onPress={() => setStarSign(isSelected ? "" : opt)}
                                        >
                                            <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                                {activeSelectionField === "interests" && INTEREST_OPTIONS.map((opt) => {
                                    const isSelected = interests.includes(opt);
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.pillChip, { backgroundColor: isSelected ? ACCENT : inputBg }, isSelected && styles.pillChipActiveGlow]}
                                            onPress={() => toggleInterest(opt)}
                                        >
                                            <ThemedText style={[styles.pillChipText, { color: isSelected ? "#000" : textColor }]}>{opt}</ThemedText>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
        gap: 12,
    },
    photoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    photoBox: {
        width: "31%",
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
        marginTop: 24,
        marginBottom: 12,
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
        marginTop: 16,
        marginBottom: 8,
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

    // Prompts
    addPromptBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(29, 185, 84, 0.15)",
        alignItems: "center",
        justifyContent: "center",
    },
    promptCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "center",
    },
    promptQuestion: {
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    promptAnswer: {
        fontSize: 16,
        fontWeight: "500",
        lineHeight: 22,
    },
    promptActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginLeft: 12,
    },
    promptActionBtn: {
        padding: 8,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        height: "80%",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 16,
        paddingHorizontal: 16,
    },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        paddingHorizontal: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    modalScroll: {
        flex: 1,
    },
    promptAnswerInput: {
        borderWidth: 1,
        borderRadius: 16,
        minHeight: 120,
        padding: 16,
        fontSize: 18,
        lineHeight: 26,
        fontWeight: "500",
        textAlignVertical: "top",
    },

    // UI Refresh: Selection Rows
    selectionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderRadius: 16,
        marginBottom: 8,
    },
    selectionRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    selectionRowLabel: {
        fontSize: 16,
        fontWeight: "600",
    },
    selectionRowRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flex: 1,
        justifyContent: "flex-end",
    },
    selectionRowValue: {
        fontSize: 15,
        fontWeight: "500",
        textAlign: "right",
        flexShrink: 1,
        maxWidth: "80%",
    },
    graduateToggle: {
        width: 44,
        height: 26,
        borderRadius: 13,
        justifyContent: "center",
        paddingHorizontal: 3,
    },
    graduateToggleThumb: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#FFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});
