/**
 * Şifre ve Güvenlik Ayarları
 * Şifre değiştirme ve hesap silme işlemleri
 */

import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@/src/hooks/useTheme";
import { BackButton } from "@/src/components/shared/navigation";
import { createTextStyle, spacing } from "@/src/constants/design";
import { useAuthStore } from "@/src/store/useAuthStore";
import { changePassword, deleteAccount } from "@/src/services/authService";
import { success, lightImpact } from "@/src/utils/haptics";

export default function SecuritySettingsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const logout = useAuthStore((s) => s.logout);

    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPass.trim()) {
            Alert.alert("Hata", "Mevcut şifrenizi girin.");
            return;
        }
        if (newPass.length < 8) {
            Alert.alert("Hata", "Yeni şifre en az 8 karakter olmalıdır.");
            return;
        }
        if (newPass !== confirmPass) {
            Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword(currentPass, newPass);
            success();
            Alert.alert("Başarılı ✅", result.message);
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
        } catch (err: any) {
            Alert.alert("Hata", err.message || "Şifre değiştirilemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        lightImpact();
        Alert.alert(
            "⚠️ Hesabı Sil",
            "Bu işlem geri alınamaz! Tüm verileriniz, postlarınız, mesajlarınız ve eşleşmeleriniz kalıcı olarak silinecektir.\n\nDevam etmek istiyor musunuz?",
            [
                { text: "Vazgeç", style: "cancel" },
                {
                    text: "Hesabımı Sil",
                    style: "destructive",
                    onPress: async () => {
                        setDeleteLoading(true);
                        try {
                            await deleteAccount();
                            success();
                            logout();
                            router.replace("/login");
                            Alert.alert("Hesap Silindi", "Hesabınız kalıcı olarak silindi.");
                        } catch (err: any) {
                            Alert.alert("Hata", err.message || "Hesap silinemedi.");
                        } finally {
                            setDeleteLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
            <View style={[styles.header, { borderBottomColor: colors.surface.border, paddingTop: insets.top + spacing.md }]}>
                <View style={styles.backBtn}>
                    <BackButton onPress={() => { lightImpact(); router.back(); }} />
                </View>
                <Text style={[createTextStyle("title", colors.text.primary), styles.headerTitle]}>Şifre ve Güvenlik</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Şifre Değiştir */}
                <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>ŞİFRE DEĞİŞTİR</Text>
                <View style={[styles.card, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.surface.border }]}
                        placeholder="Mevcut şifre"
                        placeholderTextColor={colors.text.tertiary}
                        secureTextEntry
                        value={currentPass}
                        onChangeText={setCurrentPass}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.surface.border }]}
                        placeholder="Yeni şifre (min 8 karakter)"
                        placeholderTextColor={colors.text.tertiary}
                        secureTextEntry
                        value={newPass}
                        onChangeText={setNewPass}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, styles.inputLast, { color: colors.text.primary }]}
                        placeholder="Yeni şifre tekrar"
                        placeholderTextColor={colors.text.tertiary}
                        secureTextEntry
                        value={confirmPass}
                        onChangeText={setConfirmPass}
                        autoCapitalize="none"
                    />
                </View>

                <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: colors.accent.primary, opacity: loading ? 0.6 : 1 }]}
                    onPress={handleChangePassword}
                    disabled={loading}
                    activeOpacity={0.7}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.primaryBtnText}>Şifreyi Değiştir</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => {
                        lightImpact();
                        router.push("/forgot-password" as any);
                    }}
                    style={styles.forgotLink}
                >
                    <Text style={[styles.forgotText, { color: colors.accent.primary }]}>
                        Şifreni mi unuttun?
                    </Text>
                </TouchableOpacity>

                {/* Hesap Silme */}
                <View style={styles.dangerSection}>
                    <Text style={[styles.sectionTitle, { color: colors.semantic.error }]}>TEHLİKE BÖLGESİ</Text>
                    <View style={[styles.dangerCard, { borderColor: colors.semantic.error + "40" }]}>
                        <Text style={[styles.dangerTitle, { color: colors.text.primary }]}>Hesabı Kalıcı Olarak Sil</Text>
                        <Text style={[styles.dangerDesc, { color: colors.text.secondary }]}>
                            Hesabınız ve tüm verileriniz geri dönüşümsüz olarak silinecektir. Bu işlem geri alınamaz.
                        </Text>
                        <TouchableOpacity
                            style={[styles.dangerBtn, { borderColor: colors.semantic.error }]}
                            onPress={handleDeleteAccount}
                            disabled={deleteLoading}
                            activeOpacity={0.7}
                        >
                            {deleteLoading ? (
                                <ActivityIndicator color={colors.semantic.error} size="small" />
                            ) : (
                                <Text style={[styles.dangerBtnText, { color: colors.semantic.error }]}>
                                    Hesabımı Sil
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.base,
        paddingVertical: spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: { minWidth: 60, alignItems: "flex-start" },
    headerTitle: { fontSize: 18, fontWeight: "700" },
    scroll: { flex: 1 },
    content: { padding: spacing.base, paddingBottom: spacing.xxl },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.8,
        marginBottom: 8,
        marginTop: 24,
    },
    card: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: "hidden",
    },
    input: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    inputLast: {
        borderBottomWidth: 0,
    },
    primaryBtn: {
        marginTop: 16,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
    },
    primaryBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    forgotLink: {
        marginTop: 12,
        alignItems: "center",
    },
    forgotText: {
        fontSize: 14,
        fontWeight: "600",
    },
    dangerSection: {
        marginTop: 40,
    },
    dangerCard: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
    },
    dangerTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 8,
    },
    dangerDesc: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16,
    },
    dangerBtn: {
        borderRadius: 10,
        borderWidth: 1.5,
        paddingVertical: 12,
        alignItems: "center",
    },
    dangerBtnText: {
        fontSize: 15,
        fontWeight: "700",
    },
});
