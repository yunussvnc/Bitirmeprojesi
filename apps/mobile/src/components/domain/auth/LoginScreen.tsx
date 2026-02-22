/**
 * Premium Login Screen
 *
 * Arka planda mekan görselleri carousel, profesyonel tipografi,
 * koyu overlay ile okunabilir form. Üst düzey giriş deneyimi.
 *
 * @module screens/LoginScreen
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact, success } from '@/src/utils/haptics';
import { getAllPlaces } from '@/src/services/mekanService';
import { loginUser } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { API_BASE_URL } from '@/src/constants/api';

const { width, height } = Dimensions.get('window');

// API yoksa veya fotoğraf yoksa kullanılacak kaliteli mekan görselleri
const FALLBACK_PLACE_IMAGES = [
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200',
  'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200',
  'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200',
];

const CAROUSEL_INTERVAL_MS = 4500;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [backgroundImages, setBackgroundImages] = useState<string[]>(FALLBACK_PLACE_IMAGES);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isSubmittingRef = useRef(false);

  // Mekan fotoğraflarını API'den al
  useEffect(() => {
    let cancelled = false;
    getAllPlaces()
      .then((places) => {
        if (cancelled) return;
        const urls = places
          .map((p) => p.photo_url)
          .filter((url): url is string => !!url)
          .map((url) => (url.startsWith('http') ? url : `${API_BASE_URL.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`));
        if (urls.length >= 5) {
          setBackgroundImages(urls.slice(0, 12));
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  // Arka plan carousel: her CAROUSEL_INTERVAL_MS'de bir sonraki görsel
  const imageCount = Math.max(1, backgroundImages.length);
  useEffect(() => {
    const next = () => {
      Animated.timing(fadeAnim, {
        toValue: 0.3,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setCurrentImageIndex((i) => (i + 1) % imageCount);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      });
    };
    const interval = setInterval(next, CAROUSEL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [imageCount, fadeAnim]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = 'E-posta gereklidir';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = 'Geçerli bir e-posta adresi girin';
    if (!password.trim()) newErrors.password = 'Şifre gereklidir';
    else if (password.length < 6) newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!validateForm()) return;
    isSubmittingRef.current = true;
    lightImpact();
    setLoading(true);
    try {
      const data = await loginUser({ email: email.trim(), password });
      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      useAuthStore.getState().setUser(data.user);
      success();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş başarısız. Lütfen tekrar deneyin.';
      setErrors({ email: msg });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }, [validateForm, email, password]);

  const handleSocialLogin = useCallback((provider: string) => {
    lightImpact();
    Alert.alert('Bilgi', `${provider} ile giriş yakında eklenecek.`, [{ text: 'Tamam' }]);
  }, []);

  const clearEmailError = useCallback(() => {
    setErrors((prev) => (prev.email ? { ...prev, email: undefined } : prev));
  }, []);
  const clearPasswordError = useCallback(() => {
    setErrors((prev) => (prev.password ? { ...prev, password: undefined } : prev));
  }, []);

  const currentImage = backgroundImages[Math.min(currentImageIndex, imageCount - 1)] ?? FALLBACK_PLACE_IMAGES[0];

  return (
    <View style={styles.container}>
      {/* Arka plan: mekan görselleri carousel */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: currentImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <Image
            source={{ uri: currentImage }}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Koyu gradient overlay – metin ve form okunabilir olsun */}
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
            <View style={styles.content} pointerEvents="box-none">
              <View style={styles.topBlock}>
                {/* Marka & slogan – profesyonel tipografi */}
                <View style={styles.header}>
                  <Text style={styles.brandTitle}>ASEMOS</Text>
                  <Text style={styles.tagline}>
                    Seni dinleyen, öneren, yönlendiren rehberin
                  </Text>
                </View>

                {/* Form kartı – koyu cam efekti */}
                <BlurView intensity={90} tint="dark" style={styles.card}>
                  <View style={styles.cardInner}>
                    <Input
                      variant="onDark"
                      label="E-posta"
                      placeholder="ornek@email.com"
                      value={email}
                      onChangeText={(t) => {
                        setEmail(t);
                        clearEmailError();
                      }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      error={errors.email}
                      containerStyle={styles.inputContainer}
                    />
                    <Input
                      variant="onDark"
                      label="Şifre"
                      placeholder="••••••••"
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        clearPasswordError();
                      }}
                      secureTextEntry
                      autoComplete="password"
                      error={errors.password}
                      containerStyle={styles.inputContainer}
                    />
                    <TouchableOpacity
                      onPress={() => lightImpact()}
                      style={styles.forgotWrap}
                    >
                      <Text style={styles.forgotText}>Şifreni mi unuttun?</Text>
                    </TouchableOpacity>
                    <Button
                      variant="primary"
                      size="large"
                      onPress={handleLogin}
                      loading={loading}
                      disabled={loading}
                      style={styles.loginButton}
                    >
                      Giriş Yap
                    </Button>

                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerLabel}>veya</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialRow}>
                      <TouchableOpacity
                        onPress={() => handleSocialLogin('Google')}
                        style={styles.socialBtnGoogle}
                      >
                        <Text style={styles.socialIconG}>G</Text>
                        <Text style={styles.socialBtnTextGoogle}>Google</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleSocialLogin('Apple')}
                        style={styles.socialBtnApple}
                      >
                        <IconSymbol name="apple.logo" size={20} color="#fff" />
                        <Text style={styles.socialBtnTextWhite}>Apple</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </BlurView>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer ekranın en altında sabit – klavye açıldığında formun üstüne taşınmaz */}
        <TouchableOpacity
          style={[styles.footerFixed, { paddingBottom: 16 + insets.bottom }]}
          onPress={() => {
            Keyboard.dismiss();
            lightImpact();
            router.push('/register');
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.footerLabel}>Hesabın yok mu? </Text>
          <Text style={styles.footerLink}>Kayıt Ol</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
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
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 56,
  },
  topBlock: {
    flex: 1,
  },
  backgroundImage: {
    width,
    height,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  logoEmoji: {
    fontSize: 44,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 3,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  tagline: {
    fontSize: 17,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.4,
    lineHeight: 26,
    textAlign: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 12,
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
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 22,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  loginButton: {
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dividerLabel: {
    marginHorizontal: 18,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.8,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 14,
  },
  socialBtnGoogle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    gap: 10,
  },
  socialBtnApple: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.82)',
    gap: 10,
  },
  socialIconG: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  socialBtnTextGoogle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  socialBtnTextWhite: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footerFixed: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
  },
  footerLabel: {
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
