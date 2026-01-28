/**
 * Register Screen
 * 
 * Spotify-inspired dark theme registration screen.
 * Clean, minimal, professional design.
 * 
 * @module screens/RegisterScreen
 */

import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { Button, Input, TextButton } from '@/components/ui';
import { createTextStyle } from '@/constants/design';

export default function RegisterScreen() {
  const { colors, spacing, typography } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Ad soyad gereklidir';
    } else if (fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Ad ve soyad girin';
    }

    if (!email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (password.length < 8) {
      newErrors.password = 'Şifre en az 8 karakter olmalıdır';
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual API call
      // const response = await registerAPI({ fullName, email, password });
      // For now, simulate successful registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ email: 'Kayıt başarısız. Lütfen tekrar deneyin.' });
    } finally {
      setLoading(false);
    }
  };

  const titleStyle = createTextStyle('title', colors.text.primary);
  const subtitleStyle = createTextStyle('body', colors.text.secondary);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.content, { paddingHorizontal: spacing.screenPadding }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.logo, { color: colors.text.primary }]}>📍</Text>
              <Text style={[titleStyle, styles.title]}>Hesap Oluştur</Text>
              <Text style={[subtitleStyle, styles.subtitle]}>
                Hemen kayıt ol ve en iyi mekanları keşfet
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Input
                label="Ad Soyad"
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChangeText={(text) => {
                  setFullName(text);
                  if (errors.fullName) {
                    setErrors({ ...errors, fullName: undefined });
                  }
                }}
                autoCapitalize="words"
                error={errors.fullName}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="E-posta"
                placeholder="ornek@email.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({ ...errors, email: undefined });
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Şifre"
                placeholder="En az 8 karakter"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry
                autoComplete="password-new"
                error={errors.password}
                containerStyle={styles.inputContainer}
              />

              <Input
                label="Şifre Tekrar"
                placeholder="Şifreni tekrar gir"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errors.confirmPassword) {
                    setErrors({ ...errors, confirmPassword: undefined });
                  }
                }}
                secureTextEntry
                autoComplete="password-new"
                error={errors.confirmPassword}
                containerStyle={styles.inputContainer}
              />

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
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.surface.border }]} />
              <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>veya</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.surface.border }]} />
            </View>

            {/* Social Login (Optional) */}
            <View style={styles.socialContainer}>
              <Button
                variant="secondary"
                onPress={() => {
                  // TODO: Implement Google OAuth
                  // await signInWithGoogle();
                }}
                style={styles.socialButton}
              >
                Google ile kayıt ol
              </Button>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                Zaten hesabın var mı?{' '}
                <Text
                  style={[styles.footerLink, { color: colors.accent.primary }]}
                  onPress={() => router.back()}
                >
                  Giriş Yap
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  registerButton: {
    marginTop: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 12,
    fontWeight: '500',
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialButton: {
    // Social button styling
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
  footerLink: {
    fontWeight: '700',
  },
});
