import { router } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Button, Input } from '@/src/components/ui';
import { lightImpact, success } from '@/src/utils/haptics';
import { useAuthStore } from '@/src/store/useAuthStore';
import { apiPost } from '@/src/utils/apiClient';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const BG_IMAGE = 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200'; // Sleek dark/moody cafe background

export default function FirstTimeSetupScreen() {
  const setUser = useAuthStore((state) => state.setUser);
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; birthDate?: string }>({});
  const [showBirthDateInfo, setShowBirthDateInfo] = useState(false);
  const isSubmittingRef = useRef(false);

  const clearFieldError = useCallback((field: keyof typeof errors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: typeof errors = {};
    if (!username.trim()) newErrors.username = t("first_time_setup.err_req_username");
    else if (username.length < 3) newErrors.username = t("first_time_setup.err_min_char");
    else if (/\s/.test(username)) newErrors.username = t("first_time_setup.err_no_space");

    if (!birthDate.trim()) newErrors.birthDate = t("first_time_setup.err_req_bd");
    else {
      const parts = birthDate.split('/');
      if (parts.length !== 3 || parts[0].length !== 2 || parts[1].length !== 2 || parts[2].length !== 4) {
        newErrors.birthDate = t("first_time_setup.err_format_bd");
      } else {
        const day = parseInt(parts[0]), month = parseInt(parts[1]), year = parseInt(parts[2]);
        const d = new Date(year, month - 1, day);
        if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month - 1) {
          newErrors.birthDate = t("first_time_setup.err_invalid_date");
        } else {
          const today = new Date();
          if (d > today) {
            newErrors.birthDate = t("first_time_setup.err_future_date");
          } else {
            let age = today.getFullYear() - d.getFullYear();
            const m = today.getMonth() - d.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
            if (age < 14) {
              newErrors.birthDate = t("first_time_setup.err_under_14");
            }
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, birthDate, t]);

  const handleSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    if (!validateForm()) return;
    isSubmittingRef.current = true;
    lightImpact();
    setLoading(true);

    try {
      const bdParts = birthDate.split('/');
      const birth_date_api = `${bdParts[2]}-${bdParts[1]}-${bdParts[0]}`;
      
      const updatedUser = await apiPost<any>('/auth/first-time-setup', {
        username: username.trim(),
        birth_date: birth_date_api,
      });

      setUser(updatedUser);
      success();
      router.replace('/(tabs)/' as any);
    } catch (err: any) {
      setErrors({ username: err.message || 'Error' });
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  }, [validateForm, username, birthDate, setUser]);

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Image source={{ uri: BG_IMAGE }} style={styles.backgroundImage} resizeMode="cover" />
      </View>

      <LinearGradient
        colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
        locations={[0, 0.4, 0.9]}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAwareScrollView
          style={styles.keyboardView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bottomOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.contentContainer}>
                
                <View style={styles.header}>
                  <Text style={styles.title}>{t("first_time_setup.title")}</Text>
                  <Text style={styles.subtitle}>
                    {t("first_time_setup.subtitle")}
                  </Text>
                </View>

                <View style={styles.card}>
                  <BlurView intensity={45} tint="dark" style={styles.cardInner}>
                    <Input
                      variant="onDark"
                      label={t("first_time_setup.username_label")}
                      placeholder={t("first_time_setup.username_ph")}
                      value={username}
                      onChangeText={(val) => { setUsername(val); clearFieldError('username'); }}
                      autoCapitalize="none"
                      error={errors.username}
                      containerStyle={styles.inputContainer}
                    />

                    <Input
                      variant="onDark"
                      label={t("first_time_setup.birth_date_label")}
                      placeholder={t("first_time_setup.birth_date_ph")}
                      value={birthDate}
                      onFocus={() => setShowBirthDateInfo(true)}
                      onBlur={() => setShowBirthDateInfo(false)}
                      onChangeText={(t: string) => {
                        let cleaned = t.replace(/[^0-9/]/g, '');
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
                      <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                          ℹ️ <Text style={{fontWeight: '700'}}>{t("first_time_setup.why_ask_title")}</Text> {t("first_time_setup.why_ask_desc")}
                        </Text>
                      </View>
                    )}

                    <Button
                      variant="primary"
                      size="large"
                      onPress={handleSubmit}
                      loading={loading}
                      disabled={loading}
                      style={styles.submitButton}
                    >
                      {t("first_time_setup.submit")}
                    </Button>
                  </BlurView>
                </View>

              </View>
            </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  backgroundImage: { width, height },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingBottom: 40 },
  contentContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 20 },
  header: { marginBottom: 30, alignItems: 'center' },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1.2,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  cardInner: {
    padding: 26,
    paddingTop: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  inputContainer: { marginBottom: 20 },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
    marginTop: -4,
  },
  infoText: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  submitButton: { 
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
});
