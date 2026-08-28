/**
 * ChatInput – Keşfet konuşma alanı
 *
 * Kompakt çok satırlı metin + gönder butonu. Öneri listesi altta rahat görünsün diye
 * yükseklik sınırlı (max ~2 satır). LLM entegrasyonu sonrası aynı bileşen kullanılacak.
 *
 * Sesli giriş: Apple SFSpeechRecognizer (cihaz üzerinde, backend gerektirmez).
 * Native modül yoksa (eski build) mikrofon butonu otomatik gizlenir.
 *
 * @module components/ui/ChatInput
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Keyboard,
  TextInput as NativeTextInput,
} from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import Toast from 'react-native-toast-message';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { radius } from '@/src/constants/design';
import { lightImpact } from '@/src/utils/haptics';

// ---------- Safe access to expo-speech-recognition ----------
// Native modül yoksa (eski build) uygulama çökmemeli.
type SpeechRecognitionModule =
  typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule'];

const SpeechModule =
  requireOptionalNativeModule<SpeechRecognitionModule>('ExpoSpeechRecognition');
const speechAvailable = SpeechModule !== null;

const MIN_HEIGHT = 64;
const MAX_HEIGHT = 140;
const INPUT_PADDING_V = 14;
const INPUT_PADDING_H = 18;

export interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  loading?: boolean;
  onStop?: () => void;
  containerStyle?: ViewStyle;
  editable?: boolean;
}

/**
 * Kompakt chat input: metin alanı + gönder/duraklat butonu.
 * Öneri listesi altta görünsün diye yükseklik küçük tutulur.
 */
export function ChatInput({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Bugün nasıl bir yere gidelim?',
  loading = false,
  onStop,
  containerStyle,
  editable = true,
}: ChatInputProps) {
  const { colors } = useTheme();

  const inputRef = useRef<NativeTextInput>(null);
  const onChangeTextRef = useRef(onChangeText);
  onChangeTextRef.current = onChangeText;
  const [isListening, setIsListening] = useState(false);

  // ---------- Speech Recognition Events ----------

  useEffect(() => {
    if (!SpeechModule) return;

    const subscriptions = [
      SpeechModule.addListener('start', () => {
        setIsListening(true);
      }),
      SpeechModule.addListener('end', () => {
        setIsListening(false);
      }),
      SpeechModule.addListener('result', (ev) => {
        if (ev.results && ev.results.length > 0) {
          const transcript = ev.results[0]?.transcript ?? '';
          if (transcript) {
            onChangeTextRef.current(transcript);
          }
        }
      }),
      SpeechModule.addListener('error', (ev) => {
        console.error('[SpeechRecognition] Error:', ev.error, ev.message);
        setIsListening(false);
        Toast.show({
          type: 'error',
          text1: 'Ses tanıma hatası',
          text2: ev.message || 'Lütfen tekrar deneyin.',
          position: 'top',
          topOffset: 60,
        });
      }),
    ];

    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  // ---------- Start / Stop ----------

  const startListening = useCallback(async () => {
    if (!speechAvailable || !SpeechModule) return;
    try {
      const result = await SpeechModule.requestPermissionsAsync();
      if (!result.granted) {
        Toast.show({
          type: 'error',
          text1: 'İzin gerekli',
          text2: 'Mikrofon ve konuşma tanıma izni verilmedi.',
          position: 'top',
          topOffset: 60,
        });
        return;
      }

      lightImpact();

      SpeechModule.start({
        lang: 'tr-TR',
        interimResults: true,
        continuous: true,
      });

      Toast.show({
        type: 'info',
        text1: '🎙️ Dinliyorum...',
        text2: 'Konuşmanız bittiğinde butona tekrar basın.',
        position: 'top',
        topOffset: 60,
      });
    } catch (err) {
      console.error('[SpeechRecognition] Start error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!speechAvailable || !SpeechModule) return;
    try {
      SpeechModule.stop();
      lightImpact();
      Toast.hide();
    } catch (err) {
      console.error('[SpeechRecognition] Stop error:', err);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // ---------- Submit ----------

  const handleSubmit = () => {
    Keyboard.dismiss();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    lightImpact();
    onSubmit();
  };

  const handleStop = () => {
    lightImpact();
    onStop?.();
  };

  const canSubmit = value.trim().length > 0 && !loading;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.background.tertiary,
          borderColor: colors.surface.border,
        },
        containerStyle,
      ]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        multiline
        maxLength={500}
        editable={editable}
        onSubmitEditing={handleSubmit}
        blurOnSubmit={false}
        returnKeyLabel="Gönder"
        returnKeyType="send"
        style={[
          styles.input,
          {
            color: colors.text.primary,
            minHeight: MIN_HEIGHT - INPUT_PADDING_V * 2,
            maxHeight: MAX_HEIGHT - INPUT_PADDING_V * 2,
          },
        ]}
      />

      <View style={styles.rightActions}>
        {/* Mikrofon butonu: sadece native modül varsa göster */}
        {speechAvailable && !value.trim() && !loading && (
          <TouchableOpacity
            onPress={toggleListening}
            activeOpacity={0.7}
            style={[
              styles.micButton,
              isListening ? { backgroundColor: colors.accent.primary } : null,
            ]}
          >
            <IconSymbol
              name={isListening ? 'stop.fill' : 'mic.fill'}
              size={20}
              color={isListening ? colors.accent.onPrimary : colors.text.secondary}
            />
          </TouchableOpacity>
        )}

        {loading ? (
          <TouchableOpacity
            onPress={handleStop}
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[styles.stopIcon, { backgroundColor: colors.text.primary }]}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[
              styles.actionBtn,
              {
                backgroundColor: canSubmit
                  ? colors.accent.primary
                  : colors.surface.elevated,
                borderColor: canSubmit
                  ? colors.accent.primary
                  : colors.surface.border,
                opacity: canSubmit ? 1 : 0.7,
              },
            ]}
            activeOpacity={0.8}
          >
            <IconSymbol
              name="paperplane.fill"
              size={18}
              color={canSubmit ? colors.accent.onPrimary : colors.text.tertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingLeft: INPUT_PADDING_H,
    paddingRight: 8,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT + 16,
  },
  input: {
    flex: 1,
    paddingVertical: INPUT_PADDING_V,
    paddingRight: 12,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  micButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
