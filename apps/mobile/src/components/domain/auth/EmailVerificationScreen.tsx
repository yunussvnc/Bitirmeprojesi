/**
 * E‑posta Doğrulama Ekranı
 * Kayıt sonrası kullanıcıya 6 haneli kod girişi yaptırır.
 * Master hava: karanlık arka plan, cam kart, premium tipografi.
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import { lightImpact, success as successHaptic } from '@/src/utils/haptics';
import { verifyEmail, resendVerification, verifyRegister, resendRegisterCode } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';

const { width } = Dimensions.get('window');
const CODE_LENGTH = 6;

export default function EmailVerificationScreen() {
    const { email: paramsEmailRaw } = useLocalSearchParams<{ email: string }>();
    const paramsEmail = paramsEmailRaw ? decodeURIComponent(paramsEmailRaw) : undefined;
    const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState('');
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const user = useAuthStore((s) => s.user);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
        return () => clearInterval(t);
    }, [resendCooldown]);

    // Start with 60s cooldown on mount (code was just sent)
    useEffect(() => {
        setResendCooldown(60);
    }, []);

    const triggerShake = useCallback(() => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    }, [shakeAnim]);

    const handleCodeChange = useCallback(
        (text: string, index: number) => {
            const digit = text.replace(/[^0-9]/g, '').slice(-1);
            const newCode = [...code];
            newCode[index] = digit;
            setCode(newCode);
            setError('');

            if (digit && index < CODE_LENGTH - 1) {
                inputRefs.current[index + 1]?.focus();
            }

            // Auto-submit when all digits filled
            if (digit && index === CODE_LENGTH - 1 && newCode.every((d) => d !== '')) {
                handleVerify(newCode.join(''));
            }
        },
        [code],
    );

    const handleKeyPress = useCallback(
        (key: string, index: number) => {
            if (key === 'Backspace' && !code[index] && index > 0) {
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
                inputRefs.current[index - 1]?.focus();
            }
        },
        [code],
    );

    const handleVerify = useCallback(
        async (fullCode?: string) => {
            const codeStr = fullCode ?? code.join('');
            if (codeStr.length !== CODE_LENGTH) {
                setError('Lütfen 6 haneli kodu eksiksiz girin.');
                triggerShake();
                return;
            }

            Keyboard.dismiss();
            lightImpact();
            setLoading(true);
            setError('');

            try {
                if (paramsEmail) {
                    const data = await verifyRegister(paramsEmail, codeStr);
                    successHaptic();
                    useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
                    useAuthStore.getState().setUser(data.user);
                    router.replace('/(tabs)');
                } else {
                    await verifyEmail(codeStr);
                    successHaptic();
                    const currentUser = useAuthStore.getState().user;
                    if (currentUser) {
                        useAuthStore.getState().setUser({ ...currentUser, is_email_verified: true });
                    }
                    router.replace('/(tabs)');
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'Kod hatalı veya süresi dolmuş.';
                setError(msg);
                triggerShake();
                setCode(Array(CODE_LENGTH).fill(''));
                inputRefs.current[0]?.focus();
            } finally {
                setLoading(false);
            }
        },
        [code, triggerShake, paramsEmail],
    );

    const handleResend = useCallback(async () => {
        if (resendCooldown > 0) return;
        lightImpact();
        try {
            if (paramsEmail) {
                await resendRegisterCode(paramsEmail);
            } else {
                await resendVerification();
            }
            setResendCooldown(60);
            Alert.alert('Başarılı', 'Yeni doğrulama kodu e-postanıza gönderildi.');
        } catch {
            Alert.alert('Hata', 'Kod gönderilemedi, lütfen tekrar deneyin.');
        }
    }, [resendCooldown, paramsEmail]);

    const targetEmail = paramsEmail || user?.email;
    const maskedEmail = targetEmail
        ? targetEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        : '***';

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0a0a0a', '#1a1025', '#0a0a0a']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.content}>
                        {/* Header */}
                        <View style={styles.headerSection}>
                            <View style={styles.iconWrap}>
                                <Text style={styles.iconEmoji}>📧</Text>
                            </View>
                            <Text style={styles.title}>E-posta Doğrulama</Text>
                            <Text style={styles.subtitle}>
                                <Text style={styles.subtitleBold}>{maskedEmail}</Text> adresine
                                gönderilen 6 haneli kodu girin.
                            </Text>
                        </View>

                        {/* Code Input */}
                        <BlurView intensity={80} tint="dark" style={styles.card}>
                            <View style={styles.cardInner}>
                                <Animated.View
                                    style={[
                                        styles.codeRow,
                                        { transform: [{ translateX: shakeAnim }] },
                                    ]}
                                >
                                    {Array.from({ length: CODE_LENGTH }).map((_, i) => (
                                        <TextInput
                                            key={i}
                                            ref={(r) => {
                                                inputRefs.current[i] = r;
                                            }}
                                            style={[
                                                styles.codeInput,
                                                code[i] ? styles.codeInputFilled : null,
                                                error ? styles.codeInputError : null,
                                            ]}
                                            value={code[i]}
                                            onChangeText={(t) => handleCodeChange(t, i)}
                                            onKeyPress={({ nativeEvent }) =>
                                                handleKeyPress(nativeEvent.key, i)
                                            }
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            selectTextOnFocus
                                            autoFocus={i === 0}
                                        />
                                    ))}
                                </Animated.View>

                                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                                <TouchableOpacity
                                    style={[
                                        styles.verifyButton,
                                        loading && styles.verifyButtonDisabled,
                                    ]}
                                    onPress={() => handleVerify()}
                                    disabled={loading}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.verifyButtonText}>
                                        {loading ? 'Doğrulanıyor...' : 'Doğrula'}
                                    </Text>
                                </TouchableOpacity>

                                <View style={styles.resendRow}>
                                    <Text style={styles.resendLabel}>Kod gelmedi mi? </Text>
                                    <TouchableOpacity
                                        onPress={handleResend}
                                        disabled={resendCooldown > 0}
                                    >
                                        <Text
                                            style={[
                                                styles.resendLink,
                                                resendCooldown > 0 && styles.resendLinkDisabled,
                                            ]}
                                        >
                                            {resendCooldown > 0
                                                ? `Tekrar gönder (${resendCooldown}s)`
                                                : 'Tekrar gönder'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </BlurView>

                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    safeArea: { flex: 1 },
    keyboardView: { flex: 1 },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    iconEmoji: { fontSize: 40 },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#ffffff',
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 16,
    },
    subtitleBold: {
        fontWeight: '700',
        color: 'rgba(255,255,255,0.95)',
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    cardInner: {
        padding: 28,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center',
    },
    codeRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
    },
    codeInput: {
        width: (width - 48 - 56 - 50) / CODE_LENGTH, // dynamic sizing
        height: 56,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        color: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
    },
    codeInputFilled: {
        borderColor: 'rgba(255,255,255,0.5)',
        backgroundColor: 'rgba(255,255,255,0.14)',
    },
    codeInputError: {
        borderColor: '#ff5252',
    },
    errorText: {
        color: '#ff5252',
        fontSize: 13,
        marginBottom: 16,
        textAlign: 'center',
    },
    verifyButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        marginBottom: 20,
    },
    verifyButtonDisabled: {
        opacity: 0.5,
    },
    verifyButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#0a0a0a',
        letterSpacing: 0.4,
    },
    resendRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    resendLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#ffffff',
        textDecorationLine: 'underline',
    },
    resendLinkDisabled: {
        color: 'rgba(255,255,255,0.4)',
        textDecorationLine: 'none',
    },
});
