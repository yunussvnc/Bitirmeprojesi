/**
 * Kayıt ekranı – Giriş ekranı ile aynı tasarım
 * Arka planda mekan carousel, koyu overlay, cam kart, onDark inputlar.
 * Kaydırma yok.
 *
 * @module screens/RegisterScreen
 */

import { router } from 'expo-router';
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
  Image,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, success } from '@/src/utils/haptics';
import { getAllPlaces } from '@/src/services/mekanService';
import { registerUser, googleLogin, appleLogin } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { API_BASE_URL } from '@/src/constants/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

const FALLBACK_PLACE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200', // Aydınlık kahveci
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200', // Aydınlık bir kafe içi
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200',
  'https://images.unsplash.com/photo-1521017430209-a6cb9156a64b?w=1200', // Işıklı iç mekan
];

const CAROUSEL_INTERVAL_MS = 4500;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBirthDateInfo, setShowBirthDateInfo] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    birthDate?: string;
  }>({});
  const isSubmittingRef = useRef(false);

  // Google Auth Setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'TODO_YOUR_GOOGLE_CLIENT_ID_WEB',
    iosClientId: 'TODO_YOUR_GOOGLE_CLIENT_ID_IOS',
    androidClientId: 'TODO_YOUR_GOOGLE_CLIENT_ID_ANDROID',
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      handleGoogleSuccess(response.authentication.idToken || response.authentication.accessToken);
    }
  }, [response]);

  const handleGoogleSuccess = async (token: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await googleLogin(token);
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      useAuthStore.getState().setUser(data.user);
      success();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Giriş Hatası', err.message || 'Google ile giriş başarısız oldu.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithApple = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        setLoading(true);
        const data = await appleLogin(credential.identityToken);
        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        useAuthStore.getState().setUser(data.user);
        success();
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // Kullanıcı iptal etti
      } else {
        Alert.alert('Giriş Hatası', 'Apple ile giriş başarısız oldu.');
      }
    } finally {
      setLoading(false);
    }
  };



  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (!fullName.trim()) newErrors.fullName = 'Ad soyad gereklidir';
    else if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) newErrors.fullName = 'Ad ve soyad girin';
    if (!email.trim()) newErrors.email = 'E-posta gereklidir';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Geçerli bir e-posta adresi girin';
    if (!password.trim()) newErrors.password = 'Şifre gereklidir';
    else if (password.length < 8) newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*([^\w\s]|_))/.test(password)) {
      newErrors.password = 'Büyük harf, küçük harf, rakam ve özel harf girmelisin';
    }
    if (!confirmPassword.trim()) newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    if (!birthDate.trim()) newErrors.birthDate = 'Doğum tarihi gereklidir';
    else {
      const parts = birthDate.split('/');
      if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
        newErrors.birthDate = 'GG/AA/YYYY formatında girin';
      } else {
        const day = parseInt(parts[0]), month = parseInt(parts[1]), year = parseInt(parts[2]);
        const d = new Date(year, month - 1, day);
        if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month - 1) {
          newErrors.birthDate = 'Geçerli bir tarih girin';
        } else {
          const today = new Date();
          if (d > today) {
            newErrors.birthDate = 'Gelecekte bir tarih girilemez';
          } else {
            let age = today.getFullYear() - d.getFullYear();
            const m = today.getMonth() - d.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
            if (age <= 13) {
              newErrors.birthDate = '14 yaşından küçükler uygulamaya kayıt olamaz';
            } else if (age > 120) {
              newErrors.birthDate = 'Geçerli bir doğum tarihi girin';
            }
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, email, password, confirmPassword, birthDate]);

  const handleRegister = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!validateForm()) return;
    isSubmittingRef.current = true;
    lightImpact();
    setLoading(true);
    try {
      const nameParts = fullName.trim().split(' ');
      const first_name = nameParts[0];
      const last_name = nameParts.slice(1).join(' ') || undefined;
      // Convert DD/MM/YYYY to YYYY-MM-DD for API
      const bdParts = birthDate.split('/');
      const birth_date_api = `${bdParts[2]}-${bdParts[1]}-${bdParts[0]}`;
      const data = await registerUser({
        email: email.trim(),
        password,
        first_name,
        last_name,
        birth_date: birth_date_api,
      });
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      useAuthStore.getState().setUser(data.user);
      success();
      router.replace('/verify-email');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kayıt başarısız. Lütfen tekrar deneyin.';
      setErrors({ email: msg });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }, [validateForm, fullName, email, password, birthDate]);

  const handleSocialRegister = useCallback((provider: string) => {
    lightImpact();
    if (provider === 'Apple') {
      signInWithApple();
    } else if (provider === 'Google') {
      promptAsync();
    }
  }, [promptAsync]);

  const clearFieldError = useCallback((field: keyof typeof errors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const currentImage = FALLBACK_PLACE_IMAGES[0];

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Image source={{ uri: currentImage }} style={styles.backgroundImage} resizeMode="cover" />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.4, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <View style={styles.content} pointerEvents="box-none">
                  <View style={styles.topBlock}>
                    {/* Header (isim ve slogan) kaldırıldı */}

                    <BlurView intensity={90} tint="dark" style={styles.card}>
                      <View style={styles.cardInner}>
                        <Input
                          variant="onDark"
                          label="Ad Soyad"
                          placeholder="Adınız Soyadınız"
                          value={fullName}
                          onChangeText={(t) => { setFullName(t); clearFieldError('fullName'); }}
                          autoCapitalize="words"
                          error={errors.fullName}
                          containerStyle={styles.inputContainer}
                        />
                        <Input
                          variant="onDark"
                          label="E-posta"
                          placeholder="ornek@email.com"
                          value={email}
                          onChangeText={(t) => { setEmail(t); clearFieldError('email'); }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          error={errors.email}
                          containerStyle={styles.inputContainer}
                        />
                        <Input
                          variant="onDark"
                          label="Şifre"
                          placeholder="Örn: UcD.7491"
                          value={password}
                          onChangeText={(t) => {
                            setPassword(t);
                            clearFieldError('password');
                            if (confirmPassword && t === confirmPassword) clearFieldError('confirmPassword');
                          }}
                          secureTextEntry
                          autoComplete="password-new"
                          error={errors.password}
                          containerStyle={styles.inputContainer}
                        />
                        <Input
                          variant="onDark"
                          label="Şifre Tekrar"
                          placeholder="Şifreni tekrar gir"
                          value={confirmPassword}
                          onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                          secureTextEntry
                          autoComplete="password-new"
                          error={errors.confirmPassword}
                          containerStyle={styles.inputContainer}
                        />
                        <Input
                          variant="onDark"
                          label="Doğum Tarihi"
                          placeholder="GG/AA/YYYY"
                          value={birthDate}
                          onFocus={() => {
                            setShowBirthDateInfo(true);
                          }}
                          onBlur={() => {
                            setShowBirthDateInfo(false);
                          }}
                          onChangeText={(t: string) => {
                            // Auto-format: add slashes
                            let cleaned = t.replace(/[^0-9/]/g, '');
                            // Remove extra slashes
                            const digits = cleaned.replace(/\//g, '');
                            let formatted = '';
                            for (let i = 0; i < digits.length && i < 8; i++) {
                              if (i === 2 || i === 4) formatted += '/';
                              formatted += digits[i];
                            }
                            setBirthDate(formatted);
                            clearFieldError('birthDate');
                          }}
                          keyboardType="number-pad"
                          error={errors.birthDate}
                          containerStyle={styles.inputContainer}
                          maxLength={10}
                        />
                        {showBirthDateInfo && (
                          <Text style={styles.birthDateInfo}>
                            ℹ️ Uygulamaya kayıt olmak için 14 yaşından büyük olmanız gerekmektedir. Eğer 18 yaşının altındaysanız, uygulama içindeki kullanımı zorunlu olmayan eşleşme ekranına erişemezsiniz. 18 yaşının üstünde iseniz yaş bilginiz bu tarihten hesaplanacaktır.
                          </Text>
                        )}
                        <Button
                          variant="primary"
                          size="large"
                          onPress={handleRegister}
                          loading={loading}
                          disabled={loading}
                          style={styles.registerButton}
                        >
                          Kayıt Ol
                        </Button>

                        <View style={styles.divider}>
                          <View style={styles.dividerLine} />
                          <Text style={styles.dividerLabel}>veya</Text>
                          <View style={styles.dividerLine} />
                        </View>
                        <View style={styles.socialRow}>
                          <TouchableOpacity onPress={() => handleSocialRegister('Google')} style={styles.socialBtnGoogle}>
                            <Text style={styles.socialIconG}>G</Text>
                            <Text style={styles.socialBtnTextGoogle}>Google</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleSocialRegister('Apple')} style={styles.socialBtnApple}>
                            <IconSymbol name="apple.logo" size={20} color="#fff" />
                            <Text style={styles.socialBtnTextWhite}>Apple</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </BlurView>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
          <TouchableOpacity
            style={[styles.footerStatic, { paddingBottom: Math.max(16, insets.bottom + 8) }]}
            onPress={() => { Keyboard.dismiss(); lightImpact(); router.back(); }}
            activeOpacity={0.8}
          >
            <Text style={styles.footerLabel}>Zaten hesabın var mı? </Text>
            <Text style={styles.footerLink}>Giriş Yap</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 60 },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  topBlock: { flex: 1 },
  backgroundImage: { width, height },
  header: { alignItems: 'center', marginBottom: 20 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 36 },
  brandTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  cardInner: { padding: 20, backgroundColor: 'rgba(0,0,0,0.35)' },
  inputContainer: { marginBottom: 14 },
  birthDateInfo: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
    marginBottom: 16,
    marginTop: -8, // input'un hemen dibinde olması için
    paddingHorizontal: 6,
    fontStyle: 'italic',
  },
  registerButton: { marginTop: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  dividerLabel: { marginHorizontal: 18, fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8 },
  socialRow: { flexDirection: 'row', gap: 14 },
  socialBtnGoogle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    gap: 10,
  },
  socialBtnApple: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.82)',
    gap: 10,
  },
  socialIconG: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  socialBtnTextGoogle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  socialBtnTextWhite: { fontSize: 16, fontWeight: '600', color: '#fff' },
  footerStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  footerLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  footerLink: { fontSize: 16, fontWeight: '700', color: '#ffffff', textDecorationLine: 'underline', letterSpacing: 0.3 },
});
