import { showError, showSuccess } from "@/src/utils/toast";
/**
 * Kayıt ekranı – Giriş ekranı ile aynı tasarım
 * Arka planda mekan carousel, koyu overlay, cam kart, onDark inputlar.
 * Kaydırma yok.
 *
 * @module screens/RegisterScreen
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Platform,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input } from '@/src/components/ui';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { handleApiError } from '@/src/utils/errorHandler';
import { useTranslation } from 'react-i18next';
import { lightImpact, success } from '@/src/utils/haptics';
import { getAllPlaces } from '@/src/services/mekanService';
import { registerUser, registerVenue, googleLogin, appleLogin } from '@/src/services/authService';
import { useAuthStore } from '@/src/store/useAuthStore';
import { API_BASE_URL } from '@/src/constants/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { LegalModal } from '@/src/components/ui/LegalModal';
import { googleAuthRequestConfig } from '@/src/config/socialAuth';
import { validatePassword } from '@/src/utils/validators';
import { CustomAlert as Alert } from '@/src/components/ui/CustomAlert';

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
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'terms' | 'privacy' | null>(null);
  const params = useLocalSearchParams();
  const [roleType, setRoleType] = useState<'user' | 'venue'>((params.roleType as 'user' | 'venue') || 'user');
  const [venueName, setVenueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    venueName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    claimedPlace?: string;
  }>({});
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{ score: number; strength: 'weak' | 'medium' | 'strong' } | null>(null);
  const isSubmittingRef = useRef(false);

  // --- Venue 2-adım akışı ---
  // venueStep: 'place-search' (1. adım) | 'account' (2. adım)
  const [venueStep, setVenueStep] = useState<'place-search' | 'account'>('place-search');
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeSearchResults, setPlaceSearchResults] = useState<Array<{id: number; name: string; address: string; category: string}>>([]);
  const [selectedPlace, setSelectedPlace] = useState<{id: number; name: string; address: string} | null>(null);
  const [placeSearchLoading, setPlaceSearchLoading] = useState(false);
  const placeSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Google Auth Setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    ...googleAuthRequestConfig,
    scopes: [...googleAuthRequestConfig.scopes],
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
      
      // Check role mismatch purely for UX
      if (roleType === 'venue' && data.user.role !== 'venue') {
        throw new Error('Mekan kayıtları sosyal medya ile yapılamaz. Lütfen başvuru formunu doldurun.');
      } else if (roleType === 'user' && data.user.role === 'venue') {
        throw new Error('Girdiğiniz hesap bir mekan hesabı. Lütfen "Mekan" sekmesinden giriş yapın.');
      }

      useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
      useAuthStore.getState().setUser(data.user);
      success();

      if (data.user.role === 'venue') {
         router.replace('/(venue-tabs)' as any);
      } else {
        if (!data.user.username || !data.user.birth_date) {
          router.replace('/first-time-setup' as any);
        } else {
          router.replace('/(tabs)/' as any);
        }
      }
    } catch (err: any) {
      Alert.alert(t('auth.login_error_title'), err.message || t('auth.google_login_failed'));
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

        // Check role mismatch purely for UX
        if (roleType === 'venue' && data.user.role !== 'venue') {
          throw new Error('Mekan kayıtları sosyal medya ile yapılamaz. Lütfen başvuru formunu doldurun.');
        } else if (roleType === 'user' && data.user.role === 'venue') {
          throw new Error('Girdiğiniz hesap bir mekan hesabı. Lütfen "Mekan" sekmesinden giriş yapın.');
        }

        useAuthStore.getState().setTokens(data.access_token, data.refresh_token);
        useAuthStore.getState().setUser(data.user);
        success();

        if (data.user.role === 'venue') {
           router.replace('/(venue-tabs)' as any);
        } else {
          if (!data.user.username || !data.user.birth_date) {
            router.replace('/first-time-setup' as any);
          } else {
            router.replace('/(tabs)/' as any);
          }
        }
      }
    } catch (e: any) {
      if (e.code === 'ERR_REQUEST_CANCELED') {
        // Kullanıcı iptal etti
      } else {
        Alert.alert(t('auth.login_error_title'), e.message || t('auth.apple_login_failed'));
      }
    } finally {
      setLoading(false);
    }
  };



  // Mekan arama — debounced
  const searchPlaces = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setPlaceSearchResults([]); return; }
    setPlaceSearchLoading(true);
    try {
      const { apiGet } = await import('@/src/utils/apiClient');
      const res = await apiGet<any>(`/places/search?q=${encodeURIComponent(q.trim())}&page_size=10`, { skipAuth: true } as any);
      const items = res?.items ?? res ?? [];
      setPlaceSearchResults(items.map((p: any) => ({ id: p.id, name: p.name, address: p.address, category: p.category })));
    } catch { setPlaceSearchResults([]); }
    finally { setPlaceSearchLoading(false); }
  }, []);

  const handlePlaceQueryChange = useCallback((q: string) => {
    setPlaceSearchQuery(q);
    if (placeSearchTimeout.current) clearTimeout(placeSearchTimeout.current);
    placeSearchTimeout.current = setTimeout(() => searchPlaces(q), 400);
  }, [searchPlaces]);

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (roleType === 'user') {
      if (!fullName.trim()) newErrors.fullName = t('auth.err_fullname_required');
      else if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) newErrors.fullName = t('auth.err_fullname_two_words');
    } else {
      if (!selectedPlace) newErrors.claimedPlace = 'Lütfen mekanınızı listeden seçin.';
      if (!venueName.trim()) newErrors.venueName = t('auth.err_venue_name_required');
    }

    if (!email.trim()) newErrors.email = t('auth.err_email_required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = t('auth.err_email_invalid');
    
    if (!password.trim()) newErrors.password = t('auth.err_password_required');
    else if (password.length < 8) newErrors.password = t('auth.err_password_short_8');
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*([^\w\s]|_))/.test(password)) {
      newErrors.password = t('auth.err_password_weak');
    }
    
    if (!confirmPassword.trim()) newErrors.confirmPassword = t('auth.err_confirm_required');
    else if (password !== confirmPassword) newErrors.confirmPassword = t('auth.err_passwords_mismatch');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fullName, venueName, email, password, confirmPassword, roleType, selectedPlace, t]);

  const handleRegister = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!validateForm()) return;
    
    if (!termsAccepted) {
      Alert.alert(t('auth.terms_required_title'), t('auth.terms_required_body'), [{ text: t('explore.ok') }]);
      return;
    }
    
    isSubmittingRef.current = true;
    lightImpact();
    setLoading(true);
    try {
      const formattedEmail = email.trim().toLowerCase();

      if (roleType === 'user') {
        const nameParts = fullName.trim().split(' ');
        const first_name = nameParts[0];
        const last_name = nameParts.slice(1).join(' ') || undefined;
        await registerUser({
          email: formattedEmail,
          password,
          first_name,
          last_name,
        });
        success();
        router.replace({ pathname: '/verify-email', params: { email: encodeURIComponent(formattedEmail) } });
      } else {
        // Venue Registration — claimed_place_id zorunlu
        if (!selectedPlace) {
          setErrors({ claimedPlace: 'Lütfen mekanınızı seçin.' });
          return;
        }
        await registerVenue({
          venue_name: venueName.trim() || selectedPlace.name,
          email: formattedEmail,
          password,
          claimed_place_id: selectedPlace.id,
        });
        success();
        Alert.alert(
          t('auth.venue_applied_title'),
          `"${selectedPlace.name}" mekanı için başvurunuz alındı. Admin onayından sonra giriş yapabilirsiniz.`,
          [{ text: t('common.ok'), onPress: () => router.replace('/login') }]
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Kayıt başarısız. Lütfen tekrar deneyin.';
      setErrors({ email: msg });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }, [validateForm, fullName, venueName, email, password, roleType, termsAccepted]);

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
        <Image source={{ uri: currentImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.4, 0.85]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <KeyboardAwareScrollView
          style={styles.keyboardView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <View style={styles.content} pointerEvents="box-none">
              <View style={styles.topBlock}>
                    {/* Marka başlığı — login ekranıyla aynı konum ve boyut */}
                    <View style={styles.header}>
                      <Text style={styles.brandTitle}>{t('auth.app_name')}</Text>
                    </View>

                    {/* Toggle Buttons (Kullanıcı / Mekan) */}
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

                    <View style={styles.card}>
                      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFillObject} />
                      <View style={styles.cardInner}>
                        {roleType === 'user' ? (
                          <Input
                            variant="onDark"
                            label={t('auth.full_name')}
                            placeholder={t('auth.full_name_placeholder')}
                            value={fullName}
                            onChangeText={(t) => { setFullName(t); clearFieldError('fullName'); }}
                            autoCapitalize="words"
                            error={errors.fullName}
                            containerStyle={styles.inputContainer}
                          />
                        ) : venueStep === 'place-search' ? (
                          /* ── 1. ADIM: Mekan Ara & Seç ── */
                          <View>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>
                              Sistemimizde kayıtlı mekanınızı arayın ve seçin.
                            </Text>
                            <Input
                              variant="onDark"
                              label="Mekan Ara"
                              placeholder="Mekan adı veya adres..."
                              value={placeSearchQuery}
                              onChangeText={handlePlaceQueryChange}
                              autoCapitalize="words"
                              containerStyle={styles.inputContainer}
                            />
                            {errors.claimedPlace ? (
                              <Text style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 8 }}>{errors.claimedPlace}</Text>
                            ) : null}
                            {placeSearchLoading && (
                              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>Aranıyor...</Text>
                            )}
                            {placeSearchResults.length > 0 && (
                              <View style={{ marginBottom: 8 }}>
                                {placeSearchResults.map((place) => (
                                  <TouchableOpacity
                                    key={place.id}
                                    onPress={() => {
                                      setSelectedPlace(place);
                                      setVenueName(place.name);
                                      setPlaceSearchResults([]);
                                      setVenueStep('account');
                                      setErrors({});
                                      lightImpact();
                                    }}
                                    style={{
                                      backgroundColor: 'rgba(255,255,255,0.08)',
                                      borderRadius: 10,
                                      padding: 12,
                                      marginBottom: 6,
                                      borderWidth: 1,
                                      borderColor: 'rgba(255,255,255,0.12)',
                                    }}
                                  >
                                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{place.name}</Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 }}>{place.address} · {place.category}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                            {placeSearchQuery.length >= 2 && !placeSearchLoading && placeSearchResults.length === 0 && (
                              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>
                                Mekan bulunamadı. Farklı bir arama deneyin.
                              </Text>
                            )}
                          </View>
                        ) : (
                          /* ── 2. ADIM: Hesap Bilgileri — seçilen mekan göster ── */
                          <View>
                            {/* Seçilen mekan kartı */}
                            <TouchableOpacity
                              onPress={() => { setVenueStep('place-search'); setSelectedPlace(null); setErrors({}); }}
                              style={{
                                backgroundColor: 'rgba(99,211,135,0.15)',
                                borderRadius: 10,
                                padding: 12,
                                marginBottom: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(99,211,135,0.4)',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: '#63d387', fontWeight: '700', fontSize: 13 }}>✓ Seçilen Mekan</Text>
                                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14, marginTop: 2 }}>{selectedPlace?.name}</Text>
                                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{selectedPlace?.address}</Text>
                              </View>
                              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Değiştir</Text>
                            </TouchableOpacity>
                            <Input
                              variant="onDark"
                              label={t('auth.email')}
                              placeholder={t('auth.email_placeholder')}
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
                              label={t('auth.password')}
                              placeholder={t('auth.password_hint')}
                              value={password}
                              onChangeText={(t) => { setPassword(t); clearFieldError('password'); const r = validatePassword(t); setPasswordStrength(t ? { score: r.score, strength: r.strength } : null); }}
                              onFocus={() => setIsPasswordFocused(true)}
                              onBlur={() => setIsPasswordFocused(false)}
                              secureTextEntry={!showPassword}
                              rightIcon={showPassword ? 'eye.slash' as any : 'eye' as any}
                              onRightIconPress={() => { lightImpact(); setShowPassword(!showPassword); }}
                              autoComplete="off"
                              textContentType="oneTimeCode"
                              error={errors.password}
                              containerStyle={isPasswordFocused && !errors.password ? { marginBottom: 4 } : styles.inputContainer}
                            />
                            {/* Şifre Güç Göstergesi */}
                            {password.length > 0 && passwordStrength && (
                              <View style={styles.strengthContainer}>
                                <View style={styles.strengthBar}>
                                  {[0,1,2,3].map(i => (
                                    <View
                                      key={i}
                                      style={[
                                        styles.strengthSegment,
                                        {
                                          backgroundColor: i < passwordStrength.score
                                            ? passwordStrength.strength === 'strong' ? '#4ECDC4'
                                              : passwordStrength.strength === 'medium' ? '#FF9500'
                                              : '#FF6B6B'
                                            : 'rgba(255,255,255,0.2)'
                                        }
                                      ]}
                                    />
                                  ))}
                                </View>
                                <Text style={[
                                  styles.strengthLabel,
                                  { color: passwordStrength.strength === 'strong' ? '#4ECDC4' : passwordStrength.strength === 'medium' ? '#FF9500' : '#FF6B6B' }
                                ]}>
                                  {passwordStrength.strength === 'strong' ? 'Çok Güçlü ✓' : passwordStrength.strength === 'medium' ? 'Orta' : 'Zayıf'}
                                </Text>
                              </View>
                            )}
                            {isPasswordFocused && !errors.password && (
                              <Text style={styles.passwordRulesText}>{t('auth.password_rules')}</Text>
                            )}
                            <Input
                              variant="onDark"
                              label={t('auth.confirm_password')}
                              placeholder={t('auth.confirm_password_placeholder')}
                              value={confirmPassword}
                              onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                              secureTextEntry={!showConfirmPassword}
                              rightIcon={showConfirmPassword ? 'eye.slash' as any : 'eye' as any}
                              onRightIconPress={() => { lightImpact(); setShowConfirmPassword(!showConfirmPassword); }}
                              autoComplete="off"
                              textContentType="oneTimeCode"
                              error={errors.confirmPassword}
                              containerStyle={styles.inputContainer}
                            />
                          </View>
                        )}

                        {/* Kullanıcı modunda email/şifre alanları — her zaman göster */}
                        {roleType === 'user' && (
                          <>
                            <Input
                              variant="onDark"
                              label={t('auth.email')}
                              placeholder={t('auth.email_placeholder')}
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
                              label={t('auth.password')}
                              placeholder={t('auth.password_hint')}
                              value={password}
                              onChangeText={(t) => { setPassword(t); clearFieldError('password'); const r = validatePassword(t); setPasswordStrength(t ? { score: r.score, strength: r.strength } : null); }}
                              onFocus={() => setIsPasswordFocused(true)}
                              onBlur={() => setIsPasswordFocused(false)}
                              secureTextEntry={!showPassword}
                              rightIcon={showPassword ? 'eye.slash' as any : 'eye' as any}
                              onRightIconPress={() => { lightImpact(); setShowPassword(!showPassword); }}
                              autoComplete="off"
                              textContentType="oneTimeCode"
                              error={errors.password}
                              containerStyle={isPasswordFocused && !errors.password ? { marginBottom: 4 } : styles.inputContainer}
                            />
                            {/* Şifre Güç Göstergesi */}
                            {password.length > 0 && passwordStrength && (
                              <View style={styles.strengthContainer}>
                                <View style={styles.strengthBar}>
                                  {[0,1,2,3].map(i => (
                                    <View
                                      key={i}
                                      style={[
                                        styles.strengthSegment,
                                        {
                                          backgroundColor: i < passwordStrength.score
                                            ? passwordStrength.strength === 'strong' ? '#4ECDC4'
                                              : passwordStrength.strength === 'medium' ? '#FF9500'
                                              : '#FF6B6B'
                                            : 'rgba(255,255,255,0.2)'
                                        }
                                      ]}
                                    />
                                  ))}
                                </View>
                                <Text style={[
                                  styles.strengthLabel,
                                  { color: passwordStrength.strength === 'strong' ? '#4ECDC4' : passwordStrength.strength === 'medium' ? '#FF9500' : '#FF6B6B' }
                                ]}>
                                  {passwordStrength.strength === 'strong' ? 'Çok Güçlü ✓' : passwordStrength.strength === 'medium' ? 'Orta' : 'Zayıf'}
                                </Text>
                              </View>
                            )}
                            {isPasswordFocused && !errors.password && (
                              <Text style={styles.passwordRulesText}>{t('auth.password_rules')}</Text>
                            )}
                            <Input
                              variant="onDark"
                              label={t('auth.confirm_password')}
                              placeholder={t('auth.confirm_password_placeholder')}
                              value={confirmPassword}
                              onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                              secureTextEntry={!showConfirmPassword}
                              rightIcon={showConfirmPassword ? 'eye.slash' as any : 'eye' as any}
                              onRightIconPress={() => { lightImpact(); setShowConfirmPassword(!showConfirmPassword); }}
                              autoComplete="off"
                              textContentType="oneTimeCode"
                              error={errors.confirmPassword}
                              containerStyle={styles.inputContainer}
                            />
                          </>
                        )}


                        <TouchableOpacity
                          style={styles.termsContainer}
                          onPress={() => { setTermsAccepted(!termsAccepted); lightImpact(); }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                            {termsAccepted && <IconSymbol name="checkmark" size={14} color="#000" />}
                          </View>
                          <Text style={styles.termsText}>
                            <Text style={styles.termsLink} onPress={() => setLegalModalType('terms')}>{t('auth.terms')}</Text>{t('auth.and')}
                            <Text style={styles.termsLink} onPress={() => setLegalModalType('privacy')}>{t('auth.privacy')}</Text>{t('auth.read_and_accept')}
                          </Text>
                        </TouchableOpacity>

                        <Button
                          variant="primary"
                          size="large"
                          onPress={handleRegister}
                          loading={loading}
                          disabled={loading}
                          style={styles.registerButton}
                        >
                          {roleType === 'user' ? t('auth.register') : t('auth.send_approval')}
                        </Button>

                        {roleType === 'user' && (
                          <>
                            <View style={styles.divider}>
                              <View style={styles.dividerLine} />
                              <Text style={styles.dividerLabel}>{t('auth.or')}</Text>
                              <View style={styles.dividerLine} />
                            </View>
                            <View style={styles.socialRow}>
                              <TouchableOpacity onPress={() => handleSocialRegister('Google')} style={styles.socialBtnGoogle}>
                                <Text style={styles.socialIconG}>G</Text>
                                <Text style={styles.socialBtnTextGoogle}>{t('auth.google')}</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => handleSocialRegister('Apple')} style={styles.socialBtnApple}>
                                <IconSymbol name="apple.logo" size={20} color="#fff" />
                                <Text style={styles.socialBtnTextWhite}>{t('auth.apple')}</Text>
                              </TouchableOpacity>
                            </View>
                          </>
                        )}

                        {/* Giriş linki — her iki roleType için kart içinde */}
                        <TouchableOpacity
                          style={styles.loginRow}
                          onPress={() => { Keyboard.dismiss(); lightImpact(); router.back(); }}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.footerLabel}>{t('auth.have_account')}</Text>
                          <Text style={styles.footerLink}>{t('auth.login')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
          </KeyboardAwareScrollView>
          <LegalModal 
            visible={legalModalType !== null} 
            type={legalModalType} 
            onClose={() => setLegalModalType(null)} 
          />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 60 },
  content: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  topBlock: {
    alignSelf: 'stretch',
  },
  backgroundImage: { width: '100%' as any, height: '100%' as any },  // kullanılmıyor
  header: {
    alignItems: 'center',
    marginBottom: 36,
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
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  card: {
    alignSelf: 'stretch',
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
  passwordRulesText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: -2,
    marginBottom: 14,
    marginLeft: 4,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: -6,
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
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 4,
    marginBottom: 16,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: '600',
    color: '#fff',
    textDecorationLine: 'underline',
  },
  registerButton: { marginTop: 0 },
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
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 4,
  },
  footerLabel: { fontSize: 16, color: 'rgba(255,255,255,0.9)' },
  footerLink: { fontSize: 16, fontWeight: '700', color: '#ffffff', textDecorationLine: 'underline', letterSpacing: 0.3 },
});
