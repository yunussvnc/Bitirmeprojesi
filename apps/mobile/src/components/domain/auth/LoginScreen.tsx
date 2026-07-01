/**
 * Premium Login Screen
 *
 * Arka planda mekan gÃ¶rselleri carousel, profesyonel tipografi,
 * koyu overlay ile okunabilir form. Ãœst dÃ¼zey giriÅŸ deneyimi.
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
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, GlassCard } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { useTranslation } from 'react-i18next';
import { lightImpact, success } from '@/src/utils/haptics';
import { loginUser } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useSocialAuth } from '@/src/hooks/useSocialAuth';

const { width, height } = Dimensions.get('window');

// API yoksa veya fotoÄŸraf yoksa kullanÄ±lacak aydÄ±nlÄ±k ve kaliteli mekan gÃ¶rselleri
const FALLBACK_PLACE_IMAGES = [
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200',
  'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200', // AydÄ±nlÄ±k kahveci
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1200', // AydÄ±nlÄ±k bir kafe iÃ§i
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
  'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200', // AydÄ±nlÄ±k restoran
];

const CAROUSEL_INTERVAL_MS = 4500;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleType, setRoleType] = useState<'user'|'venue'>('user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const isSubmittingRef = useRef(false);

  const { loading: socialLoading, promptGoogle, signInWithApple } = useSocialAuth(roleType, 'login');
  const formLoading = loading || socialLoading;

  const validateForm = useCallback((): boolean => {
    const newErrors: { email?: string; password?: string; general?: string } = {};
    if (!email.trim()) newErrors.email = t('auth.err_email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = t('auth.err_email_invalid');
    if (!password.trim()) newErrors.password = t('auth.err_password_required');
    else if (password.length < 6) newErrors.password = t('auth.err_password_short_6');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, t]);

  const handleLogin = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!validateForm()) return;
    isSubmittingRef.current = true;
    lightImpact();
    setLoading(true);
    try {
      const data = await loginUser({ email: email.trim(), password });
      
      // Check role mismatch purely for UX
      if (roleType === 'venue' && data.user.role !== 'venue') {
        throw new Error('GirdiÄŸiniz hesap bir mekan hesabÄ± deÄŸil. LÃ¼tfen "KullanÄ±cÄ±" sekmesinden giriÅŸ yapÄ±n.');
      } else if (roleType === 'user' && data.user.role === 'venue') {
        throw new Error('GirdiÄŸiniz hesap bir mekan hesabÄ±. LÃ¼tfen "Mekan" sekmesinden giriÅŸ yapÄ±n.');
      }

      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      useAuthStore.getState().setUser(data.user);
      success();
      
      if (data.user.role === 'venue') {
         router.replace('/(venue-tabs)' as any);
      } else {
        // E-posta doÄŸrulanmamÄ±ÅŸsa doÄŸrulama ekranÄ±na yÃ¶nlendir
        if (!data.user.is_email_verified) {
          router.replace('/verify-email');
        } else if (!data.user.username || !data.user.birth_date) {
          router.replace('/first-time-setup' as any);
        } else {
          router.replace('/(tabs)/' as any);
        }
      }
    } catch (err: any) {
      // Backend'den dÃ¶nen HTTP hatasÄ± veya genel hata mesajÄ±
      let msg = err instanceof Error ? err.message : 'GiriÅŸ baÅŸarÄ±sÄ±z. LÃ¼tfen tekrar deneyin.';
      if (err?.response?.data?.detail) {
        msg = err.response.data.detail;
      }

      if (msg.includes('pending_verification:')) {
        const cleanMsg = msg.replace('pending_verification:', '').trim();
        Alert.alert(t('auth.verification_required_title'), cleanMsg, [
          { text: t('auth.go_to_verify'), onPress: () => router.replace({ pathname: '/verify-email', params: { email: encodeURIComponent(email.trim()) } }) }
        ]);
        return;
      }

      setErrors({ general: msg });
      Alert.alert(t('auth.login_error_title'), msg);
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }, [validateForm, email, password]);

  const handleSocialLogin = useCallback((provider: string) => {
    lightImpact();
    if (provider === 'Apple') signInWithApple();
    else if (provider === 'Google') promptGoogle();
  }, [promptGoogle, signInWithApple]);

  const clearFieldError = useCallback((field: string) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  // --- Arka plan gÃ¶rsel carousel ---
  const [imgIndex, setImgIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      // Mevcut gÃ¶rseli fade-out yap
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Sonraki gÃ¶rsele geÃ§
        setImgIndex((prev) => (prev + 1) % FALLBACK_PLACE_IMAGES.length);
        // Yeni gÃ¶rseli fade-in yap
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, CAROUSEL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      {/* Arka plan gÃ¶rseli carousel â€” crossfade efekti */}
      <View style={StyleSheet.absoluteFill}>
        <Animated.Image
          source={{ uri: FALLBACK_PLACE_IMAGES[imgIndex] }}
          style={[StyleSheet.absoluteFillObject, { opacity: fadeAnim }]}
          resizeMode="cover"
        />
      </View>

      {/* Koyu gradient overlay â€“ metin ve form okunabilir olsun */}
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
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.content} pointerEvents="box-none">
                <View style={styles.topBlock}>
                    {/* Marka & slogan â€“ profesyonel tipografi */}
                    <View style={styles.header}>
                      <Text style={styles.brandTitle}>{t('auth.app_name')}</Text>
                      <Text style={styles.tagline}>
                        {t('auth.app_subtitle')}
                      </Text>
                    </View>

                    {/* Form kartÄ± â€“ koyu cam efekti */}
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity 
                        style={[styles.toggleBtn, roleType === 'user' && styles.toggleBtnActive]}
                        onPress={() => {
                          setRoleType('user');
                          setErrors({});
                          lightImpact();
                        }}
                      >
                       <Text style={[styles.toggleTxt, roleType === 'user' && styles.toggleTxtActive]}>{t('auth.user')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.toggleBtn, roleType === 'venue' && styles.toggleBtnActive]}
                        onPress={() => {
                          setRoleType('venue');
                          setErrors({});
                          lightImpact();
                        }}
                      >
                       <Text style={[styles.toggleTxt, roleType === 'venue' && styles.toggleTxtActive]}>{t('auth.venue')}</Text>
                      </TouchableOpacity>
                    </View>

                    <GlassCard intensity={25} tint="dark" style={styles.card}>
                      <View style={styles.cardInner}>
                        <Input
                          variant="onDark"
                          label={t('auth.email')}
                          placeholder={t('auth.email_placeholder')}
                          value={email}
                          onChangeText={(t) => {
                            setEmail(t);
                            clearFieldError('email');
                          }}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          error={errors.email}
                          containerStyle={styles.inputContainer}
                        />
                        <Input
                          variant="onDark"
                          label={t('auth.password')}
                          placeholder={t('auth.password_placeholder')}
                          value={password}
                          onChangeText={(t) => {
                            setPassword(t);
                            clearFieldError('password');
                          }}
                          secureTextEntry={!showPassword}
                          rightIcon={showPassword ? 'eye.slash' as any : 'eye' as any}
                          onRightIconPress={() => {
                            lightImpact();
                            setShowPassword(!showPassword);
                          }}
                          autoComplete="password"
                          error={errors.password}
                          containerStyle={styles.inputContainer}
                        />

                        {errors.general && (
                          <View style={styles.generalErrorBox}>
                            <IconSymbol name="exclamationmark.triangle" size={16} color="#ff4d4d" />
                            <Text style={styles.generalErrorText}>{errors.general}</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => {
                            lightImpact();
                            router.push('/forgot-password' as any);
                          }}
                          style={styles.forgotWrap}
                        >
                          <Text style={styles.forgotText}>{t('auth.forgot_password')}</Text>
                        </TouchableOpacity>
                        <Button
                          variant="primary"
                          size="large"
                          onPress={handleLogin}
                          loading={formLoading}
                          disabled={formLoading}
                          style={styles.loginButton}
                        >
                          {t('auth.login')}
                        </Button>

                        <View style={styles.divider}>
                          <View style={styles.dividerLine} />
                          <Text style={styles.dividerLabel}>{t('auth.or')}</Text>
                          <View style={styles.dividerLine} />
                        </View>

                        <View style={styles.socialRow}>
                          <TouchableOpacity
                            onPress={() => handleSocialLogin('Google')}
                            style={styles.socialBtnGoogle}
                          >
                            <Text style={styles.socialIconG}>G</Text>
                            <Text style={styles.socialBtnTextGoogle}>{t('auth.google')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleSocialLogin('Apple')}
                            style={styles.socialBtnApple}
                          >
                            <IconSymbol name="apple.logo" size={20} color="#fff" />
                            <Text style={styles.socialBtnTextWhite}>{t('auth.apple')}</Text>
                          </TouchableOpacity>
                        </View>

                        {/* KayÄ±t ol linki â€” Google ve Apple'Ä±n hemen altÄ±nda */}
                        <TouchableOpacity
                          style={styles.registerRow}
                          onPress={() => {
                            Keyboard.dismiss();
                            lightImpact();
                            router.push({ pathname: '/register', params: { roleType } });
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.footerLabel}>{t('auth.no_account')}</Text>
                          <Text style={styles.footerLink}>{t('auth.register')}</Text>
                        </TouchableOpacity>

                      </View>
                    </GlassCard>
                  </View>
                </View>
            </TouchableWithoutFeedback>
          </ScrollView>

        </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  content: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  topBlock: {
    alignSelf: 'stretch',
  },
  backgroundImage: {
    // KullanÄ±lmÄ±yor â€” absoluteFillObject kullanÄ±lÄ±yor
    width: '100%' as any,
    height: '100%' as any,
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
    alignSelf: 'stretch',
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  toggleTxt: {
    color: '#ccc',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  toggleTxtActive: {
    color: '#000',
    fontWeight: '700',
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
  footerStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
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
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    gap: 8,
  },
  generalErrorText: {
    color: '#ff4d4d',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
