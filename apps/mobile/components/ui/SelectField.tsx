/**
 * SelectField – Kaydırmalı seçim alanı
 *
 * Görsel: yuvarlatılmış kutu, solda ikon, ortada metin/placeholder, sağda chevron.
 * Tıklanınca modal içinde kaydırılabilir liste açılır.
 *
 * @module components/ui/SelectField
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { IconSymbolName } from '@/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';

export interface SelectFieldOption<T = string> {
  value: T;
  label: string;
}

export interface SelectFieldProps<T = string> {
  /** Placeholder veya seçili değerin gösterimi */
  placeholder?: string;
  /** Seçili değer (kontrollü) */
  value: T | null | undefined;
  /** Seçenekler */
  options: SelectFieldOption<T>[];
  /** Seçim değişince */
  onSelect: (value: T) => void;
  /** Sol ikon (SF Symbol adı) */
  icon?: IconSymbolName;
  /** Erişilebilirlik etiketi */
  accessibilityLabel?: string;
}

const BORDER_RADIUS = 12;
const ROW_HEIGHT = 44;

/**
 * Kompakt select alanı: ikon | metin | chevron. Tıklanınca kaydırılabilir liste.
 */
export function SelectField<T = string>({
  placeholder = 'Seçin...',
  value,
  options,
  onSelect,
  icon = 'magnifyingglass',
  accessibilityLabel,
}: SelectFieldProps<T>) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const { height: windowHeight } = useWindowDimensions();

  const selectedOption = value != null ? options.find((o) => o.value === value) : null;
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const open = () => {
    lightImpact();
    setVisible(true);
  };

  const close = () => setVisible(false);

  const handleSelect = (v: T) => {
    lightImpact();
    onSelect(v);
    close();
  };

  return (
    <>
      <TouchableOpacity
        onPress={open}
        activeOpacity={0.8}
        style={[
          styles.row,
          {
            backgroundColor: colors.background.tertiary,
            borderColor: colors.surface.border,
          },
        ]}
        accessibilityLabel={accessibilityLabel || displayText}
        accessibilityRole="button"
      >
        <View style={styles.iconWrap}>
          <IconSymbol name={icon} size={18} color={colors.text.tertiary} />
        </View>
        <Text
          style={[styles.label, { color: selectedOption ? colors.text.primary : colors.text.tertiary }]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <View style={styles.chevronWrap}>
          <IconSymbol name="chevron.down" size={18} color={colors.text.tertiary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.modalOverlay} onPress={close}>
          <Pressable
            style={[
              styles.modalContent,
              {
                backgroundColor: colors.surface.elevated,
                borderColor: colors.surface.border,
                maxHeight: Math.min(windowHeight * 0.5, 320),
              },
            ]}
            onPress={() => {}}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.surface.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text.secondary }]}>
                Seçin
              </Text>
              <TouchableOpacity onPress={close} hitSlop={12} style={styles.closeBtn}>
                <IconSymbol name="xmark" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((opt) => (
                <TouchableOpacity
                  key={String(opt.value)}
                  onPress={() => handleSelect(opt.value)}
                  activeOpacity={0.7}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: opt.value === value ? colors.accent.primary + '18' : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color: opt.value === value ? colors.accent.primary : colors.text.primary,
                        fontWeight: opt.value === value ? '600' : '500',
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.label}
                  </Text>
                  {opt.value === value && (
                    <IconSymbol name="checkmark" size={18} color={colors.accent.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    borderRadius: BORDER_RADIUS,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  iconWrap: {
    marginRight: 10,
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
  chevronWrap: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    maxHeight: 280,
  },
  scrollContent: {
    paddingVertical: 8,
    paddingBottom: 24,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});
