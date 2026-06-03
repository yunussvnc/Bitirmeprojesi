/**
 * Kayıt ekranı – Giriş ekranı ile aynı tasarım
 * Arka planda mekan carousel, koyu overlay, cam kart, onDark inputlar.
 * Kaydırma yok.
 *
 * @module screens/RegisterScreen
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
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
import { useTranslation } from 'react-i18next';
import { lightImpact, success } from '@/src/utils/haptics';
import { registerUser, registerVenue } from '@/src/services/authService';
import { getAuthUserMessage } from '@/src/utils/authErrors';
import { useSocialAuth } from '@/src/hooks/useSocialAuth';
import * as WebBrowser from 'expo-web-browser';

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
  const [passwordFocused, setPasswordFocused] = useState(false);
  const params = useLocalSearchParams();
  // roleType eklendi ("user" veya "venue")
  const [roleType, setRoleType] = useState<'user' | 'venue'>((params.roleType as 'user' | 'venue') || 'user');
  const [venueName, setVenueName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    venueName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const isSubmittingRef = useRef(false);

  const { loading: socialLoading, promptGoogle, signInWithApple } = useSocialAuth(roleType);
  const formLoading = loading || socialLoading;

  const openLegalDoc = useCallback((type: 'terms' | 'privacy') => {
    lightImpact();
    router.push({ pathname: '/settings/legal-document', params: { type } } as never);
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (roleType === 'user') {
      if (!fullName.trim()) newErrors.fullName = t('auth.err_fullname_required');
      else if (fullName.trim().split(/\s+/).filter(Boolean).length < 2) newErrors.fullName = t('auth.err_fullname_two_words');
    } else {
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
  }, [fullName, venueName, email, password, confirmPassword, roleType, t]);

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
        // Venue Registration
        await registerVenue({
          venue_name: venueName.trim(),
          email: formattedEmail,
          password,
        });
        success();
        Alert.alert(
          t('auth.venue_applied_title'),
          t('auth.venue_applied_desc'),
          [{ text: t('common.ok'), onPress: () => router.replace('/login') }]
        );
      }
    } catch (err: unknown) {
      setErrors({ email: getAuthUserMessage(err, t) });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }, [validateForm, fullName, venueName, email, password, roleType, termsAccepted]);

  const handleSocialRegister = useCallback((provider: string) => {
    lightImpact();
    if (provider === 'Apple') signInWithApple();
    else if (provider === 'Google') promptGoogle();
  }, [promptGoogle, signInWithApple]);

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
              <View style={{ flex: 1 }}>
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

                    <BlurView intensity={90} tint="dark" style={styles.card}>
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
                        ) : (
                          <Input
                            variant="onDark"
                            label={t('auth.venue_name')}
                            placeholder={t('auth.venue_name_placeholder')}
                            value={venueName}
                            onChangeText={(t) => { setVenueName(t); clearFieldError('venueName'); }}
                            autoCapitalize="words"
                            error={errors.venueName}
                            containerStyle={styles.inputContainer}
                          />
                        )}
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
                          placeholder={t('auth.password_placeholder')}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            clearFieldError('password');
                            if (confirmPassword && text === confirmPassword) clearFieldError('confirmPassword');
                          }}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          helperText={passwordFocused ? t('auth.password_requirements') : undefined}
                          secureTextEntry
                          autoComplete="off"
                          textContentType="oneTimeCode"
                          error={errors.password}
                          containerStyle={styles.inputContainer}
                        />
                        <Input
                          variant="onDark"
                          label={t('auth.confirm_password')}
                          placeholder={t('auth.confirm_password_placeholder')}
                          value={confirmPassword}
                          onChangeText={(t) => { setConfirmPassword(t); clearFieldError('confirmPassword'); }}
                          secureTextEntry
                          autoComplete="off"
                          textContentType="oneTimeCode"
                          error={errors.confirmPassword}
                          containerStyle={styles.inputContainer}
                        />
                        <TouchableOpacity
                          style={styles.termsContainer}
                          onPress={() => { setTermsAccepted(!termsAccepted); lightImpact(); }}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                            {termsAccepted && <IconSymbol name="checkmark" size={14} color="#000" />}
                          </View>
                          <Text style={styles.termsText}>
                            <Text style={styles.termsLink} onPress={() => openLegalDoc('terms')}>{t('auth.terms')}</Text>
                            {t('auth.and')}
                            <Text style={styles.termsLink} onPress={() => openLegalDoc('privacy')}>{t('auth.privacy')}</Text>
                            {t('auth.read_and_accept')}
                          </Text>
                        </TouchableOpacity>

                        <Button
                          variant="primary"
                          size="large"
                          onPress={handleRegister}
                          loading={formLoading}
                          disabled={formLoading}
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

                    </BlurView>
                  </View>
                </View>
              </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
  },
  topBlock: { flex: 1 },
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
