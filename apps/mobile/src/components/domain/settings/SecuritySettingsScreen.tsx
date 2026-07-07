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
import { validatePassword } from "@/src/utils/validators";
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

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

    // Anlık validasyon
    const [pwdErrors, setPwdErrors] = useState<{
        current?: string;
        new?: string;
        confirm?: string;
    }>({});
    const [newPwdStrength, setNewPwdStrength] = useState<{ score: number; strength: 'weak' | 'medium' | 'strong' } | null>(null);

    const handleChangePassword = async () => {
        const newErrors: typeof pwdErrors = {};

        if (!currentPass.trim()) {
            newErrors.current = t("settings_extra.err_current_pwd", "Mevcut şifrenizi giriniz.");
        }

        const pwdRes = validatePassword(newPass);
        if (!pwdRes.valid) {
            newErrors.new = pwdRes.error;
        } else if (newPass !== confirmPass) {
            newErrors.confirm = t("settings_extra.err_pwd_match", "Şifreler eşleşmiyor.");
        }

        setPwdErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        try {
            const result = await changePassword(currentPass, newPass);
            success();
            Alert.alert(t("common.success"), result.message);
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
            setPwdErrors({});
            setNewPwdStrength(null);
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
                            const errorObj = handleApiError(err);
                            Alert.alert(t("common.error"), errorObj.userMessage);
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
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { color: colors.text.primary, borderBottomColor: pwdErrors.current ? '#FF6B6B' : colors.surface.border }]}
                            placeholder={t("settings_extra.current_pwd")}
                            placeholderTextColor={colors.text.tertiary}
                            secureTextEntry
                            textContentType="oneTimeCode"
                            autoComplete="off"
                            value={currentPass}
                            onChangeText={(v) => { setCurrentPass(v); if (pwdErrors.current) setPwdErrors(p => ({...p, current: undefined})); }}
                            autoCapitalize="none"
                        />
                        {pwdErrors.current ? <Text style={styles.fieldErr}>{pwdErrors.current}</Text> : null}
                    </View>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, { color: colors.text.primary, borderBottomColor: pwdErrors.new ? '#FF6B6B' : colors.surface.border }]}
                            placeholder={t("settings_extra.new_pwd")}
                            placeholderTextColor={colors.text.tertiary}
                            secureTextEntry
                            textContentType="oneTimeCode"
                            autoComplete="off"
                            value={newPass}
                            onChangeText={(v) => {
                                setNewPass(v);
                                if (pwdErrors.new) setPwdErrors(p => ({...p, new: undefined}));
                                const r = validatePassword(v);
                                setNewPwdStrength(v ? { score: r.score, strength: r.strength } : null);
                            }}
                            autoCapitalize="none"
                        />
                        {/* Şifre Güç Göstergesi */}
                        {newPass.length > 0 && newPwdStrength && (
                            <View style={styles.strengthContainer}>
                                <View style={styles.strengthBar}>
                                    {[0,1,2,3].map(i => (
                                        <View key={i} style={[styles.strengthSegment, {
                                            backgroundColor: i < newPwdStrength.score
                                                ? newPwdStrength.strength === 'strong' ? '#4ECDC4'
                                                : newPwdStrength.strength === 'medium' ? '#FF9500' : '#FF6B6B'
                                                : colors.surface.border
                                        }]} />
                                    ))}
                                </View>
                                <Text style={[styles.strengthLabel, {
                                    color: newPwdStrength.strength === 'strong' ? '#4ECDC4' : newPwdStrength.strength === 'medium' ? '#FF9500' : '#FF6B6B'
                                }]}>
                                    {newPwdStrength.strength === 'strong' ? 'Çok Güçlü ✓' : newPwdStrength.strength === 'medium' ? 'Orta' : 'Zayıf'}
                                </Text>
                            </View>
                        )}
                        {pwdErrors.new ? <Text style={styles.fieldErr}>{pwdErrors.new}</Text> : null}
                    </View>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={[styles.input, styles.inputLast, { color: colors.text.primary, borderBottomColor: pwdErrors.confirm ? '#FF6B6B' : 'transparent' }]}
                            placeholder={t("settings_extra.new_pwd_confirm")}
                            placeholderTextColor={colors.text.tertiary}
                            secureTextEntry
                            textContentType="oneTimeCode"
                            autoComplete="off"
                            value={confirmPass}
                            onChangeText={(v) => { setConfirmPass(v); if (pwdErrors.confirm) setPwdErrors(p => ({...p, confirm: undefined})); }}
                            autoCapitalize="none"
                        />
                        {pwdErrors.confirm ? <Text style={styles.fieldErr}>{pwdErrors.confirm}</Text> : null}
                    </View>
                </View>

                {/* Şifre kuralları ipucu */}
                <View style={styles.pwdHintBox}>
                    <IconSymbol name="info.circle" size={14} color={colors.text.tertiary} />
                    <Text style={[styles.pwdHintText, { color: colors.text.tertiary }]}>
                        {t("settings_extra.pwd_rules", "En az 8 karakter, büyük harf, küçük harf, rakam ve noktalama işareti içermelidir.")}
                    </Text>
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
    pwdHintBox: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        marginTop: 8,
        marginBottom: 4,
        paddingHorizontal: 4,
    },
    pwdHintText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 17,
    },
    inputWrapper: {
        paddingHorizontal: 0,
    },
    fieldErr: {
        fontSize: 12,
        color: '#FF6B6B',
        fontWeight: '500',
        paddingHorizontal: 16,
        paddingBottom: 8,
        marginTop: -4,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 8,
        marginTop: -4,
    },
    strengthBar: {
        flex: 1,
        flexDirection: 'row',
        gap: 4,
        height: 4,
    },
    strengthSegment: {
        flex: 1,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '700',
        minWidth: 64,
        textAlign: 'right',
    },
});
