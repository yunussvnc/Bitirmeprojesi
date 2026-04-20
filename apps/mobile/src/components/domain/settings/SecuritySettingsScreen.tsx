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
import { useTranslation } from "react-i18next";
import { IconSymbol } from "@/src/components/ui/icon-symbol";
import { handleApiError } from "@/src/utils/errorHandler";

export default function SecuritySettingsScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const logout = useAuthStore((s) => s.logout);
    const { t } = useTranslation();

    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleChangePassword = async () => {
        if (!currentPass.trim()) {
            Alert.alert(t("common.error"), t("settings_extra.err_current_pwd"));
            return;
        }
        if (newPass.length < 8) {
            Alert.alert(t("common.error"), t("settings_extra.err_pwd_len"));
            return;
        }
        if (newPass !== confirmPass) {
            Alert.alert(t("common.error"), t("settings_extra.err_pwd_match"));
            return;
        }

        setLoading(true);
        try {
            const result = await changePassword(currentPass, newPass);
            success();
            Alert.alert(t("common.success"), result.message);
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = () => {
        lightImpact();
        Alert.alert(
            t("settings_extra.delete_account"),
            t("settings_extra.delete_confirm"),
            [
                { text: t("common.cancel"), style: "cancel" },
                {
                    text: t("settings_extra.delete_btn"),
                    style: "destructive",
                    onPress: async () => {
                        setDeleteLoading(true);
                        try {
                            await deleteAccount();
                            success();
                            logout();
                            router.replace("/login");
                        } catch (err: any) {
                            handleApiError(err);
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
                <TouchableOpacity onPress={() => { lightImpact(); router.back(); }} hitSlop={12} style={styles.backBtn}>
                    <IconSymbol name="chevron.left" size={24} color={colors.accent.primary} />
                </TouchableOpacity>
                <Text style={[createTextStyle("title", colors.text.primary), styles.headerTitle]}>{t("settings_extra.sec_title")}</Text>
                <View style={styles.backBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>{t("settings_extra.change_pwd")}</Text>
                <View style={[styles.card, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.surface.border }]}
                        placeholder={t("settings_extra.current_pwd")}
                        placeholderTextColor={colors.text.tertiary}
                        secureTextEntry
                        value={currentPass}
                        onChangeText={setCurrentPass}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, { color: colors.text.primary, borderBottomColor: colors.surface.border }]}
                        placeholder={t("settings_extra.new_pwd")}
                        placeholderTextColor={colors.text.tertiary}
                        secureTextEntry
                        value={newPass}
                        onChangeText={setNewPass}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, styles.inputLast, { color: colors.text.primary }]}
                        placeholder={t("settings_extra.new_pwd_confirm")}
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
                        <Text style={styles.primaryBtnText}>{t("settings_extra.change_pwd_btn")}</Text>
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
                        {t("settings_extra.forgot_pwd")}
                    </Text>
                </TouchableOpacity>

                <View style={styles.dangerSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>{t("settings_extra.danger_zone")}</Text>
                    <View style={[styles.dangerCard, { backgroundColor: colors.surface.elevated, borderColor: colors.semantic.error + '40' }]}>
                        <Text style={[styles.dangerTitle, { color: colors.semantic.error }]}>{t("settings_extra.delete_account")}</Text>
                        <Text style={[styles.dangerDesc, { color: colors.text.secondary }]}>{t("settings_extra.delete_desc")}</Text>
                        <TouchableOpacity
                            style={[styles.dangerBtn, { borderColor: colors.semantic.error, opacity: deleteLoading ? 0.6 : 1 }]}
                            onPress={handleDeleteAccount}
                            disabled={deleteLoading}
                            activeOpacity={0.7}
                        >
                            {deleteLoading ? (
                                <ActivityIndicator color={colors.semantic.error} size="small" />
                            ) : (
                                <Text style={[styles.dangerBtnText, { color: colors.semantic.error }]}>
                                    {t("settings_extra.delete_btn")}
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
