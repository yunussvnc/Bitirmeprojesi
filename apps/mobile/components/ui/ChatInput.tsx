/**
 * ChatInput – Keşfet konuşma alanı
 *
 * Kompakt çok satırlı metin + gönder butonu. Öneri listesi altta rahat görünsün diye
 * yükseklik sınırlı (max ~2 satır). LLM entegrasyonu sonrası aynı bileşen kullanılacak.
 *
 * @module components/ui/ChatInput
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  Keyboard,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { radius } from '@/constants/design';
import { lightImpact } from '@/src/utils/haptics';

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
      {loading && onStop ? (
        <TouchableOpacity
          onPress={handleStop}
          style={[styles.submitBtn, { backgroundColor: colors.surface.elevated, borderColor: colors.surface.border }]}
          activeOpacity={0.8}
        >
          <View style={[styles.stopIcon, { backgroundColor: colors.text.primary }]} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit}
          style={[
            styles.submitBtn,
            {
              backgroundColor: canSubmit ? colors.accent.primary : colors.surface.elevated,
              borderColor: canSubmit ? colors.accent.primary : colors.surface.border,
              opacity: canSubmit ? 1 : 0.7,
            },
          ]}
          activeOpacity={0.8}
        >
          <IconSymbol
            name="paperplane.fill"
            size={18}
            color={canSubmit ? '#FFFFFF' : colors.text.tertiary}
          />
        </TouchableOpacity>
      )}
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
  submitBtn: {
    width: 40,
    height: 40,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 20,
  },
  stopIcon: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});
