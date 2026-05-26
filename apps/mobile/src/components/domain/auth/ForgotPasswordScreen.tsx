/**
 * Forgot Password Screen
 *
 * İki aşamalı form:
 * 1. Email gir → backend email atar
 * 2. Kod + yeni şifre gir → backend şifreyi sıfırlar
 *
 * Login ekranındaki premium tasarım diline uyumlu.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button, Input } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, success } from '@/src/utils/haptics';
import { forgotPassword, resetPassword, loginUser } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get('window');

const BG_IMAGE = 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200';

type Step = 'email' | 'reset';

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const { t } = useTranslation();

    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const handleSendCode = useCallback(async () => {
        Keyboard.dismiss();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
            setErrors({ email: t('forgot_password.email_required') });
            return;
        }
        if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
            setErrors({ email: t('forgot_password.invalid_email') });
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await forgotPassword(trimmedEmail);
            success();
            setStep('reset');
            Alert.alert(t('forgot_password.code_sent'), t('forgot_password.check_email'));
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || t('forgot_password.error');
            Alert.alert(t('forgot_password.error_title'), msg);
        } finally {
            setLoading(false);
        }
    }, [email, t]);

    const handleResetPassword = useCallback(async () => {
        Keyboard.dismiss();
        const trimmedCode = code.trim();
        const trimmedPassword = newPassword.trim();

        const newErrors: Record<string, string> = {};
        if (!trimmedCode) newErrors.code = t('forgot_password.code_required');
        if (!trimmedPassword) newErrors.newPassword = t('forgot_password.password_required');
        else if (trimmedPassword.length < 8) newErrors.newPassword = t('forgot_password.password_short');
        else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*([^\w\s]|_))/.test(trimmedPassword)) {
            newErrors.newPassword = t('forgot_password.password_weak');
        }
        if (trimmedPassword !== confirmPassword.trim()) newErrors.confirmPassword = t('forgot_password.passwords_mismatch');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        setLoading(true);
        try {
            await resetPassword(email.trim().toLowerCase(), trimmedCode, trimmedPassword);

            const tokens = await loginUser({ email: email.trim().toLowerCase(), password: trimmedPassword });
            useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
            if (tokens.user) {
                useAuthStore.getState().setUser(tokens.user);
            }

            success();
            Alert.alert(
                t('forgot_password.success_title'),
                t('forgot_password.success_message'),
                [{ text: t('forgot_password.ok'), onPress: () => router.replace('/(tabs)/' as any) }]
            );
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || t('forgot_password.error');
            Alert.alert(t('forgot_password.error_title'), msg);
        } finally {
            setLoading(false);
        }
    }, [email, code, newPassword, confirmPassword, t]);

    return (
        <View style={styles.container}>
            <Animated.Image
                source={{ uri: BG_IMAGE }}
                style={[styles.bgImage, { opacity: fadeAnim }]}
                blurRadius={Platform.OS === 'ios' ? 8 : 4}
                resizeMode="cover"
            />
            <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.75)', 'rgba(0,0,0,0.92)']}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    style={styles.keyboardView}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.content}>
                                    <View style={styles.header}>
                                        <TouchableOpacity
                                            onPress={() => {
                                                lightImpact();
                                                if (step === 'reset') {
                                                    setStep('email');
                                                    setErrors({});
                                                } else {
                                                    router.back();
                                                }
                                            }}
                                            style={styles.backBtn}
                                            activeOpacity={0.7}
                                        >
                                            <IconSymbol name="chevron.left" size={24} color="#fff" />
                                        </TouchableOpacity>

                                        <View style={styles.headerCenter}>
                                            <View style={styles.iconWrap}>
                                                <IconSymbol name="lock.rotation" size={36} color="#fff" />
                                            </View>
                                            <Text style={styles.title}>
                                                {step === 'email' ? t('forgot_password.title') : t('forgot_password.reset_title')}
                                            </Text>
                                            <Text style={styles.subtitle}>
                                                {step === 'email'
                                                    ? t('forgot_password.subtitle_email')
                                                    : t('forgot_password.subtitle_reset')}
                                            </Text>
                                        </View>
                                    </View>

                                    <BlurView intensity={90} tint="dark" style={styles.card}>
                                        <View style={styles.cardInner}>
                                            {step === 'email' ? (
                                                <>
                                                    <Input
                                                        variant="onDark"
                                                        label={t('forgot_password.email')}
                                                        placeholder="ornek@email.com"
                                                        value={email}
                                                        onChangeText={(t) => {
                                                            setEmail(t);
                                                            setErrors((prev) => ({ ...prev, email: '' }));
                                                        }}
                                                        keyboardType="email-address"
                                                        autoCapitalize="none"
                                                        autoComplete="email"
                                                        error={errors.email}
                                                        containerStyle={styles.inputContainer}
                                                    />
                                                    <Button
                                                        variant="primary"
                                                        size="large"
                                                        onPress={handleSendCode}
                                                        loading={loading}
                                                        disabled={loading}
                                                        style={styles.actionButton}
                                                    >
                                                        {t('forgot_password.send_code')}
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={styles.emailBadge}>
                                                        <IconSymbol name="envelope.fill" size={14} color="rgba(255,255,255,0.7)" />
                                                        <Text style={styles.emailBadgeText}>{email}</Text>
                                                    </View>
                                                    <Input
                                                        variant="onDark"
                                                        label={t('forgot_password.code')}
                                                        placeholder="123456"
                                                        value={code}
                                                        onChangeText={(t) => {
                                                            setCode(t);
                                                            setErrors((prev) => ({ ...prev, code: '' }));
                                                        }}
                                                        keyboardType="number-pad"
                                                        autoComplete="one-time-code"
                                                        error={errors.code}
                                                        containerStyle={styles.inputContainer}
                                                    />
                                                    <Input
                                                        variant="onDark"
                                                        label={t('forgot_password.new_password')}
                                                        placeholder="••••••••"
                                                        value={newPassword}
                                                        onChangeText={(t) => {
                                                            setNewPassword(t);
                                                            setErrors((prev) => ({ ...prev, newPassword: '' }));
                                                        }}
                                                        secureTextEntry
                                                        error={errors.newPassword}
                                                        containerStyle={styles.inputContainer}
                                                    />
                                                    <Input
                                                        variant="onDark"
                                                        label={t('forgot_password.confirm_password')}
                                                        placeholder="••••••••"
                                                        value={confirmPassword}
                                                        onChangeText={(t) => {
                                                            setConfirmPassword(t);
                                                            setErrors((prev) => ({ ...prev, confirmPassword: '' }));
                                                        }}
                                                        secureTextEntry
                                                        error={errors.confirmPassword}
                                                        containerStyle={styles.inputContainer}
                                                    />
                                                    <Button
                                                        variant="primary"
                                                        size="large"
                                                        onPress={handleResetPassword}
                                                        loading={loading}
                                                        disabled={loading}
                                                        style={styles.actionButton}
                                                    >
                                                        {t('forgot_password.reset_button')}
                                                    </Button>

                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            lightImpact();
                                                            handleSendCode();
                                                        }}
                                                        style={styles.resendWrap}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={styles.resendText}>{t("forgot_password.resend_code")}</Text>
                                                    </TouchableOpacity>
                                                </>
                                            )}
                                        </View>
                                    </BlurView>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </ScrollView>

                    <TouchableOpacity onPress={() => router.push('/login')} style={styles.footer}>
                        <Text style={styles.footerText}>{t("forgot_password.remember_password")} </Text>
                        <Text style={styles.footerLink}>{t("forgot_password.login")}</Text>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    bgImage: {
        position: 'absolute',
        width,
        height,
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
    },
    header: {
        marginBottom: 24,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    headerCenter: {
        alignItems: 'center',
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
    },
    title: {
        fontSize: 30,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
        color: 'rgba(255,255,255,0.85)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    card: {
        width: '100%',
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 24,
        elevation: 16,
    },
    cardInner: {
        padding: 26,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },
    inputContainer: {
        marginBottom: 18,
    },
    actionButton: {
        marginTop: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    emailBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 18,
    },
    emailBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
    },
    resendWrap: {
        alignSelf: 'center',
        marginTop: 18,
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 16,
        paddingHorizontal: 24,
    },
    footerText: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
    },
    footerLink: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
        textDecorationLine: 'underline',
        letterSpacing: 0.3,
    },
});
