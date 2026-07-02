/**
 * FilterBottomSheet – Konum Seçimi bottom sheet.
 * İl ve İlçe dropdown'ları ile konum bazlı filtreleme.
 * 
 * Modal tabanlı — her yerde güvenilir çalışır.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import { Button } from "@/src/components/ui/Button";
import { useTranslation } from "react-i18next";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.42;

/* ── Types ── */

export interface FilterValues {
  province: string | null;
  district: string | null;
}

export interface FilterBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  values: FilterValues;
  onApply: (v: FilterValues) => void;
}

/* ── Data ── */

const PROVINCES = ["İstanbul"];

const ISTANBUL_DISTRICTS = [
  "Adalar", "Arnavutköy", "Ataşehir", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy",
  "Başakşehir", "Bayrampaşa", "Beşiktaş", "Beykoz", "Beylikdüzü", "Beyoğlu", "Büyükçekmece",
  "Çatalca", "Çekmeköy", "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa",
  "Güngören", "Kadıköy", "Kağıthane", "Kartal", "Küçükçekmece", "Maltepe", "Pendik",
  "Sancaktepe", "Sarıyer", "Silivri", "Sultanbeyli", "Sultangazi", "Şile", "Şişli",
  "Tuzla", "Ümraniye", "Üsküdar", "Zeytinburnu",
];

const DISTRICT_MAP: Record<string, string[]> = {
  "İstanbul": ISTANBUL_DISTRICTS,
};

/* ── Dropdown Picker ── */

function DropdownPicker({
  label,
  value,
  options,
  onSelect,
  disabled,
  placeholder,
}: {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (v: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const display = value || placeholder || label;

  return (
    <>
      <Text style={[dpStyles.label, { color: colors.text.tertiary }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          if (!disabled) {
            lightImpact();
            setOpen(true);
          }
        }}
        activeOpacity={disabled ? 1 : 0.7}
        style={[
          dpStyles.selector,
          {
            backgroundColor: disabled
              ? colors.background.tertiary + '60'
              : value
              ? colors.accent.primary + '12'
              : colors.background.tertiary,
            borderColor: disabled
              ? colors.surface.border + '60'
              : value
              ? colors.accent.primary + '30'
              : colors.surface.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Text
          style={[
            dpStyles.selectorText,
            {
              color: disabled
                ? colors.text.tertiary
                : value
                ? colors.text.primary
                : colors.text.secondary,
            },
          ]}
          numberOfLines={1}
        >
          {display}
        </Text>
        <IconSymbol
          name="chevron.down"
          size={16}
          color={disabled ? colors.text.tertiary + '60' : value ? colors.accent.primary : colors.text.tertiary}
        />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={dpStyles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={[dpStyles.sheet, { backgroundColor: colors.surface.elevated }]} onPress={() => {}}>
            <View style={[dpStyles.sheetHeader, { borderBottomColor: colors.surface.border }]}>
              <Text style={[dpStyles.sheetTitle, { color: colors.text.primary }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12}>
                <IconSymbol name="xmark" size={18} color={colors.text.tertiary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={dpStyles.scroll} showsVerticalScrollIndicator>
              {/* Tümü seçeneği */}
              <TouchableOpacity
                onPress={() => { lightImpact(); onSelect(null); setOpen(false); }}
                style={[dpStyles.option, !value && { backgroundColor: colors.accent.primary + '14' }]}
              >
                <Text style={[dpStyles.optText, { color: !value ? colors.accent.primary : colors.text.primary }]}>Tümü</Text>
                {!value && <IconSymbol name="checkmark" size={16} color={colors.accent.primary} />}
              </TouchableOpacity>
              {options.map((o) => (
                <TouchableOpacity
                  key={o}
                  onPress={() => { lightImpact(); onSelect(o); setOpen(false); }}
                  style={[dpStyles.option, o === value && { backgroundColor: colors.accent.primary + '14' }]}
                >
                  <Text
                    style={[
                      dpStyles.optText,
                      {
                        color: o === value ? colors.accent.primary : colors.text.primary,
                        fontWeight: o === value ? '600' : '400',
                      },
                    ]}
                  >
                    {o}
                  </Text>
                  {o === value && <IconSymbol name="checkmark" size={16} color={colors.accent.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const dpStyles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 8,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectorText: { fontSize: 15, fontWeight: '500', flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: 420,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: { fontSize: 15, fontWeight: '600' },
  scroll: { maxHeight: 360 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  optText: { fontSize: 15 },
});

/* ── Main Component ── */

export function FilterBottomSheet({
  visible,
  onClose,
  values,
  onApply,
}: FilterBottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [draft, setDraft] = useState<FilterValues>(values);
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDraft(values);
      setModalVisible(true);
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, values, slideAnim]);

  const handleClose = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      onClose();
    });
  }, [slideAnim, onClose]);

  // Aşağı çekme ile kapatma
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) {
          // Sadece aşağı çekmeyi izle
          slideAnim.setValue(1 - g.dy / SHEET_HEIGHT);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          // Yeterince çektiyse kapat
          handleClose();
        } else {
          // Geri aç
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
          }).start();
        }
      },
    })
  ).current;

  const districtOptions = draft.province ? (DISTRICT_MAP[draft.province] || []) : [];

  const handleApply = () => {
    lightImpact();
    onApply(draft);
    handleClose();
  };

  const handleClear = () => {
    lightImpact();
    const empty: FilterValues = { province: null, district: null };
    setDraft(empty);
    onApply(empty);
    handleClose();
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SHEET_HEIGHT, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', opacity: backdropOpacity }]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            height: SHEET_HEIGHT,
            backgroundColor: colors.background.primary,
            transform: [{ translateY }],
            paddingBottom: insets.bottom || 24,
          },
        ]}
      >
        {/* Handle — aşağı çekince kapatır */}
        <View style={styles.handleRow} {...panResponder.panHandlers}>
          <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
        </View>

        {/* Header */}
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.text.primary }]}>Konum Seçimi</Text>
            <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
              Lütfen il ve ilçe seçiniz.
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} hitSlop={12} activeOpacity={0.7}>
            <IconSymbol name="xmark.circle.fill" size={28} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.body}
        >
          {/* İl Seçimi */}
          <DropdownPicker
            label="İL SEÇİMİ"
            value={draft.province}
            options={PROVINCES}
            placeholder="İl seçiniz..."
            onSelect={(v) => {
              setDraft(() => ({ province: v, district: null }));
            }}
          />

          {/* İlçe Seçimi */}
          <DropdownPicker
            label="İLÇE SEÇİMİ"
            value={draft.district}
            options={districtOptions}
            placeholder="Önce il seçiniz..."
            disabled={!draft.province}
            onSelect={(v) => {
              setDraft((d) => ({ ...d, district: v }));
            }}
          />
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.surface.border }]}>
          <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
            <Text style={[styles.clearText, { color: colors.text.secondary }]}>Temizle</Text>
          </TouchableOpacity>
          <Button style={styles.applyBtn} onPress={handleApply}>
            Uygula
          </Button>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ── Summary helpers (used by parent) ── */

export function getFilterSummaryChips(v: FilterValues, max = 3): { chips: string[]; extra: number } {
  const all: string[] = [];
  if (v.province) all.push(v.province);
  if (v.district) all.push(v.district);
  return { chips: all.slice(0, max), extra: Math.max(0, all.length - max) };
}

export function countActiveFilters(v: FilterValues): number {
  return [v.province, v.district].filter(Boolean).length;
}

/* ── Styles ── */

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, fontWeight: '600' },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  applyBtn: {
    flex: 1,
    marginLeft: 16,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
