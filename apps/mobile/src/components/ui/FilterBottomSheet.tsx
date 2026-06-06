/**
 * FilterBottomSheet – Konum Seçimi bottom sheet.
 * İl ve İlçe dropdown'ları ile konum bazlı filtreleme.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { IconSymbol } from '@/src/components/ui/icon-symbol';
import { lightImpact } from '@/src/utils/haptics';
import { Button } from "@/src/components/ui/Button";
import { useTranslation } from "react-i18next";

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
  const [internalVisible, setInternalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(800)).current;
  const scrollY = useRef(0);

  useEffect(() => {
    if (visible) {
      setDraft(values);
      scrollY.current = 0;
      setInternalVisible(true);
      translateY.setValue(800);
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 5, speed: 14 }).start();
    }
  }, [visible, values, translateY]);

  const closeWithAnimation = () => {
    Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => {
      setInternalVisible(false);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        scrollY.current <= 0 && gs.dy > 5 && Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderMove: (_, gs) => {
        if (scrollY.current <= 0 && gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > 120 || gs.vy > 0.5) {
          Animated.timing(translateY, { toValue: 800, duration: 220, useNativeDriver: true }).start(() => {
            setInternalVisible(false);
            onClose();
          });
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
    })
  ).current;

  const districtOptions = draft.province ? (DISTRICT_MAP[draft.province] || []) : [];

  const handleApply = () => {
    lightImpact();
    onApply(draft);
    closeWithAnimation();
  };

  const handleClear = () => {
    lightImpact();
    const empty: FilterValues = { province: null, district: null };
    setDraft(empty);
    onApply(empty);
    closeWithAnimation();
  };

  return (
    <Modal visible={internalVisible} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <Pressable style={styles.backdrop} onPress={closeWithAnimation}>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background.primary,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateY }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={() => {}}>
          {/* Handle */}
          <View style={styles.handleRow} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: colors.surface.border }]} />
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: colors.text.primary }]}>Konum Seçimi</Text>
              <Text style={[styles.subtitle, { color: colors.text.tertiary }]}>
                Lütfen il ve ilçe seçiniz.
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.body}
            onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
          >
            {/* İl Seçimi */}
            <DropdownPicker
              label="İL SEÇİMİ"
              value={draft.province}
              options={PROVINCES}
              placeholder="İl seçiniz..."
              onSelect={(v) => {
                setDraft((d) => ({ province: v, district: null }));
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
          <View style={[styles.footer, { paddingBottom: insets.bottom + 8, borderTopColor: colors.surface.border }]}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
              <Text style={[styles.clearText, { color: colors.text.secondary }]}>Temizle</Text>
            </TouchableOpacity>
            <Button style={styles.applyBtn} onPress={handleApply}>
              Uygula
            </Button>
          </View>
          </Pressable>
        </Animated.View>
      </Pressable>
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
  backdrop: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
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
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },
  clearBtn: { padding: 4 },
  clearText: { fontSize: 14, fontWeight: '600' },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  applyBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
