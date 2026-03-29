import { router } from 'expo-router';
import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Button, Input } from '@/src/components/ui';
import { lightImpact, success } from '@/src/utils/haptics';
import { useAuthStore } from '@/src/store/useAuthStore';
import { apiPost } from '@/src/utils/apiClient';

const { width, height } = Dimensions.get('window');
const BG_IMAGE = 'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200'; // Sleek dark/moody cafe background

export default function FirstTimeSetupScreen() {
  const { user, setUser } = useAuthStore();
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
    if (!username.trim()) newErrors.username = 'Kullanıcı adı gereklidir';
    else if (username.length < 3) newErrors.username = 'En az 3 karakter olmalıdır';
    else if (/\s/.test(username)) newErrors.username = 'Kullanıcı adı boşluk içeremez';

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
            if (age < 14) {
              newErrors.birthDate = '14 yaşından küçükler uygulamaya kayıt olamaz';
            }
          }
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, birthDate]);

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
      router.replace('/(tabs)');
    } catch (err: any) {
      setErrors({ username: err.message || 'Kullanıcı adınız alınmış olabilir.' });
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
              <View style={styles.contentContainer}>
                
                <View style={styles.header}>
                  <Text style={styles.title}>Hoş Geldiniz!</Text>
                  <Text style={styles.subtitle}>
                    Uygulamayı kullanmaya başlamadan önce, ASEMOS deneyimini size özel kılmak için profilinizi tamamlamamız gerekiyor.
                  </Text>
                </View>

                <View style={styles.card}>
                  <BlurView intensity={45} tint="dark" style={styles.cardInner}>
                    <Input
                      label="Kullanıcı Adı"
                      placeholder="Benzersiz bir isim seçin"
                      value={username}
                      onChangeText={(t) => { setUsername(t); clearFieldError('username'); }}
                      autoCapitalize="none"
                      error={errors.username}
                      containerStyle={styles.inputContainer}
                    />

                    <Input
                      label="Doğum Tarihi"
                      placeholder="GG/AA/YYYY"
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
                          ℹ️ <Text style={{fontWeight: '700'}}>Neden istiyoruz?</Text> Yaşınız, 18+ eşleştirme dinamiklerini sağlamak ve yasal sınırlarımızı (Minimum 14 yaş) korumak için zorunludur.{"\n\n"}
                          Güveliğiniz bizim için önemli; yaşınız diğer kullanıcılara doğrudan gösterilmez. Sadece size uygun deneyimi sunmak için bir kez alınır.
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
                      Büyüye Katıl
                    </Button>
                  </BlurView>
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
