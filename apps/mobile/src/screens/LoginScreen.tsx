/**
 * Login Screen
 * 
 * Spotify-inspired dark theme login screen.
 * Clean, minimal, professional design.
 * 
 * @module screens/LoginScreen
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

export default function LoginScreen() {
  const { colors, spacing, typography } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'E-posta gereklidir';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // TODO: Implement actual API call
      // const response = await loginAPI({ email, password });
      // For now, simulate successful login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.replace('/(tabs)');
    } catch (error) {
      setErrors({ email: 'Giriş başarısız. Lütfen tekrar deneyin.' });
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
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.logo, { color: colors.text.primary }]}>📍</Text>
              <Text style={[titleStyle, styles.title]}>Hoş Geldin</Text>
              <Text style={[subtitleStyle, styles.subtitle]}>
                Devam etmek için giriş yap
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors({ ...errors, password: undefined });
                  }
                }}
                secureTextEntry
                autoComplete="password"
                error={errors.password}
                containerStyle={styles.inputContainer}
              />

              <TouchableOpacity
                onPress={() => {
                  // TODO: Navigate to forgot password screen
                  // router.push('/forgot-password');
                }}
                style={styles.forgotPassword}
              >
                <Text style={[styles.forgotPasswordText, { color: colors.accent.primary }]}>
                  Şifreni mi unuttun?
                </Text>
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
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: colors.surface.border }]} />
              <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>veya</Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.surface.border }]} />
            </View>

            {/* Social Login (Optional - can be removed for minimal design) */}
            <View style={styles.socialContainer}>
              <Button
                variant="secondary"
                onPress={() => {
                  // TODO: Implement Google OAuth
                  // await signInWithGoogle();
                }}
                style={styles.socialButton}
              >
                Google ile devam et
              </Button>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: colors.text.secondary }]}>
                Hesabın yok mu?{' '}
                <Text
                  style={[styles.footerLink, { color: colors.accent.primary }]}
                  onPress={() => router.push('/register')}
                >
                  Kayıt Ol
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
  },
  content: {
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    width: '100%',
    maxWidth: '100%',
    alignItems: 'stretch',
  },
  inputContainer: {
    marginBottom: 20,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    marginTop: -8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
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
